# WO-2.27 — where the pass work says one thing and does another · implementation result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-14
**Verdict from me** 8 of 9 acceptance lines closed and ticked. **Line 1 is half closed and left
`[ ]` on purpose** — its second clause is done and demonstrated; its first clause rests on a premise
that does not hold in this tree, and making it literally true would silence WO-2.9's overdue alerts
on every screen but the registry. The whole of that argument is below, under line 1. Nothing else is
outstanding.

---

## Runs, and what they printed

Every number here is copied out of output I read after the process exited. No run is reported from a
prediction.

| Run | Tree | Result |
|---|---|---|
| `node tools/verify-shell.mjs` | this tree, final state | **748 checks · 748 passed · 0 failed · 0 skipped**, 19,523 lines, 26.1 lines/check, **245s**, exit 0 |
| `node tools/wo-sweep.mjs` | this tree, final state | **18 checks · 16 passed · 0 failed · 2 to review**, exit 0. Both REVIEWs are the standing pair (`sensitive field names outside src/backup.js`, `due-date and late/missing on the same line`) |
| `node tools/wo-gate.mjs --self-check` | this tree | **PASS — 13 of 13 plants caught** |
| `node tools/wo-gate.mjs --audit` | this tree | **PASS** — 79 fragments, 2 `Owes` pointers, every dashboard row matching |
| **Falsification A** — one inventory row deleted | copy of the tree | `wo-sweep.mjs` **FAIL**, exit 1 |
| **Falsification B** — `to` bound dropped | copy of this tree | `verify-shell.mjs` **741 of 748 · 7 failed**, exit 1 |
| **Falsification C** — same deletion, tree at `HEAD` | `git archive HEAD` | `verify-shell.mjs` **746 of 746 · 0 failed**, exit 0 — the gap, demonstrated |

Before this work order the harness ran 746 of 746 and the sweep ran 17 checks · 15 passed. The two
counts moved by exactly the two call sites and the one rule added here.

---

## Line by line against the Acceptance list

### 1. `[ ]` Navigating off the registry with a pass open leaves no interval running, and there is a check that fails if the early return stops stopping it

**Second clause: done, and demonstrated.** `paintPassBanner()`'s early return now calls
`stopPassClock()` (`src/attendance.js:2835`–`2842`). The check that fails if it stops doing so is at
`tools/verify-shell.mjs:10165`, in the hall-pass section: it blanks `#attendancePassBanner`'s `id`
for the length of one `renderAttendance()` — which is exactly what the guard asks with — and watches
the interval through wrappers on `setInterval`/`clearInterval`, because the id lives in a module
variable no harness can read. Printed on the green run:

```
PASS | the elapsed clock is stopped on EVERY path out of the banner paint, including the early
       return a missing banner takes — and starts again when the banner comes back
       :: with the banner up 1 card(s) and interval(s) ["paintPassElapsed"]; with it taken away [];
          with it back ["paintPassElapsed"] over 1 card(s)
```

The probe stops and restarts the clock through its own wrappers first, so the id under test is one
it watched being created. On an unfixed build the first arm is what fails: with no stop on the early
return, `startPassClock()` finds its variable still set and creates nothing, so `started` comes back
empty.

**First clause: not closed, and this is a finding rather than a shortfall.** The work order's
diagnosis is *"navigating off the registry with a pass open leaves a 1-second interval running"*
because *"`paintPassBanner()` returns at line 2835 when the banner element is not in the document."*
Both halves are true separately; they are not the same event.

- `#attendancePassBanner` is **static markup in `index.html:627`**, and `src/views.js` swaps views by
  toggling `.hidden` — it never removes one. So the element is always in the document, and the early
  return is unreachable in today's tree. I fixed it anyway, because the deliverable says to and
  because the comment beside it was making a promise it did not keep.
- Leaving the registry does not go through `paintPassBanner()` **at all**. `showClassScreen()` →
  `paintClassScreen(view)` paints the screen it arrives at and not the one it left, and `showHome()`
  paints the cards. Nothing calls the banner paint on the way out, so nothing stops the clock.
- **The ticks are not no-ops there**, which is the part that changes the answer. The cards the last
  paint left in the banner are still in the document, so `paintPassElapsed()` still finds their
  `[data-pass-elapsed]` nodes, still recomputes from the stamps, and **still fires WO-2.9's two
  overdue alerts** into the live region — on whatever screen the teacher is standing on.
  `openClass()` reads the class preference and is not view-dependent; `showHome()` does not clear it.

Standing the clock down when `currentView() !== 'class'` is about four lines — the idiom already
exists in that file at `syncDayColumns()` — and it would silence the overdue alert everywhere except
the registry. A teacher entering scores with a student twenty minutes gone is the case that alert is
*for*: its own comment says *"the whole point of an overdue alert is that nobody is [looking]"*. I
was not willing to trade that inside an S-sized comment-debt work order without the owner, so I did
the thing this repository does with an argument: **wrote it down.** There is now a paragraph
immediately above `startPassClock()` (`src/attendance.js:2898`–`2918`) saying the interval survives
leaving the registry, why that is the feature and not an oversight, what it costs, and what closing it would
cost. The foot-of-function comment points at it, so the promise there does not over-claim.

**How I verified this half:** by reading, not by running. The four sub-claims are each checkable at
a named line (`index.html:627`, `src/views.js:120` `showView`, `src/shell.js:446` `paintClassScreen`,
`src/attendance.js:2956` `paintPassElapsed`), but I did **not** drive a browser onto the Scores
screen with an overdue pass and watch the live region. If the owner wants that before deciding, it
is one more block in the hall-pass section and I would write it as a follow-up rather than smuggle it
in here.

**Proposed follow-up (not acted on):** *"Decide whether the overdue alert should follow the teacher
off the registry."* If yes, the current behaviour is correct and the comment is the whole fix. If no,
it needs a driver that is not the paint clock — a timeout scheduled to the next threshold — and that
is a work order.

### 2. `[x]` `src/attendance.js:2856`'s comment is true of every path through the function it describes

The sentence *"a run with an empty room costs nothing at all, not one timer doing nothing once a
second"* is kept, not deleted — the Traps line is explicit about that — and made true: the early
return stops the clock, so both exits from `paintPassBanner()` leave no interval behind. The comment
now says so, and says what it does **not** claim (the navigation case above), pointing at the
paragraph that argues it.

### 3. `[x]` A reader of `src/shell.js:747` can tell why WO-2.9's surface is not registered there

A new paragraph inside `flipPresentationMode()`'s header comment, immediately under the standing
instruction. **No redraw was added** — the Traps line is obeyed literally, and the paragraph says why
adding one would be wiring a repaint for a state that cannot occur.

One correction I made deliberately: the work order says *"the header sits at `z-index: 999`"*. It
does not — `999` is `#loadingScreen` (`src/shell.css:116`). `.header` is unpositioned normal flow
with **no `z-index` at all**, and `.modal-overlay` is `position: fixed; inset: 0; z-index: 1000`
(`src/shell.css:565`). The conclusion is unchanged and the real reason is stronger: the header does
not lose a stacking contest, it is covered edge to edge, so a tap at its coordinates lands on the
backdrop. `src/modal.js`'s own contract line 20 — *"a click on the backdrop closes it"* — is what
makes the owner's walk (first tap closes, second reaches the control) the accurate description. The
comment states the geometry and cites the files rather than repeating a number that is wrong;
writing `999` there would have been a new comment debt inside a work order about comment debt. The
date the owner walked it on glass, 2026-08-14, is in the comment.

### 4. `[x]` `tools/verify-shell.mjs:10077` describes the mechanism the check actually uses

The claim was *"a build that fired off a variable would say it again after the reload below."* I
confirmed there is no reload: the nearest `Page.reload` calls to that block are at `:9380` and
`:12119`, thousands of lines away in either direction, and this fixture is gone by then. Three
seconds of ticks in one page cannot separate a level stored on the record from one held in a module
variable — both survive a wait.

What actually settles it is the **key set** one check above: `alerted41.keys` is read verbatim off
the pass in `doc.openPasses` and must equal `alerted,classId,id,note,out,studentId,type`. A build
holding the level in a variable leaves no `alerted` key. The comment now names that, and says which
of the two checks makes which claim.

### 5. `[x]` A reader of the hook inventory finds all seven

All seven added, in two groups placed where the listener handles them:
`data-attendance-history`, `data-attendance-record`, `data-attendance-record-print`,
`data-attendance-record-csv` after the row hooks, and `data-pass-history`,
`data-pass-history-student`, `data-pass-history-all` after the pass hooks. Not a partial fix — the
sweep now proves the whole list: **142 delegated attributes, all findable in the 164-attribute
census.**

### 6. `[x]` `wo-sweep.mjs` fails when a delegated hook is missing from the inventory — proved

New section 12 in `tools/wo-sweep.mjs`, in the file's existing shape (a header comment carrying the
scar, then the check, with its own allowlist reasoning written down).

**Falsification A, run in a copy of the tree** (`scratchpad/falsify`, `.git` removed): I deleted the
`data-pass-history-all` row from `src/shell.js`'s inventory, leaving the handler intact. The sweep
went red:

```
FAIL | every delegated hook is in src/shell.js's inventory  :: data-pass-history-all
       (src/shell.js:1422) — delegated by the one listener and absent from the census at
       src/shell.js:17. Add the row, or say in one line that the list is not exhaustive; a list a
       few rows short is the same false promise. (This diff runs ONE WAY: an entry with no
       closest() call is not the mirror of this and is usually correct — see the comment at this
       check.)

18 checks · 12 passed · 2 failed · 4 to review          EXIT=1
```

Two notes on that output. The second FAIL is the `check()` call-site count, which I had not yet
updated in `tools/README.md` when I took the copy; it is green in the tree. And four REVIEWs rather
than two, because a copy with no `.git` cannot answer the two git-backed checks — they degrade to
REVIEW by design, which is `wo-sweep.mjs` behaving correctly about not knowing.

**The diff runs one way, and the comment says why at length.** Delegated-and-not-listed is a real
omission every time. The reverse produces 21 entries that are mostly correct documentation, and I
enumerated them in the comment so nobody re-derives it: 11 value-carrying companions, 5 form/field
hooks reached by `matches()` or `getAttribute()`, 2 empty hosts a module paints into, 2 gate
attributes named in prose on purpose — and `data-model`, which is the scan reading
`docs/data-model.md` out of a sentence. That last one is the clearest possible argument that the
other direction cannot be automated, so it is in the comment rather than in a fix.

Two bounds on the rule, both stated at the check rather than discovered later: the inventory side
matches `data-*` **anywhere in the block** (the permissive read, because that is the reader's — the
acceptance line is about someone searching the list), and the delegated side reads `src/shell.js`
only. `src/shell.js` is the only file in `src/` that calls `closest()` on a `data-` attribute today;
the single hit anywhere else is a sentence in `src/print-gate.js` naming this census. A missing
anchor sentence, or an empty delegated set, is a loud FAIL rather than a quiet pass, the way §11 does
it.

### 7. `[x]` The term window's upper bound is load-bearing — count stated

A third trip, `wo226-after`, is planted in WO-2.26's fixture sixty days past `term.end`, with its own
sentinel note. It is removed by id at the foot of the block with the other two, the way that block
already puts its fixture back, and the teardown check now names all three.

**Falsification B, in a copy of this tree:** `passesForStudentInTerm()` reduced to
`passesForStudent(doc, classId, studentId, term && term.start)` — the `to` bound dropped, one
deletion, no other change.

```
748 checks · 741 passed · 7 failed · 0 skipped     245s     EXIT=1
```

The seven that failed, all inside the WO-2.26 block: the inline trips check (the card drew 5 rows
where the log holds 4 in the window), the sibling-shape check, the term-scoping check itself (`"Hall
passes · 5 trips · 25 minutes out"` against the term's `4 trips · 14 minutes out`, over two distinct
days instead of one, with the after-sentinel on the card = `true`), the dialog-agreement check, the
printed sheet, and both presentation-mode negative controls.

**Falsification C — the run that shows the gap was real.** The same deletion against the tree as it
stood at `HEAD` (`git archive HEAD`, WO-2.26's own fixture, none of my changes):

```
746 checks · 746 passed · 0 failed · 0 skipped     247s     EXIT=0
```

Green. That is what "a check that cannot fail" means, and it is why the fix had to be a planted trip
rather than another assertion: **a bound with no trip beyond it is decoration.** WO-2.26's verifier
proved *a* filter load-bearing at 739/746 by deleting the whole thing; that never touched the
question of whether both bounds were.

### 8. `[x]` The hall-pass card is asserted on the `#scoresBody` route

One check at `tools/verify-shell.mjs:16336`, on the walk WO-3.7's block already takes — immediately
after the `#scoresBody [data-student-detail="…"]` click and the `READ` it already performs. No new
navigation, no new fixture, and **no `src/` file changed for it**:

```
PASS | the hall-pass card is on the Student Report screen when that screen is reached from a name
       in the score grid, and not only from the door inside the attendance history dialog
       :: the cards this route drew are ["Where the grade comes from","Missing work · 10 points at
          stake","Attendance · 83%","Hall passes · none"]
```

It asserts the card's presence and its position (last in the column), not its trips: that fixture's
class has no pass log behind it, so the card reads `Hall passes · none`, and what is being asked is
whether the card is built on this route at all.

### 9. `[x]` Both harnesses print what they printed before, but for the count

`verify-shell.mjs` 746 → **748**, exactly the two new call sites (neither in a loop, neither a
failure arm). `wo-sweep.mjs` 17 → **18 checks**, 15 → **16 passed**, the same 0 failed and the same
2 standing REVIEWs. `tools/README.md`'s recorded call-site count is updated from 748 to **750** with
a WO-2.27 entry in the running paragraph, from the run rather than by arithmetic.

**One drift I want on the record rather than buried.** Four check *names* and two detail strings
inside the WO-2.26 block changed, because the fixture they describe changed: *"one sixty days outside
it"* → *"one sixty days on EACH side of it"*, *"the log covers two"* → *"covers three"*, and the two
sentinels are now asked for separately. Leaving the old wording over a three-trip fixture would have
been a fresh instance of exactly the debt this work order exists to pay. The count line and every
other section's output are untouched.

---

## Files changed

| File | What |
|---|---|
| `src/attendance.js` | `stopPassClock()` on `paintPassBanner()`'s early return; the foot comment made true of every path; a new paragraph at `startPassClock()` recording why the interval survives leaving the registry |
| `src/shell.js` | Seven hook rows added to the inventory; a paragraph in `flipPresentationMode()` giving the stacking argument, the files it is read from, and the date it was walked on glass. **No redraw added** |
| `sw.js` | `CACHE` `planbook-shell-v56` → `v57`, because two SHELL files changed — the sweep's §9 caught it, as designed |
| `tools/verify-shell.mjs` | The `:10077` comment corrected; the early-return clock check (+1 site); the `#scoresBody` hall-pass assertion (+1 site); the third planted trip and the four assertions that now read both sentinels; teardown extended |
| `tools/wo-sweep.mjs` | Section 12 — the one-way delegated-hook diff and the argument for its asymmetry |
| `tools/README.md` | Call-site count 748 → 750, with the WO-2.27 entry and the falsification counts |
| `TESTING.md` | A WO-2.27 section under Phase 2, boxes matching this report; WO-2.26's third box updated where the new trip moved its figures |
| `plans/work-orders/phase-2-attendance.md` | Acceptance lines 2–9 ticked; line 1 left `[ ]` with an italic note pointing here |

Not touched: `CHANGELOG.md` (the teacher's), `plans/ROADMAP.md` (no `Closes roadmap` fragment on
this work order; `--audit` clean), and the work order's **Status**, which the gate writes.

No commit, no push — the brief did not ask for one. The working tree carries everything above.

---

## Decisions the work order did not settle, and which way I went

1. **The navigation half of acceptance line 1.** Went: document rather than change behaviour.
   Argued at length under line 1. This is the one place a verifier may reasonably disagree with me,
   and I would rather be corrected than have quietly cost the classroom an alert.
2. **`z-index: 999` for the header.** Went: state the true geometry (unpositioned header, fixed
   `z-index: 1000` overlay) and cite `src/shell.css` and `src/modal.js`, rather than copy a number
   that names `#loadingScreen`.
3. **What the sweep rule reads on the inventory side.** Went: every `data-*` token anywhere in the
   block, not just the left-hand column, because acceptance line 5 is about a reader searching the
   list. A hook mentioned only inside another row's paragraph passes the rule and is a documentation
   smell, not a broken promise. Stated at the check.
4. **Scope of the delegated side.** Went: `src/shell.js` only, with the bound named in the comment
   rather than guarded by a second clause, since one listener is the convention that file's own
   header sets.
5. **Renaming four checks in the WO-2.26 block.** Went: rename, because the fixture changed. Flagged
   under line 9 above.

## Temptations declined, so they are on the record and not in the diff

- **Adding the presentation-mode redraw** at `flipPresentationMode()`. Forbidden by Traps, and the
  comment now explains to the next reader why it would be wrong rather than merely unnecessary.
- **Running the hook diff the other way** and deleting the 21 entries with no `closest()` call. The
  comment enumerates them instead, `data-model` included, which is the entry that would have made a
  both-ways rule delete a sentence from a filename.
- **Tidying `#loadingScreen`'s `z-index: 999` or giving `.header` an explicit one.** Neither is
  broken and neither is in scope.
- **Asserting the overdue alert fires off-registry.** It is the load-bearing claim under my line-1
  decision and it deserves a check, but writing one is a new block in the hall-pass section and this
  work order's own Traps say stop when the tail starts wagging the dog. Proposed as a follow-up
  above, with the decision it depends on.

## Draft CHANGELOG entry — for the teacher to accept, reword or bin

> **Nothing you can see, and one thing you can now trust.** Four comments in the pass code were
> saying things the code beside them did not do, and two checks in the harness were passing over
> features that had already been deleted from under them. Both are fixed. The one that matters is a
> new standing check: `src/shell.js` keeps a list of every hook in the app, that list had been
> silently seven short across two work orders, and now a missing one turns the sweep red instead of
> waiting for somebody to notice.

## Nothing ticked that needs a device

No 👤 line was ticked, and this work order has none. Nothing here moves a pixel, a touch target or a
printed page. The one device-dependent fact it rests on — that the presentation-mode control cannot
be reached while a modal is up — was walked by the owner on 2026-08-14, which is what the new comment
records; I did not re-walk it and I am not claiming to have.
