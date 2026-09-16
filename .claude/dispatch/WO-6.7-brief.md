# WO-6.7 — The glance page's stack, its readers, and the quiet day · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.7-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at Opus, on its own merits. The deciding signal is that this row's
one decision establishes a convention — the readers in `src/glance.js` as the single array three
screens (the card, the chip, the panel) draw from — and its Traps are judgment rather than
mechanics ("the temptation is to make them smart"); it also grows the home screen, lifts a mockup
stylesheet, and carries teacher-facing quiet-panel prose. The runner-up set aside was Codex: the
readers are thin wrappers and the count-agreement line is harness-checkable, but the value of this
work is in what the readers refuse to do, not in what they compute.

**The owner's call in the work order — the "not yet" line — is answered for this dispatch: NO, do
not draw it.** Here is why, from the tree rather than from taste. The mockup proposes wearing the
signals screen's `.sig-inert` line "as shipped" from `inertRules()`. Read `src/signals.js` line
~1320: `inertRules()` returns the rules that are **not built** (`rule.inert`), knows nothing about
term length or graded-assignment counts, and has returned `[]` since WO-4.4 landed. Wearing it as
shipped therefore draws nothing. Composing the sentence the mockup actually shows ("four rules can't
fire yet… the term has 2 so far") would need term-length arithmetic that no engine produces — and
Acceptance line 4 forbids exactly that arithmetic in `src/glance.js`. So the quiet panel ships
without the grey line. The owner can reverse this at the verdict; if so it is a follow-up that adds
an engine-side function to `src/signals.js` first and a one-line wear second. Do not build either
half here, and say in your result file that the line is absent on this decision.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.7 — The glance page's stack, its readers, and the quiet day

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-15 · **Size** M · **Depends on** WO-6.3, WO-3.26, WO-4.5
**Closes roadmap** Phase 6 → "Honest empty states."

**Why it exists.** The first third of [WO-6.4](#wo-64--the-glance-page), cut out on 2026-09-15 — the
reasoning is at the top of that row and is not repeated here. This is the part that has to exist
before either of the other two can draw a panel: the stack the panels sit in, the four readers whose
arrays they draw, and the one panel that exists only when none of theirs does.

**What it builds, and the one decision in it.** Three things:

1. **The stack.** `#homeView` gains the `.gl-stack` from `proposed-phase6.css` § GLANCE, and the
   class grid — the panel headed *Your classes* — is **panel 1 of it, unchanged**. Deliverable 1 of
   the original row (*every class with today's state, each with a one-tap fix*) has been built since
   WO-2.1 put `.class-card-state` on WO-1.13's card; this row asserts it as the head of the stack and
   rebuilds nothing. `classCard()`'s markup is the same bytes either side of this landing. The page
   adds no view: it is `#homeView` grown, exactly as the original row argued, and the line that says
   so lives here because this is the row that touches `#homeView` first.
2. **The readers**, in a new `src/glance.js` — one per source the later panels draw, and **each is a
   call into an engine that already exists, returning the engine's own array**: the week's items from
   `src/calendar-derived.js` and the authored events (WO-6.2 / WO-6.1); the grading queue from the
   engine behind `ungradedChip()` (WO-3.26); the post-cooldown hits from `evaluate()` +
   `applyCooldown()` the way `attentionChip()` already reads them (WO-4.5); and what is closing in —
   grades-due dates inside `leadDaysOf()`, term edges, and the review **count** through
   `reviewDatesIn()`. **This is the decision.** The quiet panel below counts these arrays, and
   WO-6.8 and WO-6.4 draw rows from the same arrays, so *the card says 5, the chip says 5 and the
   panel draws 5* is a property of there being one array rather than a thing three screens agree
   on. The redraw of 2026-09-15 named that property as the one worth keeping through any later
   redraw, and it is the original Traps line — *no second answer* — made structural. The readers
   contain no arithmetic of their own: no grade, no attendance percentage, no rule.
3. **The quiet panel.** When the week, the queue, the hits and the closing-in list are *all* empty,
   the page draws **one** panel under the class grid with four warrant chips saying what was looked
   at — and the other four panels **do not exist in the DOM**, rather than existing empty. The
   decision is about how many panels there *are*, which is why it cannot live inside any of them as
   an empty state. A bare "nothing needs you" with no warrant sends a teacher off to check for
   herself, and then the page has cost her time instead of saving it. **The quiet-middle door is on
   this panel** *(the redraw's question 13)*: on a quiet day panel 4 does not exist, and a door that
   lived in its header would leave the page on exactly the day `index.html`'s own comment says that
   list is the most useful thing on the screen. Drawn on the quiet panel; on a busy day WO-6.4 puts
   it in panel 4's header, and it is never in both places at once.

**Read the drawing before building** — [`design/mockups/glance.html`](../../design/mockups/glance.html),
the quiet-day section, redrawn 2026-09-15 two weeks into a term — and lift § GLANCE rather than
re-deriving it. **Lift the whole section into `src/glance.css` here, `.gl-row` and `.gl-shut`
included, though the rows that wear them come later**: a stylesheet is lifted once, `wo-sweep.mjs`
§ 19 reads the file's existence as *lifted* from the moment it appears, and a half-lifted sheet is
exactly the state that check cannot see into. The banner in `proposed-phase6.css` names WO-6.4 and
should be amended in the same sitting to say this row lifted it. WO-6.3's scar about re-deriving is
in WO-6.4.

**Open — the owner's call** — *does the "not yet" line belong on the quiet panel?* Two weeks into a
term most rules cannot fire because the window they measure is longer than the term so far. The
signals screen already says so in a `.sig-inert` line written from `inertRules()`, and the redraw
wears that sentence under the quiet panel rather than composing a second one. It is honest, and it is
also a line of grey on the page she opens every morning for six weeks. Answer it when dispatching.

**Under a projector the quiet panel draws as it does otherwise.** Its chips are counts, and the card
already puts `N need you` on the wall on the same argument — a launcher says how much is waiting.
Joining `flipPresentationMode()`'s redraw list is WO-6.4's, because panel 4 is what changes under the
flip and this row draws nothing that does.

**Acceptance**
- [ ] `#homeView` holds the stack and the class grid is its first panel, unchanged: `classCard()`'s
      markup is byte-identical either side of this landing, and the today-state line is correct
      against a day with a mix of taken, dropped and untaken classes.
- [ ] A day with nothing pending renders one quiet panel with four warrant chips, and the DOM holds
      **no** panel for the week, the queue, the hits or what is closing in — not hidden, absent.
- [ ] `src/glance.js` exports one reader per source and each returns the engine's own array: the
      harness shows a fixture where the card's `N to grade` chip, the card's `N need you` chip and
      the readers' lengths agree, and cutting a student from the fixture moves all three.
- [ ] `src/glance.js` holds no arithmetic of its own — no `evaluate()` reimplemented, no percentage,
      no rule — which is read by hand and named in `TESTING.md`, because a grep cannot tell a reader
      from a recomputation.
- [ ] The quiet-middle door is on the quiet panel and lands on WO-4.2's screen scrolled to its
      quiet-middle panel, with `The quiet middle · N` carrying the same N that screen's own head shows.
- [ ] The page adds no view: `src/views.js`'s `VIEWS` is unchanged, `DEFAULT_VIEW` still reads `home`,
      and a reload still lands here.

**Traps** — The readers are the whole point, and the temptation is to make them smart. A reader that
filters, ranks or re-dates on the way through has become a second engine; it hands back what the
engine hands it, and the panel that draws it does the same. If a panel needs an ordering the engine
does not produce, the ordering goes in the engine — `severityOrder()` and `praiseOrder()` live in
`src/signals.js` for exactly this reason, stated at their definitions.

Also: the quiet panel's four chips are not the card's two. The card counts one class; the quiet panel
counts the page. Building the page's count by summing the cards is the second answer at a different
address.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/glance.html`
  - `src/calendar-derived.js`
  - `src/signals.js`
  - `src/views.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and why each matters here:

- `plans/work-orders/phase-6-calendar-glance.md` § WO-6.4 (line ~410) and § WO-6.8 — the parent
  row and the sibling. WO-6.8 draws rows from **your** readers next; read its Acceptance so the
  arrays you return are the ones it needs (week items from today through six days on; queue rows
  per assignment; closing-in items; the review **count** through `reviewDatesIn()`). Build nothing
  of WO-6.8's panels.
- `design/mockups/glance.html` lines 704–850 — the quiet-day section and its captions. Question 13
  (the door on the quiet panel) is this row's; the last caption (the "not yet" line) is answered
  above.
- `design/mockups/proposed-phase6.css` § GLANCE (line ~343 to the § RESPONSIVE block) — lift the
  **whole** section into `src/glance.css`, `.gl-row`, `.gl-more`, `.gl-shut` and the `.gl-*`
  lines of the coarse-pointer block included, even though nothing wears the row classes yet. Then
  amend the banner (line 26 and the § GLANCE heading) to say this row lifted it. `wo-sweep.mjs`
  § 19 reads the sheet's existence as *lifted* and its banner as the record; a half-lifted sheet is
  the state it cannot see into. Read the WO-6.3 scar in WO-6.4 before deciding to rename anything.
- `src/home.js` — `refreshHome()`, `classCard()`, `ungradedCount()`/`ungradedChip()`,
  `attentionCount()`/`attentionChip()`. The engine calls your queue and hits readers wrap are the
  ones these already make (`openWork()` per roster id with `state === 'open'`; `applyCooldown(doc,
  evaluate(doc, cls, termId)).shown`). **The card counts one class; your readers answer for the
  page.** `attentionCount()` returns 0 off the home view on purpose — read its header before you
  copy the guard. `classCard()`'s bytes do not move; diff it.
- `index.html` lines 494–602 — `#homeView` today: one `.panel` with the class grid and the empty
  state. It becomes the first child of a `.gl-stack`. The empty state stays inside panel 1.
- `src/shell.js` `showHome()` (~1246) and `showCalendar()` (~1289) — the door shape.
  `signals-view.js`'s `resetSignals()` comment already reserves `''` "from the home screen's
  door", and no such door exists yet: the quiet-middle button needs a `showSignals()` of
  `showCalendar()`'s shape — `resetSignals('')`, then the view, then the paint, then scroll the
  quiet panel (`QUIET_ID` in `src/signals-view.js`) into view. Wire it through the delegated click
  handler with a `data-` hook like `data-calendar-open`, and add the hook to shell.js's hook
  catalogue comment (~line 362). `paintQuiet()` (~908) writes `The quiet middle · N` from
  `signalsModel().quiet.count` with the filter at all classes — your door's N must come from the
  same engine reading (`quietMiddle()` over every active class's open term), not from a sum you
  build.
- `src/calendar-derived.js` and `src/calendar.js` — `derivedItemsIn(doc, from, to)`,
  `generalEventsIn(doc)`, `coversDate()`, `shiftDays()`, `leadDaysOf()`, `reviewDatesIn()` (already
  answers `[]` while projecting — one asker of `presentationMode()`, and this row adds none).
  `src/calendar-view.js` is the existing consumer; match how it asks for a week.
- `tools/verify-shell.mjs` — find the home-screen section and the WO-3.26 / WO-4.5 chip fixtures;
  Acceptance line 3 wants a fixture where the card's two chips and the readers' lengths agree and
  a cut student moves all three. Expose the readers to the harness the way other modules are
  reached there (read how the harness imports or evaluates `src/` modules before inventing a
  window global). Line 2 wants a DOM assertion that the four panels are **absent**, not `.hidden`.
- `tools/README.md` — the recorded `check()` call-site count for `verify-shell.mjs` that
  `wo-sweep.mjs` § 11 checks. Adding checks without moving that number turns the sweep red on
  work being done (the WO-3.26 scar). Update it in the same commit.
- `sw.js` — `src/glance.js` and `src/glance.css` join `SHELL`; bump `CACHE` (currently v116). No
  apostrophe inside the array, comments included.
- `TESTING.md` — Acceptance line 4 is closed by a hand reading named there. Write the § WO-6.7
  entry with what was read and what was found; the verifier re-reads it cold.

Traps beyond the work order's own, found while briefing:

- `inertRules()` means *not built*, not *too early in the term*. See the routing note at the top.
- The quiet decision is over **four** arrays (week, queue, hits, closing-in). The class grid is
  never part of it. The four warrant chips are page-level counts of what was looked at, in the
  order the missing panels would have appeared; the mockup's wording is a drawing, and the
  numbers must be the readers' lengths or the engine's own figures, never a second computation.
- A day with nothing pending and `presentationMode()` on draws the quiet panel exactly as
  otherwise. Do not add `src/home.js` or `src/glance.js` to `flipPresentationMode()`'s redraw
  list — that is WO-6.4's, and shell.js says so at the list.
- Do not leave a mutation in the tree when you report: after any mutate-run-revert, `git diff`
  must show only your work and `grep -rn MUTATION src/ tools/` must find nothing. If
  `verify-shell.mjs` cannot run where you are, report "could not run", never "passed".

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

## 5. Done means these 6 lines, reported against one by one

1. `#homeView` holds the stack and the class grid is its first panel, unchanged: `classCard()`'s markup is byte-identical either side of this landing, and the today-state line is correct against a day with a mix of taken, dropped and untaken classes.
2. A day with nothing pending renders one quiet panel with four warrant chips, and the DOM holds **no** panel for the week, the queue, the hits or what is closing in — not hidden, absent.
3. `src/glance.js` exports one reader per source and each returns the engine's own array: the harness shows a fixture where the card's `N to grade` chip, the card's `N need you` chip and the readers' lengths agree, and cutting a student from the fixture moves all three.
4. `src/glance.js` holds no arithmetic of its own — no `evaluate()` reimplemented, no percentage, no rule — which is read by hand and named in `TESTING.md`, because a grep cannot tell a reader from a recomputation.
5. The quiet-middle door is on the quiet panel and lands on WO-4.2's screen scrolled to its quiet-middle panel, with `The quiet middle · N` carrying the same N that screen's own head shows.
6. The page adds no view: `src/views.js`'s `VIEWS` is unchanged, `DEFAULT_VIEW` still reads `home`, and a reload still lands here.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

