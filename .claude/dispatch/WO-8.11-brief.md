# WO-8.11 — the build line can name a version the screen is not running · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.11-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude, Opus tier**, on three of `ROUTING.md`'s Claude
criteria at once: it produces teacher-facing prose (a sentence a teacher can act on, with an explicit
ban on wording that implies a pull-to-refresh clears it), its Traps are judgment rather than mechanics
(`controllerchange` fires on first control as well as replacement; "do not make the healthy line
longer" is a taste call), and the first Deliverable asks you to **choose between two architectural
routes and write the reasoning at the point where the route is taken** — a work order whose deliverable
is a decision is by definition not fully specified. The runner-up consideration set aside: it is Size
`S` with a mechanically checkable Acceptance list and an existing `verify-shell.mjs` section to extend,
which reads Codex-shaped on the surface. Ties go to Claude, and this is not close enough to be a tie.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.11 — the build line can name a version the screen is not running

**Ship** 3 · **Status** 🤖 CLAIMED — 2026-08-18 · **Size** S · **Depends on** WO-8.10
**Closes roadmap** *(no box. Instrument, not feature — the same call WO-8.7 through WO-8.10 made.
Booked 2026-08-16, out of WO-3.24's close-out sitting.)*

**Why it exists.** WO-8.10 gave the About modal a build line read live from `caches.keys()`, and its
central argument is that the useful question is *how many* caches rather than *which version*: one
cache is healthy, two means `activate` did not finish. That is right for the half-landed deploy it
was built for. It does not cover the case found on 2026-08-16.

**A single, correct, healthy cache can sit behind a stale rendered page.** `sw.js` uses `skipWaiting`
+ `clients.claim`, so a new worker takes over the moment it activates and deletes every other cache —
but it does not re-render an open window. The document on screen was fetched before the swap. For
exactly one launch the app therefore reports the new cache on the build line while every pixel came
from the old one, and both statements are true of different things: Cache Storage answers what the
device has **stored**, never what the window was **built from**.

**Found the expensive way.** WO-3.24 reworded one legend row; the owner read the installed iPad three
times and the first two showed the wrong string — first the pre-dispatch wording, then a superseded
attempt — while About read `planbook-shell-v72` throughout. A force-quit from the app switcher and a
cold relaunch produced the delivered text. Two of the three round trips were spent on the assistant
misdiagnosing the device from the desk, against a build line that was reporting honestly. **A support
surface that can be confidently wrong during an update is worse than one that admits it cannot tell**,
and the modal's own closing sentence invites a teacher to forward that screen.

**The decision this settles is the one `sw.js:127` already frames**, and WO-8.10 explicitly declined:
an update prompt was in its Out of scope as *"a real decision ... not this work order's to make"*.

**Deliverables**
- **Choose the route, and write the reasoning where the route is taken.** Two are open:
  - **Page-side only, `skipWaiting` kept.** `navigator.serviceWorker`'s `controllerchange` fires when
    a new worker claims an already-loaded client — which is this case exactly. The page learns it is
    running markup its controller no longer serves, and the build line says so. **Preferred**: it
    edits no `sw.js`, so WO-8.10's "do not touch `sw.js`" trap stands unbroken, and it leaves the
    boot-time guarantee in `sw.js:127` alone.
  - **Drop `skipWaiting`** and tell the teacher an update is ready, which is what the comment at
    `sw.js:127` suggests. Larger blast radius, in the file WO-8.7's white-screen scar lives in.
- **The build line distinguishes stored from rendered.** Where they disagree it says so in a sentence
  a teacher can act on — quit from the app switcher and reopen — rather than naming two versions side
  by side. **A pull-to-refresh is not sufficient and the wording must not imply it is**; that was
  tried on 2026-08-16 and did not clear it.
- **Silence in the healthy case.** The overwhelmingly common state is one cache, freshly rendered,
  and it must stay the quiet single-sentence line WO-8.10 built. A banner on every launch teaches the
  teacher to dismiss the one launch that matters.

**Out of scope** — the update *policy* (whether Planbook ever auto-reloads, prompts, or defers); any
surface outside the About modal; anything about deploys on the host side, which is WO-8.8's.

**Acceptance**
- [ ] With a document loaded from cache A and a worker that has since activated cache B, the build
      line says the screen is stale and names the action that fixes it. Driven, not reasoned.
- [ ] In the healthy case — one cache, document served from it — the line is exactly what WO-8.10
      ships today, with nothing added.
- [ ] The **first-ever load**, where a worker claims a page that had no controller at all, is read as
      healthy and not as staleness. *(This is the trap below, written as a check: `controllerchange`
      fires for both, and conflating them puts a scary sentence in front of every new install.)*
- [ ] `verify-shell.mjs` covers both states and hands Cache Storage back as it found it, the way
      WO-8.10's own section does.
- [ ] 👤 On the **installed** iPad: deploy, launch once without force-quitting, and confirm the app
      says the screen is stale — the exact sequence that misled the reader on 2026-08-16.

**Traps** — **`controllerchange` fires on first control as well as on replacement.** A page that has
never had a controller gets one when the worker claims it, and that is not staleness; keying off the
event alone puts a warning in front of every first install. Read `navigator.serviceWorker.controller`
*before* registering to tell the two apart. **Do not add a second source of truth for the version.**
WO-8.10's trap holds — no constant in `index.html` — and this work order adds a fact about the
*document*, not a second claim about the *build*. **Do not make the healthy line longer.** The reason
WO-8.10's sentence works is that a teacher reads it in one glance; a caveat attached to the normal
case is a caveat nobody reads in the abnormal one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The WO-8.10 implementation you are extending — read all four sites before designing anything:**

- `src/shell.js` **~2098–2211**. Three things live here in sequence and you need all of them: the
  service worker registration (deferred to `load`, failure logged and swallowed), the long
  `WHICH BUILD THIS DEVICE IS ACTUALLY RUNNING` comment block that argues why this code sits beside
  the registration rather than in a module of its own, and `paintBuildLine()` with its five states
  (`caches` unavailable · read rejected · no caches · exactly one · more than one). Note the shape of
  `buildLine(el, warn, parts)` — `textContent` and created `<strong>`s, **never `innerHTML`**, because
  cache names come out of storage anything on the origin can write to. Your new state has to go
  through the same function. Note also that only the multi-cache state takes the amber `warn`, and
  the comment says why: *"the caution palette has to mean exactly one thing."* Decide deliberately
  whether staleness is that same thing or a third treatment, and write the reasoning down.
- `index.html` **~1266–1273**. The `<p class="build-caches" id="buildCaches">` is empty in the markup
  on purpose and the comment above it is the argument for why. Whatever you add must keep that true.
- `sw.js` **~108–134**. `install` → `skipWaiting()`, `activate` → delete every non-current cache →
  `clients.claim()`, and then the standing comment at **~127** that frames the exact decision this
  work order settles: *"If you add one, drop skipWaiting and tell the teacher an update is ready
  instead — do not leave both."* Read it before choosing your route. **WO-8.10's trap says do not
  touch `sw.js`**, and the work order's preferred route is the one that keeps that trap unbroken.
  If you take the other route you must say, in the result file, why breaking it was correct.
- `tools/verify-shell.mjs` **~23240–23455**, the `--- which build this device is running (WO-8.10) ---`
  section. This is the pattern your new coverage must match, and it is unusually careful for a reason:
  it plants `planbook-shell-v1`, asserts against `sw.js`'s real `CACHE`, greps the tree for a
  hardcoded version constant, overrides `window.caches` twice to reach the two unreachable states, and
  **restores everything in a `finally`** — the comment explains that a stray planted cache would make
  every later reading of this line report a broken app, and a `window.caches` left overridden would do
  worse quietly. Your Acceptance line says "hands Cache Storage back as it found it, the way WO-8.10's
  own section does." That is not a suggestion; extend the same `finally` discipline.

**On driving `controllerchange` from the harness.** `tools/README.md` § "Driving a browser over CDP"
is already in the list above; read it before you decide how to reach the stale state, because the
harness drives a page and **has never seen a service worker**. WO-8.10's section got at its states by
manipulating Cache Storage and `window.caches` from the page, which is inside the harness's reach.
Design your seam so the state under test is reachable the same way — from the page — rather than by
trying to make a real worker activate mid-run. If you conclude a genuinely faithful test is out of the
harness's reach, say so plainly in the result file and describe what you covered instead; do not write
a check that passes without exercising the thing.

**One correction of record you should know about.** `CLAUDE.md` § Commands has been narrowed: the
harness "usually cannot run in a sandboxed agent" — but it *has* run there, twice, and a green run in
a dispatch is a green run. Run it. If it genuinely cannot run in your environment, report that as an
environment fact rather than as a result, and do not tick anything on it.

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

1. With a document loaded from cache A and a worker that has since activated cache B, the build line says the screen is stale and names the action that fixes it. Driven, not reasoned.
2. In the healthy case — one cache, document served from it — the line is exactly what WO-8.10 ships today, with nothing added.
3. The **first-ever load**, where a worker claims a page that had no controller at all, is read as healthy and not as staleness. *(This is the trap below, written as a check: `controllerchange` fires for both, and conflating them puts a scary sentence in front of every new install.)*
4. `verify-shell.mjs` covers both states and hands Cache Storage back as it found it, the way WO-8.10's own section does.
5. 👤 On the **installed** iPad: deploy, launch once without force-quitting, and confirm the app says the screen is stale — the exact sequence that misled the reader on 2026-08-16.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

