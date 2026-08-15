# WO-1.17 — correction 1, result

**Scope worked** The single ❌ from the verdict: the stale numeral at `tools/README.md:1078`.
**Files changed by this round** `tools/README.md` — one line, one numeral. Nothing else.
**Original result** `.claude/dispatch/WO-1.17-result.md` (unchanged; the eight-file tree it describes
is untouched apart from the line above).

## The edit

```
-**The 19 above is deliberately unguarded, and the asymmetry is the reason §11 was worth building for
+**The 20 above is deliberately unguarded, and the asymmetry is the reason §11 was worth building for
```

Line length is unchanged, so no re-wrap was needed and the numeral is still at `:1078`, where the
verdict cited it.

## Report point 1 — the figure came from a run, not from arithmetic

**Command run:** `node tools/wo-sweep.mjs` (from `c:\dev\planbook`, twice — once before the edit to
source the figure, once after to confirm the tree stayed green).

**Summary line it printed, both times, verbatim:**

```
================ SUMMARY ================
20 checks · 18 passed · 0 failed · 2 to review
```

Exit status 0. I copied `20` off that line rather than adding one to the `19` that was there; I did
not read the figure from `:1047` or `:1081` either, since a correction sourced from the two numerals
the same change already edited would only be arithmetic wearing a run's clothes.

The two REVIEWs are the standing pair, unchanged and named in full in the first run's output:

- `sensitive field names outside src/backup.js` — 297 mentions across `index.html`, `sw.js` and 20
  `src/` files
- `due-date and late/missing on the same line` — `src/detail.js:420`, `src/grades-report.js:509`,
  `src/past-due.js:7`, `:337`, `:348`, +3 more

No check went from PASS to FAIL or to REVIEW. The sweep does not read this paragraph, so this is a
confirmation that I broke nothing, not evidence that the numeral is right — the evidence for the
numeral is the summary line quoted above.

## Report point 2 — the paragraph still reads as the argument it was

I read the paragraph and its two neighbours (`:1046`–`:1088`) before editing. The sentence is an
argument that *this particular figure* is deliberately left unguarded, in contrast to
`verify-shell.mjs`'s executed-check count that §11 does guard, and the number is the argument's
subject — it is the thing pointed at by "above", which resolves to `wo-sweep.mjs` is **20 checks**
after WO-1.17 at `:1047`. Swapping the numeral leaves the referent correct and the argument intact:
the claim is that a stale figure *here* is corrected for free by the next person to run the sweep,
because the true figure prints in a second on the summary line — and the sentence now agrees with
both the count it refers back to at `:1047` and the `` `20 checks` on this tree `` at `:1081` that it
uses as its own proof. It also agrees with the table entry at `:11` ("the verifier's 20-check standing
sweep"), which WO-1.17 had already updated.

I re-worded nothing else in the paragraph, and it needed nothing else — the argument never depended
on the specific value, only on the numeral matching the run.

I grepped the file afterwards for any other `19` still standing in for the sweep's count
(`19[- ](check|above)`, `\b19\b.*sweep`, `sweep.*\b19\b`): no matches. The only surviving `19` in the
sweep's own output is `19 top-level key(s) in docs/data-model.md`, which is a different subject and
correct.

## Report point 3 — `git diff --stat`

```
 TESTING.md                                      |  70 ++++++++++
 docs/data-model.md                              |   8 ++
 plans/work-orders/phase-1-shell-store-roster.md |  32 +++--
 src/backup.js                                   |  79 ++++++++++-
 sw.js                                           |   2 +-
 tools/README.md                                 |  35 ++++-
 tools/verify-shell.mjs                          | 178 +++++++++++++++++++++++-
 tools/wo-sweep.mjs                              | 121 ++++++++++++++++
 8 files changed, 505 insertions(+), 20 deletions(-)
```

The same eight files WO-1.17 already had in the tree; no ninth file, and no file newly touched. The
`tools/README.md` line count is identical to what the verifier walked (35 changed lines) because the
correction replaces a line rather than adding one — the whole of this round is inside that existing
hunk, visible as the `-**The 19 above` / `+**The 20 above` pair in `git diff -U2 -- tools/README.md`.

Untracked at `.claude/dispatch/`: `WO-1.17-brief.md`, `WO-1.17-correction-1.md`, `WO-1.17-result.md`,
`WO-1.17-status.md`, and this file. No commit and no push, per standing rule and the brief's silence.

## What I did not run, and why

`node tools/verify-shell.mjs` — not run. The correction brief and the verdict both say the
re-verification for this edit is a grep rather than a browser run, because nothing executable
changes, and the diff bears that out: no file under `SHELL`, no `src/`, no harness. Running it would
have been evidence that I had gone out of bounds, not evidence for the fix. The shell cache stays at
`planbook-shell-v64` and needs no second bump.

No 👤 line was ticked in this round, and none came due — nothing here is testable on a device.

## Out-of-scope temptations declined

- **WO-1.18's stale `637` call-site count and its `tools/verify-shell.mjs:1860` line reference.** Left
  exactly as they are, per the bounds. The tree is at 769 call sites and this run pushed the comment
  WO-1.18 cites to `:1869`, so both of its figures are stale as of the uncommitted work — but they are
  WO-1.18's prose and are already booked as findings against it. Recording here that they are still
  stale after this round, so that a later reader of this file does not mistake the omission for an
  oversight.
- **The `else check(` line-number drift note at `~:948`,** which the WO-1.17 diff already annotates as
  illustration rather than something either tool resolves. Not touched.
