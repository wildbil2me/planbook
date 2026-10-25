# WO-1.85 — the no-remover checks say they catch more than they do · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.85-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude Opus, on its own merits: the whole deliverable is prose — fence comments, detail strings, a `tools/README.md` paragraph, a `TESTING.md` section and a `CHANGELOG.md` entry — and the work is judging which *families* of WO-1.84's 52 shapes each fence's new words must name, which is a reading of a table rather than a formula (ROUTING § Claude: teacher-facing prose; Traps about judgment). Codex set aside: there is no spec outside the work order to match mechanically, and "every family that passes is named" is not a grep-checkable acceptance.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.85 — the no-remover checks say they catch more than they do

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-25 · **Size** S · **Depends on** WO-1.84 · **Blocks** WO-1.86, WO-1.87
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.84 made.)*

**Booked 2026-10-25**, owner-directed, the first of the three work orders `TESTING.md` § WO-1.84
recommends. **Prose only; no assertion moves.** WO-1.84 ran 52 removal shapes against the eight
fences F1–F8, and every one of them claims more than its code checks. The words that most need
to go are *"on any input"*, *"could not write"* and *"nothing … could do otherwise"*. This work
order makes each fence's words match the table, and it does that before anything is widened, because
**prose that runs ahead of its code is the defect this chain started from** (WO-1.82). It ends the
overclaim even if WO-1.86 and WO-1.87 are never built.

**Deliverables**
- **F1–F6**: strike the overclaiming phrases from each fence's header comment and detail line, and
  from the § 17 paragraph in `tools/README.md`. In their place, give each fence a *fence, not a
  reading* clause that names the families of shapes `TESTING.md` § WO-1.84's table shows passing it.
  Name families, not 52 cells.
- **F7**: name the four reflective writes (`Object.assign`, `Reflect.set`,
  `Reflect.deleteProperty`, `Object.defineProperty`) in § 30's *WHAT IT DOES NOT SEE* list.
- **F8**: name "a store function imported by name" as what the front-door check does not see.
- **F2's guarded file**: wherever prose says the contact-log check searches `src/log.js`, correct it
  to `src/contact-history.js`.
- **The count**: the § 17 paragraph in `tools/README.md` (about line 4067) says "eleven writer
  names", and the `WRITERS` list at `tools/wo-sweep.mjs:1470` has twelve. Correct the count to
  twelve, or drop the number from the paragraph.
- **`TESTING.md` § WO-1.85** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] For each of F1–F8, `TESTING.md` § WO-1.85 quotes the claim before and after the change, and
      every family of shapes that passes the fence in § WO-1.84's table is named in the new words.
- [ ] None of *"on any input"*, *"could not write"* or *"nothing … could do otherwise"* remains in
      the prose of F1–F6 or in the § 17 paragraph of `tools/README.md`. The grep that shows this is
      quoted in `TESTING.md` § WO-1.85.
- [ ] `git diff` shows changes to comments, detail strings and `tools/README.md` only. No regex, no
      token list and no `check(` condition moves.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass, and their check counts are
      unchanged from before the work order.
- [ ] `TESTING.md` § WO-1.85 carries these lines verbatim with the evidence for each.

**Traps** — **Do not widen as you go.** The temptation will be to add a pattern rather than write
down that a shape passes, but a pattern added here is WO-1.86's or WO-1.87's, landing without its
argument against the guarded file's own legitimate code. **A detail string is output**, so changing
one changes what `verify-shell.mjs` prints. The counts must not move; the wording may. **Nothing in
`src/` moves**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/contact-history.js`
  - `src/log.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`TESTING.md` § WO-1.84** (starts ~line 4670) — the fence table F1–F8 with exact file:line locations, the 52-shape × 9-column pass/refuse table, and the probe source. **This is your spec**: every family your new words name must come from a *passes* cell there. Read it whole before editing anything.
- The fence files themselves: `tools/verify/log-entries.mjs` (F1), `tools/verify/contact-log.mjs` (F2 — the search runs in a `page.evaluate` string and reads **`src/contact-history.js`**), `tools/verify/term-record.mjs` (F3), `tools/wo-sweep.mjs` § 17 / § 20 claim 4 / § 24 / § 30 (F4–F7), `tools/verify/front-door.mjs` (F8). Line numbers in § WO-1.84 may have drifted a few lines; re-find by banner.
- `src/term-record.js`, `src/calendar-derived.js`, `src/merge-fields.js`, `src/outreach.js`, `src/front-door.js` — read only, to confirm a family name is accurate. **Nothing in `src/` moves.**

**Orchestrator's notes — the traps this one will not guess.**
1. **Take the baseline counts first.** Run `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` on the clean tree *before* any edit and record both summary lines; the fourth Acceptance line is "unchanged from before", and a count taken after the edits proves nothing. verify-shell is ~4–5 min a run; pipe to a log in the scratchpad and read its own summary/EXIT line (a `grep -c` with zero matches exits 1 and reads as a failure).
2. **Only comments, detail strings and `tools/README.md` change.** A detail string inside a template literal or a `page.evaluate` string is still a string — edit the words, never the `${…}` expressions, regexes, token arrays or `check(` conditions around them. Before handing back, read `git diff` hunk by hunk and confirm no code token moved; quote `git diff --stat` in `TESTING.md`.
3. **The count fix**: `WRITERS` at `tools/wo-sweep.mjs` ~:1470 — count it yourself. If you keep a number in the README paragraph, it must be the counted one; dropping the number is equally acceptable and cannot rot.
4. **§ 21's watched pairs**: if any phrase you strike is also an anchor claim in `wo-sweep.mjs` § 21 or the `tools/README.md` check-count table, the sweep will tell you — a red sweep after a prose edit means read § 21's claim list, not "add a pattern".
5. **The banned-phrase grep** for Acceptance line 2 must be run over the F1–F6 fence regions and the § 17 README paragraph and quoted with its output. Phrases elsewhere in the repo (history in `TESTING.md`, `CHANGELOG.md`, phase files) are not in scope and must not be rewritten.
6. **No mutations are owed** — this is prose only, so there is nothing to plant. If you plant anything anyway, `grep -rn MUTATION` before you write your result.
7. Tick the Acceptance boxes you can prove as you go (ROUTING § "Implementers may tick"); write `TESTING.md` § WO-1.85 under Phase 1 after § WO-1.84, Acceptance lines verbatim. Draft the `CHANGELOG.md` entry in the file in the style of the WO-1.84 entry.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

1. For each of F1–F8, `TESTING.md` § WO-1.85 quotes the claim before and after the change, and every family of shapes that passes the fence in § WO-1.84's table is named in the new words.
2. None of *"on any input"*, *"could not write"* or *"nothing … could do otherwise"* remains in the prose of F1–F6 or in the § 17 paragraph of `tools/README.md`. The grep that shows this is quoted in `TESTING.md` § WO-1.85.
3. `git diff` shows changes to comments, detail strings and `tools/README.md` only. No regex, no token list and no `check(` condition moves.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass, and their check counts are unchanged from before the work order.
5. `TESTING.md` § WO-1.85 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.85 — it is a deliverable, not a permission.** Add `### WO-1.85 — the no-remover checks say they catch more than they do` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.85` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

