# WO-1.79 — result (implementer)

**Done, all four Acceptance lines met and ticked. No 👤 or 📆 lines in this work order. Nothing committed.**

## What changed

- `tools/verify-shell.mjs` line 81: *"Seventy-five files, named after the surface they drive …"* → *"These files are named after the surface they drive …"*. The rest of the comment (the naming rationale, and the two files that are not sections) is byte-identical.
- `tools/README.md` line 1370: *"the ninety-one files under `tools/verify/` that it names"* → *"the files under `tools/verify/` that it names"*. The rest of the sentence (the set comes from `STATIC_SECTIONS`/`BROWSER_SECTIONS`, not a directory scan) is unchanged.
- `TESTING.md`: new `### WO-1.79 — …` section under Phase 1, after WO-1.78, with the four Acceptance lines verbatim and evidence.
- `plans/work-orders/phase-1-shell-store-roster.md`: WO-1.79's four boxes ticked. I left the status line (`🤖 CLAIMED`) for the orchestrator's `--tick`.

## The finding (deliverable 2)

**Nothing checks the README's file count, so it went too.** `tools/wo-sweep.mjs` reads `tools/README.md` in exactly two places, and neither one is this number:
- § 11, line 802: `const RECORDED = /holds (\d+) \`check\(\)\` call sites/g;`, the call-site count
- § 22, line 4346: `const RECORDED = /The verifier's (\d+)-check standing sweep/g;`, the sweep count

Greps that found nothing else: `grep -n "readmePath\|README_PATH\|readmeText" tools/wo-sweep.mjs` returns only the § 11 and § 22 lines. `grep -n -i "ninety\|seventy\|eighty\|files under" tools/wo-sweep.mjs tools/wo-gate.mjs` returns nothing. `wo-gate.mjs` mentions `tools/README.md` only in comments and one `console.log`.

**Both counts were wrong, not only the comment.** `ls tools/verify/*.mjs | wc -l` gives **93**, and the sweep's § 11 line itself reads "2000 `check()` call site(s) across 94 harness file(s)" (93 plus the entry file). The README said 91 and the work order says "ninety-one now". So the README figure WO-1.77 updated had already drifted by two. That supports the work order's premise. Correcting the work order's own "ninety-one" is not my call, so I left it.

## Acceptance, one by one

1. **The header comment states no number of files.** Met. The comment (lines 80–85) now opens "These files are named …". `grep -n -iE "(seventy|eighty|ninety)|[0-9]+ files" tools/verify-shell.mjs` finds only line 714, an unrelated historical audit figure ("21 files with a touch window") in another section's comment.
2. **TESTING.md says whether the count is checked, with the line or grep, and what was done.** Met. See the finding above, written out in the section.
3. **Both tools pass.** Met. Read from the actual output:
   - `node tools/verify-shell.mjs` (run after both edits, output to a log, waited for exit): `2012 checks · 2012 passed · 0 failed · 0 skipped`, `EXIT=0`.
   - `node tools/wo-sweep.mjs` (re-run after the TESTING.md and tick edits): `50 checks · 47 passed · 0 failed · 3 to review`, `EXIT=0`. The three REVIEWs are the standing ones: sensitive field names, due-date/late, and mockup banners. § 11 still reads 2000 call sites, so the edit added none.
4. **TESTING.md carries the lines verbatim with evidence.** Met.

## Decisions the work order didn't settle

- **Replacement wording.** "Seventy-five files, named after …" became "These files are named after …". This is the smallest change that stays grammatical, and it keeps "Two of them are not sections" pointing at something.
- **README ledger history left alone.** The dated entries lower in `tools/README.md` ("the file count this ledger's head names moves to seventy-five", "which is the eighty-first file", and so on) are records, each true on its day. They now refer to a head that names no count, and that reads as history. Rewriting them would be reconstruction.
- **Pipeline map.** `plans/work-orders/README.md` § "The pipeline's own files" has no row for `verify-shell.mjs` (scripts are mapped in `tools/README.md`). A comment-only change alters no pipeline shape, so no other pipeline file was owed an edit.
- No mutation was done (none was needed). The `MUTATION` grep over the two edited files finds only pre-existing prose in `tools/README.md` (lines 1518–1531, describing earlier rounds).

## Proposed follow-up (declined as out of scope)

If anyone wants a file count in prose again, the only maintainable form is a § 11-style sweep check: hold a README sentence against the length of the harness's derived section list, which the sweep already computes ("across 94 harness file(s)"). I did not add it. The better answer is probably what this work order did: no number.

## Draft CHANGELOG entry (the teacher's to write)

> The browser harness's header comment and `tools/README.md` no longer say how many check files there are. Both figures were wrong (75 and 91 against 93 actual), and nothing checked either one. The sweep already counts the files from the harness's own section lists.

## Files changed

- `c:\dev\planbook\tools\verify-shell.mjs`
- `c:\dev\planbook\tools\README.md`
- `c:\dev\planbook\TESTING.md`
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`
- `c:\dev\planbook\.claude\dispatch\WO-1.79-result.md` (this file)
