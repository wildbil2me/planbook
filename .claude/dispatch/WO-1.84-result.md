# WO-1.84 — result (implementer)

**Outcome.** All six Acceptance lines are met, and all six are ticked in the phase file. None is a
👤 or 📆 line. Nothing is committed, and no `--tick`, `--start` or `--release` was run, so the
status still reads `🤖 CLAIMED`.

**`src/` and `tools/` are byte-identical to HEAD.**
- `git diff --stat -- src/ tools/` prints nothing, and so does `--cached`.
- `git status --porcelain -- src tools` is empty.
- `grep -rln "MUTATION WO-1.84\|wo184" src/ tools/` finds nothing.
- The bare `grep -rn MUTATION src/` finds only `src/shell.js:1077`, the prose line already at HEAD
  that WO-1.83 recorded.

## Files changed

- `c:\dev\planbook\TESTING.md`: a new § WO-1.84 under Phase 1, after § WO-1.83. It contains the
  fence list and the search, the catalogue, the method and controls, the 52 × 9 table with tallies,
  the prose verdicts, the recommendation, the Acceptance lines with evidence, and the full source of
  the probe and the renderer.
- `c:\dev\planbook\CHANGELOG.md`: a WO-1.84 entry at the top of `[Unreleased]`. The brief made it a
  deliverable. Edit it or drop it as you see fit.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md`: the six Acceptance boxes are
  ticked.
- Scratchpad only, not committed: `probe.mjs`, `table.mjs`, `probe.json`, `probe2.json`, `table.md`,
  the section drafts and the run logs, all under
  `C:\Users\WildB\AppData\Local\Temp\claude\c--dev-planbook\81253719-bb85-4668-9fe5-110cd70df2ba\scratchpad\`.

## Commands run, with results (each read from its own output)

| Command | Result |
|---|---|
| `node probe.mjs` (scratchpad) | `EXIT=0`, "control problems: 0". For all nine columns, the clean file PASSes and the known-refused shape is refused |
| `node probe.mjs --json > probe.json`, then again as `probe2.json` | both `EXIT=0`; `cmp` says identical |
| `node tools/verify-shell.mjs`, `src/` and `tools/` at HEAD, waited out to `EXIT=` | *2117 checks · 2117 passed · 0 failed · 0 skipped*, 67,537 lines, 1146s, `EXIT=0` |
| `node tools/wo-sweep.mjs` (after the section and changelog) | `EXIT=0`, *52 checks · 49 passed · 0 failed · 3 to review* |
| `node tools/wo-sweep.mjs` (after the ticks, the final run) | `EXIT=0`, *52 checks · 49 passed · 0 failed · 3 to review*, the three standing reviews |
| `node tools/wo-gate.mjs WO-1.84` | `PASS | gates clear`, with the two expected mid-dispatch NOTEs (CLAIMED, and the tree reading as an interrupted draft) |

verify-shell was started before the docs were written. That is valid: it reads no `TESTING.md`,
`CHANGELOG.md` or `plans/` file, which a grep confirmed and the section records. Nothing under
`src/` or `tools/` moved during or after the run.

## Acceptance, line by line

1. **Met.** There are eight fences, F1–F8. F6 (§ 24) is probed in two halves, giving nine columns.
   Each is listed with its `file:line`, the file its code actually reads, and its claim quoted. The
   search commands are stated, and every hit is triaged as kept or excluded with a reason.
   - **Two fences were added by the search:** § 30's writer exception and `front-door.mjs`'s
     "writes nothing".
   - **One discrepancy is recorded rather than smoothed over.** The contact-log check searches
     **`src/contact-history.js`**, not `src/log.js`. It reads log.js only for
     `/export function contactsFor/`.
2. **Met.** The catalogue has 52 shapes, A1–G3, covering every family the work order lists. Each
   carries a reading and a one-line reason: 45 remove or overwrite, 2 reorder, 5 add.
3. **Met.** All 468 cells are filled.
   - The probe slices each fence's own code out of the harness file by asserted anchors and
     executes it against an in-memory plant. No regex or token list is retyped.
   - The table is rendered from `probe.json`. The only judgment layered on top is the n/a map,
     which is quoted in the section.
   - Every fence ran every shape, n/a cells included.
4. **Met.** All eight fences are marked as overclaiming, each with its words quoted. F7 is split:
   the two shapes its *does not see* list names match the table, and the four reflective writes
   overclaim. F8 overclaims narrowly.
5. **Met.** See the diff, status, grep, verify-shell and wo-sweep evidence above.
6. **Met.** The section carries all six lines verbatim, each with its evidence.

## Findings worth the orchestrator's eye

- **F3 (term-record) has none of WO-1.83's fixes.** It has no `.length` pattern and no
  bracketed-key pattern, so `d.termRecords.length = 0` and `d['termRecords'] = []` pass. Of the 52
  shapes, 31 pass it.
- **F2 (contact-log) says "could not write on any input … no store mutation".** It searches three
  tokens, and the file it guards imports `getDoc`. 47 of the 50 shapes inside its claim pass.
- **§ 17 and § 24 share a `MUTATES` that sees only `doc.`/`d.` + name + `=` or eight methods.**
  `delete`, `.length` writes, index writes, bracketed keys and `.copyWithin(` all pass. 43 pass in
  each column.
- **§ 20 claim 4 alone refuses only `restoreDocument(` (and `update(`).** Nine bracket shapes are
  refused, but by claim 5. 39 pass.
- **Aside, not a cell:** `tools/README.md`'s § 17 paragraph says "eleven writer names", and
  `WRITERS` lists twelve.

## Decisions the work order did not settle

- **Inclusion rule for the search.** A check is a fence if its claim is that a source file cannot
  write to, remove from or mutate the document (or confines who may), decided by matching text.
  Under that rule:
  - **Excluded:** the storage-destination checks (`drive-sign-in.mjs:131` on auth.js,
    `drive-sync.mjs:264` on the bookmark, wo-sweep § 4). They refuse a storage API by name, and no
    collection is in play.
  - **Kept:** front-door, because it refuses `store.*` writers.
  - **Kept:** § 30, because its comment confines the writer.
- **Reorders are n/a on the whole-file no-writer fences** (F2, F4, F5, F6). The work order's Traps
  rule this for § 17 ("does not promise to catch reordering"), and I applied the same reading to the
  other three, none of which names ordering. F3 names "sort", so its reorder cells are judged.
  **Adds were left covered** on the no-writer fences, because "no writer" plainly includes an
  append, and § 17's own `MUTATES` refuses `.push(`. If the owner reads the Trap more widely, A10,
  A11, C6, D8 and D9 in those columns become n/a.
- **F1's adds and reorders are n/a, following WO-1.83's ruling.** D9 `.push(` stays refused, because
  F1 pins the push count.
- **The § 20 cells refused by claim 5 are marked refused**, with the attribution "claim 5, not 4" in
  the cell. The check is one check and it went red. The prose verdict says what claim 4 alone
  catches.
- **F8's yearDatabaseListed half in `src/store.js` was not planted.** No catalogue shape is an
  IndexedDB open. This is stated in the section.

## Not verified

- I did not check whether `src/log.js`, `src/term-record.js`, `src/calendar-derived.js` or the
  others hold a legitimate `delete`, `Object.assign` or `Reflect.` use. Whoever widens a fence would
  need to know that. The recommendation says so explicitly rather than assuming.
- No 👤 work is involved.

## Declined (out of scope)

- Tightening any fence, rewording any fence's prose, and fixing the README's "eleven". This is
  inventory only, per the Traps.

## Draft changelog

Already written into `CHANGELOG.md`, under the heading "Every check that refuses a remover has been
read against one list of removers — 2026-10-24".

## Correction round

The verifier's one ❌: the WO-5.7 entry in `CHANGELOG.md` (HEAD line 1927) carries a raw carriage-return byte inside backticks, ``how a bare `^M` reaches a compose window``, and my earlier edit had turned that byte (0x0D) into a line feed (0x0A), splitting the line and breaking the code span in a historical entry.

**What changed:** that one byte, and nothing else. A small Node script read the HEAD file (`git show HEAD:CHANGELOG.md`) and the working-tree file as Buffers. It found the unique span between ``how a bare ` `` and `` ` reaches a compose window``: HEAD held `[13]` and the working tree held `[10]`. It spliced HEAD's byte back in and wrote the file as a Buffer. Nothing else was rewritten, so line endings elsewhere are untouched. Nothing in `src/`, `tools/`, `TESTING.md` or the work-order file was touched, and the status was not touched. No harness was re-run, because neither harness reads `CHANGELOG.md`.

**Evidence (output read):**

```
$ git diff --stat HEAD -- CHANGELOG.md
 CHANGELOG.md | 23 +++++++++++++++++++++++
 1 file changed, 23 insertions(+)

$ git diff HEAD -- CHANGELOG.md | grep -n '^@@'
5:@@ -13,6 +13,29 @@ records what someone remembered.

$ git diff HEAD -- CHANGELOG.md | grep -c '^-[^-]'
0

$ (the line) | cat -A
the clipboard CRLF is how a bare `^M` reaches a compose window and draws a second paragraph break,$
```

The verifier expected "about 25 insertions". The actual count is 23, which is consistent with that: the earlier 25 insertions included the two halves of the split line (the `-1 +2` hunk), and 25 − 2 = 23. The diff now has one hunk, which is the WO-1.84 entry at the top of `[Unreleased]`, and it has no deletions.
