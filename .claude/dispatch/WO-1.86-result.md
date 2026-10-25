# WO-1.86 — result

**Implementer:** Claude (work-order-implementer), Opus. **Not committed.** I ran no `--start`, `--release`, `--handoff` or `--tick`. The row is still 🤖 CLAIMED. All five Acceptance boxes are ticked by hand in the phase file. None of them is 👤 or 📆.

## Files changed

- `c:\dev\planbook\tools\verify\log-entries.mjs`: F1's code, title, detail and comment (one hunk).
- `c:\dev\planbook\tools\verify\term-record.mjs`: F3's code, title and comment (two hunks).
- `c:\dev\planbook\TESTING.md`: new `### WO-1.86 — the two append-only checks close what one token settles`, under Phase 1, after § WO-1.85.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the five Acceptance boxes of WO-1.86 ticked. The 🤖 CLAIMED status line was already modified by `--start`.
- `c:\dev\planbook\.claude\dispatch\WO-1.86-result.md`: this file.

Nothing in `src/` differs from HEAD: `git diff HEAD --stat -- src/` is empty. No `CACHE` bump is owed. `CHANGELOG.md` is not touched; a draft is at the end of this report.

## What was built

**F1, over `src/log.js`.**
- **Compound reassignment.** The reassignment regex and the quoted-key regex now take an optional compound operator. The F1 comment always said *"any other reassignment still counts"*. **I corrected the code toward the comment.** The operator group is WO-1.83's `.length` group with `||` and `??` removed, because `||=` and `??=` only add (they are n/a in F1, and they are the guard's own shape).
- **`delete`.** The `delete d.log` and `delete doc.log` tokens are replaced by one regex for `delete` in any form.
- **`.length` decrement.** Postfix and prefix `--` are refused. `++` is not, because `length++` only adds.
- **Six tokens:** `Object.assign(`, `Reflect.set(`, `Reflect.deleteProperty(`, `Object.defineProperty(`, `restoreDocument(` and `adoptRemoteDocument(`.

**F3, over `src/term-record.js`.**
- **WO-1.83's patterns.** The `.length` assignment regex is copied character for character. The quoted-key pattern is added.
- **Compound reassignment.** The existing `termRecords … =` regex and the new quoted-key regex both take WO-1.83's full operator group, `||=` and `??=` included.
- **`.length` update.** `--` and `++` are refused, postfix and prefix.
- **Five tokens:** `Reflect.set(`, `Reflect.deleteProperty(`, `Object.defineProperty(`, `restoreDocument(` and `adoptRemoteDocument(`.
- **Left alone.** `Object.assign(` and `delete ` were already F3 tokens and are untouched.

**In both checks.** Each one's *fence, not a reading* text, in the comment and the printed title or detail, now names only what still passes. The check count is unchanged at 2117. No `check(` was added, so the count in `tools/README.md` does not move.

## Acceptance, line by line

1. **[x] Before any token lands, § WO-1.86 records whether either file holds a legitimate use.** This is § 1 of the section. The scratch script `legit.mjs` strips comments the way the checks do and searches the code for every proposed token. Neither file holds any of them. Each file has one `.length`, and it is a read. Each imports only `getDoc`, `update` and `newId` from the store.
   - I wrote § 1 and ran the search before editing either harness file. **Nothing in the tree proves that order.** It rests on this report, and the section says so.
   - The per-file ruling table is there. The two files are ruled differently where their claims differ: F1 claims append-only, F3 claims only-pushes.
2. **[x] Each newly refused shape is planted, turns its check red naming the remover, and is reverted. The red output is in TESTING.md.** This is § 3. All 17 new F1 shapes went into `src/log.js` and all 22 new F3 shapes into `src/term-record.js`, as dead code behind `if (entry === null) { … }`. The tree was staged first.
   - **The plant run:** one full `verify-shell.mjs` run gave *2117 · 2115 passed · 2 failed*, `EXIT=1`. The two failures were exactly the two checks. Their detail lines are quoted verbatim, except one marked `[same list]` standing in for a printed duplicate. Every shape appears in them by its matched text or as a counted token, and each is mapped back to its ID.
   - **Revert:** `git checkout -- src/log.js src/term-record.js`. After it, `git diff --stat src/` was empty and `grep -rn "MUTATION WO-1.86" src/ tools/` was empty.
   - **`grep -rn MUTATION src/ tools/` is not empty and cannot be on this tree.** It returns 18 lines, and `git grep -n MUTATION HEAD -- src tools` returns the same 18 at HEAD: `src/shell.js:1077`, plus `tools/README.md` and harness comments. All of it is prose already there. None is a plant.
   - **Departure, stated in the section:** I used one run per file-block, not one run per shape as WO-1.83 did. Thirty-nine runs at about 19 minutes each would have taken about 12 hours. To make the evidence hold per shape, I changed the checks' reporting so that every regex match is listed with its text and every token with its count. The check fails if and only if that list is non-empty. § 4's probe also refuses each shape **alone**, using the same check code. **A verifier may read "each … turns its check red" as wanting individual runs.** If so, that is the one point to contest.
3. **[x] The probe, re-run, shows every *Refuse* shape refused in both F1 and F3, and every remaining *passes* is named.** This is § 4.
   - **The probe.** WO-1.84's probe no longer runs as printed, because WO-1.85 moved F8's slice anchor. So it was cut to the F1 and F3 fences. The full diff of that change is quoted, and the F1 and F3 slices are untouched.
   - **Runs.** The before-run reproduces § WO-1.84's tallies exactly. After: F1 is 36 refused, 10 passes, 6 n/a; F3 is 43 refused, 9 passes, 0 n/a. Controls were OK on both runs, with 0 control problems. A re-run on the final bytes gave 0 verdict differences.
   - **Full table.** It has before and after columns for both fences.
   - **F1's 10 passes** (A5, A12, A13, B2–B6, D11, D12) and **F3's 9** (A5, A12, A13, B2–B5, D11, D12) are each mapped to a phrase in the fence line.
4. **[x] `verify-shell.mjs` and `wo-sweep.mjs` pass.**
   - **First run**, after the revert: *2117 · 2117 passed · 0 failed · 0 skipped*, 1166s, `EXIT=0`.
   - **Then one comment edit.** In term-record.mjs, "one assignment regex" became "four regexes".
   - **Final run, on the final bytes:** *2117 · 2117 passed · 0 failed · 0 skipped*, 67,669 lines, 1171s, `EXIT=0`.
   - **Sweep:** `EXIT=0`, *52 checks · 49 passed · 0 failed · 3 to review* (the three standing reviews). That result held on all three runs, the last after the section was finished.

   I read every one of these from the log's own summary and `EXIT=` lines after the process exited.
5. **[x] The section carries the lines verbatim with evidence.** A script compared the phase file's five Acceptance lines, whitespace-normalised, against the section, and all five are verbatim.

## Decisions the work order did not settle

- **F1's compound group drops `||` and `??`, and F1's update regex is `--` only.** F3 takes the full group and both `--` and `++`. That is per file, not by symmetry. As a result **three F3 cells moved that the work order did not list**: A10, A11 and C6 are now refused in F3. § WO-1.84 judged all three as inside F3's "only pushes" claim. In F1 they stay n/a. If the owner wants F3 limited to the listed shapes, remove `\|\||\?\?` from F3's two compound regexes and `\+\+` from its update regex.
- **`Object.assign` in F1 is refused.** The work order made that conditional on finding no legitimate use in `src/log.js`, and there is none.
- **Red lines now carry the matched text.** For example, `reassignment of .log ".log +="`, or `Reflect.set( x2` for a token. This is a reporting convention I set, and it changes what a red line prints. A green line prints exactly what it printed before (`removers found: none` / `"found":[]`).
- **`delete` in F1** is matched by the regex `/(?:^|[^\w$.])delete\b[^;\n]*/`, not by the `'delete '` token F3 uses. The regex also catches `delete(` and skips `.delete(`. I left F3's token as it was, because it was not in scope.
- **CHANGELOG.** The brief calls the entry a draft deliverable. My standing rules say to leave `CHANGELOG.md` to the teacher, so the draft is below and the file was not touched.

## Declined / follow-ups (not acted on)

- **B2 and B3 are still open in both fences:** an index write through a quoted key (`d['K'][0] = x`) or through an alias. Neither is on either of the work order's lists. A quoted-key-then-subscript pattern would close B2 cheaply if the owner wants it booked.
- **F1's `.log[...]` index regex was not given the compound operator.** That shape is not in the catalogue.
- **WO-1.84's probe source in `TESTING.md` § WO-1.84 no longer runs as printed.** The cause is WO-1.85's F8 wording, and the F8 anchor is missing. WO-1.87 will need its own adjusted copy to re-run F2 and F4–F8.
- **Nothing for F2, F4–F7, the § 17/§ 24 `MUTATES` pattern or `src/contact-history.js`.** That is WO-1.87, as instructed.

## Draft CHANGELOG entry (for the teacher to place or rewrite)

> **The two append-only checks now refuse what one token settles (WO-1.86).** The harness's checks
> that `src/log.js` and `src/term-record.js` can only append were each blind to shapes that empty
> or replace the collection. The term-record check had never received the `.length` and quoted-key
> patterns the log's check gained in WO-1.83, so `d.termRecords.length = 0` passed it. Both now refuse
> compound assignment, every `delete`, `.length` decrements, `Reflect.set`/`deleteProperty`,
> `Object.defineProperty`, `Object.assign` and the two whole-document swaps by name. Each token was
> first checked against the file it guards, and neither file uses any of them. A red line now quotes
> what it matched. What still passes (computed keys, destructuring, index writes through a quoted key
> or alias, edits to a stored entry, and mutators named by a string or borrowed) is named in each
> check's own words. No app code changed.
