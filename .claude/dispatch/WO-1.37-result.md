# WO-1.37 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-09-24. Nothing committed. Status row left at `🤖 CLAIMED` for the orchestrator. `CHANGELOG.md` not touched.

## Files changed
- `tools/verify/outreach.mjs`: one new block of three `check()` calls at the foot of the send-flow section, after WO-5.8's *nobody addressable* check and before the teardown.
- `tools/README.md`: call-site count 1464 → 1467; a new WO-1.37 count entry after WO-6.5's; a two-row mutation table added directly under WO-5.5's mutation-round paragraph, which is where the head and `FIELD_FIX_SENTENCE` were already named. No table existed at "~1192". WO-5.5's record there is prose, so the table sits beside it.
- `plans/work-orders/phase-1-shell-store-roster.md`: all five Acceptance boxes ticked. None of them carries 👤 or 📆.
- `src/`: **no change survives.** `git diff --stat src/` is empty.

## Route, and one thing the work order got wrong
**Route: a recipient with no address (`kind: 'recipient'`)**, on the existing Cal Wo53Orphan draft. I lifted it and did not re-derive it.

**The fixture was not field-free as it stood.** The brief suspected this. The baseline run's own detail line for the WO-5.8 check reads `reasons ["recipient","field"]`. The template Cal's draft opens on begins *Dear {{guardian.name}}*, and Cal has no guardian. That is the WO-1.37 defect in miniature. The block therefore types every `{{…}}` left in the subject and body out through the real `input` path, using the section's own `type()` helper. In practice that is one field, `guardian.name`, and the check's detail line names it. This edits only the draft and writes nothing to the document. The alternatives were planting a field-free counselor template, or blanking `teacher.email` for the cc route. Either one would have needed a plant and a matching teardown. This route needed neither, so the existing WO-5.3 teardown check covers it unchanged (it stays green).

## Checks added (3)
1. **Precondition.** The draft is open on Cal, not ready, and `kinds` contains `'recipient'` and has **no `'field'`**. The check text names the route. Detail: `reasons ["recipient"] on Cal Wo53Orphan after typing out ["guardian.name"]`.
2. **Head.** It is asserted whole and anchored with `/^This draft cannot be sent · (\d+) things? to fix$/`, N equals the reason count, the noun agrees with N, and there is exactly one head. `UNDEFINED_FIELD_HEAD` is absent from the head and from the whole strip's text. Detail: `"This draft cannot be sent · 1 thing to fix" over 1 reason(s)`.
3. **Instruction row.** `FIELD_FIX_SENTENCE` is absent from every `.mf-reason` row and from the strip's text, and the row count equals the reason count.

Both sentences are read from `src/block-strip.js` by an in-page `import()` of the same module URL the app loaded, rather than typed as literals. An absence asserted against a literal would stay green silently if the constant were reworded. Both are guarded non-empty, because `indexOf('')` is 0. **Convention note:** no earlier harness section used an in-page dynamic `import()`, so this block is the first.

WO-5.5's two existing head checks were not edited: `verify/outreach.mjs` "RESOLVER'S own words" and `verify/templates.mjs` "heads itself in the send flow's own words".

## Mutations (each marked `MUTATION`, each run once, restored by copying the pre-mutation file back)
| Mutation in `src/outreach-view.js` `paintBlock()` | Final line read | Red | Green that matters |
|---|---|---|---|
| A: head unconditional, `blockHead(UNDEFINED_FIELD_HEAD /* MUTATION */, …)`, the edit the WO names | `1478 checks · 1477 passed · 1 failed · 0 skipped`, EXIT=1 | the new head check (`"This draft has at least one undefined field · 1 thing to fix" over 1 reason(s)`) | both WO-5.5 head checks. The instruction check also stays green, correctly, because it sits under its own `if (fields)` |
| B: `const fields = true; /* MUTATION */`, one mutation paying for both claims | `1478 checks · 1476 passed · 2 failed · 0 skipped`, EXIT=1 | the new head check and the instruction-row check | both WO-5.5 head checks and the new precondition check |

After each restore, `git diff --stat src/` was empty. `grep -rn MUTATION src/ tools/` shows only prose: the 15 hits `git grep` finds at HEAD, plus two in my own README paragraph that describes the round. A `diff` of the two lists confirms nothing else is there.

## Counts
- verify-shell **before** (baseline, tree before my edit): `1475 checks · 1475 passed · 0 failed · 0 skipped`, EXIT=0.
- verify-shell **after** (final clean run, final tree): `1478 checks · 1478 passed · 0 failed · 0 skipped`, `46,662 lines · 31.6 lines per check · 540s`, EXIT=0. That is up 3, one for each check added.
- wo-sweep (final): `45 checks · 42 passed · 0 failed · 3 to review`, exit 0. The call-site line reads `1467 check() call site(s) across 72 harness file(s), matching tools/README.md:1213`. The 3 REVIEWs are pre-existing and unrelated (sensitive-field mentions, due-date lines, mockup banners).
- `wo-gate.mjs --audit`: PASS.

## Acceptance, line by line
1. [x] **Fixture blocked with no field reason, and the check text names the route.** Check 1, green on the final run, with detail `["recipient"]`.
2. [x] **Head whole and anchored, and `UNDEFINED_FIELD_HEAD` absent.** Check 2, green on the final run, red under both mutations.
3. [x] **`FIELD_FIX_SENTENCE` absent.** Check 3, green on the final run, red under mutation B.
4. [x] **Making the head unconditional turns the new checks red and leaves WO-5.5's two green, recorded in the README table.** A caveat the verifier should weigh: the literal head-only edit (A) reddens the **head** check only. The instruction check is about a different line and is reddened by B, which makes the whole boolean unconditional, the "one mutation pays for both" the Traps line describes. The precondition check cannot go red from any `paintBlock()` edit, because it reads the model. WO-5.5's two head checks are green under both A and B.
5. [x] **verify-shell green with the count up 3, and the sweep green with the README count recomputed by it.** 1475 → 1478, sweep green at 1467.

Nothing needs an iPad. There are no 👤 or 📆 lines.

## Decisions the work order did not settle
- **Route.** Recipient, made field-free by typing out the leftover token rather than planting a template. Reasons are above.
- **Where the mutation record goes.** The work order points at a "mutation table beside the WO-5.5 row at ~1192", but no table exists there. I added a small table directly under WO-5.5's mutation-round prose (~line 1370), and pointed to it from the count entry.
- **Two mutations, not one.** A is the edit the work order names literally. B is the Traps line's "one mutation can pay for both".

## Declined / notes
- Out of scope and left alone: `tools/verify/templates.mjs`, the preview, and `src/`. No `src/` finding needs handing back.
- A candidate for later, not acted on: WO-5.8's existing Cal check (`kinds.indexOf('recipient') >= 0`) passes with a `field` reason beside the recipient one. Its claim is only that the recipient reason survives, so this is not a defect, but its prose does not mention the second reason.
- I used `sed -i` once on `tools/README.md` to update a figure. The file is LF, and the diffstat shows only my intended lines.

## Draft CHANGELOG line (for the teacher to decide on)
Harness: the send flow's block strip now has a check for the head it shows when nothing on the list is a merge field ("This draft cannot be sent · N thing(s) to fix"). Before, an edit that told a teacher whose only problem is a missing address that her draft had "an undefined field" passed every check.
