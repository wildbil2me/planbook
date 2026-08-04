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

### Changed

- **`verify-shell.mjs` is 2,232 lines against a soft cap of ~950, and the conversation that owes is
  overdue.** `plans/verification-tooling.md` says crossing the cap is "a conversation, not a
  refactor" and that the number is "a prompt to look, not a budget to spend." Nobody has looked since
  WO-1.4. The file went 851 → 1,364 at WO-1.5, → 1,429 at the per-year nag fix, and **1,429 → 2,232
  at WO-1.6** — the largest single jump it has taken, and larger than the whole file was three work
  orders ago. Splitting is still forbidden by a stronger rule that is still load-bearing, so the
  options are raise, trim, or retire a control that has not bound in three consecutive work orders.
  Recorded rather than decided; the number in that document was itself stale, which is how a cap
  stops being one.

### Fixed

- **Four defects in the class bar and the term editor, found by the first iPad sitting and by the
  checks written for it.** Two were visible on the tablet; two were not, and came out of checks
  added for the first pair.

  **A term date, once cleared, would not accept the same date again.** The iPadOS date popover keeps
  its own selection separate from the field's value, so clearing a field holding 9/4 leaves the
  calendar still showing the 4th selected — and tapping it again changes nothing the picker will
  report. The workaround a teacher finds is to tap the 3rd and come back, which is worse than an
  annoyance: it writes a date she never chose into the year document on the way past. A cleared date
  field is now discarded and rebuilt, since a fresh element carries no picker state. The rebuild is
  bound to `change` rather than `input`, because a date field reads as empty while a date is being
  typed and rebuilding there would replace the element under the caret — there is a check for each
  half, and each fails without its fix.

  **Class tabs were squeezed narrower than their own labels**, which then wrapped across the rounded
  background and past its edge. They are ordinary flex items in a strip that scrolls, and a flex
  item shrinks by default; at 390px this was an 85px label inside a 44px button. They no longer
  shrink, so the overflow goes where it was always meant to — the strip's own scroll — and a
  `max-width` with an ellipsis stops one very long class name from pushing every other tab out of
  reach.

  **The open class was never scrolled back into view.** Replacing a scroller's children resets
  `scrollLeft`, and the bar is rebuilt on every change, so a teacher whose class was fifth of six
  got a header scrolled to the left with no tab on it looking selected — which reads as the app
  having forgotten which class she was in. The strip's own `scrollLeft` is corrected after each
  rebuild, rather than `scrollIntoView`, which would also be free to scroll every ancestor.

  **At 390px the class strip measured zero pixels wide** — the entire bar, tabs and all. `flex: 1`
  means a flex-basis of 0, and an over-full flex row distributes shrinking in proportion to basis,
  so a strip with basis 0 beside a term nav sized from its content shrank by nothing and simply
  stayed at nothing. Both strips are now sized from their content with a floor under each. This one
  shipped in the work order as delivered and was **not findable on the hardware it affects**: an
  iPad in portrait is wider than the width where it happens.

  `verify-shell.mjs` is 130 of 130, up from a baseline of 82 — a number the phase file and
  `TESTING.md` both recorded as 79 until it was re-counted by extracting `HEAD` into a scratch tree
  and running there. A remembered count is not a count.

- **The backup nag no longer goes quiet for a year that was never backed up.** `lastBackupAt` was
  one timestamp for the whole browser, so downloading the open year marked every other year on the
  device as backed up too. A teacher part-way through a rollover — 2027-2028 started, 2026-2027 kept
  for reporting she has not finished — could download one, watch the strip disappear, and reasonably
  read that as "Planbook is backed up." The strip is the only thing standing between a set-aside year
  and silence, and a warning that silences itself for the year you did not save is worse than no
  warning, because it also answers the question.

  The preference is now a map of year to timestamp, the nag asks about the **open** year and names
  it, and a year switch joins boot, backup and restore as a moment the answer is re-evaluated. Still
  per-browser underneath: a file downloaded on the laptop does nothing for the iPad whose storage
  iOS will evict. A device holding the old bare-number value reads as "no year has been backed up",
  which nags once too often rather than once too few — the only direction a data-safety default may
  round.

  The backup panel also names any year on the device that has never been downloaded, because the nag
  only fires on the year that is open: a teacher who never switches back was otherwise never told.
  Backing every year up in one tap is WO-1.11; this is the half that stops the gap from being
  silent, which is the half that matters.

  `verify-shell.mjs` gains the check that would have caught it — one year is exactly the case where
  this bug is invisible, so it drives two — and is now 82 of 82.

### Added

- **Four scripts for the dispatch pipeline, and a measurement that says why they exist.** Six work
  orders have gone through the orchestrator → implementer → verifier chain, and the transcripts put
  a number on what that costs: **549,554 output tokens of implementation, 100,472 of orchestration,
  178,902 of verification** — a 51% premium over implementation alone. Most of the premium buys
  something real. One prevented a bricked install: WO-1.4's verifier caught two new modules missing
  from `sw.js`'s precache, which would have meant an installed iPad that could not open offline and
  would never receive the build. Thirteen sessions have run with zero compactions, because the
  implementer's context is discarded rather than accumulated into the conversation.

  But three parts of it were waste, and all three were the same kind: **work that was re-derived
  from prose every single run.** `tools/wo-gate.mjs` parses the work order header line — status,
  size, `Depends on`, the `🔒 GATED` and WO-1.5-before-WO-1.6 checks — which the orchestrator was
  doing in eight to thirteen tool calls plus the reasoning to interpret them. `tools/wo-brief.mjs`
  assembles the verbatim two-thirds of a brief: the work order, the constraints block from
  `ROUTING.md`, the referenced files, the acceptance list restated. WO-1.5's brief was 15 KB of
  largely-existing text against 14,629 output tokens spent producing it. `tools/wo-sweep.mjs` runs
  the standing sweep as greps, **with its allowlists written down** — WO-1.2's verifier had to
  reason out from scratch that every `prefers-color-scheme` hit in the repo was documentation
  stating the prohibition, and every verifier since would have had to do it again.

  `tools/wo-cost.mjs` is the fourth, and it is the one that names the pattern. The analysis above
  was rebuilt from scratch four times in one afternoon, in a scratchpad, and thrown away each time —
  which is exactly how two throwaway browser harnesses preceded `verify-shell.mjs`. It prints
  orchestration output per dispatch as a trend, because that is the number that grows on its own:
  **6,965 → 15,561 → 11,985 → 20,507 → 14,629 → 30,825**. WO-1.6's orchestration cost more than the
  entire WO-1.1 dispatch.

  **`wo-gate.mjs --tick` is the only one that writes**, and only into `plans/`. It sets the work
  order status, ticks the roadmap boxes named in `Closes roadmap`, and **recomputes** the dashboard
  counts and progress bar from the phase files rather than trusting the number already sitting
  there. It refuses a work order that is not open, refuses to run without an explicit ID, prints the
  exact diff under `--dry-run`, and never touches a 👤 line or `CHANGELOG.md` — those stay owed to a
  human, which is the whole reason the mark exists.

  The sweep adds a third state beside pass and fail: **`REVIEW`, for greppable evidence that needs a
  human decision.** Whether a mention of `supports` in a file actually *emits* accommodation data is
  a reading question, and a check that guessed would either cry wolf on the roster editor or wave
  through the one line that matters. A `REVIEW` never fails the run; it narrows what the verifier
  must read instead of pretending to have decided it.

- **The scars moved out of the agent definitions** into `plans/dispatch-retro.md`, read when a step
  fails rather than on every dispatch. `work-order-orchestrator.md` had grown 169 → 274 lines in a
  single day, one retrospective paragraph at a time, and every dispatch paid to read all of them.
  The rule for the move: **the imperative stays, only the narrative goes.** "`--summary` is a boolean
  and takes no value" is an instruction and stayed put; the three paragraphs on how that was
  discovered are now next door. It came to 201 lines, not the ~120 aimed for — what is left is
  procedure, and cutting further would have meant cutting instructions to hit a number.

- **The Codex probe is a real write now, not a health report.** `codex doctor` reported
  `16 ok · 0 fail · sandbox ✓` six minutes before WO-1.6's `codex exec` exited **zero** having
  written nothing — `codex-windows-sandbox-setup.exe: program not found`, 31 helper failures. Doctor
  reports *installation* health; a dispatch depends on *exec-time helper* health, and only the second
  one matters. So the gate is a `codex exec` that creates a file in a temp directory under the real
  sandbox flags, checked for existence. It exercises helper spawn and `apply_patch`, which is what
  failed both times.

  **Codex is 0 for 2** — WO-1.4 and WO-1.6, both routed correctly by the rubric, both dead at exec
  time, neither producing a line of code. `ROUTING.md` records that as a transient condition rather
  than a standing fact about the machine, because doctor was healthy afterwards both times. If a
  third fails, the orchestrator proposes moving the pre-routed table to Claude until one run lands.
  The smoke test itself is **unexercised**: it needs a working sandbox, and the sandbox is the broken
  thing.

- **The verifier now has to name the fixture assumption.** For each surface a work order adds:
  *what would have to be true of the test fixture for a bug here to be invisible, and does the
  harness break it?* This is the question that would have caught all three defects that escaped a
  green run. The backup nag shipped with `lastBackupAt` as one browser-wide timestamp against a
  fixture holding **one year** — precisely the case where that bug cannot manifest, with 79 checks
  green. A green run over a fixture that cannot express the failure is not evidence.

  The same discipline was applied to the sweep's own checks while writing them. The coarse-block
  check first reported an empty block on a stylesheet with fifty rules in it, because `findIndex`
  matched a header comment discussing `` `@media (pointer: coarse)` `` in backticks twenty lines in
  — a green-looking wrong answer. Every check was then run against a planted violation and confirmed
  to fail, including inside an inline `<style>` block, and against a control (`<!--note: x-->`)
  confirming it does not fire on markup that only looks like CSS.

- **Classes and terms — the first screen that writes to a year document.** Create, rename, reorder,
  archive and delete classes; give each its own term structure. The class tabs and the term nav in
  the header are live, and every later screen reads which class and which term are open from here.

  **Reorder is explicit up/down arrows, not drag.** The tab strip scrolls, and a drag handle on a
  scrolling strip fights the scroll on a tablet — the gesture that reorders and the gesture that
  scrolls are the same one. Arrows are also measurable by the 44px pass, and they carry `min-width`
  as well as `min-height`, because a one-glyph button 44px tall and 30px wide is half a touch
  target.

  **Archive and delete are different operations, and delete is offered only on an archived row.**
  Archiving keeps every attendance record, assignment and score and only takes the class off the
  bar; deleting destroys them. So getting a class out of the way is one tap that costs nothing, and
  destroying a term of attendance is two taps and a dialog that counts what goes — read off the open
  document, never from a specimen. Cancelling leaves `rev` unmoved, which is the check that proves
  nothing was written.

  **Term dates are labels on a range and nothing else.** They are never sorted, never repaired,
  never checked for gaps or overlaps, never used to decide which term is current, and an empty date
  is valid — a teacher setting up in August has not been given the school calendar yet, and a term
  she cannot create until she has it is a term she creates wrong. There is no `min`, no `max`, no
  `required`, no `.sort(` and no `new Date` in `src/classes.js`, and a check asserts that absence.
  This is `plans/rotating-schedule.md` staying deleted: the moment anything validates these into a
  contiguous calendar, the app has a schedule model again.

  Term ids are opaque (`tm_…`) and no code anywhere reads meaning out of a term label. Seed
  structures use whole words a teacher edits — "Quarter 1", not `Q1` — and a check sweeps the source
  for the literal.

- **The teacher can get the year back out, and back in** (WO-1.5). One tap downloads the open year
  as plain JSON, named for the year and the date; a file input and a drop target read one back.
  This is the gate the whole phase was ordered around — *no feature that writes student data lands
  before the path that gets it back out* — and it is open. WO-1.6 onward may now create data.

  **A file the teacher holds is the only recovery path that survives everything.** Not the browser,
  which iOS empties after about a week of an uninstalled site; not the laptop; and specifically not
  sync, because Drive holds one live copy that sync will happily overwrite. Sync is not a backup and
  never becomes one, which is why this shipped in Phase 1 rather than as a Phase 8 formality.

  **The restore confirm names both documents before anything is replaced** — the year, the class and
  student counts, and when each was last saved, outgoing beside incoming. The outgoing side is read
  raw off disk rather than from the open document, so it can also describe a document `boot()`
  refuses; the whole point of that path is that the app could not open the thing being replaced. A
  restore replaces the year named in the file rather than the year on screen, and says so in a
  separate line whenever those differ, because renaming the incoming document to the open year would
  fold two years of grades into one record.

  **Nothing is written until a validated document exists in memory.** The migration ladder runs
  first — so an older backup is legitimately allowed to be missing whatever a later version added —
  then the shape check, then the swap. Six kinds of bad file were driven through it: empty,
  truncated, a shopping list, a newer `schemaVersion`, a document with its `students` deleted, and
  one with `students` as a string. Each is refused by its own fault rather than a generic message,
  and each says *"Nothing on this device has been changed."* A restore that fails halfway is worse
  than no restore.

  **`rev` continues this device's count instead of reverting to the file's.** A restored document
  takes `max(this device's rev for that year, the file's rev) + 1`, so `rev` never moves backwards
  for a year on a device and Phase 7 can never compare against a version that existed nowhere. The
  consequence is deliberate: restoring a two-week-old file legitimately supersedes the Drive copy
  rather than quietly losing to it. Everything the teacher typed, `docId` included, comes back
  exactly.

  **The nag appears after seven days and goes down when a backup is taken** — and does not appear at
  all for a document holding nothing the teacher typed. Nagging about an empty gradebook on day one
  is how a warning becomes wallpaper, and this one has no snooze, because the way to clear it is the
  button beside it and a snooze here is a snooze on the only copy of a term of grades.

  **The backup panel says what is in the file, in the teacher's words.** Accommodations, IEP and 504
  plans, medical needs, behavior plans — named, plus that the file is plain text and should be kept
  like a paper folder rather than emailed. The file is genuinely unfiltered, and there is now a check
  asserting the sensitive fields are still in the downloaded bytes, so no later work order can
  quietly strip them "for safety" and leave a backup that does not bring the gradebook back.

  **The boot-failure screen has an exit.** WO-1.4 made `boot()` hold the loading screen up rather
  than reveal a gradebook it cannot write to, which was right and left the teacher nowhere to go.
  Restore *is* the way out, so it is reachable from that screen — over the top of it — and the
  download button beside it reads "Nothing open to back up" and is disabled, because a button that
  fails on tap is worse than one that says why it can't.

  The file is pretty-printed at some cost in size. It is the artifact a teacher opens when everything
  else has gone wrong, sometimes in a text editor to prove her students are still in there, and one
  four-megabyte line proves nothing.

  Verified on iPadOS 26.5.2 on an iPad (A16), installed to the home screen: the download lands in
  Files → On My iPad and opens readable with the roster in it, the JSON is selectable in the picker
  rather than greyed out, a drag out of Files in Split View reaches the confirm, a cancel leaves the
  year alone, and the boot-failure screen's restore button was staged and tapped on a real screen.
  `tools/verify-shell.mjs` is now 79 of 79.

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
