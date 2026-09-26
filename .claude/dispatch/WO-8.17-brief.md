# WO-8.17 — an open app only looks for an update when it loads a page · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-8-packaging.md`
**Report to** `.claude/dispatch/WO-8.17-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override). The deciding signal is that ruling 2 hides the banner in presentation mode, which is a sensitive surface in ROUTING.md, and that the notice copy is teacher-facing prose. I set aside the Codex reading of this as service-worker cache plumbing: it is Size S and mechanically checkable, but it has one clean run plus at least one mutation (about 9 min), and the presentation-mode rule and the wording outweigh that.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-8.17 — an open app only looks for an update when it loads a page

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-26 · **Size** S · **Depends on** WO-8.11 — the stale-screen flag this reports, and the update policy it put out of scope
**Closes roadmap** *(no box. Instrument, not feature, the call WO-8.7 through WO-8.11 made.)*

**Booked 2026-09-26**, owner-directed, from WO-7.7's hardware reading. v132 went live and neither
device moved on its own: the iPad was slow to take it, and the laptop's app window read v131 with no
amber line. (That window was a separate case: it was installed from `localhost:8443` and would never
have seen a deploy. It found this row, but it is not the fix.)

**Why it exists.** `src/shell.js` calls `navigator.serviceWorker.register('./sw.js')` once, on
`load`, and nothing ever calls `registration.update()`. A browser looks for a new worker only when a
page loads. So:
- **An app left open does not look at all.** A laptop window open across a deploy stays on the old
  build until it is reloaded.
- **iOS resumes a backgrounded app without loading a page** (CLAUDE.md, the force-quit paragraph),
  so the iPad does not look either until something makes it load.
- **Even a relaunch shows the old build once.** The shell is served from cache, the update is found
  during that launch, and the page on screen is already the old one. WO-8.11's amber line in About
  reports that, but only to someone who opens About.

The owner's own procedure (force-quit, relaunch, read About) works around all three, and a teacher
will not follow it.

**WO-8.11 put the policy out of scope on purpose**, and its comment in `src/shell.js` gives three
reasons for not dropping `skipWaiting`. This work order keeps `skipWaiting` and every one of those
reasons. It adds only the **check**, plus a **visible offer** once the check has found something.

**Deliverables**
- **Look for an update when the app comes back on screen.** On `visibilitychange` to `visible`, call
  `registration.update()`, at most once every few minutes so switching apps quickly does not refetch
  `sw.js` every time. A failed check (offline, or a dev server that is down) is silent.
- **Say so on the page, not only in About.** When `renderedFromAnOlderBuild` becomes true while the
  app is running, show a quiet notice outside About: a newer version is ready, with a control that
  reloads. Placement is ruling 2 below; the wording is the implementer's, in the install banner's
  voice.
- **The reload keeps what the teacher has.** The store flushes on `visibilitychange` today; the
  reload control flushes explicitly before it reloads. On a device that opted in to Drive, the
  silent renewal (WO-7.5) signs back in after the reload, so a reload is not a sign-out there.
- `CACHE` in `sw.js` bumped.

**Ruled — the owner, 2026-09-26, both before dispatch**
- **Ruling 1: offer, never reload by itself.** A notice with a Reload control. A reload with a modal
  open throws away an outreach draft or a half-filled form, and the notice costs one tap. There is no
  automatic reload when idle either, so nothing here needs a definition of "nothing is open".
- **Ruling 2: a banner under the header, hidden in presentation mode.** A thin strip under the header,
  the install banner's kind of surface. It carries no student data, so hiding it is about noise on a
  projector, not disclosure; it comes back when presentation mode is turned off, because the newer
  build is still waiting.

**Acceptance**
- [ ] In the harness, bringing the page back to `visible` calls `registration.update()`, and a
      second return within the throttle window does not. Mutation-proved: removing the listener
      turns the check red.
- [ ] In the harness, a `controllerchange` that replaces a controller while the page is running
      shows the notice, and a first install (a page that booted uncontrolled) does not, which is
      WO-8.11's trap arriving at a second reader.
- [ ] The reload control flushes the store before it reloads, asserted in the harness.
- [ ] 👤 On the installed iPad and in a laptop app window installed from `planbook.hwgteach.com`:
      with the app left open, deploy a `CACHE` bump, switch away and back, and the notice appears
      without a force-quit. Tapping it lands on the new build, and About reads the new version with
      no amber line.

**Traps** — **Do not drop `skipWaiting`** to get a "waiting" worker to prompt about. WO-8.11 refused
that route and its reasons still hold. **Do not reload without asking** (ruling 1). **Do not reuse
About's amber line as the notice**, because a teacher who does not open About never sees it, which
is this row's whole defect. **Check the laptop's origin before the 👤 reading**: a `localhost` app
window cannot see a deploy (CLAUDE.md).

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `src/shell.js` ~3935–4130 — WO-8.11's comment block, `HAD_CONTROLLER_AT_BOOT`, `renderedFromAnOlderBuild`, the `register()` call. Read the comment in full: it gives the three reasons skipWaiting stays, plus the first-install trap your second Acceptance line tests.
- `src/store.js` `flush()` (~576) and its existing `visibilitychange`/`pagehide` flush (~587–600). The reload control awaits `flush()` explicitly. Do not rely on the unload path.
- `src/supports.js` `presentationMode()` (~147). Ask it, and repaint on the presentation-mode flip the way other surfaces do. Do not add a second opinion about presentation mode. `wo-sweep` counts the askers, so run it and check which count moves.
- `src/install-banner.js` + `index.html` ~469–495 + the `.presentation-strip` / install-banner CSS in `src/shell.css` ~360–400 are the surface and voice to match. They sit in normal flow under the header, with inline colours and no CSS variables. A new button needs 44px under `@media (pointer: coarse)`.
- `sw.js` — the `CACHE` bump only. Do not change anything else in that file.

**Traps the work order does not state:**
- In the harness, `registration.update()` needs a stub or spy. You cannot deploy mid-run. Spy on `ServiceWorkerRegistration.prototype.update` or wrap `navigator.serviceWorker.getRegistration` at page level, and drive `visibilitychange` by overriding `document.visibilityState`. Check `tools/README.md` § CDP first: the harness may already have a helper for this.
- The throttle needs a clock you control. Keep the interval a named constant and make it testable without a real multi-minute wait. Do not add a sleep to the harness.
- `controllerchange` in the harness: a synthetic `dispatchEvent(new Event('controllerchange'))` on `navigator.serviceWorker` is fine, but the "booted uncontrolled" case has to be real. Check what `HAD_CONTROLLER_AT_BOOT` / `controlled` read in the harness page before writing the assertion, so neither half is vacuous.
- For the flush assertion, prove order: flush resolved before `location.reload` was called. Stub `reload`, because a real reload ends the harness page.
- **Mutation discipline (AGENTS.md):** mark any mutation with a `MUTATION` comment, and revert it before you write anything else. `grep -rn MUTATION src/ tools/` must be empty when you return.
- The 👤 line (iPad plus laptop app window, from `planbook.hwgteach.com`, not localhost) stays `- [ ]`. Add its reading to `TESTING.md` § WO-8.17 for the owner.

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

1. In the harness, bringing the page back to `visible` calls `registration.update()`, and a second return within the throttle window does not. Mutation-proved: removing the listener turns the check red.
2. In the harness, a `controllerchange` that replaces a controller while the page is running shows the notice, and a first install (a page that booted uncontrolled) does not, which is WO-8.11's trap arriving at a second reader.
3. The reload control flushes the store before it reloads, asserted in the harness.
4. 👤 On the installed iPad and in a laptop app window installed from `planbook.hwgteach.com`: with the app left open, deploy a `CACHE` bump, switch away and back, and the notice appears without a force-quit. Tapping it lands on the new build, and About reads the new version with no amber line.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

