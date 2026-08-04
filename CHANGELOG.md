# Changelog

Notable changes to Planbook, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions, once they exist, follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Nothing has been released.** Everything lands under `## [Unreleased]` until the 1.0.0 call,
which is made against the criteria in `plans/ROADMAP.md` → "What 1.0.0 means" rather than on how
finished the app feels.

An entry goes in as the work lands, per the maintenance protocol — a changelog written at the end
records what someone remembered.

## [Unreleased]

### Added

- **App shell and design frame** (WO-1.2). The suite's visual language, lifted from Roll Call!'s
  `design/starter-template.html` and `design/portable-components.md` rather than designed again:
  two-row navy-gradient header, `#f0f2f5` page, white 14px-radius panels, the wash/strong chip
  grammar, ten-color avatar palette, and the inset toolbar. The modal system — scrim, gradient
  header, `srIn` entrance, Escape and backdrop close, focus trapped and returned to whichever
  control opened it. The save-indicator chip with its five states (saving · saved · error ·
  syncing · retry), driven by a stub until WO-1.4 gives it a store. An `announce()` helper into a
  single `aria-live` region, and the `.sr-only` utility. The `@media (pointer: coarse)` touch pass
  with its 44px floor, plus the 1024px and 640px breakpoints in the order `design/style-guide.md`
  §6 declares them. iOS chrome: viewport `maximum-scale=1.0`, `apple-mobile-web-app-capable`,
  `env(safe-area-inset-*)` padding, `overscroll-behavior-y: contain`, and
  `touch-action: manipulation` on every tappable class.

  `src/` gets its first code: `shell.css`, and the modules `shell.js`, `modal.js`,
  `save-indicator.js`, `live-region.js`, `prefs.js`. Handlers are delegated from declarative
  `data-*` hooks rather than inline `onclick` — an inline attribute evaluates in global scope and
  cannot see an ES module's exports, so Roll Call!'s idiom would throw at click time here.
  `prefs.js` is the only code permitted to touch `localStorage`; it owns the `planbook_` prefix and
  refuses any key not declared as a UI preference, which is what keeps student data in IndexedDB by
  construction rather than by discipline. It declares no keys yet.

  `modal.js` takes its opener explicitly instead of reading `document.activeElement`, because
  Safari — desktop and iPadOS both — does not focus a `<button>` when you tap it, so the inferred
  opener is `<body>` and focus returns nowhere. Roll Call! infers it and gets away with it on
  desktop Chrome. The iPad is the device that decides go-live.

  Roll Call!'s sixth save state, `queued`, is deliberately absent: it means "waiting on the Apps
  Script outbox", and Planbook writes to the device it runs on, so a write that has not landed has
  failed rather than queued.

  Verified on iPadOS 26.5.2, installed to the home screen. One gap found and left for WO-1.3: the
  `env(safe-area-inset-*)` padding is declared but inert, because `index.html` carries no
  `viewport-fit=cover` and iOS resolves every inset to `0` without it.

  `<main>` holds a component shelf rather than a screen — every piece of the frame, so it can be
  seen and touched before there is data. Nothing on it is wired to anything and WO-1.10 replaces it.
  Still deliberately absent: the manifest link and service-worker registration (WO-1.3), IndexedDB
  and the year document (WO-1.4).

- **Repo skeleton and docs spine** (WO-1.1). `git init` with integration branch `main` and the
  first phase branch `phase/1-shell-store-roster` cut from the initial commit. The flat,
  buildless file layout: `index.html`, `sw.js`, and `manifest.webmanifest` at the root, plus
  `src/` and `tools/` beside the existing `design/`, `docs/`, and `plans/`. `TESTING.md`, keyed
  to the roadmap's eight phases with an environment header naming desktop and iPad Safari and a
  slot for the iPadOS version. This changelog. A `.gitignore` covering OS cruft and local
  scratch and nothing from a build, because there is no build — and deliberately *not* ignoring
  `package.json` or `node_modules/`, so that one appearing shows up in `git status` instead of
  being hidden.

  `index.html`, `sw.js`, and `manifest.webmanifest` are placeholders that say so in their own
  first lines: WO-1.2 builds the app shell, WO-1.3 the installable offline app. `src/README.md`
  and `tools/README.md` document what belongs in each directory and set the conventions the rest
  of the repo copies — ES modules with relative paths in `src/`, bare-Node `.mjs` scripts in
  `tools/`, no `package.json` in either.

  No app code and no styling ship with this entry. It is the container.
