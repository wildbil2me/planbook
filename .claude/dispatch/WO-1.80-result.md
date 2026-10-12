# WO-1.80 — result

**Implementer:** Claude (Opus), 2026-10-12. Not committed. Status left at 🤖 CLAIMED (no `--tick`, no `--release`).
All six Acceptance boxes ticked in the phase file and in `TESTING.md` § WO-1.80. None is 👤 or 📆.

## What landed

- `c:\dev\planbook\tools\wo-sweep.mjs`: new **§ 32**, "the harness's prose names no count of its own files". It sits directly above § 22, which is still the last section; nothing was renumbered. It is one check (`check(NAME, …)`), with a banner covering what it reads, what it refuses, what it lets through, the bound, fence-not-a-reading, and the proof.
- `c:\dev\planbook\tools\README.md`: the `wo-sweep.mjs` row (line 10) moves from `50-check` to `51-check` (the figure came from a sweep run, which printed "emitted 51"). One clause was appended to the row describing § 32, in the row's existing "And since WO-x.y on DATE, § N: …" style. Nothing else in the file changed. `git diff` shows line 10 only.
- `c:\dev\planbook\TESTING.md`: `### WO-1.80 — nothing stops a file count creeping back into the harness's prose` under Phase 1, after WO-1.79. It has all six Acceptance lines verbatim, each with evidence and the quoted red output.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the six Acceptance boxes ticked. The status line was already the orchestrator's 🤖 CLAIMED.

`src/` is untouched, so no `CACHE` bump.

## How § 32 works (the decisions the work order left open)

- **Header anchor**: the one line matching `/* ── the sections, in run order`. The check reads from that line to the first `*/`, which must come within 40 lines. Each line's leading ` * ` is stripped and the lines are joined, so a count split across two lines is still caught. A hit is reported at the line where it starts.
- **README anchor**: the literal `Since WO-1.26 the count spans`, which must appear exactly once. The check reads from there to the first `.` followed by whitespace, which is lines 1369–1372 today, ending "the set counted is the set run." The dots inside `verify-shell.mjs` and `tools/verify/` are not followed by whitespace, so they do not end the read. **This bound is the whole of the ledger's protection.**
- **Pattern**: a number (digits, or English number words up to "thousand", joined by hyphens, spaces or "and", in any case) followed by `file(s)|module(s)|section(s)`. Either the noun comes right after the number, or exactly one word sits between them, and that word may be neither `of` nor a number.
- **"Two of them are not sections"**: this is a count of two *named* files, and it passes because of the `of` rule plus the one-word limit. It was **not reworded**. The banner says so, and also says that "Two files are not sections" would go red, in which case the honest fix is to name the two files.
- **A count that happens to match is refused** (WO-1.79's ruling). The banner and the failure message both say this.
- **Losing an anchor fails loudly** and names it. That covers an opener reworded or missing, the opener appearing twice, the comment never closing, the README sentence reworded, moved or doubled, and the sentence having no full stop within 1200 characters.

## Acceptance, one line at a time

1. **Passes on today's tree and names both places it read.** Met. The output is `PASS | the harness's prose names no count of its own files … :: read tools/verify-shell.mjs:80-85 (the comment opening \`the sections, in run order\`) and tools/README.md:1369-1372 (the sentence beginning \`Since WO-1.26 the count spans\`); no number of files, modules or sections in either. A fence, not a reading: …`
2. **A count in digits and in words in the header, and a count in the README sentence, each go red at the line.** Met with five count plants, each run separately and each reverted with `git checkout --` before the next:
   - `tools/verify-shell.mjs:81 "93 files"` (header, digits)
   - `tools/verify-shell.mjs:81 "Ninety-three files"` (header, words)
   - `tools/verify-shell.mjs:83 "ninety-three files"` (header, words split across two lines)
   - `tools/README.md:1370 "ninety-three files"` (README, words)
   - `tools/README.md:1370 "93 files"` (README, digits)

   Every one printed the same failure tail: *"— a count of the harness's files in its own prose. WO-1.79 ruled that no number is better than a checked one: § 11 prints the true figure on every run … Take the number out — a count that happens to match today is refused too"*.
3. **Rewording either anchor fails and names it.** Met:
   - Header opener changed to `the section files, in run order` gave `ANCHOR LOST: tools/verify-shell.mjs no longer has the comment that opens \`── the sections, in run order\` …`
   - README changed to `**From WO-1.26 the count spans` gave `ANCHOR LOST: tools/README.md no longer holds the sentence beginning \`Since WO-1.26 the count spans\` …`

   Both were reverted. A third arm fired by accident: my first draft of the README row quoted the anchor's opening words, and the run went red with `… holds the sentence … 2 times (lines 10, 1369)`. The row now paraphrases instead.
4. **The ledger does not trip it, and nothing was rewritten.** Met:
   - It passes with the ledger in place.
   - `git diff tools/README.md` touches line 10 only.
   - A scratch script (in the session scratchpad, not the repo) ran § 32's own pattern over the **whole** README and got **92 hits**, including line 4185's "sixty files". That shows the bound, not luck, is what spares the ledger.
   - "moves to **seventy-five**" (line 2318) and "the eighty-first file" (line 2564) would not match the pattern anyway: the first has no noun after it, and the second is an ordinal.
5. **Both tools pass.** Met:
   - `node tools/wo-sweep.mjs`: `EXIT=0`, *51 checks · 48 passed · 0 failed · 3 to review*. These are the three standing reviews. Run last, after every edit.
   - `node tools/verify-shell.mjs`: started after the `wo-sweep.mjs` and `README.md` edits and waited out to its exit. It printed *2044 checks · 2044 passed · 0 failed · 0 skipped* and `EXIT=0`. The run took longer than 9 minutes.
6. **The `TESTING.md` section exists with lines verbatim.** Met: `c:\dev\planbook\TESTING.md` § WO-1.80.

## Plant hygiene

- Every plant was a `sed -i` on a file that had no edits of mine, followed by `git checkout --` on that file.
- After the last plant, `git diff --stat` listed only the phase file (the orchestrator's claim line) and `tools/wo-sweep.mjs`.
- `grep -rn "ninety-three\|These 93\|93 files\|section files, in run\|From WO-1.26" tools/verify-shell.mjs tools/README.md` found nothing.
- The README row edit came after all plants were reverted.
- `grep -rn MUTATION tools/verify-shell.mjs tools/README.md` finds only README prose that was already there before this work order.
- All three edited files are still LF-only.

## What I could not verify, and the known limits

- No 👤 lines, so nothing needed a device.
- § 32 is a fence, not a reading, and the banner says so. These all get past it:
  - a size stated without a number word next to the noun ("ninety-odd modules", "a hundred-file harness", "dozens of files")
  - a count with two or more words before the noun ("91 of the harness's files")
  - a count anywhere in either file outside the two bounded passages
- A side note, not a failure: my first `ledger-scan` attempt left a Bash call hanging on a bare `cat >` that was waiting for stdin. I deleted the empty file it created in `%TEMP%`. Nothing in the repo was affected.

## Things I noticed and left alone (out of scope)

- WO-1.79's `TESTING.md` section says 93 `.mjs` files under `tools/verify/`. Today it is 94 (§ 11 reads "across 95 harness file(s)"). That section is dated history, so I did not touch it.
- `plans/work-orders/README.md` § "The pipeline's own files" maps agent and pipeline files, not scripts, and it points to `tools/README.md` for those. So it needed no row for § 32.

## CHANGELOG.md draft (for the teacher to accept, reword or drop)

> **The harness can no longer quietly regain a file count (WO-1.80).** WO-1.79 took the number of harness files out of `verify-shell.mjs`'s header comment and out of the sentence in `tools/README.md` that says what the call-site count spans, because both had gone stale and nothing read them. The sweep now reads those two passages, and only those two, and fails if a count of files comes back in digits or in words. That includes a count that happens to be right today. It also fails, and names the passage, if it can no longer find either one. The README's dated ledger, which records the harness's size on the days it changed, is left alone by the narrow anchor rather than by editing it. Tooling only; no app change.
