# WO-3.23 — the score grid never learns which modifier keys were held · implementation report

**Route** Claude (work-order-implementer) · **Reported** 2026-08-16
**Brief** `.claude/dispatch/WO-3.23-brief.md` · **Work order** `plans/work-orders/phase-3-gradebook.md:1720`
**Status left as `🤖 CLAIMED`** — the Acceptance boxes are ticked with evidence; flipping `Status` is
`wo-gate.mjs --tick`'s job on a verifier PASS, not mine. **Nothing committed, nothing pushed. No 👤
line ticked and none added. No `CHANGELOG.md` entry written** (draft at the foot).

---

## 0. The empirical finding the brief asked for, first, because it narrows everything below

**Only `Shift` ever reached `handleScoreKey()`.** The work order's *Why it exists* says
`e.shiftKey`, `e.ctrlKey`, `e.metaKey` and `e.altKey` "never cross the seam". Three of those four
never got as far as the seam at all: `src/shell.js`'s `keydown` listener opens

```js
document.addEventListener('keydown', (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;      // line 1638 on the delivered tree
  if (anyModalOpen()) return;
  ...
  const scoreCell = e.target.closest ? e.target.closest('[data-score-cell]') : null;   // 1666
```

— the modifier guard is the **first statement** of the listener and the score-cell branch is
twenty-eight lines below it. `Shift` is deliberately not in that guard (it is how `?` is typed,
which the five-guard comment says).

**Measured, not read off the source.** A `keydown` listener installed on `window` — which runs
*after* the document-level one, so it sees the app's verdict — reading `e.defaultPrevented` after
each press, at a score cell holding `100` with the value fully selected (the state a keyboard
arrival leaves), on the **unfixed** tree:

| press | `defaultPrevented` | what happened to the cell |
|---|---|---|
| `←` (bare) | **true** | stepped `wo35-a2` → `wo35-a1`. The grid took it — WO-3.16's rule, correct |
| `Shift`+`←` | **true** | stepped `wo35-a2` → `wo35-a1`. **The defect** |
| `Ctrl`+`←` | **false** | cell unchanged; the browser collapsed the caret to `[0,0]` |
| `Cmd`+`←` | **false** | cell unchanged, selection untouched (Meta has no native effect here) |
| `Alt`+`←` | *not readable* | **the page navigated Back.** `Alt`+`←` is history-back; `window.planbook` went undefined and the run died three checks later. Proof enough that it never reached the grid — the grid would have swallowed it |

That probe was a development instrument and is **not** in `tools/verify-shell.mjs`; what stands in
the harness is the behaviour rather than the reading. It is written up here because
`src/shell.js`'s comment and `tools/README.md` both point at this file for it.

**What it changed about the fix.** Nothing about the shape, and one thing about the honesty of the
Acceptance list: line 3 (`Ctrl`/`Cmd`+arrow) was **already satisfied before this work order**, by
the guard. I did not silently build to the work order's paragraph or silently build to what I
found — the record carries all four flags anyway, so the grid's answer no longer *depends* on a
guard above it that a later work order (one wanting `Cmd`+`Z`, say) may want to move. That is
stated at the code, at the check, in `tools/README.md`, in `TESTING.md`, and in the tick itself.

**And a second finding the work order does not mention, which is the wider half of the same
defect.** `moveWithinColumn()` has no `caretCanLeave()` gate — correctly, since up and down mean
nothing to a caret in a one-line field — so `↑` and `↓` were swallowed at **every** caret position,
not only at an edge. Held with `Shift` they are not nothing: measured in the same headless build,
`Shift`+`↓` at caret 1 inside `100` selects `[1,3]` and `Shift`+`↑` selects back to `[0,1]`. All of
that was being spent on changing student. I fixed it under Deliverable 2's "**a modified arrow** is
the browser's" — see §5, decision 2, where I name it as a judgment call rather than burying it.

---

## 1. Against the five Acceptance lines, one by one

### 1. `Shift`+`→` with the caret at the end of a full cell extends the selection and does **not** change cell — a real keystroke with the modifier set, not a synthesised key name — **`[x]`, with the wording corrected**

**Verified, with a real keystroke.** `Input.dispatchKeyEvent` with `modifiers: 8`, `rawKeyDown` +
`keyUp`, dispatched at the page and not at an element — the `key()`/`sk()` shape WO-3.16 uses, with
the bitmask filled in. Reading before and after: `wo35-a2`, student `wo35-s12`, value `100`, caret
`[3,3]` → `[3,3]`, column index 1 of 10 both times. On the unfixed tree the same walk stepped a
column.

**It does not extend the selection, and cannot.** At the end of the value there is no character to
its right. I measured what Chromium actually does at each caret position on a bare
`<input value="100">` in the same headless build **before** writing the assertions:

| state | `Shift`+`→` | `Shift`+`←` |
|---|---|---|
| whole value selected `[0,3]` | `[0,3]` — unchanged | `[0,2]` — **shrinks** |
| caret collapsed at end `[3,3]` | `[3,3]` — unchanged | `[2,3]` backward |
| caret collapsed at 0 `[0,0]` | `[0,1]` | `[0,0]` — unchanged |
| empty field | unchanged | unchanged |

The three states where the grid used to steal `Shift`+arrow are exactly the three
`caretCanLeave()` returns true for — empty, whole value selected, caret collapsed against that end
— and in every one of them the browser's own answer to the modified key in the direction that
*leaves* is to do nothing. So "the key is the browser's" reads at these edges as **a cell that did
not change**, not as a selection that grew. I have ticked the line and written that correction into
the tick, into `TESTING.md`, and into the check's own name, rather than asserting around it.

**Where a selection really does grow, it is asserted** — twice, and those are the checks that carry
the substance: `Shift`+`←` over the full selection a keyboard arrival leaves behind goes `[0,3]` →
`[0,2]` in the same cell (the sentence `src/scores.js` used to carry, verbatim), and `Shift`+`↓`
mid-number goes `[1,1]` → `[1,3]`.

### 2. `Shift`+`←` at position 0 does the same backwards — **`[x]`, same caveat**

**Verified.** Caret walked to `[0,0]` with a plain `←` (which the grid hands back, because
`caretCanLeave()` answers false over a partial selection — that intermediate state is asserted, not
assumed), then `Shift`+`←` with `modifiers: 8`: `[0,0]` → `[0,0]`, cell `wo35-a2` both times.
Driven at **column index 1**, not index 0, so that `wo35-a1` is sitting there for a build that stole
the key to land on — at the first assignment `moveAcrossRow()` clamps and the check would pass by
geography. Before the fix it landed on it. Same caveat as line 1: nothing to the left of position 0
to extend over, so the browser's answer is to do nothing.

### 3. `Ctrl`/`Cmd`+arrow at both edges is the browser's, not the grid's — **`[x]`, and it was already true**

**Verified with real modified keystrokes**, four presses covering both caret edges: `Ctrl`+`→` at
the end (`[3,3]`, unchanged), `Ctrl`+`←` from the end (word motion to `[0,0]`), `Ctrl`+`←` at 0
(`[0,0]`, unchanged), `Cmd`+`→` at 0 (`[0,0]`, unchanged). No press changes assignment, student or
score.

**This check is green on the unfixed tree too**, for the reason in §0 — the guard, not the grid.
I have said so in the check's own comment, in `tools/README.md`, in `TESTING.md` and in the tick,
so that nobody reads its green as proof of the fix. **What I could not do is make it falsifying
end-to-end**: the only way to see the grid's own refusal of a `Ctrl` arrow is to call
`handleScoreKey('ArrowRight', cell, { ctrl: true })`, and the Traps section rules that out as
evidence — correctly, since a synthesised call is exactly what cannot tell a fixed build from a
broken one. So the claim this check carries is behavioural and doubled-up, and its independence is
the honest gap.

**`Alt`+arrow is deliberately not pressed** and no check covers it. `Alt`+`←` is Back; driven once
during development it took the page out from under the run. That is the strongest argument in the
block for the work order itself, and it is recorded at the check rather than as an omission.

### 4. Unmodified `←` and `→` behave exactly as WO-3.16 shipped them, its checks green unchanged — **`[x]`**

**Verified by diff, not by eye.** All four WO-3.16 checks pass, and their `PASS | … :: …` lines are
**byte-identical** between the pre-WO-3.23 baseline run and the delivered run — including the caret
readings and the two live-region sentences:

```
--- ArrowRight from a full cell        identical
--- ArrowLeft at the first assignment  identical
--- with the caret mid-value           identical
--- ArrowRight at the last assignment  identical
```

And the whole run: sorting every `PASS/FAIL/SKIP` line from both runs and diffing them gives
**exactly five added lines and zero changed or removed**. No old check was re-pointed, reworded or
edited. `sk()` gained a fifth argument defaulted to `0`, so every press written before this work
order still dispatches a bare key — which is why the 790 old lines could not move.

### 5. `node tools/verify-shell.mjs` passes whole, with the count in `tools/README.md` moved in step — **`[x]`**

Run on the delivered tree, output read after exit:

```
795 checks · 795 passed · 0 failed · 0 skipped
21,302 lines · 26.8 lines per check · 263s
EXIT=0
```

against `790 checks · 790 passed · 0 failed · 0 skipped`, 21,120 lines, 259s on the tree as I found
it. `tools/README.md:812` moved **793 → 798** call sites and `wo-sweep.mjs` asserts it:

```
20 checks · 18 passed · 0 failed · 2 to review
PASS | the recorded `check()` call-site count matches the harness
      :: 798 `check()` call site(s) …, matching tools/README.md:812
PASS | one `check()` call per line in the harness :: 798 call-site line(s) …
PASS | every SHELL file change is paired with a CACHE bump :: planbook-shell-v71 …
```

Both REVIEWs are the standing pair (`sensitive field names outside src/backup.js`, 297 mentions;
`due-date and late/missing on the same line`) at exactly the counts and lines they had before this
landed. `git diff -U0 -- src/ index.html | grep "^+" | grep -iE "accommodat|medical|plan|support|due
date"` returns nothing.

---

## 2. Mutation proofs — run, not reasoned

**A. The fix itself, absent.** The five checks went in **first**, on the tree as I found it, and the
run read `795 checks · 790 passed · 5 failed · 0 skipped`. All five red, with the caveat I would
rather state than let a reader infer: **four of them fail on their own claim, and the fifth (Ctrl
and Cmd) fails only because a stolen `Shift`+`←` earlier in the walk carried it onto the wrong
cell** — cascade, not independent evidence. The first failure is the whole work order in one line:

```
FAIL | Shift+← over the value a keyboard arrival selects shrinks that selection and stays in the cell
  :: {"cell":"wo35-a2",…,"from":0,"to":3} -> {"cell":"wo35-a1",…,"value":"72","from":0,"to":2}
```

**B. WO-3.22's static legend check, re-proved because I changed the signature its parser finds.**
The brief flagged this and it was worth flagging: the check locates the function by the literal
string `export function handleScoreKey(` and reads `key === '…'` / `letter === '…'` out of its body.
Adding a third parameter leaves both intact — and the proof is not that reasoning but the run. On
the delivered tree it reads

```
10 key(s) bound by handleScoreKey() [Enter ArrowDown ArrowUp ArrowRight ArrowLeft Backspace Delete L M X]
against 8 legend row(s) carrying [↵ ⇥ ↑ ↓ ← → L M X ⌫]
```

— **character for character** what it read before the signature changed. And the mutation, run on
the whole harness rather than sliced: `if (key === 'ArrowUp')` deleted from `handleScoreKey()` with
`↑` left on the legend gives `795 checks · 793 passed · 2 failed · 0 skipped`, the WO-3.22 line
naming it — *"9 key(s) bound … ON THE LEGEND AND NOT BOUND: ↑"* — and beside it the cell-clearing
section, which presses `↑`, because this mutation really does take a key off the grid. Reverted from
a copy taken before it; `git diff` carries no trace and the binding is back at `src/scores.js:1185`.

---

## 3. Deliverable 3 — the recorded judgment on every other delegated key

Written into `src/scores.js` at `handleScoreKey()`'s comment block, and argued here. The short
version of the rule I applied: **a modifier is refused only where the browser has something of its
own to do with the key**, and never where refusing would break a key a teacher actually presses.

| key | can a modifier mean something different? | wrong today? | what I did |
|---|---|---|---|
| `Enter` | No. `Shift`+`Enter` does nothing native in a one-line `<input>` — no newline (not a `textarea`), no implicit submit (the cells are not in a `<form>`). `Ctrl`/`Alt`/`Cmd` never arrive | No | **Left alone.** Refusing it would produce a key that does nothing and says nothing, which is the "reads as not received" failure `moveWithinColumn()`'s own comment is built against. Binding `Shift`+`Enter` to "previous student" is a *new* combination and out of scope |
| `ArrowDown` / `ArrowUp` | **Yes.** `Shift`+`↓` selects to the end of the value and `Shift`+`↑` to its start — measured, `[1,1]` → `[1,3]` and → `[0,1]` | **Yes, and more widely than the horizontal pair** — no `caretCanLeave()` gate, so they were stolen at every caret position, not only at an edge | **Fixed.** See §5 decision 2 |
| `ArrowRight` / `ArrowLeft` | Yes — the work order's own case | Yes | **Fixed** |
| `Backspace` / `Delete` | No. They only act at all when the field is **empty** (`if (String(input.value).length) return false`). `Shift`+`Backspace` is `Backspace`; `Ctrl`+`Backspace` deletes the previous word — of nothing; `Shift`+`Delete` is a cut in some Windows contexts, and an empty field has no selection to cut | No | **Left alone**, reason recorded at the code. There is no native behaviour to give back |
| `L`, `M`, `X` | Yes, and refusing would be a **regression**: `e.key` is `'L'` exactly when `Shift` is held, so a modified-letter refusal refuses the capital most people type | No | **Left alone, and must stay that way.** This is the reason the fix is scoped to the arrows rather than written as a blanket "any modifier answers false" |
| `Esc`, `Tab`, digits, `.`, `-` | Not bound, by decision, documented in `src/scores.js` § WHAT IS DELIBERATELY NOT BOUND | n/a | Untouched |

**One exposure named and deliberately not coded around.** `Ctrl`+`X` on a score cell would apply
Excused *and* swallow the browser's Cut. It cannot happen while the listener's own modifier guard
stands above the score branch — which §0 measures rather than assumes — so the branch that would
refuse it is one no keystroke can drive red. An unreachable guard with no check behind it is worth
less than a sentence at the place a future edit would break it, so it is a sentence. It is at
`src/scores.js`, in the paragraph headed *"WHAT THAT LEAVES EXPOSED"*.

**The rest of the listener, beyond the grid** (the work order says "every other delegated key in
that listener"; the brief narrows it to the grid's, so this is the extra): the attendance registry's
keys — `↑`/`↓`, `Escape`, `?` and `P T A E D` — sit **below** the modifier guard, so only `Shift`
can reach them, and none of them is wrong today. `Shift`+letter is still that letter, which the
guard's own comment already says. `Shift`+`↑`/`↓` there moves the selected row in a table, not a
caret in a field, so there is no native selection to lose. And **`?` requires `Shift` on every
common layout** — which is precisely why `Shift` is not in that guard, and why a blanket
"any modifier returns" at the top of the listener would silently delete the shortcut list's
shortcut. That is the strongest argument I have against the tempting general fix, and it is why
this work order's fix lives at the grid's four arrows.

---

## 4. What I changed

| file | what |
|---|---|
| `c:\dev\planbook\src\shell.js` | `modifiersOf(e)` — a four-flag record — declared above the `keydown` listener with the reasoning for a record over the event; the score-cell call site now `scores.handleScoreKey(e.key, scoreCell, modifiersOf(e))`; the score-grid comment block gains the paragraph naming what crosses and which modifiers ever reached it |
| `c:\dev\planbook\src\scores.js` | `handleScoreKey(key, input, mods)` and one `held` clause; `!held &&` on the four arrow branches; the **"MODIFIERS ARE NOT READ"** paragraph at `caretCanLeave()` replaced (it became false); the function's comment block gains the per-key judgment table in prose and the `Ctrl`+`X` exposure |
| `c:\dev\planbook\tools\verify-shell.mjs` | `sk()` gains a fifth `mods` argument defaulted to `0`; `ALT`/`CTRL`/`META`/`SHIFT` and `skHeld(mods, dir)`; five new `check()` call sites at the foot of the existing WO-3.16 group, with the walk-back-by-key helper and the comment blocks that carry the findings |
| `c:\dev\planbook\tools\README.md` | call-site count `793` → `798`; a WO-3.23 paragraph beside WO-3.22's, with the run figures, the three traps in the new block, the Ctrl/Cmd finding, and the re-proof of WO-3.22's parser |
| `c:\dev\planbook\TESTING.md` | new `### WO-3.23` section with the five acceptance lines and two mutation rows; a note appended to WO-3.16's closing paragraph marking its `Shift`+arrow sentence as superseded (the sentence itself is left standing as the record of what that work order shipped) |
| `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` | the five Acceptance boxes ticked, each with its evidence and its caveat |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v70` → `v71` — two `SHELL` files changed |

`index.html` is **untouched**: the ⌨ Keys legend and the hint under the grid describe the unmodified
keys and are still true, and adding a `Shift` row would put a glyph on the card for a combination
nothing binds — which WO-3.22's check would correctly report as stray. **No new CSS, no new control,
no new visible string**, so there is nothing new for the `@media (pointer: coarse)` block to hold at
44px. No `localStorage`, no student data, no accommodation/medical/plan data anywhere near this.

---

## 5. Decisions the work order did not settle, and which way I went

1. **A record of four flags, not the event.** Deliverable 1 asked for a shape and asked the decision
   to name its cost. I refused the event and the cost I am naming is the one I avoided: this
   listener is the only thing in the app that decides whether a keystroke is swallowed — every
   branch under it routes to a module that answers a **boolean** and comes back here for the
   `preventDefault()`. That is what makes "a key this screen could not use belongs to the browser" a
   rule with one enforcement point rather than a convention every module is trusted to keep. Handing
   `scores.js` the event hands it `preventDefault`, `stopPropagation` and everything else on it, and
   the next module to want the target or the timestamp would take them without anything having to be
   decided. The record costs one object per keystroke and can be read for nothing else. It is a
   **function** (`modifiersOf`) rather than four inline arguments so the next delegated branch that
   needs the modifiers spells it the same way — **that is the convention I am setting**, and it is
   noted here because nothing in this listener had one.
2. **The vertical pair is included, and this is the call most open to challenge.** The work order's
   failing case is horizontal; Deliverable 2 says "a modified **arrow** is the browser's"; the
   *Out of scope* line forbids binding new combinations, `Home`/`End`, and changing what an
   **unmodified** arrow does. Refusing `Shift`+`↑`/`↓` is none of those three — it takes a key away
   rather than adding one, which is what the work order says it is for — and Deliverable 3 made me
   look at `ArrowUp`/`ArrowDown` and find them wrong today in a way that is *more* available to a
   teacher than the horizontal edge case (no `caretCanLeave()` gate means every caret position, not
   just an edge). I went ahead. If a verifier reads *Out of scope* more narrowly, the revert is two
   `!held &&`s and one check.
3. **Ticking Acceptance lines 1 and 2 whose wording is not achievable as written.** "Extends the
   selection" describes a state Chromium cannot produce at a collapsed edge. I ticked both and wrote
   the correction into the tick, the check name and `TESTING.md`, rather than leaving boxes blank
   over a wording error or ticking silently past it. If the verifier would rather the boxes were
   blank, this paragraph is the argument to overrule.
4. **The `defaultPrevented` probe is not in the harness.** It was the instrument that answered the
   brief's empirical question; what survives in `verify-shell.mjs` is the behaviour (the Ctrl/Cmd
   check) rather than the reading. Keeping the probe would have meant a permanent `console.log` that
   is not a `check()` — output masquerading as evidence, in a file whose whole discipline is that
   every claim is a counted assertion. The reading is recorded here and pointed at from
   `src/shell.js` and `tools/README.md`.
5. **`ALT = 1` is declared in the harness and never used.** It documents the full bitmask beside the
   three that are used, and the reason it is not dispatched is written twenty lines below it in the
   Ctrl/Cmd block. Flagging it so it does not read as a leftover.

---

## 6. What I could not verify

- **Nothing was pressed on an iPad. No 👤 line was ticked and none was added.** For this work order
  that gap is specific and worth naming rather than boilerplate: **every gesture here needs a
  hardware keyboard.** The on-screen number pane has no arrow keys and no `Shift`+arrow, so a Smart
  Keyboard at the owner's desk is the only place on that device where any of this exists. Whether
  iPadOS Safari reports `e.shiftKey` and `e.metaKey` the way headless Chromium does, and whether
  `Cmd`+`←` there means "start of line" rather than history-back, are questions a desk cannot
  answer. If the owner wants one line added to `TESTING.md` for a future sitting, it is *"with a
  Smart Keyboard attached, hold Shift and press ← inside a score you have just arrived at: the
  selection should shrink and the cell should not change."* I did not add it, because inventing a 👤
  line is a decision about what is owed and that is the teacher's.
- **`Alt`+arrow is asserted nowhere.** It navigates the page and would take the harness with it. The
  guard covers it; nothing measures that it does.
- **The Ctrl/Cmd check is not independently falsifying** — see line 3 above. It is green on the
  unfixed tree, and the only way to make it red would be a synthesised call the Traps section rules
  out.
- **Screen-reader rendering** — untouched by this work order; the live region is not written on any
  of these presses, and the byte-identical document assertion is what proves nothing was.

---

## 7. Out-of-scope temptations I declined

- **`Home`/`End`.** Named in the work order as proposed-and-not-booked. Nothing here changes that,
  and I did not bind it. Worth saying that the modifier record makes `Shift`+`Home`/`End` (select to
  the start or end of the number) free the day it is wanted.
- **Refusing `Ctrl`/`Alt`/`Cmd` on `L`, `M`, `X` and `⌫`.** Six characters of condition; an
  unreachable branch no check could drive red. Named at the code instead. §3.
- **Correcting the work order's own line reference.** *Why it exists* cites `src/shell.js:1626` for
  a call site that was at `1642` before I touched it and is at `1668` now. It was already wrong at
  dispatch. I left the work order's prose alone — it is the record of what was asked, not a document
  my change falsified — and note it here so it is not rediscovered as a defect.
- **Rewording the ⌨ Keys legend or the grid hint.** Both describe the unmodified keys and both are
  still true. The brief says to correct what the change falsifies and nothing it leaves true.

---

## 8. Draft `CHANGELOG.md` entry — yours to keep, cut or rewrite

> **Fixed** — On the score grid, holding `Shift` now belongs to the number rather than to the grid.
> `Shift`+`←` over a score you have just moved to shrinks the selection instead of jumping you to
> the previous assignment, and `Shift`+`↑`/`↓` select to the start and end of the number instead of
> changing student. At the edges of a number, where the browser itself would do nothing, nothing
> happens. Unmodified arrows are exactly what they were.
