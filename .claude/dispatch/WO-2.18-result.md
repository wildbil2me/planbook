# WO-2.18 — the term-switch checks cover every surface the repaint paints · result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-10
**Verdict** All five Acceptance lines met, each run rather than reasoned. Two checks added, two
mutations run and reverted, `src/` byte-identical to HEAD.

---

## Against the Acceptance list, one by one

### 1. With a detail panel open, switching term moves the panel's figures in the same paint as the class line and the row line

**Met.** One check added to WO-2.17's own block in `tools/verify-shell.mjs` — no second fixture, no
new fixture year. It taps the real ⋯ (`[data-attendance-detail="wo217-student"]`) **before** any read
is taken, so the existing `TERM_A → TERM_B` tap happens with the panel on screen, and it reads the
panel's figures out of the DOM (`tr[data-attendance-detail-row="wo217-student"]
.attendance-detail-totals`), never out of the totals map. It closes the panel through the same ⋯
afterwards, so the three checks that follow drive their screens over the fixture they were written
against.

Output from the green run:

```
PASS | and the open detail panel moves with them, which is the third surface the same paint owes
  :: panel open before = true, after = true
  :: "WO-2.17 early: P 3 · T 0 · A 0 · E 0 · D 0 · 100% | Year: P 8 · T 0 · A 0 · E 0 · D 0 · 100%"
  -> "WO-2.17 late: P 5 · T 0 · A 0 · E 0 · D 0 · 100% | Year: P 8 · T 0 · A 0 · E 0 · D 0 · 100%"
```

The **year** half is the same eight meetings under either term and the **term** half moves 3 → 5,
which is what makes the pair of strings a claim about the term rather than about the panel merely
having been redrawn. `paintRenderedTotals()` was not touched, widened, or given anything to make it
observable — the panel was already in the DOM and the check reads it there.

### 2. Deleting `paintDetail(totals)` at `src/attendance.js:3306` turns the new panel check red and leaves WO-2.17's seven green — run, not reasoned, with the counts before and after quoted

**Met, with one correction to the work order's premise that I found by running it.**

| Run | Result |
|---|---|
| before the mutation (with both new checks in) | `537 checks · 537 passed · 0 failed · 0 skipped` |
| with `paintDetail(totals)` deleted from line 3306 | `537 checks · 535 passed · 2 failed · 0 skipped` |
| after the revert | `537 checks · 537 passed · 0 failed · 0 skipped` |

**All seven of WO-2.17's checks stayed green under the mutation** — the fixture is not coupled, and
the new check is measuring the surface it claims. The panel check went red showing the previous
term's figures still on screen after the tap:

```
FAIL | and the open detail panel moves with them, which is the third surface the same paint owes
  :: "WO-2.17 early: P 3 · ... · 100% | Year: P 8 · ... · 100%"
  -> "WO-2.17 early: P 3 · ... · 100% | Year: P 8 · ... · 100%"
```

**The second red is the correction, and I am reporting it rather than smoothing it over.** The
deletion turns **two** red, not one. The other is a check that has existed since WO-2.13 —
*"a filtered-out row and its open detail repaint exact term/year totals after a mark"* — which was
already watching that same line from the **mark** path. So the work order's "deleting
`paintDetail(totals)` leaves all seven green" is exactly true of WO-2.17's seven, but the harness as
a whole was not blind to the deletion: it was blind to it **on the term-switch path**, which is the
path WO-2.17 shipped and the only one where no other repaint would have brought the figures back.
The gap this work order names was real; its scope was one path, not the whole surface. Written into
`tools/README.md` and `TESTING.md` in those terms.

The mutation was made and reverted by a script holding the original bytes on disk, not by
`git checkout --` (TESTING.md § WO-2.5's scar). Restore proved below.

### 3. `selectTerm()` called with another class's term id writes no preference, moves no highlight and announces nothing — asserted from the harness rather than from reading the guard

**Met.** A second check at the foot of the same block borrows a term id from whichever *other* class
in the live document carries one (it found `tm_…` on "Period 2 — Chem (renamed)" each run) and aims
it at the open class through `window.planbook.classes.selectTerm()`. There is no control that can do
this — the nav only ever draws the open class's terms — so it goes through the read seam, which is
the same named exception the attendance section's future-date check takes.

It asserts the absence of all three writes plus one:

- the preference `openTermIds` serialised byte for byte before and after,
- `getSelectedTermId()` and the nav's own `.active` id (and the list of ids offered),
- `#srLive`, **pre-filled with a sentence of the harness's own** so that silence is text still
  sitting there rather than an empty string that was always empty; the read waits 250 ms because
  `announce()` defers its write 30 ms on purpose (`src/live-region.js`),
- and `#attendanceTotals` still holding the block's own stale sentinel, i.e. nothing repainted.

```
PASS | a term id belonging to ANOTHER class writes no preference, moves no highlight and announces nothing
  :: "tm_5z6g6w190d" from "Period 2 — Chem (renamed)" :: preference {"c_…":"tm_wo217b"} -> {"c_…":"tm_wo217b"},
     open term "tm_wo217b" -> "tm_wo217b", nav active "tm_wo217b" -> "tm_wo217b",
     said "WO-2.18 sentinel — nothing was announced"
```

**I proved this check can fail too, because a check that has never failed is not evidence that it
can** — this repo's own standard, `tools/README.md` and TESTING.md § WO-2.17. Second mutation:
`src/classes.js:479` cut from `if (!cls || !termsOf(cls).some((t) => t.id === termId)) return;` to
`if (!cls) return;`. Result: `537 checks · 536 passed · 1 failed`, **the one red being this check and
nothing else in the run** — which is itself the finding, since it means the guard had no other
coverage anywhere. It failed in four ways at once, all printed:

```
FAIL | a term id belonging to ANOTHER class writes no preference, moves no highlight and announces nothing
  :: preference {"c_…":"tm_wo217b"} -> {"c_…":"tm_0o3q4o5x2q"}, open term "tm_wo217b" -> "tm_wo217a",
     nav active "tm_wo217b" -> "tm_wo217a", said "WO-2.18 sentinel — nothing was announced",
     and it THREW: Cannot read properties of undefined (reading 'label')
```

That run is why the check wraps the call in `try`/`catch` and asserts on the throw: a build whose
guard is gone dies at `term.label` **before** it can announce, so all three "nothing was written"
claims would have been satisfied by a screen that had just broken — and uncaught, the exception takes
the whole run down instead of turning one check red. Reverted from held bytes; green again at 537.

### 4. `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` shows no new line

**Met.**

```
537 checks · 537 passed · 0 failed · 0 skipped
12,404 lines · 23.1 lines per check · 159s
```

```
15 checks · 14 passed · 0 failed · 1 to review
```

The sweep is character-for-character the line it printed on the tree I arrived on, including the
standing REVIEW (`sensitive field names outside src/backup.js`, 173 mentions in the same eleven
files). Nothing added here mentions a support, accommodation, medical or plan field. No third harness
was written and no check was needed that `verify-shell.mjs` could not make.

`node tools/wo-gate.mjs --audit` also passes — no `**Closes roadmap**` fragment was invented and no
dashboard row moved, which is right: this closes no product box.

### 5. `src/` is byte-identical to HEAD across the whole work order

**Met, proved rather than asserted.** After both mutations were reverted:

```
$ git status --short src/
$ git diff --stat src/
```

Both produce **no output at all**. Full working tree at the end:

```
 M TESTING.md
 M plans/work-orders/phase-2-attendance.md
 M tools/README.md
 M tools/verify-shell.mjs
?? .claude/dispatch/WO-2.18-brief.md
?? .claude/dispatch/WO-2.18-status.md
```

(`plans/work-orders/phase-2-attendance.md` was already modified when I arrived — the `🤖 CLAIMED`
status line written by the dispatch. My edit to it is the five Acceptance boxes and nothing else.)

---

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs` — two checks and their fixture steps inside WO-2.17's
  existing block (~lines 6580–6820): a `PANEL_A`/`PANEL_B` pair and an `SR_SENTINEL`, two new fields
  on the block's shared `READ`, the ⋯ opened before the first read and closed after the fourth check,
  and the foreign-term-id check before the teardown. Plus a paragraph on the block's header comment
  explaining both, in the voice of the three that were already there.
- `c:\dev\planbook\tools\README.md` — the WO-2.18 paragraph after WO-2.17's, in the same shape,
  ending "Two mutations, both reverted and tabulated in `TESTING.md` § WO-2.18", and the running
  check count at the head of that run of paragraphs updated to **537**.
- `c:\dev\planbook\TESTING.md` — new `### WO-2.18` section immediately after § WO-2.17, with the
  mutation table alongside it in the same format.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the five Acceptance boxes ticked.

**`src/` unchanged.** Two files were mutated and restored inside the run and are byte-identical to
HEAD: `src/attendance.js`, `src/classes.js`.

## Boxes I ticked, in one list

Nothing here is 👤 and no 👤 line was added or touched.

- `plans/work-orders/phase-2-attendance.md` § WO-2.18 — all five Acceptance lines. Evidence for each
  is the corresponding section above; all five are desk-measurable and all five were measured.
- `TESTING.md` § WO-2.18 — five lines I wrote and closed in the same pass: the two tool runs, the
  537-check green, the panel check, the foreign-term check, and the two reverted mutations.

I did **not** touch the status line (`🤖 CLAIMED`), `ROADMAP.md`, or `CHANGELOG.md`.

## Decisions the work order did not settle

1. **The running check count in `tools/README.md` was wrong before I got here, by more than my two.**
   The line said **522 at WO-2.17**; the tree I arrived on measured **535**. `git show 51c3b21`
   (WO-3.4) adds thirteen `check(` calls to `verify-shell.mjs` and never updated that line. I wrote
   **537** — the measured number — and named the thirteen and where they came from, rather than
   writing 524 and carrying a lie forward or silently absorbing the gap. The file's own footnote
   ("Measured, not guessed … a count that is nearly right is the same problem as a stale one") is the
   precedent I followed. **If you would rather WO-3.4 owned its own correction, this is the line to
   re-cut.**
2. **I ran a second mutation, on `src/classes.js`, which the work order did not ask for.** Acceptance
   line 2 names only the `paintDetail` one. I ran the guard mutation because the third deliverable's
   whole point is that a two-line guard is exactly what gets refactored away, and a check written
   after the fact against a passing build proves nothing about its ability to notice. It is reverted
   and `src/` is clean; if you consider it out of scope, the artefact is one row in the TESTING.md
   table and one clause in `tools/README.md`, both removable.
3. **The check catches `selectTerm()`'s exception rather than letting it propagate.** That decision
   was forced by the mutation run — see line 3 above. It makes the check stricter, not looser.
4. **Section title left alone.** The block still prints `--- the term nav repaints the screen it is
   sitting on (WO-2.17) ---`. WO-2.18 is named in the block's header comment and at each new check
   instead. Renaming the printed header would have made a `WO-` token in console output that two
   trackers and a gate parse for other purposes, for no gain.

## Out-of-scope temptations I declined

- **`paintRenderedTotals()` stayed exactly as WO-2.17 shipped it.** The panel's figures were
  observable from the DOM without help. No return value, no exported hook, no `data-` attribute added
  to the panel.
- **The `paintDetail` mutation turning WO-2.13's check red is a fact about the harness, not a defect
  in the app** — nothing went red against current code, so there is nothing to hand to a follow-up
  work order. No app fix was made or needed.
- I noticed WO-2.13's detail check and the new one now overlap on the same call site from two
  different paths. Deduplicating them would be wrong: they are two paths, and the term path is the
  one that had nothing on it.
- I did not touch the WO-2.17 block's teardown, its seven checks, or their strings.

## Proposed follow-up work orders

**None from a red check** — nothing went red against current code. One optional note, offered rather
than proposed: `tools/README.md`'s running check count now depends on whoever lands a work order
remembering to update it, and it has been missed twice in the file's own history (WO-1.5, WO-3.4).
`wo-sweep.mjs` cannot count checks in a browser, but a one-line grep of `check(` call sites against
the number in that paragraph is within reach of the sweep and would make the count self-correcting.
Not worth a work order on its own; worth folding into the next one that touches the sweep.

## Draft CHANGELOG entry — yours to accept, reword or drop

> **Harness.** The term-switch checks now cover all three surfaces a term change repaints, not two.
> An open detail panel is the one a teacher opens *because* she wants the detail, and it had nothing
> watching it — deleting the line that repaints it left every existing term-switch check green.
> `selectTerm()`'s refusal of a term id belonging to another class is also driven now rather than
> read: the guard is two lines and obviously right, which is the condition under which a guard gets
> refactored away. No app code changed.

## What I could not verify

Nothing on this work order needs an iPad or human eyes, and I have claimed nothing that does. Every
line above was run at this desk; the harness output quoted is verbatim from runs made in this
session. The one thing worth stating plainly: the two new checks are evidence that the *current*
build repaints all three surfaces and refuses a foreign term id. They are not evidence about the
iPad, and this work order adds no 👤 line because it changes nothing a teacher can see.
