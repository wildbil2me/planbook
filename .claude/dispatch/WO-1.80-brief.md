# WO-1.80 — nothing stops a file count creeping back into the harness's prose · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.80-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is that this changes
`tools/wo-sweep.mjs`, a pipeline file, and its Traps are judgment rather than mechanics: how narrow an
anchor must be to spare the README's dated ledger without editing it, and how to word the
fence-not-a-reading banner. It also owes `TESTING.md` and `CHANGELOG.md` prose. The runner-up was
Codex (XS, mechanically checkable, the sweep runs in seconds), set aside on those grounds; ties go to
Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.80 — nothing stops a file count creeping back into the harness's prose

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-12 · **Size** XS · **Depends on** WO-1.79 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.79 made.)*

**Booked 2026-10-11**, owner-directed, out of WO-1.79's result file. A ride-along on
`tools/wo-sweep.mjs`: fold it into the next sitting that has that file open.

**Why it exists.** WO-1.79 took the file count out of two places: the header comment above the
section imports in `tools/verify-shell.mjs` (*"Seventy-five files …"*, now *"These files …"*) and the
sentence in `tools/README.md` that says the count spans the files under `tools/verify/` that the entry
file names (*"ninety-one"*, now no number). Both counts had gone stale, the README one within a day
of WO-1.77 updating it, because nothing checked either. Taking them out fixed today, and **nothing
stops the next sitting that adds a harness file from writing a count back in**. The sweep already
knows the true figure: § 11 derives `harnessFiles` from `STATIC_SECTIONS` and `BROWSER_SECTIONS` and
prints it on every run.

**Deliverables**
- **A sweep check that fails when a file count comes back in either place.** It reads the header
  comment in `tools/verify-shell.mjs` and the live sentence in `tools/README.md`, and refuses a number
  of files in them, whether written in digits or in words. WO-1.79 ruled that no number is better than
  a checked one, so the check holds that ruling. It does not allow a count that happens to match.
- **It must not stop matching without saying so.** If either anchor can no longer be found (the
  comment reworded, or the README sentence moved), the check fails and names the anchor. It must not
  read green over an empty match, which is the failure § 11 already guards against.
- **One plant per place**: write a count back into each one and show the sweep go red at that line.
  Then revert both plants before writing anything else.
- **`tools/README.md`** describes the new check where the sweep's other checks are described, and the
  sweep's own check count (§ 22's *"The verifier's N-check standing sweep"*) moves with it.
- **`TESTING.md` § WO-1.80** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `node tools/wo-sweep.mjs` has a check that passes on today's tree and names both places it read.
- [ ] A file count written back into the header comment of `tools/verify-shell.mjs`, in digits and
      in words, turns that check red at the line; so does one written back into the live sentence in
      `tools/README.md`. Both plants are reverted, and `TESTING.md` § WO-1.80 shows the red output.
- [ ] Rewording either anchor so that the check can no longer find it fails the check and names the
      anchor, and does not pass.
- [ ] The dated ledger entries further down `tools/README.md` (*"moves to seventy-five"*, *"the
      eighty-first file"* and the rest) do not trip it, and nothing was rewritten to make them pass.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.80 carries these lines verbatim with the evidence for each.

**Traps** — **The README's ledger is history, not a live count.** Each dated entry there was true on
the day it records, and WO-1.79 left them alone on purpose. A check that scans the whole README for
number words will fire on all of them. The fix for that is a narrower anchor, not edits to the
ledger. **A fence, not a reading**: it catches a count written as a number near "files", and a
sentence that states the size of the harness some other way will get past it. Say so in the check's
own banner. **This changes `tools/wo-sweep.mjs`, a pipeline file**: read
`plans/work-orders/README.md` § "The pipeline's own files" first. **Nothing in `src/` moves**, so no
`CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `plans/work-orders/README.md` § "The pipeline's own files" (line ~411): read it **before** editing
  the sweep, as the Traps say. If the map names `wo-sweep.mjs` sections, the new one may owe a mention.
- **Model sections to copy, not re-derive:** § 11 (`harnessFiles`, ~line 776, and its
  "loud when the anchor moves" rule) and § 22 (the census of results, which must stay the **last**
  section; read the banners of §§ 23, 25 and 26 for why new sections sit above it). Put the new check
  above § 22 for the same reason, and give it its own § number. Do not renumber anything.
- **The two anchors as they stand today:**
  - `tools/verify-shell.mjs` ~line 80: the comment that opens `/* ── the sections, in run order ──`
    and begins *"These files are named after the surface…"*.
  - `tools/README.md` ~line 1369: *"Since WO-1.26 the count spans `tools/verify-shell.mjs` and the
    files under `tools/verify/` that it names"*.

**Traps the work order does not spell out — check these before you write the pattern:**

- **The header comment already contains a number word near "files", and it is not a harness count:**
  *"Two of them are not sections: lib-dates.mjs … attendance-passes.mjs"*. A pattern that refuses any
  number word in that comment fires on today's tree. Decide how the pattern tells *"Two of them"*
  (a count of two named files) from *"Seventy-five files"* (a size of the harness), and **do not
  reword that sentence to make the check pass** — that is the ledger trap in a second place. Say in
  the banner what the pattern refuses and what it lets through.
- **"The live sentence" is one sentence, not a region.** `tools/README.md` also says
  *"plus sixty files under `tools/verify/`"* near line 4185 and similar dated entries elsewhere;
  those are ledger, and the fourth Acceptance line forbids touching them. Bound the README read to the
  anchor sentence (or its paragraph, if you can show the paragraph's other number words are not file
  counts) and state the bound in the banner.
- **Words and digits both, and the plant must show both for `verify-shell.mjs`**: the second
  Acceptance line wants a digit plant *and* a word plant in the header comment, and at least one plant
  in the README sentence. That is three plants minimum, each its own red run quoted in `TESTING.md`.
  Use `grep -rn MUTATION` (or whatever marker you plant) after reverting, and confirm
  `git diff --stat` shows nothing left in either file before writing anything else.
- **The anchor-missing proof is a fourth and fifth plant** (third Acceptance line): reword each anchor
  so it cannot be found and show a FAIL that names it. Revert those too.
- **§ 22's count moves.** Adding results changes the number § 22 expects in `tools/README.md`'s
  `wo-sweep.mjs` row (*"The verifier's 50-check standing sweep"* today). Take the new figure from a
  sweep run, not arithmetic, and extend that row with one clause for the new section in the row's
  existing style — do not rewrite the row.
- `node tools/verify-shell.mjs` takes ~4–5 min; one clean run at the end is what the fifth Acceptance
  line needs. Nothing in `src/` moves and no `CACHE` bump is owed.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

## 5. Done means these 6 lines, reported against one by one

1. `node tools/wo-sweep.mjs` has a check that passes on today's tree and names both places it read.
2. A file count written back into the header comment of `tools/verify-shell.mjs`, in digits and in words, turns that check red at the line; so does one written back into the live sentence in `tools/README.md`. Both plants are reverted, and `TESTING.md` § WO-1.80 shows the red output.
3. Rewording either anchor so that the check can no longer find it fails the check and names the anchor, and does not pass.
4. The dated ledger entries further down `tools/README.md` (*"moves to seventy-five"*, *"the eighty-first file"* and the rest) do not trip it, and nothing was rewritten to make them pass.
5. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
6. `TESTING.md` § WO-1.80 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.80 — it is a deliverable, not a permission.** Add `### WO-1.80 — nothing stops a file count creeping back into the harness's prose` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.80` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

