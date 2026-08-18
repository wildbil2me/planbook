# WO-3.25 — a score cell takes any string `Number()` can read, not any number a teacher can mean · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-3-gradebook.md`
**Report to** `.claude/dispatch/WO-3.25-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier**: this work order is in the Claude column on its
own merits, because its Traps and Deliverables turn on judgment distinctions a clean-code pass will
collapse — an incomplete legal prefix (`-`, `.`, `12.`, `-.`) is *not* an illegal value and gets a
different answer; refusing a **notation** is not clamping a **value**; and existing out-of-grammar
stored data is deliberately *not* migrated — plus it writes reasoned prose into `docs/data-model.md`
and rewrites a header comment at the exact point it stops being true. The runner-up I set aside: on
the surface it reads Codex-shaped, since the grammar is fully specified in the work order text and
the Acceptance is mechanically checkable, but the budget arithmetic fails it independently
(`verify-shell.mjs` is ~4.4 min/run and the Acceptance demands an open-ended run count — at least
three, so ≥13.2 min of a hard 20-min cap — leaving no room to read `src/scores.js` and `src/shell.js`
and author new harness checks). Per `ROUTING.md` § "Which Claude", the Claude column is read first,
so the stopwatch does not decide the tier: **Opus, not a Sonnet fallback.**

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-3.25 — a score cell takes any string `Number()` can read, not any number a teacher can mean

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** M · **Depends on** WO-3.5 · **Blocks** nothing
**Closes roadmap** *(no box. `ROADMAP.md`'s **Score entry grid** line is `[x]` and stays `[x]` — the
grid works and this does not un-tick it. What is wrong is the set of strings it accepts, which no
roadmap line ever described.)*

**Not marked 🚩, and the reasoning is worth reading before anyone flips it.** Every value below has to
be *typed*, and on the iPad the score cell asks for a decimal keypad — there is no `e`, no `x` and no
letter on it at all. This is a **laptop-only** hole. It is still a live-path hole: grades are entered
once or twice a week (`CLAUDE.md` § Working agreements), and that is the laptop.

**Why it exists.** `editScore()` at `src/scores.js:880` validates a typed score with
`Number(raw)` + `Number.isFinite`, which is JavaScript's number grammar and not a gradebook's.
Measured with bare Node on 2026-08-17, not read off the spec:

| typed | stored |
|---|---|
| `1e3` | `1000` |
| `0x1f` | `31` |
| `0b101` | `5` |
| `0o17` | `15` |
| `+7` | `7` |
| `12.3456789` | `12.3456789` |

The cell is the app's **one** `type="text"` numeric field (`src/scores.js:474`), carrying
`inputmode="decimal"` — which is a keyboard *hint* and has never rejected a character. That is why the
owner has seen this on scores and nowhere else: Points and Weight are `type="number"` and the browser
filters their keystrokes for free. **Read the Out of scope section before "fixing" those too.**

**The second half is worse than the table, and it arrives through the guard meant to prevent it.**
Type `8a`: `Number` refuses, `editScore` returns **without writing**, the field goes on showing `8a`,
and the store keeps the previous number. Nothing reconciles them — `src/shell.js:1764` wires `input`
and `focusin` on a score cell and **there is no `blur` or `change` handler anywhere**, so the screen
and the store disagree until something else forces a re-render. `src/scores.js`'s own header calls a
score that silently is not what you typed *the worst thing a gradebook can do*, and
`docs/data-model.md:306` says it in the same words. This is that, produced by the refusal path.

**Deliverables**

- **The grammar, written down once and imported everywhere it is needed.** One decimal number:
  an optional leading `-`, digits, at most one `.`, **at most two digits after it**. Two decimals is
  the owner's call of 2026-08-17 and it has a reason: the SIS carries two, this number is re-keyed
  into it by hand, and `toFixed(2)` is already how every percentage in this app is printed
  (`src/scores.js:314`).
- **Legal prefixes are accepted into the field and are not values.** `-`, `.`, `12.` and `-.` are
  what a field looks like part-way through a number. They must be typable, and they must still write
  nothing — which is what `editScore` does today and is correct. **The distinction this work order
  turns on: an incomplete legal prefix is not an illegal value, and the two get different answers.**
- **Negatives stay legal.** Owner's call, 2026-08-17, and it is the extra-credit reasoning pointed the
  other way: a teacher who types `-5` meant `-5`. `docs/data-model.md` § Extra credit already refuses
  to silently discard points a teacher awarded; refusing a penalty she entered is the same move.
- **A `beforeinput` guard on the score cell**, cancelling the event when the prospective field
  contents fail the grammar. **This is the first `beforeinput` in the codebase** — grep confirms none
  — so it goes into `src/shell.js`'s delegated listeners beside `input` and `focusin`, not onto the
  element. Three things it must get right:
  - **Test the prospective value, not `event.data`.** Splice `data` into the current value across
    `selectionStart`/`selectionEnd` and test the result. Written that way, **paste, drag-and-drop and
    autofill are covered by the same test for free**; written against `data`, none of them are.
  - **Deletions always pass.** `deleteContentBackward` and its siblings can only shorten the field,
    and a value you cannot get back out of is a cell you cannot correct.
  - **Not every `beforeinput` is cancelable** — IME composition on some soft keyboards is not. Do not
    write code that assumes the cancel took, which is what the backstop below is for.
- **A backstop in `editScore()`, replacing the bare `return`.** A value that reaches it and fails the
  grammar can only have come through a path the guard could not cancel; the answer is to **rewrite the
  field to the stored value**, so screen and store cannot disagree. A legal prefix still writes
  nothing and leaves the field alone. This is belt-and-braces on an almost-unreachable path and it is
  the deliverable that actually closes the `8a` divergence.
- **The precision rule written into `docs/data-model.md`.** There is none today for scores — the
  document states one for *weights* ("stored exactly as typed — decimals included",
  `docs/data-model.md:313`) and says nothing at all about score precision, so the rule this work order
  enforces currently exists nowhere. It goes in beside the score-cell shape, with the SIS reason.
- **`editScore()`'s header paragraph rewritten at the point it stops being true.** It says today that
  the function "does not clamp, round or refuse a number." After this work order that is still true of
  the **value** — extra credit above points possible is untouched, and so is a negative — and false of
  the **notation**. Write the distinction down there. A reader who finds a refusal under a comment
  promising none will resolve it in one of two directions and one of them undoes this.

**Existing stored data is not rewritten, and that is deliberate.** A score of `12.3456789` entered
before this lands stays `12.3456789`, renders as typed, and can be edited *down* but not extended —
appending a digit fails the grammar and the guard refuses it. Retro-rounding a number a teacher
already typed is exactly the silent-wrong-number failure this work order exists to close, wearing a
fix's clothes. Say so in the comment; the next reader will want to add a migration.

**Out of scope, named rather than left to be re-derived.** Points (`src/assignments.js:637`) and
category Weight (`src/categories.js:331`) are `type="number"`. The browser filters their keystrokes,
which is why **the owner reports seeing this only on scores (2026-08-17)** and why they are out. What
remains on them is narrow, and it is **read from the HTML spec rather than measured here**: `1e3` is a
valid floating-point number so a number input takes it; decimals are uncapped; and pasting non-numeric
text makes `.value` read `''`, which `Number('')` turns into **`0`** — silently making an assignment
worth zero points, which the grade engine reads as extra credit rather than as an error.
**Converting them to `type="text"` to bring them under this grammar was considered and refused on
2026-08-17**: it trades the browser's own filter for a hand-written one, on two fields that work
today. **No follow-up work order is booked.** If one of those three ever bites, this paragraph is the
brief for it.

**Also out of scope: `formatWeight()`'s display-against-store rounding** (`src/categories.js:194`). It
rounds to 2dp for display while the store keeps full precision, so a weight typed as `33.335` stores
`33.335` and re-renders as `33.34` — the same *family* as the `8a` divergence, older, on a different
field, and needing a different fix. Recorded here because it was found while cutting this work order
and would otherwise be found again.

**Acceptance**
- [ ] `1e3`, `0x1f`, `0b101`, `0o17` and `+7` cannot be produced in a score cell — by typing **or by
      pasting** — and the store is read to prove it, not the field.
- [ ] A third digit after the decimal point is refused; `87.25` is accepted and stored as `87.25`.
- [ ] `-5` is accepted and stored as `-5`, and a score above the assignment's points is still accepted
      unchanged. **A run that closes the line above by breaking either of these has failed.**
- [ ] Typing `-`, `.` or `12.` leaves the field showing exactly that, writes nothing, and does not
      rewrite or reformat the field under the caret.
- [ ] **The field and the store cannot disagree.** Drive every refused input above and read the
      cell's value against the stored cell after each one. This is the `8a` case and it is the reason
      the work order exists; a check that only asserts the store is half a check.
- [ ] Existing out-of-grammar data survives: a document holding `12.3456789` renders it, and the value
      is unchanged after the grid is opened and left without editing that cell.
- [ ] `docs/data-model.md` states the two-decimal rule for scores and says why.
- [ ] `src/scores.js`'s `editScore()` header distinguishes refusing a **notation** from clamping a
      **value**, at the point the old sentence stops being true.
- [ ] `node tools/verify-shell.mjs` passes whole, with the new checks driven through real events and
      the count in `tools/README.md` moved in step.
- [ ] 👤 On the installed iPad, force-quit first: a score is entered, corrected and cleared on the
      decimal keypad with no character refused that the keypad offers. **The keypad has no letter on
      it, so this reading is that the guard did not cost anything — not that it caught anything.**

**Traps**

- **`inputmode="decimal"` is not a validator and never was.** The comment at `src/scores.js:470`
  answers a different question — why not `type="number"` — and reading it as a validation claim is how
  this hole survived four work orders on this grid.
- **`L`, `M` and `X` never reach `beforeinput`.** `src/shell.js`'s `keydown` swallows them first
  (`src/scores.js:1152`). Do not add a second refusal for them: it would be a branch no keystroke can
  drive, and WO-3.23 already wrote down what an unreachable guard with no check behind it is worth.
- **The cell must stay `type="text"`.** `caretCanLeave()` reads `selectionStart`
  (`src/scores.js:1120`) and a number input answers `null` to that question — WO-3.16's
  arrow-across-the-row behaviour dies silently if the field type changes.
- **`Number('')` is `0`, not `NaN`.** Any new parse path keeps `raw === ''` handled ahead of it, or an
  emptied cell starts scoring zero.
- **The grid renders 25 rows × N columns of these inputs.** The guard runs per keystroke on the
  app's second-most-frequent action; keep it a string test, and do not reach for the store from
  inside it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/assignments.js`
  - `src/categories.js`
  - `src/scores.js`
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Also open these before writing, and the reason for each:**

- **`src/shell.js` around line 1764** — the delegated `input` and `focusin` wiring for the score cell.
  The `beforeinput` guard goes *there*, beside them, not on the element. This is the first
  `beforeinput` in the codebase, so whatever shape you give it is the convention the next one copies:
  match how the neighbouring delegated listeners resolve their target and bail out, rather than
  inventing a parallel style.
- **`src/scores.js` around lines 314, 470–474, 880, 1120, 1152** — in that order they are: the
  `toFixed(2)` precedent the two-decimal rule is drawing on; the `inputmode="decimal"` comment that
  answers "why not `type=\"number\"`" and is **not** a validation claim; `editScore()` itself, whose
  bare `return` is the divergence; `caretCanLeave()`'s `selectionStart` read, which is why the cell
  must stay `type="text"`; and the `keydown` that already swallows `L`/`M`/`X` before `beforeinput`
  can see them.
- **`docs/data-model.md` around lines 306 and 313** — line 306 states the silent-wrong-number rule in
  the same words as `src/scores.js`'s header; line 313 is the *weights* precision sentence ("stored
  exactly as typed"). The new score-precision rule goes beside the score-cell shape and must not be
  confused with, or written as an edit to, the weights sentence — weights are explicitly out of scope.
- **`tools/README.md` § check-count history** — the count moves in step with the checks you add, and
  that section is where the *why* of a count change is recorded. WO-3.24's entry immediately above
  this work order in the phase file is a worked example of a check whose first draft was vacuous
  because it measured a thing against itself; read it before writing an assertion, since Acceptance
  line 5 is exactly the shape that can go green while proving nothing.
- **`src/assignments.js:637` and `src/categories.js:331`** — read them only to confirm you are
  leaving them alone. They are `type="number"` and named **Out of scope**; converting them to
  `type="text"` was considered and refused on 2026-08-17, and `formatWeight()` at
  `src/categories.js:194` is likewise recorded-and-excluded. Do not widen into them, and do not book
  a follow-up for them — the work order says none is booked.

**One scope note from the orchestrator, not a new requirement:** the work order names no
`CHANGELOG.md` entry and none is yours to write. If you find something that genuinely belongs outside
these Deliverables, put it in your result file as a *proposed* follow-up work order rather than doing
it.

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

## 5. Done means these 10 lines, reported against one by one

1. `1e3`, `0x1f`, `0b101`, `0o17` and `+7` cannot be produced in a score cell — by typing **or by pasting** — and the store is read to prove it, not the field.
2. A third digit after the decimal point is refused; `87.25` is accepted and stored as `87.25`.
3. `-5` is accepted and stored as `-5`, and a score above the assignment's points is still accepted unchanged. **A run that closes the line above by breaking either of these has failed.**
4. Typing `-`, `.` or `12.` leaves the field showing exactly that, writes nothing, and does not rewrite or reformat the field under the caret.
5. **The field and the store cannot disagree.** Drive every refused input above and read the cell's value against the stored cell after each one. This is the `8a` case and it is the reason the work order exists; a check that only asserts the store is half a check.
6. Existing out-of-grammar data survives: a document holding `12.3456789` renders it, and the value is unchanged after the grid is opened and left without editing that cell.
7. `docs/data-model.md` states the two-decimal rule for scores and says why.
8. `src/scores.js`'s `editScore()` header distinguishes refusing a **notation** from clamping a **value**, at the point the old sentence stops being true.
9. `node tools/verify-shell.mjs` passes whole, with the new checks driven through real events and the count in `tools/README.md` moved in step.
10. 👤 On the installed iPad, force-quit first: a score is entered, corrected and cleared on the decimal keypad with no character refused that the keypad offers. **The keypad has no letter on it, so this reading is that the guard did not cost anything — not that it caught anything.**

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

