# WO-1.65 — the glance reader's no-arithmetic rule is read by nobody · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.65-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override) — on its own merits: the claim's header has to *argue* its refused list and state its blind spots in prose the next reader trusts, and the Traps are judgment (do not fence `+`; a false red teaches disbelief; one file only). Runner-up was Codex — one file, a pattern to copy in § 20 claim 5, and `wo-sweep.mjs` is fast enough that the mutation round fits any cap — set aside on ties-to-Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.65 — the glance reader's no-arithmetic rule is read by nobody

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-09 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.64 made.)*

**Booked 2026-10-09**, owner-directed, out of WO-3.47's verdict, whose verifier closed that work
order's fourth Acceptance line by reading `src/glance.js` and running a throwaway script — the line
said a check "still finds no arithmetic", and no check had ever looked.

**Why it exists.** `CLAUDE.md`'s glance-reader rule (WO-6.7) says the file holds **no arithmetic of
its own**: no percentage, no threshold read, no rule re-run, no date compared to another date and no
`Math.*`. The cost of breaking it is a screen that disagrees with itself — the card's *3 to grade*
beside a queue of two. `tools/verify/glance-quiet.mjs` proves the agreement **behaviourally**, on the
fixtures it builds; nothing reads the file for the **shape**. The rule has been broken once already,
in WO-6.7's first draft, which re-read `leadDaysOf()` and re-clamped it one file away from
`leadWindowOf()`'s own clamp. Most home-screen work passes through this file, and WO-3.47 has just
added a second engine call to it.

**Deliverables**
- A claim in `tools/wo-sweep.mjs`, modelled on § 20's claim 5 for `src/merge-fields.js`: over
  `src/glance.js` with comments stripped, no `Math.`, no `%`, no `*`, no `/` as an operator, no binary
  `-`, no relational `<` / `>` / `<=` / `>=`, no `new Date` or `Date.`, and no call to an engine
  function that reads the document for a number — `thresholdsOf`, `leadDaysOf`, `isHeld` at least,
  and a read of a score cell's fields. The list is the implementer's to finish and to argue in the
  claim's own header.
- **The allowed shapes named, not merely tolerated**: `.length`, `+` building a string, and the
  queue's `open += 1`, which counts rows the engine handed back. A pass on 2026-10-09 found those and
  nothing else, so the claim should land green with a short exception list.
- `tools/README.md`'s recorded check count, and the claim's limits written where the next reader of
  the section will find them.

**Acceptance**
- [ ] `node tools/wo-sweep.mjs` is green on the tree with the new claim, and its check count matches
      `tools/README.md`.
- [ ] Each refused shape is proved by a mutation in `src/glance.js` that turns the claim red at the
      line — at minimum a `Math.` call, a `/` or `*`, a date comparison, and a `leadDaysOf()` read —
      and every mutation is reverted before anything else is written.
- [ ] The claim's header states what it cannot see: a sum written with `+`, and arithmetic moved into
      a helper whose name is not on the list.

**Traps** — **A fence, not a reading**: it catches the shapes it names, and meaning still belongs to
a person or to `glance-quiet.mjs`. **Do not fence `+`** — it is mostly string building here and a
grep cannot tell the two apart; a false red teaches the next reader to disbelieve the claim. **Nothing
in `src/` moves.** **Do not widen it to other files**: every other module computes legitimately, which
is the same reason § 20's claim 5 reads one file on purpose.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/glance.js`
  - `src/merge-fields.js`
  - `tools/README.md`
  - `tools/verify/glance-quiet.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-sweep.mjs` § 20, claim 5 (starts near line 2221) — the model: how it strips comments, how it reports `src/merge-fields.js:<line>` plus the offending text, and the "matched nothing" guard that stops a claim being made over an empty read. Your claim's fault must cite `src/glance.js:<line>` the same way — Acceptance 2 says *red at the line*.
- `tools/wo-sweep.mjs` § 22 — the count at the head of `tools/README.md`'s `wo-sweep.mjs` row (currently **49**) is checked against the number of results the run emits. Every new `check()` moves it; update the number and add a clause to that row in the house style (dated, WO-1.65, what it fences, what it cannot see).
- § 30 (WO-3.53 / WO-3.46) is the most recent sibling: named, stale-FAILing exceptions, and proved against plants. Copy its shape for the allowed list.

**Traps this brief adds — things the work order does not say:**
- **`src/glance.js` builds HTML in template literals.** `<`, `>`, `-` and `/` appear constantly inside strings (`</div>`, `gl-row`, `data-calendar-open`). Comment-stripping alone will land the claim red on the first line of markup. Blank string and template-literal *text* before the operator scan, but keep `${ … }` expression bodies — arithmetic hidden inside an interpolation is exactly what must still be seen. If your strip cannot do that reliably, say so in the header as a limit rather than loosening the patterns.
- **Allowed shapes go in a named list, and each FAILs if it stops being used** (the § 30 convention) — otherwise the exception list outlives the code and becomes a hole.
- **Mutation discipline.** Plant each mutation in `src/glance.js`, run `node tools/wo-sweep.mjs`, read the red line, then `git checkout -- src/glance.js` **before** writing anything else. Mark nothing in a mutation with the word you would grep for afterwards and leave it — and finish with `grep -rn MUTATION src/ tools/` and `git diff --stat src/` both empty. Two dispatches here died mid-mutation with every box ticked over a broken tree.
- **Verification, overriding § 4 below:** this work order moves nothing in `src/`, so `verify-shell.mjs` (~13 min) is **not required** provided `git diff --stat src/` is empty at the end — say so in your result. `wo-sweep.mjs` is the gate. Record the run's own summary line (`N checks · …`) in the result file.
- No `TESTING.md` section is demanded; if you add one, record the mutations there (§ WO-3.46 is the model). Leave `CHANGELOG.md` alone. Tick only Acceptance lines you ran.

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

## 5. Done means these 3 lines, reported against one by one

1. `node tools/wo-sweep.mjs` is green on the tree with the new claim, and its check count matches `tools/README.md`.
2. Each refused shape is proved by a mutation in `src/glance.js` that turns the claim red at the line — at minimum a `Math.` call, a `/` or `*`, a date comparison, and a `leadDaysOf()` read — and every mutation is reverted before anything else is written.
3. The claim's header states what it cannot see: a sum written with `+`, and arithmetic moved into a helper whose name is not on the list.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

