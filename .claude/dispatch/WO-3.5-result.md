# WO-3.5 — correction round 1 · implementer report

**Both gates green.** `node tools/verify-shell.mjs` → **554 checks · 554 passed · 0 failed · 0
skipped** (was 537; 17 added, one existing check reworded). `node tools/wo-sweep.mjs` → **15 checks ·
13 passed · 0 failed · 2 to review**, and both REVIEWs are the two already adjudicated — untouched.
`node tools/wo-gate.mjs --audit` → **PASS** (it did not stay passing by itself; see item 6 below).

The browser launched and drove fine on this machine. Nothing here is a "could not run".

---

## The five numbered items

### 1. `src/screen-nav.js` — the Scores segment had no door ✅

Fixed the way the brief preferred, because it was as small as it looked: **`enabled` is now the
question `isView()`, asked of `src/views.js`.** The `pending` field is gone from `SCREENS`
altogether — a segment is disabled iff `src/views.js` does not have its view, and the "not built
yet" sentence is derived from the label rather than written beside it, so a fourth screen drawn
ahead of its view gets its own sentence with no edit here and no second place for the arrival of a
screen to be recorded.

That is what makes WO-3.7 and Phase 6 land without touching this file: one line in `SCREENS` the day
the tab is drawn, one line in `VIEWS` the day it works, and the two halves cannot disagree because
only one of them is written down. The header comment now says that, and says it was a stored answer
until 2026-08-10 and what that cost.

Three stale claims about the disabled segment went with it, because the brief's own judgment — a
comment naming something that does not exist is worse than silence — applies to claims about state
as much as to claims about checks:

- `index.html:867-870` said "nothing in that file changed for it". It now says what is actually
  true, and records that the sentence it replaced is why the view shipped with its door greyed out.
- `tools/verify-shell.mjs:5872` **asserted the opposite of the fix** — "Scores is drawn but not yet
  reachable", `disabled[2] === true && hooks[2] === null`. It was green through the whole defect. It
  now asserts all three segments carry their hook, worded as a question about the set.
- `TESTING.md`'s WO-3.3 box said "*Scores* is drawn disabled and says why". Annotated, not silently
  rewritten — the claim was true when WO-3.3 shipped.

### 2. `src/shell.js` — `afterAssignmentChange()` ✅

Built at `src/shell.js:434`, shaped like `afterCategoryChange()` immediately above it, one branch:
`if (views.currentView() === 'scores') scores.renderScores();`. Not a refactor of
`src/assignments.js` — that module still repaints its own screen after every write, and the chain is
only about the second screen an assignment is drawn on, where it is a column and a divisor rather
than a row.

Chained from **seven** call sites, all in `src/shell.js`'s own listeners (which is where this repo
states order-of-operations, and the only place that does not close an import loop):

| Hook | Why |
|---|---|
| `[data-assignment-category]` (`change`) | **the acceptance line** — the category move |
| `[data-assignment-field]` (`input`) | `points` is the denominator of every cell in the column; name and dates are on the head |
| `[data-assignment-field]` (`change`) | the cleared-date rebuild — a due date is printed on the column head |
| `[data-assignment-new]` | a new column appears |
| `[data-assignment-move-up]` / `-move-down]` | column order |
| `[data-assignment-copy-confirm]` | a duplicate into the open class is a new column |
| `[data-assignment-delete-confirm]` | a column goes |

Deliberately **not** chained: the three openers, the two cancels, and the copy dialog's pickers —
they move a proposal or a dialog, not the document.

Verified by driving: case 1's row goes **87.0% → 86.7%** on the `change`, all 25 displayed grades
move, the column head's chip goes *Tests 50%* → *Homework 20%*, and the score map and the weight
list are byte-identical either side.

### 3. Harness checks in `tools/verify-shell.mjs` ✅ — 17 of them

One new section, `--- the score entry grid (WO-3.5) ---`, at the foot of the file. It covers the
verifier's named minimum and more: the 25-down-a-column path · `Enter` at the bottom · `Esc` twice
mid-column · the three flag fills as computed style · the cleared key **and** the emptied column key
· case 1 to the digit · the category move · the weights crossing 100 in both directions · the frozen
width/offset pair `scores.css` already claimed was asserted.

**I read the fixture-assumption paragraph first, and it changed the design of the whole block.** The
coarse pass reloads under an emulated tablet, opens the grid **through the real segment**, and
asserts it is drawn (`hidden:false`, `display:block`, 250 cells) *before* it measures a box. Then it
measures: **259 visible controls on the open grid, 250 of them score cells, none under 44px.** The
standing sweep at line 10507 had been walking past every one of them.

Things worth flagging about how it is built:

- **Every score is typed as keystrokes at the page**, `Input.dispatchKeyEvent`, never `.value` plus a
  dispatched `input`. The latter would assert that `shell.js`'s listener works, not that the keyboard
  path does.
- **"No mouse" is counted, not assumed.** A page-side listener installed after the arrival tap; the
  count is 0 across the 25 groups.
- **The fixture roster is stored in the exact reverse of the drawn order and every score in the
  column differs**, so the stored map is the claim — a build writing against roster order would put
  25 marks on the wrong 25 students and look fine.
- **Seven of the ten fixture assignments are empty.** They change no grade (0/0) and exist so the
  grid is wider than the viewport — a three-column grid does not scroll, and a sticky-column check
  over a grid that cannot move is a check that cannot fail.
- **`window.planbook.scores` is now read** — `renderScores` is what the plant repaints through; the
  cleared-key claim is answered by reading `scores` off the document, which is what that seam's own
  comment at `shell.js:1620` describes.
- The section plants and **removes** its own fixture (class, 25 students, 10 assignments, score
  columns) and puts the open class back.

**Both new checks were negative-controlled.** I re-introduced each defect and re-ran:

| Mutation | Result |
|---|---|
| `src/screen-nav.js` disables the Scores segment again | **the run CRASHED** — `clickSel` threw before a summary printed |
| `afterAssignmentChange()` dropped from the category hook | **1 red**: *"0 of 25 displayed grades moved; case 1's row 87.0% → 87.0%; that column head now reads Tests 50%"*, everything else green |

The first result was a defect **in my check, not in the app**: this file's rule is that a missing
fixture is a failed check and never a crash. The door is now asked for before it is clicked — a
missing hook is a red check plus an announced skip of the rest of the section. Both mutations
reverted; the final run is against clean code.

### 4. `TESTING.md` § WO-3.5 ✅

New section after WO-3.3, in the established voice: 24 boxes, the desk-half prose, and a mutation
table. **18 ticked, 6 left `- [ ]` and marked 👤** — the decimal keypad, the 96/104px column under a
thumb, the frozen columns under momentum scroll, projector legibility of the flag fills, offline
launch from `planbook-shell-v40`, and the SIS re-key that WO-3.2 left owed ("the letters have never
been read beside a percentage by a human"). Acceptance line 6 itself — usable on an iPad in
landscape — is one of the unticked six.

Four prose notes carry what a later reader would otherwise re-derive: why the standing sweep was
blind to this screen, why the scores are keystrokes and the fixture is not, why seven empty
assignments are in the fixture, and why 86.7% is hand-computed rather than asked of the engine.

### 5. The four lying comments, plus the `<th>`/`<td>` disagreement ✅

- `src/scores.js:24` — now names the section and what it presses (twice, two thirds down, with a
  digit in the field). True.
- `src/scores.js:388` — now says the keypad is a 👤 line in `TESTING.md § WO-3.5` **and is
  unticked**, which is the honest form.
- `src/scores.css:201` — the claim was "asserted in one check … on both pointers". There are now
  **three**: one reads the two declarations out of the sheet (base vs base, coarse vs coarse, and
  the blocks required to differ), two measure the overlap with the grid scrolled, once per pointer.
  The comment says that, and records that the claim predated the check.
- `src/scores.css:280` — now names two separate unticked 👤 lines, and says what the desk *does*
  measure (~250 cells at 44px, view forced open first).
- `src/scores.css:179-182` — corrected. The name cell is a `<td>`, which is what `scores.js:643`
  says and why; the `th` half of the selector is explained as being for the row header this grid
  does not have yet, and the disagreement is recorded rather than quietly erased.

### 6. One thing the brief did not settle, and which way I went

Ticking WO-3.5's nine boxes broke `node tools/wo-gate.mjs --audit`, which had been passing. That is
by design — `plans/work-orders/phase-3-gradebook.md:78-81` predicts it in as many words: *"When
WO-3.5 ticks them, --audit will fail on this work order … tick lines 2 and 4 here on WO-3.5's
evidence, and take the **Owes** field off. That is the one hand edit this design asks for."*

**I made that edit**, on the grounds that it is bookkeeping my own tick triggered rather than a new
deliverable, and that leaving a tracker gate red is worse than touching two ✅ work orders' records.
Ticked WO-3.1's lines 2 and 4 and WO-3.3's category-move line; dropped `**Owes** WO-3.5` from
WO-3.1's header and reduced WO-3.3's to `**Owes** WO-3.7`.

Doing exactly that produced a *second* failure the design did not anticipate: a bare `→ WO-3.5`
marker on a line requires an `**Owes**` naming it, so the markers had to go too — which would have
deleted the record of where each debt was paid. `wo-gate.mjs:275` documents the escape: **a marker
inside backticks is prose about a marker, not a marker.** So each pointer is preserved verbatim in
backticks with a dated discharge note beside it. `--audit` passes; the record survives. Say the word
and I will revert all of §6 — it is the one part of this round that is arguably outside the work
order.

---

## Against the ten Acceptance lines

| # | Line | Verdict | Evidence |
|---|---|---|---|
| 1 | 25 scores, 25 keystroke-groups, no mouse | ✅ ticked | 25 `Input.dispatchKeyEvent` groups; **0 mouse events counted** between the first cell and the last; the stored column matches the drawn row order against a roster stored in reverse |
| 2 | `Enter` at the bottom | ✅ ticked | caret stays in `wo35-s25`, value `85` still selected (2 chars), live region: *"Unit test: that is the last student. 25 of 25 entered."* |
| 3 | `missing` distinct from `excused` and blank | ✅ ticked | four distinct computed fills and four distinct computed borders across late/missing/excused/blank; glyphs `L`/`M`/`X`/none; accessible names ending ` — late` / ` — missing` / ` — excused`; placeholders `0` / `Ex` / `—` |
| 4 | Clearing removes the key | ✅ ticked | the cleared student is absent from the column (24 keys left of 25); a one-cell column's key **disappears entirely** when that cell goes; zero `{v:null}`-with-no-flag and zero bare-number cells **anywhere in the document** |
| 5 | Grades recompute live, match WO-3.4 | ✅ ticked | `docs/grade-math-cases.md` case 1 read off the screen as **87.0% B**, engine asked separately answers **87 / B / reason null** |
| 6 | **Usable on an iPad in landscape** | ⬜ **not ticked — 👤** | I have no iPad. The desk half is measured (259 controls ≥44px with the view open, no sideways spill, frozen columns hold) and **none of it is this line.** It is `- [ ]` in both the work order and `TESTING.md` |
| 7 | `Esc` mid-column, proved by pressing | ✅ ticked | pressed **twice** at `wo35-s17` with a freshly typed `9`: view still up, 0 overlays, same cell, same value, same caret offset |
| 8 | Category move updates every displayed grade | ✅ ticked | real `<select>`, real `change`: **25 of 25** displayed grades moved, 87.0% → 86.7%, chip *Tests 50%* → *Homework 20%*, scores and weights byte-identical. Negative-controlled: without the chain, "0 of 25 moved" |
| 9 | No grade while the weights are wrong, and why | ✅ ticked | weight typed 50→40 through the real field: all 25 cells `—`, class average `—`, banner *"These weights add up to 90%, not 100%…"*, `provisional` absent from the grade column, the summary and the banner |
| 10 | Reweighting recomputes, crossing both ways | ✅ ticked | the **disappearing** half driven first, then 40→50 brings all 25 back on the keystroke with the panel still open over the grid |

**Nine ticked, one blank.** The blank one is the 👤 line and it is blank because I cannot name
evidence for it.

---

## What I could not verify

- **Anything needing the hardware.** The six 👤 lines in `TESTING.md § WO-3.5`. The emulated coarse
  pointer measures declared geometry; it is not a thumb, an iPadOS keypad, WebKit momentum scroll, a
  projector, or a network-off launch of an installed app.
- **The eight lines the verifier already confirmed** I did not re-derive — I left that code alone,
  as instructed. My run re-covers all of them incidentally, and all pass.
- **`src/scores.js` and `src/scores.css` are still untracked** (`??` in `git status`). I did not
  commit anything; the brief did not say to.

## Files changed

- `c:\dev\planbook\src\screen-nav.js` — `isView()` gate, `pending` removed, header rewritten
- `c:\dev\planbook\src\shell.js` — `afterAssignmentChange()` + 7 call sites
- `c:\dev\planbook\src\scores.js` — two comment corrections
- `c:\dev\planbook\src\scores.css` — three comment corrections (incl. the `<th>`/`<td>` prose)
- `c:\dev\planbook\index.html` — the score view's screen-nav comment
- `c:\dev\planbook\tools\verify-shell.mjs` — new WO-3.5 section (17 checks) + one reworded check
- `c:\dev\planbook\TESTING.md` — new § WO-3.5; one WO-3.3 box annotated
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — 9 of WO-3.5's boxes ticked; the two
  inherited debts discharged in WO-3.1 and WO-3.3 (see §6)
- `c:\dev\planbook\.claude\dispatch\WO-3.5-status.md`, `…-result.md`

**Not touched:** `CHANGELOG.md` (the teacher's), `sw.js` (already correctly at v40), `ROADMAP.md`
(WO-3.5's two roadmap boxes stay `[ ]` — the work order still has an open acceptance line).

---

## Draft CHANGELOG entry — yours to accept, reject or rewrite

> **Score entry grid.** Students down, assignments across, one column per assignment. Type a score,
> press Enter, and the caret drops to the next student in the same assignment — a class of
> twenty-five is twenty-five numbers and no mouse. `L`, `M` and `X` mark late, missing and excused
> from the keyboard, and each one shows in the cell in the fill and in a corner letter, because a
> score that silently isn't what you typed is the worst thing a gradebook can do. Every grade beside
> every name is live, and there is no grade at all until the weights total 100% — the banner says
> what they come to. Escape does nothing here, deliberately: there is no dialog to close.

---

## Notes I was told not to act on

- **Out-of-scope temptation declined.** `afterAssignmentChange()` is one branch. It was tempting to
  fold the assignment list's own `renderAssignments()` into it and delete the eleven repaints inside
  `src/assignments.js`, which would be tidier and is exactly the refactor the brief forbade. Left
  alone. If someone wants it, it is its own work order with its own regression risk.
- **A seam WO-3.13 will want.** The score grid has no control that opens an assignment editor, so
  acceptance line 8 is only reachable in a browser through `window.planbook.assignments`. That is
  fine today — the chain is right whatever opens the dialog — but WO-3.7's per-student detail or a
  future "edit this assignment" affordance on a column head would make it a real path. Named here so
  nobody reads the seam use in the harness as a shortcut.
- **A convention I set, since nothing existed yet.** The WO-3.5 harness section is the first in
  `verify-shell.mjs` that plants a whole class rather than borrowing one, and the first that reloads
  the page mid-section. Two rules came out of that and are written into its header: the fixture is
  removed by id at the foot of the block rather than restored from a `window` snapshot (a snapshot
  does not survive a reload), and a section that reloads must reset `Emulation` on the way in rather
  than inheriting whatever the section above left.
- **A weakness I did not close.** The "moving it back restores every displayed grade" check cannot
  fail independently — against a build with no chain at all, both sides are equally stale and it
  passes. Its neighbour catches that build. Naming it so nobody counts it as two pieces of evidence.
