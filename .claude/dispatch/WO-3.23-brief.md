# WO-3.23 — the score grid never learns which modifier keys were held · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.23-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at **Opus** tier, on the work order's own merits — the deciding signal
is Deliverable 1, which does not specify the fix but asks for a shape "by whatever survives review"
and requires the decision to *name its own cost*, and Deliverable 3, which asks for a recorded
judgment about every other key crossing the same shared seam. That is a convention being set at a
seam, plus a Traps section that is about what a check can *prove* rather than about mechanics. The
runner-up I set aside: the Acceptance list is mechanically checkable and `src/scores.js` is a settled
module with an established pattern, which reads Codex — but "establishes a convention" fires and ties
go to Claude. No Codex probe was run, because this never routed to Codex.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.23 — the score grid never learns which modifier keys were held

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** WO-3.16 · **Blocks** nothing
**Closes roadmap** *(no box. A defect inside what WO-3.5 and WO-3.16 already closed.)*

**Why it exists.** `src/shell.js:1626` hands the grid a key **name** and nothing else:

    if (scores.handleScoreKey(e.key, scoreCell)) e.preventDefault();

`e.shiftKey`, `e.ctrlKey`, `e.metaKey` and `e.altKey` never cross the seam, so `handleScoreKey()`
cannot tell `→` from `Shift`+`→` and answers both the same way. Where it answers *yes* it also
`preventDefault()`s, and the browser's own behaviour for the modified key is lost.

**The failing case is narrow and real.** `caretCanLeave()` hands the key back whenever the caret has
room to move in the direction pressed, which is most of the time and is why this has not been
noticed — the browser gets the key and extends the selection correctly by accident. It breaks at the
edges the arrow rule was written for: `Shift`+`→` with the caret already at the end of the value is
read as a plain `→` and **jumps to the next assignment instead of extending the selection**, and
`Shift`+`←` at position 0 does the same backwards. `Ctrl`/`Cmd`+arrow, which is word- and
line-motion on both platforms, has the identical shape.

**Named in the code rather than left silent**, at the `handleScoreKey()` comment WO-3.16 wrote, which
is why this is a work order and not a discovery. **It is the seam that is wrong, not the grid**: the
fix is what crosses `src/shell.js:1626`, and every other delegated key in that listener has the same
exposure the moment one of them wants a modifier.

**Deliverables**
- **The modifier state reaches `handleScoreKey()`**, by whatever shape survives review — the event
  itself, or a small explicit record of the four flags. Passing the event is the obvious move and has
  a cost the decision should name: it hands a module that currently receives a string the ability to
  read and cancel anything on the event.
- **A modified arrow is the browser's**, at the edges as everywhere else. The grid answers *no* and
  does not `preventDefault()`.
- **A judgment recorded on the other delegated keys** in that listener — whether any of the rest can
  be pressed with a modifier and mean something different, and whether they are wrong today. Do it or
  write down why not; the seam is shared and this is the one work order that will be looking at it.

**Out of scope** — binding any new modifier combination, `Home`/`End`, and changing what an unmodified
arrow does. This work order makes the grid **stop** answering keys that were never its own; it adds
nothing.

*(**`Home`/`End` was proposed on 2026-08-15 out of WO-3.16's verification and deliberately not
booked.** It would move to the first or last assignment in the row. Nothing asks for it, no sitting
has wanted it, and it is a convenience with no demand behind it — the same shape as WO-3.13, struck
the same day for the same reason. It is written down here so the proposal is not invisible, and it
comes back the first time somebody presses the key and finds nothing there.)*

**Acceptance**
- [ ] `Shift`+`→` with the caret at the end of a full cell extends the selection and does **not**
      change cell — a real keystroke with the modifier set, not a synthesised key name.
- [ ] `Shift`+`←` at position 0 does the same backwards.
- [ ] `Ctrl`/`Cmd`+arrow at both edges is the browser's, not the grid's.
- [ ] Unmodified `←` and `→` behave exactly as WO-3.16 shipped them, its checks green unchanged.
- [ ] `node tools/verify-shell.mjs` passes whole, with the count in `tools/README.md` moved in step.

**Traps** — **A check that synthesises a key name proves nothing here**, because the defect *is* that
only the name crosses the seam: a harness that calls `handleScoreKey('ArrowRight', cell)` cannot tell
a fixed build from a broken one. The keystroke has to be dispatched with the modifier actually held,
the way WO-3.16's caret checks dispatch real ones.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and none of these is optional:

- **`src/shell.js`, the whole `keydown` listener from ~1560 to ~1680** — not just line 1642. Read the
  five-guard comment block above it and the score-grid comment block inside it; both are prose that
  explains *why* the seam is shaped as it is, and both are candidates for being made stale by your
  change. **Read the guard order carefully and establish empirically what actually reaches
  `handleScoreKey()` today** for each of the four modifiers. Do not assume the work order's "Why it
  exists" paragraph is exhaustive about which modifiers are affected — check it, and if what you find
  differs from what it says, say so plainly in your result rather than silently building to the
  paragraph or silently building to what you found. That finding may narrow or reshape the fix.
- **`src/scores.js`** — `caretCanLeave()` at 1112, `handleScoreKey()` at 1153 and the comment block
  from 1128. Note especially the paragraph at **1107–1110**, "MODIFIERS ARE NOT READ, because
  src/shell.js passes a key name rather than an event…". That paragraph becomes false the moment this
  lands. Prose that outlives the fact it describes is the failure mode this project cares most about;
  the same is true of anything in `index.html`'s ⌨ Keys hint and in `TESTING.md` (see ~5298 and
  ~5386) that asserts this is "named and not fixed". Correct what your change falsifies; do not go
  rewriting sections your change leaves true.
- **`tools/verify-shell.mjs` lines ~250–301** — WO-3.22's static legend check. It finds the function
  by the literal string `export function handleScoreKey(` and then reads its body for
  `key === '…'` / `letter === '…'`. **If you change the signature or rename the parameter, that check
  can go vacuous or blind while still printing green** — WO-3.22's own correction round was exactly a
  check that passed over a deleted binding. If your change touches what that parser sees, re-run its
  mutation proof (delete a binding, watch it go red, revert) and record that you did.
- **`tools/verify-shell.mjs` around 15460–15500 and 16139** — WO-3.16's caret checks and the
  `rawKeyDown` shape they use. This is the pattern your new checks copy. **The `key()` helper at
  line 735 already takes a `mods` argument** (`Input.dispatchKeyEvent` `modifiers` bitmask: Alt 1,
  Ctrl 2, Meta 4, Shift 8), so a real modified keystroke is dispatchable today — which is what the
  Traps section demands and what a synthesised call to `handleScoreKey('ArrowRight', cell)` cannot
  give you. Assert the *caret and selection* after the keystroke, not only which cell is focused; a
  check that only reads focus cannot see a selection that failed to extend.
- **`.claude/dispatch/WO-3.16-result.md`**, the section "`Shift`+arrow is named in the code and not
  fixed" — the prior analysis that booked this work order. Start from it rather than re-deriving it.

**On Deliverable 3**, the recorded judgment about the other delegated keys: it is a deliverable, not
a courtesy. Walk every key `handleScoreKey()` answers to — `Enter`, `ArrowUp`, `ArrowDown`,
`Backspace`, `Delete`, `L`, `M`, `X` — and say for each whether a modifier changes what a browser or
a teacher would mean by it, and whether it is wrong today. Where the answer is "no change needed",
write the reason down. Binding new combinations is **out of scope**; naming the exposure is the
deliverable.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 5 lines, reported against one by one

1. `Shift`+`→` with the caret at the end of a full cell extends the selection and does **not** change cell — a real keystroke with the modifier set, not a synthesised key name.
2. `Shift`+`←` at position 0 does the same backwards.
3. `Ctrl`/`Cmd`+arrow at both edges is the browser's, not the grid's.
4. Unmodified `←` and `→` behave exactly as WO-3.16 shipped them, its checks green unchanged.
5. `node tools/verify-shell.mjs` passes whole, with the count in `tools/README.md` moved in step.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

