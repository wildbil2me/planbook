# WO-2.34 — nothing compares the marking key list with the keys the screen answers to · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.34-result.md` — as your last act, and return it in-band too.

**Routing decision.** This work order routes to **Codex** on the rubric — the spec is complete inside
the work order, there is a byte-level precedent 90 lines up the same file in WO-3.22's block, the
Acceptance is proved by mutation rather than by eye, and **Out of scope** forbids touching `src/` at
all. It was **re-routed to Claude Sonnet** on a capacity fact rather than a judgment one: the
Acceptance needs one clean harness run plus three mutation runs, each quoting full-run counts, and
`node tools/verify-shell.mjs` was measured at **264s** on this tree immediately before this brief was
written — four runs is ~17.6 minutes against `codex-invoke.mjs`'s hard 20-minute cap, with nothing
left for reading or writing, and a timeout landing mid-mutation would leave `index.html` or `src/`
modified, which is precisely what Acceptance line 5 forbids. The Codex probe **passed** (`SMOKE OK`,
exit 0), so this is not the runner being down; it is one work order that does not fit the cap. The
runner-up consideration set aside: the "one shared check or two" deliverable is a genuine judgment
call and WO-3.22 itself routed Claude on merits — but that work order also reworded a teacher-facing
legend, which this one is explicitly forbidden from doing, so it did not carry the route on its own.

**The baseline, already measured for you — do not spend a run rediscovering it.** On the tree as you
receive it, `node tools/verify-shell.mjs` reads:

```
799 checks · 799 passed · 0 failed · 0 skipped
21,410 lines · 26.8 lines per check · 264s
```

That is your "before" count for Acceptance line 2. Budget roughly 4.5 minutes per run and do not run
the harness more often than the Acceptance actually requires.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.34 — nothing compares the marking key list with the keys the screen answers to

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** WO-3.22 · **Blocks** nothing, and
that is deliberate — the two agree today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. The same call
WO-3.12, WO-3.21 and WO-3.24 made.)*

**Not a go-live blocker, and nothing here is a defect.** Booked 2026-08-16 out of WO-3.22's
implementation. Both sides were read that day and **found in agreement**. **Do not go hunting for a
missing key; there isn't one.** What is missing is the check that would notice if one appeared.

**Why it exists.** WO-3.22 was booked because the score grid's ⌨ Keys panel documented three arrow
directions out of four, and the reason nobody caught it was that **nothing compared the card with the
keys the code answers to**. The same gap is open one screen over. `#attendanceKeysModal` in
`index.html` documents `↓ ↑`, `P`, `T`, `A`, `E`, `D`, `Esc` and `?`; `src/shell.js` holds
`MARK_KEYS = ['P','T','A','E','D']` and the `ArrowDown`/`ArrowUp`, `Escape` and `?` branches of the
same `keydown` listener. Nothing in the tree holds the two against each other, so the next key added
to that listener can go undocumented exactly as `↑ ↓` did — and this is the marking screen, which is
the one a teacher is on while students walk in.

**It is the same claim and not the same check.** That legend is a `<dl>` of `.attendance-key` chips
in `.attendance-key-row` divs, not `.scores-key` spans, so it needs its own map. Two asymmetries are
already visible and both must be decided rather than discovered: `Esc` and `?` are documented and are
handled in the listener rather than in `MARK_KEYS`, so the bound set is not one array; and the
listener's own guards — a modifier held, a modal open, focus inside an input, a view that is not
`class` — are conditions rather than keys and belong nowhere in the comparison.

**Deliverables**
- **A check comparing the legend with the keys that listener answers to**, in both directions, with
  every exception taken **by name** the way WO-3.22's `⇥` is. An exception taken by dropping a
  direction is a check that cannot see a legend row left behind by a deleted binding — which is the
  defect WO-3.22 shipped and had to correct.
- **The bound side read from `src/shell.js`, not from a table inside the harness.** That is WO-3.22's
  scar in one sentence: `stray` asked the harness's own name-to-glyph map whether a row was bound, so
  the answer was yes forever and the direction could never go red.
- **Floors against vacuity** — a renamed modal id, a renamed constant or a regex that quietly stops
  matching must go red rather than green, as WO-3.22's three floors do.
- **A written judgment on whether one shared check or two separate ones is right**, now that two
  legends want the same comparison. Do it or write down why not.

**Out of scope** — rewording the legend, adding or removing a binding, and the spill measurement over
either panel (WO-3.24). If the new check goes red against current code, **that is a defect found and
it gets its own work order** — do not fix the app from inside this one.

**Acceptance**
- [ ] A check compares `#attendanceKeysModal` with the keys the `keydown` listener in `src/shell.js`
      answers to, and passes on the delivered tree.
- [ ] Removing a letter from `MARK_KEYS` while its row stays on the list turns it red, naming the
      row — run, not reasoned, with the counts before and during quoted.
- [ ] Deleting a documented row while its key stays bound turns it red, naming the key — run, not
      reasoned. **Both directions are proved by mutation or this work order has not landed**, which is
      the single lesson of WO-3.22's correction round.
- [ ] Renaming the modal id or the `MARK_KEYS` constant turns it red rather than passing vacuously.
- [ ] `node tools/verify-shell.mjs` passes whole, with the check count in `tools/README.md` moved in
      step, and `git diff --stat -- src/` is empty across the whole work order.

**Traps** — **`Esc` and `?` are not in `MARK_KEYS` and are correctly documented**, so a check that
reads only that array reports two stray rows on a correct build. **The arrows are two keys and one
row**, the way `Backspace` and `Delete` share `⌫` on the score grid — the map is what carries that,
and a key missing from the map must fail rather than skip. **Do not fold a second claim into one
`check()` call site**: the row order, the prose and the spill are three other questions, and folding
is the WO-3.15 mistake WO-3.22 declined to repeat.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The precedent, and it is the thing to read before anything else:**

- **`tools/verify-shell.mjs:216-301`** — WO-3.22's block, the check this one is the sibling of. Read
  the whole thing including its comment, which is most of its length. `:281-287` is the corrected
  `stray` line and the paragraph explaining why it asks `bound` rather than `Object.keys(GLYPH_OF)`.
  That paragraph is the single most important thing in this dispatch: it is the defect WO-3.22
  shipped, and your Deliverable #2 is the instruction not to ship it again.
- **`tools/README.md:817`** — *"`verify-shell.mjs` holds 802 `check()` call sites"*. **`wo-sweep.mjs`
  greps for that sentence and asserts the number**, so adding a call site without moving it turns the
  sweep red, and rewording the sentence turns it red too. The paragraph under it records how each
  prior work order moved the count and is the format to follow. Note that 802 call sites and the 799
  executed checks above are different quantities on purpose — do not "reconcile" them.

**Four structural facts about this legend that the score-grid check does not have to deal with.**
They are stated here because each one silently produces a green check that is measuring nothing.

1. **`.attendance-key-row` is a `<div>` and the modal nests several levels deep**
   (`index.html:2406-2453`). WO-3.22 sliced its panel with `html.indexOf(...)` to the **first**
   `</div>`; done here that truncates at the end of the *first* row. The slice needs its own end.
2. **The glyphs live in `<dt>`, and `↓` also appears outside one.** `index.html:2421` has
   `<kbd class="attendance-key">↓</kbd>` inside a `<dd>` prose sentence, and `:2414` has a bare
   `<strong>↓</strong>` in the lead paragraph. A regex over every `.attendance-key` in the modal
   collects a duplicate `↓` from the `<dd>`, and the row count and the glyph count stop meaning what
   their names say.
3. **The modal id exists twice** — as the attribute at `index.html:2406` and as
   `const KEYS_MODAL = 'attendanceKeysModal'` at **`src/shell.js:1618`**. Acceptance line 4 says a
   renamed modal id must go red; decide deliberately which side your floor reads, and say so.
4. **The listener delegates the score grid's keys from inside itself.** `src/shell.js:1669-1673`
   routes any `keydown` on a `[data-score-cell]` into `scores.handleScoreKey()` and returns, *above*
   the `currentView() !== 'class'` guard. So "the keys this listener answers to" read literally
   sweeps in the score grid's entire binding set, which is WO-3.22's check's subject and not this
   one's. The keys in scope here are the ones handled **below** the guards at `:1675-1679`:
   `ArrowDown`/`ArrowUp` (`:1681`), `Escape` (`:1685`), `?` (`:1693`) and `MARK_KEYS` (`:1617`,
   tested at `:1699`).

**On the fourth Deliverable — one shared check or two.** This is the one place the work order asks
for a judgment rather than a mechanism, and either answer is acceptable. What is *not* acceptable is
answering it silently: write the reasoning into the harness comment where the next reader will hit
it. If you factor anything shared out of WO-3.22's block, its check must still pass unchanged and its
mutation behaviour must still hold — that block's correction round is the reason it reads as it does,
and a refactor that loosens it costs more than the duplication saves.

**A note on scope you should not have to be told twice.** `git diff --stat -- src/` must be empty at
the end. Every mutation you make to prove a direction is reverted before the next one, and you should
confirm the revert with `git diff` rather than trusting that you undid it — a mutation left in
`index.html` is a broken app, not a failed check. If your new check goes red against the *unmutated*
tree, you have found a defect: report it, name it, and **do not fix it** — the work order says it
gets its own work order.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

*(This list is inlined into every brief verbatim, on both routes. You are on the Claude route, so
`CLAUDE.md` and [`../../AGENTS.md`](../../AGENTS.md) are both yours to read — the list below is the
subset that has cost someone a day, not a substitute for either.)*

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

1. A check compares `#attendanceKeysModal` with the keys the `keydown` listener in `src/shell.js` answers to, and passes on the delivered tree.
2. Removing a letter from `MARK_KEYS` while its row stays on the list turns it red, naming the row — run, not reasoned, with the counts before and during quoted.
3. Deleting a documented row while its key stays bound turns it red, naming the key — run, not reasoned. **Both directions are proved by mutation or this work order has not landed**, which is the single lesson of WO-3.22's correction round.
4. Renaming the modal id or the `MARK_KEYS` constant turns it red rather than passing vacuously.
5. `node tools/verify-shell.mjs` passes whole, with the check count in `tools/README.md` moved in step, and `git diff --stat -- src/` is empty across the whole work order.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

