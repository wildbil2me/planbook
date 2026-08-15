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

**Out of scope** — surfacing at point of use (WO-3.8), calendar surfacing of `reviewDate` (WO-6.1).

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

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** nothing
**Closes roadmap** Phase 1 → *(no box. Operational, not code — this work order is a cutover the owner
performs, booked because the alternative is remembering it. Booked 2026-08-12 out of the Ship 1
rehearsal's unclosed note.)*

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
- **A fresh year for the term**, made the working year, with rosters entered fresh rather than carried
  across.
- **The rehearsal data kept, in a year whose label cannot be mistaken for the term.** Labels are
  strictly `YYYY-YYYY` (`src/store.js:176`) so it cannot be called "TEST"; `gates.md` suggests
  **2030-2031**, which is unmistakable in the year picker.
- **The iPad restored from the laptop** so it holds the test year, in the one direction the rule
  allows.
- **A backup of the term year taken and stored off the device** before the first class.
- **The date written into this work order and into `CHANGELOG.md`'s open note**, which is what closes
  the rehearsal's loose end rather than leaving it recorded forever.

**Out of scope** — deleting the rehearsal data, which is the evidence behind the attendance-arithmetic
tick and must survive; any code change, which is WO-1.15's half; the week-one re-check of the
arithmetic against a live roster, which is `gates.md`'s and cannot happen until a real class exists.

**Acceptance**
- [ ] 👤 The year the term is taught in contains no meeting the owner did not record — checked in the
      app, not assumed from the act.
- [ ] 👤 The rehearsal data is still openable, in a year whose label cannot be read as the term.
- [ ] 👤 The iPad shows the test year and the laptop shows the term year, each confirmed on the device
      itself.
- [ ] 👤 A backup of the term year exists off-device, taken **before** the first class.
- [ ] The date is recorded here and the `CHANGELOG.md` note is closed.

**Traps** — **Do not carry the rehearsal's attendance across "to have some history".** That is the
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

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** —
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
- [ ] The comment at `tools/verify-shell.mjs:1860` matches the number of `check()` calls in its
      section, counted rather than assumed.
- [ ] `verify-shell.mjs` still runs green at its then-current total, and `tools/README.md`'s recorded
      call-site count still matches — a comment fix must not touch either, and if it does, something
      other than a comment was changed.
- [ ] The sweep question above is answered in writing, in the work order or in `tools/README.md`.

**Traps** — **Do not "fix" the count by deleting a check.** **Do not renumber neighbouring section
headers to match a scheme** — the other headers are not known to be wrong, and a sweep that changes
twenty comments to fix one buries the fix in the diff that is supposed to show it.

---

## WO-1.19 — the phase-branch convention is dead and still written down

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** —
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
- [ ] `CLAUDE.md` and `plans/work-orders/README.md` say the same thing about branching, and it is
      the thing that is actually happening.
- [ ] Neither file contains a note admitting a gap between the branching rule and the practice.
- [ ] If **(a)**: all three `phase/*` branches are at `main`, and the next work order after this one
      demonstrably landed on a phase branch — this is the line that decides whether (a) was real.
- [ ] If **(b)**: the three branches are gone locally, and the decision names what is lost — the
      per-phase history view — and why that is acceptable.
- [ ] 👤 The owner has said which option, on the record. This is a preference about how the owner's
      own repository is worked and cannot be inferred from the code.

**Traps** — **Do not "catch the branches up" as a tidy-up without making the choice.** Three
fast-forwarded branches that then sit unused for another sprint is this work order's own defect,
re-created with fresher timestamps. **Do not delete anything on `origin` in the same pass as the
local decision** — the remote branches are the only copy if the call is later reversed, and nothing
here is urgent enough to need both halves at once. **Do not read "zero unique commits" as permanent**;
re-measure before acting, because a dispatch working a phase branch between the booking and the doing
would make it false.
