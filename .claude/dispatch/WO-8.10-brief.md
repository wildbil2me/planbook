# WO-8.10 — the app cannot say which build it is running · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.10-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier, on the work order's own merits: the deliverables
are mostly teacher-facing prose — the "more than one cache" wording has to alarm a teacher enough
that she forwards the screen, and the fail-soft line has to distinguish *Cache Storage unavailable*
from *no caches* in the About modal's voice — and the Traps section is a judgment argument (a build
identifier that can be wrong is worse than none), not a mechanic. The runner-up I set aside was
Codex: the `caches.keys()` call is size S, mechanically checkable and touches no sensitive surface,
which is a genuine Codex shape; it lost because the value here is in the copy and in the harness's
negative case, not in the API call. No Codex probe was run, since this never reached the Codex
column.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.10 — the app cannot say which build it is running

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 8 → *(no box. The same call as WO-8.7 through WO-8.9 — this is instrument,
not feature. Booked 2026-08-15, out of the v63 deploy.)*

**Why it exists.** After a deploy, the only way to learn whether the installed iPad actually took the
new shell is Safari Web Inspector over USB from a Mac. That is a procedure nobody runs in September,
which means in practice the question stops being asked — and the question matters, because
**WO-8.7's first deploy shipped two faults with every check in this repository green.** The deployment
is now read by `verify-deploy.mjs`, but that reads *the origin*. What no tool here can see is the
device: an installed app carries its own cache, and a deploy that landed perfectly on the host can sit
beside an iPad still serving the old one.

**The useful question is not "which version".** `sw.js` uses `skipWaiting` + `clients.claim`
(`sw.js:114`, `sw.js:122`), so `activate` deletes every cache that is not the current one. One cache
is the healthy state. **Two caches means `activate` did not finish**, and the app may be serving a
mix — which is the failure that actually breaks a screen, and the one a bare version string would
hide by reporting the new name while the old cache sits next to it.

**Deliverables**
- **The About modal's "This build" section reports what `caches.keys()` actually returns**, filtered
  to this app's shells. Generated at open time from Cache Storage — never a constant.
- **More than one is said out loud**, naming each. One cache reads as normal; two says so plainly
  enough that a teacher forwards the screen rather than shrugging at it.
- **Read from the page**, not from the worker. No `postMessage`, no change to `sw.js`.
- **It fails soft and says which failure.** Where Cache Storage is unavailable, the line says so —
  a blank space reads as *"no caches"*, which is a different fact and a wrong one.

**Out of scope** — any surface outside the About modal; an update prompt or a "reload to update"
banner, which is a real decision `sw.js:127` already frames and is not this work order's to make; any
network request; any edit to `sw.js`.

**Acceptance**
- [ ] On a freshly loaded app, the About modal names the running cache and it matches `sw.js`'s
      `CACHE`.
- [ ] With a second cache planted by hand — `caches.open('planbook-shell-v1')` — the modal says there
      is more than one and names both. *(This is the line that earns the feature. A display that only
      ever shows one name has proved nothing about the case it exists for.)*
- [ ] With Cache Storage unavailable, the line says so rather than going blank.
- [ ] `verify-shell.mjs` covers both states, planting and clearing the second cache itself. *(The
      harness has never seen a service worker — but Cache Storage is reachable from the page it
      drives, so this case is inside its reach even though the worker is not.)*
- [ ] 👤 On the **installed** iPad, after a deploy: the modal names the cache just deployed, and names
      only one.

**Traps** — **Do not read the version from a constant.** A string typed into `index.html` is a claim,
not evidence: it will read `v63` while the browser holds `v62`, which is the exact failure this exists
to catch, now wearing a badge that says it didn't happen. **The paragraph above it already carries a
comment about going stale** (`index.html:1216`) and that comment is the argument — this line must be
generated every time the modal opens, because a build identifier that can be wrong is worse than
none. **Do not touch `sw.js`.** Its cache name is the fact being reported; a work order that edits
both the fact and the report of it can agree with itself while being wrong.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`index.html` lines 1197–1247** — the About modal. The `<div class="modal-section-label">This
  build</div>` section already exists at line 1221; your line joins it. The stale-paragraph comment
  at line 1216 is the argument the Traps section points at — read it, and do not delete or "tidy"
  it.
- **`sw.js` lines 1–40 and 105–130** — `const CACHE` (line 37, currently `planbook-shell-v64`) is
  the fact you are reporting, and lines 112–122 are the `skipWaiting` / `clients.claim` / delete-
  every-other-cache behaviour that makes *two caches* the interesting state. **Read it; do not edit
  it.** Note that `CACHE` is hand-bumped, so anything you write that hardcodes `v64` is the exact
  trap this work order names.
- **`src/modal.js`** — owns modal behaviour only; the semantics live in `index.html`. Follow that
  split. Whatever module fills this line at open time should follow the conventions of the existing
  `src/*.js` files (no framework, no build step, plain ES module wired the way its siblings are).
- **`tools/verify-shell.mjs`** — read how existing checks are structured before adding two. Acceptance
  line 4 asks the harness to **plant and then clear** `planbook-shell-v1` itself; a check that leaves
  a stray cache behind poisons every later run, so clean up in all paths including failure.
- **`tools/README.md`** — if you add checks to `verify-shell.mjs` or `wo-sweep.mjs`, the recorded
  check count in this file is asserted by `wo-sweep.mjs` §11 against reality. A count you forget to
  move turns the sweep red on itself (that is WO-8.9's third deliverable, freshly landed).

Two scope notes worth stating plainly, because both are tempting and both are out:

- The "unavailable" case (Acceptance 3) is a **real** environment — `window.caches` is undefined on
  a non-secure origin, and can throw in private modes. Handle the absent-API and the rejected-promise
  cases both; do not simulate it by deleting your own code path.
- No update prompt, no "reload to update" banner, no toast. The work order names that as a decision
  it is not making. If you think one is needed, that is a proposed follow-up in your report.

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
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
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

1. On a freshly loaded app, the About modal names the running cache and it matches `sw.js`'s `CACHE`.
2. With a second cache planted by hand — `caches.open('planbook-shell-v1')` — the modal says there is more than one and names both. *(This is the line that earns the feature. A display that only ever shows one name has proved nothing about the case it exists for.)*
3. With Cache Storage unavailable, the line says so rather than going blank.
4. `verify-shell.mjs` covers both states, planting and clearing the second cache itself. *(The harness has never seen a service worker — but Cache Storage is reachable from the page it drives, so this case is inside its reach even though the worker is not.)*
5. 👤 On the **installed** iPad, after a deploy: the modal names the cache just deployed, and names only one.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

