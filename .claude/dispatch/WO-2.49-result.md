# WO-2.49 — result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-18

Everything below was read off a run I waited for. `verify-shell.mjs` was backgrounded and its exit
was waited on before this file was written; the numbers quoted are from its own summary block.

---

## Files changed

- `c:\dev\planbook\tools\wo-gate.mjs` — the split at `parseFile()`, the empty-Acceptance refusal in
  `applyTick()`, the eighteenth plant, the `--self-check` closing note, and three count statements
  the eighteenth plant made wrong.
- `c:\dev\planbook\tools\README.md` — the plant count (17 → 18, off the run), the third `--tick`
  refusal documented, two "not an eighteenth plant" sentences de-ordinalised, two rows added to the
  mutation table.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the seven Acceptance boxes ticked with
  their evidence. (Its `🤖 CLAIMED` status line was already modified when I arrived — the
  orchestrator's `--start`.)

`git status --short` at the end: those three files, plus the untracked
`.claude/dispatch/WO-2.49-brief.md` and `-status.md`. **No line-ending damage** — all three edited
files re-read as `0/NNNN` CRLF, i.e. pure LF (`tools/wo-gate.mjs` 0 of 2609, `tools/README.md` 0 of
2324, `phase-2-attendance.md` 0 of 5311). No tracker was converted; every CRLF file in this work
order lives in `TMP`.

---

## Against the Acceptance list, line by line

### 1. A CRLF phase file parses to the same Acceptance lists as its LF original — WO-3.25, ten lines

**Met.** Two copies of `plans/` plus a copy of the script in the scratchpad (outside the repository).
They differ in exactly one file's terminators:

```
LF   copy: 2118 newlines, 0 of them CRLF, 157008 bytes
CRLF copy: 2118 newlines, 2118 of them CRLF, 159126 bytes
identical apart from the terminator: true
```

`--tick WO-3.25 --dry-run` from each copy's own `tools/wo-gate.mjs`: `diff` of the two outputs is
**empty** — byte-identical, including

```
NOTE | all 10 Acceptance lines are ticked — nothing holds WO-3.25 open
NOTE | this work order's **Closes roadmap** line quotes no box — no roadmap box to tick
```

The same CRLF copy driven by `git show HEAD:tools/wo-gate.mjs` (the pre-WO-2.49 script) prints the
row's own evidence back, exit 0:

```
NOTE | all 0 Acceptance lines are ticked — nothing holds WO-3.25 open
NOTE | this work order has no **Closes roadmap** line — no roadmap box to tick
```

*Disclosed:* WO-3.25 is `✅ DONE`, and `--tick` refuses that at the status fence before it reads any
list, so its status was hand-edited to `🤖 CLAIMED — 2026-08-18` **in both copies** before the CRLF
conversion. The two files stayed identical apart from terminators (asserted, above). Nothing in this
tree was edited to make the measurement.

### 2. `--tick` on a CRLF file with an open box writes 🔨 IN PROGRESS and names the line

**Met.** The same box unticked in both copies (`phase-3-gradebook.md:2075`, chosen as the first
`- [x]` under WO-3.25's heading in each), then a **live** `--tick WO-3.25` in each copy — in `TMP`,
never against this tree. Both printed the same three lines:

```
HELD | 1 of 10 Acceptance lines are still [ ] — WO-3.25 is not done:
  plans\work-orders\phase-3-gradebook.md:2075  `1e3`, `0x1f`, `0b101`, `0o17` and `+7` cannot be produced in a score cell — by typing **or by past…
HELD | WO-3.25 left at 🔨 IN PROGRESS. Tick the lines above once they are true, then run this again.
```

The CRLF copy's status line after the write reads `**Status** 🔨 IN PROGRESS`, and the file is still
`2118/2118` CRLF; both copies lost exactly 11 bytes on the write. That is the writers still splitting
and joining on `'\n'` — deliberately unchanged, so a file keeps the terminators it arrived with.

### 3. The `**Closes roadmap**` collector reads a CRLF file — with a correction to the row

**Met, and the row's attribution is off by one parse.** A stray `**Closes roadmap**` line planted
below WO-3.25's header paragraph in both copies; `--audit` in each reports, identically:

```
BAD  WO-3.25  a **Closes/Amends roadmap** line at plans\work-orders\phase-3-gradebook.md:1979 is below the header paragraph — invisible to this script; move it into the paragraph
```

**The correction, measured rather than reasoned:** the literal stray-collector
(`/^\*\*(?:Closes|Amends) roadmap\*\*/`) carries no `$` and was **never blind** — the pre-WO-2.49
script finds that same stray in the CRLF copy. The parse that actually produced the false second NOTE
is `fieldRe()`'s `\*\*Name\*\*\s*(.*?)(?=…|$)` running over the header paragraph, which `parseFile()`
joins with `' '` — on CRLF that join leaves a `\r` at every wrap, `.` cannot cross one, and WO-3.25's
**Closes roadmap** value wraps across three lines, so the field came back empty. The row's `:395`
points at `depsOf()` in the pre-edit file, not at a collector. Both parses now read a CRLF file the
way they read an LF one (evidence above and in line 1). The row's conclusion — *this was never one
regex* — is exactly right; only the second regex's name changes.

### 4. An empty Acceptance list refuses and writes nothing, naming the file

**Met.** Driven twice.

- In the new plant, against a CRLF fixture whose `**Acceptance**` heading carries no boxes:
  non-zero exit, `HELD`, the file named, no `Acceptance lines are ticked` sentence, and
  `changedSince(before)` **empty** — not one file in the sandbox copy of `plans/` moved. That last
  assertion is the plant's own, and it is what fails if a future edit lets this path write.
- By hand, on the real CRLF copy driven through a reader with the split reverted (every box invisible):

```
HELD | WO-3.25 has an **Acceptance** heading and no boxes under it — plans\work-orders\phase-3-gradebook.md:1972
NOTE | nothing was written — not the status line above, not a roadmap box, not either dashboard.
NOTE | a list that parses empty is not a list that is satisfied. …
EXIT=1
```

`wo.acceptance === null` is untouched and keeps its existing NOTE. On `git status --short`: every
probe ran in `TMP`, and this tree shows only the three files this work order edits — the same list
before and after.

### 5. The plant is CRLF in its own bytes, and reverting the `:189` fix reddens it by name

**Met.** The plant writes `readSb(p).split(/\r?\n/).join('\r\n')` and then **re-reads the file as
`latin1` and counts**: it fails itself with *"the … fixture is not CRLF in its own bytes — N of M
newlines carry a \r, so this plant proves nothing"* unless every `\n` is preceded by `\r`. It counts
again after the held tick, so a writer that normalised on the way out is caught too.

Mutation, driven with `--against` over a copy in `TMP` (the file in this tree was never edited):

- **split reverted to `'\n'`** → `18 plants, 17 caught, 1 missed`, `FAIL | 1 of 18 plants were not
  caught`, naming this plant and three reasons: *"--tick read a CRLF work order's Acceptance list as
  empty"*, *"the run did not name the open line of a CRLF file"*, *"a held tick on a CRLF file left
  the status at 🤖 CLAIMED — 2026-01-01, not 🔨 IN PROGRESS"*. **No other plant moved.**
- **the empty-list refusal deleted instead** → the same plant red on its *other* half: `--tick`
  exited 0, printed *"all 0 Acceptance lines are ticked"*, and wrote `ROADMAP.md`, the phase file and
  the dashboard. No other plant moved.

Both mutations are now rows in `tools/README.md`'s mutation table, with the second one's point
written down: the empty-list half stays **green** under the split mutation, because a CRLF file
parses empty either way and the refusal then fires for the wrong reason — which is why the plant
carries a CRLF file *with* a real list as well.

### 6. Unmutated tree: `--self-check`, `--audit`, `wo-sweep.mjs`

**Met.**

- `node tools/wo-gate.mjs --self-check` → `PASS | 18 of 18 plants were caught`, exit 0.
- `node tools/wo-gate.mjs --audit` → `PASS | every fragment matches exactly one roadmap box …`, exit 0.
- `node tools/wo-sweep.mjs` → `22 checks · 20 passed · 0 failed · 2 to review`, exit 0 — unchanged
  from WO-2.48's recorded run, the two standing REVIEWs naming exactly what they named before
  (sensitive field names outside `src/backup.js`; due-date and late/missing on the same line).
- `tools/README.md` moved to **eighteen** in the one place it states the *current* figure, copied out
  of the run and not added up. The readings further down that file are dated runs against older
  copies of the script and stay at the number that was true then — that file says so itself, and I
  left them.

Also run, though the brief only asked for the two: `node tools/verify-shell.mjs` →
`926 checks · 926 passed · 0 failed · 0 skipped`, `24,754 lines · 26.7 lines per check · 295s`,
**exit 0**. I waited for it to exit and read the summary; it touches nothing this work order changed.

### 7. `git diff --stat -- src/` is empty

**Met.** Empty output. Nothing in this work order reads or writes `src/`.

---

## The audit of every end-of-line-anchored parse in `tools/wo-gate.mjs`

The brief asked for this by name. Every regex in the file with a `$`, or with a `.`-class that runs
to the end of a line, and what I concluded about each:

| Parse | Verdict |
|---|---|
| `/^##\s+(WO-…)\s+—\s+(.+?)\s*$/` — the heading | **Unaffected.** `\s*` absorbs the `\r`. Adjudicated in the row; not touched. |
| `/^---\s*$/` — the block boundary | **Unaffected**, same reason. Not touched. |
| `/^\*\*Acceptance\*\*/`, `/^\*\*[A-Z]/`, `/^##\s+WO-/`, `/^\*\*(?:Closes\|Amends) roadmap\*\*/` | **Unaffected** — no anchor at all. The last one is the strays loop, and I measured it against a CRLF file through the *pre-fix* script: it saw the stray. |
| `/^\s*-\s*\[([ x])\]\s*(.+)$/` — `checkboxesOf()` and `acceptanceOf()`, both copies | **Was blind on CRLF.** Fixed by the split, not by editing the regex — the row's stated preference, and the reason the next one added is fixed too. |
| `fieldRe()`: `\*\*Name\*\*\s*(.*?)(?=\s*·?\s*\*\*(?:…)\b\|$)` | **Was blind on CRLF**, for any field whose value wraps across lines — the joined paragraph carries a `\r` at each wrap and `(.*?)` cannot cross it. This is the parse behind the false *"no **Closes roadmap** line"*. Fixed by the same split. |
| `field(/\*\*Status\*\*\s*([^·]*)/)`, and the `Ship` / `Size` twins | **Unaffected**: `[^·]` matches `\r`, and the value is `.trim()`ed. This is why the status parsed on a CRLF file and the failure was silent. |
| `statusEdit()`: `/(\*\*Status\*\*\s*)([^·]*?)(\s*(?:·\|$))/` | **Unaffected.** `\s*` takes the `\r` and `$` closes. Verified end to end: a live `--tick` on the CRLF copy rewrote the status and left the file `2118/2118` CRLF. |
| `norm()`'s `/[.;,:]+$/` | **Unaffected** — it runs after `\s+`→`' '` and `trim()`. |
| `roadmapHits()` / `roadmapBoxCounts()` / `markedBoxes()` / `BOX_MARK` | **Unaffected** — no end anchors; they read `ROADMAP.md`, which this repository keeps LF. |
| `roadmapDashboardRows()`: `/^\s*(\d+)\s*$/` on `cells[1]` | **Theoretically reachable, and left alone.** It anchors a cell, and a `\r` only ever lands in the *last* cell of a line; the numeric cell is never last. Its input is `ROADMAP.md`, not a phase file. |
| `FILES_HEADING = /^##\s+The files\s*$/` | **Unaffected** — `\s*`. |
| `/^WO-1\.(\d+)$/`, `/^nothing$/i` | **Unaffected** — they test an ID and a trimmed field, not a line. |
| `--start`'s success message: `.replace(/\s*·.*$/, '')` | **Found, cosmetic, left — and named here so it is not re-found as new.** On a CRLF phase file this replace matches nothing (`.` cannot reach past the trailing `\r` to `$`), so `--start`'s `PASS` line would echo the rest of the header line instead of just the new status. No decision rides on it, nothing is written differently, and hardening one regex at a time is what the row explicitly prefers not to do. If it is wanted, it is a one-line change and belongs to its own row. |

**The splits I deliberately did NOT change** (`applyStart`, `applyRelease`, `applyTick`,
`recomputeDashboard`, `roadmapEdits`, `shipOneOrder`, `fileRowProblems`, and the plant helpers): they
all split on `'\n'` and **join on `'\n'`**, so each line keeps its own terminator and a CRLF file is
written back CRLF. Changing them to `/\r?\n/` would silently normalise every file the tool writes,
which is the Out-of-scope line. The line indices still agree with `parseFile()`'s, because both
splits yield the same number of elements on a file with consistent terminators.

Out of scope and left alone as instructed: `wo-sweep.mjs` and `verify-shell.mjs` parsers — not
measured, not touched. No `.gitattributes`, no normalisation pass, no write-side rewrite.

---

## Decisions the work order did not settle

1. **Where the refusal lives.** It runs before the re-homed-pointer refusal and before the open-lines
   one, because it is prior to both: it says *this script could not read the list at all*. With an
   empty list the pointer walk can never fire anyway, so the ordering costs nothing and reads in the
   right order. It writes nothing — not even `🔨 IN PROGRESS` — which is WO-2.15's rule for "the
   tracker is wrong about itself".
2. **The plant is two halves, not one.** The row says the plant asserts *the refusal*. A refusal-only
   plant stays **green** with the split reverted — I measured it — because a CRLF file parses empty
   either way. So the plant also drives a CRLF file with a real, open list and asserts the decision
   (`HELD`, 🔨, the line named), which is the half that reddens when `:189` goes. Neither half
   asserts a count. Both halves are mutation-proved above and written into the mutation table.
3. **De-ordinalising "not an eighteenth plant".** Three sentences (two in `tools/README.md`, one in
   `wo-gate.mjs`) said the guard precondition and the sweep check are "not an **eighteenth** plant".
   With eighteen plants that sentence is confusing rather than wrong-in-substance, so it now reads
   "not a plant" / "not a plant at all", with a parenthetical saying it used to carry the ordinal and
   why the ordinal rots. WO-2.44's acceptance and every dated reading further down `tools/README.md`
   keep their seventeens — that file already states that dated counts stay at the number that was
   true then.
4. **The mutation table gained two rows** and its "Five mutations" line became "Seven". The
   measurements the Acceptance demanded would otherwise live only in this report, which is the thing
   this project keeps saying rots. The guard row stays sixth, so the paragraph under the table that
   points at "the sixth row" is still true.
5. **The source comment above `selfCheck()` carries the same "NOT covered" sentence as the printed
   note**, and says *"printed by the run"*. I updated that one clause too, so the comment does not
   describe output the run no longer produces. The brief's "at that sentence and nowhere else" I read
   as *do not rewrite the note*; the note itself is unchanged except at the sentence that stopped
   being true.

## Temptations declined

- **Making `--audit` or `gate()` report an empty Acceptance list.** Both would have been easy and
  both are a widening: the row asks for `--tick` to refuse. It is a real gap — a work order whose
  list parses empty is invisible until someone ticks it — and it is a candidate row of its own.
- **Fixing `--start`'s cosmetic `$` replace** (table above).
- **`plans/work-orders/README.md:1000` and `:1002` point at `wo-gate.mjs:544` and `:1675`, and both
  pointers were already stale at `HEAD`** — `:544` lands on a `🚫 STRUCK` message and `:1675` on
  `selfCheck()`'s first line, where the prose means `shipOneOrder()` and the running-order plant. My
  edits moved them further, but they were not right before them. Left alone; noted for whoever wants
  a row about line-number pointers into moving files.
- **Anything that converts line endings**, in either direction, anywhere.

## Not verified

- **Nothing here needs an iPad or human eyes, and no 👤 line was ticked** — this work order has none.
  Everything ticked is quoted above from a run I read.
- The seven Acceptance boxes are ticked; `--tick WO-2.49 --dry-run` reads `all 7 Acceptance lines are
  ticked` and previews `✅ DONE` plus the Phase 2 row `46 → 47` and the overall `98 → 99`. The live
  `--tick` is the orchestrator's and I did not run one.

## Changelog draft (not written — the teacher decides what a change means)

> **`wo-gate.mjs` reads a work order whose lines end in `\r\n`.** A dispatch that rewrites a tracker
> from LF to CRLF used to make every checkbox in it invisible — JavaScript's `.` may not match a
> carriage return, so `(.+)$` could not reach the end of a line that ended in one. `--tick WO-3.25`
> reported *"all 0 Acceptance lines are ticked"* over ten boxes and *"no **Closes roadmap** line"*
> over a work order that has one, and was one keystroke from writing ✅ DONE over an open list; the
> only thing that stopped it was a human reading the diffstat. Fixed at the one place that decides
> what a line is, so every parse downstream is fixed at once — and the writers still join on `'\n'`,
> so a file keeps the terminators it arrived with. Nothing here converts anything. An `**Acceptance**`
> heading whose list parses **empty** is now a refusal that names the file and writes nothing, because
> "all 0 lines are ticked" is true in exactly the way that makes it dangerous. The eighteenth
> `--self-check` plant writes `\r\n` in its own bytes and asserts them — a plant that writes LF could
> never fail this — and the run's closing note now says the Acceptance parser is covered for **one
> fault** and not generally.
