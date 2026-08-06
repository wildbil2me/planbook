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

**Ship** 1 · **Status** ⬜ NOT STARTED · **Size** M · 🚩 · **Depends on** WO-1.10
**Closes roadmap** Phase 1 → *(no roadmap line; this closes a gap the roadmap assumed closed —
see "Why it exists")*

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
- **Modals keep what they are good at**: the class manager, the term editor, the roster paste box,
  the student editor, the delete confirms. A modal is right for a task you finish and dismiss and
  wrong for the surface a teacher works in all period. Do not convert them.
- **`tools/verify-shell.mjs` follows.** `attendanceModal` appears in it 10 times; the harness drives
  the screen by opening the dialog. Those checks must drive the view instead, and the count must not
  drop — a check deleted because its selector moved is a check that stopped being run.

**Out of scope** — any change to what the attendance grid *shows* or *stores* (that is WO-2.1, and
it is settled). Deep-linking or URL routing. A back-button history stack. Phase 6's calendar view.

**Acceptance**
- [ ] Selecting a class from the header changes what is in `<main>`, without opening a dialog.
- [ ] Attendance is marked in the main area, with no overlay above the class cards.
- [ ] There is exactly one control in the app that means "work on this class now", and a second
      control that means something different can be told apart from it in words.
- [ ] Returning to the class grid is one tap from any view, and the tap is findable without being
      told where it is. 👤
- [ ] `verify-shell.mjs` runs green with **no fewer checks than before**, and every check that used
      to open `attendanceModal` now drives the view. Verify the count, don't assume it.
- [ ] The class manager, term editor, roster paste, and student editor still open as modals and
      still work.
- [ ] Reloading with a class selected returns to that class's view, not to a blank main area —
      `openClassId` already persists and must keep meaning something.
- [ ] Presentation mode still suppresses every support field on every view, including the new ones.

**Traps** — The tempting shortcut is to leave `attendanceModal` in place and hide its chrome, which
produces a dialog pretending to be a page: focus trapping, an Escape key that navigates, and a
screen reader announcing a dialog that never closes. Move it or leave it, but do not disguise it.
And **do not build a router.** Roll Call! switches views with `.hidden` and a class name; the suite
rule is no dependencies, no framework, and a hand-rolled URL router is a framework with one user.
