# WO-1.21 — the tracker has no word for work that is not coming · result

**Dispatch** `2026-08-16-cont` (continuation; the first implementer died mid-run on an API session
limit and left an unverified draft on disk)
**Status on return** all 8 Acceptance lines ticked · `--audit` PASS · `--self-check` 17/17 PASS ·
`wo-sweep` 20 · 18 passed · 0 failed · 2 to review · `verify-shell` 795 · 795 passed · 0 failed ·
0 skipped · nothing committed

---

## 1. What I kept versus what I rewrote

This section is the required continuation audit. The draft was six modified files, 484 insertions.
I read every hunk of it against the brief before touching anything, and I did not stash, check out,
or otherwise discard any of it.

### Kept whole — audited, checked against the brief, not rewritten

| Draft work | Verdict |
|---|---|
| **Two statuses `🚫 STRUCK` / `⏳ DEFERRED` in `STATUSES`**, with the `notComing()` helper, `STRUCK`/`DEFERRED` constants and `BOX_MARK` | Correct and inside the Traps. The pair-helper is used only where the two genuinely behave alike; every place they differ names them separately, which is what keeps the distinction alive. |
| **`gate()` refusals** for both, and the dependency branch that says a not-coming dependency *"will never be ✅ DONE"* | Verified live: `node tools/wo-gate.mjs WO-3.13` and `WO-2.7` both exit 1 with different text. |
| **`--start` / `--tick` / `--release` refusals** and their extra explanatory lines | Verified by plant 13, which passes. |
| **`recomputeDashboard()` fourth column** — the not-coming work orders leave the denominator and are *named by the same parse* in the cell beside the count | This is the direct answer to the "a number that goes up because something was hidden" Trap, and it is a better answer than a hand note. Kept exactly. |
| **`roadmapBoxCounts()` marker handling** and `markedBoxes()` | Correct; a marked box leaves numerator and denominator both. |
| **`notComingProblems()`** — the both-directions check | Kept. The reverse direction (a marked box with no not-coming work order behind it) is the half that stops the glyph becoming a way to shrink the roadmap quietly. |
| **`fileRowProblems()`** and the `FILES_HEADING` / `FILES_ROW` constants | **The checker was never broken** — see § 2. Kept unchanged. |
| **`--audit` output sections and the PASS sentence**, `--help` text, the "Two statuses this NEVER writes" block | Kept. |
| **Self-check step 2c** (keeping the fixture's § The files row honest) and `markFixtureBox()` | Kept; both are correct and both are load-bearing for the new plants. |
| **Three of the four new plants** (refusals, denominator, `--audit` holding the two halves) | Kept; all three already passed. |
| **`ROADMAP.md`** — vocabulary line, the two note paragraphs, Phase 2 row `15/15 · ⏳ 1 deferred`, overall `42/81`, the `⏳` on the Roll Call! importer box and its expanded note | Kept. Arithmetic independently re-derived — see § 3, line 2. |
| **`plans/work-orders/README.md`** — vocabulary section, the § The files note, all nine corrected rows, the fourth dashboard column and its note | Kept. All counts independently re-derived. |
| **`phase-2-attendance.md` WO-2.7 note** and **`phase-3-gradebook.md` WO-3.13 note** | Kept, one clause corrected — see below. |

### Rewritten or added by me

1. **The failing plant's mutation** (`tools/wo-gate.mjs`) — rewritten. § 2 has the diagnosis.
2. **The `--self-check` closing summary prose** — it enumerated only WO-2.14/2.15/3.11's plants while
   reporting 17. Now names WO-1.21's four. A self-check that miscounts its own coverage is the same
   defect family this work order exists for.
3. **The one clause in the WO-3.13 note** that said `🚫 STRUCK` *"takes it out of that denominator and
   off `next`."* The second half was not true: `next` walks the running-order table, and WO-3.13 was
   pulled from that table on 2026-08-15 — the status does not do it. Narrowed to say the gate now
   refuses it where it used to clear, and that it was already off `next`.
4. **The design argument, in the work order itself** — added. See § 4; the draft had it in
   `wo-gate.mjs`, `README.md` and `ROADMAP.md` but not in WO-1.21, and the first Deliverable says
   *"argue it in the work order."*
5. **Deliverable 7** (`CLAUDE.md`) — untouched by the draft, written by me.
6. **Deliverable 8** (the WO-2.32 👤 line and its note) — untouched by the draft, written by me.
7. **`tools/README.md`** — two claims this work order made false. See § 5.
8. **The eight Acceptance boxes** — ticked, with evidence per line in § 3.

**Nothing in the draft was out of scope.** I checked specifically: the running-order tables in
`plans/work-orders/README.md` carry no diff hunk (`git diff … | grep -E "^[-+]\| *[0-9]+ *\|"`
returns nothing), `next` still answers `WO-3.24`, no new tool was added, and neither owner decision is
re-argued anywhere — both notes restate the owner's reasoning and neither questions it.

---

## 2. The failing plant: the checker was fine, the plant never planted

`--self-check` was reporting `17 plants, 16 caught, 1 missed` on
`§ The files is checked against the files it names`, with:

```
--audit exited 0 on a § The files row naming work orders its file does not hold
--audit did not name the stale row or the file it is wrong about
```

The brief's reading was *"the `--audit` check it is supposed to trip either does not exist or does not
fire."* **It exists and it fires.** I proved that before changing anything, on an isolated copy of
`plans/` in the scratch directory (never the working tree):

- clean copy → `--audit` exit 0, and all ten § The files rows print `ok`;
- Phase 3 row hand-edited to `WO-3.1 … WO-3.9` → exit **1**, and
  `BAD  § The files says phase-3-gradebook.md holds "WO-3.1 … WO-3.9" (README.md:180) and it holds WO-3.1 … WO-3.24 — 24 of them`;
- Phase 3 row deleted → exit **1**, and
  `BAD  phase-3-gradebook.md holds work orders and § The files has no row for it`.

The defect was in the plant. Self-check step **2c** rewrites the fixture file's § The files row to end
at the fixture — `WO-3.1 … WO-9.8` — so that the fixture is not itself reported as rot. The plant then
tried to make it stale with `.replace(/WO-3\.\d+\s*…\s*WO-3\.\d+/, 'WO-3.1 … WO-3.9')`, which matches
`WO-3.1 … WO-3.24` in the repository but matches **nothing** in the sandbox after 2c. The replace was a
silent no-op, the "stale" row was still the true one, `--audit` correctly passed on it, and the plant
reported the checker as missing.

**This is not the plant being deleted to go green** — the plant is still there, still asserts both
directions, and now actually plants. The fix:

- the stale claim is written **by cell index**, the same idiom step 2c uses, so it cannot depend on
  what the ids in the row happen to look like;
- `rowRe` and the expected `--audit` message are built from `FIXTURE_FILE` rather than a second
  hard-coded copy of the filename;
- **a guard**: if the rewritten line equals the line it replaced, the plant fails *itself* with
  `the stale-row plant changed nothing — the row already reads "…"`. That is the general lesson, and
  it is written into the comment above it: a plant that quietly plants nothing accuses the wrong file.

After the fix: `17 plants, 17 caught, 0 missed`, `PASS | 17 of 17 plants were caught`, exit 0.

---

## 3. Against the 8 Acceptance lines, one by one

**1. `--list` reports both as something other than `⬜ NOT STARTED`, and differently from each other — MET.**
`node tools/wo-gate.mjs --list` prints `WO-2.7   ⏳ DEFERRED   Roll Call! importer` and
`WO-3.13  🚫 STRUCK   paste a column of scores`. Draft work, verified by me. The gate reports also
differ in substance, not just glyph: WO-3.13's refusal says the owner decided it should not be built,
WO-2.7's says *"not now rather than not ever."*

**2. No dashboard counts either as outstanding, and each file shows a reader that they exist and why — MET.**
I did not take the draft's numbers on trust. An independent count over the phase files (parsing
`## WO-…` headings and their status lines with my own script, not `wo-gate.mjs`) gives
Phase 1 21/19, Phase 2 32/29 (⏳ WO-2.7 out), Phase 3 23/21 (🚫 WO-3.13 out), 4→5/0, 5→4/0, 6→4/0,
7→3/0, 8→10/4, Gates 4/1 — **total 106, done 74, out 2, 70%**, which is exactly what
`plans/work-orders/README.md`'s dashboard reads. `--audit` reports `Phase 2  row 15/15  boxes 15/15
(+1 not coming, uncounted)` and `overall row 42/81   rows sum 42/81` for `ROADMAP.md`.
*Shown to a reader:* the README dashboard has a **Not coming** column naming `⏳ WO-2.7` and
`🚫 WO-3.13` in the rows they left — generated by `recomputeDashboard()` out of the same parse as the
numbers, so it cannot rot — under a note that links both work orders and says where they went and why.
`ROADMAP.md` keeps the Roll Call! importer box in place, unticked, wearing `⏳`, with an expanded
in-box note, under a dashboard note titled *"One box is marked and uncounted, and this is where it
went."* Nothing was deleted or hidden.

**3. `--audit` passes — MET.** `node tools/wo-gate.mjs --audit` exits 0:
*"PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box,
every uncounted box has a struck or deferred work order behind it, § The files names what its files
hold, and every dashboard row matches its own boxes."*

**4. `--self-check` passes and plants a violation involving the new status — MET.**
`node tools/wo-gate.mjs --self-check` → `17 plants, 17 caught, 0 missed`, `PASS`, exit 0. Three of the
four added plants involve the new statuses directly: the refusals across `--start`/`--tick`/`--release`
plus the dead-end dependency in the gate; the denominator drop with the work order named in the cell it
left; and `--audit` holding the box against the status behind it, including the case that matters most
here — a `⏳ DEFERRED` work order whose box is marked `🚫`, which is the only check in the repository
that can tell a *when* from a *whether*.

**5. `wo-sweep.mjs` totals unchanged — MET.**
`node tools/wo-sweep.mjs` → **20 checks · 18 passed · 0 failed · 2 to review**, exit 0. Identical to
the totals WO-2.32 recorded. The two REVIEWs are the standing pair (sensitive field names outside
`src/backup.js`; due-date and late/missing on the same line). No file under `src/` was touched, and the
sweep says so itself: *"no new CSS selectors — 0 added line(s) in tracked src/\*.css."*

*Also run, though this work order ships no app code:* `node tools/verify-shell.mjs` →
**795 checks · 795 passed · 0 failed · 0 skipped**, 21,302 lines, 264s, exit 0. I waited for the exit
and read the summary; this is a result, not a prediction. It **ran in this sandboxed agent**, which is
the same evidence the Deliverable-7 fold-in rests on. It closes no box and I have ticked none on its
account — it is a no-change confirmation.

**6. Every row in `README.md` § The files matches its file, checked against the tracker — MET.**
`--audit` prints all ten rows `ok`, each with the id range and the count it read out of the file
(`phase-1-shell-store-roster.md  WO-1.1 … WO-1.21   21 work order(s)`, and so on). This is now
trustworthy in a way it was not at the start of this dispatch: the plant that guards it actually
plants, and both failure directions were reproduced by hand on an isolated copy (§ 2). The two rows the
draft corrected — Phase 1 to `WO-1.21`, Phase 8 to `WO-8.10` — are correct against the files.
I confirmed the `…` convention holds: `WO-2.1 … WO-2.34` over 33 work orders, because WO-2.2 is absent
(merged into WO-2.1 on 2026-08-06) — `grep "^## WO-2\."` returns 33 headings and no WO-2.2.

**7. `CLAUDE.md` and `AGENTS.md` agree about the harness in the sandbox — MET.**
`CLAUDE.md:167` now reads **"usually cannot run in a sandboxed agent"**, matching `AGENTS.md:65`'s
*"which a sandboxed agent usually cannot do."* One word narrowed, and one clause says what changed and
why: *"(Narrowed from a flat 'cannot' that day, WO-1.21, so this file and `AGENTS.md` say one thing: a
rule that calls a true report impossible teaches its reader to disbelieve one.)"*
**The standing rule did not move and was strengthened against exactly the inversion the Trap names.**
The paragraph still opens *"A green harness closes no 👤 item,"* still says a "could not run" is an
environment report that gets re-run locally before any box is ticked, and now adds the case that used
to be impossible and therefore unaddressed: *"When it does run there — it did, twice, on 2026-08-16 —
that is a green run and not a tick, and the first sentence still governs."* `AGENTS.md` was already
correct and I did not edit it. `CLAUDE.md:133`'s unrelated `⬜ NOT STARTED` for WO-8.5 is still true.

**8. The 👤 line no longer sends a tester to `planbook-shell-v69`, otherwise word for word — MET,
with the line still unticked.**
The line is `plans/work-orders/phase-2-attendance.md:3222` (the work order's `:3214` predates text
added above it; I verified the number before editing and noted the drift under the Acceptance list).
Only the target phrase changed:

- was `👤 On the teaching iPad, on \`planbook-shell-v69\`: a pass crossing both thresholds …`
- now `👤 On the teaching iPad, on the shell \`sw.js\` currently names — \`planbook-shell-v71\` as this
  line is written, and a reading to confirm rather than a version to match: a pass crossing both
  thresholds …`

Everything from *"a pass crossing both thresholds"* to the closing 👤 is byte-identical apart from
line-wrapping, which the longer target forced. It still refuses to ask whether a tone is audible, and
the paragraph explaining why that is deliberate is untouched. **It is still `- [ ]`** — I did not tick
it and could not: it needs a real iPad and I do not have one. `--tick WO-2.32 --dry-run` reports
`1 of 6 Acceptance lines are still [ ]` before and after my edit, at the same line number, so the
repoint disturbed neither the parse nor the count.
*Every ticked 👤 line still names the shell it was actually run against:* I swept the repository
(excluding `.claude/dispatch/`, which is history) for checkbox items containing both 👤 and a
`planbook-shell-vNN`. Five ticked ones exist — `TESTING.md:3828` (v35), `:4161` (v40), `:4947` (v51),
`:5096` (v52), and `phase-2-attendance.md:2955` (v60) — and none is in my diff; `TESTING.md` is not a
modified file at all. Two unticked ones remain: `phase-2-attendance.md:3222`, now on v71, and
`phase-1-shell-store-roster.md:1508`, which is WO-1.21's own Acceptance line quoting the defect and
must stay as it is.

---

## 4. The design decision, and where its argument now lives

The first implementer's call — **two statuses, `🚫 STRUCK — <date>` and `⏳ DEFERRED — <date>`** — is
right and I did not disturb it. Its reasoning was written into `tools/wo-gate.mjs` above `STATUSES`,
and into the status-vocabulary sections of `ROADMAP.md` and `plans/work-orders/README.md`. It was
**not** in WO-1.21 itself, and the first Deliverable says *"argue it in the work order and pick one."*
A convention every future tracker row copies should not live only in a dispatch report — least of all
one that was never written.

I added **"What was picked, and the two shapes that were not"** to WO-1.21 immediately above
**Deliverables**, arguing the two rejected alternatives the Deliverable named:

- **a status plus a field** — rejected because it leaves the status line saying the one thing that is
  false, and a refusal that fires only when a second field is remembered is a refusal that stops
  firing; the defect here *is* the status line;
- **an explicitly uncounted section** — rejected on the work order's own Trap (a reader who cannot
  find where they went assumes they were lost), plus every inbound link breaking and both work orders'
  reasoning leaving the phase file where a reader will actually meet it;
- **two rather than one collapsed status** — the *Why it exists* constraint, restated as the reason;
- **the cost, accepted** — two more entries in a vocabulary of six and two more branches wherever a
  status is read, bought cheaply because `STATUSES` is a `startsWith` list and the `— <date>` suffix
  shape already existed, and guarded by four new `--self-check` plants.

Adding this did not disturb the Acceptance parse: `--tick WO-1.21 --dry-run` reads all 8 lines.

---

## 5. The two judgment calls in Deliverable 8, and one I made outside it

**(a) `phase-2-attendance.md:3208` — `sw.js` — `planbook-shell-v69`. Left exactly as it is.**
It sits under **Deliverables**, which is the list of what WO-2.32 *shipped*. It instructs nobody: it is
the record that this work order's commit bumped the cache to v69, and v69 is what it bumped it to.
v71 came later, from WO-3.23. Rewriting it to v71 would claim WO-2.32 delivered a bump it did not, and
that is the ticked-👤-line failure mode wearing different clothes — falsifying a record rather than
fixing a pointer. The distinction is now written down at the point of departure, in the note I added
under the Acceptance list, so the next reader does not have to re-derive it.

**(b) How to word it so it does not rot.** The line now names *the shell `sw.js` currently names*, with
`planbook-shell-v71` given as a reading to confirm rather than a version to match. At the next `CACHE`
bump that dates the parenthetical instead of breaking the instruction, and a tester who checks the
version against `sw.js` gets the right answer without anyone editing this file. I stated the rule
explicitly in the note rather than leaving it implicit in the phrasing: **an unticked 👤 line names the
live shell and carries the version as a reading; a ticked one names the shell it was run against and is
never edited.**

**(c) Outside the Deliverables, and my call: `tools/README.md`.** Two of its claims about
`wo-gate.mjs` were made false *by this work order* — it said `--self-check` *"plants thirteen
violations"* (now seventeen) and its `--audit` description listed three checks where there are now
five. Leaving them would have created a fresh instance of exactly the defect WO-1.21 was booked for, in
the file that documents the tool being edited. I judged this in scope as a consequence of the change,
not an expansion of it: the **Out of scope** line forbids a *new tool*, not the tool's own
documentation, and `ROADMAP.md` maintenance step 5 makes this kind of follow-through the rule. The edit
is two facts, minimally: the count, with a dated parenthetical saying what the four additions were, and
a note that the numbers further down (*"seven of the nine go red"*, *"eleven of the thirteen"*) are
readings from dated runs against older copies of the script and stay at the number that was true then.
I did not touch those readings. If the verifier reads this as scope creep, it reverts cleanly on its own.

---

## 6. What I could not verify

- **Nothing on a real iPad.** WO-2.32's 👤 line is repointed and still unticked. Whether the tint fires
  at 5 and 10 minutes silently, and whether the header speaker reads OFF then ON across a relaunch on
  the teaching iPad, is untested by me and stays owed to the teacher. The repoint means that check can
  now be *attempted*; it does not mean it was run.
- **`verify-shell.mjs` measures nothing this work order built.** It is 795 green checks about app code
  I did not touch. It confirms no regression and it closes no box.
- **The two `wo-sweep` REVIEW items** are the standing pair and are a human read, not a verdict. I did
  not re-read all 297 sensitive-field mentions; nothing in this work order went near `src/`.
- **`--self-check --against` was not used** to prove the four new plants can fail against an older copy
  of the script, the way WO-3.11's were. The three I inherited pass and the fourth I proved by hand
  (§ 2 — I reproduced both `--audit` failure directions on an isolated copy, which is the same evidence
  in a narrower form). A proper `--against` run over `git show 1a6a614:tools/wo-gate.mjs` would be
  stronger and I did not do it; naming it here rather than implying it was covered.

## 7. Left undone, deliberately

- **`CHANGELOG.md`** — not written, by rule. A draft is in § 9 for the teacher to take or discard.
- **`--tick WO-1.21`** — not run. The status line still reads `🤖 CLAIMED — 2026-08-16-cont`.
  `--tick WO-1.21 --dry-run` is clean (*"all 8 Acceptance lines are ticked — nothing holds WO-1.21
  open"*; it would write `✅ DONE — 2026-08-16` and move the README dashboard to 106/75, 71%). Closing
  it is the orchestrator's step after the verifier, not mine.
- **Nothing committed or pushed.** The brief did not ask for it. Diffstat checked for the CRLF hazard:
  564 insertions / 59 deletions across 8 files, proportionate to the edit; all eight files are
  uniformly CRLF with no mixing (line count equals CR-line count in each), and `core.autocrlf` is
  `false`, so nothing was silently re-encoded.

## 8. Files changed

- `C:\dev\planbook\tools\wo-gate.mjs` — draft's two statuses and their machinery, kept; the § The files
  plant's mutation rewritten so it actually plants, with a self-guard; the `--self-check` coverage
  summary corrected to name WO-1.21's four.
- `C:\dev\planbook\CLAUDE.md` — Deliverable 7. `cannot` → `usually cannot`, one clause saying what
  changed and why, and the green-run case stated so the standing rule cannot be read backwards.
- `C:\dev\planbook\tools\README.md` — plant count 13 → 17; `--audit`'s description gains the two new
  checks.
- `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — WO-1.21's design argument added;
  all 8 Acceptance lines ticked; a note that the 👤 line has moved to `:3222`.
- `C:\dev\planbook\plans\work-orders\phase-2-attendance.md` — draft's WO-2.7 `⏳ DEFERRED` status and
  note, kept; Deliverable 8's repointed 👤 line and the note under it, added.
- `C:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — draft's WO-3.13 `🚫 STRUCK` status and
  note, kept; one inaccurate clause about `next` corrected.
- `C:\dev\planbook\plans\work-orders\README.md` — draft's work, kept unchanged, counts independently
  re-derived.
- `C:\dev\planbook\plans\ROADMAP.md` — draft's work, kept unchanged, counts independently re-derived.

Untracked and not mine to remove: `.claude/dispatch/WO-1.21-brief.md`,
`.claude/dispatch/WO-1.21-status.md` (its own first line says to delete it once this file exists).

## 9. Changelog draft — the teacher decides what goes in

> **The tracker learned to say "this is not coming."** `wo-gate.mjs` knew four positions on a road
> that ends at `✅ DONE` and had no word for a road that stops, so WO-3.13 (struck) and WO-2.7
> (deferred) sat in `⬜ NOT STARTED` — the one status actively false about them. Nothing was blocked,
> which is why it went a week unnoticed; the damage was arithmetic, and a completion percentage with a
> floor below 100% teaches everyone to stop reading it. Two statuses now, not one: `🚫 STRUCK` is a
> *whether* and `⏳ DEFERRED` is a *when*, and collapsing them would have thrown away the only fact
> either work order will be asked for later. Both leave the dashboards' denominators and neither
> leaves its file — the work order that left is **named by the same parse that produced the number**,
> in the row it left, because a count that rose because something was hidden is worse than the count it
> replaced. `--audit` holds every uncounted roadmap box against the status behind it in both
> directions, and four new `--self-check` plants guard the lot.
>
> Three smaller self-descriptions corrected in the same pass. `README.md` § The files is now *checked*
> against the files it names rather than maintained by hand in nine rows that rot every time a phase
> gains a work order. `CLAUDE.md` no longer says flatly that `verify-shell.mjs` **cannot** run in a
> sandboxed agent — it usually cannot, which is what `AGENTS.md` always said, and a rule that calls a
> true report impossible teaches its reader to disbelieve one; a dispatch's green run still closes no
> box, and that sentence is now harder to misread rather than softer. And WO-2.32's open 👤 line was
> sending a tester to `planbook-shell-v69`, a shell nobody can be running; it now names the shell
> `sw.js` currently names, with the version as a reading to confirm rather than a target to match, so
> the next `CACHE` bump dates the note instead of breaking the instruction. The line is still unticked
> — repointing a check is not running it.
