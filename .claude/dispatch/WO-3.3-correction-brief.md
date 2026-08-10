# WO-3.3 — correction round 1

**Route** Claude / work-order-implementer (same route as the original round — this is a correction, not a re-route)
**Original brief** `.claude/dispatch/WO-3.3-brief.md` — still in force, read it again, nothing in it is withdrawn
**Your first-round result** `.claude/dispatch/WO-3.3-result.md`
**Report to** `.claude/dispatch/WO-3.3-result.md` — overwrite it, as your last act, and return it in-band too

A read-only verifier graded the work cold against the seven Acceptance lines and returned **FAIL**.
**Five of the seven lines passed outright and are not in dispute** — lines 3, 4, 5, 6, and 7's first
sentence — and it credited the reasoning on several of them specifically. Do not re-litigate those and
do not re-open decisions the original brief settled. Fix what is named below and nothing else.

The verifier's ❌ findings are quoted **verbatim**. Where it proposed a fix, the proposal is quoted too;
you may implement something better, but say why in your report if you do.

---

## First, what has already been done for you — do not redo it

Three things changed in the tree after your run, by the launching agent rather than by you:

- **The 👤 sitting happened.** The owner ran all six WO-3.3 human-test lines on the installed iPad on
  2026-08-09 and **all six pass**; they are ticked in `TESTING.md`. The same sitting closed WO-3.1's
  long-carried line — the category-removal warning's counted form, read against real assignments for
  the first time, since your work order is what made that branch reachable at all. **Leave all seven
  ticks alone.**
- **`CHANGELOG.md` is written**, at the top of `### Added` under `[Unreleased]`. Your draft was
  expanded into the house voice. If your fixes below change what a teacher sees, update that entry;
  otherwise leave it.
- **Two doc-rot fixes** the verifier caught: `TESTING.md`'s closing note no longer says WO-3.1's
  counted line is still owed, and `tools/README.md` now says six mutations rather than five.

---

## ❌ Finding 1 — the duplicate dialog shows a category it will not use

**This is the real defect: a teacher-visible wrong outcome on a deliverable of this work order.**
Quoted verbatim:

> `copySelect()` at `src/assignments.js:951-972`: when `copyCategoryId` is `''` and the target *has*
> categories, no `''` option is appended and no option is marked `selected` — so the control displays
> the target's **first** category while the proposal holds `''`, and `confirmCopy()` at `:1099` files
> the copy under nothing. Confirmed empirically, not by reading: harness line 299 reports the select
> reading `"category":"k_5v1h1t5w28"`, line 301 reports the copy landing at `""`. A teacher sees
> *"Homework — 25%"* preselected, taps *Copy into Period 2*, and gets a row under the red **Not in a
> category** banner. Worse, the note's own instruction — *"Pick one above"* (`:1036-1040`) — is
> unreachable for that first option, because tapping the already-displayed option fires no `change`
> and `setCopyCategory()` never runs. `categoryField()` twelve lines up (`:614-620`) handles this
> exact case correctly with a `— choose a category —` option; the two functions disagree, which is
> what makes this an oversight rather than a decision.

Note the two halves. The select must not display a value the proposal does not hold, **and** whatever
the teacher can see must be reachable by tapping — an option that is already displayed fires no
`change` event, so a design that depends on one is broken for exactly the case it was meant to cover.
`categoryField()` is your own worked answer twelve lines up; the fix is to stop the two disagreeing.

**Add a harness check that fails against the current code.** A check written after a fix, that would
have passed before it, is not evidence.

---

## ❌ Finding 2 — a ticked line the fixture cannot support, and the fixture assumption behind it

`TESTING.md`'s copy-carries-the-category line **has already been un-ticked for you** and carries the
verifier's reasoning inline. You do not need to un-tick it; you need to earn it back. Quoted verbatim:

> The **never-the-source's-id** half is proved. The **matched by name** half is not exercised by any
> run in this tree: harness 301 reads *"(no category of that name there)"*, so the check collapses to
> `copy.categoryId === ''`. A `matchCategory()` that returned `''` unconditionally would pass every
> one of the 34 checks, and that mutation is not in the six the implementer ran.

And the assumption underneath it, which is the more useful finding:

> **What would have to be true of the fixture for a bug in duplicate-to-another-class to be invisible?
> That the source's category has no same-named twin in the target — and that is precisely the
> fixture.** Earlier harness sections rename the source class's categories (`"Quizzes <b>and</b> exit
> tickets"`), so `matchCategory()` never finds a hit and only its `return ''` path is ever taken. The
> harness therefore exercises the *refusal* and never the *match*. This is the same shape as the
> finding the implementer did catch and write up (its planted foreign row originally shared the
> target's `termId`, so the term filter masked the missing `classId` guard) — and it is the one it
> missed about its own copy check. Fix: give the target class a category named the same as the
> source's and assert the copy wears the **target's** id for that name, distinct from the source's.

**Mutation-test this one specifically**: `matchCategory()` returning `''` unconditionally must go red.
If it does not, the new check is measuring nothing and you have reproduced the exact failure the
verifier named. Re-tick the line only on that evidence, and say in your report what the mutation did.

The verifier credited your other three fixture assumptions by name — the 0/0 coverage bar, the
two-class always-opens-on-Attendance proof, and the `termId` plant you caught by mutation. Those were
handled well and are not in question.

---

## ❌ Finding 3 — the line-2 debt points at a box that will discharge it without proving it

You flagged this fit as imperfect and invited correction. The verifier agrees with your reservation
and says the fix is the move you already made one line later. Quoted verbatim:

> The debt at `plans/work-orders/phase-3-gradebook.md:198` points at **WO-3.5's "Reweighting
> recomputes every displayed grade in that class immediately"** (`phase-3-gradebook.md:356-358`).
> `plans/work-orders/README.md:104` states the discharge rule flatly: *"The debt ends when the target
> ticks its box."* That box is about **weights crossing 100** and already carries WO-3.1's line-4
> debt. When WO-3.5's verifier ticks it by walking weights across 100, WO-3.3 line 2 gets ticked with
> **nobody having demonstrated that moving an assignment between categories updates a displayed
> grade** — which is the actual claim.
>
> It also had the right tool in hand and used it one line later: for line 7 it *added* an Acceptance
> box to WO-3.7 rather than force a bad fit. The same move here is a one-line fix — a purpose-built
> box on WO-3.5, e.g. *"Moving an assignment to another category updates every displayed grade in that
> class immediately. (Inherited from WO-3.3.)"* — and `--audit` resolves either.

Add the box to WO-3.5 and re-point the pointer. Follow `plans/work-orders/README.md` § "A re-homed
Acceptance line stays `- [ ]`" exactly, and quote the new box verbatim in the marker. **This is
urgent in a way the others are not**: WO-3.4 is next in the queue and WO-3.5 depends on this work
order, so the moment WO-3.5 ticks that box the tooling discharges the debt and nobody re-reads it.

Your WO-3.4 re-home for line 1 was called *"a precise fit — that box **is** the extra-credit
arithmetic in the owner's rewritten wording."* Leave it. Your new WO-3.7 box for line 7's second
sentence was called *"an exact quotation of what is owed and a legitimate use of the same move."*
Leave that too.

---

## Not a ❌, but fix it if it is one line — term switching leaves the list stale

The verifier declined to count this because it is pre-existing in kind and not an Acceptance line.
Quoted verbatim:

> `data-term-select` at `src/shell.js:615` calls `classes.selectTerm()` and nothing else;
> `selectTerm()` at `src/classes.js:477-490` repaints only the class bar. The term nav sits in the
> header on every class screen. The whole list body is term-filtered (`assignmentsOf(cls.id, termId)`,
> `src/assignments.js:444`), so tapping *Quarter 2* repaints the header chip and leaves the table —
> and the summary line still reading *"Assignments · Quarter 1"* — describing the other term. This is
> pre-existing in kind (the registry's term-totals line has the same gap) and is not an acceptance
> line, so I am not counting it as a fourth ❌; but the assignment list is the first surface where the
> entire body goes wrong, and the fix is one line in the same chain `afterCategoryChange()` already
> added at `src/shell.js:368`.

**Judgment call, and it is yours.** If it is genuinely the one line the verifier describes, in the
chain that already exists, do it and cover it with a check. If it turns out to want a refactor of the
term-change path, **stop and say so in your report** rather than widening a correction round into one
— name it as a proposed follow-up work order instead. Do not fix the registry's term-totals line;
that is somebody else's.

---

## Constraints — unchanged, and still non-negotiable

Section 3 of the original brief applies in full. The ones this round is most likely to trip:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode. 44px minimum in `@media (pointer: coarse)` for
  every new control.
- **Never tick a 👤 line** — the six that are ticked were ticked by the owner on real hardware, not by
  an agent, and they stay ticked.
- Anything you tick must be something you actually checked. A tick you cannot point at evidence for
  is worse than a blank box.
- If a `SHELL` file changes, the `sw.js` `CACHE` bumps with it — it is at `v36` now.
- Do not write a second harness. Add checks to `tools/verify-shell.mjs`.

## Verification — all three green before you report

```
node tools/verify-shell.mjs      # 507 checks at the start of this round; it must not go down
node tools/wo-sweep.mjs          # 15 checks · 13 pass · 2 standing REVIEWs, both already argued
node tools/wo-gate.mjs --audit   # every **Owes** pointer must still resolve after you re-point one
```

## Report against these, one by one

1. Finding 1 — the copy dialog's category, and the check that fails against the current code.
2. Finding 2 — the re-earned `TESTING.md` line, and what the `matchCategory()` mutation did.
3. Finding 3 — the new WO-3.5 box, the re-pointed marker, and `--audit` still green.
4. The term-switch line — fixed, or named as a follow-up with your reasoning.

A verifier reads this round cold too. Report honestly rather than favorably; the previous round's
report was accurate and that made this correction cheap, so keep doing that.
