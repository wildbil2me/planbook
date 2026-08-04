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

- **The app holds a year of work, and gives it back after the app is closed** (WO-1.4). One JSON
  document per school year in IndexedDB — classes, roster, attendance and grades together — loaded
  when the app opens and written back on a debounce as the teacher works. This is the first work
  order where Planbook keeps anything, and everything after it depends on the document being there
  when the app comes back.

  **One object store, keyed by year, one record per document.** Splitting it across stores would
  read as the efficient choice and would quietly delete the property that makes whole-document
  last-writer-wins sync correct later. The shape is the sync design, not a storage detail.

  **`rev` advances exactly once per save, and is put back when a write never lands.** That second
  half is the part worth stating plainly: a `rev` that moved on a save storage never saw would
  leave memory claiming a version that exists nowhere, and the backup in WO-1.5 and the sync in
  Phase 7 both compare against it. A retry of a failed write is the same save and does not bump
  again.

  **Saves are debounced, and flushed on both `visibilitychange` and `pagehide`.** iOS kills
  backgrounded tabs without warning, and a debounce timer that has not fired dies with the tab —
  a period of grades the teacher already typed, gone with no error and nothing on screen to
  suggest it. Both events are wired because they fire in different situations, and the write lands
  in one to two milliseconds against an eight-hundred-millisecond debounce.

  **A save failure says so.** The indicator from WO-1.2 is wired to real state, and the error names
  the year, says the last change is only in memory, and offers the two causes a teacher can act on
  — storage full, or a private browsing window. Silence was the alternative, and silence here means
  a teacher who believes the grades are saved.

  **Years are switchable, and switching refuses while a change is unsaved.** The roster turns over
  every year and nothing may assume a fixed class list, so creating, listing and opening years is
  in from the start. The picker is its own module (`src/year-picker.js`), keeping `store.js` free
  of the DOM. A migration ladder keyed on `schemaVersion` is present and empty: it refuses a
  document from a newer build and refuses a gap, so adding a step later is not a refactor.

  **If the store cannot open, the loading screen stays up and explains itself** rather than
  revealing a shell that looks like a working gradebook it cannot write to. Showing the teacher a
  gradebook that silently discards what they enter is the worse of the two lies available.

  Verified on iPadOS 26.5.2 on an iPad (A16), installed to the home screen: a year created through
  the picker survived a force-quit and relaunch, and then survived it again with Wi-Fi fully off —
  where a new year could still be created with no network at all, which is the difference between
  a cached shell and a store that genuinely does not need the network.

- **The app installs, and warns the teacher who hasn't installed it** (WO-1.3). A real
  `manifest.webmanifest` — standalone display, palette theme colors, and five committed PNG icons
  drawn by `tools/make-icons.mjs` in the sizes iOS actually reaches for. A service worker that
  precaches the shell under a versioned cache name, serves it cache-first, and deletes every older
  cache on `activate`. The app runs with the network off once it is on the home screen.

  `src/install-banner.js` detects an uninstalled launch through `display-mode: standalone` and
  `navigator.standalone` — the second for the older iPads a school still has in a cart — and
  reveals a banner that says what can be lost and exactly which taps prevent it. The copy lives in
  `index.html` rather than a template literal, because it is the part a teacher actually reads.
  Neither `minimal-ui` nor `fullscreen` counts as installed: a false "you're installed" stops the
  warning and is discovered at the end of a holiday.

  **The banner is dismissible but returns after three days,** and the number is derived rather
  than chosen. It has to be strictly under half the ~7-day eviction window so at least one warning
  always falls between a dismissal and the earliest moment data could be erased. Seven days is the
  intuitive number and exactly the wrong one — the banner would come back the week after the
  grades were already gone.

  `index.html` finally carries `viewport-fit=cover`, with `apple-mobile-web-app-status-bar-style`
  set to `black-translucent`. Until this, the ten `env(safe-area-inset-*)` declarations in
  `src/shell.css` resolved to `0` on iOS and the padding WO-1.2 shipped was inert — WO-1.2's iPad
  tick passed because there were no insets to sit under. `tools/verify-shell.mjs` is now 28 of 28;
  the check that failed by design was this precondition.

  Verified on iPadOS 26.5.2 on an iPad (A16), installed to the home screen: launches without browser
  chrome, opens with the radios off after being swiped out of the app switcher, and the banner
  appears uninstalled and is absent installed. One line is still open — that nothing sits under a
  now-non-zero safe-area inset, which needs a sweep of the edges rather than the status-bar check
  that was run.

- **A local HTTPS server, because `localhost` is a secure context and a LAN address is not.**
  `tools/make-cert.mjs` mints a local CA and a server certificate; `tools/serve-https.mjs` serves
  the repo under it. Both are bare-Node `.mjs` with no dependencies, and `certs/` is gitignored —
  the one thing `tools/` writes that is not committed, because it holds private keys.

  This is not convenience. WO-1.2's iPad pass ran on `http://192.168.50.142:8000`, where a service
  worker cannot register at all — and the failure is invisible, because **Safari's own HTTP cache
  re-serves the pages once the Wi-Fi is off.** The offline check passes and proves only that
  Safari has a cache. The server sends `no-store` on everything so the worker is the only thing
  left that can answer, and it refuses to serve the app over its plain-HTTP port at all: that port
  carries the certificate and the setup page and nothing else, since a working HTTP copy beside
  the HTTPS one is how the wrong port gets tested at nine at night.

  `tools/README.md` documents the four ways this fails closed while saying nothing useful —
  chiefly that installing a root on iOS is not trusting it, and that Safari will let you past the
  interstitial to read a page but never to register a service worker.

- **A verification script, and a fence around it.** `tools/verify-shell.mjs` drives the real page
  in headless Edge or Chrome and measures 28 things a stylesheet review gets wrong — rendered
  geometry, resolved styles, focus movement under dispatched input, runtime storage state. It came
  out of a retrospective on WO-1.2 rather than from a Deliverable, after two agents independently
  built the same throwaway harness and discarded it. Zero dependencies, one `.mjs` run by hand,
  per `tools/README.md`.

  It found one thing immediately: eight rules declare `env(safe-area-inset-*)` while `index.html`
  carries no `viewport-fit=cover`, without which iOS resolves every one of them to `0`. That check
  fails on purpose until WO-1.3 owns the fix. Both the implementer and the verifier had marked
  that acceptance line "needs a real iPad" and stopped there, so the iPad pass succeeded by having
  nothing to test.

  `plans/verification-tooling.md` records why it exists and the rules that keep it a script rather
  than a test framework — one file, no config, gates nothing, closes no checklist box and no 👤
  item ever. `tools/README.md` documents four CDP traps that all present as app defects, two of
  which were diagnosed twice by two different agents before being written down.

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
