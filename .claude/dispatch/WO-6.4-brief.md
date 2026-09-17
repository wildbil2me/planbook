# WO-6.4 — The glance page · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-6-calendar-glance.md`
**Report to** `.claude/dispatch/WO-6.4-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): panel 4 draws named students in trouble and must shut under a projector, which puts this squarely on a sensitive surface — presentation mode — plus a `supports` non-disclosure line and a 👤 design reading (ROUTING.md § "Route to Claude", first bullet). The runner-up consideration was that the panel mostly draws an array WO-6.7's reader already returns, which is Codex-shaped work; the sensitive surface decides it, so no Codex probe was run.

**The owner's number is answered: FOUR.** Mr Toomey chose four rows per column — concern and praise alike — before the `and N more ›` foot row (answered 2026-09-16, at dispatch, as the work order asks). It is already recorded in the work order's *Open — the owner's number* section, README running-order row 24 and `design/mockups/README.md` question 12; do not re-open it, and do not re-record it. A column with four or fewer hits draws no foot.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-6.4 — The glance page

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-16 · **Size** M · **Depends on** WO-6.7, WO-6.8, WO-4.5, WO-3.26
**Closes roadmap** Phase 6 → "The glance page"

*(**Cut into three on 2026-09-15, owner-directed, and this row is the last of the three.** It was an
L with eight Acceptance lines, and the reason for the cut is the window and not the work. A median
dispatch costs ~6M weighted units and the session-limit deaths cluster at 16–20M — WO-1.39's own
figures — so one L is roughly a whole window, which is the shape behind every dead dispatch in
`plans/dispatch-retro.md`: ten session-limit deaths by WO-1.38's audit, every one at a handoff. A pause inside a dispatch was weighed the same day and declined: a cooperative pause needs
the agent to take one more turn, and the limit removes exactly that turn — the WO-4.5 scar of
2026-08-28 — while the stops the pipeline already has, `--start` and the implementer's return since
WO-1.38, are seams with a recovery path behind them. **So the seams are work orders.**
[WO-6.7](#wo-67--the-glance-pages-stack-its-readers-and-the-quiet-day) builds the stack, the readers
and the quiet day; [WO-6.8](#wo-68--today-and-this-week-waiting-to-be-graded-and-closing-in) draws the
three panels a live term has already confirmed the sources of; what stays here is **panel 4 — the one
that draws Phase 4 — and the lines about the page as a whole.** That is also the line the running
order's *"not before ~Sep 16"* caution was drawn along: panels 2, 3 and 5 read calendar items, the
ungraded count and lead-time deadlines, all in daily use since Sep 2, and only this panel draws a
signal a real term has not yet confirmed. **Size dropped L → M.** Three Acceptance lines left with
their panels, none of them ticked; WO-6.1's `**Owes**` pointer moved with the grades-due line to
WO-6.8. The split is WO-8.5 → WO-8.12's shape — one part was ready and the rest was not.)*

**Why it exists.** This is what WO-1.10's home screen has been accreting toward since Phase 1. It
is a **launcher, not a report** — every item taps through to the thing that resolves it.

**It is `#homeView` grown, not a sixth view** *(the open question WO-1.25 named, answered here
2026-08-19)*. WO-1.10 says the home screen becomes the glance page and `src/home.js` says the same in
its own header; `src/views.js` reserves its one Phase 6 line for the **calendar**, which WO-6.3 takes.
So `VIEWS`, `CLASS_SCREENS` and `REMEMBERED_AS` are untouched here, `DEFAULT_VIEW` still reads `home`,
and what is in scope is the card and the panels inside a view that already exists. The slots this
fills were reserved by name: `src/home.js` appends `.class-card-signals` empty and `src/home.css`
holds its height, so that the first real datum reflows nothing. *(Since the cut, the stack itself is
WO-6.7's and the no-new-view line sits there, because that is the row that touches `#homeView` first.
This row inherits it.)*

**The page is drawn, and the drawing was here before the pointer was** *(2026-08-20)*.
[`design/mockups/glance.html`](../../design/mockups/glance.html) has drawn this page twice — a Tuesday
with things on it, and the quiet day that is what the owner will actually see for the term's first six
weeks — since 2026-08-19, and nothing in this work order said so until now. **Read it before
building**, and lift `design/mockups/proposed-phase6.css` § GLANCE rather than re-deriving it: that
section is written to become `src/glance.css` almost as-is, and it links `src/home.css` directly so a
drawing cannot quietly disagree with the card slot it fills. *(**Redrawn 2026-09-15 against the built
half**, three ways — the Tuesday, the same Tuesday while projecting, and a quiet day two weeks into a
term. `design/mockups/README.md` § "Redrawn against the built half" lists what the redraw deleted
from § GLANCE and why: the card is worn exactly as shipped, and panel 4's two columns are WO-4.2's
`.sig-two` / `.sig-col` / `.sig-col-head` worn as shipped, because a summary of that screen draws that
screen's rows. Questions 10–14 there are this cut's: 10 and 12 land in this row, 11 and 14 in WO-6.8,
13 in WO-6.7.)*

**This pointer is late by one work order, and the cost is already recorded.** § CALENDAR was drawn the
same morning and WO-6.3 built the calendar without a line pointing at it: twenty-eight `.cal-*`
classes proposed, twenty `.calendar-*` shipped, not one name carried across. Re-derived rather than
lifted, and nothing noticed until `tools/wo-sweep.mjs` § 19 was written a day later.
`design/mockups/PROTOCOL.md` rule 9 is that scar made a rule — a room is not finished until the phase
file points at it — and § 19 now fails a build whose drawing names an unbuilt work order that does not
point back.

**What the drawing settles for this page.** Five panels stacked in `.main`, each a `.panel` with its
own header and destination; concern and praise at `1fr 1fr` with **praise first** below the phone
breakpoint; and a quiet day is **one** panel with its warrant on it — four chips saying what was
checked — rather than five empty ones. *(This paragraph ended, until 2026-09-15, by calling the chip
in `.class-card-signals` "the open one" — whether a card that says how many is a launcher when the
card cannot tap through to who. **It is not open and has not been since 2026-08-27**: WO-3.26 and
WO-4.5 both shipped their chip as a `<span>` inside the card's one `<button>`, and `src/home.js` says
in its own words that the chip says how many and the screen behind the Signals segment says who.
Decided by two landings rather than a ruling, and the mockup README's question 8 records it the same
way. The work order said so last, which is the wrong order.)*

**Deliverables** — in the order a teacher needs it at 7:40am. Panels 1, 2, 3 and 5 are WO-6.7's and
WO-6.8's now, listed here only so the order is stated in one place:
1. *Every class with today's state — taken · dropped · not yet — each with a one-tap fix.* Built —
   WO-2.1's `.class-card-state` on WO-1.13's card — and asserted by WO-6.7 as panel 1 of the stack.
2. *Today's and this week's events.* WO-6.8.
3. *What's waiting to be graded.* WO-6.8, over WO-3.26's engine call.
4. **Who needs attention — concern and praise, post-cooldown, from WO-4.5. This row.** The panel is a
   summary and the list it summarises is WO-4.2's screen, so every row here taps through to that
   screen's card rather than expanding in place. Ranked the way WO-4.2 ranks: **attendance first, then
   the biggest change** — the owner's severity ruling of 2026-08-20, which this page inherits rather
   than re-decides. The rows are drawn from the array WO-6.7's reader returns — the same
   `applyCooldown()`'d hits the card's `N need you` chip counts — so the chip and the panel cannot
   disagree. Two columns, `.sig-two` / `.sig-col` worn as shipped, praise first below the phone
   breakpoint; the cooldown foot under each column is a **door** onto the screen's suppressed rows
   rather than the expansion it is there; and a foot row `and N more ›` after the first few rows of a
   column, opening the full list, because a summary that draws twelve is the list it was meant to
   summarise. **`The quiet middle · N` is a door onto that screen**, landing on it scrolled to its
   quiet-middle panel — the owner ruled on 2026-08-20 that the quiet middle is a panel there and not
   a surface of its own. *(It lives in this panel's header on a day this panel exists, and on the
   quiet panel — WO-6.7 — on a day it does not; one control, two homes, never both at once.)*
5. *Deadlines closing in, including grades-due lead times.* WO-6.8.

**Under a projector this panel shuts, the way the screen it summarises shuts** *(the redraw's
question 10, 2026-09-15)*. Panel 4 is a list of named students in trouble, which is exactly what
WO-4.2's screen refuses to draw under a projector, and the glance page is the one an iPad is most
likely to be on when the cable goes in. `src/home.js` is deliberately absent from
`flipPresentationMode()`'s redraw list, with a note saying what would change that — **this panel is
what changes it**: the glance module joins the list, and the flip redraws the page without a reload.
Drawn shut (`.gl-shut`) with the counts kept, as the proposal; the counts are the card's own and were already on
the wall.

**Open — the owner's number** — *how many rows before `and N more ›`?* Drawn at three per column
because three fired. With 118 students and nine rules a Monday in November can put twelve in the
concern column. Proposed: **four**, then the foot. Answer it when dispatching, not in the editor.
*(**Answered at dispatch, 2026-09-16, by the owner: four.** Four rows per column — concern and praise
alike — then the `and N more ›` foot. Relayed by the coordinator and recorded in
`.claude/dispatch/WO-6.4-status.md`*.)*

**The review item is a count, not a name** *(owner's call, 2026-08-19, WO-1.25)*. This page shows
`1 review coming up`, and the student's name is one tap away on the calendar — a surface she
deliberately opened. It discloses strictly less than the roster dot that has shipped since WO-1.7,
which says that a student has something on file at all, and it is this page's own grammar: a launcher
says how much is waiting and the surface it launches says what. The alternative reading of the old
fifth box — no review date on this page in any form — put the one deadline a teacher is legally
obliged not to miss on the month grid she has to go looking for, and off the page she opens every
morning. *(The row that draws it is WO-6.8's; the ruling stays here because this is the work order
that made it.)*

**Acceptance**
- [ ] The five sections appear in that order, and every item in every one taps through. *(The page's
      line, kept on the last row: WO-6.7 and WO-6.8 each assert their own panels, and this is the
      one that walks all five.)*
- [ ] Every student in the concern and praise columns taps through to that student's signal card on
      WO-4.2's screen, and the count of students drawn here plus the `and N more ›` foot equals the
      sum of the cards' `N need you` chips — one array, counted on the card and drawn here.
- [ ] 👤 The praise list is present and delta-ranked — not buried behind the concern list. Present is
      measurable and *not buried* is the owner's reading of her own page, which is why this line needs
      her and not a selector count. *(The redraw's question 9 rides on this reading: five panels is a
      long page on a tablet, and "who needs you" is two scrolls down at 7:40am unless something
      changes. Reorder is ruled out; collapsing short panels to a count, or two columns above 1024px,
      are not. Read on the real iPad.)*
- [ ] With presentation mode on, no student's name from a signal is on the page — the panel is shut
      with its counts kept, exactly as `src/signals-view.js` shuts — and turning the mode on with the
      page open redraws it without a reload. `src/glance.js` is on `flipPresentationMode()`'s redraw
      list, and the note in `src/home.js` that said what would put it there is updated to say it did.
- [ ] Nothing on this page renders a **plan type**, an **accommodation**, **medical text** or
      **behavior-plan text**, in presentation mode or out of it. The only `supports`-derived thing
      that reaches it is the review **count** — `1 review coming up`, with no name, no date and no
      kind — so a `Ctrl+P` taken here emits none of the four either. *(Reworded from "nothing on the
      page displays `supports` data" on 2026-08-19, WO-1.25. The old line was mechanically checkable
      and this one is not; naming the four fields is what keeps it testable, and the count above is
      the thing the old wording would have forbidden.)*
- [ ] 👤 The page loads in under a second on an iPad with a full year of data.

**Traps** — Every section here is a summary of something built earlier. If any of it recomputes
grades, attendance percentages, or signals rather than calling WO-2.4 / WO-3.4 / WO-4.1, you have
created a second answer that will eventually disagree with the first. **Since the cut the readers are
WO-6.7's**, in `src/glance.js`, and this row draws their arrays: an `evaluate()` or `applyCooldown()`
call added in this panel's code is the second answer arriving by the front door.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `design/mockups/PROTOCOL.md`
  - `design/mockups/README.md`
  - `design/mockups/glance.html`
  - `design/mockups/proposed-phase6.css`
  - `plans/dispatch-retro.md`
  - `src/glance.css`
  - `src/glance.js`
  - `src/home.css`
  - `src/home.js`
  - `src/signals-view.js`
  - `src/views.js`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/shell.js` `flipPresentationMode()` (~line 1686) — the redraw list.
- `src/signals.js` / `src/signals-view.js` — how WO-4.2's screen ranks (attendance first, then the biggest change; `PRAISE_RANK` for praise) and how it shuts. Wear that, do not re-derive it.
- `tools/verify/glance-quiet.mjs`, `concern-list.mjs`, `praise-column.mjs`, `cooldown-quiet.mjs` — the sibling harness modules; add yours beside them rather than a new harness.

**Traps the work order does not spell out, found reading the tree at dispatch:**

1. **Half of Acceptance line 4 is already true, and the other half is stale.** `src/glance.js` has been on `flipPresentationMode()`'s redraw list **since WO-6.8** (see `src/glance.js` ~line 108 and the comment inside `flipPresentationMode()`), because the review count needed it. What is *not* done: `src/home.js` ~line 76 still says the home module is "deliberately absent" from that list with the condition that would change it — that note is the one line 4 wants updated to say panel 4 is what met the condition. Do not add a second call to the list; check whether the existing one repaints panel 4, and prove the flip-with-page-open path in the harness.
2. **No `evaluate()` or `applyCooldown()` in your panel code.** Draw `attentionHits()`'s array (WO-6.7). The count on the card chips and the rows here must be one array — Acceptance line 2 is the arithmetic that proves it, so assert it against the chips' own numbers, not a recomputed total.
3. **Shut means not drawn, not hidden.** Under presentation mode no student name from a signal may be in the DOM (a `Ctrl+P` reads the DOM, not the paint). Counts kept, no "N hidden" line beyond the counts the card already shows. `.gl-shut` is already in `src/glance.css`.
4. **The quiet-middle door has exactly one home at a time** — panel 4's header on a day panel 4 exists, the quiet panel on a day it does not (WO-6.7 built the latter). Never both.
5. **Taps land on WO-4.2's screen at that student's card**; the cooldown foot and `and N more ›` are doors onto that screen, not in-place expansions.
6. **Mutation discipline** (AGENTS.md): if you plant a mutation to prove a check non-vacuous, revert it before you write anything else, and `grep -rn MUTATION src tools index.html` must be empty before you report. `verify-shell.mjs` is ~4–5 min a run; budget for it.
7. Bump `CACHE` in `sw.js` if you touch any file in `SHELL`.

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

1. The five sections appear in that order, and every item in every one taps through. *(The page's line, kept on the last row: WO-6.7 and WO-6.8 each assert their own panels, and this is the one that walks all five.)*
2. Every student in the concern and praise columns taps through to that student's signal card on WO-4.2's screen, and the count of students drawn here plus the `and N more ›` foot equals the sum of the cards' `N need you` chips — one array, counted on the card and drawn here.
3. 👤 The praise list is present and delta-ranked — not buried behind the concern list. Present is measurable and *not buried* is the owner's reading of her own page, which is why this line needs her and not a selector count. *(The redraw's question 9 rides on this reading: five panels is a long page on a tablet, and "who needs you" is two scrolls down at 7:40am unless something changes. Reorder is ruled out; collapsing short panels to a count, or two columns above 1024px, are not. Read on the real iPad.)*
4. With presentation mode on, no student's name from a signal is on the page — the panel is shut with its counts kept, exactly as `src/signals-view.js` shuts — and turning the mode on with the page open redraws it without a reload. `src/glance.js` is on `flipPresentationMode()`'s redraw list, and the note in `src/home.js` that said what would put it there is updated to say it did.
5. Nothing on this page renders a **plan type**, an **accommodation**, **medical text** or **behavior-plan text**, in presentation mode or out of it. The only `supports`-derived thing that reaches it is the review **count** — `1 review coming up`, with no name, no date and no kind — so a `Ctrl+P` taken here emits none of the four either. *(Reworded from "nothing on the page displays `supports` data" on 2026-08-19, WO-1.25. The old line was mechanically checkable and this one is not; naming the four fields is what keeps it testable, and the count above is the thing the old wording would have forbidden.)*
6. 👤 The page loads in under a second on an iPad with a full year of data.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

