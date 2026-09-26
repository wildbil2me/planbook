# WO-8.18 — a stuck update serves the old copy for ever · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.18-result.md` — as your last act, and return it in-band too.

**Routing: Claude, Opus tier.** The Traps are judgment, not mechanics: which caches may be deleted, and only once this worker is the active one. The row also owns an open question, why `activate` does not finish on iOS. Codex was the runner-up, because service-worker cache plumbing is the rubric's own example of Codex-shaped work. It was set aside on budget: `verify-shell.mjs` took ~574s a run on this tree (WO-8.17's result), and 1 clean run plus 2 mutations is ~29 min against a 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.18 — a stuck update serves the old copy for ever

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** S · **Depends on** WO-8.10 — the two-copy line in About that reports this state
**Closes roadmap** *(no box. A defect in the offline shell, found on hardware.)*

**Booked 2026-09-26**, owner-reported, during WO-8.17's first 👤 reading. After the v134 deploy and a
force-quit, the iPad's About read, word for word: *"More than one copy of Planbook is stored on this
device: planbook-shell-v132 and planbook-shell-v134. The last update did not finish…"* Three more
force-quits changed nothing. **It is the second time**: the owner hit the same state after an earlier
update and got out of it only by forcing the update from Safari. WO-8.10's line told the teacher to
quit and reopen, and that did not work. **The laptop took the same v134 deploy cleanly** (About read
one copy, owner, the same sitting), so the failure is iOS-only: the harness, which is Chromium, can
plant the stuck state but will not reproduce how the iPad got into it.

**Why it exists.** Two things in `sw.js` together make the state permanent:
- **Old copies are deleted only in `activate`.** If that step does not finish, nothing ever runs it
  again for that worker, so the old cache stays. Why it does not finish on iOS is not known yet;
  finding out is part of this row, but the fix must not depend on the answer.
- **Lookups search every cache, not the current one.** The `navigate` branch calls
  `caches.match(INDEX)` and the shell branch calls `caches.match(req)`, both with no cache name
  (`sw.js:248` and the line after `SHELL_PATHS`). `caches.match` searches every cache in the order
  they were made, so the oldest copy answers first. One surviving old cache means every launch serves
  the old build, whichever worker is running.

So the update is downloaded and stored and never used, and About reports it correctly every time.

**Deliverables**
- **Serve only from the current copy.** Both lookups read from `CACHE` and nothing else, with the
  network fallback they have now. A surviving old cache is then just wasted space, not the build on
  screen.
- **Clean up old copies somewhere that runs again.** Keep the delete in `activate`, and also run it at
  a point the current, active worker reaches repeatedly (for example, its first fetch in each worker
  lifetime). It must delete only caches under the shell prefix that are not `CACHE`, and only once
  this worker is the active one.
- **The harness plants the stuck state.** Seed an extra `planbook-shell-` cache holding a different
  `./` and a different module. Assert the page is served from `CACHE`, and that the extra cache is
  gone after the worker's next fetch. Mutation-prove both: an unscoped `caches.match` turns the first
  check red, and removing the second cleanup turns the second red.
- `CACHE` bumped.

**Acceptance**
- [ ] In the harness, with an old shell cache planted beside the current one, the document and a
      shell module both come from `CACHE`. Mutation-proved.
- [ ] In the harness, the planted old cache is deleted without a new worker installing.
      Mutation-proved.
- [ ] `skipWaiting` and `clients.claim` are unchanged, and nothing outside the `planbook-shell-`
      prefix is ever deleted.
- [ ] 👤 On the stuck iPad (About naming two copies), after this deploys: relaunch, and About reads
      one copy, the new build, with no Safari step.

**Traps** — **Do not delete the cache the running worker is serving from.** Cleaning up during
`install` would pull files out from under the old, still-active worker; the cleanup belongs to the
active worker only. **Do not delete by anything wider than the shell prefix**: other caches at this
origin are not ours to judge, and IndexedDB, where the grades live, is not a cache at all. **Do not
touch `skipWaiting`**, for WO-8.11's reasons. **Do not treat WO-8.17's banner as the fix**: it reports a
takeover, and on a stuck device the takeover already happened and the old files are still served.
**Keep `./index.html` off `SHELL`** (WO-8.7's white screen), whatever the new lookup looks like.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `sw.js`, all of it. The two lookups are `caches.match(INDEX)` in the `navigate` branch and `caches.match(req)` on the last line.
- `src/shell.js`, where About reads the cache names and draws WO-8.10's two-copy line. That line is how the 👤 reading will tell whether this worked, so do not change what it reports.
- `tools/verify/worker-takeover.mjs` and `tools/verify/build-line.mjs`. They are the existing harness sections that drive the worker and plant caches (WO-8.10, WO-8.11, WO-8.17). Extend their pattern and do not invent a new one. `tools/README.md` records the `check()` count, and it goes red if you add checks and do not update it (WO-3.26).
- `TESTING.md` § WO-8.17, the model for the § WO-8.18 procedure you write for the 👤 line.

### Traps the work order does not spell out

- **The current `activate` already breaks Acceptance line 3.** It deletes every name `!== CACHE`, which includes other caches at this origin. Narrow **both** cleanup sites to the `planbook-shell-` prefix. One shared helper called from both places is the obvious shape, so the prefix test lives in one place.
- **"Only once this worker is the active one."** Fetch events go only to the active worker, so a fetch handler is already that point. Still, state in a comment why the chosen point qualifies. Do not put the cleanup anywhere `install` can reach.
- **Cleanup must not delay or gate the response.** Run it under `event.waitUntil(...)` beside `respondWith`, not chained in front of it. Run it on paths that do not call `respondWith` too, or on whichever point you choose. A failed delete must not break a fetch. Once per worker lifetime is enough, so use a module-level flag. That is not persistent state, and it is correct that a restarted worker tries again: that repetition is the whole of the deliverable.
- **Scoping the lookup.** `caches.open(CACHE).then(c => c.match(...))` is enough, and `caches.match(req, { cacheName: CACHE })` works too. Keep the network fallback, and keep `./index.html` off `SHELL`.
- **The iOS question.** Spend bounded effort and write what you find, or that you found nothing, in the result file and in a comment in `sw.js` if it is worth keeping. Do not change `skipWaiting`/`clients.claim`, and do not make the fix depend on the answer.
- **Harness time is ~10 min a run.** The two mutations hit different checks, so you may apply both in one run, as WO-8.17 did with M1 and M2, provided the reds are distinguishable. Mark every mutation `// MUTATION` and **revert it before you write anything else**, including the result file. Two dead dispatches (WO-5.1, WO-5.3) left armed mutations under ticked boxes. After reverting, run `grep -rn MUTATION sw.js src tools` and finish with a clean full run.
- **Bump `CACHE`** (v134 → v135) in `sw.js`, and update any harness or doc line that names the current version.
- Check other docs that describe the worker's cleanup (`grep -rn "activate" docs tools/README.md`) and correct any that no longer match.

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

## 5. Done means these 4 lines, reported against one by one

1. In the harness, with an old shell cache planted beside the current one, the document and a shell module both come from `CACHE`. Mutation-proved.
2. In the harness, the planted old cache is deleted without a new worker installing. Mutation-proved.
3. `skipWaiting` and `clients.claim` are unchanged, and nothing outside the `planbook-shell-` prefix is ever deleted.
4. 👤 On the stuck iPad (About naming two copies), after this deploys: relaunch, and About reads one copy, the new build, with no Safari step.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

