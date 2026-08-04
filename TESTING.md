# Planbook — manual test checklist

Run this before merging any phase branch. It is the regression gate.

**There is no automated test suite, and that is a decision rather than an omission.** The suite
carries no dependencies, no linter, and no test framework; `plans/ROADMAP.md` names an automated
suite as explicitly not required for 1.0, and names this checklist plus a headless demo pass as
the gate instead. The cost of that decision is real and lands here: if a check isn't written
down, it doesn't get run.

**First pass run 2026-08-04**, covering WO-1.1 and WO-1.2, desktop and iPad. Per the maintenance
protocol in `plans/ROADMAP.md`, written-but-unverified stays `- [ ]` — so an unticked box below
means not yet run, or nothing built yet for it to run against.

---

## How to use it

1. When a work order lands, copy its **Acceptance** lines into that phase's section below. They
   are written as checklist items already — copy them rather than paraphrasing, so what was
   promised and what was tested are the same sentence.
2. Run each item in **both** contexts in the Environment table unless the item says otherwise.
3. Tick only what you actually ran. Add a dated *(italic paren note)* whenever the result
   differed from what the check predicted — the note is the part that earns its keep later.
4. Then finish the maintenance protocol in `plans/ROADMAP.md`: tick the roadmap box, update the
   dashboard, add the `CHANGELOG.md` entry.

**Legend** — 👤 marks a check that needs a human on real hardware: an iPad in your hands, a
printer, a screen reader, ears. No headless run and no desktop device emulator closes one of
these, and marking one passed from a desktop is how a claim becomes a lie.

## Before running the desktop half, run the script

```
node tools/verify-shell.mjs
```

It drives the real page in headless Edge or Chrome and **measures** things this checklist can
only assert — rendered geometry, resolved styles, real focus movement, runtime storage state. It
is the executable version of several standing checks below; when one of them changes, change it
in both places or delete one. It exits non-zero on failure.

Three things it does not do, and this file is where that matters:

- **It closes no boxes.** Not one. It produces evidence; you tick. A green run in particular
  closes **no 👤 item ever** — no emulator has a thumb or a safe-area inset.
- **A `SKIP` is not a pass.** When a fixture stops existing the check announces itself and is
  counted separately. Read the skip list as carefully as the failure list; a run that is mostly
  skips proves nothing.
- **It cannot see the service worker or the install path.** It drives a page, not an installed
  app; nothing it does closes a WO-1.3 line. *(As of WO-1.6 the run is 130 of 130. It was 28 of 28
  at WO-1.3, when the `viewport-fit=cover` precondition that used to fail by design started
  passing, 54 at WO-1.4, and 82 at WO-1.5 — a number this line and the phase file both recorded as
  79 until WO-1.6 re-ran `HEAD` in a scratch tree and counted. A remembered count is not a count.)*

Why it exists and the rules that keep it a script rather than a test framework:
[`plans/verification-tooling.md`](plans/verification-tooling.md).

---

## Environment

Two run contexts. Everything ships to both, and the second is the one that decides go-live.

| Context | What | Notes |
|---|---|---|
| **Desktop** | Chrome or Edge on Windows, served from any local static server | A service worker will not register from `file://`, so even a local pass needs a server. This is the context for logic, keyboard paths, and grade math. |
| **iPad Safari** 👤 | **iPad Safari**, installed to the home screen via Share → Add to Home Screen | The install target that matters. Run here for anything touching layout, touch targets, offline behavior, storage persistence, or install. |

**Why iPad Safari is named explicitly and not "a tablet."** iOS Safari evicts IndexedDB after
about 7 days of non-use on sites that are *not* installed to the home screen; installed PWAs are
exempt. A teacher who bookmarks Planbook instead of installing it can lose a term of grades over
a school holiday. That hazard is specific to this browser, it is data loss rather than
inconvenience, and no emulator reproduces it — which is why the install path is a go-live blocker
and why every storage check below carries a 👤 iPad half.

Record the hardware for each pass. WO-1.3's acceptance requires the iPadOS version written down
here, so the slot exists before the work does.

| Field | Value |
|---|---|
| Desktop browser + version | Chrome 150.0.7871.187. *The desk-side headless pass on WO-1.2 ran Edge 151.0.4129.59 over CDP.* |
| Local server used | `python -m http.server 8000 --bind 127.0.0.1` (Python 3.14) for desktop, at `http://localhost:8000`. **From WO-1.3 on, the iPad half needs `node tools/serve-https.mjs` instead** — see below. |
| iPad model | iPad (A16) |
| **iPadOS version** | **26.5.2** |
| Installed to home screen? | Yes — Share → Add to Home Screen, launched standalone with no browser chrome |
| Served from (URL) | iPad: `https://192.168.50.142:8443` over the LAN, from `node tools/serve-https.mjs`. WO-1.2's pass used `http://192.168.50.142:8000`, which cannot register a service worker. |
| Date of pass · who ran it | 2026-08-04 · Bill Toomey |

**The iPad half must be served over HTTPS, and this is not a preference.** A service worker
requires a secure context. `localhost` is specifically exempted from that rule; a LAN address is
not. So the URL WO-1.2 used registers nothing — and says nothing, because **Safari's own HTTP
cache re-serves the pages after the Wi-Fi goes off.** The offline check passes, the box gets
ticked, and what was proven is that Safari has a cache. `tools/make-cert.mjs` mints a root the
iPad can trust and `tools/serve-https.mjs` serves under it with `no-store` on everything, so the
service worker is the only thing left that can answer. Setup and the four ways it fails silently
are in [`tools/README.md`](tools/README.md).

---

## Standing checks — every pass, against whatever exists at the time

These are the standing obligations from `plans/work-orders/README.md`, restated as checks
because an obligation that isn't on a checklist is a hope. They never finish, so they are not
tied to a phase; run them over the screens that exist when you run the pass.

- [x] No `package.json`, `package-lock.json`, or `node_modules/` anywhere. Anything scripted is
      `tools/*.mjs` under bare Node.
- [x] No dark-mode rules: no `prefers-color-scheme`, no `[data-theme]`. Colors are inline, not
      CSS variables.
- [x] Every control reachable on the iPad is at least 44px, and every new control from this
      phase appears in the `@media (pointer: coarse)` block. 👤
- [x] Every `planbook_` key holds a UI preference and nothing else. No student data in
      `localStorage`. *(WO-1.2 declares no keys at all; `src/prefs.js` refuses undeclared ones.)*
- [ ] No merge field, log line, print surface, or export emits accommodation, medical, or plan
      data. The JSON backup is the only exception, and its own UI says so.
- [ ] Presentation mode, once it exists, suppresses every `supports` field on every screen built
      since the last pass — including any screen added by this phase.
- [ ] `late` and `missing` are teacher-marked, never inferred from a date. Blank is ungraded and
      changes no grade.
- [ ] Roll Call! is still deployed and still working. It is the fallback until Planbook has
      survived a full term.

*2026-08-04: the first four ran green against WO-1.1 + WO-1.2. The next three have no surface yet —
no merge fields, no presentation mode, no grades exist — so they are left unticked rather than
ticked vacuously; a tick should mean something was exercised. The Roll Call! line is the owner's to
confirm.*

*2026-08-04, re-run for WO-1.4: the touch-target line carries a 👤 and is re-run per phase because
it is the check WO-1.2 passed while shipping `.search-box { min-height: 44px }` around a 19px
input. WO-1.4's new controls are the year picker's — the year rows, the year input, the Create
button, and the modal close — and all four were thumbed on the iPad, including deliberately tapping
above the input's text, which is where the WO-1.2 defect hid. `verify-shell.mjs` measures the same
targets headlessly and is 54/54, but a headless run has no thumb and closes no 👤 line.*

---

## Phase 1 — Shell, store, roster

*Phase goal: the app installs, holds data, survives everything, and can hand that data back.*

**Ordering rule for this phase:** WO-1.5 (backup & restore) is verified before WO-1.6 and
everything after it. No feature that writes student data ships before the path that gets it back
out — so if WO-1.6's checks are green and WO-1.5's are not, the phase is not green.

### WO-1.1 — Repo skeleton & docs spine

- [x] `git log` shows a first commit on `main` and a phase branch cut from it.
      (`git log --oneline --all`, `git branch -a`.)
- [x] `TESTING.md` exists with an environment section naming iPad Safari explicitly.
- [x] `CHANGELOG.md` exists with `## [Unreleased]` and one real entry.
- [x] No dependency manifest of any kind exists in the repo. (`git ls-files` lists no
      `package.json`, no `package-lock.json`, no `node_modules/`.)

*Ticked 2026-08-04 against commit `0a77f38`. No 👤 items — every line here is a command, and all
four were run twice: once by `work-order-verifier`, once again by hand.*

### WO-1.2 — App shell & design frame

- [x] Colors match `design/style-guide.md` literally, declared inline — no CSS variables.
- [x] No dark-mode rules exist anywhere: no `prefers-color-scheme`, no `[data-theme]`.
- [x] A modal opens, traps focus, closes on Escape and on backdrop click, and returns focus to
      the element that opened it.
- [x] `:focus-visible { outline: 2px solid #5b6fcc; outline-offset: 2px; }` is global and no rule
      removes an outline anywhere.
- [x] On an iPad, no control is under 44px and nothing sits under the safe-area inset. 👤
- [x] No `planbook_` key holds anything but a UI preference.

*Ticked 2026-08-04, iPadOS 26.5.2. Lines 1, 2, 4 and 6 were verified by grep plus a headless
Chromium run and are cheap to re-run. Line 3 was verified headless, then confirmed on the iPad —
which is the pass that mattered, because `src/modal.js` takes its opener explicitly to work around
Safari not focusing a `<button>` on tap, and Chromium cannot reproduce the behavior the fix exists
for.*

*Line 5 passed on real hardware — nothing clipped, no control small under a thumb — but **the
safe-area half passed for a reason that isn't the CSS.** [`index.html`](index.html) has no
`viewport-fit=cover`, so on iOS every `env(safe-area-inset-*)` resolves to `0` regardless of what
`src/shell.css` declares, and `apple-mobile-web-app-status-bar-style` is `default`, which insets the
web view below the status bar rather than under it. Nothing sat under an inset because there were no
insets. The five `env()` declarations remain unexercised. WO-1.3 owns both settings and will make
this check live for the first time — re-run it there.*

### WO-1.3 — PWA install path & eviction warning

- [x] Installs to the iPad home screen from Safari and launches without browser chrome. 👤
- [x] With the network disabled, the installed app opens and every built screen works. 👤
- [x] Run uninstalled in Safari: the warning appears, names the risk in plain language, and
      gives the install steps. 👤
- [x] Run installed: the warning does not appear. 👤
- [x] Deploying a new version updates the service worker and clears the previous cache.
      *(Desktop is enough: bump `CACHE` in `sw.js`, reload twice, and confirm in DevTools →
      Application that Cache Storage holds the new name and only the new name.)*
- [x] Verified on a real iPad, not a desktop emulator — iPadOS version recorded in the
      Environment table above. 👤

Two more that belong to this work order rather than to the acceptance list, because both are
silent when they fail:

- [x] **Carried over from WO-1.2, and live for the first time here.** On an iPad, nothing sits
      under the safe-area inset: with `viewport-fit=cover` and `black-translucent` both set,
      the ten `env(safe-area-inset-*)` declarations in `src/shell.css` finally resolve
      non-zero, the navy header runs to the top edge under the status bar, and the status-bar
      text is legible over it. WO-1.2 ticked this line against insets that were all 0. 👤
- [x] The banner returns after a dismissal. Tap **Not now**; it goes. Then set
      `localStorage.planbook_installBannerDismissedAt` to four days ago in the console and
      reload — it is back. A dismissal that never returns is the failure mode this design
      exists to avoid, and nothing on screen would show it.

*Ticked 2026-08-04, iPadOS 26.5.2 on an iPad (A16), installed to the home screen and served over
HTTPS. The four 👤 acceptance lines plus the iPad line were run by hand in one sitting. Line 5 was
verified headless, which the line itself permits.*

*The banner-return line was driven headlessly over CDP rather than by hand — it carries no 👤,
because it is a `localStorage` clock rather than anything a thumb decides. Six assertions, all
green: the banner shows undismissed; a real click on **Not now** (through the delegated handler,
not a direct call to `dismissInstallBanner`) hides it and writes the timestamp; it stays hidden on
reload and at two days; and it is back at four days and at seven. **The two-day case is the one
that earns its keep** — without it the check passes just as well on a banner that returns
immediately, which is the opposite defect and equally invisible.*

*The safe-area carry-over closed on a second look, portrait and landscape: the navy header runs
to the top edge with no pale band above it, the status-bar text is legible both at rest and
scrolled — the scrolled case being the one that can fail, since `.header` is not sticky and white
text can land over the `#f0f2f5` page background — and nothing is clipped at the bottom by the
home indicator. This is the first pass where the check was live at all; WO-1.2 ticked the same
line against insets that were uniformly `0`.*

*One caveat on what that tick covers, so the next reader doesn't over-read it: it was confirmed
visually, not measured. The four `env()` values were never read back as numbers. **On a bezelled
iPad the left and right insets are `0` anyway** — no notch, no intruding corner — so top and
bottom are the whole of this check on this hardware, and both were looked at directly. A device
with side insets would need this run again rather than inherited.*

### WO-1.4 — Year document store

- [x] A change persists across a full reload, and across an app relaunch on iPad. 👤
- [x] `rev` increases by exactly one per save; two rapid edits inside the debounce window are one
      save and one `rev`.
- [x] A save failure surfaces the error state on the indicator and does not silently swallow.
- [x] Two year documents coexist; switching between them shows the right data.
- [x] A document written before a schema bump loads through the migration hook without loss.

*Ticked 2026-08-04, iPadOS 26.5.2 on an iPad (A16), installed to the home screen and served over
HTTPS from `tools/serve-https.mjs`. The iPad half was one sitting: installed fresh after deleting
the WO-1.3 build and clearing website data for the host — otherwise the run measures the old
service worker — then a year created through the picker, the app force-quit from the app switcher,
and relaunched with the year still named in the header. Then Wi-Fi fully off, force-quit, relaunch:
the app booted, the loading screen came down, and a **new year could still be created** with no
network at all. That last part is past what the line asks for; it is recorded because it separates
"the shell was cached" from "the store is genuinely independent of the network."*

*The console lines were run at the desk against `window.planbook.store`, which is the only way to
reach `store.update()` until WO-1.6 and WO-1.7 put a class and a roster on screen. `rev` behaviour
was watched directly: `+1` on a forced flush, and `delta: 1` for two edits inside the 800 ms
debounce with the later value winning. The failure line was forced with a real `DataCloneError` —
a function assigned into the document, which IndexedDB refuses to clone — and the error surfaced
with a message written for a teacher: it names the year, says the last change is only in memory,
and offers storage-full and private-browsing as causes. **`rev` was confirmed put back** after the
failed write, which is the half that matters to WO-1.5 and to sync: a `rev` that advanced on a
save storage never saw would be compared against a version existing nowhere.*

*The offline half was also run at the desk with the server process stopped outright rather than
with a DevTools toggle, so nothing but the service worker could answer.*

*One thing this sitting did **not** cover: the laptop reached the app over `https://localhost:8443`
after the local CA was trusted in `Cert:\CurrentUser\Root`. A machine without that root cannot
register a service worker at the LAN address at all — Chromium refuses behind a certificate error
and there is no click-through, exactly as `tools/README.md` records for Safari. Worth knowing
before the next device sitting: the CA in `certs/` is regenerated by `make-cert.mjs`, and a tablet
trusting an older root fails identically to one trusting none.*

### WO-1.5 — Backup & restore

- [x] Download → wipe browser storage → restore: the document is byte-identical in content. 👤
- [x] The restore confirm names the outgoing document and the incoming one, with counts, before
      anything is replaced.
- [x] Cancelling the confirm leaves the existing document untouched.
- [x] A malformed or non-Planbook JSON file is refused with a message saying what was wrong, and
      does not partially apply.
- [x] A backup from a different `schemaVersion` either migrates or refuses — never half-loads.
- [x] The nag appears when the last backup is >7 days old and clears on a successful download.
- [x] The backup UI says what sensitive data the file contains.
- [x] A document `boot()` refuses leaves a reachable way to restore, not a loading screen with no
      exit. 👤

*Ticked 2026-08-04, iPadOS 26.5.2 on an iPad (A16), installed to the home screen and served over
HTTPS from `tools/serve-https.mjs` — same hardware and same day as the WO-1.4 pass, so the
Environment table above stands unchanged.*

*The desk half is `verify-shell.mjs`, **79 of 79**, run three times with no intermittency (54 before
this work order). It drives both real entry points — a `DragEvent` carrying an actual `File`, and
`input.files` plus a `change` event — and asserts that a file dropped **anywhere else on the page**
does nothing and has its default prevented. That last one is not pedantry: a browser handed a file
it wasn't offered navigates to it, which replaces the running app with a page of JSON and takes the
in-memory year document with it.*

*The iPad half was one sitting, in order, and all of it passed: the download landed in Files → On My
iPad under a filename carrying the year and the date and opened readable in a text editor with the
roster in it; the "what is in this file" paragraph was read on the tablet rather than at the desk,
which is the only way to judge whether it says enough before someone emails that file to themselves;
the backup JSON was selectable in the picker rather than greyed out; the confirm named both sides
with recognisable counts; a cancel left the year alone and a second run restored it; the drag came
out of Files in Split View; and the boot-failure screen's **Restore from a backup file** button was
staged, seen, and tapped on a real screen.*

*Why the two 👤 marks are on the lines they're on. Everything from the drag event inward is the
production path, but Safari's own drag session is not something the harness can start, and the
download runs in headless Chromium against a throwaway profile — so "the file lands where a teacher
can find it again" and "an installed PWA can download at all" were open questions until the tablet
answered them. The boot-failure button is the one control the harness structurally cannot measure:
it only exists while boot has failed, and every measurement pass needs an app that booted. Its 44px
was asserted from its computed rule and labelled as a rule; the thumb closed it.*

*The touch-target standing check above was re-run for this phase, as it is every phase. WO-1.5's new
controls are the header ⤓, **Back up now**, **Download backup**, the file button, **Replace**,
**Cancel**, and the modal ✕ — all thumbed. The file button gets its own headless check on
`::file-selector-button`'s `min-height`, because a 44px `<input type=file>` wrapped around a 20px
native button is exactly the WO-1.2 `.search-box` defect wearing a different control. Safari renders
that pseudo-element differently and it is verified computed in Chromium only.*

*Three limits of the harness worth carrying forward, none of which failed anything here. The
stray-drop check asserts an **absence** after a fixed 250 ms sleep — a shape whose failure mode is a
false pass (`tools/README.md` trap 5), and the only new check of that kind. The downloaded bytes are
checked as they are produced, never read back off disk. And `planbook_lastBackupAt` is one key per
browser rather than one per year, so downloading year A clears the nag for year B — worth knowing
before a teacher runs two live years.*

*2026-08-04, follow-up: the third limit above turned out to be a defect rather than a limit, and is
fixed. `lastBackupAt` is per-year now, the nag asks about the open year and names it, and the panel
names any year that has never been downloaded. The harness runs the case at the desk — two years,
one downloaded, the other's nag still up — and is 82 of 82. **One 👤 line was owed and is not
closed by that run:*** *on an installed iPad, with two years on the device, confirm the panel's
amber line is legible and says something a teacher would act on, and that the nag names the year
after a switch. Everything else about this fix is desk-measurable; that sentence is not.*

- [x] The backup panel's amber line is legible on an installed iPad and names the year. 👤

*Closed 2026-08-04, on the same tablet and in the same session as the WO-1.6 sitting below —
the line is there and reads correctly. That is the last 👤 item outstanding from WO-1.5.*

### WO-1.6 — Classes & terms

- [x] Six classes can be created, reordered by explicit up/down controls, and renamed. 👤
- [x] Two classes in the same document can have different term structures, and both work.
- [x] A class can be given a single year-long term.
- [x] Term dates can overlap, run backwards, or be left empty without the app breaking.
- [x] Deleting a class warns about the attendance and grade data it takes with it, and can be
      cancelled.
- [x] The class tabs, the term nav and the reorder arrows are thumbable, and the header reads
      correctly in both orientations. 👤
- [x] The iPadOS date sheet sets a term date, and a date can be cleared back to empty. 👤
- [x] The open class survives a force-quit and relaunch — visible on the bar and highlighted. 👤
- [x] Offline launch with the network off, `classes.js` served from the precache. 👤
- [x] The delete confirm and the two "Planbook does not check term dates" hints read correctly on
      the tablet. 👤

*Ticked 2026-08-04, same hardware and same day as WO-1.4 and WO-1.5 — iPadOS 26.5.2 on an iPad
(A16), installed to the home screen, served over HTTPS from `tools/serve-https.mjs`. The Environment
table above stands unchanged.*

*The desk half is `verify-shell.mjs`, **130 of 130** with zero skips, 48 checks added here. The
baseline it was added to is 82, not the 79 this file recorded — see the note above. No existing
check was loosened: `git diff --numstat tools/verify-shell.mjs` has no deletions.*

*The sitting found four defects, which is the most any pass has produced, and the two the tablet
could see were the smaller pair.*

1. ***The iPadOS date popover keeps its own selection after the field is cleared.*** *Clear a term
   date holding 9/4 and the calendar still has the 4th highlighted, so tapping it again is a no-op
   the picker never reports and the field stays empty. The workaround a teacher finds — tap the 3rd,
   then the 4th — writes a date she never wanted into the year document on the way past. A cleared
   date field is now thrown away and rebuilt, because a fresh element has no picker state. Bound to
   `change` rather than `input`: a desktop date field reads as empty while a date is part-typed, and
   rebuilding on that would replace the element under the caret.*
2. ***Class tabs were compressed below the width of their own labels***, *and the labels then laid
   out across the rounded background and over its edge. Ordinary flex items shrink; these live in a
   strip that scrolls, so they must not. Seen at 390px as an 85px label inside a 44px button.*
3. ***Nothing scrolled the open class back into view.*** *Replacing a scroller's children resets
   `scrollLeft`, and the bar is rebuilt on every change — so with six classes the teacher whose
   class was fifth got a header scrolled to the left with no tab on it looking selected. Found by a
   check written for defect 2.*
4. ***At 390px the class strip measured zero pixels wide.*** *`flex: 1` is a basis of 0, and an
   over-full flex row distributes shrinking in proportion to basis — so a strip with basis 0 beside
   a content-sized term nav shrinks by nothing and stays at nothing. Present in WO-1.6 as delivered
   and **not findable on this hardware**: an iPad in portrait is wider than the width where it
   happens. Both strips are now sized from their content with a floor under each.*

*Defects 3 and 4 are the argument for writing the check before believing the fix. Neither was
reachable from the tablet, and both came out of checks added for something else.*

*The touch-target standing check was re-run for this phase, as it is every phase. WO-1.6's new
controls are the class tabs, the term nav buttons, the up/down arrows, and every control in the
manager, the term editor and the delete confirm — 32, 22 and 3 of them measured respectively, plus
the date fields, which carry their 44px on the `<input>` itself with vertical padding zeroed rather
than on a wrapper around it. That is the WO-1.2 `.search-box` defect's lesson, and it is why the
arrows also carry `min-width` and not only `min-height`: a one-glyph button 44px tall and 30px wide
is half a touch target.*

*One limit worth carrying forward. The counted form of the delete confirm — "attendance for 46
recorded meetings, 31 assignments, 620 scores" — cannot be read on a real document yet, because
nothing writes attendance or assignments until Phases 2 and 3. On the tablet it necessarily shows
the "nothing has been recorded in this class yet" wording. The counted string is exercised at the
desk against fixtures, and is owed a human read once there is real data to count.*

*WO-1.7 through WO-1.10 append their own subsections here as they land, in work-order order.
Append; don't restructure.*

---

## Phase 2 — Attendance

*Phase goal: the owner stops opening Roll Call!. The marking flow runs while students walk in.*

Nothing here yet — WO-2.1 through WO-2.7 append their acceptance lines as they land.

When they do, three of them are the ones that decide whether a term of attendance is
trustworthy, and they need a real class rather than a test document: a mark lands and survives a
reload, a dropped class is distinguishable from a not-taken-yet one, and the percentage matches
a hand count. 👤

---

## Phase 3 — Gradebook

*Phase goal: grades entered once or twice a week, in minutes, for five classes.*

Nothing here yet — WO-3.1 through WO-3.10 append their acceptance lines as they land.

Grade math gets hand-computed cases, not spot checks: an all-excused category, a zero-point
assignment, a term with one assignment, and a document where one category has no assignments at
all (its weight redistributes).

---

## Phase 4 — Signals: concern **and** praise

*Phase goal: open the app and see who needs you today, in both directions.*

Nothing here yet — WO-4.1 through WO-4.5 append their acceptance lines as they land.

Every flag has to be reproducible by hand from the numbers it shows, and praise has to rank by
delta rather than by level — a praise list that surfaces the same four high achievers every week
is a failed feature that still passes a smoke test.

---

## Phase 5 — Outreach

*Phase goal: from "this student needs a conversation" to a sent message, without a mail scope.*

Nothing here yet — WO-5.1 through WO-5.4 append their acceptance lines as they land.

Two checks here are containment rather than function: no merge field resolves accommodation,
medical, or plan data, and an unresolved field never renders blank.

---

## Phase 6 — Calendar & the glance page

*Phase goal: open the app at 7:40am and know what the day asks of you.*

Nothing here yet — WO-6.1 through WO-6.4 append their acceptance lines as they land.

Derived events are computed at render, never stored: move an assignment's due date and the
calendar has to follow by itself.

---

## Phase 7 — Drive sync (opt-in) 🔒

*Phase goal: the same year on the laptop and the iPad, with one scope and no fear.*

Nothing here yet — WO-7.1 through WO-7.3 append their acceptance lines as they land. Gated on
Google OAuth verification.

Two checks matter more than the sync working: the app is fully functional signed-out, forever,
and the consent screen shows `drive.file` and nothing else. A conflict keeps both copies and
says where the loser went.

---

## Phase 8 — 1.0 packaging

*Phase goal: something a stranger can find, evaluate, install, and trust.*

Nothing here yet — WO-8.1 through WO-8.6 append their acceptance lines as they land.

This phase's first roadmap item is *this file, complete and fully passing* — which is the
argument for filling it in as the work lands rather than at the end. It also carries the
accessibility pass: screen reader, keyboard-only, contrast. Run it, don't assert it. Roll Call!'s
headless run found 66 unlabelled buttons in an area already ticked done. 👤

---

## Known limitations

Empty until there is an app to have limitations. They get written down here and in `README.md`
before launch, not discovered by a teacher in week one.
