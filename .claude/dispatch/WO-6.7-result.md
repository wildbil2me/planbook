# WO-6.7 — The glance page's stack, its readers, and the quiet day · implementer's result

**Implementer** Claude (work-order-implementer), 2026-09-15.
**Tree** left uncommitted on `main`, as instructed. Row status left at `🤖 CLAIMED` for the orchestrator's `--handoff`.
**Both tools green on the delivered tree**, read from output I waited for:

- `node tools/verify-shell.mjs` — `1373 checks · 1373 passed · 0 failed · 0 skipped`, `42,801 lines · 31.2 lines per check · 451s`, `EXIT=0` (the final run, over the reverted tree; the run before the mutation round printed the same 1373/1373 in 452s, `EXIT=0`).
- `node tools/wo-sweep.mjs` — `42 checks · 38 passed · 0 failed · 4 to review`. Two of the four reviews are pre-existing; the two this work order adds are read below.
- `node tools/wo-gate.mjs --audit` — `PASS`. `node tools/wo-gate.mjs WO-6.7` — `PASS | gates clear`.

## The owner's call, answered and flagged

**The "not yet" `.sig-inert` line is NOT on the quiet panel.** The brief's routing note answered NO and the tree agrees: `inertRules()` (`src/signals.js` ~1326) returns rules that are *not built*, has returned `[]` since WO-4.4, and knows nothing about term length, so wearing it as shipped draws nothing and composing the drawing's sentence needs term-length arithmetic no engine produces — the arithmetic Acceptance line 4 forbids. Recorded in `src/glance.js`'s header, in the phase file under the row's *Open* paragraph, and in `proposed-phase6.css`'s § GLANCE banner as a thing the build declined. Reversible as a follow-up: an engine-side function in `src/signals.js` first, a one-line wear second. **Owner to confirm or reverse at the verdict.**

## Acceptance, line by line

1. **`#homeView` holds the stack and the class grid is its first panel, unchanged.** ✅ ticked.
   - `#homeView` now wraps its one `.panel` in `<div class="gl-stack" id="glanceStack">`; the panel's header, `#homeGrid` and `#homeEmpty` are the same markup, moved one level in.
   - `classCard()` byte-identical: extracted `classCard`, `stateLine`, `ungradedCount`, `ungradedChip`, `attentionCount`, `attentionChip` from `HEAD:src/home.js` and the working file with a brace-matching script — all six `True`. `git diff src/home.js` has three hunks: the header comment, one import, and the foot of `refreshHome()`.
   - Today-state mix: the three WO-2.1 checks in `tools/verify/attendance.mjs` (*"each card on the home screen states its own class's answer"*, the half-taken card in the caution palette, *"a taken class, a dropped one and an untaken one are three different cards"*) are green in the run above. The new section also reads the card's shipped shape (head · state · signals slot, one button) as panel 1 and the state line reading `Not taken yet` on a class with no record.
2. **A quiet day renders one quiet panel with four warrant chips; the four panels are absent, not hidden.** ✅ ticked. Evidence line from the run: `{"panels":2,"chips":["Nothing on the calendar through Mon, Sep 21","Nothing to grade in 1 class","4 students checked, both directions","No deadline inside its 3-day warning"],"lead":"Nothing needs you today."}` and `named panels = ["quiet"], list/row/foot/shut/column elements = 0` — `#homeView` holds exactly two `.panel`s, the only `[data-glance-panel]` is `quiet`, and no `.gl-list/.gl-row/.gl-more/.gl-shut/.sig-two/.sig-col` exists under it. The chips are asserted against the engine's own figures (`shiftDays(today, 6)` formatted by `src/date-text.js`; `leadDaysOf()` read through the seam, not assumed).
3. **One reader per source, each returning the engine's own array; card chips and reader lengths agree and a cut student moves all three.** ✅ ticked. Busy fixture: `{"card":["2 to grade","2 need you"],"queue":2,"open":["a_wo67_u1:4","a_wo67_u2:1"],"hits":2,"rules":["7ada:missing-count","beth:missing-count"],"students":2,"quietMiddle":2}`; after cutting Beth: `{"card":["1 to grade","1 needs you"],"queue":1,"open":["a_wo67_u1:3"],"hits":1,"rules":["7ada:missing-count"],...}`. A further check proves the hits reader is post-cooldown exactly as the card is (a contact about Ada's rule two days ago: card `["1 to grade"]`, `hits: 0`, queue unmoved, quiet middle unmoved).
4. **`src/glance.js` holds no arithmetic of its own — read by hand and named in `TESTING.md`.** ✅ ticked. The reading is written out function by function in `TESTING.md` § WO-6.7. What it found: my first draft re-read `leadDaysOf()` for the fourth chip with its own `Math.max(0, Math.floor(…))` — a copy of `leadWindowOf()`'s clamp one file away — replaced with `daysBetween(w.from, w.to)` over the window the reader used, before the first harness run. The delivered file has no `Math.*`, no `%`, no `/`, no threshold key, no `presentationMode()` call and no writer.
5. **The quiet-middle door lands on WO-4.2's screen scrolled to its quiet-middle panel with the same N.** ✅ ticked, with one honest note. Run evidence: `{"view":"signalsView","head":"The quiet middle · 4","filter":"","rule":"","sort":"ruled"}` and `{"top":238,"bottom":580,"inner":600,"scrollY":411,"maxScroll":411,"focused":"signalsQuietHead","openView":"class"}`. **The note:** at the 600px viewport the section uses, the signals page over a four-student fixture is only ~1011px tall, so `scrollIntoView({block:'start'})` scrolls as far as the page allows (`scrollY === maxScroll`) and the panel's top rests at 238px rather than 0. The check accepts either "top ≤ 1" or "scrolled to the page's limit", and asserts the panel is in view, the scroll moved, and focus is on `#signalsQuietHead`. On a real term's document the page is taller and the panel reaches the top.
6. **The page adds no view.** ✅ ticked. `src/views.js` is not in `git diff --stat`; run evidence `{"before":{"view":"homeView","openView":"home","views":8},"after":{"view":"homeView","quiet":true,"panels":2}}` — standing on the grid writes `home`, `<main>` holds the same eight views, and a real `Page.reload` lands on `#homeView` with the quiet panel redrawn on arrival.

No 👤 and no 📆 line on this row; nothing here needs an iPad to close, though the owner will want to see the quiet panel on the device (it is a `SHELL` change — `CACHE` is now `planbook-shell-v117` — so force-quit from the app switcher first).

## What I could not verify, and what is honest about the checks

- The scroll landing on a tall real-term page (see line 5's note) — the harness proves the mechanism, not the geometry a real document produces.
- How the quiet panel *reads* to the owner on a real morning: the four chips' wording is mine (the mockup's is a drawing), and teacher-facing prose is a human reading.
- The doubled signals pass on a quiet morning (see "Known cost" below) is reasoned, not measured.

## Files changed

New:
- `src/glance.js` — five readers (`weekItems`, `queueRows`, `attentionHits`, `closingIn`, `quietMiddleRows`), `REVIEW_COUNT`, and `renderGlance()` (the quiet panel, or nothing).
- `src/glance.css` — § GLANCE lifted whole from `design/mockups/proposed-phase6.css`, `.gl-row`/`.gl-more`/`.gl-shut` and the coarse-block lines included.
- `tools/verify/glance-quiet.mjs` — twenty `check()` sites, nineteen firing on green.

Modified:
- `index.html` — `.gl-stack#glanceStack` wrapper in `#homeView` (class grid as first child, unchanged), a comment block explaining the stack and why the other panels are not in the markup, the `src/glance.css` link, and `tabindex="-1"` on `#signalsQuietHead` so the door can move focus there.
- `src/home.js` — one import, `renderGlance()` at the foot of `refreshHome()` on both branches, two header paragraphs. `classCard()` and every card helper byte-identical.
- `src/shell.js` — `import * as glance`; `showSignals(landing)` (showCalendar's shape, `resetSignals('')`, scroll + focus to the quiet panel, announce); the `[data-signals-open]` click route beside `[data-calendar-open]`; the hook catalogue entry; `glance` on the `window.planbook` seam.
- `src/calendar.js` — three engine-side reads: `eventsCovering(doc, from, to)`, `leadWindowOf(doc, from)`, `gradesDueIn(doc, from, to)`.
- `sw.js` — `./src/glance.css` and `./src/glance.js` in `SHELL`; `CACHE` v116 → v117. No apostrophe inside the array.
- `design/mockups/proposed-phase6.css` — index line and § GLANCE banner amended to "lifted whole by WO-6.7, 2026-09-15", with what the build declined; `design/mockups/README.md` split block likewise.
- `tools/verify-shell.mjs` — import + `BROWSER_SECTIONS` row for `glance-quiet.mjs`, placed after the three signals sections and before the restore-last section.
- `tools/verify/copy-class.mjs` — **outside this work order's deliverables**, see below.
- `tools/README.md` — count sentence 1344 → 1364; a WO-6.7 paragraph (1354 → 1373 executed) with the first-run story; "sixty-eight" → "sixty-nine" files.
- `TESTING.md` — § WO-6.7 (the hand reading, six ticked boxes, run figures, the mutation round, the declined temptations, the known cost).
- `plans/work-orders/phase-6-calendar-glance.md` — six boxes ticked; the *Open* paragraph gains the dispatch answer; a paragraph records the two decisions below. Status line untouched by me (`🤖 CLAIMED` is the orchestrator's).

## Decisions the work order did not settle, and which way I went

1. **The closing-in window is one horizon for all three kinds** — grades-due dates, term edges and the review count all inside `leadWindowOf()` (the teacher's own lead time, default 3 days). The row's text attaches "inside `leadDaysOf()`" only to grades-due and gives term edges and reviews no window; the mockup shows a review "this month" and a term end 52 days out. I chose the one setting the teacher already owns over inventing a second horizon nobody typed. **Consequence the owner should weigh:** a review count with a 3-day horizon is short notice for a legally binding date; the calendar month grid still shows the review with its date and name. Changing it is one line in `closingIn()` — but the horizon should then live in the engine, not in `src/glance.js`.
2. **The window questions went into the engine.** Rather than test `coversDate()` inside a reader or pick `kind === 'grades-due'` there, `src/calendar.js` gained `eventsCovering()`, `gradesDueIn()` and `leadWindowOf()` — the Traps line's "the ordering goes in the engine" applied to a range. This is the convention I am setting for later readers: a reader asks; it never selects.
3. **The week reader asks the derived engine kind by kind** (`assignmentDuesIn`, `termEdgesIn`) rather than `derivedItemsIn()`, because meeting states are panel 1's and would make every day with a class marked "non-quiet", and review dates are a count under closing-in, never a name in a week list. Choosing which question to ask is not filtering an answer; I say so at the import.
4. **`closingIn()` folds reviews into one built record** `{ derived:true, kind:'review-count', count, from, to }` — the one shape the file composes, on WO-6.4's ruling that a review is a count on this page. Names and student ids never enter the reader's return value (the harness searches the whole JSON for both).
5. **`queueRows()` rows carry `open`** — how many roster students the engine reported the assignment open for — so WO-6.8 can draw "N of M" without importing the engine, which its own Acceptance forbids. It is `.length` of an engine list, not a computation; named in the hand reading.
6. **No quiet panel with zero active classes.** A fresh document has nothing pending because it has nothing; the empty state on panel 1 is the honest sentence. A precondition, not the grid joining the decision.
7. **The quiet panel is created and removed dynamically, with its copy as constants in `src/glance.js`** — a departure from "teacher-facing copy lives in `index.html`", forced by a panel that exists only on a quiet day. Written out at the constants and in `index.html`'s comment. (A `<template>` would have been a new idiom for this repo; declined.)
8. **The door's hook is `data-signals-open="quiet"`** — the calendar door's shape one screen over, with the value naming the landing. WO-6.4's panel-4 header door can carry the same hook.
9. **`renderGlance()` is silent while the home view is not on screen** (leaving the DOM as is; every arrival repaints), for the reason `attentionCount()` returns 0 off-view. The readers themselves carry no such guard.
10. **The signals pass is shared and short-circuited**: the three cheap arrays are read first and the pass runs only if all three are empty, once per class, shared between hits and quiet middle.

## Outside the deliverables, done and reported

- **`tools/verify/copy-class.mjs`** — its fixture planted an open hall pass at the literal stamp `2026-09-15T09:00:00-04:00`, a future instant on every earlier run and, today, a pass 676 minutes overdue the moment its class opened: `src/attendance.js` announced it and the copy's `announce()` check read *"Wo122 Ashgrove has been out on a bathroom pass for 676 minutes."* — red on my first run with nothing about copying changed. It is now two minutes before the page's clock, under the first alert level, with the scar written at the line. This is WO-1.44's one-date collision in a fourth section; I fixed it because the brief requires a green harness and the failure was in harness scaffolding, and I am naming it here so the verifier does not read it as this work order's code.

## Temptations declined (both the parent row's)

- The class grid's subtitle in `index.html` still says the card "will also grow to carry" what it has carried since 2026-08-27; `index.html`'s own comment says to delete it, and the mockup does. It is panel 1, which this row asserts *unchanged*. Left for WO-6.4.
- The header caption over `#homeView` reads *Your classes* (`src/classes.js:579`); the mockup argues for *Today* once the view is five panels. Same reason; left for WO-6.4.

## Known cost, named

On a morning with nothing due, nothing to grade and nothing closing in, the signals pass runs once more per class than before (once for the cards, once for the page). Skipped whenever any cheap array is non-empty; shared between hits and quiet middle. WO-6.4 will want the hits on every render for panel 4 — whether `src/home.js`'s chip then reads `src/glance.js`'s array is that sitting's decision, noted in `src/glance.js`'s header.

## Sweep reviews this work order adds (both read, both fine)

- *sensitive field names outside src/backup.js* now lists `src/glance.js`: it names `reviewDatesIn()` and the review **count**; it emits no name, date or kind (the review probe searches the reader's whole output for `Wo67|studentId|Cara|reviewDate`).
- *CSS selectors added with no coarse-block rule*: `.gl-stack, .gl-list, .gl-row-main, .gl-row-go, .gl-foot-go, .gl-shut, .gl-quiet-mark, .gl-quiet-checked` — every one a container or a line of text, not a control. The quiet panel's one control is `.class-action-btn`, floored at 44px in `src/shell.css`'s coarse block.

## Mutation round — made and reverted

Three mutations planted together in `src/glance.js` under `MUTATION` comments (`WEEK_DAYS_AHEAD = 7`; the quiet decision dropping `closingIn()`; `attentionHits()` handing back the pre-cooldown pass). Run: `1373 checks · 1369 passed · 4 failed`, `EXIT=1` — exactly the four predicted (the chips check, the week-window check, the review-date check, the post-cooldown check), nothing else moved. **Reverted by copying the pristine file back before anything else was written** — `cmp` identical; `grep -rn MUTATION src tools` afterwards finds only the eight mentions that exist at `HEAD` (`src/shell.js:889`, `tools/README.md`, three older sections, `tools/wo-gate.mjs`) — and the reverted tree was re-run to the green figures at the top of this file before `TESTING.md`, `tools/README.md`, the phase file or this result were touched.

## Commands run (results read from their output)

- `node tools/wo-sweep.mjs` — baseline `42 · 39 · 0 · 3`; after the lift `42 · 38 · 0 · 4`; red once on the call-site count (1363/1364 vs 1344) until `tools/README.md` was updated; final `42 checks · 38 passed · 0 failed · 4 to review`.
- `node tools/verify-shell.mjs` × 4: run 1 `1366 checks · 1363 passed · 3 failed`, `EXIT=1` (copy-class date collision; my fixture's second rule; my helper throwing on the view it was on); run 2 `1373 · 1373 · 0 · 0`, 452s, `EXIT=0`; run 3 (mutated) `1373 · 1369 · 4 · 0`, `EXIT=1`; run 4 (reverted) `1373 · 1373 · 0 · 0`, 451s, `EXIT=0`.
- `node tools/wo-gate.mjs WO-6.7` — `PASS | gates clear for WO-6.7`; `node tools/wo-gate.mjs --audit` — `PASS`.
- `git status --short` / `git diff --stat` — twelve modified files and three new ones listed above, plus the two dispatch files the orchestrator created; 445 insertions, 21 deletions, no whole-file rewrites (line endings preserved, checked with `git ls-files --eol`).
- `grep -rn MUTATION src tools` — only pre-existing prose, as above.

## Draft CHANGELOG entry (for the teacher to accept, edit or drop — not written to CHANGELOG.md)

> **The home screen has become the first third of the glance page.** The class grid is the head of a stack of panels; on a day with nothing on the calendar this week, nothing waiting to be graded, no student needing a word in either direction and no deadline inside its warning, one panel under the grid says *Nothing needs you today* and shows what was checked. Its button, *The quiet middle · N*, opens the students nothing is wrong with. The panels for a busy day are the next two work orders'.
