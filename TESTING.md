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
- [x] No merge field, log line, print surface, or export emits accommodation, medical, or plan
      data. The JSON backup is the only exception, and its own UI says so.
- [x] Presentation mode, once it exists, suppresses every `supports` field on every screen built
      since the last pass — including any screen added by this phase.
- [x] `late` and `missing` are teacher-marked, never inferred from a date. Blank is ungraded and
      changes no grade.
- [x] Roll Call! is still deployed and still working. It is the fallback until Planbook has
      survived a full term.

*2026-08-04: the first four ran green against WO-1.1 + WO-1.2. The next three have no surface yet —
no merge fields, no presentation mode, no grades exist — so they are left unticked rather than
ticked vacuously; a tick should mean something was exercised. The Roll Call! line is the owner's to
confirm.*

*2026-08-06, after WO-2.10: the last three are ticked, and the basis differs by line — the note
above asked for that to be said out loud rather than left to a checkbox.* **Sensitive data out of
merge fields, logs, prints and exports** rests on `wo-sweep.mjs`'s standing sensitive-field-name
sweep (172 mentions read, none of them an emitter) plus the resolver refusing those paths by
construction; the backup remains the one exception and its own UI says so. **`late`/`missing` never
inferred from a date** rests on `wo-sweep.mjs`'s grep, which passes — and it is worth being plain
that **there is still no grading surface to exercise it against**, so this one is a claim that no
code violates the rule, not that a teacher marked a grade and watched it hold. Phase 3 is where it
becomes a real check. **Roll Call! still deployed** is the owner's confirmation, given 2026-08-06.
These are standing checks: ticking them closes this pass, not the obligation.

*2026-08-04, re-run for WO-1.4: the touch-target line carries a 👤 and is re-run per phase because
it is the check WO-1.2 passed while shipping `.search-box { min-height: 44px }` around a 19px
input. WO-1.4's new controls are the year picker's — the year rows, the year input, the Create
button, and the modal close — and all four were thumbed on the iPad, including deliberately tapping
above the input's text, which is where the WO-1.2 defect hid. `verify-shell.mjs` measures the same
targets headlessly and is 54/54, but a headless run has no thumb and closes no 👤 line.*

*2026-08-05, presentation mode lands with WO-1.9: `verify-shell.mjs` walks the roster with the mode
on and finds every support dot, panel, and field absent from the DOM — not hidden in it — across
the whole document text and every form control's value, including hidden ones. The suppression is
qualified, not unconditional: it holds for every screen that exists today because `roster.js` never
reads the preference and only asks `supportsVisible()`, but a screen already on the glass when the
toggle flips is redrawn by a hand-maintained call list in `flipPresentationMode()`, not by the
render helper itself. Re-check this line the moment Phase 4 puts a signal card on screen — that is
exactly the shape the acceptance line's own re-verify note was written to catch.*

*2026-08-05, re-run for WO-1.10: the touch-target 👤 line was re-run on the iPad against this work
order's new controls — the class cards and the empty state's "Add your first class" — and passed.
`verify-shell.mjs` measures the same targets headlessly at 0 under 44px, but note that the empty
state is hidden whenever the coarse section runs, so that one button is covered **by rule**
(`src/shell.css`'s bare `button { min-height: 44px }`) rather than by measurement. That is precisely
the reasoning this checklist exists to distrust, which is why it was thumbed rather than asserted.
The presentation-mode line stays ticked without new work: the home screen carries no `supports`
field at all, asks `supportsVisible()` nowhere, and is deliberately absent from
`flipPresentationMode()`'s redraw list — with the condition that ends that exemption named in both
files, namely WO-4.x quoting a behavior note into a card's signals slot.*

*2026-08-06, WO-2.1: **the touch-target line is owed again and was not thumbed for this phase.** The
box stays ticked because it records WO-1.2 through WO-1.10's sittings, not this one — what is
outstanding for WO-2.1's controls is listed under Phase 2 below, and it is the largest set of new
controls any work order has added (five per student, twenty-five students to a class). The desk half
is as good as a desk gets: `wo-sweep.mjs` finds all eleven new selectors inside their own
`@media (pointer: coarse)` block, and `verify-shell.mjs` measures 132 controls on a 26-name marking
screen with none under 44px in either dimension. Neither has a thumb. The presentation-mode line
stays ticked without new work, on the same reasoning WO-1.10's note gives and for a screen with more
reason to need it: the marking screen is the one most likely to be projected, it carries no
`supports` field at all, it asks `supportsVisible()` nowhere, and it is deliberately absent from
`flipPresentationMode()`'s redraw list. The condition that ends that exemption is named in
`src/attendance.js`'s header — Phase 4 surfacing a plan at a fourth absence.*

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

### WO-1.7 — Roster & contacts

- [x] Pasting 25 names produces 25 students with names split correctly, and the preview matched.
- [x] Re-pasting the same list warns about duplicates rather than silently doubling the roster.
- [x] A student added to two classes is one student record with one set of contacts.
- [x] Removing a student from a class does not delete the student from the other class.
- [x] Guardian, counselor, and student emails round-trip through save and reload.
- [x] A **real SIS roster** splits correctly — suffixes, hyphenated surnames, surnames containing
      spaces, reversed entries, and lines with no comma at all. 👤
- [x] The paste box is usable with the iPadOS keyboard up. 👤
- [x] A 26-row preview scrolls inside the modal, down to its last row and its commit button. 👤
- [x] Every roster, paste-preview and student-editor control is thumbable — including the
      three-abreast Add/Skip, ⇄ and field row. 👤
- [x] A wrong split can be corrected with the per-row ⇄ or by typing into the fields, and the
      correction survives the commit. 👤
- [x] VoiceOver reads the paste preview rows and the guardian cards. 👤
- [x] Offline launch with the network off, `roster.js` and `teacher.js` served from the v9
      precache. 👤

*Ticked 2026-08-05, iPadOS 26.5.2 on an iPad (A16), installed to the home screen, served over HTTPS
from `tools/serve-https.mjs`. The Environment table above stands unchanged. The sitting ran past
local midnight, which is also how the desk half found the date bug below.*

*The desk half is `verify-shell.mjs`, **164 of 164** with zero skips, 40 checks added here — 38 for
the roster and contacts themselves, 2 for the defect the sitting found. The parser is never called
by the harness, so the fixture expectations cannot agree with a broken parser by construction.*

*One check was repaired rather than added, and it is worth recording because it cost a re-route.
The backup-filename check compared against `new Date().toISOString().slice(0,10)` — the **UTC**
date — while `src/backup.js:121` names the file with the **local** date. It passes 20 hours a day
and fails in the evening, which is when this sitting happened. Both conjuncts were kept: stricter
about the right value, not looser about the wrong one.*

*The sitting found one defect, and it was not a defect any check was looking for.*

1. ***A save inside a modal was invisible.*** *Every student and guardian edit happens in a modal;
   modals are `z-index: 1000` and the save indicator sat at `999` — and, separately, its only live
   mount was inside the WO-1.2 demo shelf, never the real header. So the teacher changed a
   guardian's email, closed the panel with the ✕, and had nothing at all telling her it landed. The
   data was never at risk — the store flushes a pending edit on visibility change, and the desk half
   proves it on disk within 3ms — but an app holding a term of grades cannot answer "did that save?"
   with silence. The live indicator now floats at `1050`, above the modal layer, with
   `pointer-events: none` so an invisible chip never eats a corner tap. **WO-1.10 still owns mounting
   it in the real header**; this fixes the stacking, not the home.*

*Two limits worth carrying forward.*

- *`Smith, Mike Jr.` splits to last `Smith`, first `Mike Jr.` — correct for `Last, First`, since
  everything past the comma is the given name, and confirmed on the tablet against real data. But
  the suffix now rides on the first name, so a Phase 5 merge field would render "Dear Mike Jr." The
  `nickname` field is the escape hatch and is already on the student record. Not a defect; a thing
  to remember when templates get written.*
- *`tools/wo-sweep.mjs:245` matches new CSS selectors by substring, so `.paste-field` is silently
  cleared by a pre-existing `.paste-fields` rule, and `.roster-row` by `.roster-row-name`. Harmless
  in this pass — all three are wrappers, and the touch targets were measured directly — but any
  future `.foo` control is cleared by any existing `.foo-label`. Pre-existing, and left alone
  deliberately rather than fixed inside a roster work order.*

### WO-1.8 — Accommodations & supports

- [x] Every field in the data model's `supports` block is editable from the panel and round-trips
      through a save and a reload.
- [x] No list view shows plan status, accommodation detail, medical, or behavior text without a
      deliberate tap — the roster carries a dot and no words; the editor's panel arrives shut on
      every open and its fields are emptied, not merely hidden, while shut.
- [x] The indicator dot does not itself encode the plan type by color or shape — one dot, one
      glyph, one generic label, for every student and every plan.
- [x] `reviewDate` is stored and readable, whether or not anything consumes it yet.
- [x] The backup UI names accommodation, IEP/504, medical, and behavior-plan data as present in
      the file, and the downloaded file really carries them.
- [x] Set a review date, clear it from the picker, and re-pick the same date — it takes on the
      first tap. 👤
- [x] The roster support dot and the accommodation-kind picker are thumbable; the kind picker
      opens iPadOS's own wheel. 👤
- [x] The support panel's projection sentence reads as this app, and the dot is discoverable but
      quiet on a screen meant to be projected. 👤

*Ticked 2026-08-05. The desk half is `verify-shell.mjs`, **184 of 184**, 20 new checks in a
`--- support details ---` section plus one touch-pass check; `wo-sweep.mjs` is 9 passed, 2 to
review (both reviewed — see `.claude/dispatch/WO-1.8-result.md`), exit 0. The three 👤 lines were
run by hand on iPadOS in one sitting and all three passed, including the WebKit re-pick quirk on
the new `reviewDate` field, which mirrors the WO-1.6 fix on `classes.js`'s term date and had not
been exercised on hardware before this sitting.*

*One gap was found after the tick and closed the same day: `supportDateCommitted()` — the
review-date write path — was the one of the four support write paths that did not consult
`supportsVisible()` before writing. Harmless at the time because that function was hardcoded to
always allow, but it would have become a silent data-loss path the moment WO-1.9's presentation
mode made it return `false`. Fixed 2026-08-05 by adding the same guard the other three paths
already carry; `verify-shell.mjs` stayed 184/184 after, since no check yet exercises
`supportsVisible() === false` — that harness arrives with WO-1.9 itself.*

### WO-1.10 — Home screen v0

- [x] Six classes fit on an iPad screen in portrait without scrolling, at 44px+ touch targets. 👤
- [x] Every class is exactly one tap from the home screen.
- [x] A fresh document shows a real empty state, not five blank cards.
- [x] Adding the Phase 2 today-state line requires touching only the card renderer.
- [x] `node tools/verify-shell.mjs` runs against this screen with no `SKIP` caused by a deleted
      shelf fixture, and its check count has not fallen.

*Ticked 2026-08-05. The desk half is `verify-shell.mjs`, **209 of 209, 0 skipped**, up from 201 at
`HEAD` — the before-count was re-derived from a pristine `git archive HEAD` extract by the verifier
rather than taken from the implementer's report, because "the count has not fallen" is unanswerable
after the fact. `wo-sweep.mjs` is 10 passed, 1 to review (reviewed: the 170 sensitive-name mentions
now include `src/home.js`, and all of its hits are in the header comment explaining why this screen
carries no support data), exit 0.*

*The portrait fit is measured at 768×1024 under touch emulation, behind a gate asserting the pointer
really is coarse — without that gate the fit is the desktop pass and proves nothing about glass. Six
cards in three columns, last card ending at 476px of 1024px. The 👤 line was run on a real iPad in
one sitting the same day and passed: six cards read as six classes at a glance in portrait with the
backup nag up, the reserved-but-empty slots read as "not built yet" rather than "failed to load",
"Add your first class" is thumbable from the empty state, and three columns is the right density.*

*Two things the harness cannot see, recorded because a green run over a fixture that cannot express
the failure is the recurring defect in this project.* **The home screen's redraw on a class mutation
is unguarded:** `src/shell.js` calls `afterClassChange()` from eight sites, the list is complete
today and was matched against every exported mutator in `classes.js`, but the run reads `#homeGrid`
before the archive step and never again — so a missing line in the archive, restore, delete,
reorder, create or rename branch would leave all 209 checks green and show the teacher a class she
just archived. **And `wo-sweep.mjs`'s coarse-block grep went vacuous for the new stylesheet:** it
reads `git diff HEAD -- src/*.css`, which cannot see an untracked file, so none of `src/home.css`'s
nine selectors were evaluated by it. The substantive rule holds anyway — they are all in that
file's own coarse block and `verify-shell.mjs` measured 0 targets under 44px — but the grep half
proved nothing here, and it will go vacuous for every per-screen stylesheet from now on.

### WO-1.11 — Back up every year in one tap

- [x] With two years on the device, one tap produces a readable backup of both.
- [x] The control is absent with only one year, and no teacher who never rolls over ever sees it.
- [x] Each year written gets its own `lastBackupAt` stamp; the nag is down for both afterwards.
- [x] Restore still accepts every file this produces, and the WO-1.5 refusal checks still pass
      unchanged.
- [x] 👤 On an installed iPad: every file lands in Files, and the run is not silently truncated to
      the first year by Safari's download handling. **Failed on the first (sequential-download)
      build, real hardware, 2026-08-05; passed on the zip rebuild the same day — see retest below.**
      *(The one line still open here — every file landing in Files across all years — was closed by
      the owner in the 2026-08-06 block confirmation.)*

*Desk pass 2026-08-05: `verify-shell.mjs` **224 of 224, 0 skipped**, up from 209 at WO-1.10 — 15 new
checks. Files read back off disk, not asked of the page: three years produce three files with
distinct `docId`s and rosters, round-trip through the real restore path, and a Traps fixture proves a
poisoned year is skipped, unstamped, and named on screen without corrupting the other two.
`wo-sweep.mjs` is 10 passed, 1 to review (the standing sensitive-field-name line, unaffected). A
first verification pass also failed line 2 in a different way — the never-downloaded strip could name
the hidden "Back up all N years" control in prose on the boot-failure screen — fixed and confirmed
non-vacuous by mutation before this hardware session.*

*Then run by hand on an installed iPad the same day, and **it failed**, in a way the desk harness had
no way to anticipate: tapping "Back up all 2 years" produced the native "Open in…" sheet for the
first file only. Saving it and returning to Planbook showed the identical panel — no second dialog,
no status message, nothing. The nag for the un-downloaded year was still up, in both the backup panel
and on the year screens, which means `recordBackupFor()` correctly never ran for it — no false stamp,
the one thing this line exists to prevent stayed prevented. But the feature itself did not survive
contact with the device it was built for.*

*Root cause, worked out with the teacher present: on an installed home-screen PWA, iOS's "Open in…"
sheet is a full context switch, and the page does not resume its JS afterward — the loop inside
`downloadAllBackups()` (`BETWEEN_FILES_MS` wait, then the next `handToBrowser()` call) simply never
continues, and neither does the code that would print "Saved 1 of 2." No delay between files fixes
this, because the interruption happens on leaving the page, not after a timeout — the
one-download-event-per-file architecture cannot produce more than one file per tap on iPadOS, full
stop. Correction round dispatched 2026-08-05: bundle every year into a single `.zip`, so the whole
run is one download event and there is no loop to survive a reload. The single-year button (WO-1.5,
already hardware-proven) is untouched and stays the fast path for the common case.*

*The zip rebuild (`src/zip.js`, hand-written, no dependency) landed 2026-08-05, survived a machine
crash mid-round with the app code intact, and was verified twice: `verify-shell.mjs` **224 of 224, 0
skipped**, plus independent cross-validation of a produced archive against three readers sharing no
code with this repo — Python `zipfile`, `tar.exe` (libarchive), and .NET `ZipArchive` — all three
extracting byte-identical JSON, every CRC verified. A negative control (one corrupted byte injected,
then reverted) confirmed the harness actually catches a bad archive rather than passing by
construction. One stale decision-record comment in `index.html` was caught by the verifier and fixed;
nothing else needed correction. The desk half is done. What's left is the same shape of test as
before, run against the new mechanism:*

**The 👤 retest, run 2026-08-05 in one sitting on the installed home-screen app:**
- [x] Tap "Back up all N years." The "Open in…" sheet appears **once**, for one `.zip` file.
- [x] Save it, return to Planbook, and confirm the status line is on screen naming the file —
      the old build could never reach this line; if it's there, the hand-off completed.
- [x] Tap the saved `.zip` in Files. It unpacks to N loose `Planbook <year> backup <date>.json`
      files.
- [x] Drop one of those into Planbook's restore. It reaches the "Replace `<year>`" confirm
      (cancel is fine — this checks restore accepts it, not that you want to replace anything).
- [x] Confirm the backup nag is down for every year, not just the one on screen.
- [x] Largest-real-dataset run — **not exercised this sitting**; the device did not yet hold more
      than a small amount of data. The in-memory build size risk (`src/backup.js`, `src/zip.js`
      decision records) stays a thing to watch as real classroom data accumulates over the term,
      not a gate WO-1.11 needed to clear before shipping.

All five acceptance lines close on this pass. WO-1.11 is done.

### WO-1.13 — Main-area views: make the header actually navigate

- [x] Selecting a class from the header changes what is in `<main>`, without opening a dialog.
- [x] Attendance is marked in the main area, with no overlay above the class cards.
- [x] There is exactly one control in the app that means "work on this class now", and a second
      control that means something different can be told apart from it in words. *(Failed at the
      first pass and reopened; closed on the correction below — **cards enter, tabs switch**.)*
- [x] Returning to the class grid is one tap from any view, and the tap is findable without being
      told where it is. 👤 *(The one tap is measured — both doors are driven in the harness. Whether
      a teacher finds it without being told is the half no harness can ask.)*
- [x] `verify-shell.mjs` runs green with no fewer checks than before, and every check that used to
      open `attendanceModal` now drives the view.
- [x] The class manager, term editor, roster paste and student editor still open as modals and still
      work.
- [x] Reloading with a class selected returns to that class's view, not to a blank main area.
- [x] Presentation mode still suppresses every support field on every view, including the new ones.

*Desk pass 2026-08-06: `verify-shell.mjs` **280 of 280, 0 skipped**, up from 274 at WO-2.1 — six net
new checks and ten re-pointed ones. The ten that used to open `attendanceModal` now drive `#classView`
through the controls a teacher touches: a card, a header tab, and the two "All classes" doors.
`wo-sweep.mjs` is 10 passed, 0 failed, 1 to review (the standing sensitive-field-name line,
unaffected), and its "every control added in the working tree appears in the coarse block" line
covers this work order's five new selectors.*

*Correction pass 2026-08-06, and it is the third line above: `verify-shell.mjs` **282 of 282, 0
skipped**, measured three times deterministically, up from 280 and with nothing dropped.
`wo-sweep.mjs` unchanged at 10 passed, 0 failed, 1 to review. **The class tab strip is no longer
drawn on the home view at all** — there the cards are how you enter a class, and on the class view
the strip is the switcher between classes, which is the job the cards cannot do because they are not
on screen then. The two are never visible at once meaning the same thing, which is what the
acceptance line has always asked for. On the grid that strip carries a caption ("Your classes", the
home panel's own title, in the same muted voice as "No classes yet.") so the row is not a blank navy
band, and the term nav, the divider and the three icon buttons beside it do not move between views.
The two new checks count the controls a teacher could tap **right now** in each view — 6 cards and 0
header tabs on the grid, 6 header tabs and 0 cards on a class, one active tab, and both "All
classes" doors on the class view only. Both were proved non-vacuous by mutation and reverted:
drawing the tabs on the home view again turns two checks red, and blanking the caption turns one
red. Five checks in the classes section now take their reading of the strip from the class view,
through a card tap rather than through the seam, because that is where the strip lives; none was
deleted, and the year-switch check moved its "the classes came back" clause onto the cards while
keeping the term nav as proof that `refreshClassBar()` ran.*

*What moved. `<main>` holds `#homeView` and `#classView` as siblings toggled by `.hidden` —
Roll Call!'s own shape, no router, no history stack. WO-2.1's registry was **re-parented** into the
second one: same ids, same renderer, same grid, a `.panel` frame instead of a `.modal-panel` one,
and the dialog semantics deleted rather than hidden (asserted: no `role="dialog"`, no `aria-modal`,
no close control anywhere inside the view). The redundant selector retired is `data-attendance-open`
— the class card is one control again, and the state line inside it is a `<span>` that reports.*

*Three things this desk pass cannot answer and are listed here rather than assumed: whether the
"All classes" tab is findable without being told (the 👤 line above), whether the registry still
marks fast enough on a real iPad now that it sits on a page instead of in a dialog, and whether the
720px panel left-aligned in a 1300px main area reads as deliberate or as a layout bug on a wide
screen. The first two belong to the sitting below; the third is a taste call for the owner.*

**The 👤 iPad sitting WO-1.13 owes**, on the installed home-screen app:

- [x] Open the app, tap a class card, and confirm the class's screen replaces the grid with no
      dialog and no overlay — then find your way back **without being told how**. 👤
- [x] Do the same from the header's class row, with six classes on it, in portrait: the row scrolls,
      so check that "All classes" is still reachable and that the second door in the panel header is
      where you look for it. 👤
- [x] On the grid, look at the header's bottom row with a teacher's eye rather than a reader's: it
      carries no class tabs there, only the words "Your classes" beside the term nav. Does it read as
      a caption, or does it read as a strip that failed to load? That is the one call in this work
      order a harness measured (63×16px, inside its strip) and cannot answer. 👤
- [x] Force-quit and relaunch while a class is open. It comes back on that class's screen. 👤
- [x] The page scrolls as one surface now that the grid is not in an overlay — a flick down a
      26-name list does not get handed between two scrollers, and the header scrolls away as
      expected. 👤
- [x] VoiceOver: leaving the class view announces the class grid, and nothing announces a dialog
      that never closes. 👤

*The remaining 👤 lines in this section were closed by the owner on 2026-08-06, in the same block
confirmation that closed WO-2.1's and WO-2.10's — "everything can get ticked", given after the
note-panel fix was confirmed on the device. Recorded as one attestation rather than as separate
sittings because that is what it was; if one of these is later found wrong, this is the thread to
pull.*

---

## Phase 2 — Attendance

*Phase goal: the owner stops opening Roll Call!. The marking flow runs while students walk in.*

WO-2.3 through WO-2.7 append their acceptance lines here as they land.
*(WO-2.2 was merged into WO-2.1 on 2026-08-06 — see the tombstone in
[`plans/work-orders/phase-2-attendance.md`](plans/work-orders/phase-2-attendance.md).)*

Three lines in this phase are the ones that decide whether a term of attendance is trustworthy,
and they need a real class rather than a test document: a mark lands and survives a reload, a
dropped class is distinguishable from a not-taken-yet one, and the percentage matches a hand
count. 👤 The first two land with WO-2.1 below; the third is WO-2.4's.

### ~~WO-2.1 — Attendance marking screen~~ · superseded 2026-08-06, kept as a record

**These ticks verified commit `11f0780`, not the shipping screen.** That build was a one-class,
one-day marking screen; it satisfied every line below and was still worse for the owner than Roll
Call!'s six-day registry view, so WO-2.1 was rewritten around the grid and WO-2.2 folded into it.
The pass recorded here was real and is left intact — the harness evidence and the three mutation
proofs below still hold for the storage layer, which survives the rewrite. **The acceptance list
that governs is the one in the rewritten work order**, and it gets its own section here when the
grid lands. Nothing below is a claim about the current tree.

- [x] A mark lands and survives a reload.
- [x] A dropped class and an untaken class are visually distinguishable without reading fine print,
      and are distinguishable in the stored document.
- [x] Marking a class taken with zero exceptions still creates a record — otherwise "taken with
      everyone present" is indistinguishable from "forgot."
- [x] One tap drops a class; one tap undoes it.
- [ ] Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad. 👤
- [x] All five marks are reachable without a submenu.
- [x] The document after a full day of five classes contains no `P` entries.

*Desk pass 2026-08-06: `verify-shell.mjs` **260 of 260, 0 skipped**, up from 231 at WO-1.12 — 29 new
checks, 26 of them the attendance section and three in the touch and home-card blocks. Everything is
driven through the controls a teacher touches: the screen is opened by tapping a card's state line,
marks are made by tapping the letters, the class is dropped and un-dropped with its own buttons. The
`window.planbook.attendance` seam is read-only, so the harness never gets to hold a second opinion
about whether a class was taken. `wo-sweep.mjs` is 10 passed, 0 failed, 1 to review (the standing
sensitive-field-name line — the new mentions are all in `src/attendance.js`'s header comment
explaining what is deliberately absent from that screen; no code path there reads `supports`).*

*The three claims that are about an ABSENCE were proved non-vacuous by mutation before this was
written, because an absence check with nothing behind it goes green whatever the build does. Making
`setMark()` store `P` instead of deleting turned five checks red, including acceptance line 7's.
Repainting `.class-card-state.dropped` in the untaken palette turned the three-state comparison red.
Handing the dialog the opener node the click handler was given — which `refreshHome()` has already
detached — sent focus to `<body>` on close and turned the focus-return check red. All three
mutations were reverted and the run is green on the shipped tree.*

**The 👤 iPad sitting this work order still owes.** Run these on the installed home-screen app,
against a class with a real 25-name roster:

- [x] Twenty-five students, two absences, **under 15 seconds**, timed with a stopwatch from tapping
      the card's state line. This is the acceptance line, and it is the only one that decides
      whether the flow survives contact with a period starting. 👤
- [ ] The three states are readable **from where you stand** — dropped vs not-taken-yet, at arm's
      length, in a lit classroom, without leaning in to read the words. 👤
- [ ] Mark two students, then force-quit the app mid-period and relaunch. Both marks are still
      there. *(There is no submit step by design; this is what makes that safe rather than
      reckless.)* 👤
- [ ] Every control on the marking screen takes a thumb: the five letters on a row, "Everyone's
      here", "Didn't meet", and the card's own state line. Tap the letters at the edges, not the
      middle — that is where the WO-1.2 defect hid. 👤
- [ ] The row does not spill sideways in portrait, and the list scrolls as one surface (no
      scroller-inside-a-scroller stealing the flick). 👤
- [ ] VoiceOver reads a mark button as the word and the student's name, not as a bare letter. 👤
- [x] Offline launch with the network off: `attendance.js` and `attendance.css` are served from the
      precache and the screen still marks. 👤 *(Owner, 2026-08-06. Same physical test as the
      duplicate of this line in the other work order's list.)*

### WO-2.1 — Attendance registry: students × recent days

**This is the section that governs.** The one above records commit `11f0780` and is kept because
the ticks in it were real; nothing in it is a claim about the current tree. The screen shipping now
is a grid — students down, the last six weekdays across, tap a cell to cycle — and its twelve
acceptance lines are the ones in the rewritten work order.

- [x] A mark lands and survives a reload.
- [x] **Six days of columns are visible at once for a class of 26 without sideways scrolling on an
      iPad**, in the orientation the owner actually holds it. 👤 **⚠ Qualified by WO-2.8 on
      2026-08-07 — true in landscape, no longer true in portrait.** See § WO-2.8 below, *"The day
      columns in portrait"*: a 160px `Passes` column joined the grid, `dayColumnCount()` budgets for
      it, and portrait now draws **four** day columns. Nothing scrolls sideways in either
      orientation, which is measured. The tick stays until the owner re-closes it, because she is
      the one who closed it and the choice below is hers.
- [x] A dropped class and an untaken class are visually distinguishable without reading fine print,
      and are distinguishable in the stored document — in the column header and in the cells under it.
- [x] Marking a class taken with zero exceptions still creates a record.
- [x] One tap drops a class; one tap undoes it.
- [x] Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad. 👤
- [x] **Attendance can be recorded for a date two weeks back and it lands on that date**, reached
      from this screen without a separate view.
- [x] **The "not today" indication is visible in a glance, on an iPad, in a classroom.** 👤
- [x] **Future dates are either blocked or clearly flagged.**
- [x] **A hole deliberately left three days earlier is findable by looking at the grid.**
- [x] All five marks are reachable from a cell without opening a submenu or leaving the row.
- [x] The document after a full day of five classes contains no `P` entries.

*Desk pass 2026-08-06: `verify-shell.mjs` **274 of 274, 0 skipped**, up from 260 on the one-day
build — fourteen net new checks, and the attendance section rewritten around the grid rather than
extended. Everything is driven through the controls a teacher touches: the screen is opened by
tapping a card's state line, marks are made by tapping cells, a past day is unlocked with its own
✏, and the class is dropped and un-dropped from today's column head. The `window.planbook.attendance`
seam is read-only with ONE stated exception — acceptance line 9's "future dates are blocked" has no
control to click, by construction, so the writer is called directly with tomorrow's date and asserted
to write nothing. `wo-sweep.mjs` is 10 passed, 0 failed, 1 to review (the standing sensitive-field-name
line — the new mentions are the two in `src/attendance.js`'s header comment explaining what is
deliberately absent from this screen; no code path there reads `supports`).*

*The columns are asserted against a window this harness derives from the calendar in Node, not
against whatever the app chose — the same "two runtimes, one clock, one answer" posture the local-date
check already used. A window built from records rather than from the calendar would pass a check that
asked the app, and it is exactly the mistake that would hide a forgotten day.*

*Four mutation proofs, run before this was written, because a check about an absence goes green
whatever the build does unless it has been seen to go red:*

| Mutation | Result |
|---|---|
| `setMark()` stores `P` instead of deleting the entry | **7 checks red**, including acceptance 12's |
| an untaken cell painted in the taken palette | **1 red** — the three-state header-and-cells comparison |
| the `<= today` clause dropped from `writableDate()` | **2 red** — the future-date refusal and the full-day tally |
| the unlock gate dropped, so past columns take taps directly | **1 red** — tappable cells per row went 1 → 5 |

*All four were reverted and the run is green on the shipped tree.*

**The 👤 iPad sitting this work order owes.** Run these on the installed home-screen app, against a
class with a real 25-name roster. The first three are the acceptance lines; the rest are what the
desk pass could not reach.

- [x] **Six columns and twenty-six names, in the orientation you actually hold the iPad.** No
      sideways swipe, and the leftmost column is today. This is acceptance line 2. 👤
      **⚠ Same qualification as the acceptance line above — WO-2.8, 2026-08-07.** Six columns in
      landscape, four in portrait; no sideways swipe either way, and the leftmost column is still
      today. § WO-2.8's *"The day columns in portrait"* is the open question and it is the owner's.
- [x] Twenty-five students, two absences, **under 15 seconds**, timed with a stopwatch from tapping
      the class's card. Acceptance line 6, and the only one that decides whether the flow
      survives contact with a period starting. *(The card's state line was the tap until WO-1.13
      made the whole card one control; the clock starts on the same gesture either way.)* 👤
- [x] Unlock a past column and look at the screen **from where you stand at the front of the room**.
      The strip saying which day you are on is legible without leaning in. Acceptance line 8. 👤
- [x] The three column states are readable at that same distance — the amber "not taken" stripe,
      the dashed grey "didn't meet", and a taken day — without reading the words. 👤
- [x] Every control takes a thumb: a cell, the ✏ and 🚫 in a column head, the filter pills, the
      First/Last pair, Earlier/Today/Later, "Everyone's here", "Didn't meet", and the card that
      opens the screen. Tap the cells at their edges, not the middle — that is where the WO-1.2
      defect hid. *(The card's state line was its own control until WO-1.13; the card is the target
      now.)* 👤
- [x] Tap the same cell five times fast. It walks absent → event → tardy → dismissed → present and
      nothing is double-counted or skipped by the touch handler. 👤
- [x] Mark two students, then force-quit the app mid-period and relaunch. Both marks are still there.
      *(There is no submit step by design; this is what makes that safe rather than reckless.)* 👤
- [x] The grid scrolls as one surface and a flick down the list does not get handed between two
      scrollers. *(It was the modal overlay that scrolled until WO-1.13 moved this screen into
      `<main>`; it is the page now, which is a different thing to feel on the device.)* 👤
- [x] Type into the search box with the software keyboard up and confirm the field keeps focus as the
      rows narrow underneath it. 👤
- [x] VoiceOver reads a cell as the student's name, the day and the mark — not as a bare letter — and
      says what the next tap will do. 👤 *(Owner, 2026-08-06.)*
- [x] Rotate from portrait to landscape with the screen open. The grid is still readable; it keeps
      the columns it had until the next open. *(Known and deliberate — see the result file.)* 👤
      *(Owner, 2026-08-06.)*
- [x] Offline launch with the network off: `attendance.js` and `attendance.css` are served from the
      precache and the screen still marks. 👤 *(Owner, 2026-08-06. Same physical test as the
      duplicate of this line in the other work order's list.)*
- [x] **The owner opens it and says whether it beats Roll Call!.** This is the line the first build
      failed, and no harness can ask it. 👤 **Yes** — 2026-08-06, on the device, and it is the line
      that retires the superseded section above.

*Closed by the owner on 2026-08-06 as one block confirmation, the same one that closed WO-1.11's,
WO-1.13's and WO-2.10's remaining lines. Two of these deserve naming because a later reader will
want them: the **fifteen-second stopwatch line** is ticked on the owner's judgement of the shipping
build rather than on a recorded time — WO-2.10 lengthened the cycle by a tap per absence and
shortened it by one per present student, so if that line is ever re-opened, re-time it rather than
trusting this tick. And **"it beats Roll Call!"** is the line the first build failed; the yes above
is what the rewrite was for.*

### WO-2.10 — Mark cells: unconfirmed, timed, and noted

**What changed under the acceptance list above.** A cell starts on `?` and the first tap means
present; tapping one student no longer moves anybody else; a `marks` cell is an object carrying an
optional time and note; and every document on the device — and every backup file already on the
teacher's disk — climbs a migration to get there. WO-2.1's twelve lines above still hold and are
still ticked: the storage at rest, the three states, and the no-`P` rule are unchanged.

- [x] Tapping one student's cell moves that cell to `P` and changes no other cell on the screen.
- [x] "Everyone's here" resolves every student to `P` in one tap, and the document holds no `U`
      afterwards.
- [x] A class of 26 with two exceptions is **two entries** in the finished document — no `U`, no `P`.
- [x] Tapping one cell, then reloading, still shows one `P` and twenty-five `?`.
- [x] A class nobody has touched has no record at all and reads "not taken yet".
- [x] The home card names the number of unconfirmed students on a half-taken class.
- [x] The cycle from `?` reads `P → A → E → T → D` and returns to `P`, never to `?`.
- [x] A student added to the roster after a class was taken does not acquire a mark for it.
- [x] Marking a student tardy stores an `at` timestamp; the grid shows the time under the letter.
- [x] Cycling past `T` onto `D` leaves one time — the dismissal's — and no orphaned tardy time.
- [x] Cycling all the way back to `P` clears the entry entirely: no code, no `at`, no note.
- [x] A note typed on a mark survives a reload, on the same student, date and class.
- [x] Every cell in the document is an object. Not one bare string anywhere.
- [x] Restoring a backup written before this work order produces object cells, codes intact and no
      `at` invented.

*Desk pass 2026-08-06: `verify-shell.mjs` **299 of 299, 0 skipped**, up from 282 at WO-1.13’s
correction — fifteen net new checks, and much of the attendance section re-pointed rather than
extended, because a tap that used to give `A` now gives `P` and a cell that used to be `"A"` is now
`{"code":"A"}`. Everything is driven through the controls a teacher touches: cells are tapped,
"Everyone's here" is clicked, the note is typed into the row's own panel through a real `input`
event, and the pre-WO-2.10 backup goes in through `restoreFromText()` and the real confirm dialog.
`wo-sweep.mjs` is 11 checks, 10 passed, 0 failed, 1 to review — the standing sensitive-field-name
line, unchanged in kind: the new mentions are still `src/attendance.js`'s header comment explaining
what is deliberately absent from this screen.*

*Four mutation proofs, run before this was written, because a check about an absence goes green
whatever the build does unless it has been seen to go red:*

| Mutation | Result |
|---|---|
| `setMark()` stops seeding `U`, so one tap resolves the class the old way | **12 red**, including "changes no other cell" and the whole `?`-survives-a-reload pair |
| a cell is stored as its bare code string again | **11 red**, including "every cell is an object" and both timestamp checks |
| the `1 → 2` migration converts nothing | **4 red**, including the restored pre-WO-2.10 backup |
| a stale `at` is carried across a code change | **1 red** — the un-confirm, which is the only path in this cycle order by which a time can reach a cell that should not have one (`T` can only be left for `D`, which re-stamps, or for `P`, which deletes the entry) |

*All four were reverted and the run is green on the shipped tree.*

**The 👤 iPad sitting this work order owes.** Everything below needs a thumb, a real device or
eyes, and none of it was checked by the harness.

**Closed by the owner on 2026-08-06, on the device, as a block** — "you can check everything off",
after the note-panel fix below was confirmed in both orientations. Recorded that way rather than as
eight separate sittings because that is what happened: one person, one afternoon, one verdict. If any
of these is later found wrong, this line is where to start.

- [x] Take a class of 25 the new way — one tap per student, `?` to `P` down the list — and time it.
      The cycle got one tap longer for an absence (`?` → `P` → `A`) and one shorter for a present
      student, so WO-2.1's fifteen-second line has to be re-run rather than assumed. 👤
- [x] Start a class, walk away, come back an hour later. The card says how many are unconfirmed and
      it is readable from across the room. 👤
- [x] The `?` cells inside a *taken* column and the `?` cells of a *whole untaken* column are
      distinguishable at arm's length — the column wash and the head are what separate them. 👤
- [x] The time under a tardy is legible on the device, and adding it has not moved the 44px circle
      or made the rows taller. *(It is positioned out of flow precisely so it cannot; that is a
      claim about a layout nobody has looked at on glass.)* 👤
- [x] The ⋯ at the end of a name takes a thumb without catching the cell beside it, and the note
      field keeps focus with the software keyboard up as it is typed. 👤
- [x] VoiceOver reads a `?` cell as "not confirmed yet" and a tardy as its word, its time and its
      note — not as a bare letter. 👤
- [x] **Restore a backup taken from the teacher's own device before this build** and confirm the
      attendance is all there. The harness proves it with a file it wrote itself; the owner's real
      file is the one that matters. 👤
- [x] **The owner takes a full day of five classes on it and says whether the first tap meaning
      "present" is right.** This is the complaint the work order came from and no harness can ask
      it. 👤

#### The note panel's width — found on glass 2026-08-06, fixed the same day

The first sitting found the note field cut off on the right, in **both** orientations, worst on
present / absent / at-an-event and still wrong on tardy and dismissed. Two rules in
`src/attendance.css`'s coarse block were at fault and both are now in: `.attendance-panel` was still
capped at the old dialog width of 720px there (the cap had been lifted from the base rule and left
standing in the touch block, so the fix reached the laptop and never the iPad), and
`.attendance-name` had no `max-width`, so a long name's `nowrap` min-content pushed the whole table
past its wrap.

`verify-shell.mjs` now measures the field's right edge against the grid wrap's at both orientations
on all five codes, with the long name written in deliberately — reverting either rule turns it red
(+16px on `P`/`A`/`E`, the wrap overflowing by 31px). What it cannot do is look at it:

- [x] The note field is fully visible in **portrait**, on a class whose longest name is a real one —
      hyphenated or double-barrelled, the case that caused this. 👤
      *(Owner, on the device, 2026-08-06: "it looks good in both.")*
- [x] The same in **landscape**, where the panel now takes the full width of the main area rather
      than 720px of it. 👤 *(Same sitting.)*
- [x] The name column truncating with an ellipsis is acceptable in portrait, and the full name still
      arrives on the row's tooltip / to VoiceOver. *(256px is the arithmetic — 688px of body less six
      72px columns. Nothing capped it before this, so nobody has seen it truncate.)* 👤
- [x] The wider panel has not made the row too long to aim down: the reason the 720px cap was argued
      for in the first place was eye-track and thumb-track on the one screen timed in seconds. If it
      now reads as too wide, say so — the answer is a wider name column, not the dialog width back. 👤

### WO-2.8 — Hall passes: issue, hold, return

**What this adds.** A `Passes` column in the registry, between the name and the day columns: 🚽 Bath
· 🏥 Nurse · ⚡ Quick while a student is in the room, and a single **Return** with the time they left
while they are out. Three at once per class. The open pass lives in the year document — not in a
module variable, which is the one thing this work order deliberately does *not* copy from Roll Call!
— so it survives a reload, a crash and a force-quit.

- [x] Return writes one log entry with the right minutes, and the student's buttons come back.
- [x] The fourth concurrent pass is refused with a reason on screen, not by a dead button.
- [x] Marking a student `D` while they are out leaves no pass open, and undoing the `D` puts it back.
- [x] The log is keyed by student id — verified in the document, not the UI. Renaming a student
      afterwards neither orphans nor re-attaches their passes.
- [x] Issuing and returning a pass creates no attendance record and changes no attendance mark.
- [x] An open pass comes back out of IndexedDB after a full page reload, with the original time out.
      *(This is the desk half of acceptance line 1 — see the 👤 list below for the half it is not.)*
- [x] A document written before this build climbs the `2 → 3` rung and comes up holding both
      collections, empty, on disk.
- [x] **A `D` edited on a LATER day does not push its finished pass back into the corridor**, and
      does not delete the dismissal out of the append-only history either. *(Added 2026-08-07 in
      correction round 1 — see below.)*
- [x] **The cap is per class:** a room with three students out leaves the class next door its own
      three, and a student out of one room is not drawn as out of another. *(Same round.)*

*Desk pass 2026-08-07 (correction round 1): `verify-shell.mjs` **330 of 330, 0 skipped**, up from
314 at WO-2.10 — sixteen net new checks. Everything is driven through the controls a teacher
touches: the pass goes out by clicking a real 🚽 button, comes back by clicking a real Return, and
the `D` is reached by tapping the cell four times round the cycle rather than by calling `setMark`.
Three exceptions to that, all named in the file: the fourth pass is asked for through the seam
because a disabled button has no click to give; the seven-minute gap the minutes are measured
against is wound into the open pass through the store, because every pass this harness issues
otherwise comes back in under a second and "0 minutes" is what a broken calculation and a correct
one both produce; and the per-class cap is asked of `atCap()` and `openPassFor()` directly, because
issuing a pass in a second class would move the totals every check after it counts.
`wo-sweep.mjs` is 11 checks, 10 passed, 0 failed, 1 to review — the standing sensitive-field-name
line, at the same 172 mentions across the same files as before this work order.*

*Seven mutation proofs, run before this was written:*

| Mutation | Result |
|---|---|
| open passes kept in a module variable, the way Roll Call!'s `activePasses` are | **5 red**, the reload check among them: "the record on disk is `[]`" |
| the `2 → 3` migration rung converts nothing | **8 red** — the rung itself, and then every backup check, because `parseBackup()` refuses a document missing a collection |
| a `D` no longer closes an open pass | **2 red** — the cell walks `A+ E+ T+ D+` where it should end `D-` |
| the cap guard removed from `openPass()` | **1 red** — the screen still refuses a fourth, and the model underneath it does not |
| the `on === todayISO()` guard taken off the **reopen** half of the `D` coupling | **1 red** — a finished pass back in the corridor with yesterday's time out, and the dismissal gone from the log (`2 pass(es) open`, `1 logged`) |
| `atCap()` counting every open pass instead of this class's | **1 red** — the class next door reads full, and its reason line names the wrong class |
| `openPassFor()` matching on student id without the class | **1 red** — a student out of one room reads as out of the next |

*All seven were reverted and the run is green on the shipped tree.*

#### The day columns in portrait — the owner's call, and it is open

**What happened.** Six day columns, a name column and a 160px `Passes` column do not fit an iPad in
**portrait** (688px of grid for 848px of demand). This screen already had an answer for "not enough
width" — draw fewer day columns rather than scroll sideways — so `dayColumnCount()` became a width
budget and portrait shows **four** day columns. Landscape and any laptop still show six. Letting the
grid overflow its wrap instead is exactly the defect that clipped the WO-2.10 note panel off the
right edge, so it was not really an alternative. The coarse name cap moved 256 → 232 to suit.

**What that broke on paper.** WO-2.1's acceptance line 2 — *"six days of columns … in the
orientation the owner actually holds it"* — was ticked by the owner on her own device on 2026-08-06
and this makes it false in portrait. It is annotated in both places rather than pulled (§ WO-2.1
above, and `plans/work-orders/phase-2-attendance.md`), because the owner closed it and only she can
re-close it.

**The three options, with the arithmetic.** The budget is `viewport − 80px of chrome − the name
column − 160px of Passes`, and each day column is 72px. The only lever is the name column's cap
under `(pointer: coarse)`. Roughly 95px of that cap is furniture — a 32px avatar, the 44px ⋯, and
padding — before a single letter of a name.

| Name cap | Text before the ellipsis | 768px portrait | 820px iPad Air | 834px 11″ Pro | 1024px 12.9″ | Landscape |
|---|---|---|---|---|---|---|
| **232px** — what is on disk | ~17 characters | **4 days** | 4 | 5 | 6 | 6 |
| **~165px** | ~9 characters — most surnames start truncating, not just the long ones | **5 days** | 5 | 5 | 6 | 6 |
| **~95px** | none — the avatar and the ⋯ with nothing between them | **6 days** | 6 | 6 | 6 | 6 |

The full name stays on the row's tooltip and on what VoiceOver reads at every one of these, so
nothing is lost that cannot be recovered by looking; what changes is what can be read at a glance
while a class walks in. **This is a taste call about the owner's own screen and it has not been
made.** The 👤 line below is the one to answer first.

**The 👤 iPad sitting this work order owes.** None of this was checked by the harness.

- [x] Issue a pass, **force-quit the app from the app switcher**, relaunch, and confirm the student
      is still out with the original time out. The harness proves the reload; only a real
      force-quit of an installed PWA proves the line. 👤
- [x] Every pass control clears 44px under a thumb — the three issue buttons side by side in a
      160px column, and the Return button beside its time. The harness measures them; a thumb is
      what tells you whether 🚽 and 🏥 can be hit apart at speed. 👤
- [x] The icons alone are enough on a touch device. The words *Bath · Nurse · Quick* are hidden
      under `(pointer: coarse)` to buy the column its width, and they are still on the tooltip and
      to VoiceOver — but the owner is the one who knows whether three emoji read as three buttons
      at arm's length. 👤
- [x] **Four day columns in portrait instead of six — four, five or six?** Answered 2026-08-07, and
      the answer was **none of the three**. Two corrections came out of asking it. The owner's iPad
      is an 834pt 11″, so what is actually on that screen in portrait is **five** columns, not the
      four this section leads with — four is the 768pt row. And the choice on offer was the wrong
      one: rather than buy a sixth column by cutting the name column to an avatar and an ellipsis,
      **portrait should show today only and landscape should keep six**. Booked as **WO-2.12**;
      WO-2.1's acceptance line 2 is rewritten there rather than re-closed here, because
      "six days in the orientation the owner holds it" stops being the goal. 👤
- [x] A pass issued in period 2 and never returned is still open in period 3 — deliberately, because
      nothing invents a return time. Confirm that reads as a reminder rather than as a bug. *(The
      banner and the overdue alerts that would make it comfortable are WO-2.9.)* 👤
- [x] VoiceOver reads a Return button as the student, the type and the time out — not as "Return". 👤

*Five of the six were run on the owner's own iPad in one sitting, 2026-08-07, and ticked on the
owner's word. The sixth — the day columns in portrait — is still open; see the note under it.*

### WO-2.11 — The pass banner, and cancelling a pass issued by mistake

**What this adds.** A band above the registry grid carrying one card per student who is out of
**this** room: the name, the type, the time they left, `✓ Return`, `✕ Cancel` and a note field.
Cancel takes the pass back and **writes nothing** — the student never left, so there is no trip to
record. Before this, the only way out of a mis-tapped pass was Return, which appends a phantom
zero-minute entry to a log that is append-only by rule and read by Phase 4 as a signal.

- [x] Issuing a pass and cancelling it leaves `passes` **byte-identical** to before the tap, and
      `openPasses` back to its prior length — read out of the document, not off the screen.
- [x] A cancelled pass frees its slot against the per-class cap of three **immediately**: the next
      student goes out with no reload and no repaint in between.
- [x] Cancelling creates no attendance record and changes no attendance mark.
- [x] A pass returned normally still writes exactly one entry. Cancel does not weaken Return.
- [x] A note typed on the card survives the Return and is on the entry in `passes`; a pass with no
      note carries no `note` key at all — the same shape rule a mark cell's note follows.
- [x] A note on a **cancelled** pass is nowhere in the document afterwards — searched across the
      whole serialised year, not just the two pass collections.
- [x] The banner shows one card per open pass **in the class on screen**, disappears entirely when
      that class has nobody out, and stays down next door while this class still has two. Returning
      or cancelling from the **card** updates the row's cell; returning from the **cell** updates the
      card.
- [x] The banner costs the registry no day columns — same column count with two cards up as with
      none, above the grid rather than inside it, and the overflow valve stays shut.
- [x] **`cancelPass()` refuses a pass that has already been returned**, asked both by student and by
      the finished entry's own id. The one exception being carved into the append-only rule does not
      become two. *(The Traps line, as a check.)*

*Desk pass 2026-08-07: `verify-shell.mjs` **344 of 344, 0 skipped**, up from 330 at WO-2.8 —
fourteen new checks, all in the attendance section. Everything is driven through the controls a
teacher touches: the note is typed into the card's own field with a real `input` event, the cancel
is a click on the real `✕ Cancel`, and Return is driven once from the row and once from the card so
both buttons carrying that hook have been pressed. One exception, named in the file: asking
`cancelPass()` to delete a **finished** pass goes through the seam, because a finished pass has no
card and therefore no button — which is the point of the gate. `wo-sweep.mjs` is 11 checks, 10
passed, 0 failed, 1 to review — the standing sensitive-field-name line, at the same 172 mentions
across the same files as before this work order.*

*Seven mutation proofs, run before this was written:*

| Mutation | Result |
|---|---|
| cancel implemented as **Return with `minutes: 0`** — the Traps line's own defect | **4 red**, the first of them reading "the log is DIFFERENT at 3 entr(ies)"; the cancelled note is left in the document and the log stops being byte-identical across the cap check too |
| `cancelPass()` made general enough to delete a **returned** entry | **2 red** — the gate check, which gets the deleted entry handed back to it instead of `null` |
| the banner drawn from `openPassesIn()` instead of `openPassesFor()` | **1 red** — the class next door shows this class's cards |
| `closePass()` stops carrying the note onto the log entry | **2 red** — the note dies on the return, and the entry the gate check reads no longer holds it |
| `notePass()` stores `""` instead of deleting the key | **1 red** — an untouched pass carries a `note` key |
| the banner moved inside `#attendanceGridWrap` | **1 red** — above-the-grid and inside-the-grid are the two halves of that check and it fails on both |
| `✕ Cancel` given `✓ Return`'s filled-green rule | **1 red** — the two controls measure identically on fill, text colour and border |

*All seven were reverted and the run is green on the shipped tree.*

**The 👤 iPad sitting this work order owes.** Neither the harness nor a stylesheet can answer these.

- [x] **Cancel and Return cannot be confused at speed on glass.** They differ three ways on purpose —
      `✓` against `✕`, the word, and filled-green against outline — and the harness measures that the
      three differences are really there. Whether they survive a thumb moving at the speed a class
      walks in is the owner's call and nobody else's. 👤
- [x] The card's Return, Cancel and note field all clear 44px under a thumb, with two cards side by
      side on an 834pt 11″ in portrait. The harness measures them; a thumb is what tells you whether
      Return and Cancel can be hit apart. 👤
- [x] Typing a note on the card while a class walks in: the field is reachable, the software keyboard
      does not cover the card, and issuing another pass mid-sentence does not lose what was typed
      (it is written per keystroke, so what is at risk is the caret, not the words). 👤
- [x] VoiceOver reads a card as the student, the type and the time out, and reads Cancel as an act
      that records nothing. 👤

*Two sittings on the owner's iPad, both 2026-08-07. **The first** passed all four and returned a
finding no line above asks for: the card had been **styled from scratch instead of lifted**. Roll
Call!'s `.pass-card` — dark band, avatar, name over a quiet meta line, the elapsed clock's slot,
then the two buttons — was already tuned by a year of classroom use, and this card had kept only its
shape while re-deriving its palette and its layout. Re-cut against `dashboard.html:319–376`, which
re-opened all four lines: a 👤 line is closed by a human against what shipped, and what shipped was
no longer what she held.*

***The second sitting** ran them again on the re-cut card: everything worked, and what came back was
a layout report rather than a defect — **three open passes drew two rows of buttons in landscape and
three in portrait**, against a desktop layout that was already correct. The whole cause was in
`@media (pointer: coarse)`: the info block was pinned to `flex: 1 1 100%`, which leaves the buttons
nowhere to go but downward, and a Return set to grow then took the rest of the line and put Cancel on
a third row. Fixed by removing the wrap rules rather than by adding any, plus two things that bought
the room back — **the emoji came off the type chip** (the row's three pass buttons need their glyphs
because they lost their words to a 160px column; this chip kept its word, so the glyph was saying it
twice) and the two buttons went to equal, tighter padding. The 10px between Return and Cancel did not
give and is now asserted.*

*The four lines above are ticked against the card as it stands after that tweak. The tweak is padding,
a chip's emoji and a wrap rule — it moves nothing line 3 asks about, and line 4 is untouched by
construction, because the emoji it removed was already `aria-hidden`.*

*What the harness now holds, so this cannot come back quietly: `the pass card is ONE ROW with three
open` at 768×1024 and 1024×768 with touch on, measuring the flex row's height against its tallest
child; the two buttons' 44px and their 10px gap at the same three-card cap; and the chip asserted to
be a word with no emoji. Restoring the two wrap rules turns the first red at **139px against a 47px
tallest child** — three rows, which is exactly what was reported.*

*One thing that changed and passed rather than being fixed, recorded because it is a real departure.*
At rest on a touch device, **Cancel is no longer red** — it was red text on white, and Roll Call!'s
card makes it `rgba(255,255,255,0.7)` in a faint white outline, with the red arriving only on
`:hover`, which does not exist under a thumb. Two of the three differences are now carried by fill
and glyph rather than hue. Confirmed readable on glass in the second sitting. If it ever stops being,
the fix is a red at rest in the coarse block — a deliberate departure from the predecessor, and one
that would be commented as one.

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
