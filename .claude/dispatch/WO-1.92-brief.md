# WO-1.92 — A fresh document sometimes never runs its modules, and nothing has said why · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.92-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-11-03):** Claude Opus, on its own merits. The deciding signal is that this is a diagnosis, not a specified build: the work is to collect occurrences, name a cause, and judge whether it lies in the app (stop and report) or the harness (fix there), which is the rubric's "ambiguous" and "Traps about judgment" rows, plus `TESTING.md` prose. Codex was set aside on the budget alone as well: one full run is ~20 minutes and the Acceptance needs several plus three green ones, which no 20-minute cap holds, so no probe was run.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.92 — A fresh document sometimes never runs its modules, and nothing has said why

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-03 · **Size** M · **Depends on** WO-1.91 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app, unless the diagnosis finds otherwise — the same call WO-1.26 through WO-1.91 made.)*

**Booked 2026-11-02**, owner-directed, out of [WO-1.91](#wo-191--hload-sleeps-a-fixed-800-ms-and-every-section-reloads-through-it)'s
verdict. WO-1.91 found what made `verify/sync-button.mjs` throw: `load()` threw away `waitForBoot()`'s
`false` and handed back a page that had never booted. It made that failure loud. It did not find
**why the page never booted**, and it says so. Over six full runs on 2026-11-02, a fresh document
failed to boot twice: once through `load()` in `sync-button.mjs`, and once through
`verify/cooldown-quiet.mjs`'s own `reload45()`. The `load()` failure read `readyState: complete`,
`modulesRan: false`, `bootError: null`. So the document had finished loading and its module graph
never ran. That is a failed graph, not a slow boot. `TESTING.md` § WO-1.91 § 2 records three ways to
produce that reading on demand: a module answering 404, a module throwing at module scope, and a
request blocked outright. The last of these leaves no event at all. Since WO-1.91, `load()` quotes
every `Runtime.exceptionThrown` and error-level `Log.entryAdded` the page reported since its
navigation, so **the next occurrence through `load()` names which of the three it was**.

The flake is about one run in three on this machine, and every verdict reads this harness. Until
it is understood, a red run cannot be told from a real failure without a re-run.

**Deliverables**
- **Collect occurrences before theorising.** Run the full harness until `load()` fails at least
  twice, or until a stated number of runs (say how many) passes clean. Quote every failure message in
  full, including the page errors `load()` appends. Background the runs and say up front how long
  they take.
- **Name the cause from those messages**: a request that failed (which URL, which status), a module
  that threw (which file and line), or a request with no event at all. If it is the last, say what
  else was tried to see it, for example `Network.loadingFailed`, the service worker's own fetch
  handler, or the `CACHE` it served from.
- **If the cause is in `src/` or `sw.js`**, stop and report. A worker that sometimes serves a module
  it should not, or a module that sometimes throws at load, is an app defect. It is also one a
  teacher's iPad could meet. It gets its own work order and a `CACHE` bump there, not here.
- **If the cause is in the harness**, for example a server, port or cache the harness itself
  controls, fix it there and say why the fix is the cause and not a longer wait.
- **`TESTING.md` § WO-1.92**, a `tools/README.md` ledger line if a harness file moves, and the
  `CHANGELOG.md` entry.

**Acceptance**
- [ ] `TESTING.md` § WO-1.92 quotes every boot failure seen, with the page errors `load()` reported,
      and names the cause with evidence, or says plainly that it did not recur in N runs and what was
      tried.
- [ ] If the cause is in the harness, it is fixed there, and the fix is neither a longer budget nor a
      retry.
- [ ] If the cause is in `src/` or `sw.js`, nothing there has moved, and the report names the app
      work order it needs.
- [ ] Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the run
      lines are quoted in `TESTING.md` § WO-1.92.
- [ ] `node tools/wo-sweep.mjs` passes.
- [ ] `TESTING.md` § WO-1.92 carries these lines verbatim with the evidence for each.

**Traps** — **A retry is not a fix**: a harness that reloads until the page boots hides the one
reading a teacher's iPad could also get. WO-1.44's rule still applies: a failure must stay loud.
**A green run proves nothing about a flake of this rate**, so three green runs show the change broke
nothing, not that it cured anything. The same limit WO-1.90 and WO-1.91 stated. **The failures so far
were in sections 88 and later**, after ~1,000 seconds of one browser. A section-only reproduction
failed at its first class click in WO-1.91, so do not plan on one. [WO-1.93](#wo-193--about-a-hundred-section-reloads-throw-away-waitforboots-answer)
widens the net to the sections' own reloads, so a second occurrence may arrive through one of them.
**Each full run takes about 20 minutes.**

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `TESTING.md` § WO-1.91 (line ~8435), especially its § 2: the three ways to get `modulesRan: false` on demand, and the two failure messages from 2026-11-02 quoted in full. Start here.
- `TESTING.md` § WO-1.93 (line ~8637): `mustBoot()` and the `reload45()` change. Since WO-1.93, about a hundred section reloads also fail at the reload and quote page errors, so **a failure can now arrive through any section, not only `load()`**. Count those as occurrences too. Also: WO-1.93's own three consecutive full runs on HEAD were all green (2205/2205). Those are three clean runs on this tree and you may count them toward N, quoted as theirs, but they do not replace your own runs.
- `tools/verify-shell.mjs`: `load()`, `waitForBoot()`, `mustBoot()`, and how the server, ports, browser profile and service worker are set up for one run. `sw.js` too, read only.
- `plans/dispatch-retro.md` § WO-3.26, and AGENTS.md § "If you were dispatched with a work order" (mutation rule).

**Orchestrator notes. These are the traps this work order will not tell you itself.**

- **Run the harness in the background.** The Bash tool caps a foreground call at 10 minutes and a run is ~20. Redirect each run to a log in the scratchpad and finish it with `; echo EXIT=$?`. Read that `EXIT=` line and the summary line. **Do not judge a run by `grep -c`**: zero matches exits 1 and makes a green run look failed.
- **Write evidence down as each run ends, not at the end.** After every run, append its summary line, its EXIT, and any failure message quoted in full to `.claude/dispatch/WO-1.92-status.md`. This dispatch is long, and 22% of orchestrator runs die at the session limit. A replacement run must be able to count your runs from that file without re-running them.
- **State N before the first run** and put it in the status file. A suggestion, which is yours to change if you say why: stop at the second boot failure, or at 6 clean runs of your own (about 2 hours). At ~1 failure in 3 runs, 6 clean runs is real evidence the rate has changed. Fewer is not.
- **Read-only instruments are welcome. Retries and longer budgets are not.** If the first failure carries no page error (the 'request with no event' shape), you may add *permanent, loud* diagnostics to the harness, for example quoting `Network.loadingFailed`/`responseReceived` for the module URLs, or the service worker's state and `CACHE`. Say why each is diagnosis and not tolerance. Adding them restarts nothing: earlier runs still count as occurrences, but the three green runs at the end must all be on the final tree.
- **Any temporary probe or mutation goes in a scratch copy in the scratchpad**, as WO-1.93's did, never in `src/`, `sw.js` or a tracked harness file. Before your result file, run `grep -rn MUTATION tools/ src/ sw.js` and `git status --short`, and quote both.
- **If a page error names `src/` or `sw.js`, stop building.** Write the report, propose the app work order with its title and the evidence, leave that Acceptance line's evidence in `TESTING.md`, and still finish the three green runs and the sweep. Do not edit app code and do not bump `CACHE`.
- **If you change a harness file**, `tools/README.md` probably carries a `check()` count or ledger line that `wo-sweep.mjs` compares against. That sweep line goes red when work is *done*, so re-run the sweep last.
- `CHANGELOG.md`: draft the entry in your result file. Write it into the file only if this repo's recent WO-1.9x entries show the implementer doing so. Check `git log -p -3 -- CHANGELOG.md` first.

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

1. `TESTING.md` § WO-1.92 quotes every boot failure seen, with the page errors `load()` reported, and names the cause with evidence, or says plainly that it did not recur in N runs and what was tried.
2. If the cause is in the harness, it is fixed there, and the fix is neither a longer budget nor a retry.
3. If the cause is in `src/` or `sw.js`, nothing there has moved, and the report names the app work order it needs.
4. Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the run lines are quoted in `TESTING.md` § WO-1.92.
5. `node tools/wo-sweep.mjs` passes.
6. `TESTING.md` § WO-1.92 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.92 — it is a deliverable, not a permission.** Add `### WO-1.92 — A fresh document sometimes never runs its modules, and nothing has said why` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.92` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

