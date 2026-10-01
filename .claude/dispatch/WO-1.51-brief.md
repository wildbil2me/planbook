# WO-1.51 — the word boundary that keeps `nothing` a sentinel is asserted nowhere · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.51-result.md` — as your last act, and return it in-band too.

**Routing: Claude Opus, on its own merits.** The deciding signal is the first Trap, which hands you a
structural call — a new plant or a widening of the sentinel plant, *say which and why at the line* —
and a row whose whole value is honouring WO-1.30's reasoning (keep `\b`; never narrow to whole-value).
Runner-up set aside: Codex — the work is mechanically checkable and needs no `verify-shell.mjs` run,
so the budget fits — but ties go to Claude, and WO-1.30 and its sibling tooling rows all went Opus.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.51 — the word boundary that keeps `nothing` a sentinel is asserted nowhere

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-01 · **Size** S · **Depends on** WO-1.30 ✅ · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.50 made.
Booked 2026-09-08 out of WO-1.30's verification, which raised it and correctly declined to widen that
row with it.)*

**Why it exists.** [WO-1.30](#wo-130--a-depends-on-that-names-no-work-order-clears-its-own-gate) made
`**Depends on**` refuse a value naming no work order **unless** it is one of six ways of saying *no
dependencies*. Five of the six are whole-value comparisons against `NO_DEPENDENCY_MARKS`. The sixth is
a **prefix** test — `/^nothing\b/i` — and it has to be, because five work orders write down *why* they
wait on nothing: `nothing — no domain, no name, no policy` (WO-3.10), `nothing but a decision`
(WO-8.7), and WO-2.19, WO-2.20 and WO-2.37 beside them.

**The `\b` is the whole of what stops that prefix being a hole, and nothing asserts it.** Measured
2026-09-08 against a copy under `--self-check --against`: with the boundary dropped to `/^nothing/i`,
the run is `PASS | 39 of 39 plants were caught`. Under that mutant `nothingburger` — and every other
word beginning with those seven letters — parses as *no dependencies*, so a `**Depends on**` naming a
real constraint clears its own gate with no problem and no note. **That is WO-1.30's own defect,
arriving through the arm that was built to make WO-1.30 safe.**

**What makes it worth a row rather than a comment is the direction.** WO-1.30's other two mutations
both go red — the sentinel arm dropped is 5 of 39, the prefix narrowed back to whole-value is 2 of 39,
both recorded in `tools/README.md`'s mutation table. Only the *widening* is silent, and widening is
the move a hand makes: a boundary is the part of a regex that looks like noise to somebody tidying
one, where an anchor looks load-bearing. **The fence has to be a plant, because the thing it guards
against is a future reader's reasonable-looking edit.**

**Traps**

- **A negative case cannot be appended to the existing loop.** The sentinel plant walks eight values
  and asserts three things about each — reads as `depends nothing`, draws no prose `NOTE`, is not
  refused. Every one of those is an assertion that the value **is** a sentinel. `nothingburger` wants
  the opposite of all three, so putting it in the array asserts the defect. It needs its own values
  and its own assertions, in the same plant or a new one — the implementer's call, and say which and
  why at the line.
- **Do not narrow the prefix to fix it.** `/^nothing$/i` is the rule WO-1.30 replaced, it refuses all
  five work orders that write down their reason, and it is already a red mutation. The boundary is the
  answer; the whole-value test is not.
- **Pick the negative values against the real risk, not against the joke.** `nothingburger` is
  memorable and is not what will actually be typed. **`nothings`**, **`nothing_but_a_hunch`** and
  **`nothingness`** are the shapes a hand produces, and a `-` or `_` where the live instances have a
  space is the likeliest of them. At least one value whose eighth character is a word character and at
  least one that is punctuation-joined.
- **This row adds a check and must change no verdict.** Every one of the 169 work orders reports
  exactly as it does today; the only run that moves is `--self-check`. If a live `**Depends on**` in
  this directory turns out to fail the new plant, that is a finding to report and not a value to widen
  the sentinel for.
- **Take the plant count from `--self-check` on the day.** It read 37 before WO-1.30 and 39 after.
  Whether this is a fortieth plant or a widening of the thirty-eighth is the first Trap's question, so
  the count is not predicted here.

**Acceptance**
- [ ] `--self-check` catches the boundary being dropped: with `/^nothing\b/i` widened to
      `/^nothing/i` in a copy, `--self-check --against <copy>` fails and names the arm, where it
      passes 39 of 39 today. *(Nothing in the tree is mutated to prove this — WO-1.30's own plants
      were proved the same way, over copies in the scratchpad.)*
- [ ] At least two negative values, one word-joined and one punctuation-joined, each asserted to be
      **refused** rather than read as a sentinel — and the assertions say so, rather than being the
      positive loop's three checks with the sense flipped by hand.
- [ ] All eight of the sentinel plant's existing values still read as no dependencies, and the two
      standing mutations still bite at 5 of N and 2 of N.
- [ ] Every one of the 169 work orders' gate reports is byte-identical to the pre-change run — this
      row changes what the script *proves*, never what it *says*.
- [ ] `--audit`, `--self-check` and `node tools/wo-sweep.mjs` all green, and `tools/README.md`'s
      mutation table gains the row for the widening.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`tools/wo-gate.mjs`** — the file this row actually changes. Pointers, not a walkthrough:
  - ~line 685–710: the comment block and `NO_DEPENDENCY_MARKS` / the `/^nothing\b/i` arm. **Leave the
    regex exactly as it is** — this row adds a fence, it does not touch the rule.
  - ~line 3387: the sentinel plant's eight-value loop. Read its three assertions before deciding where
    the negative case goes (first Trap).
  - The WO-1.30 refusal plant beside it — the negative values want *refused*, which is what that plant
    already asserts for a zero-id clause; it is the likely model for the wording.
  - `--self-check --against <path>` (~line 2637, 4566) is how the mutation is proved — over a **copy
    in the scratchpad**, never by editing the tree.
- **`tools/README.md` ~lines 286–289** — the WO-1.30 mutation-table rows. The new row goes beside them,
  in the same shape (mutation · method · what went red, measured).

**Facts measured by the orchestrator on 2026-10-01, before dispatch:**

- `node tools/wo-gate.mjs --self-check` reads **`PASS | 43 of 43`** today, not the 39 the work order
  and its first Acceptance line quote — four plants have landed since it was written. The work order's
  last Trap already says *take the count on the day*; do that, and report the real before/after (43 →
  44, or 43 → 43 if you widen an existing plant). Treat "39" and "5 of N / 2 of N" in the Acceptance
  as N = whatever the run says. Re-measure both standing WO-1.30 mutations at the new N rather than
  assuming they still read 5 and 2 — if either moved, report it and update its README row.
- **The tree is dirty with five paths that are not yours**: `design/mockups/README.md`,
  `design/mockups/index.html`, `design/mockups/proposed-phase8.css`, `design/mockups/front-door.html`
  (untracked), and `plans/work-orders/phase-8-packaging.md`. Another session's work. **Do not touch,
  stage, revert or `git checkout` any of them** — and do not `git checkout` any file to undo a
  mutation either; mutations live only in scratchpad copies.
- **Acceptance line 4 (byte-identical gate reports)** wants a before-run captured *before* your first
  edit: loop `node tools/wo-gate.mjs <id>` over every work order id (`--list` gives them) into a
  scratchpad file, and diff the same loop after. Note the `git` and `dispatch` lines of a gate report
  move with the tree — strip or account for them, and say which in your report.
- **§ 4 below names `verify-shell.mjs`; this row does not need it.** It changes no file the browser
  loads and its Acceptance names `--audit`, `--self-check` and `wo-sweep.mjs`. Run those three. Do not
  spend 4+ minutes on the browser harness unless you touch something outside `tools/wo-gate.mjs` and
  `tools/README.md` — and you should not.
- `wo-sweep.mjs` § 22 holds the count in `tools/README.md`'s row against what the sweep emits, and
  other README lines quote figures too; if your change moves any recorded number, correct it in the
  same edit (this is how WO-3.26's sweep went red on finished work).
- You may tick Acceptance lines you actually proved. None of the five is 👤 or 📆. Leave `CHANGELOG.md`
  alone. Remove any scratch file you create inside the repository before you report.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

1. `--self-check` catches the boundary being dropped: with `/^nothing\b/i` widened to `/^nothing/i` in a copy, `--self-check --against <copy>` fails and names the arm, where it passes 39 of 39 today. *(Nothing in the tree is mutated to prove this — WO-1.30's own plants were proved the same way, over copies in the scratchpad.)*
2. At least two negative values, one word-joined and one punctuation-joined, each asserted to be **refused** rather than read as a sentinel — and the assertions say so, rather than being the positive loop's three checks with the sense flipped by hand.
3. All eight of the sentinel plant's existing values still read as no dependencies, and the two standing mutations still bite at 5 of N and 2 of N.
4. Every one of the 169 work orders' gate reports is byte-identical to the pre-change run — this row changes what the script *proves*, never what it *says*.
5. `--audit`, `--self-check` and `node tools/wo-sweep.mjs` all green, and `tools/README.md`'s mutation table gains the row for the widening.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

