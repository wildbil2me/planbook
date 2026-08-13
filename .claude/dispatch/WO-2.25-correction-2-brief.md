# WO-2.25 — correction round 2 · owner-found regression · implementation brief

**Route** Claude (work-order-implementer), Opus — unchanged from the original dispatch, which routed
to Claude on the "establishes a convention" trigger. This round is that trigger cashing in: the
convention WO-2.25 exists to set turns out to have a landmine in it.

**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.25 (line ~2217). Row still reads
`🤖 CLAIMED` and stays that way — **do not tick, do not release, do not touch the status line.**

**Report to** `.claude/dispatch/WO-2.25-result.md` — append a "Correction round 2" section as your
last act. Do not rewrite what is already in that file.

---

## Why this round exists

The owner ran the 👤 printer checklist on her own machine and found a **regression WO-2.25
introduced**. This is not a re-run of a verifier finding; it is a defect the harness could not see and
did not have a single check for. That coverage gap is the more serious of the two findings.

**The regression.** Pressing **Ignore** on Chrome's *"blocked from automatically printing"* prompt
leaves the app in a state where **every subsequent click anywhere on screen re-launches the print
dialog.**

**The diagnosis, confirmed by reading the tree, not guessed** — all four facts verified before this
brief was written:

- The detail screen's **button** attribute and its **print-gate** attribute are the same string.
  Button `<button class="class-action-btn primary" type="button" data-detail-print>` at
  `index.html:1088`; gate `const PRINT_ATTR = 'data-detail-print';` at `src/detail.js:146`.
- The delegated hook at `src/shell.js:1091` is
  `if (e.target.closest('[data-detail-print]')) { detail.printDetail(); return; }`. **`closest()`
  walks up to `<body>`**, so once the gate attribute is on `<body>`, every click that does not match
  an earlier hook in that document-level listener matches this one and prints again.
- **It is new.** The 500ms timer used to take the attribute off almost immediately, so the collision
  window was half a second. WO-2.25 deliberately leaves the attribute on after a blocked print — and
  **Ignore is exactly that path.** The fix that made the gate self-correcting is what made the
  collision reachable.
- **The other two surfaces escape by luck of naming only.** Button `data-attendance-record-print` vs
  gate `data-attendance-print`; button `data-grades-record-print` vs gate `data-grades-print`. Only
  detail collides. **The convention as it stands is a landmine for the fourth print surface this work
  order exists to protect.**

---

## What this round owes — four things

### 1. The fix

**Rename the *button* attribute to `data-detail-sheet-print`.** Three sites:

- `index.html:1088` — the button itself.
- `src/shell.js:1091` — the delegated hook.
- `src/shell.js:141` — its doc block in the attribute census. **That block is stale on a second
  count**: it says the button "sets the attribute the `@media print` block in `src/detail.css` is
  gated on, **and takes it off again**." The taking-off-again was the timer, which WO-2.25 deleted.
  Correct both halves in the same edit.

This restores the invariant the other two surfaces already have by accident: **a gate attribute and a
click-hook attribute never share a string.** Scoping the selector to `button[data-detail-print]` is a
smaller diff and was considered and rejected — it leaves the collision live for whoever copies the
pattern next, which is the wrong trade for a work order whose whole deliverable was the boundary.

Use your own judgement if you see better, but **say why in your report** rather than substituting
silently.

### 2. A harness check in `tools/verify-shell.mjs`, watched failing

**With a gate attribute stuck on `<body>`, a click on a neutral element must not call `print()`.**

This class of bug had **zero coverage**. Write the check, then watch it fail: run it against the tree
with the fix reverted and **record the actual failure text** in your report. WO-2.24's rule governs
here and it is the rule this whole work order kept tripping over — *a guard nobody has watched fail
is a guard nobody has tested*. A green check written after the fix, never seen red, is not evidence.

Consider whether the check is worth making general across all three surfaces rather than detail-only.
The other two pass today by naming luck, and a check that would catch the fourth surface making this
mistake is worth more than one that re-asserts today's accident. Your call; say which you chose.

### 3. Correct the reasoning in `src/print-gate.js:46-49`

It currently says leaving the attribute on after a blocked print *"costs nothing, because the only
block that reads it is `@media print`."* **That sentence is false** — `src/shell.js`'s click
delegation reads it too — and **it is the sentence that made the stuck attribute look free.** It is
the load-bearing claim in the module's own reasoning block, and this bug is what it cost.

Whatever replaces it must **name the invariant from point 1**, so the next author inherits the
constraint rather than the bug. This is the module every future print surface copies; the comment is
how the constraint travels. Do not merely soften the sentence — state the rule.

Note what does **not** change: the self-correcting design is still right, and the attribute is still
allowed to stay on after a blocked print. What was wrong was the claim that it is free.

### 4. Sweep the tree for the same collision, and bump the cache

- Check whether the same gate-vs-hook collision reasoning touches anything else. `src/shell.js` has
  ~40 delegated `closest('[data-…]')` hooks; any other attribute that is both a click hook and
  something set on an ancestor is the same bug. Report what you found, including "nothing else."
- **Bump `sw.js`'s CACHE version if the shell changed** — it is at `v50` from the first round, which
  is uncommitted, so decide and say whether you bumped again or the existing bump covers it.

---

## Record the owner's checklist results, verbatim

In `TESTING.md` § WO-2.25 and in the work order's Acceptance line 5 evidence — **the 👤 box stays
`- [ ]`**, because the Ignore path has to be re-run by the owner after this fix lands.

- ✅ Attendance record printed twice in one sitting, Chrome's block allowed — the record came out,
  not the app.
- ✅ Student grade detail, same, twice in one sitting with the block allowed.
- ✅ Portrait → landscape inside a preview — the sheet survived the rotation.
- ✅ Ctrl+P with no print surface open prints the ordinary page — **verified on the laptop only.**
  iOS has no Ctrl+P equivalent; the shortcut does not raise a print dialog on the iPad at all.
  **Record this as a desktop-only verification with the limitation stated, not as an iPad pass.**

State explicitly, rather than assuming either way, whether that Ctrl+P limitation leaves the 👤 line
short — and if the guarantee is reachable on iOS by another route (Share → Print raises the same
`beforeprint`), say so, because that is the version of the check an iPad can actually run.

---

## Constraints — unchanged, and each has already cost someone a day

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
  **This bug's failure mode was the whole app on paper, and the roster carries accommodations.**
- Stay inside WO-2.25's **Out of scope** line: nothing about what the sheets contain, their layout,
  their page breaks or their CSVs; no fourth print surface; and **no attempt to suppress Chrome's
  throttle message**, which is browser policy and was settled on 2026-08-13.
- You may tick boxes your own run closed and update `plans/` and `TESTING.md`. **Never tick a 👤
  line.** Leave `CHANGELOG.md` to the teacher — but note the drafted entry in the result file now
  understates the change and should be re-drafted for her to accept, reword or bin.

## Verification

```
node tools/verify-shell.mjs      # must be green, and must include your new check
node tools/wo-sweep.mjs          # exit 0
```

Do not write a third harness. `tools/README.md`'s check count and `TESTING.md` are updated **from a
run rather than by arithmetic**, per WO-2.19 — and note that `tools/README.md`'s count sentence is
grepped by the sweep, so the number must match a real run.

Do not commit. Do not touch the WO-2.25 status line.

## Report against these

1. The rename landed at all three sites, and the doc block at `src/shell.js:141` is correct on both
   its stale halves.
2. The new harness check exists **and was watched failing**, with the failure text quoted.
3. `src/print-gate.js:46-49`'s false sentence is replaced with one that names the invariant.
4. The tree was swept for the same collision elsewhere; what you found, including nothing.
5. The owner's four checklist results are recorded verbatim, the Ctrl+P limitation is stated as
   desktop-only, and the 👤 box is still `- [ ]`.
6. Both harnesses green, counts off a run, `sw.js` cache decision stated.

Report honestly rather than favourably. A verifier reads this cold against the list and sees none of
your reasoning.
