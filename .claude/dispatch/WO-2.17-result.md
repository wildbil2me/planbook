# WO-2.17 — the term nav repaints the screen it is sitting on · implementation result

**Route** Claude (work-order-implementer) · **Branch** `phase/3-gradebook` · **Date** 2026-08-09
**Verification** `node tools/verify-shell.mjs` → `522 checks · 522 passed · 0 failed · 0 skipped`
(exit 0) · `node tools/wo-sweep.mjs` → `15 checks · 14 passed · 0 failed · 1 to review` (exit 0)

---

## What landed

A chain function, `afterTermChange()`, in `src/shell.js` beside `afterCategoryChange()`, and the
`[data-term-select]` handler now calls it instead of carrying its own one-line branch:

```js
function afterTermChange() {
  const view = views.currentView();
  if (view === 'assignments') assignments.renderAssignments();
  else if (view === 'class') attendance.paintRenderedTotals();
}
```

`src/attendance.js`'s existing `paintRenderedTotals()` — the same narrow repaint every attendance
write already uses — gained an `export` and a paragraph saying what it is now also for. It paints
exactly the three surfaces on the registry that read `getSelectedTerm()`: the class totals line, one
line per row, and the open detail panel. The grid is not rebuilt.

`src/classes.js` was **not touched**: `git diff` names only `src/shell.js`, `src/attendance.js`,
`tools/verify-shell.mjs`, `sw.js`, `TESTING.md`, `tools/README.md` and the work-order tracker.

## Against the Acceptance list, line by line

**1. Switching term on the attendance registry updates the totals line in the same paint — no mark,
no reload, no second tap.** — **Met, measured.** ✅ ticked.
New harness section *"the term nav repaints the screen it is sitting on (WO-2.17)"* in
`tools/verify-shell.mjs`, directly below the assignments section. It plants two dated terms over
records it writes itself — three recorded meetings inside one window, five inside the other — and
clicks the real `#termNav [data-term-select]` button on the real registry:

```
PASS | switching term on the attendance registry updates the totals line in the same paint …
       "WO-2.17 early: 3 recorded meetings · Year: 8 recorded meetings"
    -> "WO-2.17 late: 5 recorded meetings · Year: 8 recorded meetings"
PASS | and each student's own term line goes with it, rather than the class figure moving alone
       "WO-2.17 early · P 3 · T 0 · A 0 · E 0 · D 0 · 100%"
    -> "WO-2.17 late · P 5 · T 0 · A 0 · E 0 · D 0 · 100%"
```

The counts differ between the two terms on purpose: a check that only read the label at the front of
the line would go green against a build that redrew that line out of the same stale totals.

**2. Switching term on the assignment list still repaints it (WO-3.3's line, which must not
regress).** — **Met, measured.** ✅ ticked.
WO-3.3's own two term-switch checks (`verify-shell.mjs` ~5855–5875) are green on the final run, and
the new section adds the sibling claim from the registry's side: with the list up, a term tap moves
the summary line to `Assignments · WO-2.17 early · …`. No line of `src/assignments.js` changed.

**3. A screen that does not read the term is not repainted by a term change — the fix is a chain,
not a blanket repaint of everything.** — **Met, measured, and proved able to fail.** ✅ ticked.
Three checks carry this rather than one:

- with the assignment list up, the registry's totals element is overwritten with a sentinel string by
  hand before the tap and **still holds it afterwards**;
- with the **class grid** up — where the term nav is still drawn and no class screen is on the glass
  — both class screens are sentinelled and both are untouched, while the nav's own active mark moves
  (which is what proves the tap landed at all rather than doing nothing);
- and on the registry itself, a `data-wo217-sentinel` attribute on one row survives the switch, which
  is the Traps line measured: `renderAttendance()` empties tbody, so a blanket repaint of the screen
  destroys that row even though it gets the numbers right.

Two mutations, both reverted, each turning exactly one check red and nothing else:

| Mutation in `afterTermChange()` | Result |
|---|---|
| registry branch calls `renderAttendance()` instead of `paintRenderedTotals()` | **1 red** — the marked row is a different element after the tap. The two "the figures moved" checks stay green, which is the point: the blanket fix is right about the numbers and still the wrong fix |
| the `view === 'class'` test dropped, so any view falls through to the registry | **1 red** — a term tapped from the class grid repaints a screen nobody is looking at |

**4. `src/classes.js` gains no import from a screen module, and `selectTerm()` still returns without
writing when the term id does not belong to the open class.** — **Met, verified by inspection rather
than by measurement.** ✅ ticked, and here is exactly what that tick rests on: `src/classes.js` is
byte-identical to `HEAD` (it does not appear in `git diff --stat`), so its import list is still
`store · modal · live-region · prefs · categories · views` — none of them a screen module,
`views.js` importing nothing but `prefs.js` — and `selectTerm()`'s guard
(`if (!cls || !termsOf(cls).some((t) => t.id === termId)) return;`) is the same three lines it was.
**Nothing in either harness measures that refusal**; see the follow-up note below.

**5. The harness proves the pre-fix failure: a check that reads the totals line after a term switch
and goes red against the current code.** — **Done, and the red is recorded — but the box is left
blank**, because the line carries a 👤 glyph and my standing instruction is not to tick one under any
circumstances. The line's own text says a human is *not* needed here, so this is a box for the owner
to tick on the evidence below rather than work that is owed. The seven checks were written **first**
and run against the unfixed tree before a line of `src/` changed:

```
522 checks · 519 passed · 3 failed · 0 skipped

FAILED:
  - switching term on the attendance registry updates the totals line in the same paint …
      "WO-2.17 early: 3 recorded meetings · Year: 8 recorded meetings"
   -> "WO-2.17 early: 3 recorded meetings · Year: 8 recorded meetings"
  - and each student's own term line goes with it, rather than the class figure moving alone
      "WO-2.17 early · P 3 · T 0 · A 0 · E 0 · D 0 · 100%"
   -> "WO-2.17 early · P 3 · T 0 · A 0 · E 0 · D 0 · 100%"
  - the term change repaints the figures and not the grid under them …
      the marked row survived the switch = true, and its totals moved = false
```

The other four checks in the section were green pre-fix, which is correct: they are the fixture, the
assignment list (already fixed by WO-3.3), and the two "not repainted" claims.

## What I could not verify

- **Nothing on an iPad.** No 👤 line was ticked and none was added. The desk half is genuinely the
  whole of this work order's Acceptance — it is a text-in-the-DOM claim driven through the real
  controls — but `TESTING.md` § WO-2.17 carries an italic note suggesting a glance at the term nav on
  the hardware at the **next** sitting: a repaint that deliberately skips the grid is the kind of
  thing that could read as a screen that did not respond, and only eyes can say.
- **`selectTerm()`'s refusal of a foreign term id is asserted, not measured** (see line 4). It is the
  same code as before this work order, so nothing here can have broken it.
- **Paint cost was not timed.** The claim that the narrow repaint is cheaper than
  `renderAttendance()` is structural (three text nodes versus a rebuilt students × days grid) and is
  backed by WO-2.13's recorded numbers for the whole render; I did not add a timing fixture for the
  term path, and the harness prints no MEASURE line for it.

## Decisions the work order did not settle

- **The registry's repaint entry point is the existing `paintRenderedTotals()`, exported under its
  own name** rather than wrapped in a new caller-facing one (`repaintTermTotals()` or similar).
  `src/classes.js`'s `refreshClassList()` is precedent for the wrapper style, but a second name for
  one function is a second thing to keep true; the export carries a paragraph naming
  `afterTermChange()` as its caller instead. If a reviewer prefers the wrapper, it is a two-line
  change and the harness does not care.
- **The branches in `afterTermChange()` name `class` and `assignments` explicitly rather than ending
  in a bare `else`.** That is what makes Acceptance line 3 true from the class grid, where the term
  nav is drawn but nothing in `<main>` reads a term — and it is the branch the second mutation above
  attacks. WO-3.5's score grid adds one line here.
- **`sw.js`'s `CACHE` bumped `planbook-shell-v37` → `v38`.** Not in the work order, but
  `wo-sweep.mjs` fails the run without it — a SHELL file changed, so an installed app would keep the
  shell it has.
- **WO-3.3's stale pointers were made true rather than deleted**, in both places that carried them:
  the note at `src/shell.js`'s `[data-term-select]` branch (which said the registry's gap was not
  that work order's to close) and the comment in `verify-shell.mjs`'s assignments section (which said
  the gap was "left to whoever owns it"). Both now name this work order and the chain both screens
  hang off. The shape of the reasoning is intact; only the tense changed.
- **Status line left at `🤖 CLAIMED — 2026-08-09`.** I did not run `wo-gate.mjs --tick`: with
  Acceptance line 5's box blank it would write `🔨 IN PROGRESS`, which means "part-built, nobody in
  flight" and would be false. Once the owner ticks line 5, `node tools/wo-gate.mjs --tick WO-2.17`
  writes `✅ DONE` and touches no roadmap box (this work order closes none, by design —
  `--audit` is clean at 0 problems).

## Out of scope — noted, not acted on

- The term nav's own appearance, `openTermIds`, and which term is selected: untouched, as the work
  order says. The one place I came close is the harness teardown, which calls `selectTerm()` to put
  the browser's stored term back after the fixture comes down — a fixture coming down, not a claim.
- **Tempting and declined:** `afterTermChange()` is one `else if` away from also being the place a
  term change repaints the home cards (they carry today's attendance and could plausibly want a
  refresh). No card reads a term, so it would be a repaint of a screen that cannot have gone stale,
  and it would fail the check I wrote for Acceptance line 3. Left alone.
- **Proposed follow-up (not built, per "do not write a second harness"):** no check anywhere drives
  `selectTerm()` with a term id belonging to another class. It has no control — a nav only ever draws
  the open class's own terms — so it would go through the `window.planbook.classes` seam, assert the
  `openTermIds` preference and the nav's active mark are both unchanged, and would fit in the WO-2.17
  section in about eight lines. Worth doing the next time someone is in that file; it would make
  Acceptance line 4's second half measured rather than inspected.

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\shell.js` | `afterTermChange()` added beside `afterCategoryChange()`; the `[data-term-select]` handler calls it and its note rewritten to be true |
| `c:\dev\planbook\src\attendance.js` | `paintRenderedTotals()` exported, with the paragraph saying it is the term-scoped surface of this screen |
| `c:\dev\planbook\tools\verify-shell.mjs` | new 7-check section after the assignments section; WO-3.3's "left to whoever owns it" comment re-pointed |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v37` → `planbook-shell-v38` |
| `c:\dev\planbook\TESTING.md` | new § WO-2.17 in Phase 2: the runs, the pre-fix red, the two mutations |
| `c:\dev\planbook\tools\README.md` | harness count 515 → **522**, with the three things worth knowing about the new section |
| `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` | Acceptance lines 1–4 ticked; line 5 (👤) left for the owner; status untouched |

Nothing committed, nothing pushed — the brief did not ask for either.

## Draft `CHANGELOG.md` entry — for the teacher to take, leave, or rewrite

> **Fixed** — Switching term on the attendance registry now updates the meeting counts and
> percentages under the term nav straight away. They used to keep showing the term you had just left
> until something else on the screen changed — marking a student, or coming back to the class — so
> the numbers looked right and were a term out of date. The assignment list already behaved; the
> repaint now belongs to the term change itself, so the screens still to come inherit it.
