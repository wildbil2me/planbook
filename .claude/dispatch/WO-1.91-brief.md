# WO-1.91 — h.load() sleeps a fixed 800 ms, and every section reloads through it · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.91-result.md` — as your last act, and return it in-band too.

**Routing (orchestrator, 2026-11-02):** Claude **Opus**, on its own merits. The deciding signal is that the first deliverable is a diagnosis — confirm or refute a mechanism in the shared harness helper every section reloads through — plus a judgment about whether WO-1.89's and WO-1.90's local helpers should now share it; that is a judgment trap, not a spec to match. The runner-up was Codex (tooling, no UI, no sensitive surface), set aside also on arithmetic: three full `verify-shell.mjs` runs at ~20 min each is ~60 min against Codex's 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.91 — h.load() sleeps a fixed 800 ms, and every section reloads through it

**Ship** — · **Status** 🤖 CLAIMED — 2026-11-02 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.90 made.)*

**Booked 2026-11-02**, owner-directed, out of [WO-1.90](#wo-190--front-doormjss-installed-cold-launch-timed-out-once-under-load)'s
verdict. The implementer's first two full runs read `2197 checks · 2194 passed · 3 failed`, and the
failures were not WO-1.90's section: both times `verify/sync-button.mjs` threw after 35 of its own
checks, in its pinned same-day clock block, with `TypeError: Cannot read properties of undefined
(reading 'driveSync')`, so `window.planbook` was not on the page it read. The throw left its stand-in
Google library on the page, and two checks downstream failed with it. The section passed on the next
four runs with no file moving. The record is `TESTING.md` § WO-1.90, under its third Acceptance line.

The likely mechanism is in the shared helper, not in the section. `load()` in
`tools/verify-shell.mjs` (exported as `h.load`) navigates, sleeps **a fixed 800 ms**, then calls
`waitForBoot()`. `waitForBoot()` only asks whether `#loadingScreen` is hidden, and it cannot tell the
page being left from the new one. So if the navigation has not committed within 800 ms, it can read
the old page's hidden loading screen, return at once, and leave the caller reading a document that is
about to be replaced. It is the same shape WO-1.89 and WO-1.90 fixed one section at a time.
`sync-button.mjs`'s `reload()` is `h.load()`, and so are the reloads in `drive-sign-in.mjs`,
`first-run.mjs` and `front-door.mjs`, about a dozen call sites in all. **One fix here covers every
section that reloads**, rather than one file at a time.

**Deliverables**
- **Confirm the mechanism before changing anything**, and record it in `TESTING.md` § WO-1.91: whether
  `waitForBoot()` can return `true` on the page being left, and whether that explains the
  `sync-button.mjs` throw. If it can be reproduced, for example by running the section under side load
  or with a slowed navigation, say how often before and after.
- **Fix it in `load()`, not in each caller.** Mark the document before navigating and wait until a
  new one has replaced it, then wait for it to boot. This is the condition WO-1.89's and WO-1.90's
  local helpers wait on. Drop the fixed 800 ms rather than lengthening it. If `waitForBoot()` itself
  should learn the difference, say why in its comment.
- **Look at the sections' own local copies of the same wait.** WO-1.89 and WO-1.90 kept theirs local
  on purpose. Say whether they should now call the shared one, but **do not churn files that are
  green** only to make them share code.
- **If the cause is in `src/`**, stop and report. A page that sometimes boots without
  `window.planbook` would be an app defect and a work order of its own.
- **`tools/README.md`**: one line in the ledger.
- **`TESTING.md` § WO-1.91** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] `TESTING.md` § WO-1.91 says whether `waitForBoot()` can read the page being left, names the
      cause of the `sync-button.mjs` throw with evidence, or says plainly that it could not be
      reproduced and what was tried.
- [ ] `load()` no longer depends on a fixed sleep, and it does not return until the new document
      has replaced the old one and booted.
- [ ] A `load()` whose new page never boots still fails loudly, and does not read as a pass.
- [ ] Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the
      run lines are quoted in `TESTING.md` § WO-1.91.
- [ ] `node tools/wo-sweep.mjs` passes.
- [ ] `TESTING.md` § WO-1.91 carries these lines verbatim with the evidence for each.

**Traps** — **A longer sleep is not a fix**, for the reason WO-1.89's Traps gave. **Every section
reloads through this helper**, so a wait that hangs on some page shape kills far more than one
section: WO-1.44's *blast radius, not tolerance* rule means it must still fail, but by a bounded
budget and with a message saying which state it reached. **The navigation keeps `?door=skip`**, and
`front-door.mjs` is the one section that navigates without it, so read its own navigation before
assuming it uses `load()`. **Nothing in `src/` moves**, so no `CACHE` bump is owed. **The three runs
take about 20 minutes each**: background them and say so up front.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify-shell.mjs` `waitForBoot()` (~line 1090) and `load()` (~line 1218). Note `load()` **discards** `waitForBoot()`'s `false` return today — that is Acceptance line 3, not a nicety.
- `tools/verify/cooldown-quiet.mjs` ~line 88 (WO-1.89) and `tools/verify/front-door.mjs` ~line 150 (WO-1.90) — the two local document-replacement waits this fix should match in condition.
- `tools/verify/sync-button.mjs` (its `reload()`), `drive-sign-in.mjs`, `first-run.mjs` — the callers.
- `TESTING.md` § WO-1.90, third Acceptance line — the record of the `driveSync` throw.

**Traps the orchestrator adds:**
- `load()` also runs once at harness start (`await load();` right after its definition), before the `h` object exists — the first navigation has an `about:blank` (or similar) document to replace; make sure the mark-and-wait does not hang there.
- Marking the document: a `window` expando or a `document` property set by `evalJs` before `Page.navigate` is the WO-1.89/1.90 shape. A same-URL navigation still replaces the document, so the mark disappears; confirm that is true for the `?door=skip` URL rather than assuming it.
- If you mutate `load()` to prove line 3 (a page that never boots fails loudly), **revert the mutation before writing anything else**, and grep `MUTATION` over your changed files before your result file (AGENTS.md).
- The three full runs take ~20 min each: run them in the background, one at a time, on one unchanged tree, and quote each summary line. A run line from before your last edit to `tools/` does not count toward the three.
- If `tools/README.md` records a count that the sweep checks (e.g. `check()` call sites), update it — WO-3.26 shipped a red sweep for exactly that.

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

1. `TESTING.md` § WO-1.91 says whether `waitForBoot()` can read the page being left, names the cause of the `sync-button.mjs` throw with evidence, or says plainly that it could not be reproduced and what was tried.
2. `load()` no longer depends on a fixed sleep, and it does not return until the new document has replaced the old one and booted.
3. A `load()` whose new page never boots still fails loudly, and does not read as a pass.
4. Three consecutive full runs of `node tools/verify-shell.mjs` on one tree are green, and the run lines are quoted in `TESTING.md` § WO-1.91.
5. `node tools/wo-sweep.mjs` passes.
6. `TESTING.md` § WO-1.91 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.91 — it is a deliverable, not a permission.** Add `### WO-1.91 — h.load() sleeps a fixed 800 ms, and every section reloads through it` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.91` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

