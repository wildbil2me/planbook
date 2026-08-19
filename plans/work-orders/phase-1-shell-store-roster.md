# Phase 1 work orders — Shell, store, roster

**Phase goal:** the app installs, holds data, survives everything, and can hand that data back.

Read [`../ROADMAP.md`](../ROADMAP.md) Phase 1 and [`../../docs/data-model.md`](../../docs/data-model.md)
before starting anything here. Work lands on `main` — this file opened with a
`Branch: phase/1-shell-store-roster` line until 2026-08-16, as all eight phase files did, and
[`README.md`](README.md) § *How to use one* step 3 says why they went.

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

**Ship** 1 · **Status** ✅ DONE — 2026-08-04 · **Size** M · 🚩 · **Depends on** WO-1.2
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
- [x] Installs to the iPad home screen from Safari and launches without browser chrome.
- [x] With the network disabled, the installed app opens and every built screen works.
- [x] Run uninstalled in Safari: the warning appears, names the risk in plain language, and gives
      the install steps.
- [x] Run installed: the warning does not appear.
- [x] Deploying a new version updates the service worker and clears the previous cache.
- [x] Verified on a real iPad, not a desktop emulator. *(This one cannot be faked — record the
      iPadOS version in `TESTING.md`.)*

*Ticked 2026-08-04, iPadOS 26.5.2 on an iPad (A16), installed to the home screen and served over
HTTPS from `tools/serve-https.mjs`. Line 5 was verified headless; the other five were run by hand
on the tablet in one sitting.*

**Traps** — The service worker won't register from `file://`; you need a static server locally.
Don't cache the year document in the service worker — IndexedDB owns data, the cache owns the shell.

*A third trap, found in the doing and worth more than the two above.* **`localhost` is a secure
context; a LAN address is not.** So the server WO-1.2 used — `python -m http.server` on
`http://192.168.50.142:8000` — cannot register a service worker on the iPad at all, and the
failure is not visible: Safari's own HTTP cache re-serves the pages once the Wi-Fi is off, so the
offline check passes while proving only that Safari has a cache. `tools/make-cert.mjs` and
`tools/serve-https.mjs` exist for this, and send `no-store` on everything so the worker is the
only thing that can answer. Anything after this that tests offline behavior on a device has the
same requirement.

---

## WO-1.4 — Year document store

**Ship** 1 · **Status** ✅ DONE — 2026-08-04 · **Size** M · 🚩 · **Depends on** WO-1.3
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
- [x] A change persists across a full reload, and across an app relaunch on iPad. 👤 *(Reload half
      measured with the server stopped entirely; the relaunch half run by hand on the iPad —
      installed, force-quit from the app switcher, relaunched.)*
- [x] `rev` increases by exactly one per save; two rapid edits inside the debounce window are one
      save and one `rev`.
- [x] A save failure surfaces the error state on the indicator and does not silently swallow.
      *(Forced with a real `DataCloneError`, not a stub. `rev` is put back when the write never
      lands, so memory never claims a version storage does not have.)*
- [x] Two year documents coexist; switching between them shows the right data.
- [x] A document written before a schema bump loads through the migration hook without loss.

**Traps** — Don't split the document into multiple object stores for "efficiency." The single-
document shape is the sync design; splitting it quietly removes the property that makes sync
correct. Debounce saves, but flush on `visibilitychange` — iOS kills backgrounded tabs.

---

## WO-1.5 — Backup & restore

**Ship** 1 · **Status** ✅ DONE — 2026-08-04 · **Size** M · 🚩 · **Depends on** WO-1.4
**Blocks** WO-1.6 and every work order after it — **unblocked as of 2026-08-04**
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
- **A way out of the boot-failure screen.** WO-1.4 made `boot()` refuse a document written by a
  newer build and hold the loading screen up, deliberately — a gradebook that looks like it works
  and silently discards what is typed into it is the worse lie. But there is currently no exit: the
  teacher sees a stuck loading screen and can do nothing. Restore *is* the exit, so it is reachable
  from that screen or it is not really a recovery path. Added 2026-08-04 after WO-1.4's verification.

**Out of scope** — automatic scheduled backups (no background execution exists), and Drive.

**Acceptance**
- [x] Download → wipe browser storage → restore: the document is byte-identical in content.
      *("In content" is load-bearing: `rev` and `updatedAt` move on a restore, by design. The
      restored document takes `max(this device's rev, the file's rev) + 1` so `rev` never goes
      backwards for a year on a device — reasoning at `src/store.js:550-557`.)*
- [x] The restore confirm names the outgoing document and the incoming one, with counts, before
      anything is replaced. *(The outgoing side is read raw off disk, so it also describes a
      document `boot()` refuses.)*
- [x] Cancelling the confirm leaves the existing document untouched.
- [x] A malformed or non-Planbook JSON file is refused with a message saying what was wrong, and
      does not partially apply. *(Six fixtures, six distinct messages, all ending "Nothing on this
      device has been changed.")*
- [x] A backup from a different `schemaVersion` either migrates or refuses — never half-loads.
- [x] The nag appears when the last backup is >7 days old and clears on a successful download.
      *(It stays down for a document holding nothing the teacher typed — nagging about an empty
      gradebook on day one is the dismissal-training this work order warns against.)*
- [x] The backup UI says what sensitive data the file contains. *(And the file genuinely still
      contains it — there is a check asserting the sensitive fields are in the downloaded bytes,
      so a later work order cannot quietly filter them "for safety" without a red run.)*
- [x] A document `boot()` refuses — one from a newer `schemaVersion` — leaves the teacher a
      reachable way to restore from a backup file, rather than a loading screen with no exit.
      *(Download correctly reads "Nothing open to back up" and is disabled in that state.)*

*Verified 2026-08-04. `node tools/verify-shell.mjs` 82/82 (was 54 before this work order), run three
times — this line read "79/79" until WO-1.6 re-ran `HEAD` and counted; the 👤 halves — a real download landing in Files, a real drag out of the Files app, and a
thumb on all of it — run on the iPad the same day. **A restore replaces the year named in the file,
not the year that is open**, and then switches to it; the confirm says so explicitly when they
differ.*

**Traps** — Restore is the most destructive operation in the app. Never restore into the open
document in place; build the new document, validate it, then swap. A restore that fails halfway is
worse than no restore.

---

## WO-1.6 — Classes & terms

**Ship** 1 · **Status** ✅ DONE — 2026-08-04 · **Size** M · 🚩 · **Depends on** WO-1.5
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
- [x] Six classes can be created, reordered by drag or by explicit up/down controls, and renamed.
      *(Up/down controls, not drag: a drag handle on a scrolling strip fights the scroll on a
      tablet, and the arrows are what the 44px pass can measure. They disable at the ends.)*
- [x] Two classes in the same document can have different term structures, and both work.
      *(`Homeroom = ["Full year"]` beside `Period 1 = 4 terms`, in one document.)*
- [x] A class can be given a single year-long term.
- [x] Term dates can overlap or leave gaps without the app breaking — real calendars are messy.
      *(Verified as an **absence**: no `min`, no `max`, no `required`, no `.sort(` and no `new Date`
      anywhere in `src/classes.js`. Nothing validates these into a calendar, which is how
      `plans/rotating-schedule.md`'s deleted schedule model stays deleted.)*
- [x] Deleting a class warns about the attendance and grade data it takes with it, and can be
      cancelled. *(Counts are read off the open document, and delete is offered only on an archived
      row — archiving is the one tap that costs nothing. Cancelling leaves `rev` unmoved.)*

*Verified 2026-08-04. `node tools/verify-shell.mjs` 130/130, zero skips — 48 checks added by this
work order. **The baseline was 82, not the 79 this file recorded at WO-1.5**; the real number was
confirmed by extracting `HEAD` into a scratch tree and running there, and `CHANGELOG.md` had it
right all along. `git diff --numstat tools/verify-shell.mjs` shows no deletions: no existing check
was loosened to make this green.*

*The 👤 halves ran on the iPad the same day and found four defects, all fixed and all now pinned by
checks. Two were visible on the tablet: **the iPadOS date popover keeps its own selection after a
field is cleared**, so re-choosing the date just cleared is a no-op the picker never reports — the
teacher's workaround is to tap a neighbouring day and back, which writes a date she never wanted
into the document on the way past; and the class tabs, being ordinary flex items, were **compressed
below the width of their own labels**, which then laid out across the rounded background and past
its edge. The other two were found by the checks written for the first pair, and neither was
reachable from an iPad: nothing scrolled the open class back into view after the bar was rebuilt —
`scrollLeft` resets when a scroller's children are replaced, so the teacher whose class was fifth of
six got a header with nothing on it looking selected — and at 390px the entire class strip measured
**zero pixels wide**, because `flex: 1` means a basis of 0 and an over-full flex row distributes
shrinking in proportion to basis, so the strip beside a content-sized term nav shrank by nothing and
stayed at nothing. An iPad in portrait is wider than the width where that happens.*

**Traps** — Never write `Q1` as a literal anywhere outside seed data. The term id is opaque.

---

## WO-1.7 — Roster & contacts

**Ship** 1 · **Status** ✅ DONE — 2026-08-05 · **Size** M · 🚩 · **Depends on** WO-1.6
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
- [x] Pasting 25 names produces 25 students with names split correctly, and the preview matched.
- [x] Re-pasting the same list warns about duplicates rather than silently doubling the roster.
- [x] A student added to two classes is one student record with one set of contacts.
- [x] Removing a student from a class does not delete the student from the other class.
- [x] Guardian, counselor, and student emails round-trip through save and reload.

*Verifier PASS 2026-08-05, all five lines ✅ with no 🙋. `verify-shell.mjs` 162/162, `wo-sweep.mjs`
8 PASS / 0 FAIL / 2 REVIEW, both exit 0. `TESTING.md` carries twelve lines for this work order —
these five plus a real-SIS-roster split and the 👤 iPad halves — and all twelve are ticked there.
**These boxes were mirrored from `TESTING.md` on 2026-08-06**, at the phase close, having sat
unticked here while `TESTING.md` recorded them done since the day of. Two trackers disagreeing about
one work order is the failure the maintenance protocol exists to prevent, and it went unnoticed for
a day because nothing compares them — worth a check if this recurs.*

**Traps** — `Last, First` and `First Last` both appear in real paste sources. Detect per line, and
show the split in the preview so a wrong guess is caught before it commits, not after.

---

## WO-1.8 — Accommodations on the roster

**Ship** 1 · **Status** ✅ DONE — 2026-08-05 · **Size** M · 🚩 · **Depends on** WO-1.7
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

**Out of scope** — surfacing at point of use (WO-3.8), calendar surfacing of `reviewDate` (WO-6.2 —
it read WO-6.1 until 2026-08-19, WO-1.25, when the review-date deliverable moved to the work order
that computes it: a `reviewDate` is derived at render and is never an `events[]` entry).

**Acceptance**
- [x] Every field in the data model's `supports` block is editable and round-trips.
- [x] No list view shows plan status, accommodation detail, medical, or behavior text without a
      deliberate tap.
- [x] The indicator dot does not itself encode the plan type by color or shape — a projected dot
      that means "IEP" is still a disclosure.
- [x] `reviewDate` is stored and readable, whether or not anything consumes it yet.
- [x] The backup UI names accommodation and medical data as present in the file.

*The verifier returned **FAIL** on 2026-08-05 and all five lines above are nonetheless ✅ — read that
carefully, because it is the most easily misread record in this file. Its own opening: "All five
Acceptance lines verify clean. The failure is on the **boundary rule**, not the code." It objected
that the implementing commit `e6df8eb` ticked `plans/`, `ROADMAP.md`, the dashboard, `CHANGELOG.md`
and `TESTING.md`, which every brief forbade at the time; that three 👤 iPad lines were ticked while
the same commit's result file listed them under "what I could not verify"; and that
`docs/data-model.md` was amended inside the commit whose acceptance line grades against it.*

*Both objections are resolved on 2026-08-06, and neither by waving it through. **The teacher confirms
she ran the three 👤 lines by hand on the iPad in one sitting** — the verifier's stated condition was
"the teacher must confirm or the three ticks come back off," and she has, so they stand. And **the
boundary rule the FAIL was raised under has since been retired** (see `ROUTING.md` § "Implementers
may tick"), which retires this objection with it. The `data-model.md` amendment is ratified rather
than reverted: seeding `kind` to a real value would let a mis-tap claim a student has extended time,
and the verifier said on the merits it was right. `verify-shell.mjs` 184/184, 0 skipped.*

*One real defect was found after the tick and closed the same day (`9491f1c`):
`supportDateCommitted()` was the one of four support write paths that did not consult
`supportsVisible()` before writing. Harmless while that function always returned true, and a silent
data-loss path the moment WO-1.9 landed presentation mode — which is exactly the trap this work
order's own Traps section is about, arriving through the one door nobody was watching.*

**Traps** — It is tempting to show the accommodation list inline on the roster "because the teacher
needs it." That screen gets projected. Discreet by default is not a preference setting.

---

## WO-1.9 — Presentation mode

**Ship** 1 · **Status** ✅ DONE — 2026-08-05 · **Size** S · 🚩 · **Depends on** WO-1.8
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
- [x] With it on, no screen in the app displays plan, accommodation, medical, behavior, or case
      manager data — verified by walking every built screen. *(`verify-shell.mjs`: the data is
      absent from the DOM, not hidden in it — checked against whole-document text and every
      form-control value, including hidden ones, with the editor open.)*
- [x] The toggle state is visible without hunting for it. *(Header button, `aria-pressed`, and a
      measured fill difference in both states.)*
- [x] It survives a reload and an app relaunch. 👤 *(Reload half verified with a real `Page.reload`
      — the preference, the pressed toggle, and the strip all come back. Relaunch half verified on
      a real iPad 2026-08-05: installed, toggled on, force-quit from the app switcher, relaunched
      from the home screen icon — the button stayed filled white and the strip stayed shown. Also
      confirmed the filled button reads as "on" from arm's length without reading the strip text.)*
- [x] A screen added after this work order inherits suppression without touching the toggle code.
      *(Holds today: `roster.js` never reads the preference, only asks `supportsVisible()`. But
      re-verify this claim at every later phase — it is the whole reason for the render-helper
      approach, and the inheritance is qualified: a screen already on-glass when the toggle flips
      is redrawn by a hand-maintained call list in `flipPresentationMode()`, not by the render
      helper itself. Watch for exactly this at Phase 4, when a signal card is on screen.)*

**Traps** — Per-screen conditionals will pass this work order and fail in Phase 4, when a signal
card quotes a behavior note. Build the choke point.

---

## WO-1.10 — Home screen v0

**Ship** 1 · **Status** ✅ DONE — 2026-08-05 · **Size** M · 🚩 · **Depends on** WO-1.6
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
- [x] Six classes fit on an iPad screen in portrait without scrolling, at 44px+ touch targets.
      *(Measured at 768×1024 with touch emulation and a gate asserting the pointer really is
      coarse — without that gate the fit is the desktop pass. 6 cards in 3 columns, last card ends
      at 476px of 1024px, 0 targets under 44px. The install banner is hidden for the measurement
      and the check says so: that banner is on screen exactly while the app is not installed, and
      this line is about an installed iPad. Confirmed on a real iPad 2026-08-05, with the backup
      nag up.)*
- [x] Every class is exactly one tap from the home screen. *(The card carries the header tab row's
      own `data-class-tab` hook through one route to `classes.selectClass()`, so the card and the
      tab cannot disagree about which class is open. Driven on a card that was NOT already open —
      tapping the open card would pass whether or not the tap does anything — asserting the
      selection, the preference, the card and the header tab. The tap lands on real state rather
      than a placeholder screen: `src/home.js` documents why, since nothing it will eventually
      open exists yet.)*
- [x] A fresh document shows a real empty state, not five blank cards. *(Asserted on a genuinely
      empty year created through the real year picker mid-run, and it asserts all three halves —
      zero cards, a 249-character explanation on screen, and the route out to the first class. A
      grid that renders nothing and an empty state that says nothing are the same picture.)*
- [x] Adding the Phase 2 today-state line requires touching only the card renderer. *(One renderer,
      `classCard(cls, isOpen)` in `src/home.js`, one caller. Both slots measured `42px reserved,
      empty` on all six cards — asserted empty of text AND of child elements AND load-bearing in
      height, because a slot with no height reflows the grid the day it is filled. Two honest
      widenings of the literal claim, both recorded in the code: the boundary is really the
      renderer **and its stylesheet**, since the reserved 18px/20px is a guess about how tall one
      line is; and a second **interactive** control would turn the card from a `<button>` into a
      container, which is a Phase 4 concern. Freshness is outside the renderer too — a today-state
      that must update when attendance is marked needs a line in `src/shell.js`'s
      `afterClassChange()` chain. Re-verify at every later phase.)*
- [x] `node tools/verify-shell.mjs` runs against this screen with **no `SKIP` caused by a deleted
      shelf fixture**, and its check count has not fallen. *(201 → 209 checks, 0 skips both ways.
      The "before" number was re-derived independently by the verifier from a pristine `HEAD`
      extract rather than taken from the implementer's record. The one genuinely shelf-coupled
      fixture was the modal block, re-pointed from `#aboutModal` to `#classesModal` driven through
      `header [data-class-manage]` — scoped to `header` because that hook now also appears inside
      the hidden empty state, where an unscoped selector hands the driver a 0×0 element. The
      `window.planbook` seams were kept deliberately and survived; `plans/verification-tooling.md`
      predicted they would go with the shelf and that prediction was wrong — see the note there.)*

**Traps** — Don't build the Phase 6 glance page here. Build the *frame* that accretes into it. The
roadmap is explicit: build the glance page before the things it glances at and you build it twice.

---

## WO-1.11 — Back up every year in one tap

**Ship** — · **Status** ✅ DONE — 2026-08-05 · **Size** S · **Depends on** WO-1.5
**Not a go-live blocker.** Added 2026-08-04, out of WO-1.5's verification.

**Why it exists.** WO-1.5's download backs up the **open** year, because the open document is what
`getDoc()` returns. That is right for one year and wrong at a rollover: a teacher who has started
2027-2028 while still holding 2026-2027 for reporting she has not finished takes a backup, sees the
date update, and reasonably reads it as "Planbook is backed up." One of her two years is on disk.

Two halves of this were closed on 2026-08-04 rather than deferred, because they were the silent
half: `planbook_lastBackupAt` is now **per-year**, so downloading one year no longer clears the nag
for another, and the backup panel names any year on the device that has never been downloaded. What
is left is the convenience — and the convenience is what makes it actually get done.

**Deliverables**
- A second control on the backup panel that writes out every year on the device, shown only when
  there is more than one.
- The last-backup timestamp stamped for **each** year the button actually wrote.
- Panel copy that says how many years it covers, and the nag left alone — it stays a per-year strip.

**The decision this work order has to make first**, because it reaches into restore and restore is
the most destructive thing the app does:

- **One file holding an array of year documents** — one tap, one artifact, and restore has to learn
  a second top-level shape and decide what "replace" means for three years at once. That is a real
  change to the validation path WO-1.5 got verified, and it wants its own acceptance lines.
- **Or one file per year, downloaded in sequence** — restore stays exactly as it is, and every file
  is a file WO-1.5 already reads. The cost is iOS Safari, which is unreliable about several
  programmatic downloads from a single gesture and may prompt per file.

The second is the smaller change and keeps the recovery path single-shaped; it is the one to try
first, and the iPad decides whether it survives. Do not widen restore without saying so out loud.

**Out of scope** — Drive, scheduled backups, and restoring a single class or student out of a file.
The unit of recovery is the year, deliberately (`docs/data-model.md`).

**Acceptance**
- [x] With two years on the device, one tap produces a readable backup of both.
- [x] The control is absent with only one year, and no teacher who never rolls over ever sees it.
- [x] Each year written gets its own `lastBackupAt` stamp; the nag is down for both afterwards.
- [x] Restore still accepts every file this produces, and the WO-1.5 refusal checks still pass
      unchanged.
- [x] 👤 On an installed iPad: every file lands in Files, and the run is not silently truncated to
      the first year by Safari's download handling.

**Traps** — A "back up everything" button that quietly writes one year is worse than no button,
because it answers the question the nag was asking. If sequential downloads are cut short on iOS,
say so on screen rather than stamping the years that never landed.

*Desk pass ticked 2026-08-05: `verify-shell.mjs` **224 of 224, 0 skipped**, headless Chrome only.
Lines 2-4 hold. Line 1 and line 5 were then run by hand on an installed iPad the same day and
**failed** — not a truncation the harness's timing model anticipated, but a hard stop after the
first file. Mechanism, confirmed with the teacher: on an installed home-screen PWA, the native
"Open in…" sheet that iOS shows for each `<a download>` is a full context switch away from the page,
and returning from it does not resume the JS that was mid-loop — the second and third
`handToBrowser()` calls never run, and neither does the code that would have shown "Saved 1 of 3."
No delay between files fixes this; the interruption happens on leaving the page, not after a
timeout, so the one-file-per-download-event architecture this work order tried first cannot produce
more than one file per tap on the device that matters. The good half held anyway:
`recordBackupFor()` only runs after its own file's hand-off, so the years that never got a file were
never stamped and the nag stayed honest — confirmed on the device, not just in the harness.
**Correction round dispatched 2026-08-05**: bundle every year into a single `.zip` (one file, one
download, one "Open in" dialog, no loop to survive a reload). Restore is unaffected either way — it
only ever reads one loose JSON file, whether that file came from the single-year button or from
unzipping this one.*

*The zip rebuild landed 2026-08-05 (`src/zip.js`, hand-written, no dependency — CRC-32 table,
local file headers, central directory, end-of-central-directory record, all by hand). Survived a
machine crash mid-round with the app code intact; the implementer re-verified from scratch after
resuming. `verify-shell.mjs` **224 of 224, 0 skipped**; `wo-sweep.mjs` 10 passed, 1 pre-existing
unrelated review. Independently cross-validated by the verifier against three readers sharing no
code with this repo — Python `zipfile`, `tar.exe`, .NET `ZipArchive` — all extracting byte-identical
JSON with every CRC verified, plus a negative control (a corrupted byte injected and reverted)
confirming the harness genuinely rejects a bad archive rather than passing by construction. One
stale decision-record paragraph in `index.html`'s header comment (still describing the abandoned
sequential-download shape) was caught by the verifier and corrected. Restore, the single-year
button, and the stamping/nag behavior are all confirmed untouched or correctly adapted to the new
single-hand-off shape. `sw.js` `CACHE` bumped `v13` → `v14` for the genuinely new `src/zip.js` file,
confirmed present in `SHELL`. Desk verification is done; lines 1 and 5 stayed unticked pending a
second real-hardware session.*

*Retest run 2026-08-05 on the installed iPad, against the zip build: one tap produced exactly one
"Open in…" sheet for the zip; the status line naming the file was on screen after saving; the zip
unzipped in Files to N loose per-year JSON files; one of those files reached restore's "Replace
`<year>`" confirm; the nag was down for every year, not just the one on screen. All five acceptance
lines close. The architecture this work order shipped with is the zip, not the sequential-download
shape it started with — the reversal and why is recorded above rather than edited away.*

---

## WO-1.12 — Close two harness blind spots found at WO-1.10

**Ship** — · **Status** ✅ DONE — 2026-08-06 · **Size** S · **Depends on** WO-1.10
**Not a go-live blocker.** Added 2026-08-05, out of WO-1.10's verification.

**Why it exists.** WO-1.10's verifier found two places where the verification tooling would report
a clean run while missing the exact thing it exists to catch. Neither is an app defect today —
both are the instrument, not the target — but both degrade silently, which is the failure mode
`plans/verification-tooling.md` and `plans/dispatch-retro.md` keep naming as worse than no check at
all: a confident pass over nothing.

**The two gaps**
- **`tools/wo-sweep.mjs`'s coarse-block check is blind to untracked stylesheets.** It finds new CSS
  selectors with `git diff -U0 HEAD -- src\*.css`, which sees nothing in a file that isn't tracked
  yet. At WO-1.10 this meant all nine selectors in the new `src/home.css` were invisible to it, and
  it reported "1 new selector(s), all covered" about a selector from `shell.css` alone — a true
  statement about the wrong file. `src/README.md` makes one stylesheet per screen the convention, so
  every future screen trips this the same way.
- **The home screen's redraw depends on a hand-maintained list.** `src/shell.js`'s
  `afterClassChange()` calls `home.js`'s renderer from eight sites — archive, restore, delete,
  reorder, create, rename, and two more — and is complete today, verified against every exported
  mutator in `src/classes.js`. But `tools/verify-shell.mjs` only reads `#homeGrid` before the archive
  step and never again, so a future work order that adds a mutator and forgets its line in that list
  would leave all checks green while a teacher watches an archived class stay on the grid.

**Deliverables**
- Widen `wo-sweep.mjs`'s coarse-block check so it sees selectors in untracked `src/*.css` files, not
  only ones already known to git — a change to what the check looks at, not a new check.
- Add reads of `#homeGrid` in `verify-shell.mjs` after enough of the eight `afterClassChange()`
  branches that a missing call site would fail a check, not just after the archive step it already
  covers.

**Out of scope** — no new script, no `tools/lib/`, no new *kind* of check. This closes blind spots
in the two scripts that already exist; read
[`../verification-tooling.md`](../verification-tooling.md) before touching either file, since both
stay one file each by rule.

**Acceptance**
- [x] A planted, untracked `src/*.css` file with an uncovered coarse-pointer selector is caught by
      `wo-sweep.mjs`, not silently passed because the diff against `HEAD` is empty.
- [x] Deleting one line from `afterClassChange()`'s call list makes `verify-shell.mjs` fail at least
      one check, for as many of the eight branches as can be driven without new app-side hooks.
- [x] Both scripts still run clean against the real repo afterward — no regression in `wo-sweep.mjs`'s
      9-passed baseline or `verify-shell.mjs`'s 209/209/0-skips baseline, beyond checks this work
      order adds on purpose.

*Verifier PASS 2026-08-06, all three lines ✅, no 🙋 — and each fix proven by planting the violation
first and watching the script fail, which is what this work order's Traps section demands and the only
evidence that counts for a mechanism change. `wo-sweep.mjs` 11 checks · 10 passed · 1 REVIEW;
`verify-shell.mjs` 224 → **231 of 231, 0 skipped**. The two baselines quoted in the Acceptance text
above (9-passed and 209/209) were already stale when this work order was written — the live numbers
at dispatch were 10-passed and 224/224, flagged by the orchestrator in the brief rather than
discovered mid-run. Seven of the eight `afterClassChange()` branches can be driven red; the eighth
(delete, offered only on an archived class already off the grid) was confirmed undrivable rather than
assumed so. Boxes mirrored here 2026-08-06 at the phase close; this work order has no `TESTING.md`
section, being harness-of-the-harness work with nothing a teacher can check by hand.*

**Traps** — Per `verification-tooling.md`'s precondition rule, a check that could not have caught the
gap it's named for is not evidence. Prove each fix by planting the violation first and watching it
fail, the way the coarse-block check itself was proven at WO-1.7 — don't ship a mechanism change
without demonstrating it actually catches something.

---

## WO-1.13 — Main-area views: make the header actually navigate

**Ship** 1 · **Status** ✅ DONE — 2026-08-06 · **Size** M · 🚩 ·
**Depends on** WO-1.10
**Closes roadmap** Phase 1 → *(no roadmap line; this closes a gap the roadmap assumed closed —
see **Why it exists** below. The quotation marks came off that reference on 2026-08-08: the sweep
reads anything in double quotes on this line as a roadmap fragment, and this one matched no box.)*

**Why it exists.** The shell has no navigation. `selectClass()` in
[`../../src/classes.js`](../../src/classes.js) writes the `openClassId` preference and repaints the
tab strip — and that is all it does, because there is nowhere in `<main>` to go. `<main>` holds one
panel, "Your classes", and nothing ever swaps it. WO-1.6's own note in `index.html` calls the header
class row "the app's navigation rather than a styled strip"; it was never navigation, and no work
order since has noticed.

The cost landed at WO-2.1. Attendance needed somewhere to live, the only established pattern was
`openModal()`, so the marking screen opens as a dialog **on top of** the class cards it just made
irrelevant — and the app now has *two* class selectors, the header tabs and the home cards, both
feeding one invisible variable and neither one going anywhere. The owner found this immediately and
asked the obvious question: why is the panel not the screen?

**This is a divergence from Roll Call!, and that is what makes it a defect rather than a taste.**
Roll Call!'s `<main class="main">` holds `#registryView` and `#compactGridView` as sibling views
toggled by `.hidden`, with the header switching between them; its modals — `#manageModal`, the
config editor, the student report — live *outside* `<main>` and are management-only. We lifted its
modal components and its visual language and left its view architecture behind. `CLAUDE.md` says to
lift from Roll Call! rather than hand-design; this is the second defect in one day traceable to not
having done that.

**Why now and not later.** Phase 3 is ten gradebook work orders, and Phases 4 and 5 add signals and
outreach. Every one of them needs a main-area surface. If attendance stays a modal, they all land as
modals and the shape is permanent. WO-2.1's grid is built and unverified-on-hardware, so its
rendering ports at the lowest cost it will ever have.

**Deliverables**
- **`<main>` holds swappable views**, one visible at a time, in the shape Roll Call! uses: siblings
  toggled by `.hidden`, not a router and not a framework. The home grid becomes `#homeView` — one
  view among several rather than the only thing there is.
- **The header class row navigates.** Selecting a class puts that class's working surface in the
  main area. `selectClass()` keeps writing `openClassId` — the preference is right and is what
  survives a reload — and gains the repaint that the preference was always implying.
- **A way back to the home grid** that is obvious and always reachable.
- **WO-2.1's attendance grid moves out of `attendanceModal` and into a main-area view**, rendering
  unchanged. This is a re-parenting, not a redesign; if the grid's markup needs rewriting to fit,
  stop and say so rather than redesigning it in passing.
- **Retire the redundant selector.** Two controls that set one variable is the defect the owner
  reported. Either the home cards navigate and the header tabs switch within a class, or one of them
  goes — decide, write down which and why, and do not ship both meaning the same thing.

  **DECIDED BY THE OWNER, 2026-08-06: the first option. Cards enter, tabs switch.** The class tab
  strip is **not drawn on the home view at all** — on that screen the cards are how you enter a
  class, and a tab row that duplicates them is the defect. On the class view the strip is the fast
  switcher between classes, which is the job it can do that the cards cannot, because the cards are
  not on screen then. The two are never visible at once meaning the same thing, which is what this
  line has always asked for.

  *The first pass answered a third way — retiring WO-2.1's `data-attendance-open` state-line button
  and recasting cards-and-tabs as "two renderings of one control", by analogy with
  `data-class-manage`'s three doors. That analogy is where it went wrong: three doors onto a modal
  are three ways to reach one **task**, while cards and tabs were two ways to reach one **place**,
  both on screen simultaneously. The implementer then ticked its own box on it. The verifier failed
  the line and referred it up, correctly — it is a product call, not a build call.*

  Two consequences to handle rather than discover: on the home view the header's bottom row must not
  read as a blank navy strip (`refreshClassBar()` already calls that out as looking like a bug), and
  the harness checks that currently navigate by tapping a header class tab **from the home view** no
  longer have a control to tap. Re-point them through the cards; do not delete them.
- **Modals keep what they are good at**: the class manager, the term editor, the roster paste box,
  the student editor, the delete confirms. A modal is right for a task you finish and dismiss and
  wrong for the surface a teacher works in all period. Do not convert them.
- **`tools/verify-shell.mjs` follows.** `attendanceModal` appears in it 10 times; the harness drives
  the screen by opening the dialog. Those checks must drive the view instead, and the count must not
  drop — a check deleted because its selector moved is a check that stopped being run.

**Out of scope** — any change to what the attendance grid *shows* or *stores* (that is WO-2.1, and
it is settled). Deep-linking or URL routing. A back-button history stack. Phase 6's calendar view.

**Acceptance**
- [x] Selecting a class from the header changes what is in `<main>`, without opening a dialog.
- [x] Attendance is marked in the main area, with no overlay above the class cards.
- [x] There is exactly one control in the app that means "work on this class now", and a second
      control that means something different can be told apart from it in words. *(Ticked once
      unearned, failed by the verifier, and reopened. It is the owner's decision above that closed
      it — evidence in "The correction" note below.)*
- [x] Returning to the class grid is one tap from any view, and the tap is findable without being
      told where it is. 👤
- [x] `verify-shell.mjs` runs green with **no fewer checks than before**, and every check that used
      to open `attendanceModal` now drives the view. Verify the count, don't assume it.
- [x] The class manager, term editor, roster paste, and student editor still open as modals and
      still work.
- [x] Reloading with a class selected returns to that class's view, not to a blank main area —
      `openClassId` already persists and must keep meaning something.
- [x] Presentation mode still suppresses every support field on every view, including the new ones.

**What shipped, and the decision this work order left open.** `<main>` holds `#homeView` and
`#classView`, siblings toggled by `.hidden` (`src/views.js`, ~85 lines, imports only `src/prefs.js`).
The redundant selector retired is **`data-attendance-open`**: the class card is one control again —
`data-class-tab`, the header tab's own hook — and the state line inside it is a `<span>` that
reports. The second control that means something else is **"All classes"**, in words, with two doors
onto one hook (`data-view-home`): the tab at the head of the class row and a button in the class
view's panel header. Exactly one tab on the class row is `.active` at a time and it means "this is
what is in `<main>`" rather than "this is the open class" — which class is open is still shown by
the card's `.open` wash and by the term nav. *(That sentence was written of a strip drawn on both
views; the correction below took it off the home view, where there is now no tab to be active.)*
`planbook_openView` (UI preference, view name only) is
what makes a reload come back to the class rather than to the grid. Desk pass: `verify-shell.mjs`
**280 of 280**, up from 274; `wo-sweep.mjs` 10 passed, 0 failed, 1 to review (the standing line).
*(This paragraph said 279 until the verifier measured 280 twice, deterministically, and found
`tools/README.md` already saying 280 — three documents in one uncommitted change, two of them
wrong. The implementer was killed by an API session limit before it could reconcile them, which is
also why there is no result file to link: the run that would have written it never finished.)*

**The correction, 2026-08-06 — acceptance line 3 closed.** The class tab strip is drawn on the class
view only. `refreshClassBar()` already knew which view was up (it used the answer to decide which tab
read active); it now uses it to decide whether to draw the class tabs at all, and on the home view it
draws a caption instead — "Your classes", the home panel's own title, in the same muted `.hdr-empty`
voice as "No classes yet.", because that row already has a way of saying "nothing to select here" and
a blank navy band reads as a bug. The strip is not hidden and the row is not collapsed: the divider,
the term nav and the three icon buttons belong to both views, and a control that moves between views
is worse than an empty patch of navy. `homeTab()` lost its `active` argument with the view it was
active on — "All classes" is only ever the way OUT of a class now, never a tab you are standing on.
Desk pass: `verify-shell.mjs` **282 of 282, 0 skipped**, measured three times, up from 280 with
nothing dropped; `wo-sweep.mjs` unchanged. The two added checks count the controls a teacher could
tap **right now** in each view — 6 cards and 0 header tabs on the grid, 6 header tabs and 0 cards on
a class, one active tab, both "All classes" doors on the class view only, and the caption drawn at
63×16px inside its own strip. Both were proved by mutation and reverted: drawing the tabs on the home
view again turns two red, blanking the caption turns one red. Five checks in the classes section now
read the strip from the class view, arriving through a card the way a teacher does; the year-switch
check moved its "the classes came back" clause onto the cards and keeps the term nav as the proof
that `refreshClassBar()` ran at all. *(What is still owed to the iPad: whether that caption reads as
a caption or as a strip that failed to load. It is on the sitting list in `TESTING.md`.)*

**Traps** — The tempting shortcut is to leave `attendanceModal` in place and hide its chrome, which
produces a dialog pretending to be a page: focus trapping, an Escape key that navigates, and a
screen reader announcing a dialog that never closes. Move it or leave it, but do not disguise it.
And **do not build a router.** Roll Call! switches views with `.hidden` and a class name; the suite
rule is no dependencies, no framework, and a hand-rolled URL router is a framework with one user.

---

## WO-1.14 — The shell was served from a redirect, and Safari refused it

**Ship** — · **Status** ✅ DONE — 2026-08-12 · **Size** S · **Depends on** WO-1.3
**Closes roadmap** Phase 1 → *(no box. A defect in code Phase 1 shipped and the roadmap counted as
done — the WO-2.17 and WO-2.23 pattern. Booked 2026-08-12, out of WO-8.7's first deployment.)*
**Fixed in `8de1ae4`, on `main`, before this work order was written.** *The app was broken in
production while the owner watched, so the fix shipped first and the record caught up. That order is
the exception this project allows for a live defect, not the habit — everything below is what was
actually done, not a plan.*

**Why it exists.** WO-8.7 put the app on a real host for the first time. It loaded once, then every
navigation after it failed with *"the response served by the service worker has redirections"*. The
mechanism, end to end:

- `sw.js`'s `SHELL` list precached **`./index.html`**, and `INDEX` — the entry every navigation is
  answered from — pointed at the same URL.
- **Cloudflare Pages answers `/index.html` with a 308 to `/`.** Measured, not assumed.
- `cache.addAll()` follows redirects by default and stores the *final* response under the *requested*
  key, with its `redirected` flag set.
- Handing a response with that flag to a navigation is a spec violation. Safari rejects it outright;
  the first load works only because no worker is controlling the page yet.

**On a home-screen icon that is a white screen where a term of grades used to be** — the exact failure
the install path in WO-1.3 exists to prevent, arriving through the install path itself.

**Why no local tool could have caught it, which is the part worth keeping.** The redirect is the
host's behaviour. It does not exist on `tools/serve-https.mjs`, it is not in this repository, and it
cannot be derived from anything in it. `verify-shell.mjs` ran **628 of 628, zero skipped, against the
broken worker** — before the deploy and again after the fix, with the same number both times. The
harness was not wrong; it was looking at the only thing it can see.

**What shipped**
- `./index.html` removed from `SHELL`. `./` is the same bytes without the redirect, and it is what a
  teacher's URL asks for anyway.
- `INDEX` repointed at `./`, so the navigation lookup matches the key the precache actually stored.
- `CACHE` bumped to `planbook-shell-v46`, so `activate` deletes the v45 cache holding the poisoned
  entry. **Teachers already on the broken version heal on next open** — the worker script is fetched
  by the browser's update check rather than through the fetch handler, so the bug cannot block its own
  replacement.
- The whole reasoning recorded above the `SHELL` list, at the point where someone would put the line
  back, rather than in a commit message nobody reads at the moment of temptation.

**Acceptance**
- [x] `sw.js` precaches no path that the host answers with a redirect, and `INDEX` names an entry the
      precache actually stored. *(`SHELL` starts `'./', './manifest.webmanifest'`; `INDEX` is
      `new URL('./', self.location).href`. Read back off the deployed worker at
      `https://planbook.hwgteach.com/sw.js`, not off the working tree — 2026-08-12.)*
- [x] `CACHE` is bumped in the same change, so the poisoned entry is deleted rather than inherited.
      *(`planbook-shell-v46`, confirmed live.)*
- [x] The app loads, and **keeps loading** — a second and third navigation after the worker has taken
      control, which is the case the first load cannot test. 👤 *(Owner, laptop and iPad, 2026-08-12.)*
- [x] `verify-shell.mjs` still runs green with no checks lost. *(628 of 628, 0 skipped, before and
      after — and that identical number is the finding, not the reassurance.)*

**Traps** — **Do not "restore" `./index.html` to the shell list.** It looks like an omission, the
comment above the list exists to say it is not, and putting it back reproduces this bug exactly.
More generally: a precache list is a list of *requests the host will answer without redirecting*, and
that is a property of the deployment, not of the repository. Any future entry needs the same question
asked of it, and the only instrument that can answer is an HTTP request against the live origin —
which this project still has no check for. WO-8.7's closing note proposes one.

---

## WO-1.15 — the restore compare cannot see what it is about to delete

**Ship** 2 · **Status** ✅ DONE — 2026-08-12 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. A defect in code Phase 1 shipped, found on 2026-08-12 while
reading `gates.md`'s iPad rules against `src/backup.js`. The same call as WO-1.14.)*

**Why it exists.** `gates.md` § *The iPad stays in the rotation* carries a rule in bold — **restore
only ever flows laptop → iPad, never the reverse** — and calls it "the one that can destroy a term".
Restore is a wholesale replace, not a merge (`restoreDocument()`, `src/store.js:651`), so a backup
taken off the test device and opened on the teaching one replaces the real ledger with test data,
**silently, and reporting success.**

**Nothing in the app enforces that rule, and worse, the screen that exists to catch it cannot.** The
confirm modal builds a side-by-side compare from `describe()` (`src/backup.js:116`), and that function
returns exactly six things: `year`, `classes`, `students`, `saved`, `rev`, `schemaVersion`. **It counts
the roster and never the record.** Two documents with the same five classes and the same twenty-five
students produce an identical panel whether one holds a term of marks and scores and the other holds
none — which is precisely the pair of documents this rule exists to keep apart. The button then reads
*"Replace 2026-2027"*, and a teacher reading carefully still has nothing to read.

**The year label is the only real guard**, and it is doing more work than anyone wrote down: restore
is keyed by year, so an iPad living in `2030-2031` cannot replace `2026-2027` at all. That is why
WO-1.16 matters as much as this does, and why this work order is defence in depth rather than the
primary fix. **The danger is confined to the case where both devices hold the same year label** —
which is exactly the case today.

**Deliverables**
- **The compare panel counts the record, not just the roster.** Recorded meetings, marks, assignments
  and scores on both sides, in whatever wording matches the panel it joins.
- **When the stored side holds materially more than the file does, the confirm surface says so in
  words** rather than leaving it to be inferred from two columns of numbers. A reader should not have
  to subtract.
- No new screen and no new flow: the same modal, the same button, the same one line in
  `confirmRestore()` that touches disk.

**Out of scope** — blocking or refusing the restore; guessing which device a file came from (nothing
in the format records it, and inventing a field is a schema change this does not need); anything about
sync, which is Phase 7's.

**Acceptance**
- [x] A backup holding zero marks, restored over a year holding a term of them, shows both counts
      **before** the button is pressed, and the counts differ on screen. *(`verify-shell.mjs`, "the
      compare counts the record on both sides": the stored side reads `3 recorded meetings · 3
      attendance marks` / `2 assignments · 3 scores`, the file side four zeros, with `1 class · 2
      students` identical on both. Read out of `#restoreCompare` while the confirm is up and before
      anything is clicked.)*
- [x] The confirm text names what would be lost, not only what would be gained. *(A new
      `#restoreConfirmLoss` paragraph in the same dialog, in the `.class-delete-facts` danger wash:
      "…Replacing it loses 3 recorded meetings, 3 attendance marks, 2 assignments and 3 scores, which
      this file does not have — and the only way back to that is a backup taken from this device."
      The numbers are the **excess**, not the stored counts: a second fixture puts a file holding
      1/1/1/1 against a device holding 3/3/2/3 and the sentence reads 2/2/1/2.)*
- [x] A restore of a *different* year is unaffected — it is a normal, safe act and must not acquire a
      warning it does not deserve. *(A file for a year the device does not hold: no warning, "Nothing
      for 2031-2032 is stored here", button "Add 2031-2032". And the Traps line's other half is
      checked with it — an own-backup of the same year, and a file holding MORE than the device, are
      both silent.)*
- [x] No accommodation, medical or plan data appears in the panel, in either presentation mode.
      *(Nothing sensitive is counted — the four record numbers are it, deliberately. Asserted in both
      modes over the whole dialog against three sentinels planted in the fixture and asserted present
      in the file and the stored document first: `epi-pen in the nurse office`, `IEP`,
      `extended-time`, none of them in 813 characters of dialog either way.)*
- [x] 👤 On the iPad the panel still fits and the confirm button keeps its 44px. *(Owner, installed
      iPad, 2026-08-12: all four lines of the checklist in `TESTING.md` § WO-1.15 confirmed good in
      one sitting — the fit and scroll, the 44px Replace under the loss paragraph, the paragraph
      reading as a stop, and the cold read naming the right thing.)*
- [x] `verify-shell.mjs` gains checks for the new counts, proved against a fixture where the roster
      matches and the record does not. *(Eight checks in the existing `backup & restore` section;
      636 of 636, 0 failed, 0 skipped. The fixture is the file itself with a record added, so the two
      rosters are identical by construction rather than by two lists kept in step, and the harness
      asserts that before it asserts anything else. Five mutations, all reverted —
      `TESTING.md` § WO-1.15.)*

**Traps** — **Do not infer direction from the device.** There is no device field and there must not
be one; the fix is to make the difference *visible*, not to make the app clever. **Do not treat every
replace as dangerous** — replacing a year from its own backup is the whole point of backups, and a
warning on the safe case trains the teacher to click through the unsafe one.

---

## WO-1.16 — the term opens in a fresh year

**Ship** 2 · **Status** ✅ DONE — 2026-08-17 · **Size** S · **Depends on** nothing
**Closes roadmap** Phase 1 → *(no box. Operational, not code — this work order is a cutover the owner
performs, booked because the alternative is remembering it. Booked 2026-08-12 out of the Ship 1
rehearsal's unclosed note.)*

> **AMENDED 2026-08-15 — the premise expired, and most of this work order went with it.** The owner
> reports **no year at all on any device: a clean slate.** The rehearsal data this work order was
> written to quarantine **is gone**, so there are no fabricated meetings to get out of the term year
> and nothing to relabel `2030-2031`. Everything below under **Why it exists** describes the state on
> 2026-08-08 and is kept as the record of why this was booked, not as a description of today.
>
> **Three consequences, and the third is the one that matters.**
>
> 1. **The deliverable about keeping the rehearsal data is moot** — there is no rehearsal data. The
>    **Out of scope** line protecting it from deletion is likewise moot; the deletion it forbade has
>    already happened by other means.
> 2. **What survives is smaller but still real**: the term year gets created fresh when the roster
>    arrives; the laptop and the iPad must not end up holding the same year label, which is
>    `gates.md`'s rule and is the arrangement in which a wrong-direction restore is silent and total;
>    and a backup of the term year goes off-device before the first class.
> 3. **The evidence behind a ticked gate item no longer exists.** `gates.md` records the
>    attendance-arithmetic check as run *"against backfilled test data plus current entries, not a
>    real class,"* and this work order's **Out of scope** called that data *"the evidence behind the
>    attendance-arithmetic tick"* and said it **must survive**. It did not. The tick stands — the
>    check was run and observed on 2026-08-08 — but it can no longer be re-derived from stored data,
>    and `gates.md`'s week-one re-check against a live roster is now the **only** path to confirming
>    that arithmetic. **This is flagged, not fixed, and it is not this work order's to fix.**
>
> **Re-queued** from Aug 20–23 to *when the roster arrives, before the first class*. The urgency
> argument below — *"this is the last moment it is cheap"* — was about separating fabricated marks
> from real ones, and with no fabricated marks it no longer binds. **`CHANGELOG.md`'s open note is
> deliberately left as written**; it records what was true and planned on 2026-08-08, and the entry
> that closes it will say what actually happened instead of pretending the plan was followed.

> **PERFORMED 2026-08-17 — the roster arrived and the cutover was done in one sitting.** The term
> year was created at `https://planbook.hwgteach.com/`, made the working year, and the rosters
> entered fresh; the year picker on that origin was read back to confirm it, and the year was checked
> in the app to hold no meeting the owner did not record. A year labelled `2030-2031` was created on
> the iPad at its own origin, `https://192.168.50.142:8443/`, so the two devices do not share a
> label. A backup of the term year was taken and stored off-device before the first class.
>
> **Two things about how it was done, recorded because neither is obvious from the list above.**
>
> 1. **The devices now differ by origin as well as by label**, which the 2026-08-15 amendment did not
>    anticipate — it predates the `gates.md` amendment that moved the device of record to the deployed
>    origin. That does not weaken the rule: a backup file travels between origins freely and restore
>    is keyed by the year label, so the label divergence is still the thing doing the work.
> 2. **The iPad's year was created on the device, not restored to it.** The laptop → iPad restore that
>    the original deliverables described is not part of this act at all, per the rewritten deliverable
>    above. On a clean slate there was nothing to send.

**Why it exists.** The Ship 1 rehearsal recorded one thing it could not close, and `CHANGELOG.md`
still carries it: **the backfilled test data is in the live year.** The rehearsal was designed so it
could not contaminate the ledger and it did not — but the ledger was already carrying fabricated
meetings before the sitting began, and **in this data model a fabricated meeting *is* a meeting.** It
sits in the denominator of every percentage and in the recorded-meetings count, indistinguishable from
a real one. Everything counts recorded meetings, never calendar days, so there is no date filter that
makes this go away.

**This is the last moment it is cheap.** Once real marks land beside the fabricated ones, separating
them means editing a live ledger during a term. Before the first class it is one act.

**It depends on nothing, and that is deliberate rather than an omission.** The work order scheduled
immediately before it makes a wrong-direction restore visible, and it would be natural to write it
onto the `**Depends on**` line as an ordering hint. **It was, for about ten minutes on 2026-08-12,
until `wo-gate` refused this work order** — correctly, because every `WO-` token on that line is a
gate and not a suggestion. The refusal is the whole argument: a code change that is defence in depth
would have blocked the cutover that is the actual fix, and the failure mode is the term opening with
fabricated meetings in it because something optional slipped a week. **If only one of the two is ever
done, it must be this one.** The ordering lives in the Ship 2 table, where a suggestion belongs.

**It also arms `gates.md`'s iPad rule.** That rule survives on the two devices holding *different year
labels*; restore is keyed by year, so an iPad in `2030-2031` cannot replace the term. Today both
devices can hold the same label, which is the one arrangement in which a wrong-direction restore is
silent and total.

**Deliverables** *(an act, not a change — nothing here edits a file in this repository)*
- **A fresh year for the term**, created at `https://planbook.hwgteach.com/`, made the working year,
  with rosters entered fresh rather than carried across.
- **A year on the iPad whose label is not the term's.** `gates.md` names **2030-2031**, which is
  unmistakable in the year picker; labels are strictly `YYYY-YYYY` (`src/store.js:176`), so it cannot
  simply be called "TEST". *(Rewritten 2026-08-17, and what it replaced is named here rather than
  dropped silently. It was two deliverables — "the rehearsal data kept, in a year whose label cannot
  be mistaken for the term" and "the iPad restored from the laptop so it holds the test year" —
  **both made moot by the 2026-08-15 amendment above, which did not edit this list.** There is no
  rehearsal data to keep and therefore nothing to restore. What survives is the arrangement those two
  were serving: the devices must not share a year label. On a clean slate that is a year **created**
  on the iPad, not one sent to it, so the laptop → iPad restore is no longer part of this act at
  all — the rule it obeyed still governs any future restore.)*
- **A backup of the term year taken and stored off the device** before the first class.
- **The date written into this work order and into `CHANGELOG.md`'s open note**, which is what closes
  the rehearsal's loose end rather than leaving it recorded forever.

**Out of scope** — any code change, which is WO-1.15's half; the week-one re-check of the arithmetic
against a live roster, which is `gates.md`'s and cannot happen until a real class exists; a device
flag or any other schema-level marker distinguishing a test document from a real one, which was
weighed on 2026-08-17 and belongs to Phase 7 rather than here — the label divergence guards the term
with no code at all, and a flag would trade a structural guarantee for a conditional that has to keep
being right. *(A further clause — "deleting the rehearsal data, which is the evidence behind the
attendance-arithmetic tick and must survive" — **was dropped 2026-08-17 and is recorded here rather
than removed silently.** The 2026-08-15 amendment had already found it moot: the deletion it forbade
happened by other means before this work order was ever worked, and a scope line cannot protect what
is already gone. That the evidence was lost is the amendment's third consequence, flagged there.)*

**Acceptance**
- [x] 👤 **The term year exists at `https://planbook.hwgteach.com/`** — created on that origin rather
      than at `localhost:8443`, and confirmed by opening the deployed app and reading the year picker
      there. *(Added 2026-08-17, in the same sitting as the `gates.md` § Where Ship 1 actually runs
      amendment that moved the device of record onto the deployed origin. **There was no such line
      while the record lived at `localhost`, because there was only one place a year could be.** It
      goes first because the three lines below it are all about a year whose location this one
      decides.)*
- [x] 👤 The year the term is taught in contains no meeting the owner did not record — checked in the
      app, not assumed from the act.
- [x] 👤 The iPad and the laptop do not hold the same year label, each confirmed on the device itself.
      *(Amended 2026-08-15. Was "the iPad shows the test year and the laptop shows the term year" —
      there is no test year now, but the rule it served is `gates.md`'s and survives: two devices
      sharing a label is the one arrangement in which a wrong-direction restore is silent and total.)*
- [x] 👤 A backup of the term year exists off-device, taken **before** the first class.
- [x] The date is recorded here and the `CHANGELOG.md` note is closed.

*(A fifth Acceptance line — "the rehearsal data is still openable, in a year whose label cannot be
read as the term" — **was removed on 2026-08-15 and is recorded here rather than deleted silently.**
It can never become true: the rehearsal data is gone, so a checkbox asking that it survive would pin
this work order open forever. That the evidence was lost is the finding in the amendment above, not a
line to keep ticking against.)*

**Traps** — **Do not create the term year at `localhost:8443`.** It is the origin every previous
sitting used and the one `gates.md`'s *Before the sitting* checklist still names, so it is what habit
reaches for. **IndexedDB is keyed by origin**: a roster entered there is not merely awkward to reach
from the deployed app, it is **not in it**, and the failure is silent — the year picker on
`planbook.hwgteach.com` simply comes up empty. The only path between two origins is a backup file, so
the recovery is download-there, restore-here: cheap the moment you notice, and a lost first period if
you do not. **Do not carry the rehearsal's attendance across "to have some history".** That is the
defect this work order exists to end, arriving by the door marked convenience. **Do not relabel the
old year to something outside `YYYY-YYYY`** — the store rejects it, and the year picker is the only
place the distinction is ever seen.

---

## WO-1.17 — the backup nag cannot see a year whose only content is grades

**Ship** — · **Status** ✅ DONE — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. A latent defect in code Phase 1 shipped, found on 2026-08-12
by the WO-1.15 verifier while reading `src/backup.js` for a different reason.)*

**Why it exists.** `hasSomethingToLose()` (`src/backup.js:1055`) decides whether the backup nag is
allowed to appear, and it does it by enumerating collections: `classes`, `students`, `assignments`,
`attendance`, `log`, `events`, `templates`. **`scores`, `passes` and `openPasses` are not on that
list.** The nag is the one thing standing between a teacher and the iOS eviction described in
`CLAUDE.md`, and it stays silent on any document whose content lives only in the three it cannot see.

**It is masked today, and that is the argument for booking it rather than watching it.** Score cells
cannot exist without an assignment to hang them on, so `count(doc.assignments)` fires first and the
nag appears anyway — the omission is invisible precisely because a second field happens to be doing
its job. It stops being invisible the moment a document can hold scores with no assignment: an
assignment deleted while its column is kept, an import, a partial restore. The failure is silent, it
is about the only copy of a term of grades, and the code reads correct.

**The same shape as WO-1.15**, one screen over. That work order fixed a panel that counted the roster
and not the record; this is the nag counting most of the record and not the rest.

**Deliverables**
- **`hasSomethingToLose()` sees score cells and both hall-pass collections.** Scores go through
  `countScores()` (`src/backup.js:112`), which WO-1.15 added for exactly this reason; `passes` and
  `openPasses` are arrays and `count()` is right for them.
- **The enumeration gains whatever makes the next omission loud** rather than silent — the point of
  failure is that a list of collection names has to be kept in step with `docs/data-model.md` by
  hand, and nothing today notices when it is not.

**Out of scope** — when the nag is evaluated (boot, backup, restore, year switch — that list is
correct and reasoned at the call sites); the wording of the nag; the compare panel, which is
WO-1.15's and is done.

**Acceptance**
- [x] A document holding score cells and **no** assignments raises the nag. *(The masked case, made
      unmasked — this is the check that fails against today's build.)* — `verify-shell.mjs`, *"a
      document holding score cells and NO assignments raises the nag"*: two cells in one column over a
      `newYearDocument()` with nothing else in it, nag **UP**. Red on the unfixed tree, green here.
- [x] A document whose only content is a hall pass — open or closed — raises the nag. — same block,
      the two collections sampled separately (`openPasses` alone, then `passes` alone). Red on the
      unfixed tree for both, green here.
- [x] A brand-new document still does **not** raise it. A year and a letter scale are not something
      a teacher typed, and a nag on day one is wallpaper by October — the rule the current comment
      states and which must survive the fix. — a bare `newYearDocument()` with its 12 seeded letter
      bands: nag **down**, on both trees. The comment that states the rule is unchanged.
- [x] `verify-shell.mjs` gains checks proved against a fixture where the omitted collection is the
      **only** content, so a check that would go green against the current build is not written. —
      four checks, each over a document with exactly one collection filled. Run against the unfixed
      `hasSomethingToLose()` first: `766 checks · 764 passed · 2 failed`, the two failures being the
      two content lines above. Fixed tree: `766 checks · 766 passed · 0 failed · 0 skipped`, 247s.
- [x] The collection list is checked against `docs/data-model.md` rather than against memory, and the
      way it is checked is written down. — `tools/wo-sweep.mjs` § 14 reconciles `CONTENT_COLLECTIONS`
      and `NOT_CONTENT` (`src/backup.js`) against the top-level keys of the sketch under
      *## The document*, both directions, and checks each counter against the documented shape. The
      reasoning is at the check, at the lists, and in `tools/README.md`. Sweep: `20 checks · 18
      passed · 0 failed · 2 to review` (both REVIEWs standing).

**Traps** — **`count(doc.scores)` is 0 for a full gradebook.** `scores` is an object keyed by
assignment then student, not an array, and `count()` answers 0 — the exact trap WO-1.15 documented at
`countScores()` and the reason that helper exists. Adding `count(doc.scores)` to the sum looks like
the fix, changes nothing, and closes the work order. **Do not widen the nag into "anything non-empty"**
— a document is never empty, and that is what the current comment is defending against.

---

## WO-1.18 — the harness section comment miscounts its own checks

**Ship** — · **Status** ✅ DONE — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. Documentation drift inside the harness, found on 2026-08-12 by
the WO-1.15 verifier.)*

**Why it exists.** The section header at `tools/verify-shell.mjs:1860` opens *"Seven checks, and the
fixture is the whole argument"* over a section that holds **eight**. The count was right when it was
written and a check was added before the work order landed.

**Booked rather than fixed in passing, because this repository already treats harness
self-description as load-bearing.** WO-2.19 exists solely to check the harness's own check count, and
`wo-sweep.mjs` asserts that the `check()` call-site total matches the number recorded in
`tools/README.md` — currently 637, and it passes. A section header that miscounts is the same drift
one level below where any of that looks. The number is not important; a reader who finds it wrong
learns to skim the prose that carries the reasoning, and in this harness the prose is the reasoning.

**Size is the floor, not the estimate.** `S` ≈ a sitting and this is a word. It is booked so it is not
lost, and it is a natural pick-up alongside the next piece of harness work rather than a sitting of
its own.

**Deliverables**
- **The comment says eight.**
- **A judgment recorded, either way, on whether the sweep can see this class of drift** — a
  section-header count that disagrees with the `check()` calls beneath it is mechanically checkable,
  and the sweep already counts call sites per line. Do it or write down why it is not worth it; do
  not leave the question unasked.

**Out of scope** — renumbering or reorganising the section; any change to what the eight checks
assert; the two standing `wo-sweep.mjs` REVIEW items, which are read and dismissed each run on
purpose.

**Acceptance**
- [x] The comment at `tools/verify-shell.mjs:1860` matches the number of `check()` calls in its
      section, counted rather than assumed. — it reads *"Eight checks"*. **The header has moved to
      `:1869`** since this line was written: `git show 87000a7f:tools/verify-shell.mjs` has it at
      `:1860`, and WO-1.17 (`3c6b8c5`) added a block above it that pushed it nine lines. Counted with
      `wo-sweep.mjs` §11's own predicate — comment lines and the definition excluded — over the block
      that runs from the banner at `:1867` to the check named *"the WO-1.15 fixture is put back byte
      for byte, so the sections below inherit nothing"*, which is what terminates it: **eight** call
      sites, at `:1991, 2004, 2018, 2029, 2040, 2070, 2101, 2123`, and `git blame` puts all eight in
      WO-1.15's own commit `87000a7`. Nothing was deleted or renumbered to reach the number.
- [x] `verify-shell.mjs` still runs green at its then-current total, and `tools/README.md`'s recorded
      call-site count still matches — a comment fix must not touch either, and if it does, something
      other than a comment was changed. — `778 checks · 778 passed · 0 failed · 0 skipped`, 20,570
      lines, 26.4 lines per check, 253s, exit 0. `wo-sweep.mjs`: `20 checks · 18 passed · 0 failed ·
      2 to review` (both REVIEWs standing), §11 green at *"781 `check()` call site(s) …, matching
      tools/README.md:812"*. Both numbers are the ones the tree already carried — 781 − 778 = 3 is
      the gap `tools/README.md` names — and the harness diff is one word inside a `/* */`.
- [x] The sweep question above is answered in writing, in the work order or in `tools/README.md`. —
      `tools/README.md`, § `verify-shell.mjs`, the paragraph opening *"Nor does the sweep check a
      SECTION header's count against the checks underneath it"*, beside the WO-2.22 refusal it is the
      same shape as. **Not built**, on three measurements rather than on effort: 49 banner lines in
      the harness and only two state a count; one of those two is WO-1.17's *"FOUR CHECKS AND A
      FIXTURE GUARD THAT NEVER FIRES"* over five call sites, which a call-site comparison would score
      wrong; a section has no machine-readable end, so banner-to-banner over this very block counts
      19 against the 8 the header is about; and 41 further lines say things like *"the two checks
      above"*. A `REVIEW` instead of a `FAIL` is recorded as the near miss and why it was refused.

**Traps** — **Do not "fix" the count by deleting a check.** **Do not renumber neighbouring section
headers to match a scheme** — the other headers are not known to be wrong, and a sweep that changes
twenty comments to fix one buries the fix in the diff that is supposed to show it.

---

## WO-1.19 — the phase-branch convention is dead and still written down

**Ship** — · **Status** ✅ DONE — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. Process, not app — the convention it settles is `CLAUDE.md`'s
and this directory's, and neither is a roadmap promise. Booked 2026-08-13.)*

**Why it exists.** `CLAUDE.md` says work happens on phase branches — *"one integration branch `main`,
phase branches `phase/<n>-<slug>`… A work order is a commit or a short stack of them, worked on its
**phase** branch — not a branch per work order."* **Nothing has worked that way for the whole August
sprint.** Measured 2026-08-13: `phase/1-shell-store-roster` is **104** commits behind `main`,
`phase/2-attendance` **67**, `phase/3-gradebook` **16**. Their last commits are Aug 6, Aug 8 and
Aug 12.

**The convention has already been rewritten twice to describe its own decay rather than to end it.**
It first gained a note admitting the drift, then on 2026-08-13 that note was corrected — because it
had named one branch and a commit count that was wrong within a day — into a note saying all three
trail and giving a command for how far. **Two edits, both of which made the sentence more accurate
and neither of which made it true.** A rule every session reads and no session follows is worse than
no rule: it costs a paragraph of attention per session and buys nothing, and it is the one kind of
documentation defect this project has otherwise been ruthless about.

**The decision is cheap, and that is the finding that should drive it.** All three branches hold
**zero commits that are not already on `main`** — they are strictly behind, so there is nothing to
merge, nothing to rebase, and nothing at risk. Catching them up is a fast-forward; retiring them is a
delete. The reason this has not been done is not difficulty, it is that nobody has been asked to
choose.

**Somebody was asked on 2026-08-15, and the answer is (b) retire.** The owner's call, put to them with
that day's measurements and relayed through the coordinator that cut the brief, in these words:
*"Retire it, but when we hit the next ship we should be more mindful about development happening on
branches and not on main."* Both halves are the decision. `main` is the integration branch, `CLAUDE.md`
§ Conventions and this directory's § *How to use one* step 3 now say so with no note about a gap, and
the three local branches are deleted — `phase/1-shell-store-roster` at `f628a04`, `phase/2-attendance`
at `25cd527`, `phase/3-gradebook` at `9a2dc05`. **Re-measured immediately before the delete**, as the
Traps require: 138, 101 and 50 commits behind `main` and **zero** unique commits each, which has only
grown from the 104 / 67 / 16 booked on 08-13. All three remain on `origin`, untouched here, and all
three `origin/phase/*` refs are ancestors of `main` — nothing is unreachable and the call is
reversible with `git branch <name> origin/<name>`. One wrinkle worth writing down rather than
discovering later: `phase/3-gradebook`'s local tip was **12 commits ahead of
`origin/phase/3-gradebook`** (`9a2dc05` local, `7235969` remote), so restoring that one from `origin`
returns an older marker than the one deleted. It is also why `git branch -d` deleted the first two and
**refused the third** — `-d` measures "merged" against the upstream, not against `HEAD`, and said so:
*"not deleting branch 'phase/3-gradebook' that is not yet merged to 'refs/remotes/origin/…', even
though it is merged to HEAD."* Each of those 12 commits was confirmed an ancestor of `main` one at a
time before `-D` was used. The exact local tips are recorded above and every one of them is reachable
from `main`, so nothing is lost either way.

**What is lost is the per-phase history view, and it is acceptable because it had already stopped
being one.** The three branches were fast-forwards of `main` rather than divergent lines of work, so
`git log phase/2-attendance` was never Phase 2's story — it is `main`'s whole history truncated at
2026-08-08, WO-1.13's Phase 1 commits included (`git branch --contains 79e6a6a`, WO-1.13's landing
commit, named `phase/2-attendance` and `phase/3-gradebook` alongside `main` — `phase/1` sits behind it
and so did not carry its own phase's work either). What the refs really carried was a **marker** of
where the tree stood the last time each
phase saw work, and a marker is worth less here than the two records that already answer the same
question by date and by work order: the phase file in this directory, and `CHANGELOG.md`. The `origin`
copies keep even the marker.

**Why not (a), when reviving them was the same three fast-forwards.** The dispatch stream hops phases
between consecutive work orders — the eighteen commits before this one interleave WO-1.18, WO-8.10,
WO-1.17, WO-8.9, WO-3.16, WO-2.29, WO-2.28 and WO-3.15, four phases inside a week — so a branch per
phase means near-constant switching and merging back, for isolation nothing has asked for since Ship 1.
Three fast-forwarded branches that then sit unused for another sprint is this work order's own defect
with fresher timestamps, and its own Traps say so.

**This retires a convention for how the current sprint is worked; it does not settle branching.** The
owner's second half stands as written: when Ship 3 opens, be deliberate about development happening on
branches rather than straight on `main`. **What shape that takes is not decided here**, deliberately —
naming a scheme now would put a second branching rule on paper that nobody has agreed to follow, which
is the exact defect this work order exists to remove.

**Deliverables** *(the deliverable is a decision, and then whichever act it implies)*
- **A choice, written down with its reasoning**, between the two honest options:
  **(a) revive** — fast-forward all three, and say what changes so the next work order actually lands
  on a phase branch; or **(b) retire** — `main` is the integration branch in practice, `CLAUDE.md`
  says so plainly, and the stale branches are deleted locally and on `origin`.
- **`CLAUDE.md`'s Git line matches whatever was chosen**, with no note describing a gap between the
  rule and the practice. If a note is still needed after this work order, the wrong option was picked.
- **`plans/work-orders/README.md` § *How to use one* step 3 moves with it** — it carries the same
  instruction (*"Work on the phase branch… not a branch per work order"*) and is the copy a dispatched
  agent actually reads.

**Out of scope** — pushing anything to `origin`, which is the owner's call and is not what this
decides; the 9 unpushed commits on `main`; any change to commit-message convention, which is working.

**Acceptance**
- [x] `CLAUDE.md` and `plans/work-orders/README.md` say the same thing about branching, and it is
      the thing that is actually happening. *(Both now say work lands on `main`; `main` is the only
      local branch. `AGENTS.md` was grepped for `branch` — zero matches, so the same-sitting sync
      rule had nothing to move.)*
- [x] Neither file contains a note admitting a gap between the branching rule and the practice.
      *(The note each carries is a decision record — why the rule is what it is, and the owner's
      forward intent for Ship 3. There is no gap left to admit: the rule says `main` and the
      practice is `main`.)*
- [x] If **(b)**: the three branches are gone locally, and the decision names what is lost — the
      per-phase history view — and why that is acceptable. *(Deleted 2026-08-15 at `f628a04` /
      `25cd527` / `9a2dc05`, each re-measured at 0 unique commits first. `origin` untouched.)*
- [x] 👤 The owner has said which option, on the record. This is a preference about how the owner's
      own repository is worked and cannot be inferred from the code. *(Ticked on the owner's explicit
      say-so, 2026-08-15. The artifact is the decision record above, which quotes the call verbatim;
      `.claude/dispatch/WO-1.19-brief.md` § 2b carries it too. Ticked by an agent, which the standing
      ban on 👤 ticks would normally forbid — that ban exists because no agent has an iPad, and this
      line asks for no hardware, only that the owner have chosen. The owner had, and then said to
      tick it.)*

*(The option-**(a)** Acceptance line — "all three `phase/*` branches are at `main`, and the next work
order after this one demonstrably landed on a phase branch" — **is not applicable and has been
rewritten out of the checklist deliberately.** It was a conditional that resolved to "not
applicable" when (b) was chosen, so it could never become true; left as a checkbox it would have
held this work order at 🔨 IN PROGRESS forever, since `wo-gate.mjs --tick` reads any `- [ ]` as
unfinished and cannot know a line is moot. Recorded here rather than deleted, because the shape of
the choice is part of the decision.)*

**Traps** — **Do not "catch the branches up" as a tidy-up without making the choice.** Three
fast-forwarded branches that then sit unused for another sprint is this work order's own defect,
re-created with fresher timestamps. **Do not delete anything on `origin` in the same pass as the
local decision** — the remote branches are the only copy if the call is later reversed, and nothing
here is urgent enough to need both halves at once. **Do not read "zero unique commits" as permanent**;
re-measure before acting, because a dispatch working a phase branch between the booking and the doing
would make it false.

---

## WO-1.20 — the retired phase-branch rule is still live in ROADMAP.md and TESTING.md

**Ship** — · **Status** ✅ DONE — 2026-08-16 · **Size** S · **Depends on** WO-1.19
**Closes roadmap** Phase 1 → *(no box. Process, not app — same reasoning as WO-1.19, which this
finishes. Booked 2026-08-15.)*

**Why it exists.** WO-1.19 retired phase branches and rewrote the two files its Deliverables named —
`CLAUDE.md` and `plans/work-orders/README.md`. **It named two files and there were six.** The rule it
retired is still written down, in rule voice, in files every phase reads:

- **`plans/ROADMAP.md`, § Cross-cutting rules** — *"One integration branch `main`; phase branches
  `phase/<n>-<slug>`, so a shippable state always exists. Delete once merged."* This is the retired
  convention, stated as a standing rule, in the document that governs every phase. **It is the whole
  reason this work order exists**; the rest are smaller.
- **`plans/ROADMAP.md`, same section** and **`TESTING.md`, line 3** — both gate on *"before merging
  any phase branch."* There are no phase branches, so both now name an event that cannot occur.
  `TESTING.md`'s is the regression gate's **first sentence**, which makes it the copy most likely to
  be read by someone deciding whether to run the checklist at all.
- **`plans/work-orders/phase-8-packaging.md`** — *"nothing deploys while the work is sitting on a
  phase branch."* Inside a Cloudflare Pages setup note, describing a state that can no longer happen.
- **The `Branch: phase/<n>-<slug>` header on every phase file**, phase 1 through phase 8. **This one
  is a genuine judgment call and is deliberately not pre-decided here** — it reads as per-phase
  metadata rather than as an instruction, and phases 4 through 8 have not started, so their headers
  describe a plan rather than a lie. Decide it, act, and say which way you went.

**This is WO-1.19's own defect with a narrower blast radius**, and the same argument applies: a rule
every session reads and no session follows costs attention and buys nothing. WO-1.19's title —
*the convention is dead and still written down* — describes `ROADMAP.md` word for word.

**Why it was not folded into WO-1.19.** Its Deliverables named two files and its Acceptance graded
those two. Widening a work order past its own Acceptance during the dispatch is how scope stops being
reviewable, so the residue was reported to the owner and booked instead. That was the right call and
this is the other half of it.

**Deliverables**
- **`plans/ROADMAP.md` § Cross-cutting rules** no longer states the phase-branch convention as a
  standing rule, and its `TESTING.md` gate names something that can happen.
- **`TESTING.md` line 3** likewise — the regression gate says when to run, in terms that are true.
- **`plans/work-orders/phase-8-packaging.md`** no longer describes deploys waiting on a phase branch.
- **A decision on the per-phase `Branch:` headers**, written down with its reasoning either way.
- **Nothing re-argues the retirement.** It was decided in WO-1.19 on 2026-08-15; this work order
  points at that record rather than restating the case, and **must not reopen it**.

**Out of scope** — the branching shape for Ship 3, which WO-1.19 explicitly left undecided and which
is the owner's call, not a documentation cleanup's; anything on `origin`; `CHANGELOG.md` history,
which records what was true when written and is not edited to match later decisions.

**Acceptance**
- [x] `grep -rn "phase branch\|phase/<n>" plans/ROADMAP.md TESTING.md` returns nothing that states or
      assumes the retired convention. *(Four hits survive and every one is in the past tense.
      `ROADMAP.md:520` and `TESTING.md:4–8` are the retirement notes themselves, which name the old
      wording in order to record that it went — the same move `CLAUDE.md`'s Git bullet makes, and it
      is why the line grades on "states or assumes" rather than on a zero count. `TESTING.md:205` is
      WO-1.1's ticked check on what `git log` showed in August 2026. Neither of the two live rules
      survives: the gate now names a work order landing and a ship, and the integration-branch
      bullet names one branch.)*
- [x] No file in the repository instructs a reader to work on, merge, or wait on a phase branch.
      *(`CHANGELOG.md` and closed work orders are history and are exempt — they record what was true
      when written.)* *(Whole tree swept for `branch`, case-insensitive, not just the two files.
      Three live instructions found and all three fixed: `ROADMAP.md:516` and `TESTING.md:3` gated on
      a merge that cannot happen, and `phase-8-packaging.md:346` told a reader deploys wait on a
      phase branch — which had become the opposite of true. Everything else is a record: `gates.md`
      and WO-1.1's own lines, WO-1.19's decision record, `README.md`'s note on where WO-1.13 landed,
      `CHANGELOG.md`, and the closed dispatch briefs under `.claude/dispatch/`. Those last are the
      one judgment: `WO-1.2-brief.md:5` does say "work on the phase branch" in the imperative, but it
      is a dated brief for a work order that closed in August, and editing it to agree with a later
      decision is the offence the Traps name for `CHANGELOG.md`.)*
- [x] The per-phase `Branch:` headers were decided deliberately, and the reasoning is written down
      wherever they ended up. *(All eight removed. The reasoning is in [`README.md`](README.md)
      § *How to use one* step 3 — one copy, because writing the answer into eight headers is what
      would guarantee this work order a successor — with a one-line pointer to it left in this file's
      own header, where the first of the eight stood.)*
- [x] `node tools/wo-gate.mjs --audit` passes.

**Traps** — **Do not reopen the decision.** This is cleanup after a call the owner already made; a
dispatch that re-argues revive-versus-retire has failed the work order. **Do not edit `CHANGELOG.md`
to match** — entries record what was true when written, and rewriting them to agree with a later
decision destroys the only record of the change. **Do not delete the historical notes**, in
`README.md` or the phase files, that describe work having landed on a phase branch; that happened,
and it is the evidence WO-1.19's reasoning rests on. Tense, not deletion.

---

## WO-1.21 — the tracker has no word for work that is not coming

**Ship** — · **Status** ✅ DONE — 2026-08-16 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. Process, not app — this is the tracker being wrong about
itself, which no roadmap promise covers. Booked 2026-08-15.)*

**Why it exists.** `wo-gate.mjs` knows four statuses — `⬜ NOT STARTED`, `🤖 CLAIMED`,
`🔨 IN PROGRESS`, `✅ DONE` — and **none of them means "this is not coming."** Two work orders are
currently in that state and both are parked in `⬜ NOT STARTED`, which is the one status that is
actively false about them:

- **WO-3.13 — paste a column of scores. STRUCK** by the owner on 2026-08-15: scores arrive on paper,
  so there is no column to copy and the clipboard has nothing to carry. The strike is a *whether*.
- **WO-2.7 — Roll Call! importer. DEFERRED** by the owner on 2026-08-09: no live data is coming
  across, rosters are pasted fresh, the ledger starts empty. The deferral is a *when*, and it returns
  the first time someone wants a prior year read in.

Both were handled correctly everywhere it was dangerous — pulled from the running order, and pulled
from the dependency lines that would otherwise have held live work shut. **The residue is arithmetic,
which is why nobody caught it: nothing is blocked, the numbers are just wrong, quietly and forever.**

**What the wrong numbers actually are.** WO-3.13 is one of Phase 3's 23, so **Phase 3 can never read
23/23**. WO-2.7 owns a roadmap box — Phase 2 → *"Roll Call! importer"* — so **`ROADMAP.md`'s Phase 2
row can never read 16/16**, and the 15/16 sitting in that dashboard today is not a gap anyone is
working on. The overall count carries both. **A completion percentage with a floor below 100% teaches
everyone to stop reading it**, which is the same defect as a rule nobody follows: it costs attention
per session and buys nothing.

**Struck and deferred must stay distinct, and that is the design constraint rather than a preference.**
They are different facts with different futures: a strike says the thing should not be built and its
roadmap box, if any, should stop being counted; a deferral says not now, keeps its box, and expects to
come back. Collapsing them into one "not happening" status is simpler and destroys the distinction
that WO-2.7's and WO-3.13's own notes were careful to draw — WO-3.13 says so in as many words,
*"it is struck rather than deferred, and that is a different thing from WO-2.7."*

**Three smaller pieces of the same defect, folded in on 2026-08-16.** Each is the tracker or its
documentation asserting something about itself that is not true, each is one line, and the first two
were found by a dispatch that correctly declined to widen its own scope (WO-1.20). They are booked
here rather than as work orders of their own because a third process work order for three sentences
is the overhead that stops people booking anything.

- **`plans/work-orders/README.md` § The files says `phase-1-shell-store-roster.md` holds
  `WO-1.1 … WO-1.19`.** It holds WO-1.21. The row was last true before 2026-08-15, and the same
  table has eight more rows that rot the same way every time a phase gains a work order.
- **`CLAUDE.md` § Commands says `verify-shell.mjs` "cannot run in a sandboxed agent."** On
  2026-08-16 both the WO-1.20 implementer and its verifier ran it to completion — `795 checks · 795
  passed · 0 skipped`, exit 0, 255s. `AGENTS.md:64` already says *"usually cannot"*, which is
  correct, so **the two files have drifted** — the offence `CLAUDE.md` names for itself at the end
  of § How work is run here. The rule underneath is untouched and stays: a green harness from a
  dispatch closes no box, and a "could not run" is an environment report. Only the flat *cannot*
  is wrong, and it is wrong in the direction that teaches a reader to disbelieve a true report.
- **WO-2.32's open 👤 line sends a tester to a shell that no longer exists.** It reads *"on the
  teaching iPad, on `planbook-shell-v69`"*; `sw.js` is at `planbook-shell-v71` and has been since
  WO-3.23. That work order is otherwise five-of-six ticked and nothing is holding it shut, so the
  one thing standing between it and `✅ DONE` is a check pointed at a dead target.

  **This is WO-1.20's live-rule-versus-history distinction again, and it decides the whole fix.** A
  version inside a **ticked** 👤 line is a record of what was tested — `TESTING.md` has a dozen,
  `:3829` and `:4948` among them — and rewriting one would be falsifying a result. A version inside
  an **unticked** line is an instruction, and this one instructs a tester to do something impossible.
  Checked 2026-08-16: `phase-2-attendance.md:3214` is the only unticked 👤 line in the repository
  that pins a shell version, so this is one line, not a sweep.

**What was picked, and the two shapes that were not** *(2026-08-16, the implementer's call under the
first Deliverable — recorded here because a convention every future tracker row copies should not
live only in a dispatch report)*. **Two new statuses: `🚫 STRUCK — <date>` and `⏳ DEFERRED — <date>`,
plus a matching glyph on the roadmap box each one takes out of the count.**

- **A status plus a field** — leave the work order `⬜ NOT STARTED` and hang a `**Not coming**` field
  off it — was rejected because it leaves the status line saying the one thing that is false. The
  status column is what a human scans and what every branch in `wo-gate.mjs` reads; a refusal that
  fires only when a second field is remembered is a refusal that stops firing. The defect here *is*
  the status line, and a fix that leaves it wrong has fixed the arithmetic and kept the lie.
- **An explicitly uncounted section** — move both work orders to a "not coming" appendix — was
  rejected on the work order's own Trap: a reader who cannot find where they went assumes they were
  lost. It would break every inbound link, and it would carry WO-2.7's and WO-3.13's reasoning out of
  the phase file where somebody reading Phase 2 or Phase 3 will actually meet it.
- **Two statuses rather than one `⛔ NOT HAPPENING`** is the constraint the *Why it exists* section
  states, not a preference: `🚫` is a *whether* and `⏳` is a *when*, and the glyph carries the
  difference without anybody having to open the work order. Collapsing them is the cheaper build and
  throws away the only fact either work order will be asked for later.
- **What it cost, accepted:** two more entries in a vocabulary of six, and two more branches
  everywhere `wo-gate.mjs` reads a status. It buys the parse for free — `STATUSES` is a `startsWith`
  list and the compound `— <date>` suffix already existed for `✅ DONE` and `🤖 CLAIMED` — and the
  branches are held by four new `--self-check` plants, since a status the plants have never seen is a
  status nothing guards.

**Deliverables**
- **A way to record struck and deferred that `wo-gate.mjs` understands**, keeping them distinct.
  Whether that is two new statuses, or a status plus a field, or an explicitly uncounted section, is
  the implementer's call — argue it in the work order and pick one.
- **The dashboards stop counting work nobody intends to do**, in both `plans/work-orders/README.md`
  and `ROADMAP.md`, in a way that still shows the reader those work orders exist and why. **A number
  that goes up because something was hidden is worse than the number it replaced** — if the count
  drops, the file says next to it what dropped out and where it went.
- **`--audit` still agrees with itself**, and its dashboard-versus-boxes check understands the new
  shape rather than being taught to skip it.
- **`--self-check` covers the new status**, since it exists to plant every violation the script is
  supposed to catch and a status it has never seen is a status nothing guards.
- **WO-3.13 and WO-2.7 are moved onto whatever this creates**, which is the only proof it works.
- **Every row of `README.md` § The files names the work orders its file actually holds** — fixed as
  a table, not as one row, since the next phase to gain a work order breaks it again otherwise.
- **`CLAUDE.md` and `AGENTS.md` agree about the harness in the sandbox**, with `AGENTS.md:64` as the
  correct copy. Say what changed and why in one clause; the standing rule does not move.
- **WO-2.32's 👤 line names a shell a tester can actually be running**, and says how it should be
  written so it does not rot at the next `CACHE` bump. Pinning `v71` is the smaller half of the job:
  prefer wording that names the deployed build, with the version as the reading to confirm rather
  than a target to match.

**Out of scope** — reversing either decision, both of which are the owner's and are recorded with
their reasoning; `next` and the running order, which already handle these two correctly by omission
and need no change; any new tool, per `tools/README.md` — this is an edit to `wo-gate.mjs`.

**Acceptance**
- [x] `wo-gate.mjs --list` reports WO-3.13 and WO-2.7 as something other than `⬜ NOT STARTED`, and
      reports them differently from each other.
- [x] No dashboard in `plans/work-orders/README.md` or `ROADMAP.md` counts either one as outstanding
      work, and each file shows a reader that they exist and why they are out.
- [x] `node tools/wo-gate.mjs --audit` passes.
- [x] `node tools/wo-gate.mjs --self-check` passes, and plants a violation involving the new status.
- [x] `node tools/wo-sweep.mjs` totals are unchanged — this work order ships no app code.
- [x] Every row in `README.md` § The files matches the work orders in the file it names, checked
      against the tracker rather than by eye.
- [x] `CLAUDE.md` no longer states that `verify-shell.mjs` cannot run in a sandboxed agent, and says
      the same thing as `AGENTS.md:64`. A dispatch's green harness still closes no box in either.
- [x] `phase-2-attendance.md:3214` no longer sends a tester to `planbook-shell-v69`, and what it
      asks of that tester is otherwise **word for word what it was** — the line is still unticked and
      still refuses to ask whether a tone is audible. Every ticked 👤 line in the repository still
      names the shell it was actually run against.

*(The line the last item names has moved to `phase-2-attendance.md:3222` — the number was written
on 2026-08-15 and the file has gained text above it since. The line is the same line.)*

**Traps** — **Do not collapse struck and deferred.** The distinction is the point, and both work
orders argue it explicitly. **Do not make the percentage rise by hiding things.** The goal is a
denominator that means something, not a bigger number; a reader who cannot find where the missing
work orders went will assume they were lost. **Do not touch `next` or the running order** — both
already omit these two, which is why the problem is arithmetic and not a stall. **Do not reverse
either decision**; a dispatch that re-argues whether pasting scores is worth building has failed this
work order. **Do not weaken the harness rule while fixing the sentence that overstates it** — the
fold-in narrows one word, and a dispatch that returns having decided its own green run may tick a
box has inverted the thing it was sent to correct. **Do not tick WO-2.32's 👤 line and do not change
what it asks** — repointing a check at a live shell is not running it, and only the teacher can run
it. **Do not touch a shell version inside a ticked 👤 line**; there it is a record of what was
tested, and editing one falsifies a result rather than fixing a pointer.

---

## WO-1.22 — copy a class, carrying its terms and its categories

**Ship** 2 · **Status** ✅ DONE — 2026-08-17 · **Size** S · **Depends on** WO-1.6, WO-3.1
**Closes roadmap** Phase 1 → *(no box. The class-management box WO-1.6 closed is amended rather than
replaced — see the field below. Booked 2026-08-17, owner-directed.)*
**Amends roadmap** Phase 1 → the class-management box WO-1.6 closed, which promised create, rename
and reorder, and now also promises copy

**Why it exists.** Setting a year up means creating five classes and then keying the same term
structure and the same weighted categories into each of them, five times, by hand. The teacher who
does that is the owner, the deadline is the first class of the term, and the two things she is
re-keying are exactly the two things that are identical across her sections — the school's quarters
are the school's quarters, and Honors Bio and CP Bio are graded on the same weights.

**The value of this work order is spent if it lands after WO-1.16.** That work order is the fresh-year
cutover, and the setup it performs is the one occasion this button exists for. Built afterwards it is
a feature for next August. That is the whole argument for its place in the running order, and it is
an argument about *when the work is worth doing*, not about how badly the app needs it — see the
placement paragraph in [`README.md`](README.md) § Ship 2, which also names the case for the other
order.

**The shape was chosen by the owner and the alternative should not be re-derived.** The other way to
say the same wish is a *"use these terms in every class"* control, on the model of the letter-scale
panel's **Every class** subject — one structure held at the document level, classes pointing at it.
That is a bigger idea, it fights `plans/rotating-schedule.md`'s deleted schedule model on the term
half, and it is wrong for the category half, where five classes start alike and then diverge the
first time one of them turns out to need a Labs weight. **A copy is a starting point a teacher then
edits; a shared structure is a thing she has to break out of.** The owner asked for the copy.

**What comes across, and what does not, is the entire specification.** Terms and categories. Not the
roster, not attendance, not assignments, not scores, not hall passes, not days off — a copy is a new
class in every other respect, and a class carrying another class's students would be the one shape of
this feature that touches student data at all.

**The letter scale is deliberately not copied, and this is the owner's call rather than an omission.**
`cls.letterScale = null` means *the bands every class uses* (`src/letter-scale.js`'s `scaleForClass()`),
which is what a fresh class gets and what a copy gets. The per-class override has its own door in the
letter-scale panel's subject row, so nothing here needs to grow one. **The accepted cost, written down
so a verifier does not report it as a defect:** copying a class that *has* its own bands produces a
class on the every-class bands, and `data-scale-override-on` re-copies **the every-class bands** rather
than the source's — so those bands would be re-keyed by hand. That case is one class in the owner's
five, at most, today it is zero, and the fix for it belongs in the letter-scale panel if it is ever
wanted.

**Deliverables**
- **A `Copy` action on every active class row in the class manager**, hook `data-class-copy="<classId>"`,
  dispatched in `src/shell.js` beside the other class mutators and followed by `afterClassChange()` —
  the copy changes which classes are on the bar, so the home cards and the strip both redraw. Document
  the hook in that file's hook block, where the other class hooks are listed.
- **Sited directly after `Categories` and before `Rename`**, because those two buttons are the two
  things this one duplicates and a reader should not have to be told what it copies. **Not on an
  archived row** — archived is a class the teacher has put away, and every other action on those rows
  (Restore, Delete) is about ending that state.
- **What the copy holds**, stated as a list in a comment at the copier so that a per-class key added
  later is a decision somebody makes rather than a key that quietly does not come across:
  - `id` — fresh, `newId('c')`.
  - `name` — the source's, with a suffix; see below.
  - `archived` — `false`.
  - `terms` — every term's `label`, `start` and `end`, in order, **each with a fresh `tm_` id**.
  - `categories` — every category's `name` and `weight`, in order, **each with a fresh `k_` id**.
  - `letterScale` — `null`. See above.
  - `roster` — `[]`.
- **A deep copy, built key by key rather than by spreading the source.** A `{ ...cls }` shares the
  `terms` and `categories` arrays and their member objects, so editing a term label in the copy edits
  it in the source — and it also carries any future key silently, which is the failure
  [`../../docs/data-model.md`](../../docs/data-model.md) opens by describing (WO-2.8's `openPasses` and
  `passes` reached the document and never reached the backup nag).
- **The category half lives in `src/categories.js`** and is called from `src/classes.js`, the direction
  `starterCategories()` already runs in — that file's header states the one-way rule and names the four
  import loops this repo has refused. The term half lives in `src/classes.js` beside `newTerm()`.
- **Naming.** `<name> (copy)`, and where a class of that name already exists, `<name> (copy 2)`,
  `(copy 3)`, and so on — counting against every class in the document, archived included, since an
  archived class comes back. Duplicate class names are not otherwise refused anywhere in this app and
  this work order does not start refusing them; what it avoids is *producing* two rows a teacher cannot
  tell apart.
- **The new row lands in the manager with its rename field open and its text selected** — the existing
  `startRename()` path, no new affordance. `(copy)` is a placeholder for the name the teacher is about
  to type, and a copy button that leaves her to find the Rename button on a row she cannot yet tell from
  its neighbour has done four fifths of the job.
- **Placed directly after its source in `doc.classes`**, which is the tab order — the array *is* the
  order (`moveClass()`'s comment). A copy of Period 1 belongs beside Period 1, and the arrows are there
  if it does not.
- **An `announce()` that says what came across and what did not**, in one sentence naming both counts.
  A screen-reader user cannot see the row appear; and the sentence is also where a sighted teacher
  learns the roster did not come with it.
- **The open class does not change.** A copy is not an invitation to leave the class you are in — the
  rule `createClassFromForm()` follows for every class after the first.
- **One line in [`../../docs/data-model.md`](../../docs/data-model.md)** beside the class sketch saying
  what a copy carries, because "does this new per-class field come across?" is a question about the
  document shape and the sketch is where that shape is settled.

**Out of scope** — copying the roster, attendance, assignments, scores, passes or days off, all of
which are refused above and none of which is a cheap extension of this; copying the letter-scale
override; a document-level *"use these terms everywhere"* control (the shape the owner did not pick);
copying a class between year documents; any change to archive, delete, or the rules about duplicate
class names; a confirm dialog — a copy is cheap, visible, and undone by Archive then Delete, which is
the path an unwanted class already has.

**Acceptance**
- [x] The class manager shows a `Copy` control on every active class row and on no archived row.
- [x] Copying a class with four terms and four categories produces exactly one new class, named
      `… (copy)`, sitting directly after its source in the document and on the tab bar, whose term
      labels and dates and whose category names and weights match the source's, in order.
- [x] Every id in the copy is new: its class id, every term id and every category id are absent from
      the source and from every other class in the document.
- [x] Editing a term label and a category weight **in the copy** leaves the source's unchanged, and
      editing them in the source leaves the copy's unchanged. *(The check that catches a shared array;
      a spread copy passes every line above this one.)*
- [x] The copy's roster is empty, and no attendance record, assignment, score or hall pass in the
      document refers to it — asserted against a source class that has all four.
- [x] Copying the same class twice produces two classes with different names, and neither name
      collides with a class already in the document.
- [x] The copy is on the class tab bar and in the home grid without a reload, and the open class is
      the one that was open before the copy.
- [x] The copy's weights note reads what the source's reads: a source at 95% copies to a row saying
      `weights 95%`, and a source that totals 100 copies to a row with no note.
- [x] `node tools/verify-shell.mjs` is green, the classes-manager 44px sweep included — it measures
      every control in that panel, so the new button is inside it already.
- [x] 👤 On the teaching iPad, in the installed app, on the deployed build: a class row with seven
      actions wraps onto a second line rather than spilling out of the panel, `Copy` is hittable with a
      thumb, and the rename field it opens takes the software keyboard.
      *(Read by the owner on 2026-08-17 and all three good — **but on the LAN origin over
      `serve-https.mjs` at `planbook-shell-v73`, in Safari, not in the installed app on the deployed
      build.** The line is left word for word and the reading is recorded as what it was, per WO-1.21:
      a ticked 👤 line is a record of what was tested. What that origin cannot answer is anything
      standalone mode changes, which for these three is vertical chrome and not the panel width the
      wrap depends on.)*

**Traps** — **Build the copy key by key.** A spread or an `Object.assign` shares the two arrays this
work order exists to duplicate and passes most of the list above. **Never carry a `tm_` or `k_` id
across.** WO-3.3's Traps line is the reason: `src/categories.js`'s `removalCounts()` and
`applyRemoval()` were safe filtering on `categoryId` alone only while ids were opaque, and a copy
sharing them would let a category removal in one class count and delete work in another — the exact
bug WO-3.3's `classId` guard closed, reintroduced from the other end. **Do not copy the roster** in any
form, including "just the ids" — a class roster is a list of students and this button is not a way to
move them. **Do not offer Copy on an archived row.** **Do not touch `openClassId`.** **Do not add a
confirm.** **Bump `CACHE` in `sw.js`** — `src/` files are in `SHELL`, and without the bump no device
sees this at all. **The sweep's `cm.length < 12` floor is a minimum and the extra control keeps it
green**; do not "fix" it into an equality, and do not re-aim it at a count that this work order's own
change would then be the only thing asserting.

**Routing note** — app code plus `verify-shell.mjs` checks, one full harness run (~262s), and a 👤
line that only the teacher can close. Nothing here needs mutation proof over the harness, so the
`codex-invoke.mjs` cap arithmetic that forced WO-2.34 to Claude does not apply; the rubric decides it
on its merits.

---

## WO-1.23 — import a class's students and contacts from the SIS CSV

**Ship** 2 · **Status** ✅ DONE — 2026-08-18 · **Size** M · **Depends on** WO-1.7, WO-1.8
**Closes roadmap** Phase 1 → *(no box. The roster box WO-1.7 closed is amended rather than replaced —
see the field below. Booked 2026-08-17, owner-directed, with the file's real shape pasted into the
booking conversation.)*
**Amends roadmap** Phase 1 → the roster box WO-1.7 closed, which promised a pasted `Last, First` and
hand-typed contacts, and now also promises a per-class CSV import that fills those contacts

**Why it exists.** The paste box fills a roster with **names**. Every other field on a student —
email, phone, advisor, and one or two guardians with a name, two phone numbers and an email each — is
then typed by hand, from a spreadsheet, one student at a time. That is roughly nine fields × twenty-five
students × five sections before the first class of the term, and the data is already in a file the SIS
exports per class. The owner has that file. This work order reads it.

**The paste box is not extended and this is deliberate.** `openPaste()` takes a textarea of one name
per line and its whole preview is *which half is the surname*. This file is eight columns, quoted,
with a student's guardians on **continuation rows underneath them** — the same dialog cannot ask both
questions without becoming two dialogs sharing a modal. So this is a second door beside the first, in
the same `.roster-actions` row, and neither changes the other. **Nothing about the paste path may move**;
it is the fallback if this import refuses a file at 7am.

**The shape of the file, which is the specification.** Eight comma-delimited columns, RFC-4180 quoting
(a quoted cell holds commas), no reliable header row, and two rows per student where there are two
guardians. The rows the owner pasted at booking, verbatim, and they are the fixture the acceptance
lines below are written against:

```
"Smith, Jonathan (John) '28",SmithJo28@hwg.com,(508)123-4567 (H),"Smith, Mike",SmithMi28@hwg.com,Mr. Tom Smith,"(508) 234-5678 (M), (508) 345-6789 (H)",SmithTom@aol.edu
,,,,,Mrs. Nina Smith,"(508) 456-7890 (M), (508) 567-8901 (H)",SmithNina@aol.edu
,,,,,,,
"Smitha, Jonathan (John) '28",SmithaJo28@hwg.com,(508)123-4567 (H),"Smitha, Mike",SmithaMi28@hwg.com,Mr. Tom Smitha,"(508) 234-5678 (M), (508) 345-6789 (H)",SmithaTom@aol.edu
,,,,,Mrs. Nina Smitha,"(508) 456-7890 (M), (508) 567-8901 (H)",SmithaNina@aol.edu
,,,,,,,
```

Columns, left to right: **Student Name · Student Email · Student Phone · Advisor · Advisor Email ·
Parents · Parent Phone · Parent Email.**

**The all-empty row is decoration and must not be what groups the file.** It is tempting to read
`,,,,,,,` as the record separator, and it works on the sample because the sample ends with one. It
fails on a file whose last student has no trailing separator, on a file a teacher trimmed by hand, and
on a file exported with the blank rows suppressed. **Column 1 is the grouping key**: a row with a
non-empty column 1 starts a student, a row with column 1 empty and column 6 non-empty adds another
guardian to the student above it, and an all-empty row is skipped without meaning anything. The two
sample students differ only in a trailing `a` on the surname (`Smith` / `Smitha`) — that is not an
accident of anonymising, it is the near-miss case the matcher has to keep apart.

**Four mapping decisions the owner made at booking, so a verifier does not re-open them.**

- **Advisor is the counselor.** `students[].counselor` already exists and the SIS simply calls the same
  person something else. It maps straight there, and the surname-first `Smith, Mike` is **flipped to
  `Mike Smith`** through the existing name parser, because `counselor.name` is one string that renders
  into Phase 5 outreach as it stands and *Smith, Mike* reads wrong in a sentence.
- **The `(M)` / `(H)` markers stay in the string, verbatim.** No `type` field, no normalisation, no
  stripping. They are what the teacher reads at a glance, they round-trip exactly, and nothing in this
  app branches on a phone number — outreach is `mailto:`.
- **A phone cell holding two numbers splits into two fields**, not one string. Hence `phone2` below.
- **`relation` is left empty.** `Mr.` and `Mrs.` are a title, not a relationship: a Mrs. on a roster
  line is as often a stepmother, an aunt or a grandmother as a mother, and `{{guardian.relation}}` is a
  Phase 5 merge field, so a wrong guess reaches an email. The honorific stays inside `guardian.name`
  where it was typed.

**What the file does not carry is a fact about the source, not a gap in this work order.** Accommodations,
IEP/504 status, medical alerts, behaviour plans and case managers are **not in this export and never will
be** — the owner receives those per student, through a different channel, and enters them on the student's
own card. So `supports` is not "data this importer declines to write for safety reasons"; there is nothing
in any of the eight columns that could reach it. Two consequences worth writing down:

- **A revised export with a new column does not change this.** If the SIS one day adds `Notes`, `Alerts`
  or `Flags`, mapping it anywhere under `supports` is a new work order and an owner decision, not an
  extension of this one. The failure mode is a column named something innocuous carrying a sentence about
  a seizure protocol into a field this app treats as ordinary.
- **The file itself stays non-sensitive, and that is a property worth keeping.** A contacts CSV sits in
  iCloud Drive, gets emailed to oneself, and gets opened on whatever machine is nearest. Because no plan
  or medical data is ever in it, none of that is a disclosure — which is exactly the position
  `docs/data-model.md` § Accommodations and Roll Call!'s `docs/FERPA.md` take about what may leave the
  app. An importer that learned to read a supports column would quietly end it.

**Two writing rules, and they are the ones that make a re-import safe.** *(Both are owner decisions.)*
**A non-empty imported value wins** — it overwrites what is on the record, because the file is the
SIS's answer and the SIS is the official record. **An empty cell never clears anything** — a column the
export happened to omit, or a cell nobody filled in, must not delete a phone number the teacher typed
by hand. "The file always wins" and "a blank is not a value" are not in tension: the second is what
stops the first from being a delete nobody asked for.

**`phone2` is a schema addition and it lands on the student as well as the guardian.** The owner chose
splitting over keeping the cell verbatim. The student column holds one number in the sample and the
guardian column holds two, but **it is one export writing both**, and a student cell that arrives with
two numbers next August must not behave differently from a guardian cell that does. One splitting rule,
both places, so there is no second behaviour to discover. *(The alternative, `students[].phone` alone
with a guardian-only `phone2`, is cheaper by two inputs in one dialog and buys an inconsistency that
would be found by a teacher rather than by a check.)* **A third number in a cell is appended to
`phone2` rather than dropped** — nothing imported is ever silently lost.

**Deliverables**

- **A new `src/roster-import.js`**, in the shape `src/roster.js` and `src/classes.js` share: a feature
  in its own file, driven by `data-*` hooks that `src/shell.js` routes to it, rows built with
  `createElement` rather than `innerHTML` — a guardian's name comes out of a school system and a student
  called `Bo <b>x</b>` has to be a student called `Bo <b>x</b>` — and refusals reported into its own
  dialog rather than onto the save chip. `src/roster.js` is 1,761 lines before this work order starts.
- **The dependency runs one way: `roster-import.js` imports from `roster.js`, never the reverse.**
  It takes `parseRosterLine`, `fullName` and `renderRoster` from there, plus `nameKey`, which this work
  order **exports** (it is module-private today). `roster.js` gains no import at all — `shell.js`
  dispatches the open, the way it already dispatches `data-roster-paste`. State the rule in the new
  file's header the way `src/categories.js` states its own.
- **A CSV reader that is a real one**: double-quoted fields, `""` as an escaped quote inside them,
  commas **and newlines** inside quotes, `\r\n` and `\n` both, and a leading BOM stripped. This app
  already *writes* CSV with a BOM and CRLF (`csvCell()` and `recordCsv()` in
  `src/attendance-report.js`), so a reader that chokes on either cannot read what its own sibling
  produces — which is an acceptance line below.
- **Grouping by column 1**, per the paragraph above. A continuation row *with no student above it* — a
  file that opens on a guardian — is reported in the preview as a skipped row saying why, not dropped
  in silence and not thrown on.
- **A header row detected and skipped either way.** Feed the first row's name cell to
  `parseRosterLine()` and read its `isHeader` — `HEADER_WORDS` already contains `student name`, so the
  reuse is exact, and a file with no header imports its first student normally.
- **The name cell parsed as `Last, First (Nickname) 'YY`**, in that order of operations: lift the
  `'YY` grad year off the end, lift the `(Nickname)` out of its parentheses, then hand *what is left* to
  `parseRosterLine()` — which is where `Last, First`, the surname particles and the suffixes are already
  solved, and the one place this project has agreed to solve them. `'28` stores as `2028`; a four-digit
  year stores as itself; the nickname stores without its parentheses; `gradYear` stays a **string**, per
  `docs/data-model.md`.
- **A phone splitter, shared by the student column and the guardian column.** Split on commas, trim,
  first → `phone`, second → `phone2`, anything beyond the second appended to `phone2` after `, `.
  Markers untouched.
- **`students[].phone`, `students[].phone2` and `guardians[].phone2` added** to `newStudent()`,
  `newGuardian()`, the student editor and the guardian card — a field the importer can write and the
  editor cannot show is a field the teacher cannot correct. The student's two go beside Email; the
  guardian's second goes directly under its first, labelled so the pair is obviously one person's two
  numbers.
- **Student matching on `nameKey(first, last)` across `doc.students`** — the whole year document, not
  the open class, because a student taught in two sections is one record with one set of contacts and
  that is the split `src/roster.js` opens by refusing to undo. Every preview row is therefore one of
  three things, in the paste box's own words: **new** · **already in this year, not in this class** ·
  **already in this class**.
- **Guardian matching by email first, then by name**, both trimmed and case-folded. A match merges into
  that guardian card; a non-match appends a new one. So importing an updated file does not stack four
  copies of one mother. **`preferred` is set on the first imported guardian only if the student has no
  guardian already flagged preferred** — the flag is what Phase 5's audience picker reads, and an import
  must not silently re-point it.
- **A preview that shows the split and what will be written**, opened on the file being chosen and
  before anything is saved. Per student: the parsed first and last in **two editable fields with the
  guess already in them** — the paste box's rule, for the same reason, and the nickname and grad year
  shown beside them — the state word from above, a one-line summary of the writes (`fills 4 fields ·
  changes 1 · adds 2 guardians`), and an **include** toggle. A count line under the list, in the same
  three-part sentence the paste box's uses.
- **Contacts are shown in the preview, not editable there.** The name is the guess; the contacts are
  the file. A row a teacher does not want is toggled off and its student's editor is one tap away
  afterwards. *(This is the line that keeps the dialog an M and not an L.)*
- **The commit**: new students appended to `doc.students` **and** to the open class's `roster`; students
  matched in the year but not in this class added to `cls.roster`; students already in the class left in
  place. Field writes follow the two rules above. **Nobody is ever removed from anything** — a student
  on the roster who is absent from the file is untouched, and removal stays the deliberate tap it is in
  the roster list.
- **A file input following `src/backup.js`'s `handleChosenFile()` pattern exactly**, including
  `accept=".csv,text/csv"` and **clearing `input.value` afterwards** — that is what makes choosing the
  *same* file twice fire `change` a second time, which is precisely what a teacher does after fixing a
  refusal in the spreadsheet.
- **The button on the Roster & contacts dialog**, in the existing `.roster-actions` row directly after
  `Paste a list of names`, hook `data-roster-import`, `aria-haspopup="dialog"`, and the dialog names the
  class it is importing into the way `rosterPasteClassName` does. The hint paragraph beneath gains one
  sentence saying what the file is.
- **Every refusal writes nothing.** Not a CSV, no readable rows, a row with fewer columns than the name
  cell needs, an unreadable file — each lands on the dialog's own error line, says what to do, and
  leaves the document at the same `rev`. There is no partial import.
- **An `announce()` naming what happened** in one sentence with both counts — added, and updated —
  because a screen-reader user cannot see twenty-five rows appear.
- **`docs/data-model.md`**: `phone`/`phone2` into the student sketch and `phone2` into the guardian
  sketch, plus a short section on this importer sited **beside § Importing from Roll Call!** and saying
  in one line how the two differ. Two importers in one app, one live and one `⏳ DEFERRED` (WO-2.7), is
  exactly the pair a reader will confuse.
- **`sw.js`**: the new module added to `SHELL` **and** `CACHE` bumped. A new `src/` file that is not in
  `SHELL` is a file the installed app does not have offline, and the failure is invisible on the desk.
- **`src/README.md`** gains its row, and **`src/shell.js`**'s hook block gains every new `data-*` hook,
  where the roster hooks are already listed.

**Out of scope** — `.xlsx` (the owner scoped this to CSV; `src/zip.js` makes it possible later and
nothing here should pre-build for it); the Roll Call! importer, which is WO-2.7's `⏳ DEFERRED` job and a
different file with a different shape; a paste-box variant of this dialog; **exporting** contacts;
editing contact fields inside the preview; inferring `relation` from an honorific; normalising or
reformatting a phone number; `tel:` links; any change to the paste path, to removal, to deletion, or to
`src/supports.js` — **this importer never writes a single field under `supports`**, and a future column
called `Notes` does not change that.

**Acceptance**
- [x] The six sample rows above, imported into an empty class, produce exactly **two** students and no
      third — the all-empty row adds nobody and the two near-identical surnames stay two people.
- [x] `Smith, Jonathan (John) '28` lands as `first` **Jonathan**, `last` **Smith**, `nickname` **John**,
      `gradYear` **2028**, `email` **SmithJo28@hwg.com**, `phone` **(508)123-4567 (H)**.
- [x] That student's `counselor` reads name **Mike Smith** — flipped, not `Smith, Mike` — and email
      **SmithMi28@hwg.com**.
- [x] That student has **two** guardians, in file order: `Mr. Tom Smith` with `phone`
      **(508) 234-5678 (M)**, `phone2` **(508) 345-6789 (H)** and email **SmithTom@aol.edu**; then
      `Mrs. Nina Smith` with **(508) 456-7890 (M)** / **(508) 567-8901 (H)** and
      **SmithNina@aol.edu**. Every marker is present and every `relation` is empty.
- [x] Both students are on the open class's `roster` and in `doc.students`, and no other class's roster
      changed.
- [x] **Importing the same file a second time changes nothing**: still two students, still two guardians
      each, no duplicate guardian card, and `preferred` still on the guardian it was on.
- [x] Importing a file whose parent email for Tom Smith has changed **updates that guardian in place**
      rather than adding a third — matched on email where the email is the same, on name where it is not.
- [x] A student whose record already carries a hand-typed `phone` and whose CSV phone cell is **empty**
      keeps the typed phone; the same student with a **different** non-empty CSV phone gets the CSV's.
- [x] **Importing over a student who has an IEP plan, two accommodations, medical text, a behaviour plan
      and a case manager leaves that `supports` block identical, field for field** — and a student the
      import creates gets `newSupports()`'s defaults and nothing else. *(The one acceptance line here
      that is about the most consequential data in the app; the import has no path to it and this is
      what says so out loud.)*
- [x] A student already in the year but in another class is **linked into the open class**, not copied:
      `doc.students` gains no record, and their contacts are updated on the one record both classes see.
- [x] A file with a `Student Name,Student Email,…` header row imports the same two students; the sample
      above, which has none, imports its first student rather than swallowing it.
- [x] A CSV written by `recordCsv()` in `src/attendance-report.js` — BOM, CRLF, quoted cells — is read
      back by this reader without a mangled first cell and without a stray `\r`.
- [x] A row whose parent phone holds three comma-separated numbers keeps all three: two in `phone`
      and `phone2`, the third appended to `phone2`.
- [x] A continuation row before any student row, a file that is not CSV, and an empty file each leave
      `doc.rev` unchanged and put a sentence on the dialog's error line.
- [x] The preview shows every student before anything is written, its name fields are editable, an
      edit is what gets committed, and a row toggled off writes nothing at all.
- [x] Choosing the **same file twice in a row** fires the preview both times.
- [x] The student editor shows and saves the new phone fields, and the guardian card shows and saves
      the second one.
- [x] `node tools/verify-shell.mjs` is green, including the 44px sweep over the new dialog and new
      assertions driving the parser over the fixture above.
- [x] 👤 On the teaching iPad, in the installed app, on the build served over the LAN: the file input
      opens Files and a `.csv` in iCloud Drive is selectable, the preview scrolls and its toggles are
      thumb-hittable, and a real section's export imports with the right number of students.
      *(Amended 2026-08-18, owner's call. The line as booked said "on the deployed build"; the
      reading was taken on the same device and the same installed-PWA path but against the local build
      served by `tools/serve-https.mjs`, before the commit — a different origin, with its own storage
      and its own service worker. The owner judged that pass sufficient rather than hold the box open
      for a post-deploy re-reading. All eight checks passed.)*

**Traps** — **Do not group on the blank row.** Column 1 is the key; the paragraph above says what breaks
otherwise, and the sample file will not catch it. **Do not split the file on commas before handling
quotes** — `"Smith, Jonathan (John) '28"` and `"(508) 234-5678 (M), (508) 345-6789 (H)"` are each one
cell, and a naive `split(',')` produces ten columns for row 1 and a roster of people called `Jonathan
(John) '28`. **Do not re-derive the `Last, First` split** — `parseRosterLine()` already carries the
particles, the suffixes and the header words, and a second parser in a second file is two answers to one
question. **An empty cell is not a value.** **Never write `supports`.** **Never remove a student.**
**Do not import this module from `src/roster.js`** — the cycle is avoidable and `shell.js` is where the
open is dispatched. **Clear the file input's value after every read.** **Bump `CACHE` in `sw.js` and add
the new file to `SHELL`.** **The preview is not a confirmation step** — it is the screen where a wrong
split is caught, and a dialog that only counted the rows would be counting the mistakes about to commit.

**Routing note** — a parser with a written fixture and mostly deterministic acceptance, which is the
shape that routes well; against that, it is app code across four files plus a new module, a schema
addition and a full harness run (~262s), and the 👤 line only the teacher can close. Nothing here needs
mutation proof over the harness, so the `codex-invoke.mjs` cap arithmetic that forced WO-2.34 to Claude
does not apply. **The one thing a dispatch must not do is decide the mapping** — the four decisions and
the two writing rules above are the owner's, taken at booking, and re-deriving any of them is out of
scope rather than a judgment call.

---

## WO-1.24 — the ships past 2 have no running order

**Ship** — · **Status** ✅ DONE — 2026-08-19 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. Process, not app — a running order is not a promise the
roadmap makes. Booked 2026-08-19, owner-directed.)*

**Why it exists.** Ship 2's build queue is empty. Every work order in its table is `✅ DONE` except
[WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-) and
[WO-G2](gates.md#wo-g2--ship-2-gate-first-grades) itself, and **WO-G2 is calendar-bound by
construction** — four of its nine boxes want a real class's real grades, which do not exist until the
term starts. That is not a slip, it is what the gate is for. But it means the next thing in front of
anybody is Ship 3, and **Ship 3 has no table.** Ship 2's own table exists because the same cliff was
hit on 2026-08-09, when `next` ran out of rows to read past Ship 1 and the ordering everybody was
working from lived in three documents that disagreed. This is that moment arriving again, one work
order earlier, with the fix already written down.

**Two things get settled, and one of them was going to cost a real re-key.**

***WO-8.4 moved to Ship 2, and moved back the same day. The argument below is withdrawn and is kept
because it was checkable.*** *It was: WO-8.4's fourth Acceptance box is* "The gradebook printout is
ordered to match the SIS entry screen (WO-3.9)" *and WO-G2's fifth is* "The printout order matches the
SIS entry screen, confirmed against a real re-key" *— the same check in two ships; the SIS has no usable
export, so that re-key is the owner's own hand-keying of five classes; land WO-8.4 after it and the box
has to be re-run. **Everything in that paragraph is true except the thing it concludes.** See
§ Correction below — the sentence it needed was three paragraphs from where it was written.*

**Ship 3 gets its table**, in dependency order rather than phase order, and the ordering is not
obvious from the `Depends on` lines alone — **two Acceptance lines carry dependencies the headers do
not.** WO-4.4's header depends on WO-1.7 and reads as free to go first; its third box is *"Behavior
entries feed WO-4.2's behavior rule and the count matches"*, so it cannot close before WO-4.2, whose
own sixth box says *"The behavior rule is inert until WO-4.4 exists"* — the two are deliberately cut
to land in that order and the table follows it. And WO-4.3 and WO-4.5 each carry a box requiring
**two consecutive runs on real data**, which is a fortnight of term and not a fortnight of calendar.
They are rowed to be *built* before the term and to *close* after it, which is the only shape that
fits; a table that rowed them by their build date alone would have promised two ticks in August that
no amount of work could earn.

**The capacity assumption changed twice while this was being written and the table uses the current
one.** § Ship 2's preamble says *"from ~Aug 24 the owner is teaching"*; WO-2.50 moved that to Aug 28
on 2026-08-18 and WO-2.52 moved it to **Sep 2** on 2026-08-19. So the setup fortnight is longer than
Ship 2's front-loading argument assumed, and Phase 4's three data-independent work orders fit inside
it at full capacity. **That preamble sentence is now stale and is left alone on purpose** — it is an
argument about how Ship 2's table was built, which is history, and rewriting the premise under a
table already built to it would make the table unreadable. The live date is here and in WO-2.52.

**WO-G3's dependency line is fixed in the same sitting**, because a running order whose gate enforces
nothing is half a table. It reads `Phase 4` — prose, not a token — so `depsOf()` finds nothing and
`wo-gate.mjs WO-G3` reports **`PASS`** today, with five work orders unwritten. That is precisely the
failure WO-G2's line had until 2026-08-09 (`Phase 3, WO-2.5 … WO-2.7`, where "Phase 3" was invisible
and the ellipsis was read as two tokens), and it gets the same repair: the five IDs written out.

**§ Correction — 2026-08-19, the same day, one commit later.** *The owner asked whether WO-8.4 really
made sense now. It did not, and the check that settles it was in the tree the whole time.*
**WO-G2's fifth box was already closed in substance.**
[WO-3.9](phase-3-gradebook.md#wo-39--grades-print--csv) says in its own *Why it exists* that ordering the
printout to match the SIS entry screen *"is most of this work order's value"*; the owner answered the
order on 2026-08-12, it is recorded there so a verifier need not trust the builder's memory, and on
2026-08-13 the owner printed the sheet and confirmed it against the live SIS. **WO-8.4 reorders
nothing** — chrome, `#printHeader`, a modal gate, a presentation-mode rule. *There was no second re-key
to buy back, so the move bought nothing and cost the pre-term fortnight's* `next`.

**Two more findings, and both of them make the move worse rather than merely pointless.**
- **WO-8.4 cannot close.** One of its four surfaces is the calendar month, and
  [WO-6.3](phase-6-calendar-glance.md) has not built one — `src/calendar.js` is the event model, no DOM.
  **So it would have landed owing a line, which is the exact ground this work order refused WO-4.4 on.**
  Applying a rule to one work order and not the next one down the page is how these files rot.
- **Its urgent-looking slice was never urgent.** *"No printout contains accommodation, medical, or plan
  data"* reads like a live-term FERPA exposure and is instead closed **by construction**: the three
  print gates hide everything but their own surface with `body > * { display: none }`,
  `src/assignments.css` carries one more rule hiding the accommodation block whatever the gate says, and
  every `supports` string goes through `setSensitiveText()` so a caller cannot route one elsewhere.

*What the sitting got right is unaffected and stays: § Ship 3, WO-G3's dependency line, WO-3.18's ship
field, and* `CLAUDE.md`*'s go-live date. **None of those rested on the WO-8.4 argument** — which is the
one reason this is a correction commit and not a revert.*

**Deliverables**
- ~~WO-8.4: `**Ship** —` → `**Ship** 2`, and a row in the Ship 2 table ahead of WO-3.18 and WO-G2.~~
  **Withdrawn the same day, § Correction above.** WO-8.4 is back at `**Ship** —`, its row is out of the
  table, and both places keep the record rather than erasing it. `**Ship** 2` stood for one commit,
  `d4eeafb`.
- A `## Ship 3 — signals` section in [`README.md`](README.md), matching § Ship 2's table shape, with
  the two Acceptance-line dependencies above stated rather than left to be rediscovered.
- WO-G3's `**Depends on**` rewritten as WO-4.1 … WO-4.5 written out, with the prose target kept.
- **WO-3.18: `**Ship** —` → `**Ship** 2`.** Found while verifying the box below. It has had a § Ship 2
  row since 2026-08-11 and WO-G2's eighth box waits on it, so the field disagreed with both the table
  carrying it and the gate testing it — **the 2026-08-09 rot surviving inside the sitting that fixed
  it.** Its `—` was never the WO-3.10 argument, which is about where a *dependency* may sit.
- The dashboard's Phase 1 row and § The files' Phase 1 row updated for this work order's existence.

**Every `**Ship** —` that remains, and why each one keeps it.** *This is the list the last Acceptance
box checks, and it is four kinds of `—` rather than one:* **not-coming** *— WO-2.7 ⏳ and WO-3.13 🚫,
which is the documented meaning of the field for both;* **process** *— this work order, as WO-1.19,
WO-1.20 and WO-1.21 all were;* **no ship exists yet** *— Phases 5, 6, 7, 8 and WO-G4, held for WO-G2's
ninth box; and* **deliberately unshipped** *— WO-2.33 alone, the owner's call below.*

**Not in scope, and each is a decision rather than an omission.**
- **WO-2.33 stays at `**Ship** —`** — the owner's call, 2026-08-19, on the argument its own header
  already makes: the overdue alert has a working visual channel on hardware, so the tone is real work
  and not urgent work, and a ship would crowd a queue with a term coming.
- **Phases 5–8 and WO-G4 stay at `**Ship** —`.** [WO-G2](gates.md#wo-g2--ship-2-gate-first-grades)'s
  ninth box owns that decision and says to take it *at* the gate, when what follows Ship 3 is no
  longer hypothetical. Naming Ship 4 now would discharge a gate box early from an August desk, which
  is the one move these trackers exist to prevent. **Nothing was discharged early in the end** — WO-8.4
  left `—` for one commit and was put back, so WO-G2 runs that box whole.
- **WO-8.1 and WO-G4 keep their prose `Depends on` lines** — *"every phase"* and *"every work order"*.
  Both report a vacuous `PASS` for the same reason WO-G3 did, and both are genuinely about everything,
  so writing out 128 tokens would rot at the next booking. **Naming them is the whole fix available
  here**: `next` can route you at either one, and neither is startable.
- **WO-3.8's owed line stays owed.** It is a Ship 2 work order — the roadmap promises *"the
  contextual prompts are Ship 2"* — whose open box points at WO-4.4, now rowed in Ship 3 for October.
  Real, and not fixable by a table: what is missing is an attendance-clause field on `supports` and an
  N on `signals`, which are WO-4.4's three decisions to shape.

**Acceptance**
- [x] **WO-8.4 stays at `**Ship** —`, and § Ship 2 records that it was rowed and unrowed rather than
      erasing it.** *(**This box read the opposite when it was first ticked** — "WO-8.4's `**Ship**`
      field reads `2`, and it has a row in § Ship 2 dated before the first real SIS re-key" — and it
      was true of the tree at `d4eeafb`. It is rewritten rather than unticked because the work it
      names was done twice, in both directions, and the second pass is the one that holds: field back
      to `—`, row 75 removed, 76 and 77 renumbered back to 75 and 76, and the withdrawn argument left
      in place under a correction heading in three files. Verified after the renumber as well as
      before it —* `grep -rn "row 7[0-9]" plans/` *still returns nothing, so no prose cites a row
      number either way.)*
- [x] `## Ship 3 — signals` exists in `README.md` and rows all five Phase 4 work orders plus WO-G3,
      in an order no Acceptance line contradicts. *(`README.md:1320`, six rows. The order is
      `WO-4.1 → WO-4.2 → WO-4.4 → WO-4.3 → WO-4.5 → WO-G3`, backticked because a bare arrow beside an
      id is a re-home marker and `--tick` held this work order open on all five of them, which is
      **not** the phase order: WO-4.4 sits behind
      WO-4.2 because its own third box reads on WO-4.2's behavior rule while WO-4.2's sixth box says
      that rule is inert until WO-4.4 exists. Both are quoted in the table's notes so the next reader
      does not have to find them twice.)*
- [x] `node tools/wo-gate.mjs WO-G3` reports five `WO-` dependencies rather than a prose clause, and
      exits non-zero while WO-4.1 is `⬜ NOT STARTED`. *(Five `depends WO-4.x ⬜ NOT STARTED <-- not
      done` lines and **exit 1**. Before the edit: one `depends (prose) Phase 4` line and **exit 0** —
      a gate reporting clear with every work order it waits on unwritten.)*
- [x] The § Dashboard Phase 1 row and the § The files Phase 1 row both account for this work order.
      *(Phase 1 row 24 / 23 done, overall **129** and 78%; § The files reads `WO-1.1 … WO-1.24`, and
      `--audit`'s own independent count of that file agrees at 24. The Phase 1 status note goes from
      "reopened four times; last on 2026-08-17" to five and 2026-08-19.)*
- [x] `node tools/wo-gate.mjs --audit` passes and `--self-check` passes. *(Both exit 0; self-check 18
      of 18 plants caught. **Both failed first**, and on this work order's own edit: the WO-3.18 note
      below had been spliced between that work order's header lines and its `**Closes roadmap**`,
      which put the field outside the header paragraph and invisible to the parser. Caught by
      `--audit`, not by reading — the rendered markdown looked correct.)*
- [x] Every work order still carrying `**Ship** —` is one this work order names above. *(21 remain;
      a scripted re-inventory against the four named categories returns **none unaccounted**. It
      returned one on the first pass — **WO-3.18**, which is how that correction was found.)*

---

## WO-1.25 — Phase 6 is cut against a model that is not there

**Ship** — · **Status** ✅ DONE — 2026-08-19 · **Size** M · **Depends on** — · **Blocks** every Phase 6
work order; WO-6.1 should not be dispatched against the current cut
**Closes roadmap** Phase 1 → *(no box. Process, not app — a phase re-cut is not a promise the roadmap
makes. Booked 2026-08-19, owner-directed, out of a read-only audit of Phase 6.)*

**Why it exists.** Phase 6 was cut before any of it was built, which is correct, and then a
read-only audit on 2026-08-19 read its four work orders against the tree they will land in. Eleven
things came back. Two of them are the kind this directory exists to catch — **a work order that
invites the one model `plans/rotating-schedule.md` refuses**, and **a work order whose acceptance
cannot be verified until the work order after it exists.** The rest are filing: a deliverable on the
wrong work order, a roadmap fragment following it there, five acceptance lines that need hardware and
carry no 👤, and a home-screen line Phase 3 owed and never wrote.

**None of this is discovered by the tooling and that is not a gap in the tooling.** `wo-gate.mjs`
reads the header block; every finding here lives in a Deliverables table or an Acceptance line.
`--audit` passed clean against Phase 6 on the day of the audit and passes clean against it now.

**The four calls the owner made, 2026-08-19, and what each one settles.**

***A review date on the glance page is a count, not a name.*** *Three lines in the phase collide on
one fact:* `students[].supports.reviewDate` *sits inside the* `supports` *block. WO-6.1 wants review
dates surfaced ahead of time; WO-6.2 puts them on the calendar; and WO-6.4's fifth box says nothing
on that page displays* `supports` *data* **in presentation mode or out of it** *— so read literally,
the one deadline a teacher is legally obliged not to miss is the one deadline the 7:40am page may not
show her, while the month grid she has to go looking for may.* **The call is the launcher reading:**
*the glance page shows* `1 review coming up` *and the name is one tap away, on the surface she
deliberately opened. It discloses strictly less than the roster dot that has shipped since WO-1.7 —
which says that student has something on file — and it is the page's own grammar, since WO-6.4 is a
launcher and not a report. The calendar keeps the name, presentation-gated, because it is already a
surface a teacher opened on purpose.*

***Both authoring surfaces stay, and the rules move underneath them.*** *WO-6.1 authors all eight
kinds;* `src/days-off.js` *already authors two of them. Two doors to one field is not the WO-1.13
defect — the SIS importer and the roster editor have written the same student fields since WO-1.23,
under merge rules written down in* `docs/data-model.md`*.* **Two writers is.** *And today every rule
protecting* `doc.events` *lives in* `createFromForm()` *in* `src/days-off.js` *— a screen module: the
date must parse, an end date may not precede its start, a* `dropped` *event naming no class is
refused, and a range covering recorded meetings routes through* `openConfirm()` *rather than
committing.* `src/calendar.js` *enforces none of it —* `newEvent()` *will build a class-less*
`dropped` *and* `addEvent()` *will store it.* **So the second door inherits nothing unless the rules
move down into the model first**, *which is the WO-2.25 move: one mechanism lifted three times is one
mistake living in three places.*

***WO-6.2 keeps its cut and owes its boxes forward.*** *Three of its four Acceptance lines name a
calendar that WO-6.3 builds —* `src/calendar.js` *is the event model with no DOM in it, which WO-8.4's
own correction note establishes independently. The edge cannot be a* `Depends on`*: WO-6.3 already
depends on WO-6.2 and the pair would be a cycle the gate would call satisfied. It is what* `**Owes**`
*is for.* **A merge into WO-6.3 was the alternative and was not taken** *— it would move the
denominator, the § The files row and the phase count to fix a filing problem.*

***The ungraded count goes back to Phase 3, in Ship 2, next.*** *The standing obligation reads: the
home screen accretes, every phase adds its line rather than deferring it to Phase 6.* `src/home.js`
*appends* `.class-card-signals` *empty and names its owner in the file —* `WO-3.x — ungraded work` *—
and the string* `home screen` *appears in no Phase 3 work order. Phase 3 is 23 of 24 with only the
OAuth paperwork open, so it will close with the slot unfilled and WO-6.4 carrying the debt without a
marker.* **The owner's call is that it is worth real value before Ship 2 and it is buildable today:**
*WO-3.4 and WO-1.10 are both* `✅ DONE`*.* **Ship 2 was the right table for it and the concern raised
against that did not survive checking** *— WO-G2's* `Depends on` *is a curated explicit list, not
every row in the ship, and* [WO-3.25](phase-3-gradebook.md#wo-325--a-score-cell-takes-any-string-number-can-read-not-any-number-a-teacher-can-mean)
*is already a Phase 3 work order sitting in that table without gating the gate.*

**Deliverables**

*In [`phase-6-calendar-glance.md`](phase-6-calendar-glance.md) —*
- **WO-6.2 gets a `**Traps**` block against the schedule model**, naming
  [`../rotating-schedule.md`](../rotating-schedule.md) by path the way WO-2.3 does, plus an
  Acceptance line: a future weekday shows no per-class meeting state at all, and nothing in the phase
  stores or derives which classes are expected to meet. **This is the highest-value line in the work
  order.** `stateOf()` has four answers and only three are facts about the class — `NOT_TAKEN` is the
  did-I-forget state, safe on a home screen asking about today and a wall of amber on a month grid
  asking about twenty weekdays across five classes. The way to silence that wall is to know which
  classes were meant to meet, which is the cycle model that decision record designed and removed in
  one day. WO-2.50 is the precedent for the other fix: a quiet `off-term` modifier, not a schedule.
- **WO-6.2 gets `**Owes** WO-6.3`**, and its first, third and fourth Acceptance lines stay `- [ ]`
  with a bare `→ WO-6.3` marker and a quotation of the box carrying each. Only the second — that
  `events[]` holds no derived entry — can close on WO-6.2's own evidence.
- **Review dates move from WO-6.1 to WO-6.2**: the deliverable, the Acceptance line, and the
  `**Closes roadmap**` fragment with them. A `reviewDate` is derived and is not an `events[]` entry;
  it is a row in WO-6.2's own derived table and in `docs/data-model.md` § Events. Keep WO-6.1's
  stronger wording — no plan type visible, gone entirely in presentation mode — and delete WO-6.2's
  weaker restatement of it.
- **WO-6.4's fifth box is reworded to name what is actually forbidden** — plan type, accommodation
  detail, medical text, behavior-plan text — rather than `supports` data, and gains the
  count-not-name rule above. The current wording is mechanically checkable and the new one is not,
  which is the cost of the call; naming the four fields is what keeps it testable.
- **WO-6.3 gets the print surface it owes WO-8.4**: register the calendar's gate under its own
  `<body>` attribute through `registerPrintGate()`, with an `isOnScreen` predicate in the
  `src/detail.js` shape since the calendar is a view inside `<main>` rather than a dialog, and with
  the print **control** named differently from the gate — `src/print-gate.js`'s invariant, bought by
  the owner's own stuck-attribute bug. One acceptance line: no printout of a calendar month emits a
  review date or any other `supports` value, whatever presentation mode says. Without it a `Ctrl+P`
  on the calendar prints the ordinary page with the review chip on it, and WO-8.4 cannot backstop a
  surface that ships before it.
- **WO-6.1 gains the validation lift** — the four rules in `createFromForm()` move into
  `src/calendar.js` before a second authoring surface exists — and a line saying both surfaces stay.
- **WO-6.1 names the two fields it needs and cannot have**: the grades-due lead time, and whatever
  identifies a materialized series. Neither is in the eight-field record `newEvent()` writes out on
  purpose. A `seriesId` stores no rule and so does not touch the materialize decision; matching on
  title and kind is the alternative and it deletes the second *Faculty meeting* the teacher typed by
  hand. The lead time is a teacher's setting and belongs in the document, per § Signal thresholds'
  reasoning, not under `planbook_`. **The `docs/data-model.md` amendment is a deliverable of WO-6.1
  rather than a side effect of it** — WO-1.7's verifier failed once on a schema edit landing inside
  the commit whose acceptance line graded against it.
- **WO-6.1 says where a grades-due event warns.** If the surface is WO-6.4's *Deadlines closing in*,
  the box is re-homed with `**Owes**`; if it is a banner of its own, that is a deliverable.
- **👤 on the five Acceptance lines that need the device or the owner**: WO-6.3's iPad legibility line
  and its new coarse-pointer line; WO-6.4's *under a second on an iPad* and its *praise not buried*;
  and the review-chip presentation-mode line wherever it lands, on the WO-2.3 precedent that a
  palette read across a room is not a judgement a headless Chrome makes however green it measures.
  WO-6.2's *after using the calendar heavily* is restated as a deterministic script instead.
  Unmarked, `--tick` closes every one of them on a green harness.
- **WO-6.3 gets a 👤 line for the 44px floor.** The standing obligation is a coarse-pointer minimum
  for every new control; a month cell holding four chips at that floor is a month needing two
  screens, and `src/home.css` already makes the cell-the-target call for `.class-card-state`. The
  line does not decide the departure — it puts it under a thumb before WO-6.3 commits, the way the
  score cell's input type went before WO-3.5.
- **WO-6.1 gets a note that most of its first deliverable is built.** WO-2.3 shipped the eight-field
  record, `endDate` on every event, ranges as one entry, the empty-`classIds` rule, and the stable
  two-event overlap answer; `docs/data-model.md` already names all eight kinds. What is left is six
  rows in the `KINDS` table, the authoring surface, a writer for `studentId`, the two fields above
  and the recurrence. Unsaid, its `M` reads as eight fields of new model.
- **WO-6.4 says whether the glance page is `#homeView` or a sixth view.** WO-1.10 says the home
  screen becomes it; `src/views.js` reserves one line for Phase 6 and calls it the calendar. The
  answer decides whether `DEFAULT_VIEW` and `REMEMBERED_AS` are in scope or `VIEWS` and `SCREENS`
  are.

*Outside it —*
- **WO-3.26 booked** in [`phase-3-gradebook.md`](phase-3-gradebook.md): the ungraded count in
  `.class-card-signals`, `**Ship** 2`, and **it closes no roadmap box** — ROADMAP § Phase 3 is 10 of
  10 and every box is claimed, so it takes WO-3.18's form, with no quotation marks anywhere on the
  line. A row in § Ship 2 ahead of WO-3.18 and WO-G2. WO-6.4 gains it as a real `Depends on` in place
  of a silent assumption.
- **WO-1.7's `**Out of scope**` line re-aimed** from WO-6.1 to wherever the review-date deliverable
  lands.
- **§ The files rows and § Dashboard rows** updated for both new work orders. **The README dashboard
  is only rewritten by `--tick`** — `recomputeDashboard()` is called from nowhere else — and
  `--audit` checks ROADMAP's dashboard rather than this one, so a stale row here is caught by
  nothing. Hand it to what the tool would compute and re-run both checks.

**Acceptance**
- [x] `node tools/wo-gate.mjs --audit` passes, and `--self-check` passes.
- [x] Every `**Closes roadmap**` fragment in Phase 6 still matches exactly one box, with the IEP/504
      fragment now under the work order that renders it and gone from WO-6.1.
- [x] `node tools/wo-gate.mjs WO-6.2` reports `**Owes** WO-6.3`, and `--audit` resolves all three
      pointers onto boxes still `[ ]` under WO-6.3.
- [x] No work order in Phase 6 requires knowing which classes are scheduled to meet on a date, and
      WO-6.2 says so in a `**Traps**` block naming `plans/rotating-schedule.md`.
- [x] Five Acceptance lines in Phase 6 carry 👤, and no line naming an iPad, a thumb, or a projected
      screen is without one.
- [x] WO-6.3 names a `<body>` print attribute that is not also a click hook, and no Phase 6 surface
      can print a `supports` value.
- [x] WO-3.26 exists at `**Ship** 2`, closes no roadmap box, and has a § Ship 2 row ahead of WO-3.18.
- [x] `node tools/wo-gate.mjs WO-6.4` reports WO-3.26 among its dependencies.
- [x] The § Dashboard and § The files rows account for WO-1.25 and WO-3.26, and the dashboard's
      numbers match what `recomputeDashboard()` would write.

**Not in scope, and each is a decision rather than an omission.**
- **No Phase 6 code.** This work order edits `plans/` and nothing else. WO-6.1 is the first build and
  it should be dispatched against the re-cut rather than alongside it.
- **The `docs/data-model.md` amendment is named here and written by WO-6.1**, where its acceptance
  can grade against it — not here, where nothing would.
- **The design drawings are not promoted.** `design/mockups/calendar.html` and `glance.html` landed
  on 2026-08-19 in `fa723a9` and carry nine open questions of their own. Several of this work order's
  findings are corroborated there and two — the 44px chips and the review-date collision — were found
  independently by both. **A drawing is not a work order**; the questions it raises are answered in
  the phase file or they are not answered.
