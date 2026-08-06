# WO-1.13 — correction pass · implementer report

**Date** 2026-08-06 · **Branch** `phase/2-attendance` · **Base** `1f63186`, tree was clean
**Scope** the one failing acceptance line (3), per the "DECIDED BY THE OWNER, 2026-08-06" block in
`plans/work-orders/phase-1-shell-store-roster.md` § WO-1.13. Nothing else was reopened.
**Not committed** — the brief did not ask for it. The working tree holds the change.

---

## What changed, and where

**Cards enter, tabs switch.** The class tab strip is no longer drawn on the home view at all.

- **`src/classes.js` · `refreshClassBar()`** — the `onClassView` predicate it already computed now
  decides *whether* to draw the class tabs, not merely which one reads active. Three branches: no
  classes → "No classes yet." + "Add a class" (unchanged); classes and **not** on the class view →
  a caption and nothing else; classes and on the class view → "All classes", the class tabs, the
  "+". `const isOpen = cls.id === selectedId` lost its `&& onClassView` because the branch implies
  it. The block comment above it records the decision and why the first pass's "two renderings of
  one control" analogy failed.
- **`src/classes.js` · `homeTab()`** — lost its `active` argument and its `aria-current`. It is
  drawn only on the class view now, where the active tab is the class in `<main>` and this is the
  way out; there is nothing on the grid for it to be active among.
- **`src/shell.css`** — `.hdr-empty` gained `white-space: nowrap` (that strip scrolls; a caption
  that wrapped would push the header down over the screen). No new selector, no new control, so no
  new coarse-block line was owed — `.hdr-empty` is already in the coarse block at its own name and
  `.cls-tab-home` still declares 44px there, untouched.
- **`index.html`** — the header-bottom comment now says the left strip's content depends on the
  view, and that the divider, term nav and three icon buttons belong to both views.
- **`src/shell.js`** — three comments corrected: the `data-class-tab` hook list entry, the click
  branch that routes it, and `showHome()`'s note about what the repaint is for. No code change.
- **`src/home.js`** — the header comment's "the cards and the tabs are two renderings of ONE
  control" paragraph replaced with the decision as shipped, plus a note for the next phase: if a
  later screen wants a class switcher on the grid, it already has one — the cards. No code change.
- **`tools/verify-shell.mjs`** — see below.
- **`TESTING.md`**, **`plans/work-orders/phase-1-shell-store-roster.md`**, **`tools/README.md`** —
  evidence appended, counts corrected. `CHANGELOG.md` untouched.

### The two consequences the work order named

1. **The blank navy strip.** On the grid the strip carries a caption — the words **"Your classes"**,
   the home panel's own title, as a `<span class="hdr-empty">`: the idiom this row already uses to
   say "there is nothing to select here" ("No classes yet."). Muted, no background where every tab
   on the row has one, nothing to tap. Written down in the code comment with the alternatives that
   were rejected: **not** the row collapsed and **not** the strip hidden, because the divider, the
   term nav and the three icon buttons live on that row on both views, and a control that moves
   between views is worse than an empty patch of navy. Short on purpose — at 390px that strip
   measures ~109px beside a populated term nav, and a caption that scrolls out of its own strip is
   worse than no caption. Measured at 63×16px, inside the strip.
2. **Harness checks that navigated by header tab from the grid.** Re-pointed, none deleted; count up.

### Harness: before / after

| | before | after |
|---|---|---|
| `node tools/verify-shell.mjs` | **280 checks · 280 passed · 0 failed · 0 skipped** (measured on the untouched tree before starting) | **282 checks · 282 passed · 0 failed · 0 skipped** (measured four times, identical every time) |
| `node tools/wo-sweep.mjs` | 11 checks · 10 passed · 0 failed · 1 to review | unchanged: 11 · 10 · 0 · 1 (the standing sensitive-field-name grep) |

What moved inside that number:

- **Two added**, both measuring acceptance line 3 directly, as *controls a teacher could tap right
  now* (`offsetParent !== null`) rather than as markup — both sets exist in the DOM at all times, so
  a count of the markup would report the same number from either screen. On the grid: 6 cards, 0
  header class tabs, 0 active tabs, 0 ways-back offered, caption drawn at 63×16px inside its strip.
  On a class: 6 header tabs, 0 cards, exactly 1 active tab, 2 "All classes" doors.
- **Five re-pointed** in the classes section: a guarded `toClassView()` helper enters through the
  card a teacher taps before anything is read off the strip, because that is where the strip lives
  now. Every mutation those checks assert happens *after* that arrival, so it paints none of their
  answers. Called twice — once at the top of the section, once before the archive near the end.
- **One re-aimed**: the year-switch check. Switching to a year with no classes correctly lands on
  the grid and switching back leaves it there, so "that year's classes came back" is now counted on
  the cards. It keeps its teeth: `refreshClassBar()` draws *both* halves of the header row, so the
  term nav coming back with four labels is still proof the year-switch chain called it.
- **One tightened**: `__att().homeDoors` now counts only doors on screen. That check read 2 from
  either view before, which could not tell "two ways back from a class" from "a way back offered on
  the screen you are already on". It still asserts 2 on the class view (the reload check) and now
  asserts 0 on the grid.
- **One helper changed gesture**: `openTab(id)` used to click a header tab from wherever it was.
  There is no such thing as tapping a class tab from the grid any more, so it now does what a
  teacher does — go home, enter *another* class by its card, then switch with the tab. The check it
  feeds ("the 'All classes' tab in the header, from a class opened off the header tab row") is
  therefore stronger than before, not weaker.

**Mutation proofs, both run and both reverted** (the `tools/README.md` convention for added checks):

- `onClassView = true` — the tabs drawn on the home view again, i.e. exactly the defect the owner
  reported — turns **two** checks red, including the new grid one, which reports "6 card(s) and 6
  header class tab(s) on screen".
- the caption blanked — turns **one** red ("the strip is EMPTY"), which is the "must not read as a
  blank navy strip" half.

---

## Against the Acceptance list, item by item

1. **Selecting a class from the header changes what is in `<main>`, without opening a dialog.**
   Verified, unchanged and still green — and now also exercised as a genuine *switch* between two
   classes by `openTab()`. Harness: "and so does the 'All classes' tab in the header, from a class
   opened off the header tab row", plus the new class-view check.
2. **Attendance is marked in the main area, with no overlay above the class cards.** Verified,
   untouched by this pass; all attendance-section checks green, `dialogs.length === 0` throughout.
3. **Exactly one control means "work on this class now", and a second control that means something
   different can be told apart from it in words.** **Closed.** Driven, not inferred: on the grid the
   only visible control carrying `data-class-tab` is the card (6 of them, 0 header tabs); on a class
   the only visible one is the header tab (6 of them, 0 cards); the second control is "All classes"
   in words, on the class view only, where the thing it is telling itself apart from is beside it.
   Both directions are one tap through the real controls in the harness, and the mutation proof
   shows the check catches the old build. This is the line I am ticking, and that is the evidence.
4. **Returning to the class grid is one tap from any view, and the tap is findable without being
   told where it is. 👤** **Left blank.** The one-tap half is measured (both doors driven through
   real clicks); "findable without being told" needs a human on the device and I do not have one.
   Not ticked.
5. **`verify-shell.mjs` runs green with no fewer checks than before.** Verified by measurement, not
   assumption: 280 → 282, 0 failed, 0 skipped, four runs. No check deleted.
6. **Class manager, term editor, roster paste, student editor still open as modals and still work.**
   Verified — the whole classes and roster sections still drive them and are green; this pass added
   a card tap *before* the class manager opens in two places and nothing else near them.
7. **Reloading with a class selected returns to that class's view.** Verified — "a reload taken from
   a class comes back to that class's view, not to a blank main area or the grid" is green, and
   `savedView()`/`showView()` in `src/views.js` were not touched.
8. **Presentation mode still suppresses every support field on every view.** Verified — "the
   registry in the main area carries no support data in either mode, on a class of 26 with plans on
   file" is green, and the mode is left off. Nothing in this pass touches supports or a data path.

**What I could not verify** — anything needing the device or human eyes:

- Whether the caption reads as a *caption* or as a strip that failed to load. It is the judgement
  call this change turns on and no harness can make it. Added as a 👤 line in `TESTING.md`'s
  WO-1.13 sitting list, alongside the four already there.
- The 👤 line 4 above, unchanged and still owed.
- How the strip looks on a real 390px screen in portrait with a long term label beside the caption.
  The harness measures overflow at 390px on the class view (green); the grid's caption I measured
  only at the harness's default window.

---

## Decisions I had to make that the work order left open

- **What the row shows on the grid.** A caption, not a collapsed row and not a hidden strip. Reason
  in the code comment and above: the right-hand half of that row belongs to both views, and moving
  those three icon buttons between screens costs more than an empty patch of navy. The wording is
  the home panel's own title so the header names the screen that is up — which is the same job the
  active tab does on the class view.
- **The "+" add-class tab does not appear on the grid.** It is a door onto a *task*, so keeping it
  would not have violated the decision — but it belongs at the end of a row of class tabs ("here are
  your classes, add another"), and with no tabs it is an orphan. The gear beside it on the same row
  (`data-class-manage`, "Classes and terms") is on both views, and the grid's own empty state
  carries its own door on a fresh document. Two doors on the grid instead of three.
- **The `.hdr-empty` caption is the same class as "No classes yet."**, not a new one. One idiom for
  "this strip has no tabs on it", per the suite rule against a sixth on-dark treatment in a 48px
  strip. That is also why the harness reads the caption through `.hdr-empty`.
- **Where the re-pointed classes-section checks read the strip.** I chose "navigate to the class
  view and keep the assertion verbatim" over "move the assertion to the cards", everywhere except
  the year-switch check where navigating first would have made the repaint I was observing come from
  `selectClass()` rather than from the year-switch chain. Named here because it is the one place the
  check's subject changed.

## Temptations declined (out of scope, noted rather than acted on)

- The term nav still sits on the grid describing a class that is not on screen. That is the state
  WO-1.13 shipped and the verifier passed; the owner's decision names the *class tab strip* and
  nothing else, so I left it. If it ever reads wrong, it is a one-line change in the same function.
- The grid's caption could carry something a teacher wants at a glance — a count, the date, "2 still
  to take". Every version of that is a Phase 4/6 feature arriving through the back door of a header
  strip, and it would duplicate what the cards already say. Declined.
- `refreshClassBar()` is long enough to want splitting into "draw the strip" and "draw the term
  nav". Not this work order.

## Files changed

- `C:\dev\planbook\src\classes.js`
- `C:\dev\planbook\src\shell.css`
- `C:\dev\planbook\src\shell.js` (comments only)
- `C:\dev\planbook\src\home.js` (comments only)
- `C:\dev\planbook\index.html` (comment only)
- `C:\dev\planbook\tools\verify-shell.mjs`
- `C:\dev\planbook\TESTING.md`
- `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`
- `C:\dev\planbook\tools\README.md`

Not touched: `CHANGELOG.md` (human-owned), `src/views.js`, `src/attendance.js`, `src/prefs.js`, and
the Status line, which stays 🔨 IN PROGRESS with the 👤 iPad sitting still owed.

## A note on line endings

`src/classes.js` was briefly rewritten to CRLF by the scripted mutation I used for the two proofs
above, which made `git diff` report 2,309 changed lines. It is back to LF and the diff is 60/21.
Flagging it because a future scripted edit on Windows will do the same thing silently.
