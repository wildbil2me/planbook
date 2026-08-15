# WO-3.16 — left and right arrows move across the grid · implementation result

**Implementer** Claude (work-order-implementer, Opus tier) · **Date** 2026-08-14
**Verdict I am claiming** all five Acceptance lines met, each with evidence below.

---

## 1. What I built

`ArrowLeft` and `ArrowRight` now move one assignment column along the row, same student, clamping at
both ends with a spoken sentence at the edge — and they hand the key back to the caret whenever the
teacher is in the middle of a number.

**`src/scores.js`** (additions only — no existing line changed, and `moveWithinColumn()` is untouched):

- `moveAcrossRow(input, step)` — sibling of `moveWithinColumn()`, not a generalisation of it. Reads
  the row's cells in **document order** (`#scoresBody tr[data-score-row="…"] [data-score-cell]`),
  which is the drawn column order; focuses and selects the neighbour; clamps and announces at the end.
- `caretCanLeave(input, step)` — the trap's rule, described in §2.
- Two lines in `handleScoreKey()`:

  ```js
  if (key === 'ArrowRight') return caretCanLeave(input, 1) && moveAcrossRow(input, 1);
  if (key === 'ArrowLeft') return caretCanLeave(input, -1) && moveAcrossRow(input, -1);
  ```

  The `&&` *is* the contract: `caretCanLeave()` answering false answers false from `handleScoreKey()`,
  so `src/shell.js` does not `preventDefault()` and the browser moves the caret. Both new functions
  carry their own comment blocks in the file's voice; the existing blocks were not touched.

**`index.html`** — one entry in the key legend (`← →` *across the row, from the end of the number*)
and one clause in the standing hint under the grid. Both reuse `.scores-key` / existing prose: no new
selector, no new control.

**`sw.js`** — `CACHE` `planbook-shell-v61` → `v62`, since two SHELL files changed.

**`tools/verify-shell.mjs`** — three checks at the foot of the existing WO-3.5 block, plus `skRight`
/ `skLeft` beside the existing `skUp`. No second harness, no second fixture.

**`tools/README.md`** — the `check()` call-site count 760 → 763 with the WO-3.16 entry (the sweep
greps that sentence). **`TESTING.md`** — a WO-3.16 section. **`plans/work-orders/phase-3-gradebook.md`**
— the five Acceptance boxes ticked. I did **not** set `Status` or touch the README dashboard: that is
`wo-gate.mjs --tick`'s job after a verifier PASS.

---

## 2. The rule I chose for the trap, and why

**The key moves a cell only when the caret has nowhere left to go in the direction pressed.**

- the field is **empty** — there is no number to move through;
- the **whole value is selected**, which is what every keyboard arrival leaves behind
  (`moveWithinColumn()`, `moveAcrossRow()` and the flag bar all select on arrival) and is "ready to
  overtype" rather than a caret position somebody chose;
- or the caret is **collapsed against that end** — at `value.length` for `→`, at `0` for `←`.

Everything else is an edit in progress and the key goes back to the browser. A **partial** selection
counts as an edit position: the teacher made it, and collapsing it is what the arrow natively does.
An unreadable `selectionStart` (`null`, which is what `type="number"` would answer) is treated as a
caret with nowhere to go, because losing the move silently is the worse of the two failures.

**Why this and not something more symmetric.** The vertical pair's *edge behaviour* is copied exactly
— clamp, don't wrap, say so — but which presses reach the edge at all is deliberately asymmetric, and
that asymmetry is the work order's own: up and down mean nothing to a caret in a one-line field, left
and right mean everything.

**The cost, accepted rather than missed, and written into the comment:** in a cell arrived at *by
keyboard*, with the value selected, no arrow puts a caret inside the number — both move a cell. The
ways in are a tap (caret lands where the finger went) and the first digit typed (which collapses the
selection and hands the arrows straight back). The alternative — a first press that only collapses
the selection, a second that moves — was refused: four columns would be eight presses and the
odd-numbered ones would look like keys that were not received, which is the failure the sentence at
the edge exists to prevent.

**The edge sentence — the decision the brief handed me explicitly.**

```
down a column  — "<assignment>: that is the last student. 25 of 25 entered."
across a row   — "Score Row12: that is the first assignment."
```

The fixed thing is named first on both axes (the column you are working down; the student you are
working along), and **the count is dropped**. "N of M entered" down a column is progress through a
task the teacher is in the middle of and is what tells her the column is finished. Along a row there
is no such task — the columns with no score in them mostly have no score for anybody yet — and a bare
"4 of 10 entered" spoken beside a student's name invites being heard as how that student is *doing*,
which the grade two columns to the left already answers properly and weighted. Reasoning recorded at
`moveAcrossRow()` in `src/scores.js`.

**One further sub-decision:** at the horizontal edge the caret is **left exactly as it is** where
`moveWithinColumn()` re-selects. This axis can be pressed with the caret parked inside a number, and
re-selecting would throw away the position the teacher put there. Where she arrived by keyboard the
value is already selected, so the overtype affordance survives either way.

---

## 3. The Acceptance list, line by line

Evidence is from the run below, quoted from its output.

**1. `ArrowRight` from a full cell moves one assignment right, same student, value selected. — MET.**
`PASS | ArrowRight from a full cell moves one assignment right along the drawn row, same student,
with the arrived-at value selected for overtyping :: {"cell":"wo35-a1","student":"wo35-s12",
"index":0,…,"value":"72","from":0,"to":2} -> {"cell":"wo35-a2",…,"index":1,"value":"15","from":0,
"to":2} -> {"cell":"wo35-a3",…,"index":2,"value":"10","from":0,"to":2}`. Driven with real CDP
keystrokes at the page. Asserted as an **index along the drawn row**, not by assignment id, so a grid
drawing its columns in another order could not pass; the student id is asserted unchanged on each
arrival; `from:0, to:value.length` is the selection.

**2. `ArrowLeft` at the first assignment clamps, says so once, and moves nothing. — MET.**
`PASS | ArrowLeft at the first assignment clamps rather than wrapping … :: {"cell":"wo35-a1",…,
"index":0,"value":"72","from":0,"to":2} -> {"cell":"wo35-a1",…,"index":0,"value":"72","from":0,
"to":2}; said ["Score Row12: that is the first assignment."]; scores byte-identical = true`. "Says so
**once**" is counted, not inferred: a `MutationObserver` on `#srLive` collects every non-empty write
between the press and the read, because `announce()` *replaces* its text and a second sentence would
leave one `textContent` behind and read as a single one. "Moves nothing" is asserted twice — the
caret and its selection are identical either side, and the whole document's score map is
byte-identical.

**3. With the caret mid-value, `ArrowLeft` moves the caret and not the cell — driven with a real
keystroke. — MET.**
`PASS | with the caret mid-value ArrowLeft moves the caret and not the cell … :: {"cell":"wo35-a2",
…,"index":1,"value":"100","from":3,"to":3} -> {…"from":2,"to":2} -> {…"from":1,"to":1}; stored
{"v":100}`. It is a real keystroke path end to end: 15 is corrected to **100** by typing digits at the
page over the selected value, which leaves the caret at 3; the two `←` presses are
`Input.dispatchKeyEvent` at the page, through `src/shell.js`'s listener. Nothing sets `selectionStart`
by script and nothing calls `handleScoreKey()` directly. It is pressed at the column **one in from the
edge** so there is a column to the left for a build that stole the key to land on — at the first
column it would have passed by geography.

**4. The vertical pair still behaves exactly as WO-3.5 shipped it; its checks stay green unchanged.
— MET.** `git diff -U0 -- src/scores.js | grep "^-"` prints nothing: the change is additions only, and
`moveWithinColumn()`, `handleScoreKey()`'s existing branches and every existing comment block are
byte-identical. `moveWithinColumn()` was deliberately **not** refactored into a shared mover. The three
vertical checks ran green with no edit to their code: *"Enter at the bottom of a column keeps the caret
where it is …"*, *"clearing a cell deletes its key …"* (which uses `↑`), and *"Esc pressed twice
mid-column …"*. Same for `git diff -U0 -- tools/verify-shell.mjs | grep "^-"` — no harness line was
deleted or reworded.

**5. Twenty-five scores down a column is still twenty-five keystroke-groups and no mouse. — MET.**
The pre-existing check, unedited and still green: `PASS | twenty-five scores go down one column in
twenty-five keystroke-groups with no mouse, and land on the students in DRAWN row order rather than in
roster order :: mouse events during the column = 0 …`. Its page-side mouse counter still reads 0.

---

## 4. Verification — both commands run to completion, output read

```
node tools/verify-shell.mjs
  761 checks · 761 passed · 0 failed · 0 skipped
  20,139 lines · 26.5 lines per check · 253s
  exit 0
```

Run in this environment, to exit, on the delivered tree; the summary above is quoted from the output
file, not predicted. (Prior tree was `758 · 758 · 0 · 0`; +3 is exactly the three checks added.)

```
node tools/wo-sweep.mjs
  18 checks · 16 passed · 0 failed · 2 to review
```

Both REVIEWs are the pre-existing pair WO-3.19 recorded — the sensitive-field-name grep and the
due-date grep. Neither names a line this work order wrote: `git diff -U0 -- src/ index.html | grep
"^+" | grep -i "accommodat|medical|plan|support|due date"` returns nothing. The count check went red
once, as designed (`763 call sites, up 3 on the 760 recorded`), and is green after `tools/README.md`
was updated.

---

## 5. What I could not verify

- **Nothing was pressed on an iPad.** I have no hardware. For this work order that is a smaller gap
  than usual — the on-screen keyboard's number pane has no arrow keys — but a Smart Keyboard is how
  the owner grades at a desk, and the honest statement is that the two keys have never been pressed on
  the device. **No 👤 line was ticked**; the work order has none, and I added none to `TESTING.md`.
- **`Shift`+arrow is named in the code and not fixed.** `src/shell.js` passes `handleScoreKey()` a key
  *name*, not an event, so a modified arrow reads as a plain one — exactly as the vertical pair has
  always read `Shift`+`↓`. Over a full selection, `Shift`+`←` therefore moves a cell where a plain text
  field would shrink the selection. Fixing it means widening the shell seam; I judged that outside a
  work order about two keys and wrote the limitation into the comment instead.
- **Tap-then-arrow is not asserted.** Where the caret lands from a tap is the browser's answer to where
  the finger went, and a check over it would be measuring the click coordinate.
- **Screen-reader rendering of the edge sentence** is asserted as text in `#srLive`, not as speech.

---

## 6. Decisions the work order did not settle, and which way I went

1. **The edge sentence and its count** — decided as §2 describes (student named first, no count). The
   brief asked for this one explicitly.
2. **Whether a full selection counts as "at the edge"** — yes, it moves. The work order's candidate
   said so parenthetically; §2 records the cost I accepted and the alternative I refused.
3. **Whether the horizontal clamp re-selects the value** — no, unlike the vertical clamp. Reason in §2,
   commented at the point of departure.
4. **An unreadable caret position** — treated as "nowhere to go", so the move survives.
5. **Documenting the key on the screen itself** — I added one legend entry and one clause to the
   standing hint. Not in the Deliverables, but a shipped key the Keys panel does not list is a key
   nobody finds, and the deliverable's own reasoning is that a key which says nothing reads as broken.
   Flagging it as the one judgement call where I went slightly past the letter of the list.
6. **`sw.js` CACHE bump** — `v62`, because `index.html` and `src/scores.js` are both in SHELL and
   `wo-sweep.mjs` check 9 pairs them.

## 7. Temptations declined, recorded rather than acted on

- **Tab as a horizontal move** — the Out of scope line. Untouched, and the `WHAT IS DELIBERATELY NOT
  BOUND` block that explains why Tab is the browser's is unedited.
- **`Home` / `End` as "first / last assignment in this row"** — the obvious companion pair, and they
  would fall straight out of `moveAcrossRow()`. Not in the Deliverables; not built. Worth a size-XS
  work order if the owner wants it after a sitting.
- **Folding `moveWithinColumn()` and `moveAcrossRow()` into one mover.** The clamp and the announce do
  *not* genuinely fall out: the sentences differ, the count differs, and one re-selects at the edge
  while the other must not. A shared mover would have been three parameters and a conditional, and
  acceptance line 4 puts the burden on the refactorer. Two functions, one of them untouched.
- **Passing the whole event through `src/shell.js`** so modifiers could be read — see §5.
- **Tidying the existing comment blocks in `src/scores.js`** — explicitly not done; they are unedited.

## 8. Draft CHANGELOG entry — for the teacher to accept, reword or discard

> **Left and right arrows move across the score grid.** `←` and `→` now step one assignment along a
> student's row, the same way `↑` and `↓` step down a column — clamping at the ends and saying which
> end it is, rather than wrapping round. They stay the caret's keys while there is a number to move
> through: inside a partly typed score they edit the text, and they only leave the cell once the caret
> has run out of number in that direction. Fixing a handful of cells across a row no longer means
> reaching for the trackpad.

## 9. Files changed

- `c:\dev\planbook\src\scores.js`
- `c:\dev\planbook\index.html`
- `c:\dev\planbook\sw.js`
- `c:\dev\planbook\tools\verify-shell.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`
- `c:\dev\planbook\.claude\dispatch\WO-3.16-result.md` (this file)

Nothing was committed or pushed; the brief did not ask for it. `plans/work-orders/phase-3-gradebook.md`
also carries the orchestrator's own uncommitted `🤖 CLAIMED` status edit from before the dispatch —
that line is not mine.

---

# Correction round — 2026-08-14

**Verdict returned** FAIL, on the strings rather than on the code: all five Acceptance lines verified
clean and every tick judged true. The defect was that the two visible strings I added to `index.html`
described `←` backwards. The verifier is right, and the reason it is worse than a typo is the one it
gives: the failure mode of a documentation error on this key is *exactly* the failure mode the edge
sentence exists to prevent. A teacher who reads "from the end of the number", puts the caret at the
end of `100`, presses `←` and watches the caret move has been told by the app that a shipped key is
broken.

**The rule was not touched.** `caretCanLeave()` still ends `return step > 0 ? from === len : from === 0;`
— the rule the verifier passed. Only prose moved.

## 1. The strings, before and after

**The legend entry** — `index.html:1055` before, `:1061` after:

```html
<!-- before -->
<span class="scores-key"><kbd>←</kbd> <kbd>→</kbd> across the row, from the end of the number</span>
<!-- after -->
<span class="scores-key"><kbd>←</kbd> <kbd>→</kbd> across the row, once the caret runs out of number in that direction</span>
```

**The standing hint** — `index.html:1076-1078` before, `:1081-1084` after:

> *before* — "**← →** step sideways too, once the caret is at the end of the number — inside a number
> they still move the caret, so a score can be corrected without the mouse."

> *after* — "**← →** step sideways too, once the caret has run out of number to cross in the
> direction you press — the end of the score for **→**, the start of it for **←**. Inside a number
> they still move the caret, so a score can be corrected without the mouse."

## 2. Why worded that way

The correction's judgement is that the two surfaces carry the asymmetry **at different resolutions**,
because they are read at different moments.

- **The legend is scanned, not studied**, and it sits beside entries of five and seven words. Naming
  both ends there — *"from the start of the number for `←`, the end for `→`"* — is a sentence with two
  clauses and a role for each key, in a panel whose whole grammar is one key, one phrase. So it carries
  the asymmetry **relatively**: *"in that direction"* binds the condition to whichever key was pressed
  without spelling either out, and *"runs out of number"* says what the caret has to have done rather
  than where it has to be. The phrase is also the one already in the HTML comment above it and in
  `src/scores.js`'s comment block ("run out of number to cross"), so the visible string and the two
  written explanations of it are now the same idiom. That is deliberate: the reason this defect
  survived review is that the string and its own comment two lines above it said different things.
- **The hint is prose and has room**, so it states the ends explicitly — *"the end of the score for
  →, the start of it for ←"* — and keeps the "inside a number they still move the caret" clause, which
  is the half that tells the teacher nothing is broken. This is where a reader who did not believe the
  legend goes, and it should not send her back to guessing.

Rejected: *"from either end of the number"* (true and useless — it does not say which key wants which
end), *"from the near end"* (near to what?), and splitting the legend into two entries (doubles the
panel's row count for the pair that needed the least space).

**Consistency, checked rather than assumed.** `TESTING.md` was already correct — *"the caret has
nowhere left to go in the direction pressed … collapsed against that end"* — and is unchanged in that
respect; I added a paragraph recording the correction itself. The HTML comment above the legend was
already correct and now also carries the scar in two sentences, so the next editor knows the short
wording is load-bearing. `src/scores.js`'s comment block is untouched: it was right.

## 3. The right-edge check — added

Added, as one check inside the existing WO-3.16 block, immediately after the mid-value check and
before the frozen-columns block. It is nineteen lines of driving and one `check()`.

It **walks to the edge with the key**, not with a click: a click puts the caret where the coordinate
landed, and the claim is about a caret with nowhere left to go. It starts from where the mid-value
check left the caret — position 1 inside `100` — so the first two presses are the caret's and every
press after that is a column, which is why the walk is a capped loop against the drawn index rather
than a fixed number of presses. Then a `MutationObserver` on `#srLive`, a `readDoc()`, one more `→`,
and the assertion: the index does not move off `columns - 1`, the cell/caret/selection are identical
either side, the score map is byte-identical, and the region said exactly one sentence matching
`/^Score Row12: /` and `/that is the last assignment\.$/`.

It printed, in the run below:

```
PASS | ArrowRight at the last assignment clamps the same way and says THAT end — "that is the last
assignment", exactly once, with nothing moved and nothing written  :: 10 press(es) out to
{"cell":"wo35-p7","student":"wo35-s12","index":9,"columns":10,"value":"","from":0,"to":0} ->
{"cell":"wo35-p7","student":"wo35-s12","index":9,"columns":10,"value":"","from":0,"to":0};
said ["Score Row12: that is the last assignment."]; scores byte-identical = true
```

Ten presses out: two caret moves inside `100`, then eight columns from index 1 to index 9 of ten. The
`step > 0` arm of `moveAcrossRow()`'s clamp is now pressed rather than inferred.

## 4. Verification — both commands run to exit, output read

```
node tools/verify-shell.mjs
  762 checks · 762 passed · 0 failed · 0 skipped
  20,186 lines · 26.5 lines per check · 246s
  exit 0
```

Quoted from the run's own output file, after it exited — not predicted from a backgrounded call. The
first round was `761 · 761 · 0 · 0` in 253s; +1 is exactly the right-edge check. The other three
WO-3.16 checks printed unchanged (`wo35-a1 → a2 → a3` selected on arrival; the left clamp saying
*"Score Row12: that is the first assignment."* once; `100` with the caret walking 3 → 2 → 1 and
`{"v":100}` still stored).

```
node tools/wo-sweep.mjs
  18 checks · 16 passed · 0 failed · 2 to review
  exit 0
```

Same two REVIEWs as before, the pre-existing pair WO-3.19 recorded; neither names a line this round
wrote. Two sweep checks worth quoting because this round moved them:

- *"the recorded `check()` call-site count matches the harness :: 764 `check()` call site(s) in
  tools/verify-shell.mjs, matching tools/README.md:783"* — `tools/README.md` went 763 → 764 with a
  correction-round entry in the WO-3.16 paragraph.
- *"every SHELL file change is paired with a CACHE bump :: planbook-shell-v62 is not in any commit
  yet — the bump is uncommitted, which is the rule being followed"*.

## 5. `sw.js` — not bumped again, deliberately

Left at `planbook-shell-v62`. The bump is still uncommitted, so it has never shipped; `index.html`
changing again inside the same unshipped change is covered by the same bump, and the sweep's check 9
confirms that as the rule being followed rather than a gap. Bumping to v63 would have implied two
deployable versions where there is one.

## 6. Scope

Nothing else was touched. Specifically declined again this round: rewording the `↵` and `⇥` legend
entries to match the new idiom (they are correct as they stand and were not this work order's), and
adding a legend entry for `↑ ↓`, which have never had one — a real omission in that panel, but a
WO-3.5 omission and not mine to close inside a correction round. Worth a size-XS work order together
with the `Home` / `End` pair noted in §7 above.

## 7. Files changed this round

- `c:\dev\planbook\index.html` — the two strings and the comment above the legend entry
- `c:\dev\planbook\tools\verify-shell.mjs` — one added check in the existing WO-3.16 block
- `c:\dev\planbook\tools\README.md` — call-site count 763 → 764, correction-round entry
- `c:\dev\planbook\TESTING.md` — right-edge evidence on the clamp bullet, run figures 761/253s →
  762/246s, and a paragraph recording the wording correction
- `c:\dev\planbook\.claude\dispatch\WO-3.16-result.md` — this section

`src/scores.js` and `sw.js` are **unchanged this round**. Nothing committed or pushed.

## 8. What I still cannot verify

Unchanged from §5 above, and the correction does not shrink it: **nothing has been pressed on an
iPad**, no 👤 line is ticked, `Shift`+arrow is still named-and-not-fixed, and tap-then-arrow is still
unasserted. The new strings have been read on screen only through the harness's DOM, not by human eyes
at reading size on the device — the wording is verified as *accurate*, not as *legible in the panel at
26px kbd size*.
