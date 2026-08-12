# WO-8.8 — read the deployment, not the repository · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.8-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude at the Opus tier, on this work order's own merits — not a
Codex fallback.** The deciding signal is the Traps section, where all three traps are judgment traps
rather than mechanics: reading `SHELL` from the local `sw.js` is the obvious simplification and
produces a check that passes forever, `fetch` follows redirects by default so the WO-1.14 defect is
invisible unless you deliberately turn that off, and a retry loop is exactly what a model optimizing
for robustness adds. Two more Claude triggers stack on it — this establishes a convention (the first
network-touching check in `tools/`, and the "unreachable origin is not a red check" semantics that
everything after it will copy) and it produces suite-voice prose in `tools/README.md`. The runner-up
consideration set aside: size S, no UI, no sensitive surface and a spec complete enough to build
from is a genuine Codex shape, but the Codex column requires *all* of its conditions and "conventions
already exist to follow" is the one this fails.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.8 — read the deployment, not the repository

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-12 · **Size** S · **Depends on** WO-8.7
**Closes roadmap** Phase 8 → *(no box. Tooling, not app — the same call as WO-2.19 through WO-2.22.
Booked 2026-08-12, out of WO-8.7's deployment.)*

**Why it exists.** WO-8.7's first deploy shipped two faults, and **every check in this repository was
green through both of them.** `verify-shell.mjs` ran 628 of 628 with zero skips before the deploy and
628 of 628 after the fix — the same number, because it never had anything to say about either one.

- **The shell was served from a redirect** the host invented. `sw.js` precached `/index.html`;
  Cloudflare Pages answers that path with a 308; the cached copy carried the redirect and Safari
  refused to serve it to a navigation. The app loaded once and then would not load again (WO-1.14).
- **`_headers` was correct and did not bind.** The Cloudflare zone's own four-hour browser cache TTL
  rewrote `Cache-Control` on `/sw.js`, so the one file the pinning exists for was served
  `max-age=14400`. The shell document escaped only because HTML is not edge-cached — which is
  precisely why it looked fine.

**Neither fact exists in this repository.** One is the host's routing, one is a dashboard setting in
someone's Cloudflare account. No amount of reading files finds either. **What found both was a single
HTTP request against the live origin**, run by hand during a support conversation, and that is the
instrument this project does not have.

**The verifier saw the edge of this and understated it.** Its WO-8.7 finding was that `_headers` is
invisible to the sweep — `wo-sweep.mjs` gates on `^(index\.html|sw\.js|manifest\.webmanifest|src/)`
and `\.(css|html)$`, and an extensionless root file matches neither, so deleting `_headers` outright
leaves every tool green. True, and the smaller half. **The whole finding is that the deployment is
invisible**, and a check that only asserts `_headers` exists would have passed both of the faults
above: the file was present, correct, and overridden.

**What this is not.** Not a monitor, not an uptime check, not a thing that runs on a schedule or in
CI. `plans/verification-tooling.md` § The boundary is explicit — *"It gates nothing. No git hook, no
CI, no commit check"* — and that rule holds here without amendment. This is a script the owner runs
by hand after a deploy, the way `verify-shell.mjs` is run by hand before one.

**Deliverables**
- **`tools/verify-deploy.mjs`**, bare Node, no dependencies, one file. It takes an origin (defaulting
  to the production one) and reports on what came back.
- **The checks the two faults would have failed**, at minimum:
  - `/` returns 200, is HTML, and carries `Cache-Control: no-cache`.
  - `/sw.js` returns 200, is JavaScript, and carries `Cache-Control: no-cache` — **the check that
    catches a zone setting silently overriding `_headers`.**
  - **Every path in `sw.js`'s `SHELL` list resolves without a redirect.** Read the list out of the
    deployed `sw.js` rather than the local one, and follow nothing: a 3xx on any entry is a failure,
    because that is the WO-1.14 defect in its general form rather than the one instance of it.
  - The deployed `sw.js`'s `CACHE` string matches the working tree's, so "I forgot to push" and "the
    deploy failed" stop looking like "the fix didn't work".
  - No `_worker.js`, no `_routes.json` and no `/functions/` path answers as a script.
- **It says what it read.** Status, `Cache-Control` and redirect chain per path, printed — so a run
  is evidence a human can check rather than a row of green ticks.

**Out of scope** — anything that runs unattended; anything that writes; a second browser harness
(this is `fetch`, not CDP); checking the app's *behaviour* at the origin, which is `TESTING.md`'s and
a real device's job. Do not extend `verify-shell.mjs`: that file boots a browser and is already the
largest thing in `tools/`, and these are header and status assertions that need neither.

**The one genuine departure, and it needs saying out loud.** **This is the first check in this project
that requires a network.** Everything in `tools/` today runs against files on disk or a browser
pointed at `localhost`, which is why it all works on a plane. This one is useless offline and will
fail confusingly on a bad hotel connection. That cost is accepted because the alternative is what
already happened: a class of defect that only production can express, found by a teacher. **It must
fail loudly and unmistakably as "could not reach the origin" rather than as a red check** — a network
error reported as a failed assertion is worse than no check, and `verification-tooling.md`'s
precondition rule is the same argument in a different accent.

**Acceptance**
- [ ] Running it against the live origin today passes on every check.
- [ ] **Each check is proved by the defect it is named for.** Point it at a URL that redirects and the
      redirect check goes red; construct a response with a wrong `Cache-Control` and that check goes
      red. Per `verification-tooling.md`'s precondition rule, a check that could not have caught the
      thing it exists for is not evidence — and both of this work order's motivating faults are still
      reproducible, which is a luxury most checks do not get.
- [ ] An unreachable origin reports as unreachable, distinctly from any check failing.
- [ ] It gates nothing: no hook, no CI, not referenced by any other script, and the app still ships
      without it.
- [ ] `tools/README.md` gains its section, including **when to run it** — after a deploy, and after
      any change to `_headers`, `sw.js`'s `SHELL` list, or the Cloudflare zone's caching settings.

**Traps** — **Do not read `SHELL` from the local `sw.js`.** The whole point is to compare what is
deployed against what is intended; sourcing both sides from the working tree checks nothing and will
pass forever. **Do not follow redirects** — `fetch` does by default, and a followed 308 looks exactly
like a 200, which is how the original defect stayed invisible. **Do not add a retry loop.** A flaky
result is information; a retry that hides it turns this into the confident pass over nothing that
`plans/dispatch-retro.md` keeps naming as worse than no check at all.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/dispatch-retro.md`
  - `plans/verification-tooling.md`
  - `tools/README.md`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open these, and for these reasons:

- **`_headers`** in the repo root. Its comment block is the primary source on both faults this work
  order exists for — the zone's four-hour Browser Cache TTL rewriting `Cache-Control` on `/sw.js`,
  and `/index.html` 308-redirecting to `/` on Pages. It also tells you which three paths are pinned,
  which is what your `/` and `/sw.js` header checks assert.
- **`sw.js`** in the repo root — `CACHE` (currently a `planbook-shell-vNN` string) and the `SHELL`
  array. You need to know their *shape* to parse them out of the **deployed** copy, and you need the
  working tree's `CACHE` value to compare against. Read its header comment before you write a parser:
  it documents how `verify-shell.mjs` reads `SHELL` by matching single-quoted strings, and the
  apostrophe trap that broke that once. Whatever you write here inherits that hazard.
- **WO-8.7**, immediately above this work order in `plans/work-orders/phase-8-packaging.md`,
  especially its "What the first deploy broke" section — it names the production origin, and it is
  the incident report your checks are reconstructed from.
- **WO-1.14** in `plans/work-orders/phase-1-shell-store-roster.md` — the redirect defect in its
  specific form, so your redirect check generalizes it rather than hardcoding the one instance.
- **`plans/verification-tooling.md`** — read § The boundary and the **precondition rule** carefully.
  Acceptance line 2 and Acceptance line 4 are both direct applications of that document, and it is
  the file that says why a check nobody proved against a real failure is not evidence.
- **`tools/verify-shell.mjs`** and **`tools/wo-sweep.mjs`** — read for *convention only*: how a
  `tools/` script parses argv, prints per-check evidence, and chooses an exit code. **Do not extend
  either one** (Out of scope says so explicitly). `wo-sweep.mjs` is the closer model of the two, and
  it is where the `_headers`-is-invisible-to-the-sweep finding lands.
- **`tools/README.md`** — read the whole thing before adding your section, so the new section sounds
  like the ones around it. Note how existing sections state *when to run* a tool, not just what it
  does; Acceptance line 5 asks for exactly that.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Inlined verbatim into every brief, whatever the route. Most are about app code and are quiet on a
tooling work order — `no dependencies` and `stay inside Out of scope` are the two that bind hardest
here:

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

1. Running it against the live origin today passes on every check.
2. **Each check is proved by the defect it is named for.** Point it at a URL that redirects and the redirect check goes red; construct a response with a wrong `Cache-Control` and that check goes red. Per `verification-tooling.md`'s precondition rule, a check that could not have caught the thing it exists for is not evidence — and both of this work order's motivating faults are still reproducible, which is a luxury most checks do not get.
3. An unreachable origin reports as unreachable, distinctly from any check failing.
4. It gates nothing: no hook, no CI, not referenced by any other script, and the app still ships without it.
5. `tools/README.md` gains its section, including **when to run it** — after a deploy, and after any change to `_headers`, `sw.js`'s `SHELL` list, or the Cloudflare zone's caching settings.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

