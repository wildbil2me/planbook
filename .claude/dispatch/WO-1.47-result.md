# WO-1.47 — implementation result

**Work order** `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.47
**Route** Claude / Opus (work-order-implementer)
**Date** 2026-09-03 · **Round 2 — the correction round after a FAIL on Acceptance line 4**

**No mutation is live in the tree, and none was planted this round.** The correction round changed
comments only, so nothing new needed proving; the two plants described under *The mutation proof*
below are from round 1 and were reverted then. `grep -rn "MUTATION" src/ tools/ sw.js` was run as
the last command before this file was written: every hit is pre-existing prose *about* mutation
practice (`tools/README.md` ×4, `tools/verify/keys-legend-guards.mjs`, `outreach.mjs`,
`score-grid.mjs`, `wo-gate.mjs`, and `src/shell.js:799`, which is a comment about adding a class to
an enum). `grep -rn "MUTATION WO-1.47"` finds nothing outside prose in this file and `TESTING.md`.

---

## Round 2 — what the verifier found, and what I changed

**The verdict was right and the failure was mine.** The code moved correctly at all five sites in
round 1; what did not move was **`src/shell.js`'s attribute census**, the block at the head of the
file where every `data-*` hook in the app is documented. Four of the five date hooks are described
there, and all four still told a reader the rebuild happens on `change`. So the file contradicted
itself: line 76 said the rebuild is on `change`, and line 3103 — three thousand lines below — said
*"Do not put a rebuild back here."* That is the exact shape the work order's own Traps section names
and says this repo has paid for once already.

**Why my own check walked past it.** I stated `grep -rn "DateCommitted\|dateCommitted" src/` as the
check for Acceptance line 4. It searches **function names**. Every one of the four stale comments
names the **event** and no function at all, so the grep could not have found any of them. Two of the
four also wrap `change` and `rebuilds` onto different lines, so even a single-line grep on the event
finds only two of the four. That is now written down where it can be acted on rather than only
apologised for.

### The five census entries — repaired (`src/shell.js`)

| entry | now reads |
|---|---|
| `data-term-field` (was :75) | write on `change`, **rebuild on `focusout`** — "TWO EVENTS, and the rebuild is on neither of the other two" |
| `data-assignment-field` (was :179) | write on `change`, **rebuild on `focusout`**, and it names itself as the pair WO-1.47 was reported against |
| `data-dayoff-date` (was :313) | the `to`-follows-`from` carry **stayed** on `change`; only the rebuild moved to `focusout`, and it says which is which |
| `data-event-date` (was :335) | "same two hooks … the carry on `change`, the rebuild on `focusout`" |
| `data-support-date` (was :470) | was **incomplete** rather than wrong — named no event. It now names both, including the roster dot the `change` half re-draws |

### The `focusout` listener is in the census now

A new paragraph beside *"NOT EVERYTHING ON THIS SCREEN IS A CLICK"* states the split in one place:
`change` carries the WRITE, `focusout` carries the REBUILD, it is `focusout` **by construction**
rather than by a better guess, and *do not fold the two back together*. It points at
`termDateBlurred()` and `plans/known-bugs.md` § 1 rather than repeating them.

**One judgement call there, and I went the narrow way.** That existing paragraph says *"Three other
document-level listeners live further down"* and there are eleven. **It was already false before
WO-1.47** — `change`, `beforeinput`, `focusin` and the three drag listeners all postdate it — so
rewriting it into an accurate census was widening a work order that had just failed for a comment.
I added one parenthetical saying the count names only what was there to name and that this paragraph
is deliberately not being turned into a census, and left the sentence itself alone. If the owner
wants the count repaired, it is a one-line job and I would rather it were booked than smuggled.

### The ⚠️ — the transient empty write, now documented *at* the line

The work order says *"Say so at the line."* Round 1 put the phantom-empty-date paragraph in
`assignmentDateCommitted()`'s header — the neighbouring function — where a reader inside
`editAssignmentField()` would never see it. There is now a comment **on the store itself**
(`src/assignments.js`, the `else` branch of `editAssignmentField()`): the phantom exists for one
keystroke, it is harmless only because the element survives to receive the commit, the debounce makes
it one save, and telling *mid-typing* from *deliberately emptied* is WO-1.48's job. The header
paragraph stays; the two do not disagree.

### `tools/verify/assigned-and-due.mjs` — the comments, not the check

Both stale comments repaired. `clearDate()` never blurs, so since the move the block asserts **the
same element is empty**, not that a rebuilt one is. Both comments now say that in as many words, name
`date-zero-key.mjs` as where the two events *are* told apart, and state that extending the assertion
to drive a blur would be new coverage and was left alone deliberately.

**One thing I changed beyond the comments, and I want it seen rather than found:** the `check()`
**label** read *"leaves the rebuilt field empty"*, which is the same false claim in the string the
harness prints. I changed it to *"leaves the field empty"*. That is a label, not behaviour — no
assertion, no dispatch, no timing moved, and the call-site count is unchanged. Its twin claim in
`TESTING.md` § WO-3.17 was corrected in the same pass, with the correction marked as a correction and
the box left ticked, because the check is still green and still means something.

### `tools/verify/date-zero-key.mjs:136` — the backwards reasoning, corrected

The paragraph argued for `setAttribute` **because** `cloneNode(true)` carries attributes — which is
the argument for the *vacuous* witness, not the sound one. Rewritten: the attribute witness is sound
**here** because the assignment field is rebuilt by `dateField()`, which authors a fresh element and
copies nothing; and if this file is ever pointed at `data-support-date`, whose field is rebuilt by
`cloneNode(true)`, the witness there **has to be an expando property**, because that is what a clone
drops. Marked as a correction with its date. **No code changed.**

### `TESTING.md` § WO-1.47 — the stated check replaced

`grep -rn "DateCommitted\|dateCommitted" src/` is gone. In its place:

```
grep -rn -B3 -A3 -i "rebuild" src/*.js | grep '`change`'
```

**I verified this would have caught the failure.** Run against the pre-repair file
(`git show :src/shell.js`, which is the tree the verifier read) it returns **all four** stale entries
— lines 76, 180, 313 and 335 — among eleven hits. The `-B3 -A3` window is load-bearing: without it,
two of the four are invisible because the two words landed on different lines. Run against the
corrected tree it returns 29 lines; I read every one and none says the rebuild happens on `change` in
the present tense. A second grep is stated beside it that prints the five census entries in full,
since that block is the only place the five hooks are documented together.

The section also gained a paragraph recording the failure itself — what was wrong, why nothing caught
it (including that `wo-sweep.mjs` § 18 diffs the census for **presence only, on purpose**, so four
correctly-*listed* attributes keep it green whatever the listing says), and that the correction round
changed no behaviour.

---

## Against the Acceptance list, line by line

**1. `0` as the first digit leaves the same element, the caret in it, the date complete — [x]**
Unchanged from round 1 and re-verified green in this round's full harness run. Driven in
`tools/verify/date-zero-key.mjs` with `Input.dispatchKeyEvent` against a *Due* field seeded
`2026-11-20`: *after 0: same element = true, caret in INPUT[due], field "", document ""* :: *after 9:
same element = true, caret in INPUT[due], field "2026-09-20", document "2026-09-20"*. The empty read
in the middle is what makes the check non-vacuous.

**2. A full `09032026` leaves 2026-09-03 — [x]** *field "2026-09-03", document "2026-09-03", same
element = true*. Asserted over a re-seeded field, separately from line 1.

**3. The day segment, driven separately: `10032026` → 2026-10-03 — [x]** *field "2026-10-03",
document "2026-10-03"*.

**4. The other four fields moved and read, no comment describing a hook it no longer sits on —
[x], re-ticked after this round.** I set the box back to `- [ ]` before starting, as instructed, and
re-ticked it only against evidence I can name: the five census entries rewritten and read; the event
grep returning 29 lines on the corrected tree, each read by hand; the five module headers
(`termDateBlurred()`, `assignmentDateBlurred()`, `supportDateBlurred()` and the two `dateBlurred()`)
read again end to end; and the same grep run against the pre-repair file returning exactly the four
the verifier named. **If you want one thing spot-checked, make it `src/shell.js:75-78, 181-188,
319-323, 343-346, 479-482` and the new paragraph at `:595-604`.**

**5. 👤 iPad, after a force-quit — [ ] NOT TICKED, and not run.** I have no iPad and nothing in this
file is evidence about one. `sw.js` is at v108 and **that bump is uncommitted**, so it still covers
this round's edits — I confirmed it with `git diff HEAD -- sw.js`, which shows `v107 → v108` as an
unstaged/uncommitted change, and **no re-bump was needed**. Force-quit from the app switcher on the
device; a reload is not enough. The half that matters for WO-1.48 is the one expected to **fail**:
clear a date, then tap the same day again *without leaving the field*.

**6. All three tools green — [x], re-run on the corrected tree, not remembered.**
- `node tools/verify-shell.mjs` — **`1290 checks · 1290 passed · 0 failed · 0 skipped`**, 39,654
  lines, 30.7 lines per check, **435s**, `EXIT=0`. Backgrounded, waited for its own `EXIT=` line, and
  the figures above are copied from the summary block it printed. (Round 1's run read 39,632 lines /
  436s; the 22 extra lines are the comments this round added. The check count is unchanged because
  nothing was added or removed.)
- `node tools/wo-sweep.mjs` — **`40 checks · 37 passed · 0 failed · 3 to review`**, exit 0 taken from
  a separate run with output to `/dev/null` so the code is the sweep's own and not a pipeline's. The
  three REVIEW lines are the standing ones (sensitive field names, due-date/late-missing, the mockup
  banner); none is touched here. **§ 18's inventory check is green, and it was green before the
  repair too** — it diffs delegated hooks against the census for presence, which is why it never had
  an opinion about this failure.
- `node tools/wo-gate.mjs --audit` — **PASS**, exit 0, likewise taken from its own exit code.

**7. `TESTING.md` § WO-1.47 and the `known-bugs.md` § 1 strike — [x]** Unchanged in substance from
round 1; § WO-1.47 gained the correction-round paragraph and the new stated check. The reading I took
on the strike is below and is unchanged.

---

## The one contradiction the brief told me to resolve out loud (unchanged from round 1)

`known-bugs.md` § 1's body says it *"stays here unstruck in body because both work orders point back
at it for the measurement … it is closed when WO-1.48 ticks."* WO-1.47's Acceptance says *"§ 1 is
struck with this ID."*

**The reading: strike what WO-1.47 closed, leave the measurement standing.** A struck line at the
head of § 1 says *Struck in part 2026-09-03: WO-1.47 landed*, followed by what was closed, what is
still open (the whole root cause — and the iPadOS case is now **worse**, knowingly), and a note that
the line numbers below are **pre-move**. Not one word of the measurement was edited and nothing was
deleted, because that measurement is what WO-1.48 will be built and verified against.

---

## The mutation proof (round 1, reverted then; nothing planted in round 2)

Two plants in `src/shell.js`, both carrying a `MUTATION WO-1.47` comment, both reverted with
`git checkout --` against a fully staged tree **before any document was written**.

- **A** — put the rebuild back on `change` for the assignment pair. All four assignment checks went
  red: *same element = false, caret in BODY, document "2026-01-20"* — the reported bug verbatim.
- **B** — **deleted** the term field's rebuild instead of moving it (the Traps line's *"do not delete
  the rebuild outright"*). *a cleared term date … is rebuilt* went red at `{"rebuilt":false}` while
  the new check beside it stayed green — the two halves failing independently.

`1290 checks · 1285 passed · 5 failed`, exit 1.

---

## Proposed follow-up work orders — booked here, NOT built

Three things I was told to name and leave, and I left all three. The tree contains no code for any
of them.

1. **Harness coverage for the three unmeasured date sites.** `data-support-date`, `data-dayoff-date`
   and `data-event-date` have no keystroke fixture at all — 2 of 5 sites are measured and 3 are
   read by eye. Worth a row. Note for whoever builds it: the roster's field is rebuilt with
   `cloneNode(true)`, so `date-zero-key.mjs`'s attribute witness **would be vacuous there** and the
   witness has to be an expando property. That trap is now written at the witness itself.
2. **Extend `assigned-and-due.mjs` to drive the blur.** Its clear-a-date block stopped asserting a
   *rebuilt* field when the hook moved; it still asserts something true and useful, and adding a
   `focusout` to make it assert the rebuild again is **new coverage**, not a repair. I wrote the
   limit into the file rather than closing it.
3. **`src/shell.js`'s "Three other document-level listeners" sentence.** False before this work
   order, still false, deliberately not repaired here. Eleven document-level listeners exist. Either
   the count is corrected or the sentence stops counting.

A fourth, smaller: **`wo-sweep.mjs` § 18 could compare the census entry's named event against the
listener that actually routes the hook**, instead of presence only. That is what would have made this
failure a red line rather than a verifier's eye. It is a real design change to a check whose
presence-only scope is documented as deliberate, so it wants an argument, not a patch.

## Temptations declined this round

- **Rewriting the listener-count sentence** — named above instead.
- **Adding a blur to `assigned-and-due.mjs`** — the instruction was explicit and I agree with it.
- **Re-running the mutation round.** Nothing executable changed, so a plant would have proved
  round 1's checks again and told nobody anything new. If a verifier disagrees, the round-1 plants
  are described exactly enough to repeat in ten minutes.
- **Touching `plans/known-bugs.md`** — it was correct and stays as it was.

## Honest limits

- **No iPad.** Acceptance line 5 is untouched and unclaimed. Everything in this repo about iPadOS
  picker behaviour is carried forward from `src/classes.js`'s existing comment and
  `plans/known-bugs.md` § 1 — not observed by me.
- **A headless Chromium cannot reproduce the picker's stale selection**, so nothing here proves the
  rebuild still *works* on hardware — only that it still happens, at the new moment, and no longer
  happens at the old one.
- **This round's evidence for line 4 is a read, not a measurement.** A grep plus a human reading 29
  lines is what closed it, and a grep of prose is only as good as the reader. That is why follow-up 4
  above exists.
- **No `CHANGELOG.md` entry** — the teacher's to write. Draft unchanged from round 1: *"A date field
  no longer empties itself when you type a zero. Typing a due date that starts with `0` — every day
  from the 1st to the 9th, and every month from January to September — used to blank the field, throw
  away the date already in it and drop the cursor, so the rest of what you typed went nowhere. All
  five date fields in the app are fixed. On the iPad, clearing a date and immediately re-tapping the
  same day still needs you to leave the field and come back; an explicit Clear button is coming."*
- **Nothing was committed or pushed.** Round 1's work is staged; this round's edits are unstaged on
  top of it. `git diff --stat` for round 2 is 6 files, +150/−33, with no line-ending churn.
- **`--tick`/`--handoff` not run**; the status line is the orchestrator's to move.

## Files changed in round 2

- `c:\dev\planbook\src\shell.js` — five census entries + the `focusout` paragraph (comments only)
- `c:\dev\planbook\src\assignments.js` — the phantom-empty-date note moved **to** the store
  (comment only)
- `c:\dev\planbook\tools\verify\assigned-and-due.mjs` — two comments, and one `check()` **label**
- `c:\dev\planbook\tools\verify\date-zero-key.mjs` — the `cloneNode` reasoning corrected (comment only)
- `c:\dev\planbook\TESTING.md` — § WO-1.47's stated check replaced, the failure recorded, the run
  figures re-taken; § WO-3.17's "rebuilt field" claim corrected
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — Acceptance line 4 un-ticked,
  repaired, re-ticked with its evidence

## Files changed in round 1 (unchanged by this round unless listed above)

`src/assignments.js` · `src/classes.js` · `src/roster.js` · `src/days-off.js` · `src/events.js` ·
`src/shell.js` · `sw.js` (CACHE v107 → v108) · `tools/verify/date-zero-key.mjs` *(new)* ·
`tools/verify/classes-terms.mjs` · `tools/verify-shell.mjs` · `tools/README.md` · `TESTING.md` ·
`plans/known-bugs.md` · `plans/work-orders/phase-1-shell-store-roster.md`
