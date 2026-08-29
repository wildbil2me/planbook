# WO-5.5 — The two sentences the flow does not say · implementer's report

**Route** Claude (work-order-implementer), Opus · **Date** 2026-08-29
**Work order** `plans/work-orders/phase-5-outreach.md` § WO-5.5 · **Brief**
`.claude/dispatch/WO-5.5-brief.md`

**Status written into the tracker:** ✅ DONE, via `node tools/wo-gate.mjs --tick WO-5.5` after all
four Acceptance boxes were ticked by hand. `--audit` PASSes.

---

## The two commands, from output I read

**`node tools/verify-shell.mjs`** — run five times in this sitting. The delivered-tree run is the
fourth (the fifth is the mutation round below), and it printed:

```
1265 checks · 1265 passed · 0 failed · 0 skipped
38,000 lines · 30.0 lines per check · 421s
EXIT=0
```

*(The first run died in 3 seconds on a `SyntaxError` — I had put backticks inside a browser-side
template literal and closed it. The second ran green except for one FAIL described under "A check
that was right to go red" below. The third was green at 1265/1265 and the fourth is the same tree
plus two harness DETAIL strings.)*

**`node tools/wo-sweep.mjs`** — run three times, last after every documentation edit:

```
34 checks · 31 passed · 0 failed · 3 to review
```

All three reviews are pre-existing and unchanged (sensitive field names outside `src/backup.js`;
due-date and late/missing on one line; a mockup banner naming the wrong sheet) — the same three
WO-5.6 recorded.

**Mutation round** — three lines in `src/` put back to what they said before this work order:
`UNDEFINED_FIELD_HEAD` → `'This draft cannot be sent'`, `FIELD_FIX_SENTENCE` →
`'The draft is blocked.'`, and the editor's starter line → *"Saving makes it yours"*. Read from the
run:

```
1265 checks · 1261 passed · 4 failed
EXIT=1
```

The four reds are the two new checks and the two rewritten ones. **The head is the one worth
reading**: one constant put back reddens the template editor's head check *and* the send flow's head
check together, which is the claim `src/block-strip.js` exists to make and could not have been made
before. Two clauses correctly did **not** fire, and I am naming them rather than counting them: the
send flow's *typing over the field unblocks it* check carries a clause asserting the instruction row
is gone once the draft is clear, and the editor's head check carries one asserting the instruction
never appears there at all. Both are absences, and an emptied sentence cannot make an absence fail.

Reverted by name — `git checkout -- src/block-strip.js src/templates-view.js`, with both staged
first (the standing note about a revert eating unstaged work in the same file), and
`grep -rn MUTATION src/` run **after** the revert: the only hit left in `src/` is a pre-existing
line of prose in `src/shell.js` about class mutations.

---

## Against the Acceptance list, one by one

### 1. Opening a starter in the editor states that it must be saved before a draft can use it — **met**

`src/templates-view.js`'s editor-state line, the `model.editing.from` arm, now reads:

> Starting from one of Planbook’s templates. It is not on offer when you write a message until you
> save it — change anything in it first, then save to make it yours.

It replaced *"Saving makes it yours — change anything in it first"*, which is true and answers a
question about ownership nobody was asking. `openStarter()`'s live-region announcement carries the
same sentence, so a screen-reader user hears it at the moment she opens the starter instead of only
if she navigates to that line.

**How I verified it:** a new `check()` in `tools/verify/templates.mjs`, inside the block that already
taps a real starter row, reading `#templateEditorState.textContent` **off the DOM** — a claim about
what the screen says is not settled by a flag on the model. It printed, green:

```
the editor state line reads: "Starting from one of Planbook’s templates. It is not on offer when
you write a message until you save it — change anything in it first, then save to make it yours."
```

It sits directly under the existing check that proves the rule it is about (opening a starter writes
nothing; two templates in the document before and after). Red under the mutation.

### 2. The strip heads *This draft has at least one undefined field* and says what to do — **met, with one decision the work order did not settle**

The head is one constant, `UNDEFINED_FIELD_HEAD` in the new `src/block-strip.js`, imported by both
screens. The instruction is `FIELD_FIX_SENTENCE`: *"Remove the field or type what it should say over
it — either one unblocks the draft."*

**How I verified it:** both harness assertions on the old head were rewritten — not relaxed. They
tested `/cannot be sent/` and `/cannot be sent/i`; they now test the head **whole and anchored**,
`/^This draft has at least one undefined field · \d+ thing(s)? to fix$/` and
`/^…· \d+ field(s)? did not resolve$/`, with every other conjunct kept. A new check in
`tools/verify/outreach.mjs` asserts the instruction is present while the draft is blocked, and the
existing *typing over it unblocks it* check gained a clause asserting it is **gone** once the draft
is clear — the pair is what stops the sentence passing vacuously.

**The decision I had to make and made:** *the new head is conditional on there being a merge field
in the list.* The send flow's strip counts **things to fix**, and three of its four kinds are not
fields — a recipient with no address, no message chosen, and *Copy me* with nowhere to copy to.
Heading a draft whose only fault is a missing guardian address with *"has at least one undefined
field"* would be the strip stating something false, which is worse than the defect this row came to
fix and is the opposite of the owner's own reason for the new wording (it **describes the state**).
So the owner's sentence heads the case it is true of and *"This draft cannot be sent"* heads the
rest. **The phrase surviving in `src/outreach-view.js` is that second arm, not a missed
replacement**, and it is commented as such at the line.

**A second decision, and this is the one most likely to be read as a gap:** *the instruction is on
the send flow and not on the template editor's preview.* It is advice about a **box**, and the two
boxes are not the same object. The send flow's holds one message to one person, so *remove it or
type over it* costs her nothing but this draft. The editor's holds the template every later draft is
cut from — so a teacher whose one previewed student has no guardian on file would be told, by the
app, to strip `{{guardian.name}}` out of a template that works for the other twenty-nine, directly
against the resolver's own sentence on the same strip (*there is nothing to put there*, which points
at the roster). The work order puts this half of itself **"in the send flow"** in as many words, and
its Traps line is about a **heading** changed in one screen and not the other, which is held exactly.
The absence is **asserted** in `tools/verify/templates.mjs` rather than left to be noticed, and
argued in a comment in `paintBlock()`. If the verifier reads Acceptance line 2 as requiring the
instruction on both surfaces, this is the line to fail me on — I would rather be corrected than have
put a misleading sentence on a template screen.

### 3. `src/merge-fields.js` untouched, per-field sentences unchanged — **met**

`git diff HEAD --stat` lists ten files and that is not one of them. `wo-sweep.mjs` § 20 reads it at
**221 lines of stripped code, 16 resolvable fields, 9 refusal words, no writer, no dynamic property
read** — the same figures as before this sitting. The refused sentence is still printed word for word
*under* the new head, which the check above the new one in `tools/verify/outreach.mjs` asserts in the
same breath as the head.

I never opened that file to edit it; I read lines 520–560 once, read-only, to see the wording the
instruction must not duplicate. No find-and-replace over "cannot be sent" was run anywhere.

### 4. Neither new sentence names a student — **met**

Both are module constants with no interpolation of any kind: no student, guardian, class, grade or
support value is reachable from either. Neither is drawn while the projector is on — the send flow
empties `#outreachBlock` before `paintBlock()` runs, and the preview hides its strip — and both
sections' existing presentation-mode checks passed unchanged, including the searches for the planted
`supports` strings and the guardian's address.

---

## What I could not verify

- **Nothing needed an iPad and no box here is 👤 or 📆**, so no box was left open for a device. But
  **no human has read either sentence on hardware**, and two things about them are eye questions a
  green harness does not answer: whether *"has at least one undefined field"* reads as help rather
  than jargon to a teacher who does not use the word *field*, and whether the instruction line
  earns the row of chrome it adds to the strip at 390px. The 390px touch pass over an open blocked
  draft is green and reports no sideways scroll, so the *layout* is measured; the *reading* is not.
- **The starter sentence's placement** — under the editor rather than in the send flow's empty
  picker — was the work order's instruction ("at the moment the question arises"), and I have not
  seen a first-time user meet it there. That is the same kind of evidence that produced this work
  order in the first place and it cannot be manufactured here.

## Things I left undone, deliberately

- **WO-8.13 was not taken.** `index.html` was **read once through `grep`** (one line, to confirm
  `#templateEditorState` is an existing `<p>`) and **never opened to edit** — the whole change is
  text written by JS into elements that already existed. So the 🎒 ride-along did not come due, and
  WO-8.13 is exactly where it was.
- **No `CHANGELOG.md` entry.** A draft is at the foot of this report for the teacher to take or
  ignore.
- **No stylesheet was opened.** The instruction row is a `.mf-reason`, which is what the strip's own
  ready-state sentence already is — not a second treatment inside a component whose whole ruling is
  that it has one. There is therefore **no new control** and no `@media (pointer: coarse)` work: I
  want that stated plainly rather than looking like the 44px rule was forgotten.
- **The clear-state heads were left as two literals.** They say different things ("ready for your
  mail app" against "8 fields resolved"), so there is no shared sentence to lift — only a shared
  prefix, and hoisting a prefix out of two sentences that differ invites a later edit to change one
  screen's meaning from a file that cannot see it. Written down in `src/block-strip.js`'s header as
  the rule for what belongs in that file.

## A check that was right to go red, and the fix that was not the check

`src/block-strip.js` as first written was two exported constants — **175 characters of stripped
code** — and the second harness run went red at
`tools/verify/classes-terms.mjs`'s term-literal sweep, which guards itself with `shortest > 200` so
that a comment-stripper which ate a file cannot read green. **Lowering that floor would have been
relaxing a check to fit new code**, which is the one thing the brief forbids twice. Instead the
module took the head's *grammar* as well as its words — `blockHead(sentence, count, singular,
plural)`, putting the `·` and the singular-or-plural agreement in one place, both of which were
also written out twice before. It stands at 288 characters, above `src/live-region.js`'s 250, so
**the tree's smallest module is the one it was before** and the guard is untouched. This is
recorded in `TESTING.md` § WO-5.5 and in the phase file, because "a new module tripped a vacuity
guard" will happen again.

## The two-heads decision, written down where the work order asked

**Unified, in a new module, rather than changed in step** — and the note is in the code, not only
here: `src/block-strip.js`'s header, plus a paragraph at each import site and at each `paintBlock()`.
The reasoning: the two heads were already *different strings that happened to open alike*, so
"change it once" was an intent with no shape to hold it, and changing both by hand would have
satisfied the Acceptance line today while leaving the next reader two hand-kept strings with no
reason to think they were meant to agree. The mutation round is the evidence it is structural: one
line reddens both screens.

The rule for what belongs in that file is written at its top — **a string belongs there when both
screens must say it word for word, and belongs on its screen when they must not** — so that the next
person to add a sentence has a test rather than a precedent.

## Files changed

- `src/block-strip.js` — **new**. Two sentences, one head composer, and the ruling.
- `src/outreach-view.js` — imports them; head conditional on a field being in the list; instruction
  row above the reasons; two comment blocks at the points of departure.
- `src/templates-view.js` — imports the head and the composer (not the instruction, with the reason
  at `paintBlock()`); the starter line under the editor and the matching announcement.
- `sw.js` — `./src/block-strip.js` added to `SHELL` with its note, `CACHE` bumped
  `planbook-shell-v105` → `v106`.
- `tools/verify/outreach.mjs` — head assertion rewritten whole; one new check; one clause added to
  the *typing over it unblocks it* check; two detail strings now pick their row by name.
- `tools/verify/templates.mjs` — head assertion rewritten whole plus the absence clause; one new
  check for the starter line.
- `tools/README.md` — recorded call-site count 1248 → **1250**, with the WO-5.5 paragraph and its
  mutation round.
- `TESTING.md` — new § WO-5.5 before § WO-5.6, four ticked lines with their evidence.
- `plans/work-orders/phase-5-outreach.md` — four Acceptance boxes ticked with evidence, **Where this
  stands**, and the three decisions this sitting made that the work order did not.
- `plans/work-orders/README.md` — written by `--tick` (Phase 5 row 3 → 5 done; totals 124 → 126,
  82% → 83%), plus one hand correction: the Phase 5 row's prose still read *"WO-5.4 and the four new
  rows ⬜"*, which WO-5.6's landing had already made false. It now names WO-5.5 and WO-5.6 as ✅ and
  WO-5.4, WO-5.7 and WO-5.8 as ⬜.

## Draft `CHANGELOG.md` entry — for the teacher, not written by me

> **The app now says the two things it was keeping to itself.** Open one of the eight starter
> templates and the editor tells you, right there, that it is not on offer when you write a message
> until you save it — the rule has always been that a Save is what makes a starter yours, and until
> now the only place you met it was an empty picker two screens later. And a draft with a merge
> field still in it no longer just refuses: it says *This draft has at least one undefined field*
> and tells you that removing the field or typing what it should say will unblock it. The wording is
> the same on the template preview and in the send flow, and it is now one sentence in one file, so
> the two screens cannot drift apart.
