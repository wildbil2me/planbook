# WO-1.18 — the harness section comment miscounts its own checks · implementation report

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-15
**Work order** `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.18
**Status left at** `🤖 CLAIMED` — I did not run `wo-gate.mjs --tick`; see *Decisions* below.

---

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\tools\verify-shell.mjs` | One word, line 1869: *"Seven checks"* → *"Eight checks"*. Nothing else — 1 insertion, 1 deletion. |
| `c:\dev\planbook\tools\README.md` | Deliverable 2, written down: two new paragraphs in § `verify-shell.mjs`, immediately after the WO-2.22 *"does not assert its own summary against this file, and that is a decision rather than an omission"* refusal, which is the same shape. |
| `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` | The three Acceptance lines ticked with their evidence. (The `⬜ NOT STARTED` → `🤖 CLAIMED` status line in this file was already there when I arrived — the orchestrator's `--start`, not mine.) |

`git diff --stat`: `3 files changed, 56 insertions(+), 7 deletions(-)`. No file was reflowed or
re-line-ended; `tools/verify-shell.mjs` shows `1 1` in `--numstat`.

---

## Against the Acceptance list, one by one

### 1. The comment at `tools/verify-shell.mjs:1860` matches the number of `check()` calls in its section, counted rather than assumed. — **met**

**The header has moved.** It is at `:1869` now, not `:1860`. `git show 87000a7f:tools/verify-shell.mjs`
(WO-1.15's own commit, the tree the drift was found on) has it at `:1860`; WO-1.17 (`3c6b8c5`) added a
block above it and pushed it nine lines. I fixed the comment where it actually is and left the work
order's `:1860` reference alone — `tools/README.md:968` sets the precedent for noting a drifted line
number rather than chasing it through two files that would then disagree.

**Counted, not assumed, and with the sweep's own predicate** (`commentLines()` + the `check(` pattern +
the definition excluded, lifted out of `tools/wo-sweep.mjs` §11 so the count is made the same way the
repository already counts):

- The block runs from the banner at `:1867` to the check named *"the WO-1.15 fixture is put back byte
  for byte, so the sections below inherit nothing"* at `:2123`, which is what terminates it. The next
  thing in the file is `:2130`'s *"The two entry points a teacher actually uses"*, which `git blame`
  dates to `71f6745`, 2026-08-04 — pre-WO-1.15, and not part of this section.
- **Eight call sites**: `:1991, 2004, 2018, 2029, 2040, 2070, 2101, 2123`.
- `git blame` puts all eight in `87000a7` — WO-1.15's own commit — which corroborates the *Why it
  exists* paragraph: the count was right when written and a check went in before the commit landed.

Traps honoured: no check deleted (the file went 781 call sites → 781), no neighbouring header
renumbered (the diff to the harness is one word).

### 2. `verify-shell.mjs` still runs green at its then-current total, and `tools/README.md`'s recorded call-site count still matches. — **met**

Both commands were run to completion on this machine and these are the lines they printed.

`node tools/verify-shell.mjs` (run to exit, 253 seconds, exit code **0**):

```
================ SUMMARY ================
778 checks · 778 passed · 0 failed · 0 skipped
20,570 lines · 26.4 lines per check · 253s
```

`node tools/wo-sweep.mjs` (exit code **0**), run twice — once before the README edit and once after
all edits, identical both times:

```
20 checks · 18 passed · 0 failed · 2 to review
PASS | the recorded `check()` call-site count matches the harness  :: 781 `check()` call site(s) in
       tools/verify-shell.mjs, matching tools/README.md:812 — call sites, not executed checks
PASS | one `check()` call per line in the harness  :: 781 call-site line(s) …
```

The two REVIEWs are the two standing ones (`sensitive field names outside src/backup.js`;
`due-date and late/missing on the same line`) — untouched, as the Out of scope line requires.

Neither number moved: 781 call sites is what `tools/README.md:812` already recorded, and 781 − 778 = 3
is exactly the gap that file names for this tree. I checked specifically that the new prose does not
introduce a second match of §11's anchor sentence (`holds (\d+) \`check()\` call sites`) — the sweep
still resolves it to one site, `tools/README.md:812`.

Also run, unprompted, because I edited a tracker file: `node tools/wo-gate.mjs --audit` → `PASS`,
exit 0, every dashboard row matching its own boxes.

### 3. The sweep question is answered in writing. — **met**

In `tools/README.md`, § `verify-shell.mjs`, the paragraph beginning *"Nor does the sweep check a
SECTION header's count against the checks underneath it, and that is WO-1.18's answer rather than its
omission."* **The answer is: do not build it**, and the argument is three measurements taken today
rather than an appeal to effort:

1. **Two subjects, one of which the check would get wrong.** `verify-shell.mjs` carries 49 banner
   lines and exactly two state a count. The second is WO-1.17's, which opens *"FOUR CHECKS AND A
   FIXTURE GUARD THAT NEVER FIRES ON A GREEN RUN"* over **five** call sites and is precisely right —
   so a call-site comparison would score the one header in the file most careful about its own
   arithmetic as the wrong one, and would have to be taught to read "four plus a guard" to avoid it.
2. **A section has no machine-readable end.** The WO-1.15 block is nested inside `backup & restore`,
   and the only thing terminating it is a check *named* "…so the sections below inherit nothing".
   Banner-to-banner — the sole boundary a grep has — that stretch contains **19** call sites against
   the **8** the header is about. The check's first act on the defect it was written for would be to
   demand *seven* become *nineteen*: a confident wrong answer, which is the failure shape
   `wo-sweep.mjs` §6's comment already names as the worst kind.
3. **41 decoys against 2 subjects.** 43 lines in the harness mention a number of checks; the two
   headers are two of them, and the rest are relative references (*"the two checks above"*), scars
   (*"cost four checks in the section below it"*) and quoted run summaries (*"766 checks · 764 passed
   · 2 failed"*). A pattern would have to be right about two sentences while staying silent about
   forty-one, and a check that cries wolf is off within a month — the sweep's header warns about that
   twice.

The near miss is recorded too: **a `REVIEW` rather than a `FAIL`**, which is the sweep's own answer to
"greppable evidence that needs a human decision". Refused for what it costs the channel — the two
standing REVIEWs are affordable to read and dismiss each run *because there are two of them*, and a
third permanent one over two comment lines spends that. And what stays uncovered is said out loud so
nobody over-trusts the paragraph: a miscounting section header remains something only a reader
catches. §11 goes on guarding the number that has actually rotted three times, which is the file total
and not a section's.

How it relates to WO-2.19 (which the brief asked me to read first, so the answer would not silently
duplicate or contradict it): WO-2.19 guards **one number, in one file, with one unambiguous
denominator** — every `check(` in `verify-shell.mjs` against one sentence in `tools/README.md`. The
section-level version has neither an unambiguous denominator (no section end) nor a single
convention for what its numerator counts (WO-1.17's header deliberately excludes a call site). It is
not the same check one level down; it is a different check wearing that one's clothes, which is
precisely why the work order was right to ask rather than to assume.

---

## What I could not verify

- **Nothing here needs an iPad or human eyes, and nothing here has a 👤 line.** WO-1.18 has none, and
  I ticked none. The change is a comment and two paragraphs of prose; it alters no rendered surface,
  no control, no stored data.
- **The prose itself is a judgment call I made and a human may overrule.** That the answer is *"not
  worth building"* is mine to argue and the teacher's to accept; the three measurements under it are
  facts and are reproducible from the commands quoted above.

## Left undone, deliberately

- **No `CHANGELOG.md` entry** — the teacher's call. Draft, if it is wanted:
  *"Fixed the check count in the harness's WO-1.15 section header (it said seven over eight), and
  recorded in `tools/README.md` why the sweep does not police section-header counts: only two of 49
  section banners state one, sections have no machine-readable end, and 41 other lines mention a
  number of checks."*
- **No commit, no push** — the brief did not ask for one.
- **No `TESTING.md` entry.** That file's convention is mutation tables for *added* checks; this work
  order adds none and changes no behaviour, so there is nothing there to record.
- **No `--tick`.** All three Acceptance boxes are ticked with their evidence, but I left `**Status**`
  at `🤖 CLAIMED` for the verifier and the orchestrator to close, per the pipeline. If you want the
  roadmap dashboard recomputed, `node tools/wo-gate.mjs --tick WO-1.18` is the step — it will write
  `✅ DONE` now that no box is open.

## Decisions the work order did not settle

1. **Where the Deliverable 2 answer lives.** The acceptance line allows *"the work order or
   `tools/README.md`"*. I put the full argument in **`tools/README.md`** and a compressed version in
   the ticked acceptance line, rather than the reverse. Reason: the reader who is about to re-propose
   this check is reading `tools/README.md` § `verify-shell.mjs`, not a closed Phase 1 work order — and
   that section already carries exactly this idiom one paragraph up, where WO-2.22 wrote down its
   refusal *"so the next reader who spots an unguarded number does not re-propose it."* I did not
   duplicate the argument into `wo-sweep.mjs` itself; a judgment not to build a check has no point of
   use in the file that would have held it, and editing the sweep to say what it does not do reads as
   scope the work order did not ask for.
2. **The stale `:1860` and the stale `637` in the work order's own prose.** *Why it exists* says the
   comment is at `:1860` (now `:1869`) and that the recorded call-site total is *"currently 637"* (now
   781). Both were true when the work order was written. I left both alone — rewriting the argument
   paragraphs of a work order while implementing it destroys the record of what was actually asked —
   and noted the line-number drift in the acceptance tick instead, where a reader following the
   pointer will meet it.

## Temptations declined, noted rather than acted on

- **Reflowing the WO-1.15 header so the eight checks are enumerated in it.** It would make the count
  self-evidencing and it is exactly the "reorganising the section" the Traps line forbids. If anyone
  wants it, it is a separate work order and it should cover all 49 banners or none.
- **Correcting the `else check(` line number at `tools/wo-sweep.mjs:595`** (`:10773`, now `:10941` —
  `tools/README.md:968` already says so and says why it is left). Not this work order's, and the
  README's own note argues against fixing it in one of the two files that carry it.
- **Adding the section-count check as a `REVIEW`.** Considered seriously enough to write down; see
  Acceptance 3.
