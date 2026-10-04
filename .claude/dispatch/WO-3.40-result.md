# WO-3.40 — result

**Implementer:** Claude Opus, 2026-10-04. Comment-only. Nothing committed. No mutation was made, so
there is nothing to revert. `grep -rn MUTATION src/assignments.js src/detail.js` prints nothing.

## Files changed

- `c:\dev\planbook\src\assignments.js`: two comment blocks (file header ~27, above `matchCategory()` ~1224)
- `c:\dev\planbook\src\detail.js`: the comment above the breakdown (~885)
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md`: three Acceptance boxes ticked. The status
  line's `🤖 CLAIMED` change was already in the tree from `--start`.
- `c:\dev\planbook\TESTING.md`: new § WO-3.40, after § WO-3.33 at the end of Phase 3
- `src/shell.js`: **not changed**. See the ruling below.
- `sw.js`: **not changed**. This is what Acceptance 3 asks for.

## Against the Acceptance list

1. **Neither comment in `src/assignments.js` says a misfiled assignment is invisible on the list.** [x]
   Both now say the copy would be *listed under "Not in a category", filed nowhere that class can name*.
   I checked this against `renderAssignments()` (~645): `loose = list.filter((a) => filed.indexOf(a.categoryId) === -1)`
   gathers every assignment whose id this class lacks under the *Not in a category* head. The rest of
   both arguments is unchanged: counted by nothing in a weighted class, counted in a points class, and
   moved by a removal in the source class under a dialog naming the wrong class. The copy rule
   (match by NAME, never by id) is unchanged. `grep -n "invisible on" src/assignments.js` now prints
   only :925, the `termId: ''` comment, which the brief excludes.
2. **The comment above the breakdown in `src/detail.js` no longer says the banner always names the weights' total.** [x]
   It now reads *"The banner above says why there is no grade: what the weights come to, or — since
   WO-3.41 — that the class has no categories yet, which names no total at all."* I checked this
   against `weighted()` in `src/grade-engine.js`: it returns `'The category weights total N%, so there
   is no grade yet.'` when categories exist and `NO_CATEGORIES_MESSAGE` when none do, and both carry
   `reason: 'weights-unbalanced'`, which is the reason detail.js branches on. I dropped the old
   clause *"and where to fix it"* in the same edit, because neither message says where to fix
   anything. The comment's reason for drawing no breakdown is unchanged.
3. **No line outside a comment moves, and `CACHE` is not bumped.** [x] Every `-`/`+` line in
   `git diff src/` is inside a `/* … */` block. `git diff --stat`: `src/assignments.js | 11 ++++++-----`,
   `src/detail.js | 3 ++-`. There is no line-ending churn, because both files were edited only with
   the Edit tool and the stat matches the hunks. `sw.js` is untouched.

No 👤 or 📆 lines on this row.

## Ruling on `src/shell.js` ~4599: left unchanged

The comment says that what a DUPLICATE wrote (the target's own ids, and no new `scores` column)
*"is the difference between this build and the naive one that carried the source's `categoryId`
across a class boundary, and it is invisible on screen because both look identical on the list."*
Its subject is **the difference between two builds**: ids and score columns are not on screen. It
does not say a row is absent. So it is a different claim from "invisible on B's list", and the
work order says to fix it only if it is the same claim.

**Its supporting clause is partly overstated, though, and I am flagging that rather than fixing it.**
When the target class has a category with the same name, the naive copy would now show under
*Not in a category* while this build's copy shows under the matched category, so the two lists
differ. When there is no name match, both arrive under *Not in a category* and look identical. The
`scores` half is invisible on screen in every case. **Proposed follow-up (XS, comment only):**
narrow it to something like *"…invisible on screen: the ids and the score column are not drawn,
and with no category of the same name both copies land under 'Not in a category' and look
identical"*. That should be the owner's call, not a scope extension here.

## Tools

- `node tools/wo-sweep.mjs` on the delivered tree: **`47 checks · 43 passed · 1 failed · 3 to review`,
  EXIT=1.** The one FAIL is § 9: *"every SHELL file change is paired with a CACHE bump :: src/assignments.js,
  src/detail.js changed since planbook-shell-v164 was set at 061c53b — bump CACHE in sw.js…"*.
  **This conflicts with Acceptance 3**, which forbids the bump. § 9 compares changed file names and
  has no exemption for comment-only changes (tools/wo-sweep.mjs ~427–505). I followed the Acceptance
  line, so the sweep stays red on § 9 until the next work order that bumps `CACHE`. That bump will
  clear it, because the check counts changes since the commit that set the current CACHE string. The
  other 43 passed, and the 3 reviews are the standing ones. The brief's "both must be green" cannot be
  met together with Acceptance 3 as written. The orchestrator or the owner should decide whether that
  is acceptable or whether § 9 needs a comment-only allowance. That would be a separate work order;
  I did not touch the tool.
- `node tools/verify-shell.mjs`: **not run.** No executable line or markup moved, so the harness has
  nothing new to measure, and a run costs about 13 minutes. I am reporting no count for it.

## Out-of-scope notes

- `src/assignments.js:925` (*"one filed under '' would be invisible on every term's list"*): I did not
  check whether it is still true and did not touch it. The brief excludes it.
- The `src/shell.js` follow-up above.
- Proposed tooling follow-up: § 9 could treat a diff whose hunks are all inside comments as exempt.
  Telling comment lines apart reliably is harder than it sounds, so it may not be worth building.

## Draft CHANGELOG line (the teacher decides)

*Not user-visible. Three source comments corrected to match the build: a copy filed under another
class's category would show up under "Not in a category", not vanish, and a class with no
categories gets its own no-grade banner sentence.*
