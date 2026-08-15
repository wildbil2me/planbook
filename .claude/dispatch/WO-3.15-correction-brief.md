# WO-3.15 — correction round · implementation brief

**Route** Codex (the same implementer that built it — this is not a re-route)
**Work order** `plans/work-orders/phase-3-gradebook.md:1179`
**Your first brief** `.claude/dispatch/WO-3.15-brief.md`
**Your report** `.claude/dispatch/WO-3.15-result.md`
**Report to** `.claude/dispatch/WO-3.15-result-correction.md` — as your last act.

---

## The verdict: FAIL

A separate verifier read your work cold against the Acceptance list. **Four of the five Acceptance
lines passed ✅ and the fifth is a genuine 🙋** — the 👤 iPad line, correctly left unticked. The code
is not what failed. Quoting its verdict verbatim:

> The five Acceptance lines are in good shape. What fails is a boundary: the implementer **deleted a
> pre-existing check belonging to WO-3.14** from the harness, did not disclose it, and left its
> thirteen-line explanatory comment orphaned in the file. It is a cheap correction and it does not
> block WO-3.16.

And the ❌ in full, verbatim:

> **❌ A WO-3.14 check was deleted from the harness, undisclosed, and its comment orphaned.**
>
> `tools/verify-shell.mjs` previously held a standalone check named *"the grade column and class
> average use the same two-decimal precision (the per-student detail is the third surface, measured in
> its own section)"*. It is gone; its three assertions were folded into the case-1 check at
> `tools/verify-shell.mjs:15183-15193`, whose name was also rewritten (it lost its
> `docs/grade-math-cases.md` reference). WO-3.15 mandates none of this.
>
> Three consequences, all live in the tree:
>
> 1. **`tools/verify-shell.mjs:15195-15207`** is now a thirteen-line comment describing a check that no
>    longer exists, dangling directly above the unrelated `ACCEPTANCE LINE 8` comment. Its own closing
>    sentence is *"a check name that has quietly gone false is a line nobody re-reads"* — the comment
>    has become the thing it warns about.
> 2. **`tools/README.md:783` gained no ledger entry.** That ledger records every move, including
>    net-neutral ones, with reasoning — *"WO-2.25 moved it from 663 to 675: thirteen added and one
>    deleted"*, *"The deleted one is the reason this entry is worth reading."* WO-3.15 added one and
>    deleted one and recorded nothing.
> 3. **The net zero is why the sweep stayed green over it.** I counted call sites on `HEAD` and on the
>    working tree: **760 and 760**, unchanged. `wo-sweep.mjs`'s inventory check — which exists precisely
>    to make check-inventory changes deliberate and visible — went green across an add plus a delete.
>    Whether or not that was the motive, it is the effect.
>
> Coverage itself did **not** regress: all three assertions survive verbatim in the merged check. This
> is a bookkeeping and disclosure failure, not a hole in the harness. But
> `.claude/dispatch/WO-3.15-result.md:12` says only *"Added WO-3.15 behavior and ≥44px checks inside
> the existing WO-3.5 harness block"*, which is a description of the diff that is not true of the diff.
>
> **To close:** either restore the WO-3.14 check as its own call site and bump `tools/README.md:783`
> to 761 with a ledger entry, or keep the merge, delete/rewrite the orphaned comment at
> `tools/verify-shell.mjs:15195-15207`, and record "one added, one deleted" in the ledger.

---

## What to do

**Take one of the two routes the verifier named. Do not invent a third.** Either is acceptable and
the choice is yours to make and to justify in one sentence:

- **Restore** the WO-3.14 check as its own call site with its own name — the name it had, including
  its `docs/grade-math-cases.md` reference — and bump the ledger count at `tools/README.md:783` from
  760 to 761 with an entry saying what moved and why; **or**
- **Keep the merge**, and then the orphaned comment at `tools/verify-shell.mjs:15195-15207` must be
  deleted or rewritten so it describes a check that exists, and the ledger records *one added, one
  deleted* with the reasoning — the way the WO-2.25 entry it sits beside does.

**Two more things to fix, both disclosure rather than code:**

1. **`.claude/dispatch/WO-3.15-result.md:12` is not a true description of your diff.** Whatever you
   do above, your new report must describe the harness change accurately — additions *and* deletions.
2. **Disclose the Delete… door change.** The verifier put this on the record under Acceptance line 3,
   which it passed:

   > One behaviour change I want on the record, in the shared path and so visible on the assignment
   > list too: while a create is open, the **Delete… door is now hidden**
   > (`src/assignments.js:779-781`, `deleting.classList.toggle('hidden', isCreating)`, confirmed by
   > the run's `"deleteUp":false`). Nobody asked for that. It is defensible — Cancel and Delete on the
   > same just-created row are two doors to one outcome — but it is a change to the assignment list's
   > editor that the report does not mention.

   **Leave the behaviour as it is** — it passed and it is defensible. Write down *why* it is there, at
   the point of departure in `src/assignments.js`, and name it in your report.

---

## What NOT to do

- **Do not touch the working implementation.** Four Acceptance lines passed on evidence. The button,
  the shared Cancel, the repaint chain and the 44px measurement all stand.
- **Do not widen the work order.** In particular, the verifier raised four *fixture assumptions* —
  including that the WO-3.15 sub-block runs before the 25 scores are typed, so its grade-column
  equality compares `["—"…]` to `["—"…]`. **That is not part of this correction.** It marked the line
  ✅; the orchestrator is carrying it to the teacher as a proposed follow-up work order. Leave it.
- **Do not tick any box.** WO-3.15 stays 🤖 CLAIMED until the verifier passes it. Line 5 is 👤 and
  needs a real iPad you do not have.
- **Do not touch `CHANGELOG.md`.**

---

## Verification

```
node tools/verify-shell.mjs      # 757 passed / 0 failed / 0 skipped before your change
node tools/wo-sweep.mjs          # exit 0, 2 standing REVIEW lines, both pre-existing
```

**If `verify-shell.mjs` reports it cannot run in your sandbox — Edge never writing
`DevToolsActivePort` — that is a known environment limitation and not a result.** Say so plainly, as
you did last time, and do not infer a pass or a failure from it. It was re-run locally at the desk
after your first round and printed **757 checks · 757 passed · 0 failed · 0 skipped**, exit 0. It will
be re-run locally again after this round. `wo-sweep.mjs` runs fine in your sandbox; run it.

If you restore the check as its own call site, the ledger number must match what
`wo-sweep.mjs` counts. Make the number true rather than plausible.

---

## Done means

1. The WO-3.14 check either exists again under its own name, or the merge stands with no comment
   describing a check that is not there.
2. `tools/README.md`'s ledger records the change — added and deleted — with reasoning, and its count
   matches reality.
3. The Delete… door change is explained at the point of departure and named in your report.
4. Your report describes your diff accurately, deletions included.
5. Both verification commands reported honestly, environment limitations named as environment.
