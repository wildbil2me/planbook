# Phase 1 work orders — Shell, store, roster

**Phase goal:** the app installs, holds data, survives everything, and can hand that data back.

Branch: `phase/1-shell-store-roster`. Read [`../ROADMAP.md`](../ROADMAP.md) Phase 1 and
[`../../docs/data-model.md`](../../docs/data-model.md) before starting anything here.

**The ordering rule for this phase:** WO-1.5 (backup & restore) lands before WO-1.6 and everything
after it. No feature that writes student data ships before the path that gets it back out.

---

## WO-1.1 — Repo skeleton & docs spine

**Ship** 1 · **Status** ✅ DONE — 2026-08-04 · **Size** S · **Depends on** nothing · **Blocks** everything
**Closes roadmap** Phase 1 → "Start `TESTING.md` and `CHANGELOG.md`"

**Why it exists.** The maintenance protocol demands a testing checklist and a changelog from the
very first ticked box, so they cannot wait for Phase 8. Git isn't initialized yet either, and the
first commit is the cheapest one to get the conventions right in.

**Deliverables**
- `git init`; integration branch `main`; first phase branch `phase/1-shell-store-roster`.
- File layout, flat and buildless: `index.html`, `sw.js`, `manifest.webmanifest`, `src/`,
  `design/`, `docs/`, `plans/`, `tools/`. No `package.json`, no `node_modules`.
- `TESTING.md` — sections keyed to phases, an environment header (desktop browser + a real iPad),
  and the Phase 1 checks as they arrive. Model it on Roll Call!'s `plans/TESTING.md`.
- `CHANGELOG.md` — Keep-a-Changelog shape, `## [Unreleased]` at the top, first entry written.
- `.gitignore` — at minimum OS cruft and any local scratch. Nothing to ignore from a build, by design.

**Out of scope** — any app code, any styling. This is the container.

**Acceptance**
- [x] `git log` shows a first commit on `main` and a phase branch cut from it.
- [x] `TESTING.md` exists with an environment section naming iPad Safari explicitly.
- [x] `CHANGELOG.md` exists with `## [Unreleased]` and one real entry.
- [x] No dependency manifest of any kind exists in the repo.

**Traps** — Don't create a `package.json` "just for scripts." That is how a bundler arrives six
weeks later. Anything scripted lives in `tools/*.mjs` and runs under bare Node.

---

## WO-1.2 — App shell & design frame

**Ship** 1 · **Status** ✅ DONE — 2026-08-04 · **Size** M · **Depends on** WO-1.1
**Closes roadmap** Phase 1 → "Lift the frame from Roll Call!'s `design/starter-template.html`…"

**Why it exists.** Every visible element in this app comes from the suite design system. Hand-
designing a second visual language costs weeks and produces something that looks like a different
product. Roll Call!'s `design/portable-components.md` exists precisely so this is a lift, not a
design exercise.

**Reference:** `C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App` →
`design/starter-template.html`, `design/portable-components.md`, and this repo's
[`../../design/style-guide.md`](../../design/style-guide.md).

**Deliverables**
- Two-row header with the navy gradient
  (`linear-gradient(135deg, #0d2137 0%, #1a3c5e 60%, #2a2a6e 100%)`), page background `#f0f2f5`,
  white rounded panels at 14px radius with `0 1px 4px rgba(0,0,0,0.07)`.
- The modal system: scrim `rgba(0,0,0,0.5)`, gradient modal header, `srIn` entrance, escape and
  backdrop close, focus trapped.
- Save indicator chip with its five states (saving / saved / error / syncing / retry) — wired to
  nothing yet, driven by a stub.
- `announce()` helper into an `aria-live` region; `.sr-only` utility.
- The `@media (pointer: coarse)` block established with the 44px rule, plus the 1024px and 640px
  breakpoints, in the declaration order the style guide names.
- iOS chrome: viewport meta with `maximum-scale=1.0`, `apple-mobile-web-app-capable`,
  `env(safe-area-inset-*)` padding, `overscroll-behavior-y: contain`, `touch-action: manipulation`
  on tappables.
- Rename everything to Planbook; `localStorage` prefix `planbook_`.

**Out of scope** — any data, any real screen. This is chrome and a component shelf.

**Acceptance**
- [x] Colors match `design/style-guide.md` literally, declared inline — no CSS variables.
- [x] No dark-mode rules exist anywhere: no `prefers-color-scheme`, no `[data-theme]`.
- [x] A modal opens, traps focus, closes on Escape and on backdrop click, and returns focus to
      the element that opened it.
- [x] `:focus-visible { outline: 2px solid #5b6fcc; outline-offset: 2px; }` is global and no rule
      removes an outline anywhere.
- [x] On an iPad, no control is under 44px and nothing sits under the safe-area inset.
      *(iPadOS 26.5.2. The safe-area half is not yet a real check — no `viewport-fit=cover`, so the
      insets resolve to 0 on iOS. WO-1.3 owns that and re-runs this. See `TESTING.md`.)*
- [x] No `planbook_` key holds anything but a UI preference.

**Traps** — The style guide's "colors inline, not CSS variables" reads like a mistake and is not.
Don't tidy it. Light theme only means the dark header *is* the light theme, not a dark variant.

---

## WO-1.3 — PWA install path & eviction warning

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.2
**Closes roadmap** Phase 1 → "PWA shell: manifest, service worker…" and "Install detection +
plain-language warning…"

**Why it exists.** iOS Safari evicts IndexedDB after ~7 days of non-use for ordinary websites.
Home-screen-installed PWAs are exempt. A teacher who bookmarks Planbook instead of installing it
can lose a term of grades over a holiday. **The install prompt is data safety, not a nicety** —
which is why detection and the warning ship in the same work order as the manifest rather than
being a polish item later.

**Deliverables**
- `manifest.webmanifest`: name, short name, `display: standalone`, theme/background colors from the
  palette, icon set including the sizes iOS actually uses.
- `sw.js`: precache the app shell, cache-first for shell assets, network-first for nothing (there
  is no network dependency). Versioned cache name, old caches deleted on `activate`.
- Offline: full app function with the network off, once installed.
- Install detection via `display-mode: standalone` / `navigator.standalone`, and a persistent,
  dismissible-but-returning banner when running uninstalled.
- The warning copy itself, in plain teacher language: what can be lost, why, and the exact steps to
  install on iPad Safari (Share → Add to Home Screen). Suite voice — say what happened and what to
  do next.

**Out of scope** — an install-prompt UI for Chrome's `beforeinstallprompt` is welcome but optional;
iPad is the target that matters.

**Acceptance**
- [ ] Installs to the iPad home screen from Safari and launches without browser chrome.
- [ ] With the network disabled, the installed app opens and every built screen works.
- [ ] Run uninstalled in Safari: the warning appears, names the risk in plain language, and gives
      the install steps.
- [ ] Run installed: the warning does not appear.
- [ ] Deploying a new version updates the service worker and clears the previous cache.
- [ ] Verified on a real iPad, not a desktop emulator. *(This one cannot be faked — record the
      iPadOS version in `TESTING.md`.)*

**Traps** — The service worker won't register from `file://`; you need a static server locally.
Don't cache the year document in the service worker — IndexedDB owns data, the cache owns the shell.

---

## WO-1.4 — Year document store

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.3
**Closes roadmap** Phase 1 → "IndexedDB store: one year document, load-on-open, save-on-change,
`rev` increment."

**Why it exists.** The whole year is one JSON document of a few megabytes — it loads into memory in
well under a second, so every query is a plain array operation and there is no query layer to build.
It is also what makes whole-document last-writer-wins sync sound rather than lazy.

**Reference:** [`../../docs/data-model.md`](../../docs/data-model.md) — the document shape is
settled, implement it as written.

**Deliverables**
- IndexedDB wrapper: one object store keyed by year, one record per year document.
- `newYearDocument()` producing a valid empty document with `schemaVersion: 1`, a generated `docId`
  and `deviceId`.
- Load-on-open, save-on-change with debounce; every save bumps `rev` and sets `updatedAt`.
- The save indicator from WO-1.2 wired to real save state, including the error state.
- A migration hook keyed on `schemaVersion` — empty today, present so that adding one later isn't
  a refactor.
- Year switching: create a new year, list years, open one. The roster turns over every year and
  nothing may assume a fixed class list.

**Out of scope** — sync, conflict handling, anything touching Drive. Phase 7.

**Acceptance**
- [ ] A change persists across a full reload, and across an app relaunch on iPad.
- [ ] `rev` increases by exactly one per save; two rapid edits inside the debounce window are one
      save and one `rev`.
- [ ] A save failure surfaces the error state on the indicator and does not silently swallow.
- [ ] Two year documents coexist; switching between them shows the right data.
- [ ] A document written before a schema bump loads through the migration hook without loss.

**Traps** — Don't split the document into multiple object stores for "efficiency." The single-
document shape is the sync design; splitting it quietly removes the property that makes sync
correct. Debounce saves, but flush on `visibilitychange` — iOS kills backgrounded tabs.

---

## WO-1.5 — Backup & restore

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.4
**Blocks** WO-1.6 and every work order after it
**Closes roadmap** Phase 1 → "Backup: one-click JSON download…" and "Restore: drop a backup file…"

**Why it exists.** This is the gate. *No feature that writes student data lands before the path
that gets it back out.* A file the teacher holds is the only recovery path that survives eviction,
a wiped browser, and a dead laptop — sync is not a backup, because Drive holds one live copy that
sync will happily overwrite.

**Deliverables**
- One-click download of the year document as plain JSON, filename carrying the year and the date.
- Last-backup timestamp in `planbook_` (a UI fact, not student data), and a nag when it's over
  7 days old — visible enough to act on, not modal enough to train dismissal.
- Restore: a file input *and* a drop target, reading a backup file back in.
- A confirm step that **names what is being replaced** — the year, the class count, the student
  count, and the date of the document being overwritten versus the one coming in.
- Backup UI copy stating plainly that the file contains accommodation and medical data, because
  from WO-1.8 it will.

**Out of scope** — automatic scheduled backups (no background execution exists), and Drive.

**Acceptance**
- [ ] Download → wipe browser storage → restore: the document is byte-identical in content.
- [ ] The restore confirm names the outgoing document and the incoming one, with counts, before
      anything is replaced.
- [ ] Cancelling the confirm leaves the existing document untouched.
- [ ] A malformed or non-Planbook JSON file is refused with a message saying what was wrong, and
      does not partially apply.
- [ ] A backup from a different `schemaVersion` either migrates or refuses — never half-loads.
- [ ] The nag appears when the last backup is >7 days old and clears on a successful download.
- [ ] The backup UI says what sensitive data the file contains.

**Traps** — Restore is the most destructive operation in the app. Never restore into the open
document in place; build the new document, validate it, then swap. A restore that fails halfway is
worse than no restore.

---

## WO-1.6 — Classes & terms

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.5
**Closes roadmap** Phase 1 → "Class management: create/rename/reorder five-plus classes; term
structure per class."

**Why it exists.** Five classes, reachable at a touch, is the owner's founding requirement. Terms
are per class and configurable because the five classes differ and because the app must be sellable
to a teacher on semesters or trimesters.

**Deliverables**
- Create, rename, reorder, and archive classes. Reorder is what makes "one tap to any class" work.
- Per-class term structure: add/rename/date terms. Quarters, semesters, trimesters, or one term.
- A term picker in the header that every later screen reads from.
- Sensible defaults on first run that are trivially editable — never hardcoded `Q1`–`Q4`.

**Out of scope** — categories and weights (WO-3.1); anything grade-shaped.

**Acceptance**
- [ ] Six classes can be created, reordered by drag or by explicit up/down controls, and renamed.
- [ ] Two classes in the same document can have different term structures, and both work.
- [ ] A class can be given a single year-long term.
- [ ] Term dates can overlap or leave gaps without the app breaking — real calendars are messy.
- [ ] Deleting a class warns about the attendance and grade data it takes with it, and can be
      cancelled.

**Traps** — Never write `Q1` as a literal anywhere outside seed data. The term id is opaque.

---

## WO-1.7 — Roster & contacts

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.6
**Closes roadmap** Phase 1 → "Roster: paste `Last, First`; guardian, counselor, and email fields."

**Why it exists.** The school's SIS has no usable export, so rosters are pasted. That is the
supported path, not a fallback — don't design around a sync that cannot exist. Contacts live on the
roster because Phase 5's audience picker reads them from here.

**Deliverables**
- Paste box accepting `Last, First` per line, tolerant of `First Last`, extra whitespace, tabs, and
  a trailing blank line. Preview before commit; say how many will be added.
- Student fields per [`../../docs/data-model.md`](../../docs/data-model.md): first, last, nickname,
  gradYear, email, notes.
- Guardians (repeatable): name, relation, email, phone, language, preferred flag.
- Counselor: name, email.
- Add, edit, remove, and move a student between classes. A student belongs to the document; classes
  hold roster id lists.
- Teacher settings: name, school, email, admin email, default-cc flag.

**Out of scope** — `supports` / accommodations (WO-1.8), the Roll Call! importer (WO-2.7).

**Acceptance**
- [ ] Pasting 25 names produces 25 students with names split correctly, and the preview matched.
- [ ] Re-pasting the same list warns about duplicates rather than silently doubling the roster.
- [ ] A student added to two classes is one student record with one set of contacts.
- [ ] Removing a student from a class does not delete the student from the other class.
- [ ] Guardian, counselor, and student emails round-trip through save and reload.

**Traps** — `Last, First` and `First Last` both appear in real paste sources. Detect per line, and
show the split in the preview so a wrong guess is caught before it commits, not after.

---

## WO-1.8 — Accommodations on the roster

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.7
**Closes roadmap** Phase 1 → "Accommodations on the roster."

**Why it exists.** A teacher is legally obligated to implement accommodations from day one, which
is why the *fields* are Ship 1 even though the contextual prompts (WO-3.8) are Ship 2. This is also
the most consequential data in the app if it leaks — read
[`../../docs/data-model.md`](../../docs/data-model.md) § Accommodations before writing any of it.

**Deliverables**
- `students[].supports` exactly as the data model specifies: `plan` (IEP/504/ELL/none),
  `caseManager` {name, email}, `reviewDate`, `accommodations[]` {kind, detail, appliesTo},
  `medical`, `behaviorPlan`.
- An editor for it, reachable from the student record and clearly separated from ordinary fields.
- `kind` from the enumerated list plus `other` with free text. `appliesTo` empty means everything.
- Discreet display baseline: on any list view the default state is **not showing it** — a dot
  beside the name, details on deliberate tap. (The global toggle is WO-1.9.)
- The backup copy from WO-1.5 updated if it isn't already accurate.

**Out of scope** — surfacing at point of use (WO-3.8), calendar surfacing of `reviewDate` (WO-6.1).

**Acceptance**
- [ ] Every field in the data model's `supports` block is editable and round-trips.
- [ ] No list view shows plan status, accommodation detail, medical, or behavior text without a
      deliberate tap.
- [ ] The indicator dot does not itself encode the plan type by color or shape — a projected dot
      that means "IEP" is still a disclosure.
- [ ] `reviewDate` is stored and readable, whether or not anything consumes it yet.
- [ ] The backup UI names accommodation and medical data as present in the file.

**Traps** — It is tempting to show the accommodation list inline on the roster "because the teacher
needs it." That screen gets projected. Discreet by default is not a preference setting.

---

## WO-1.9 — Presentation mode

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** S · 🚩 · **Depends on** WO-1.8
**Closes roadmap** Phase 1 → "Presentation mode."

**Why it exists.** Teachers project attendance and gradebook screens onto classroom walls. IEP
status on that wall is a disclosure to thirty students. One global toggle, hit before you plug in
the projector, that suppresses every sensitive field at once — because remembering which screens are
safe is not a plan.

**Deliverables**
- A global toggle in the header, one tap, obviously on when it's on (persistent visual state, not a
  checkbox buried in Settings).
- When on: every `supports` field, indicator dot, medical note, behavior plan, and case manager is
  suppressed app-wide — including inside modals, print output, and anything Phase 4 and 6 later add.
- The suppression is implemented **at the render helper**, not per screen, so screens built later
  inherit it by default rather than by remembering.
- State stored in `planbook_` (a UI preference), and it survives reload — a teacher who turned it on
  before first period should not find it off after lunch.

**Out of scope** — hiding grades or names. Presentation mode protects `supports`, not the gradebook.

**Acceptance**
- [ ] With it on, no screen in the app displays plan, accommodation, medical, behavior, or case
      manager data — verified by walking every built screen.
- [ ] The toggle state is visible without hunting for it.
- [ ] It survives a reload and an app relaunch.
- [ ] A screen added after this work order inherits suppression without touching the toggle code.
      *(Re-verify this claim at every later phase; it is the whole reason for the render-helper
      approach.)*

**Traps** — Per-screen conditionals will pass this work order and fail in Phase 4, when a signal
card quotes a behavior note. Build the choke point.

---

## WO-1.10 — Home screen v0

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.6
**Closes roadmap** Phase 1 → "Home screen v0: every class in one tap."

**Why it exists.** Every class reachable in one tap is the owner's founding requirement. This screen
**accretes** through every later phase and becomes Phase 6's glance page — which is why it is built
now and grown, rather than built twice.

**Deliverables**
- All classes on one screen, each a card, each one tap from anything the class needs.
- The card is a slot, not a fixed layout: it renders a class name and reserves the space that
  Phase 2's today-state, Phase 3's ungraded count, and Phase 4's attention count will fill.
- Header: current term, teacher name, presentation-mode toggle, save indicator, backup nag.
- An honest empty state on a fresh document that leads to creating the first class.
- **Re-point `tools/verify-shell.mjs` at this screen.** Replacing `<main>` deletes the WO-1.2
  component shelf and with it `#aboutModal`, `[data-modal-open]`, and the `window.planbook`
  console seam — every fixture the script's modal, live-region, and preference checks depend on.
  They degrade to announced `SKIP`s rather than false passes, which is correct and still
  worthless: a run that is mostly skips proves nothing. Point them at a real modal and real
  controls in the same commit that removes the shelf. Read
  [`../verification-tooling.md`](../verification-tooling.md) first — the script is deliberately
  one file and stays one file.

**Out of scope** — anything that glances at data that doesn't exist yet. Do not stub fake counts.
Do not grow the verification script beyond re-pointing it; new kinds of check are a conversation,
not a refactor.

**Acceptance**
- [ ] Six classes fit on an iPad screen in portrait without scrolling, at 44px+ touch targets.
- [ ] Every class is exactly one tap from the home screen.
- [ ] A fresh document shows a real empty state, not five blank cards.
- [ ] Adding the Phase 2 today-state line requires touching only the card renderer.
- [ ] `node tools/verify-shell.mjs` runs against this screen with **no `SKIP` caused by a deleted
      shelf fixture**, and its check count has not fallen.

**Traps** — Don't build the Phase 6 glance page here. Build the *frame* that accretes into it. The
roadmap is explicit: build the glance page before the things it glances at and you build it twice.
