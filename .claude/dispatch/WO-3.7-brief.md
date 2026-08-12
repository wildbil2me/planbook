# WO-3.7 — Per-student grade detail · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.7-result.md` — as your last act, and return it in-band too.

**Routing decision.** This went to **Claude Opus** on its own merits, not by fallback: it is size `L`
and it touches a sensitive surface twice — presentation mode on a *view*, which is what ends up on a
classroom wall, and a print/CSV path that must never emit `supports`, medical or plan data.
`ROUTING.md` marks both as never-delegated. The runner-up consideration I set aside: the CSV and
print half looks mechanical enough for Codex read on its own, but it is precisely the half where a
plausible-looking implementation is a legal disclosure, and it cannot be separated from the view that
assembles it. No Codex probe was run, because no part of this routed to Codex.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.7 — Per-student grade detail

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-12 · **Size** L · **Depends on** WO-3.4, WO-2.6
**Closes roadmap** Phase 3 → "Per-student detail: category breakdown, what's missing, what it would
take to move."

*Re-sized M → L and given a second dependency on 2026-08-11, when per-student print and CSV were
amended in at the owner's call. The roadmap boxes are unchanged: "Print/CSV for grades" is WO-3.9's
class-level output and stays there, and this closes no box of its own for the added half — it is a
deliverable this work order absorbs rather than a line the roadmap was tracking. The WO-2.6
dependency is real rather than decorative: the print gate and the download hand-off are to be
borrowed from it, not re-derived.*

**Why it exists.** This is the screen open during a guardian conference, and the source of the
numbers Phase 5's merge fields put in an email. "What would it take to move" is the difference
between a report and a conversation.

**Deliverables**
- **Surface: a main-area view.** This work order's own first sentence calls it "the screen open
  during a guardian conference" — a screen a teacher sits in front of with a parent, scrolling and
  pointing, is not a dialog. See [`../gradebook-surfaces.md`](../gradebook-surfaces.md).
- **You arrive here from a name, never from the nav strip** *(owner, 2026-08-09)*. WO-3.3 builds the
  three-tab switcher and this screen is deliberately not a fourth tab: it is reached by tapping a
  student from attendance, the assignment list or the score grid, and the strip then shows that
  student's name as a breadcrumb segment while you are in it. So **this work order owns no navigation
  target of its own** — it owns the entry points on the screens that name students, and the way back.
- Category breakdown with each category's percentage, weight, and contribution.
- The list of missing work, with points at stake.
- "What it would take to move" — the score needed on remaining work to reach the next letter band.
- Attendance summary for the same student, from WO-2.4.
- Presentation-mode safe.
- **Print and CSV for the one student on the screen** *(owner, 2026-08-11)*. This is the sheet a
  guardian leaves the conference holding: the category breakdown, the missing work, the attendance
  summary, one student, one page. **It rides here rather than in a work order of its own** for a
  reason that is about the artifact and not about scheduling — a per-student printout that showed
  attendance but not grades would be the wrong thing to hand a parent, and per-student output cannot
  be built correctly until the screen that assembles all of it exists. That screen is this one.
  - **The mechanism already exists and is to be borrowed, not re-derived.** WO-2.6 built the app's
    first `@media print` block, gated on a `<body>` attribute the Print button sets and removes
    (`body[data-attendance-print]`, Roll Call!'s `data-modal-print` idiom), and exported
    `handToBrowser()` from `src/backup.js` as the one-download-per-tap hand-off. Use both. A second
    print idiom in this app is a second thing to keep gated, and an ungated rule prints a blank sheet
    from every other screen.
  - **A print surface on a *view* is a harder problem than on a dialog**, and this is where the two
    traps below meet: WO-2.6 printed from a modal, which is a bounded thing with a known parent. A
    view is the whole screen, including the nav strip and the breadcrumb.
  - **Roll Call!'s `printStudentReport` is the precedent** — lift its structure and measurements with
    the function, per `CLAUDE.md`. Its at-risk banner, absence letter and email composer are **not**
    in scope here: those are Phase 4 and 5, and a threshold invented here would be a second opinion
    about "at risk" before the work order that owns the first one is written.
  - **The CSV's fixture roster must contain a non-ASCII name.** WO-2.6 shipped a BOM asserted present
    and never asserted useful, because every name in the harness is ASCII; the gap was closed by the
    owner's own roster rather than by a check. Do not inherit that hole.

**Acceptance**
- [ ] The breakdown's contributions sum to the displayed overall grade.
- [ ] With a category empty, the breakdown shows the redistribution rather than hiding it.
- [ ] The "to move" figure is reproducible by hand.
- [ ] No `supports` data appears on this screen in presentation mode.
- [ ] It is a view in `<main>`, not a dialog.
- [ ] One student's detail prints to one page carrying their name, the class, the term and the date
      it was printed — and the nav strip, breadcrumb and any app chrome are not on it.
- [ ] The per-student CSV opens cleanly in a spreadsheet, **including a name with a non-ASCII
      character in it**.
- [ ] Neither the printout nor the CSV emits accommodation, medical, or plan data — verified in both
      presentation modes, with the data asserted present in the document first.
- [ ] The strip shows the open student's name as a breadcrumb segment while this screen is up, and
      switching to any of the three tabs takes the name with it. *(Inherited from WO-3.3, which
      built the strip and the rule and could not demonstrate this half: there was no per-student
      detail to enter or to leave, so the name was never drawable. `setDetailBreadcrumb()` in
      `src/screen-nav.js` is the seam it is set through, and that module already refuses to draw a
      name unless its own view is the one on screen — the half that has to be shown here is the
      name actually appearing, and then going.)*

**Traps** — Do not build this in the modal system; see the Surface deliverable and
`../gradebook-surfaces.md`. And note that presentation mode is a harder problem on a view than in a
dialog: a dialog can be closed to hide it, a view is what is on the wall.

**Printing a view is the other half of that same trap.** WO-2.6's print surface is a modal — a
bounded element with a known parent, which is why its verifier checked by hand that the modal is a
direct child of `<body>` and why every one of its 24 print rules is gated on the body attribute. A
view has no such boundary: the nav strip, the three-tab switcher and the breadcrumb are all on the
screen it prints from, and none of them belongs on the sheet. Whatever hides them must be gated the
same way, or a Ctrl+P from any other screen starts producing blank paper again.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/backup.js`
  - `src/screen-nav.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The surface decision, and the strip.** Read both before you decide where anything goes:

- `plans/gradebook-surfaces.md` in full — it names this screen a **view** by name, and its § "How the
  class view navigates between its screens" states the rule you have to honor precisely: *"WO-3.5 and
  WO-3.7 add one line each to `VIEWS` and `CLASS_SCREENS` in `src/views.js` and one empty `<nav>` in
  their own markup, and nothing else."* Note the wrinkle for this work order specifically — per-student
  detail is **not** a fourth tab and owns no navigation target, so read that sentence against the
  breadcrumb rule rather than copying WO-3.5's line blindly.
- `src/views.js` — read its header comment, not just the two lists. `REMEMBERED_AS` is why no class
  screen is remembered across a reload, and that reasoning applies to this screen too.
- `src/screen-nav.js` — `setDetailBreadcrumb()` at line 103 is the seam Acceptance line 9 names. The
  module already refuses to draw a name unless its own view is on screen; the half nobody has been
  able to demonstrate is the name **appearing, and then going**. WO-3.3 built the strip and could not
  show this because there was no detail screen to enter. You are the first run that can.
- `design/mockups/student.html` — the drawing of this exact screen, built against the real
  stylesheets. `design/mockups/README.md` says these are drawings and not code; take the structure and
  the measurements, and do not import the mockup CSS. `scores.html` and `assignments.html` next to it
  show how the two shipped siblings landed against their own mockups.

**The print and CSV mechanism you are told to borrow rather than re-derive.**

- `src/attendance-report.js` is WO-2.6 entire, and the four exports that matter are `printRecord()`
  (line 429), `recordCsv()` (463), `downloadRecordCsv()` (509), and the `PRINT_ATTR` constant at line
  109. Read its header comment block — it explains why the sheet is laid out the way it is and why
  the range is a label rather than a denominator.
- `src/attendance.css` § print, lines ~1205–1275. Every one of those 24 rules is gated on
  `body[data-attendance-print]`, starting from `body[data-attendance-print] > * { display: none
  !important; }`. That first rule is the whole idiom: hide everything, then re-show exactly the
  subtree being printed. **On a modal that subtree is a direct child of `<body>`. A view is not** —
  it is inside `<main>`, under the nav strip and the breadcrumb, which is what the work order's second
  Traps paragraph is warning you about. Decide deliberately how you gate this and say so in your
  report; an ungated rule prints blank paper from every other screen, and that regression has already
  happened once in this app.
- `handToBrowser()` in `src/backup.js` line 241 — the one-download-per-tap hand-off. Use it. Do not
  write a second one.
- Roll Call!'s `printStudentReport()` is at
  `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App\src\dashboard.html` line 6243,
  with its button at line 6440. Lift its structure and measurements with the function, per
  `CLAUDE.md` § "Lift the design with the function — copy, don't re-derive". Its at-risk banner,
  absence letter and email composer are **out of scope** — those are Phase 4 and 5, and a threshold
  invented here is a second opinion about "at risk" before the first one exists.

**The data you are assembling, all of which already exists.**

- `src/grade-engine.js` — `categoryResult()`, `categoryPercentage()`, `letterFromPercentage()`,
  `weightedClassGrade()`. This is WO-3.4 and it is your dependency. Acceptance lines 1, 2 and 3 are
  all statements about agreeing with it. Do not recompute grade math in the detail screen; if the
  breakdown needs a number the engine does not expose, extend the engine rather than shadowing it.
- `src/attendance.js` `countsFor()` (line 1132) and the per-student totals `attendance-report.js`
  already builds for its own sheet — that is WO-2.4, and the attendance summary deliverable is meant
  to agree with what those produce. `attendance-report.js`'s header states the invariant out loud:
  the day-by-day list and the percentage must agree.
- `docs/data-model.md` for the grade math and the redistribution rule, so line 2 has an authority
  behind it that is not your own reading of the code.

**The sensitive surface — read these before writing the print or CSV path, not after.**

- `src/supports.js` — `supportsVisible()`, `presentationMode()`, `sensitiveValue()`,
  `setSensitiveText()`. These are the seams the accommodations rules are enforced through, and
  `setSensitiveText()` in particular exists so a caller cannot forget.
- `src/presentation.js` — `refreshPresentationChrome()`, `togglePresentationMode()`.
- `docs/FERPA.md` and `CLAUDE.md` § "Accommodations are the most sensitive data here".
- Acceptance line 8 sets a bar higher than "I did not write the code that would emit it": it wants
  the data **asserted present in the document first**, then absent from both outputs, in **both**
  presentation modes. A fixture with no supports data in it cannot fail that check, and shipping one
  that cannot fail is the exact defect the work order calls out one bullet earlier about the BOM. The
  same applies to the non-ASCII name in Acceptance line 7 — put it in the fixture roster.
- `src/scores.js` and `src/assignments.js` are your entry points: this screen is reached *from a
  name*, so the student names those two screens draw (and attendance's) are what have to become the
  way in, and the way back has to be a control a teacher can see (`src/views.js` header explains why
  the back button is not available to you on an installed iPad PWA).

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

## 5. Done means these 9 lines, reported against one by one

1. The breakdown's contributions sum to the displayed overall grade.
2. With a category empty, the breakdown shows the redistribution rather than hiding it.
3. The "to move" figure is reproducible by hand.
4. No `supports` data appears on this screen in presentation mode.
5. It is a view in `<main>`, not a dialog.
6. One student's detail prints to one page carrying their name, the class, the term and the date it was printed — and the nav strip, breadcrumb and any app chrome are not on it.
7. The per-student CSV opens cleanly in a spreadsheet, **including a name with a non-ASCII character in it**.
8. Neither the printout nor the CSV emits accommodation, medical, or plan data — verified in both presentation modes, with the data asserted present in the document first.
9. The strip shows the open student's name as a breadcrumb segment while this screen is up, and switching to any of the three tabs takes the name with it. *(Inherited from WO-3.3, which built the strip and the rule and could not demonstrate this half: there was no per-student detail to enter or to leave, so the name was never drawable. `setDetailBreadcrumb()` in `src/screen-nav.js` is the seam it is set through, and that module already refuses to draw a name unless its own view is the one on screen — the half that has to be shown here is the name actually appearing, and then going.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

