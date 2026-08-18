# WO-3.25 — a score cell takes any string `Number()` can read, not any number a teacher can mean · implementation result

**Implementer** Claude (work-order-implementer), Opus · **Date** 2026-08-17
**Verdict on my own work** All nine desk lines met and ticked. Line 10 is 👤 and is left blank — I
have no iPad.

---

## Files changed

| File | What changed |
|---|---|
| `src/scores.js` | The grammar, written down once (`SCORE_GRAMMAR` + `SCORE_STORABLE`), the exported `allowScoreInput()` the guard calls, `editScore()`'s header rewritten at the sentence that stopped being true, and the backstop replacing the bare `return` |
| `src/shell.js` | The delegated `beforeinput` listener (the first in the codebase), `insertedText()` beside `modifiersOf()`, and the `data-score-cell` row of the hook census updated from four hooks to five |
| `sw.js` | `CACHE` `planbook-shell-v73` → `v74` — two `SHELL` files changed |
| `docs/data-model.md` | The two-decimal rule for scores, with the SIS reason and the non-migration, beside the score-cell shape |
| `tools/verify-shell.mjs` | One new block inside the WO-3.5 section: 10 call sites, 22 executed results |
| `tools/README.md` | The asserted call-site count 825 → 835, and a check-count history entry |
| `TESTING.md` | New § WO-3.25, nine boxes ticked, the 👤 line left open, five-run table |
| `plans/work-orders/phase-3-gradebook.md` | Acceptance lines 1–9 ticked. **Status line untouched** |

Nothing else. `src/assignments.js`, `src/categories.js` and `formatWeight()` were read and left
alone; no follow-up is booked for them, exactly as the work order says.

## Verification commands, and what they actually printed

Five browser runs. Every number below is copied out of a run I waited for and read.

| Tree | Result |
|---|---|
| Baseline, before any of my edits | `840 checks · 840 passed · 0 failed · 0 skipped`, 22,698 lines, 269s, exit 0 |
| First draft of the new block | `861 checks · 859 passed · 2 failed · 0 skipped`, 284s, exit 1 |
| Selectors fixed, before the anti-vacuity clause | `861 checks · 861 passed · 0 failed · 0 skipped`, 281s, exit 0 |
| **Guard mutated** (`e.preventDefault()` removed from the `beforeinput` listener) | `861 checks · 849 passed · 12 failed · 0 skipped`, 281s |
| **Delivered** (mutation reverted; `git diff -- src/shell.js` shows no trace of it) | `861 checks · 861 passed · 0 failed · 0 skipped`, 23,109 lines, 26.8 lines per check, 281s, exit 0 |

`node tools/wo-sweep.mjs` on the delivered tree: `21 checks · 19 passed · 0 failed · 2 to review`,
exit 0. Both REVIEWs are the standing pair (sensitive field names; due-date-and-flag on one line) and
name exactly the lines they named on the baseline run.

The delivered run is a run of the delivered `src/`: after it, I edited only `tools/README.md`,
`TESTING.md`, `docs/data-model.md` and `plans/`, none of which the harness reads (it reads `sw.js`,
`index.html` and `src/*`).

**Two development probes, outside the repo, deleted from nothing because they were never in it**
(they live in the session scratchpad). They are why the harness block is shaped the way it is:

- `Input.insertText`, a real Ctrl+V and `Input.imeSetComposition` were each driven against a throwaway
  page to find out which produce a cancelable `beforeinput`. Findings: a plain-text paste into a text
  input arrives with the text in **`data`** and a **null `dataTransfer`** in Blink (the spec puts it
  in `dataTransfer`, which is why `src/shell.js` reads both); and `insertCompositionText` really is
  **`cancelable: false`**, so `preventDefault` on it is ignored by the browser.
- A second probe reproduced the editScore backstop shape against that page to confirm the rewrite of
  `input.value` sticks while a composition is still open. It does.

---

## Against the Acceptance list, one by one

**1. `1e3`, `0x1f`, `0b101`, `0o17` and `+7` cannot be produced — typed or pasted — and the store is
read to prove it.** ✅ Verified. Six typed cases, driven one character at a time at the page with the
cell read after **every** keystroke, and five pasted cases through the real clipboard
(`Browser.grantPermissions` for `clipboardReadWrite` + `navigator.clipboard.writeText` + a dispatched
`Ctrl`+`V`, which arrives as `beforeinput` / `insertFromPaste` — asserted per case out of the trace,
so a run where the clipboard did nothing goes red). Each read takes the field and the document's cell
in one evaluation after a store flush. Delivered-run evidence, e.g.:
`typing 1e3 … [{"typed":"1","field":"1","v":1},{"typed":"e","field":"1","v":1},{"typed":"3","field":"13","v":13}]`
and `pasting 1e3 … after = {"field":"87","v":87}`.

Two things a verifier should know rather than discover:
- Typing `0x1f` **marks the cell excused half way through**, because `src/shell.js`'s keydown swallows
  `L`/`M`/`X` for the flag bar before `beforeinput` exists. That is the work order's own Trap, I added
  no second refusal for those letters, and the check asserts the invariants through it (the character
  never lands in the field, 31 never lands in the store).
- Refusing a character leaves the *legal* ones: `1e3` typed into an empty cell ends as `13`. The check
  asserts that state explicitly rather than pretending the field ends empty.

**2. A third digit after the decimal point is refused; `87.25` is accepted and stored as `87.25`.** ✅
Verified. `87.256` typed key by key: `{"field":"87.25","v":87.25}`.

**3. `-5` stores `-5`, and a score above the points is still accepted unchanged.** ✅ Verified, in one
check so it cannot be quietly dropped: `-5` → `{"field":"-5","v":-5}`, and `300` on the 10-point
filler assignment → `{"field":"300","v":300}`.

**4. `-`, `.` and `12.` are typable, write nothing, and are not reformatted under the caret.** ✅
Verified. Field reads exactly the prefix, caret at its end, and the **whole scores map** is
byte-identical across the keystroke that completed the prefix (a one-cell comparison would pass on a
build that wrote somewhere else). Note for the record: after `12.` the store holds `12` — put there by
the `2`, not by the `.`; the byte-identical comparison is what says the dot wrote nothing.

**5. The field and the store cannot disagree — the `8a` case.** ✅ Verified, and driven through the
one path that genuinely cannot be cancelled rather than a scripted event: `Input.imeSetComposition`
produces `beforeinput` with `cancelable: false`, so `8a` really lands in the field, `editScore()` reads
it, and the backstop puts the field back to the `8` the document holds. A **capture-phase** trace
proves the field held `8a` for an instant — the app's own listeners are bubble-phase, so a
bubble-phase probe would only ever see the reconciled value. Delivered evidence:
`the field held 8a at input = true, uncancelable beforeinput = [{"type":"insertCompositionText","cancelable":false}]`.
Every refused input in lines 1–3 also reads field-against-store, not store alone.

**6. Existing out-of-grammar data survives.** ✅ Verified. `{v: 12.3456789}` planted through the store
(no control can make one any more), the grid left and re-opened through the real screen-nav segments —
**and the leave and the return are asserted**, not assumed — then the cell renders `12.3456789` with
the stored value unchanged. A second check drives the other half: one `⌫` takes it to `12.345678` in
the field *and* in the store, and the `9` that would put it back is refused.

**7. `docs/data-model.md` states the two-decimal rule and says why.** ✅ Written into the score-cell
shape bullet: the rule, the SIS reason, `toFixed(2)`, that it is about notation and never a value, and
that pre-existing cells are not migrated.

**8. `editScore()`'s header distinguishes a notation from a value.** ✅ The old sentence "it does not
clamp, round or refuse a number" is split: the *value* half is kept and strengthened (extra credit,
negatives), and a new paragraph says the third verb stopped being true on 2026-08-17, names what is
refused, and says why the sentence is there at all.

**9. `verify-shell.mjs` passes whole, checks driven through real events, count moved in step.** ✅
`861 checks · 861 passed · 0 failed · 0 skipped`, exit 0, delivered tree. Call-site count in
`tools/README.md` moved 825 → 835 and `wo-sweep.mjs` asserts it green. Every new check drives
`Input.dispatchKeyEvent`, a real clipboard paste, or `Input.imeSetComposition`; the only scripted DOM
calls are setup (`scrollIntoView`, `setSelectionRange`) and the two passive trace listeners.

**10. 👤 On the installed iPad.** ❌ **Not done and not tickable by me.** I have no iPad and the
harness drives a page, not an installed app. `sw.js`'s `CACHE` is bumped to `v74`, so the reading needs
a force-quit from the app switcher first, per `CLAUDE.md`. The box is left blank in the phase file and
in `TESTING.md`.

---

## The mutation run, and the vacuity it caught

This is the part I would want a verifier to read closely, because the first green run of this block
was worth less than it looked.

**The first draft of the eleven typed/pasted checks would have passed on a build with no guard at
all.** Every clause they carried — the field never holds `e`, the store never holds 1000, the two
agree after every keystroke — is *true* without the `beforeinput` guard, because `editScore()`'s
backstop rewrites the field on the very next `input` and a read taken after the keystroke sees the same
reconciled value either way. That is WO-3.24's lesson in a second shape: not a row measured against
itself, but two mechanisms where only one is under test.

The clause that separates them is the **absence of an `input` event carrying the refused text**, read
off the capture-phase trace. It was added *before* the mutation was run, not after a green result was
explained away. With `e.preventDefault()` removed from the guard and nothing else touched:
`861 checks · 849 passed · 12 failed`, naming the six typed cases (`{"ev":"input","value":"1e"}`), the
five pasted ones (`{"ev":"input","type":"insertFromPaste","value":"1e3"}` with the field back at 87 and
the store never wrong), and — the one I had written no clause for — *"edited down but not extended"*,
where the refused `9` landed and stored `12.3456789` again. Reverted; `git diff -- src/shell.js` carries
no trace.

**One earlier red was mine, not the app's,** and it is written into `tools/README.md` so the next
person does not spend the run on it: the block first left and re-entered the grid by clicking
`#classView [data-class-screen="assignments"]`. Every class screen carries its own strip, so while the
grid is up `#classView`'s is `display: none`, `getBoundingClientRect()` is zeros, `clickSel()` clicked
0,0, nothing re-rendered — and the check read an empty field over a stored `12.3456789` and reported
the app as broken.

---

## Decisions the work order did not settle, and which way I went

**1. Where the grammar lives, and what "imported everywhere it is needed" means.** The deliverable
asks for it written down once and imported. I put both patterns and the guard's logic in
`src/scores.js` and exported one function, `allowScoreInput(input, data, inputType)`, which
`src/shell.js` calls from the delegated listener. I did **not** create a `src/score-grammar.js`. Two
reasons: it matches the contract the keydown listener already has one line up (the module decides, the
shell cancels — WO-3.23's rule that a module is never handed the event), and a new file would mean a
new `SHELL` entry for a twelve-line module used by one caller. The grammar constants themselves stay
module-private; the only two things that need them are `editScore()` and the guard, and both are in
that file. If a third caller ever appears, the export is the seam to widen.

**2. `SCORE_STORABLE` — a second pattern the work order does not name.** This is the judgment call in
the whole change and the place to look if you think I deviated.

The work order says two things that pull apart if the backstop is written literally:

> A value that reaches it and fails the grammar … the answer is to **rewrite the field to the stored
> value**

> a `12.3456789` … stays, renders as typed, and **can be edited down** but not extended

Written literally, the backstop fires on `12.345678` — the state one `⌫` produces — and snaps the
field back to `12.3456789` on every deletion, freezing a number nobody can correct. So `editScore()`
keeps a value that fails the two-decimal grammar **only while the cell already holds one that does**
(`SCORE_STORABLE`, the same shape with the cap lifted, plus a check on the stored value). Everything
else out of grammar — `8a`, `1e3`, `0x1f`, `+7`, and a third decimal typed into an ordinary cell —
takes the backstop. I believe this is what the two paragraphs jointly require rather than a weakening
of either; it is commented at the point it is made, and both halves are driven in the harness (the
edit-down case is one of the twelve reds on the mutated tree, so the branch is reachable and not an
unwritten guard).

**3. Reading `dataTransfer` when `data` is null.** Measured: Blink puts a pasted string in `data` and
leaves `dataTransfer` null, so the second read is unreachable in the harness's browser. I kept it
anyway, and said so at the line: the spec puts the text there for `insertFromPaste`/`insertFromDrop`,
and WebKit on the iPad is the deployment target. This is not the same as WO-3.23's unreachable-guard
scar — that was a branch no *platform* can drive; this is a branch *this* browser does not drive. If a
verifier disagrees, deleting it costs nothing in Blink and the backstop still catches the result.

**4. Where the `beforeinput` listener sits.** Between the `keydown` and `input` listeners in
`src/shell.js`, in event order, delegated on `[data-score-cell]` exactly like its neighbours. That is
the convention the next `beforeinput` should copy.

---

## Temptations declined, and things I noticed but did not do

- **Points and category Weight (`type="number"`) were left alone**, along with `formatWeight()`'s
  display-against-store rounding. Named Out of scope with the refusal dated 2026-08-17, and the work
  order says no follow-up is booked — so I am not proposing one. The paragraph in the work order is
  the brief if one of them ever bites.
- **I did not migrate or round any stored score**, and said so in a comment where the next reader will
  look for a migration.
- **I did not write the `CHANGELOG.md` entry.** A draft is below if it is wanted.
- **One stale number I did not touch:** `tools/README.md`'s "Call sites and executed checks are
  permanently unequal" paragraph still says `808 − 824 = −16 on this tree`. It was already stale before
  this work order (WO-1.22 moved the counts to 825/840 and left that sentence alone); on the delivered
  tree it is 835 − 861 = −26. It is a third quantity in a paragraph nothing asserts, and correcting it
  is not in this work order — flagging it rather than editing it. **Proposed follow-up, small:** either
  bring that paragraph up to date in the same pass as the two counts it sits between, or delete the
  arithmetic and keep the reasoning, so there is one fewer hand-maintained number.
- **A check `verify-shell.mjs` cannot make:** none that this work order needed. Everything the desk can
  say about this change is driven through real events in that file; what is left is the iPad line, and
  no harness closes it.

## Draft CHANGELOG entry — yours to accept, reword or bin

> ### Fixed
> - **A score cell now takes a score.** `1e3`, `0x1f`, `0b101`, `0o17` and `+7` are numbers to
>   JavaScript and not to a gradebook; typed or pasted into the grid they used to store 1000, 31, 5,
>   15 and 7. Scores now take an optional `-`, digits and at most two decimal places — two because
>   the SIS carries two and the number is re-keyed by hand. Nothing is clamped or rounded: extra
>   credit above the points possible and a negative score are both still stored exactly as typed, and
>   scores already in a document are left alone.
> - **The field and the stored score can no longer disagree.** Typing `8a` used to leave `8a` on
>   screen while the document kept the old number, with nothing to reconcile them until the screen was
>   redrawn.
