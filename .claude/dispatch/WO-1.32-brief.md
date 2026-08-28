# WO-1.32 — the sweep proves the name and not the shape · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.32-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier. The deciding signal is `ROUTING.md` § "Route to
Claude" bullet one — the merge-field resolver is a named sensitive surface, and this work order is
the structural guard on the exact disclosure hole WO-5.1 actually shipped, so a claim that passes
vacuously is worse than no claim at all. Runner-up set aside: Codex, because a static grep over a
string § 20 already computes, with mutation-provable acceptance and no `verify-shell` in its budget,
is textbook Codex shape — but sensitive surfaces are never delegated, and two of the four Traps are
judgment calls (the fault-message wording, and the invitation to widen the check) rather than
mechanics.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.32 — the sweep proves the name and not the shape

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-28 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.31
made. Booked 2026-08-28, owner-directed, out of WO-5.1's recovery.)*

**Why it exists.** [`src/merge-fields.js`](../../src/merge-fields.js) tells its reader, at its own
line 30, that **there is no `doc[a][b]` anywhere in this file** — and credits `tools/wo-sweep.mjs`
§ 20 with asserting it structurally. **§ 20 does not assert it.** Its claim 2 is narrower than the
sentence that cites it: *no support identifier appears in the resolver's code*, which is a check on
**names**. A path expression that splits a key off the token at runtime names nothing, so it passes.

**This is not hypothetical; it shipped.** WO-5.1's dispatch was killed by a quota holding an
unreverted mutation proof — precisely a runtime path walk in `resolveText()` — and the delivered tree
resolved `{{student.supports.medical}}` and every other support field to the roster string. **§ 20
was green over it.** So were `--self-check`, `--audit` and the whole 34-check sweep. The behavioural
half caught it (`tools/verify/merge-fields.mjs`'s seventeen-path refusal check would have gone red on
a run nobody got to make), and what actually found it was a human reading the file.

**So the division of labour § 20 claims for itself is real and is half-built.** The harness proves
what today's paths resolved on today's fixture; the grep is supposed to prove *there is nothing in
the file that could resolve one on any input*. Against a "just this once" lookup somebody adds later
— which is the exact thing the section's own comment says it exists to catch — **a name check is the
wrong instrument.** The forbidden thing is a shape.

**The shape to build.** A fifth claim in § 20: the resolver contains **no dynamic property read**.
Over the same stripped code § 20 already computes, fail on

- bracket indexing where the subscript is not a literal — `o[k]`, `root[name]`, `d[parts[i]]` — while
  allowing `[0]`, `[1]` and the array literals the file legitimately holds;
- `.split('.')` or any split on a token, and `reduce(` used to walk one;
- `eval(`, `new Function(`, and `Reflect.get(`.

**Traps**

- **Allow the literal subscripts or the check is unlandable.** `FIELDS.filter(…)[0]` is the file's
  one lookup and appears several times; `REFUSED_WORDS` and `FIELDS` are array literals.
- **Name the claim after the defect, not after the tool.** The fault message should say *a dynamic
  property read is what a whitelist is supposed to make impossible*, and quote the offending line —
  a reader who trips this needs to know it is the WO-5.1 hole, not a style rule.
- **The stripper is shared and is crude.** § 20's own comment says it does not model regex literals.
  This claim inherits that limit and should not pretend otherwise; keep the existing non-vacuity
  guard that reports an implausible strip rather than passing over an empty haystack.
- **Do not widen it to the whole of `src/`.** Every other module in this repo indexes objects by
  computed keys legitimately, and a repo-wide version of this check is noise that gets switched off.
  It is a claim about **one file** whose whole thesis is that it does not do this.
- **`tools/README.md` records the `check()` call-site count** and the sweep asserts the sentence.
  Recompute it with the sweep rather than by arithmetic.

**Acceptance**
- [ ] A resolver carrying `name.split('.').reduce((o, k) => o[k], root)` — WO-5.1's actual mutation,
      pasted back in — turns § 20 **red**, naming the line and the rule.
- [ ] The file as it stands today passes, with `FIELDS.filter(…)[0]` and both array literals intact.
- [ ] `eval(`, `new Function(` and a `Reflect.get(` on a token each fail the same claim.
- [ ] § 20's fault message names what the shape defeats, not just that it matched.
- [ ] `src/merge-fields.js`'s header sentence at line 30 is true of the sweep for the first time, and
      says which claim now carries it.
- [ ] `node tools/wo-sweep.mjs` is green on a clean tree and `tools/README.md`'s call-site count is
      recomputed by the sweep.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/merge-fields.js`
  - `tools/README.md`
  - `tools/verify/merge-fields.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The sibling to match, and where to write.** `tools/wo-sweep.mjs` § 17 over
`src/calendar-derived.js` is the convention for a structural absence claim; § 20 cites it by name.
Your work is a **fifth claim inside the existing § 20 block** — not a § 21, not a new file. The
`stripped` string, the `codeLines` array, the `faults` array and the non-vacuity guard are already
there; add to them.

**Three things to settle before you write the matcher.**

1. **Read what the file legitimately contains first**, then write the allow-list of subscripts —
   not the other way round. `FIELDS.filter(…)[0]` is the file's one lookup and recurs; `FIELDS` and
   `REFUSED_WORDS` are array literals. A matcher written from the work order's prose alone will
   either be unlandable on today's file or so loose it would have been green over WO-5.1's mutation,
   and only one of those two failures is visible on a clean tree. Prove the second directly: paste
   the mutation in, watch it go red, take it out.
2. **§ 20's header comment says FOUR CLAIMS and enumerates them.** It becomes five. The prose above
   it that sets up the division of labour is the reasoning this work order is repairing — extend it,
   do not compress it.
3. **`src/merge-fields.js` line ~30 currently credits § 20 with an assertion § 20 does not make.**
   Acceptance line 5 wants that sentence made true and pointed at the claim that now carries it.
   It is teacher-of-the-next-reader prose in a file whose header is doing real work; match its
   voice and its width.

**On the mutation you will paste in.** WO-5.1's dispatch was killed holding exactly this mutation
unreverted and the tree shipped resolving `{{student.supports.medical}}`. Stage your work before you
mutate, revert the mutation before you write anything else, and `grep -rn MUTATION src/ tools/`
before you write your result file. Your result file must state in one line that the mutation is out
and name the command that proves it.

**Out of scope, explicitly.** Any change to `src/merge-fields.js` other than the header sentence in
Acceptance line 5. Any change to `tools/verify/merge-fields.mjs` — that is WO-1.33, already booked.
Any version of this check that reads a second file under `src/`.

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

## 5. Done means these 6 lines, reported against one by one

1. A resolver carrying `name.split('.').reduce((o, k) => o[k], root)` — WO-5.1's actual mutation, pasted back in — turns § 20 **red**, naming the line and the rule.
2. The file as it stands today passes, with `FIELDS.filter(…)[0]` and both array literals intact.
3. `eval(`, `new Function(` and a `Reflect.get(` on a token each fail the same claim.
4. § 20's fault message names what the shape defeats, not just that it matched.
5. `src/merge-fields.js`'s header sentence at line 30 is true of the sweep for the first time, and says which claim now carries it.
6. `node tools/wo-sweep.mjs` is green on a clean tree and `tools/README.md`'s call-site count is recomputed by the sweep.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

