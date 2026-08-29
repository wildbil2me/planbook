# WO-5.2 — Templates · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.2-result.md` — as your last act, and return it in-band too.

**Route — Claude Opus, on this work order's own merits.** No Codex probe was run and none was
needed: `ROUTING.md` § "Later phases, at a glance" puts **all of Phase 5 in the Claude column as a
property of the work**, and this row also produces teacher-facing prose (eight starter templates in
the suite's voice) one import away from `src/merge-fields.js`, a named sensitive surface. The
runner-up I set aside: the `templates[]` CRUD half reads Codex-shaped — settled schema, a
mechanically checkable backup round-trip — but it is not separable from the prose, and the
presentation-mode obligation on the live preview is exactly what a rubric-clean runner walks past.

## The three `Open` lines are answered. Build these; do not re-open them

The work order says *"Answer this when cutting the row, not in the editor."* The owner answered all
three on 2026-08-28. These are decisions, not suggestions:

1. **Entry point — a fourth header icon in `hdr-right-controls`, opening a full main-area screen.**
   Not a screen-nav segment (WO-6.6 ruled against a sixth, twice) and not inside the *Your details*
   modal. That cluster already holds exactly the cross-class surfaces — `data-roster-manage`,
   `data-class-manage`, `data-teacher-panel` — so you are matching an established pattern rather
   than choosing one. The screen is not about one class; `{{class.name}}` resolves per draft at send
   time, which is why the drawing shows *All classes* selected.
2. **The block strip is permanent** — green when nothing is wrong, wording as drawn. The argument is
   the drawing's own: a strip that appears only on failure reads as an error banner, one always
   present is a report, and WO-5.3 reads the same `blocked` flag to decide whether its send button
   is live. The one line of chrome at 390px is accepted.
3. **Eight starter templates ship filled in** — both tones × each of the four audiences — and
   **none is auto-loaded on first launch.** The editor opens empty with the eight in the list.
   Written well they teach what a merge field is faster than help text; auto-loading one puts
   identical sentences one Save away from a hundred guardians.

**One reading was waived, and you must not quietly close it.** The last caption of
`design/mockups/outreach.html` asks **in bold** for a reading on the real tablet *before this work
order is dispatched*: "tap a chip to insert at the cursor" is a desk gesture, and on a phone the
keyboard is up, the palette is below the fold, and tapping it may close the field it is meant to
type into. **The owner waived that reading on 2026-08-28 and ruled the palette ships as drawn** —
chips in a column under the field, tap to insert at the cursor, 390px order list · editor · preview
· palette. Do **not** substitute the sheet-over-keyboard alternative on your own judgement; it is
named here as the thing that was **not measured**, so the gap stays on the record instead of
vanishing. If your work leaves a 👤 line on that palette, **leave it open** — no headless run can
close it and neither can you.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.2 — Templates

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-28 · **Size** M · **Depends on** WO-5.1
**Closes roadmap** Phase 5 → "Templates with merge fields" and "Separate concern and praise
templates."

**Why it exists.** A good praise message reads nothing like a good concern message — same length,
opposite structure. One template set that tries to be both produces a praise email that sounds like
a warning.

**Deliverables**
- `templates[]` per the data model: `{ id, name, audience, tone, subject, body }` with
  `tone: "concern" | "praise"` and `audience: guardian | counselor | admin | student`.
- Editor with a live preview resolved against a chosen real student, so a broken field is caught at
  authoring time rather than at send time.
- A field palette listing exactly what's resolvable — which doubles as documentation of the refusal
  list, by omission.
- Starter templates for both tones and each audience, written in the suite's voice: friendly-
  utilitarian, sentence case.
- **Surface** — [`design/mockups/outreach.html`](../../design/mockups/outreach.html), drawn
  2026-08-28. It settles: three columns in the order of the work (list · editor · preview) with the
  preview never behind a button; **one in-body treatment for all three failures**, the token handed
  back intact and the block strip carrying the named reason and the student; the palette stating the
  supports rule in words rather than by omission; a plain `textarea` body with no token highlighting,
  because the alternative is this app's first `contenteditable`; and the 390px stacking order
  list · editor · preview · palette. The CSS is `design/mockups/proposed-phase5.css`, five sections,
  and `§ UNRESOLVED` is the one WO-5.3 inherits.

**Open** — *where is this screen reached from?* The drawing shows it with *All classes* selected,
because a template is not about one class, which makes the class switcher wrong; *Your details* is
the nearest existing home; a sixth screen-nav segment is what WO-6.6 ruled against twice. **Answer
this when cutting the row, not in the editor.**

**Open** — *does the block strip stay when nothing is wrong?* Drawn green and permanent, on the
argument that a strip appearing only on failure reads as an error banner while one always present is
a report, and WO-5.3 reads the same `blocked` flag. The cost is permanent chrome on a narrow screen.

**Open** — *do the starter templates ship filled in, and how many?* Written well they teach what a
merge field is faster than any help text; written once they are also the sentences a hundred
guardians read in the same words.

**Traps** *(added 2026-08-28, out of WO-1.32's verification — see its note and WO-1.34)*

- **The resolver is already built for you, and you have no reason to open it.**
  `mergeFieldPalette()` returns `{ name, about }` for all sixteen fields in the documented order, a
  fresh copy each call, with **no `resolve` on it** — WO-5.1 built it for this work order by name,
  and its own comment says why it carries no resolver: a screen that could reach one through the
  palette could resolve a field outside a draft, which is a second door into the same room. Map over
  what it hands you. Do not import `FIELDS`, do not add an export, and do not index anything by a
  token.
- **If you find yourself wanting `FIELDS[name]`, stop and say so — do not write it.**
  `wo-sweep.mjs` § 20 claim 5 forbids every dynamic property read in that file: a bracket subscript
  whose key is not an integer literal, a split, a fold, `eval`, `new Function`, `Reflect.get`. It
  goes red and names the line, so this is not a rule you can discover late cheaply — you would
  discover it after the screen was built. It exists because WO-5.1's dispatch shipped a path walk
  that resolved `{{student.supports.medical}}` to the roster string while every tool was green. **A
  palette that needs a lookup by key is a finding, not a workaround:** say so in your result file and
  name [WO-1.34](phase-1-shell-store-roster.md#wo-134--claim-5-reads-member-position-and-three-spellings-walk-around-it),
  which is the booked work order for the one gap in that check. **If this work order's result file
  names WO-1.34, that row goes next** — the finding is the only thing that moves it up the queue.

**Out of scope** — any change to `src/merge-fields.js`, including its exports: the palette this work
order needs was built by WO-5.1 and is already there. Any resolver of your own, anywhere, including
one behind the live preview.

**Acceptance**
- [ ] A concern template and a praise template can exist for the same audience and are offered
      separately at send time.
- [ ] The live preview shows unresolved fields visibly, exactly as the send flow will.
- [ ] The field palette contains no refused path.
- [ ] Templates survive a backup round-trip.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/outreach.html`
  - `design/mockups/proposed-phase5.css`
  - `src/merge-fields.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `design/mockups/PROTOCOL.md` — the mockup is a drawing, not a source. Lift its structure,
  measurements and colours rather than re-deriving them; do not link `proposed-phase5.css` from the
  app. Its `§ UNRESOLVED` is the one section that lifts into `src/shell.css` rather than a screen
  sheet, for the reason `§ LOG SHEET` did — WO-5.3 inherits it.
- `index.html` — `hdr-right-controls` for the icon cluster your entry point joins, and an existing
  main-area view for the panel skeleton. `src/screen-nav.js` for why you are **not** adding a
  segment.
- `docs/data-model.md` § "Outreach templates" — the sixteen fields and the five rulings inside the
  resolver, including the one that lands on this work order: **presentation mode is deliberately not
  asked in `src/merge-fields.js`, so the live preview is the screen that owes `src/supports.js` the
  question before it draws a resolved body.**
- `tools/wo-sweep.mjs` § 20 — five claims over `src/merge-fields.js`, which you are not editing. All
  five must still be green when you finish. If you find yourself wanting `FIELDS[name]`, that is a
  **finding**: say so in your result file and name WO-1.34, per the Traps above.

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

## 5. Done means these 4 lines, reported against one by one

1. A concern template and a praise template can exist for the same audience and are offered separately at send time.
2. The live preview shows unresolved fields visibly, exactly as the send flow will.
3. The field palette contains no refused path.
4. Templates survive a backup round-trip.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

