# WO-3.21 — result

**Status written:** ✅ DONE — 2026-08-13 (via `node tools/wo-gate.mjs --tick WO-3.21`, after
hand-ticking the 5 Acceptance boxes below in `plans/work-orders/phase-3-gradebook.md`).

## What was done

1. **Fixture change** (`tools/verify-shell.mjs:17574`, inside the WO-3.8 plant): `wo38-s1` Ashdown
   now carries two `extended-time` rows — the original scoped `['tests']`, plus a second scoped
   `['unit tests']`. Both are real rows (`isRealRow()` fires on both) and both match the `Tests`
   category (`wo38-s3` Corvane already proves `['unit tests']` fires against it, so the Trap the
   work order names — a scope that doesn't match, proving nothing — is answered). `wo38-s1` still
   counts as **one** student; `plant38.people` stays `7`, untouched.
2. **Mutation, run, reverted**: deleted `const seen = new Set();` and its two call sites
   (`if (seen.has(kind)) return; seen.add(kind);`) at `src/accommodation-prompt.js:186,190-191`, ran
   the harness, recorded the result, then `git checkout -- src/accommodation-prompt.js` and confirmed
   the restored file hashes identical to `HEAD`.
3. **No new assertion added.** The mutation reddened 5 of WO-3.8's own existing checks on its own —
   see line 3 below — so per the work order's own instruction ("add one only if it does not"),
   nothing was added. `src/` and the assertion set are otherwise untouched.
4. **`tools/README.md`** gained one new paragraph block (inserted after the WO-3.9 paragraph, before
   the "Driving a browser over CDP" section) in the WO-3.12 / WO-2.24 shape: before/during counts,
   the failure table, and the revert confirmation. No `check(` call site was added, so
   `tools/README.md:783`'s "713 call sites" sentence and the 710-executed-result count beside it are
   both untouched, and `wo-sweep.mjs`'s call-site-count check stays green against the same numbers.
5. Ticked the 5 Acceptance boxes in `plans/work-orders/phase-3-gradebook.md` (all verified by my own
   run — none are 👤 lines) and ran `node tools/wo-gate.mjs --tick WO-3.21`, which flipped the status
   to `✅ DONE — 2026-08-13` and moved `plans/work-orders/README.md`'s Phase 3 row from 14/21 to
   15/21 (93 → unchanged, overall 54→55, 58%→59%). It reported no roadmap box to tick, matching the
   work order's own `**Closes roadmap**` line (harness-only, no product box).

## Acceptance, one by one

**1. A fixture student carries two rows of the same kind, both matching the category under test, and
the prompt still reads "3 students have extended time, 2 need a separate setting."**
Met. Ran `node tools/verify-shell.mjs` with the fixture change in place and the dedupe intact
(unmutated `src/`): `710 checks · 710 passed · 0 failed · 0 skipped`, 18,135 lines, 25.5 lines per
check, 227s, exit 0. The specific check's PASS line: *`creating a test surfaces the counts, in
docs/data-model.md's own words — "3 students have extended time, 2 need a separate setting." ::
category = "Tests — 60%", prompt says "3 students have extended time, 2 need a separate setting.",
host hidden = false`*.

**2. The reveal still lists five names, with that student named once.**
Met. Same run, same PASS line for the reveal check: *`one deliberate tap puts the five names on
screen, grouped under the kind they belong to, and the button offers to put them back :: 5 chip(s):
["Ashdown, Wo38","Braemore, Wo38","Corvane, Wo38","Dunmarrow, Wo38","Everleigh, Wo38"]`* — Ashdown
appears exactly once despite carrying two rows.

**3. Deleting the `seen` Set turns a check red, with counts before and during quoted — run, not
reasoned.**
Met, and this is run evidence, not reasoning. **Before** (fixture in place, `seen` Set intact):
`710 checks · 710 passed · 0 failed · 0 skipped`. **During** (fixture in place, `seen` Set and its
two guard lines deleted): `710 checks · 705 passed · 5 failed · 0 skipped`, exit 1. All 5 failures
are WO-3.8's own pre-existing checks — none were added by this work order:
- *"creating a test surfaces the counts …"* — reads `"4 students have extended time, 2 need a
  separate setting."` instead of `3`.
- *"one deliberate tap puts the five names on screen …"* — 6 chips, `Ashdown` listed twice:
  `["Ashdown, Wo38","Ashdown, Wo38","Braemore, Wo38","Corvane, Wo38","Dunmarrow, Wo38","Everleigh,
  Wo38"]`.
- *"and back to Tests recomputes the same sentence …"* — same wrong `"4 students …"` string on the
  round trip back from Homework.
- *"in presentation mode nothing appears at all …"* — reads `names showing before the flip = 6`
  (the absence-after-flip half stayed correct, but the pre-flip count carried the inflation).
- *"flipping presentation mode back off brings the same counts back …"* — same wrong `"4 students
  …"` string a third time.

Reverted with `git checkout -- src/accommodation-prompt.js`; `git hash-object
src/accommodation-prompt.js` equals `git rev-parse HEAD:src/accommodation-prompt.js`
(`30a6ef4b9cd4…`). This is the case the work order's Traps line calls out by name: 5 red out of 710,
not 0 (fixture proving nothing) and not everything (fixture coupled to something unrelated) —
attendance, categories, backup and every other section stayed green in that same run.

**4. `node tools/verify-shell.mjs` passes whole, with the check count in `tools/README.md` moved in
step with any check added.**
Met, with the honest caveat that no check was added, so no count moved. Final run on the landed
state (fixture change present, mutation reverted): `710 checks · 710 passed · 0 failed · 0 skipped`,
18,135 lines, 25.5 lines per check, 226s, exit 0. `tools/README.md` gained the new mutation-table
paragraph but the call-site figure it cites (713, at `:783`) is unchanged, because this work order's
only harness edit was to a fixture's data, not to a `check(` call — `node tools/wo-sweep.mjs` confirms
it still matches: `17 checks · 15 passed · 0 failed · 2 to review` (both REVIEW lines pre-exist this
work order and are unrelated — the sensitive-field-name sweep and the due-date/late-missing sweep).

**5. `git diff --stat src/` is empty across the whole work order, confirmed after the mutation's
revert and again at the end.**
Met, confirmed twice by running it, not by inference. Immediately after `git checkout --
src/accommodation-prompt.js`: empty output. Ran again just before writing this report, after every
other edit (fixture change, `tools/README.md`, the tracker ticks): empty output both times.

## Files changed

- `tools/verify-shell.mjs` — `wo38-s1` Ashdown's fixture row list gains a second `extended-time` row
  scoped `['unit tests']`, plus a comment explaining why (line ~17570).
- `tools/README.md` — new paragraph block recording the mutation, in the WO-3.12/WO-2.24 shape
  (inserted after the WO-3.9 paragraph, before "Driving a browser over CDP").
- `plans/work-orders/phase-3-gradebook.md` — WO-3.21's 5 Acceptance boxes ticked; status line moved
  to `✅ DONE — 2026-08-13` by `wo-gate.mjs --tick`.
- `plans/work-orders/README.md` — Phase 3 dashboard row and overall total moved by `wo-gate.mjs
  --tick` (14→15 of 21 for Phase 3; 54→55 of 93 overall, 58%→59%).
- `src/accommodation-prompt.js` — touched only as the deliberate, temporary mutation, and reverted;
  `git diff --stat src/` is empty at every checkpoint above.

## What I could not verify

Nothing here needed a real iPad or human eyes — this work order is explicitly harness-only, no UI
changed, and I did not tick anything I hadn't run myself.

## Notes on judgment calls

- **Where to place the new `tools/README.md` paragraph.** The file's mutation-table paragraphs are
  not in strict work-order-number order (WO-3.6 and WO-3.8 only appear inside the earlier
  "call-site movement" narrative at `:783-830`, not as standalone paragraphs; WO-3.9's standalone
  paragraph is the most recent one in the file). I appended the new paragraph directly after WO-3.9's,
  which is the last standalone paragraph before the "Driving a browser over CDP" section, rather than
  trying to re-derive the file's non-chronological ordering. Noted here since the work order didn't
  specify a location.
- **Did not add a `TESTING.md` § WO-3.21 entry.** WO-3.12 and WO-2.24's `tools/README.md` paragraphs
  each end with "tabulated in `TESTING.md` § WO-x.y", but this work order's brief and Deliverables
  only ask for the mutation to be recorded in `tools/README.md` — Acceptance and Deliverables never
  mention `TESTING.md`, and the work order's own `**Closes roadmap**` line says explicitly this is
  harness-only with no product box, the same reasoning WO-3.12 used to skip a 👤 line rather than to
  skip `TESTING.md` (WO-3.12 does have a `TESTING.md` section). I judged that adding one here would
  be inventing a deliverable the brief didn't ask for, so I left `TESTING.md` untouched and did not
  reference it from the new `tools/README.md` paragraph. Flagging this as a decision the work order
  didn't fully settle, in case the intent was closer to WO-3.12's full shape.
- **Ticked all 5 Acceptance boxes and ran `wo-gate.mjs --tick`.** Every line is backed by a run I
  executed and quoted above; none is a 👤 line. I did not touch `TESTING.md`'s 👤 lines or
  `CHANGELOG.md`, per the standing rule.
