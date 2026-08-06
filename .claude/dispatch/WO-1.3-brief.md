# Brief — WO-1.3 PWA install path & eviction warning

**Route:** Claude (`work-order-implementer`)
**Branch:** `phase/1-shell-store-roster` (already checked out — work on it, do not cut a new branch)
**Write your report to `.claude/dispatch/WO-1.3-result.md` as your last act.**

---

## 1. The work order, verbatim

> ## WO-1.3 — PWA install path & eviction warning
>
> **Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.2
> **Closes roadmap** Phase 1 → "PWA shell: manifest, service worker…" and "Install detection +
> plain-language warning…"
>
> **Why it exists.** iOS Safari evicts IndexedDB after ~7 days of non-use for ordinary websites.
> Home-screen-installed PWAs are exempt. A teacher who bookmarks Planbook instead of installing it
> can lose a term of grades over a holiday. **The install prompt is data safety, not a nicety** —
> which is why detection and the warning ship in the same work order as the manifest rather than
> being a polish item later.
>
> **Deliverables**
> - `manifest.webmanifest`: name, short name, `display: standalone`, theme/background colors from the
>   palette, icon set including the sizes iOS actually uses.
> - `sw.js`: precache the app shell, cache-first for shell assets, network-first for nothing (there
>   is no network dependency). Versioned cache name, old caches deleted on `activate`.
> - Offline: full app function with the network off, once installed.
> - Install detection via `display-mode: standalone` / `navigator.standalone`, and a persistent,
>   dismissible-but-returning banner when running uninstalled.
> - The warning copy itself, in plain teacher language: what can be lost, why, and the exact steps to
>   install on iPad Safari (Share → Add to Home Screen). Suite voice — say what happened and what to
>   do next.
>
> **Out of scope** — an install-prompt UI for Chrome's `beforeinstallprompt` is welcome but optional;
> iPad is the target that matters.
>
> **Acceptance**
> - [ ] Installs to the iPad home screen from Safari and launches without browser chrome.
> - [ ] With the network disabled, the installed app opens and every built screen works.
> - [ ] Run uninstalled in Safari: the warning appears, names the risk in plain language, and gives
>       the install steps.
> - [ ] Run installed: the warning does not appear.
> - [ ] Deploying a new version updates the service worker and clears the previous cache.
> - [ ] Verified on a real iPad, not a desktop emulator. *(This one cannot be faked — record the
>       iPadOS version in `TESTING.md`.)*
>
> **Traps** — The service worker won't register from `file://`; you need a static server locally.
> Don't cache the year document in the service worker — IndexedDB owns data, the cache owns the shell.

---

## 2. Read these first, before writing anything

Required:

- `CLAUDE.md` — the architecture and the reasoning you must not undo. In particular the four
  "things that will bite," the first of which *is* this work order's reason for existing.
- `plans/work-orders/phase-1-shell-store-roster.md` — WO-1.2's entry above yours, and WO-1.4/1.5
  below it, so you can see what is deliberately left for later.
- `design/style-guide.md` — the palette. `theme_color` and `background_color` come from here, not
  from taste.
- `src/README.md` — the `src/` conventions, and why `sw.js` and `manifest.webmanifest` live at the
  repo root rather than in `src/` (a service worker's scope is its own directory).
- `index.html` — read its header comment. It names exactly what WO-1.2 deliberately left out for
  you: `<link rel="manifest">`, `navigator.serviceWorker.register()`, the icon set, the theme
  colors. Nothing there needs undoing; it needs completing.
- `manifest.webmanifest` and `sw.js` — both are WO-1.1 **placeholders** with comments addressed to
  you. `sw.js` is deliberately inert and registered by nothing. Replace both wholesale; keep the
  reasoning their comments carry where it still applies.
- `src/shell.css`, `src/shell.js`, `src/prefs.js`, `src/live-region.js`, `src/modal.js`,
  `src/save-indicator.js` — the WO-1.2 shell you are extending. Use `prefs.js` for the banner's
  dismiss state and `live-region.js`'s `announce()` where an announcement is warranted.
- `tools/README.md` and `tools/verify-shell.mjs` — **read the `verify-shell` section of
  `tools/README.md` before you consider writing any check of your own.** It documents four CDP traps
  that every agent so far has rediscovered from scratch. Nobody writes a second harness. If this
  work order needs a check the tool cannot make, say so in your report as a proposed follow-up —
  do not write a throwaway script.
- `TESTING.md` — for the shape of the Phase 1 checklist you will be adding lines to. Note WO-1.2's
  entry flagging that `viewport-fit=cover` is absent, so safe-area insets resolve to 0 on iOS, and
  that **WO-1.3 owns that and re-runs the check.** That is yours.

Reference implementation, read-only, for the design system:
`C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App` — its `CLAUDE.md`,
`design/style-guide.md`, `design/portable-components.md`.

---

## 3. Constraints — from `ROUTING.md` → "What every Codex brief must carry", verbatim

These apply to this run in full.

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.

**One documented exception to that last line for this work order.** The Acceptance list itself
requires the iPadOS version be recorded in `TESTING.md`, and the project's standing obligation is
that `TESTING.md` accretes as each work order lands. So: **add your Acceptance lines to `TESTING.md`
as unticked `- [ ]` items**, and mark the ones needing a physical iPad with 👤. Do not tick any of
them, do not touch `CHANGELOG.md`, and do not edit anything under `plans/`.

---

## 4. Notes specific to this work order

**The warning copy is the deliverable that decides whether this work order succeeded.** It is why
this went to Claude rather than Codex. It must say, in a teacher's language and without jargon:
what can be lost (a term of grades), why (iOS clears storage for sites that are not installed after
about a week of not being opened), and the exact steps on iPad Safari (Share → Add to Home Screen).
Suite voice: say what happened and what to do next. No "please note," no scare-styling that trains
dismissal, and no false comfort either — the risk is real and the copy should read like it is.

**"Dismissible-but-returning" is a deliberate design.** A banner that stays dismissed forever fails
the teacher who dismissed it in September and lost October. A banner that cannot be dismissed trains
the eye to skip it. Choose a return interval, and say in your report what you chose and why.

**Icons.** The suite has no icon asset pipeline and no dependencies. `index.html` currently uses an
inline SVG emoji favicon (📓) per `portable-components.md` §1. Getting real PNGs for the sizes iOS
uses without adding a build step is the interesting problem here — solve it in the repo's spirit and
explain the approach in your report. Do not add a dependency or a build step to generate images.

**`viewport-fit=cover`.** WO-1.2 left safe-area insets untested because without `viewport-fit=cover`
they resolve to 0 on iOS. The shell already has the `env(safe-area-inset-*)` padding. This work
order owns turning it on and re-running that check — a standalone PWA on iPad is exactly where it
starts to matter.

**Do not cache the year document.** There is no year document yet (WO-1.4), but the precache list
you write is the pattern every later work order copies. The cache owns the shell; IndexedDB owns
the data.

**Local testing needs a static server** — a service worker will not register from `file://`. Bare
Node only, nothing installed.

**Never widen the work order.** If the right thing to do is outside the Deliverables, put it in your
report as a proposed follow-up work order. Do not just do it.

---

## 5. What "done" means

Report against exactly this list, one line each, marked ✅ done / ❌ not done / 🙋 needs a human
with an iPad. State the evidence for each — the command you ran, the file and line, or why it
cannot be checked from a desk.

1. Installs to the iPad home screen from Safari and launches without browser chrome.
2. With the network disabled, the installed app opens and every built screen works.
3. Run uninstalled in Safari: the warning appears, names the risk in plain language, and gives the
   install steps.
4. Run installed: the warning does not appear.
5. Deploying a new version updates the service worker and clears the previous cache.
6. Verified on a real iPad, not a desktop emulator — iPadOS version recorded in `TESTING.md`.

Also report: every file you created or modified, with paths; what you chose for the banner's return
interval and why; how you solved icons without a build step; anything you found that belongs in a
follow-up work order rather than this one.

Write all of that to `.claude/dispatch/WO-1.3-result.md`.
