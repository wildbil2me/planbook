# WO-1.52 — a planning document can contradict the tracker and nothing looks · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.52-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, **Opus** (no model override): routed on its own merits. The Traps are about judgment rather than mechanics — telling a status claim in a live voice from a historical one in a genre whose value is being dated, choosing between the sweep's review channel and `--audit` and saying why at the line. Runner-up was Codex, because the Acceptance has a clean mechanical reproduction (`06bfa06` vs `a16b87c`); set aside because deciding what counts as *live* is the whole work order.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.52 — a planning document can contradict the tracker and nothing looks

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-24 · **Size** S · **Depends on** WO-1.31 ✅ · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.51 made.
Booked 2026-09-12 out of WO-1.31's verdict sitting, which found the instance and declined to widen a
work order that had already been verified.)*

**Why it exists.** [WO-1.31](#wo-131--a--gated-work-order-that-never-says-what-it-is-gated-on) made a
`🔒 GATED` status say what it waits for, and `--audit` reads every one of them directory-wide. **That
walk is over `plans/work-orders/*.md` and nothing else.** `plans/` holds hand-written HTML planning
documents — [`wo-3-18-video-runbook.html`](../wo-3-18-video-runbook.html),
[`wo-3-18-runbook.html`](../wo-3-18-runbook.html), `tools/data-viewer.html` beside them — and **every
one of them is free to state a work order's status, a dependency, or a blocker, and be wrong about it
forever.**

**There was a live instance on the day this was booked, and it is the reason for the row.** The video
runbook's band read `WO-3.18 🔒 GATED on WO-7.2 · S` five days after that lock came off; its
dependency strip had WO-7.2 as `⬜ not started · L` five days after it landed ✅; its **Blocker 1** —
*"there is no scope in use to film"* — was still drawn as a **stop** when `src/drive-sync.js` had been
uploading the year document since 2026-09-07; and its shot list called three shots *"the ones that do
not exist yet."* **Four false statements about the tracker, in a document about the very work order
whose lock had just expired for the same reason.** Repaired by hand in `a16b87c`. Nothing in the
repository could have reported any of them: `wo-sweep.mjs` walks `src/` and the trackers, `--audit`
reads only `plans/work-orders/`, and `.html` under `plans/` is in neither.

**This is the WO-1.40 shape for the sixth time** — a hand-typed claim in prose that nothing checks —
and the fifth was WO-1.31 itself. The difference worth naming: WO-1.40's pair and WO-1.41's pair are
each **two files checked against each other**, and this one is **many files checked against a tracker
that is already machine-readable**. `parseFile()` already knows every work order's real status; the
whole of the work is asking whether a sentence somewhere else disagrees with it.

**Traps**

- **A planning document is allowed to be historical, and that is the whole difficulty.** These files
  are dated drawings — *"drafted 2026-08-28"* — and much of their value is in recording what was true
  then. A check that flags every past-tense status claim reports the genre and not a defect.
  **Test for a contradicted claim in a live voice**: `WO-3.18 🔒 GATED` in a band that describes
  today's state is a finding; the same string inside a passage that says *"what this said until
  2026-09-12"* is the repair working. WO-1.40's § 21 already solved the shape of this — it excludes
  italic parentheticals and named passages, and **silence is the green state**. Lift that, do not
  re-derive it.
- **Do not widen `IGNORE_DIRS` and do not widen `--audit`'s walk.** Reach these files **by path**,
  the way § 21 reaches `.claude/commands/wo.md`. Widening either walk pulls in `design/mockups/`,
  every dispatch brief and every result file — hundreds of documents whose whole job is to record
  what was true when they were written, and the check drowns in its own genre problem on the first
  run.
- **The tracker is the reference half, always.** If a document and the tracker disagree, the document
  is wrong — never resolve it the other way, and never let the check "learn" a status from an HTML
  file. WO-1.41 made `CLAUDE.md` the reference half for exactly this reason.
- **`--audit` is probably the wrong home.** It is the tracker's own consistency report and it exits
  non-zero; a stale sentence in a drawing is a `REVIEW` for a person, not a `FAIL` that stops a
  dispatch. `wo-sweep.mjs`'s review channel is the likelier fit — but say which and why at the line,
  and if it goes in the sweep, § 22's recorded count moves with it.
- **It cannot see itself, and say so where a reader will find it.** WO-1.41's fence could not catch
  the first false statement made about WO-1.41's fence. A checker that reads `plans/*.html` is written
  in `tools/*.mjs` and will not read its own prose either.

**Acceptance**
- [ ] A status claim in a `plans/*.html` document that contradicts the work order's real status in
      `plans/work-orders/` is reported, naming the file, the line, the claim and the tracker's value.
- [ ] Proved against the pre-repair tree: the four false statements in
      `plans/wo-3-18-video-runbook.html` as of `06bfa06` are each reported, and the repaired file at
      `a16b87c` is clean. *(That is the reproduction this row has and WO-1.31 did not — use it.)*
- [ ] A historical claim in a dated or excluded passage is **not** reported, proved on the repaired
      runbook's own *"what this said until 2026-09-12"* block, which quotes a false status verbatim.
- [ ] The walk reaches these files by path; `IGNORE_DIRS` is unchanged and `--audit`'s directory walk
      is unchanged. A grep proves both.
- [ ] Whichever tool it lands in is green, its recorded check count matches the run, and every one of
      the 169 work orders' gate reports is byte-identical to the pre-change run.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/wo-3-18-video-runbook.html`
  - `src/drive-sync.js`
  - `tools/data-viewer.html`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-sweep.mjs` § 21 — the excuse engine (italic parentheticals, named/excluded passages,
  "silence is the green state", reaching `.claude/` files **by path**). The trap says *lift it, do not
  re-derive it*: reuse its helpers where they fit rather than writing a parallel excuser.
- `tools/wo-sweep.mjs` § 22, § 23, § 24, § 25 — § 22 is the census and must stay the **last**
  result-pushing section; §§ 23–25 each sit *above* it and say why. A new section does the same, and
  the count recorded in `tools/README.md` line 10 (currently "43-check") moves with it — that stale
  number is exactly what turned WO-3.26's sweep red.
- `tools/wo-gate.mjs` `parseFile()` (~line 394) — the tracker's real status. The tracker is the
  reference half; never learn a status from HTML.
- `plans/work-orders/README.md` § "The pipeline's own files" — if you add a watched file, the map may
  want a row.

**Traps the work order does not state, from this repo's scars:**

- **Capture the "169 gate reports byte-identical" baseline BEFORE you touch any tool.** Loop every
  work-order ID through `node tools/wo-gate.mjs <ID>` into a scratch dir (outside the repo — use your
  session scratchpad, never `tools/`; WO-3.26 left a scratch file in `tools/`). Re-run after and `diff`.
  Confirm the count really is 169 and say so if it is not. Note the rows' status of WO-1.52 itself will
  differ if you tick — take that into account and say how.
- **Reproduction without disturbing the tree:** read the pre-repair file with
  `git show 06bfa06:plans/wo-3-18-video-runbook.html` into scratch, and give the check a way to be
  pointed at an alternate file (or an exported function you can call from a scratch driver). Do **not**
  `git checkout` an old version over the working file — a checkout reverts unstaged edits, including
  your own. Note the tracker at `06bfa06` also differed; the claim is that the *old file* is flagged
  against *today's* tracker.
- **Scope of the walk:** Acceptance says `plans/*.html` (four files today: `return-brief.html`,
  `wo-3-18-runbook.html`, `wo-3-18-video-runbook.html`, `wo-7-1-runbook.html`). Why-it-exists also
  names `tools/data-viewer.html`; decide and say at the line. Run it over all of them on today's tree
  and report every finding — if the other runbooks carry live stale claims, **report them as findings,
  do not repair them** (that would widen the work order; propose a follow-up instead) — unless leaving
  them makes your chosen tool red, in which case say so plainly and stop to report rather than choose.
- **Mutation discipline** (`AGENTS.md`): mark any deliberate mutation with `MUTATION`, revert it before
  writing anything else, and `grep -rn MUTATION tools/ plans/` before you report.
- `verify-shell.mjs` is ~5 min; you touch no app file, so one clean run is enough. Report its EXIT line.
- **It cannot see itself** — say so where a reader will find it (trap 5), in the section's own comment
  and in `tools/README.md`.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 5 lines, reported against one by one

1. A status claim in a `plans/*.html` document that contradicts the work order's real status in `plans/work-orders/` is reported, naming the file, the line, the claim and the tracker's value.
2. Proved against the pre-repair tree: the four false statements in `plans/wo-3-18-video-runbook.html` as of `06bfa06` are each reported, and the repaired file at `a16b87c` is clean. *(That is the reproduction this row has and WO-1.31 did not — use it.)*
3. A historical claim in a dated or excluded passage is **not** reported, proved on the repaired runbook's own *"what this said until 2026-09-12"* block, which quotes a false status verbatim.
4. The walk reaches these files by path; `IGNORE_DIRS` is unchanged and `--audit`'s directory walk is unchanged. A grep proves both.
5. Whichever tool it lands in is green, its recorded check count matches the run, and every one of the 169 work orders' gate reports is byte-identical to the pre-change run.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

