# WO-8.13 — the About modal names two documents and not the licence · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.13-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus**, on the work order's own merits: the deliverable is teacher-facing prose — a section label that has to survive being read aloud, a `TESTING.md` line and a 👤 reading in the suite's voice — and its Traps are judgment rather than mechanics (do not restate the licence, no copyright or version line, do not touch the two rows beside it). The runner-up set aside: the mechanics are Codex-shaped and the two harness runs the Acceptance demands (~9 min) fit the 20-minute cap, but the rubric reads the Claude column first, so this is not a fallback and the tier is not Sonnet.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.13 — the About modal names two documents and not the licence

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-20 · **Size** S · **Depends on** nothing
**Closes roadmap** *(no box. The same call WO-8.9 through WO-8.11 made: this is the app reporting a
fact about itself rather than a feature the roadmap costed. Booked 2026-08-21, owner-directed, out
of the sitting that added `LICENSE.md`.)*

**Why it exists.** `LICENSE.md` — Apache 2.0 — landed on 2026-08-21, and the two public documents
that claim the source is public now name it: `privacy.html`'s footer and the *"The source is public"*
bullet in `docs/FERPA.md`. **The app names nothing.** About carries a **Privacy and student data**
section with a row for the policy and a row for the administrators' guide, both added in that same
week, and a teacher — or the colleague she hands the iPad to — has no way from inside the app to
find out what anyone may do with this.

**It is not a compliance job, and dressing it as one would oversell it.** Apache §4 wants a recipient
of the work to receive the licence, and every recipient already does: Cloudflare Pages serves
`/LICENSE.md` out of the repository root, and the same file is on GitHub, pushed. The reader this row
is for is the one WO-8.12's two rows were not written for — somebody wondering whether they may fork
this, run it for their own department, or sell it. **One row. It stays one row.**

**Deliverables**
- **One `.doc-link` row in the About modal**, pointing at `LICENSE.md` on GitHub, with the licence
  named in the link text — *"Apache License 2.0"*, not *"Licence"*. A reader who has to open a file
  to learn which licence it is has been told nothing.
- **Its own section label, not the privacy one.** **Privacy and student data** is an argument about
  student records; a licence filed under it reads as a privacy term. A second
  `modal-section-label` — *Source and licence*, or whatever survives being read aloud — in the same
  grammar as the two that exist, above the build line.
- **`sw.js`'s `CACHE` bumped in the same commit.** `index.html` is what `./` resolves to and `./` is
  entry one in `SHELL`; without the bump no installed device sees the row at all.
- **One `verify-shell.mjs` check.** The two rows beside it are asserted nowhere — they landed outside
  a work order and only `TESTING.md` records them. A check written to read *every* `.doc-link` in
  that modal closes all three at once and is the better shape. *(Still true on 2026-09-20: no file
  under `tools/verify/` names `.doc-link`. The home is `tools/verify/build-line.mjs`, which already
  opens `#aboutModal` — do not add a section to open it a second time.)*
- **A `TESTING.md` line of its own**, and the 👤 reading below.

**Acceptance**
- [ ] The About modal names the licence and links `LICENSE.md`, and the link text says *which*
      licence.
- [ ] The row is **not** inside the **Privacy and student data** section.
- [ ] **No new CSS for the row.** It reuses `.modal-body .doc-link`, including that rule's
      `(pointer: coarse)` entry in `src/shell.css`, which is what gives it 44px. **A row that needs
      a new rule is the wrong shape** — say so in the result rather than adding one quietly.
      **The label is the one exception, ruled here on 2026-09-20 rather than left for the dispatch
      to find.** A section label gets its 16px from `.modal-body p + .modal-section-label`, and
      this one follows an `<a>` — the FERPA row — not a `<p>`, so it gets nothing; past `#drivePanel`
      it follows a `<div>` and gets nothing there either. That is the break the `.drive-panel`
      comment in `src/shell.css` records for WO-7.1, and this is its second instance. **Add one
      selector to the existing adjacency rule** — `.modal-body .doc-link + .modal-section-label` —
      rather than a second declaration, and say why in that rule's comment. Nothing else in
      `src/shell.css` moves, and `touch-targets.mjs` measures the row, not the gap.
- [ ] `target="_blank" rel="noopener"`, matching the two rows beside it, for the reason written
      above them in `index.html`.
- [ ] `sw.js` `CACHE` bumped in the same commit that edits `index.html`.
- [ ] `node tools/verify-shell.mjs` green, carrying a check that goes **red** when the row is
      deleted — proved by deleting it once, not by reasoning about it.
- [ ] 👤 On a **force-quit and relaunched** install: the row is there, tapping it opens the licence
      in the browser, and Planbook is still where you left it when you come back.

**Traps** — **The GitHub URL, not `./LICENSE.md`.** A `.md` served off this origin is a file some
browsers download rather than a page they render; GitHub renders it. That argument and the one about
`target="_blank"` are both already written in `index.html` in the comment above the FERPA row — read
it before writing the href rather than re-deriving either. **Unlike that row, this target is already
pushed**, so it is testable the moment it is written; do not take that as a reason to skip checking
it. **Do not restate the licence in the modal.** A summary of Apache 2.0 sitting in this app's UI is
a licence term this project did not write and cannot honour — link it and say its name. **Do not
touch the two rows beside it.** They are `TESTING.md`'s record, not this work order's, and a change
to them here lands in a commit whose message is about something else. **Do not add a version or a
copyright line beside it.** The build line under it is generated from `caches.keys()` for the reason
WO-8.10 gives, and the copyright holder is stated in `LICENSE.md` and nowhere else — a second copy in
the modal is a second thing to keep true.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/FERPA.md`
  - `src/shell.css`
  - `tools/verify-shell.mjs`
  - `tools/verify/build-line.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `index.html` ~2050–2070 — the **Privacy and student data** section and the comment above the
  FERPA row. The href argument and the `target="_blank"` argument are already written there; the
  FERPA row's GitHub URL is the template for this one's (`.../blob/main/LICENSE.md`).
- `src/shell.css` 648–692 — `.modal-section-label`, the `p + .modal-section-label` adjacency rule at
  655 (the one you add a selector to), `.modal-body .doc-link` at 676, the `.drive-panel` comment at
  680–692 that records the first instance of the adjacency break, and the coarse-pointer entry at 1779.
- `sw.js:37` — `CACHE = 'planbook-shell-v125'`; bump it.
- `tools/verify/build-line.mjs` — `openAboutAndRead()` at ~95 already opens `#aboutModal` and waits on
  the build line; `closeAbout()` at 108. Put the `.doc-link` check inside this section's existing
  open/close, not in a new section, and do not open the modal a second time.
- `TESTING.md` — find the WO-8.11 / WO-8.12 entries for the grammar of an About-modal 👤 line, and
  the standing force-quit-from-the-app-switcher instruction those entries carry.

## 2b. What the orchestrator would not leave to chance

**Placement.** The new label goes **after** the FERPA row and **before** the `#drivePanel` comment
block — that is what "above the build line" and "follows an `<a>`" both mean here. Do not put it
inside `#drivePanel`; that wrapper is hidden on every deployed device and exists for `src/auth.js`'s
flag alone.

**The CSS change is exactly one selector on one existing rule.** Line 655 becomes a two-selector
rule (`p + …, .doc-link + …`) with its comment extended to say why — the second instance of the
adjacency break the `.drive-panel` comment already records. Not a second declaration, not a new
class, not a `margin-top` on the row. If you find yourself writing any other CSS, stop and say so in
the result: Acceptance line 3 says a row that needs a new rule is the wrong shape.

**The harness check reads every `.doc-link` in the modal, not just the new one.** Assert the set —
count, hrefs, `target`, `rel`, link text naming *Apache License 2.0* — so the two rows that landed
outside a work order are covered by the same check. Then prove it: delete the new row, run the harness,
watch the check go red, restore the row, run it green. Two full runs; record both figures in the
result. Reasoning about the check is not proof. If `verify-shell.mjs` cannot run in your sandbox, say
"could not run" and stop there — do not tick line 6.

**The mutation-proof discipline.** You will have a deliberately broken `index.html` in the tree for
one harness run. Mark the deletion with a `MUTATION` comment while it is in, and make restoring it
the very next act after the red run — before writing a word of the result. Every dead dispatch in
`plans/dispatch-retro.md` since WO-5.1 was found by `grep -rn MUTATION`, and yours should find nothing.

**Scope fence.** `git status` at the end should name `index.html`, `sw.js`, `src/shell.css`,
`tools/verify/build-line.mjs`, `TESTING.md`, the phase file and possibly `tools/README.md` if a
`check()` count there needs correcting — and nothing else. The two rows beside the new one do not
move. `privacy.html`, `docs/FERPA.md`, `LICENSE.md` do not move. No copyright line, no version line,
no summary of the licence: link it and name it.

**Write the 👤 line but do not tick it**, and leave `CHANGELOG.md` alone; draft the entry in the result
file if you like.

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

## 5. Done means these 7 lines, reported against one by one

1. The About modal names the licence and links `LICENSE.md`, and the link text says *which* licence.
2. The row is **not** inside the **Privacy and student data** section.
3. **No new CSS for the row.** It reuses `.modal-body .doc-link`, including that rule's `(pointer: coarse)` entry in `src/shell.css`, which is what gives it 44px. **A row that needs a new rule is the wrong shape** — say so in the result rather than adding one quietly. **The label is the one exception, ruled here on 2026-09-20 rather than left for the dispatch to find.** A section label gets its 16px from `.modal-body p + .modal-section-label`, and this one follows an `<a>` — the FERPA row — not a `<p>`, so it gets nothing; past `#drivePanel` it follows a `<div>` and gets nothing there either. That is the break the `.drive-panel` comment in `src/shell.css` records for WO-7.1, and this is its second instance. **Add one selector to the existing adjacency rule** — `.modal-body .doc-link + .modal-section-label` — rather than a second declaration, and say why in that rule's comment. Nothing else in `src/shell.css` moves, and `touch-targets.mjs` measures the row, not the gap.
4. `target="_blank" rel="noopener"`, matching the two rows beside it, for the reason written above them in `index.html`.
5. `sw.js` `CACHE` bumped in the same commit that edits `index.html`.
6. `node tools/verify-shell.mjs` green, carrying a check that goes **red** when the row is deleted — proved by deleting it once, not by reasoning about it.
7. 👤 On a **force-quit and relaunched** install: the row is there, tapping it opens the licence in the browser, and Planbook is still where you left it when you come back.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

