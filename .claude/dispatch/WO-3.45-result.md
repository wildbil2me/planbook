# WO-3.45 — result

**Implementer:** Claude (Opus), 2026-10-04. Not committed. Status row left at `🤖 CLAIMED` as instructed.

## What changed

The tap now means "same screen, different class" on Assignments and Scores. I added nothing new to make that happen; it goes through code that was already there:

- **`src/classes.js` `selectClass()`.** The stays-up list now holds `calendar`, `signals`, `assignments` and `scores`. The comment heading said "TWO SCREENS"; it now says "FOUR". A new paragraph gives the owner's ruling and explains why these two are a different kind from the first two (screens OF a class, so there is no filter to move). It says **`detail` is left off on purpose** because the student is not in the other class. It also says this is not a per-class memory: `REMEMBERED_AS` is untouched, and a card or a reload still lands on Attendance. The function-level comment's sentence about "Period 2's score grid" is kept, with a dated note saying it is the reasoning that ruling reversed.
- **`src/shell.js` `data-class-tab` branch.** After `selectClass()` and `resetRegistry()` (both still in place), there is a new branch for Assignments and Scores. It calls `home.refreshHome(); showClassScreen(views.currentView()); return;`. This is the same tail `openClassOn()` already uses, and `showClassScreen()` is the arrival the switcher pill uses. There is **no second painter and no second copy of the resets**, and it is not modelled on `setCalendarFilter()`; the branch's comment says why. I corrected three comments:
  - the comment above the branch, which said the calendar and the concern list were the only screens of that kind;
  - the `resetScoreSearch()` comment, which said "a class tab leaves the grid for Attendance, so there is no second door to reset". It now names the tab as the second door, reset by routing it through the arrival path;
  - the hook inventory's `data-class-tab` row.
- **`src/screen-nav.js` is unchanged, deliberately.** `refreshScreenNav()` already marks `currentView()`, and `showClassScreen()` calls it. So the switcher marks the screen that is up with no edit there. The harness asserts this on all six strips.
- **`src/views.js` is unchanged.** `REMEMBERED_AS` is not touched, per the Traps.
- **`sw.js`.** `CACHE` goes from `planbook-shell-v165` to `planbook-shell-v166`.
- **`plans/work-orders/phase-3-gradebook.md`.**
  - Added a dated italic note under WO-3.3's *"Opening a class lands on Attendance every time"* line. It says a header tap from Assignments or Scores now keeps the screen, links WO-3.45, and says the line is not reopened. **Its `[x]` is untouched.**
  - Ticked WO-3.45's Acceptance lines 1–7. The 👤 line stays `[ ]`.
- **The harness.**
  - New section **`tools/verify/class-tab-keeps-screen.mjs`**, registered after `verify/score-search.mjs` (one import, one `BROWSER_SECTIONS` row with a comment). It has 9 `check()` call sites; one is the fixture guard's failure arm.
  - **`tools/verify/assignments.mjs`.** The two WO-3.3 checks (old ~799 and ~809) are rewritten in place to the new ruling, not deleted. One new check is added beside them for the no-per-class-memory half.
- **`tools/README.md`.** The call-site count goes from 1753 to 1763, with a WO-3.45 paragraph after WO-3.33's (executed count 1760 to 1769, gap from −7 to −6).
- **`TESTING.md`.** New § WO-3.45 at the foot of Phase 3, with the mutation table.

## Every reset the arrival path performs, and that the tap now performs

The tap runs `selectClass()` → `attendance.resetRegistry()` → `home.refreshHome()` → `showClassScreen(view)`. Inside `showClassScreen()`, for these two screens:

| Reset | Where | Performed by the tap? |
|---|---|---|
| `scores.resetScoreSearch()`: the search text is emptied and the box value cleared | `showClassScreen()`, `want === 'scores'` | Yes, same call. Asserted: B's box is `""`, no count is shown, and all of B's rows are drawn. Mutation-proved by M2. |
| `scores.resetScoreCategory()`: the category pill goes back to *All* | `showClassScreen()`, `want === 'scores'` | Yes, same call. Asserted: *All* is the only pressed pill. **This is defence in depth, not mutation-proved alone** (see below). |
| `calendarView.resetCalendar()` / `signalsView.resetSignals()` | `showClassScreen()` | Not applicable: these only run for `calendar`/`signals`, and those still take their own filter branch. |
| The assignment list | — | Has no arrival reset. `showClassScreen()` only does `showView`, `refreshClassBar`, `refreshScreenNav` and `paintClassScreen` for it. Its modal state is untouched, and since the editor is modal no tab can be tapped while it is open (checked at booking). |
| `attendance.resetRegistry()` | The tab branch, as before | Yes. It still runs on every class tap, unmoved (Traps). |

`showClassScreen()` also does `refreshClassBar()`, `refreshScreenNav()` and `paintClassScreen()`, and announces *"Scores for <class>."*. The tap therefore produces two announcements: `selectClass()`'s *"<class>, Q1 is open."* followed by that one. `openClassOn()` (the *Waiting to be graded* door) already behaves this way. Under the 30 ms live-region deferral I would expect the second to win, but I did not check that on a screen reader.

## Acceptance, line by line

Evidence for lines 1–7 is the full run on the delivered tree: **`1769 checks · 1769 passed · 0 failed · 0 skipped`, 56,411 lines, 31.9 lines per check, 789s, EXIT=0**, read from the log's own `EXIT=` line (2026-10-04, real clock). `node tools/wo-sweep.mjs` on the final tree printed **`48 checks · 45 passed · 0 failed · 3 to review`**, with § 11 reading 1763 sites matching `tools/README.md:1256`.

1. **[x] Assignments A → tap B → B's list; the B tab is active; the switcher marks Assignments.**
   - `class-tab-keeps-screen.mjs`: English III's heading and its three assignment names, none of English I's. `aria-current` and `.active` are on B only. All 6 strips mark `assignments`. A second tap back to A shows A's list the same way.
   - Also in `assignments.mjs` on that section's own classes: the heading equals `dst.name`, and on every strip `active[1]` is true and `active[0]` is false.
2. **[x] Scores A → tap B → B's grid.** Rows equal B's 3 students, columns equal B's 3 assignments, 9 cells. No A id appears in rows, columns or cells. B's tab is marked and the strips mark `scores`. Mutation-proved (M1).
3. **[x] Detail → tap another class → Attendance.** Rhea's detail in B is opened by her name on the grid, then A's tab is tapped. Result: `classView`, A's 3 registry rows, the A tab marked, strips marking `class`.
4. **[x] A card still opens on Attendance, and a reload from either screen lands on Attendance.**
   - `assignments.mjs`'s card check (*"entering a class from its card lands on Attendance…"*) is unchanged in text and green.
   - The reload from the assignment list (`assignments.mjs`, unchanged) is green.
   - A new check reloads from the score grid: `planbook_openView` holds `"class"` while the grid is up, and the registry is what comes back.
5. **[x] `assignments.mjs`'s two checks are rewritten, not deleted, and the memory half survives.** The two checks now assert B's Assignments and then A's again. The new check leaves the source class on Scores, goes home, and opens the other class from its card: it lands on Attendance and Scores is not shown.
6. **[x] Search and category reset; the typed score lands in A only.**
   - A's grid is narrowed to "Ashby" plus the *Essays* pill. A guard check confirms the narrowing really happened: 1 row, 1 column.
   - After the tap, B's grid shows an empty box, no count, *All* pressed, and none of A's category ids.
   - A 73 typed key by key into Odette's essay, with no flush before the tap, is read after `store.flush()`: A's cell `v === 73`, and the only B cell in the document is the planted one (`a345b-reading/wo345b-s1=8`).
   - The search half is mutation-proved (M2).
7. **[x] `CACHE` bumped**, v165 to v166. `wo-sweep` § 9 is green.
8. **[ ] 👤 iPad.** Not ticked, because I have no device. The owner needs to check, after a force-quit, that Assignments and Scores each stay up across two class taps and that detail drops to Attendance.

## Mutations run and reverted

Both mutations were made **in throwaway copies of the tree under the session scratchpad, never in the repository**. The two runs went concurrently. In the repository:
- `grep -rn "MUTATION M" src tools sw.js index.html` returns nothing.
- `grep -rn MUTATION` over the delivered files (`src/classes.js src/shell.js sw.js tools/verify/class-tab-keeps-screen.mjs tools/verify/assignments.mjs tools/verify-shell.mjs index.html`) returns only the long-standing prose at `src/shell.js:984` (*"A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE"*).

| Mutation | Result |
|---|---|
| **M1**: `scores` dropped from `selectClass()`'s stays-up list | `1767 checks · 1763 passed · 3 failed · 1 skipped`, 795s, EXIT=1. Red: (a) the B-grid check, because view was `classView`; (b) the arrival check, because the box still read "Ashby" and *Essays* was still pressed; (c) the section's containment line, because the detail step had no name to tap. |
| **M2**: the tab branch paints the screen itself (`refreshClassBar(); refreshScreenNav(); paintClassScreen()`) instead of `showClassScreen()`, i.e. a second painter with no resets | Same totals, 791s, EXIT=1. Red: (a) the B-grid check, with rows `[]` and cols `[]` because A's "Ashby" narrowed B to nobody; (b) the arrival check (box "Ashby", *0 of 3 students*); (c) containment. The 73 check stayed green, correctly. |

In both mutated runs the section threw at the detail step, because the grid had no name to tap. `runSection()` contained the throw and recorded it as a FAIL. Only the detail and reload checks plus the teardown were lost; the cleanup did not run in the copy. That only affected the copies.

## What I could not close, and honest limits

- **The 👤 line.** It needs the iPad.
- **The category-pill reset is not separately mutation-provable with this fixture.** Under M2 the pill still came up on *All*, because `renderScores()` already drops a `categoryId` the class has no pill for (`src/scores.js`, `if (categoryId && !withWork.some(...)) categoryId = ''`). Category ids are minted fresh per class (`copyCategories()` calls `newCategory()`), so removing `resetScoreCategory()` alone would leave every check green. The tap does perform the reset, because it goes through `showClassScreen()`. A fixture where B carries a category with A's id (reachable only through a restored or hand-edited document) would make this provable. I did not add one; it is noted in `TESTING.md` as defence in depth.
- **The sweep's 3 REVIEW items** (sensitive-field mentions, due-date beside late/missing, the mockup banner) are standing items about files and topics this work order did not touch. My `src/` additions contain none of the sensitive names (I grepped the added lines). I did not re-run the sweep on the pre-change tree to prove they predate me.

## Decisions the work order did not settle

1. **A new section file rather than extending `score-search.mjs`.** The Scores, detail and reload claims need a two-class fixture that shares nothing. `score-search.mjs` is WO-3.29's single-class surface. Line 5's checks went into `assignments.mjs` as the work order names. This follows tools/README § "Where a new check goes". It is not a second harness.
2. **The new branch is two lines (`home.refreshHome(); showClassScreen(...)`) rather than a call to `openClassOn()`.** Calling `openClassOn()` would either run `selectClass()` and `resetRegistry()` twice, or require restructuring the branch so the existing `resetRegistry()` line moved. The Traps say to leave that line in place.
3. **The `scores` reload check lives in the new section**, because `assignments.mjs` only reloads from the list and line 4 says "from either screen".

## Temptations declined (out of scope)

- Adding a shared-category-id adversary to make the pill reset mutation-provable (see above). It would be a fixture change for a reset this work order only had to route.
- Collapsing the double announcement on a tab tap. `openClassOn()` has the same shape, and changing either is a live-region decision outside this row.

## Files changed

- `c:\dev\planbook\src\classes.js`
- `c:\dev\planbook\src\shell.js`
- `c:\dev\planbook\sw.js`
- `c:\dev\planbook\tools\verify\class-tab-keeps-screen.mjs` (new)
- `c:\dev\planbook\tools\verify\assignments.mjs`
- `c:\dev\planbook\tools\verify-shell.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` (this file was already modified by the orchestrator's claim before I started)

I found no CRLF churn: `git diff src/ sw.js` contains no `\r`.

## CHANGELOG draft (the teacher's call)

> **A class tab keeps you on Assignments or Scores.** Tapping another class's tab while you're on the assignment list or the score grid now shows that class's assignment list or score grid, the way the calendar and the concern list already did. The score grid arrives with its search box empty and on *All*. Student detail still goes to the other class's Attendance, and opening a class from its card, or reloading, still lands on Attendance. (WO-3.45)
