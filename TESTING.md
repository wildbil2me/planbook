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

**⊘ marks a check that was superseded before it was ever run**, and it is deliberately not a
checkbox. It appears only inside a struck-through section kept as a record. A superseded check must
never be ticked — it did not pass — but leaving it as `- [ ]` is equally wrong, because it reads as
work outstanding against a screen that no longer exists and it holds a ship gate open forever. Every
⊘ names the live check that replaced it, so the coverage is followed rather than assumed. If no live
check can be named, the box is **not** superseded and stays open.

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

### WO-1.15 — the restore compare cannot see what it is about to delete

**What this changes, in one sentence:** the restore confirm now counts recorded meetings, attendance
marks, assignments and score cells on both sides, and says in words what replacing one document with
the other would cost — when it would cost anything.

**The defect it closes is silent, which is why it is worth a section.** `describe()` returned six
things — `year`, `classes`, `students`, `saved`, `rev`, `schemaVersion` — so two documents with the
same five classes and the same twenty-five students drew an **identical** panel whether one held a
term of marks and scores and the other held none. That is exactly the pair
[`plans/work-orders/gates.md`](plans/work-orders/gates.md) § *The iPad stays in the rotation* exists to
keep apart: restore is a wholesale replace, so a backup taken off the test iPad and opened on the
teaching laptop replaced the real ledger with test data, silently, reporting success, under a button
that read *"Replace 2026-2027"*. The year label is still the primary guard and WO-1.16 is still the
primary fix; this is defence in depth for the case where both devices hold the same label, which is
the case today.

*Evidence for the Acceptance list in
[`plans/work-orders/phase-1-shell-store-roster.md`](plans/work-orders/phase-1-shell-store-roster.md)
§ WO-1.15 lives there, beside each line. What is here is the desk pass, the mutation runs, and the one
line still owed to a human.*

**Desk pass, 2026-08-12.** `node tools/verify-shell.mjs` at **636 checks · 636 passed · 0 failed · 0
skipped**, 15,750 lines, 206s, exit 0 — up from 628 of 628, eight checks added inside the existing
`backup & restore` section. `node tools/wo-sweep.mjs` at **17 checks · 15 passed · 0 failed · 2 to
review**, exit 0; both REVIEWs are the standing ones (the sensitive-field-name sweep at 188 mentions,
unchanged file list, and `src/detail.js:349`). `sw.js`'s `CACHE` is bumped to **`planbook-shell-v47`**,
because three files in `SHELL` changed.

**The five mutations, all reverted.** Each was run against the whole harness, not just this section,
so the number beside it is *everything* that noticed:

| Mutation | Result |
|---|---|
| `ledgerCountsIn()` counts every attendance record as a meeting (the naive `doc.attendance.length`) | **4 red.** The stored side reads `4 recorded meetings`, the loss sentence says `loses 4 recorded meetings`, the difference check reads `3` where the fixture demands `2`, and the no-warning check catches the richer file at `5 recorded meetings` |
| `describe()` uses `count(doc.scores)` instead of `countScores()` — the array counter over an object | **4 red**, each printing `0 scores` on a document holding three. This is the defect the work order's brief predicted by name |
| `wouldBeLost()` fires on any difference (`!==`) instead of on an excess (`>`) | **1 red**, and it is the Traps line: *"a file at 4/4/2/4 over a device at 3/3/2/3: warning SHOWN"* |
| the loss sentence prints the count on this device instead of the excess | **1 red**, the difference check: *"loses 3 recorded meetings, 3 attendance marks, 2 assignments and 3 scores"* where the file already holds 1/1/1/1 |
| every replace is treated as dangerous (the warning fires whenever a document is stored) | **1 red**, the Traps line again and both halves of it this time: *"own backup (3/3/2/3 both sides): warning SHOWN"* |

*Three of those five turn exactly one check red, which is the isolation worth having. The other two
turn four red each and it is the same four every time — the counter feeds the panel, the sentence and
the difference, so a counter that is wrong is wrong in three places at once.*

**One thing the mutations say that no argument would have.** Nothing else in the harness noticed any
of the five. 628 checks were green over a build whose restore confirm could not see a term of marks,
and they stayed green through every mutation above except the eight added here — which is the same
finding WO-1.14 recorded a week earlier in a different register: a check can only see what it was
pointed at.

**The 👤 line WO-1.15 owes**, on the installed iPad, at the confirm dialog with a real file:

- [x] The compare panel still **fits** with four counts a side rather than two — at 390px the two
      cards stack (`.restore-side` is `flex: 1 1 200px`), so the question is whether the dialog scrolls
      to reach the button rather than whether the numbers wrap. 👤
- [x] The **Replace** button still measures 44px and is still reachable without hunting, with the loss
      paragraph above it pushing it down. 👤
- [x] The loss paragraph reads as a **stop** rather than as decoration — same red as the class-delete
      facts, and legible at arm's length at the 13px the coarse block gives it. 👤
- [x] Restore a file that holds *less* than the device does and read the sentence cold, without
      knowing what it was going to say. Does it name the right thing to check? 👤

*A desk harness can measure the box and cannot answer any of those four: headless Chromium has no
thumb, no safe-area inset, and no teacher in a hurry. All four confirmed by the owner on the
installed iPad, 2026-08-12, in one sitting against the confirm dialog with a real backup file.*

---

### WO-1.17 — the backup nag cannot see a year whose only content is grades

**What this changes, in one sentence:** the backup nag now counts score cells and both hall-pass
collections when it decides whether there is anything to lose, and the list it counts is reconciled
against `docs/data-model.md` by the sweep instead of by somebody remembering.

**The defect it closes had never been seen, and could not have been.** `hasSomethingToLose()` summed
seven collections and left out `scores`, `passes` and `openPasses` — but a score cell needs an
assignment to hang on, so `count(doc.assignments)` fired first and the strip appeared anyway. The
omission is invisible until a document can hold scores with no assignment (a column kept after its
assignment is deleted, an import, a partial restore), and then the one strip standing between a
teacher and the iOS eviction in `CLAUDE.md` goes quiet about a term of grades. `openPasses` and
`passes` were never masked at all: a document holding only hall passes nagged about nothing.

*Evidence for the Acceptance list in
[`plans/work-orders/phase-1-shell-store-roster.md`](plans/work-orders/phase-1-shell-store-roster.md)
§ WO-1.17 lives there, beside each line. What is here is the desk pass and the red run that makes the
new checks evidence.*

**Desk pass, 2026-08-15.** `node tools/verify-shell.mjs` at **766 checks · 766 passed · 0 failed · 0
skipped**, 20,362 lines, 26.6 lines per check, 246s, exit 0 — up from 762 of 762, four checks added
in a new block at the foot of the existing `backup & restore` section (a fifth call site is a
fixture-guard failure arm that never fires on a green run). `node tools/wo-sweep.mjs` at **20 checks ·
18 passed · 0 failed · 2 to review**, exit 0; both REVIEWs are the standing ones (the
sensitive-field-name sweep at 297 mentions, and the due-date/`late`-`missing` list). `sw.js`'s `CACHE`
is bumped to **`planbook-shell-v64`**, because `src/backup.js` is in `SHELL`.

**The red run is the point, and it was run first.** The four new checks went against the *unfixed*
`hasSomethingToLose()` on the same tree before the fix was restored:

| Fixture — a `newYearDocument()` with exactly one collection filled | Unfixed | Fixed |
|---|---|---|
| one score column, two cells, **no assignment** | **red** — nag down | green — nag up |
| one open hall pass (`openPasses`) | **red** — nag down | green — nag up |
| one finished hall pass (`passes`) | **red** — nag down | green — nag up |
| nothing at all (12 seeded letter bands, no more) | green — nag down | green — nag down |

`766 checks · 764 passed · 2 failed` on the unfixed tree, the two failures being the two content
checks. *A check written against any ordinary document — one with a class, a roster or an assignment
in it — passes on both trees and proves nothing, which is why every fixture here holds one collection
and no other.* The pass/fail split also does the second job the work order asks for: the brand-new
sample is green on **both** trees, so the day-one rule is one the fix preserved rather than one
nothing ever tested.

**The sweep's new § 14 was mutated too, because a reconciliation that cannot go red is decoration.**
Three mutations, all reverted, each one run against the whole sweep:

| Mutation | Result |
|---|---|
| a `"rubrics"` collection added to the sketch in `docs/data-model.md` and classified nowhere | **red** — *"rubrics — documented in docs/data-model.md and in neither list in src/backup.js … the nag is silent about it until you do"*. This is the work order's own defect, replayed |
| `scores` paired with `count` instead of `countScores` — the Traps line, as an edit | **red** — *"scores is documented as an object and paired with count() — count() answers 0 for anything that is not an array, so a map counted with it reads as an empty year"* |
| `templates` misspelled `template` in `CONTENT_COLLECTIONS` | **red twice** — once for the documented key nothing classifies, once for *"a misspelled key, which counts 0 forever and throws nothing"*. The second half is why this diff runs both ways where § 12's runs one |

**Beyond that, no mutation table, which is a smaller claim than WO-1.15's.** For the app fix the
unfixed build *is* the mutation, and it is the real one rather than an invented one. What was not asked and is worth
recording: nothing else in the harness noticed the difference between the two trees — 762 checks were
green over a build whose nag could not see a term of grades, exactly as WO-1.15 recorded a week
earlier. A check can only see what it was pointed at.

**WO-1.17 owes no 👤 line, and that is a claim rather than an omission.** Nothing on the screen
changed: the strip's markup, wording, styling, touch targets and the moments it is evaluated are all
untouched (the work order puts each of those out of scope). What changed is the predicate that
decides whether it is drawn, and a predicate is exactly what a desk harness settles. The two 👤 lines
this strip has ever owed are about how it *reads* on the device — *"the backup panel's amber line is
legible on an installed iPad and names the year"* (closed 2026-08-04) and *"confirm the backup nag is
down for every year, not just the one on screen"* (WO-1.11) — and neither is re-opened by a change to
what the predicate counts.

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
- ⊘ Taking attendance for a class of 25 with two absences takes under 15 seconds on an iPad. 👤
      *(Superseded. Duplicated by the stopwatch line below, which is ticked, and re-run against the
      shipping grid at § WO-2.1 — Attendance registry → "Twenty-five students, two absences, under
      15 seconds".)*
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
- ⊘ The three states are readable **from where you stand** — dropped vs not-taken-yet, at arm's
      length, in a lit classroom, without leaning in to read the words. 👤
      *(Superseded → § WO-2.1 — Attendance registry, "Unlock a past column and look at the screen
      from where you stand at the front of the room", which asks it of the shipping grid.)*
- ⊘ Mark two students, then force-quit the app mid-period and relaunch. Both marks are still
      there. *(There is no submit step by design; this is what makes that safe rather than
      reckless.)* 👤 *(Superseded → § WO-2.1 — Attendance registry, same words, run on the grid; the
      hall-pass half is § WO-2.8's force-quit-from-the-app-switcher line.)*
- ⊘ Every control on the marking screen takes a thumb: the five letters on a row, "Everyone's
      here", "Didn't meet", and the card's own state line. Tap the letters at the edges, not the
      middle — that is where the WO-1.2 defect hid. 👤 *(Superseded → § WO-2.1 — Attendance
      registry, "Every control takes a thumb". The controls this line names are gone: the grid has
      no row of five letters and no "Everyone's here".)*
- ⊘ The row does not spill sideways in portrait, and the list scrolls as one surface (no
      scroller-inside-a-scroller stealing the flick). 👤 *(Superseded by WO-2.12, which removed the
      condition rather than passing the test: **portrait now draws one day column**, so there is no
      multi-column row to spill. The rotation and scroll half is § WO-2.12's "Turn the iPad from
      portrait to landscape mid-class", which asserts the scroll position survives the turn.)*
- ⊘ VoiceOver reads a mark button as the word and the student's name, not as a bare letter. 👤
      *(Superseded → § WO-2.1 — Attendance registry, "VoiceOver reads a cell as the student's name,
      the day and the mark".)*
- [x] Offline launch with the network off: `attendance.js` and `attendance.css` are served from the
      precache and the screen still marks. 👤 *(Owner, 2026-08-06. Same physical test as the
      duplicate of this line in the other work order's list.)*

### WO-2.1 — Attendance registry: students × recent days

**This is the section that governs.** The one above records commit `11f0780` and is kept because
the ticks in it were real; nothing in it is a claim about the current tree. The screen shipping now
is a grid — students down, the last six weekdays across, tap a cell to cycle — and its twelve
acceptance lines are the ones in the rewritten work order.

- [x] A mark lands and survives a reload.
- [x] **Six days of columns in LANDSCAPE, today's column alone in PORTRAIT, for a class of 26, with
      nothing scrolling sideways in either.** 👤 **Rewritten by WO-2.12 on 2026-08-07 and closed by
      the owner the same day, on her own iPad, against the twice-re-cut build. § WO-2.12 below is
      where the sitting is listed.**
      *The line it replaces — "six days of columns … in the orientation the owner actually holds
      it" — was ticked on her own device on 2026-08-06 and is kept in the work order rather than
      erased. WO-2.8's `Passes` column took portrait to four columns and to five on her 834pt 11″;
      asked to choose four, five or six, she answered that portrait should show today. So the goal
      changed, and a line whose goal changed is replaced rather than re-ticked. The half about
      sideways scrolling was always true and is measured in both orientations.*
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

- [x] **Six columns and twenty-six names in landscape; today's column alone in portrait.** No
      sideways swipe either way, and the leftmost column is today in both. This is acceptance line
      2, **rewritten by WO-2.12 on 2026-08-07** — the same rewrite as the acceptance line above, and
      the same reason: six-in-portrait stopped being the goal when the owner answered the question
      § WO-2.8 put to her. The tick from 2026-08-06 was not carried over, because what she closed
      then is not what the screen does now; **she closed the rewritten line on 2026-08-07**, which is
      what this tick records. § WO-2.12's own 👤 list is where it was run. 👤
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

#### The day columns in portrait — the owner's call, and it is ANSWERED

> **Settled 2026-08-07 and built as WO-2.12.** The answer was none of the three options tabulated
> below: **portrait shows today only, landscape keeps six.** Everything from here to the end of this
> subsection is left standing as the question that was asked and the arithmetic it was asked with —
> it is why the name cap moved 256 → 232 and then back to 256 — but the table of three options is
> no longer a live choice. § WO-2.12 is where the answer is tested.

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

### WO-2.12 — Portrait shows today, landscape shows the week

**What this changes.** In **portrait** the registry draws **one day column — today's**. In
**landscape** it draws six, exactly as before. The orientation is the signal and nothing else is:
there is no toggle, and a laptop window dragged narrow is still landscape and still shows its week.
Turning the iPad repaints without a reload.

**Why, in one line the owner said herself:** in portrait this screen is held at the classroom door to
mark today; the six-day window is a thing you read at a desk. It replaces the width budget that had
been taking columns away since WO-2.8 — four at 768pt, five on her 834pt 11″ — and it is a better
answer than any of the three that budget could have given, because the name column stops competing
for pixels at all.

**The cost, stated rather than discovered:** backfilling a past day needs a day column, so in
portrait correcting last Tuesday means turning the iPad. Paging still works there — "Earlier" walks
back one weekday per tap instead of six — but the rotation is the route. It is written down beside
WO-2.1's unlock deliverable and again at `editPastDay()` in `src/attendance.js`.

- [x] Portrait draws exactly **one** day column, it is **today's**, and the Passes column is still
      there — measured on the owner's own 834×1112 with a coarse pointer.
- [x] Landscape still draws six, **on the same device, with no reload**. *(The emulated 11″ is turned
      from 834×1112 to 1112×834 and the grid is read without being repainted by hand — so what is
      measured is the trigger, not the arithmetic. A real thumb on real glass is still owed below.)*
- [x] **And it goes on turning — four more flips, no reload, each drawing the count its orientation
      asks for.** Added 2026-08-07 after the shipped build failed on the owner's own iPad: one turn
      worked and the next did not. Everything else in this list turns the device once, and a trigger
      that fires once and dies passes all of it. See *the turn that only worked once* below.
- [x] The mark made in portrait is still on the cell **and still in the document** after the turn.
      *(The desk half of the "rotating mid-class loses nothing" line — see the 👤 list for the half
      a desk cannot answer.)*
- [x] The grid fits its wrap in **both** orientations, so WO-2.10's `overflow-x` valve stays shut.
- [x] A **900px laptop window** is landscape and keeps five day columns; a 1280px one keeps six.
      Neither falls to one.
- [x] The longest name this harness can write — "Delacroix-Nguyen, Xiomara" — is drawn **in full**
      in portrait, with the ellipsis never engaging.
- [x] **Turning the iPad upright with a past column unlocked puts the screen back on today.** Not an
      acceptance line — it is the defect this work order opens if the repaint only counts columns,
      and it was found by asking what module state a rotation walks past. See below.

*Desk pass 2026-08-07: `verify-shell.mjs` **359 of 359, 0 skipped**, up from 349 on the tree this
work order arrived on — ten new checks, all in a section of their own, plus one existing check in
the WO-2.10 note-panel block that changed sides (see `tools/README.md`). `wo-sweep.mjs` is 11 checks,
10 passed, 0 failed, 1 to review — the standing sensitive-field-name line, at the same 172 mentions
across the same files as before this work order.*

*Re-cut the same day, and the desk pass is now **361 of 361, 0 skipped** — two more checks, both in
the same section, and two existing ones that stopped being hand-rendered. See below.*

*Re-cut a second time, on the owner's second report the same day: **366 of 366, 0 skipped**. Five more
checks, for paging across a turn. See "Paging across a turn" below.*

#### The turn that only worked once

**Reported by the owner on 2026-08-07, on her own iPad, hours after this shipped.** In her words: the
first turn dropped the grid to one day, the turn back to landscape *stayed* at one day; a reload
restored six; and then turning to portrait did nothing at all. Inconsistent, and inconsistent in the
way that matters — the screen was sometimes right and never dependably so.

**Nothing was wrong with the arithmetic, and nothing was wrong with the harness's model of it.** The
count is correct at every size, which is why 359 checks were green over a build that failed at the
classroom door. What was wrong was the trigger, and it was wrong in two WebKit-specific ways that a
Chrome harness cannot produce:

- **A `MediaQueryList` referenced by nothing can be garbage-collected, and its listener goes with
  it.** The query was a `const` inside the registration block and nothing held it afterwards. "Worked
  once, then never again, timing unpredictable" is the exact signature. The reference is module-scoped
  now (`mediaWatch`), it looks unused, and it must stay.
- **iOS reports `innerWidth`/`innerHeight` from before the turn** while the change event is being
  delivered. `dayColumnCount()` then measures the orientation the device just left and repaints the
  count already on screen — a real repaint that looks like no repaint at all.

**The fix listens to everything and repaints almost never.** The media query, `resize` and the
deprecated `orientationchange` all funnel into one handler that looks **three times** — now, next
frame, and once more after the rotation animation settles at 400ms. The original argument against
`resize` was that it fires fifty times across a window drag; that is answered by a guard rather than
by a narrower trigger. `syncDayColumns()` compares the count it *would* draw against the count
actually on screen and returns without touching the DOM when they match, so a drag repaints on the
few widths where the answer changes and does nothing on the rest. A duplicate signal costs one
integer compare, which is what makes listening to all three safe.

**A side effect worth knowing:** a laptop window dragged across a budget boundary now redraws the
grid, where before it needed a reload. Nobody asked for that; it falls out of the same guard, and it
is the reason the two narrow-window checks no longer render by hand.

*Two mutation proofs on the re-cut:*

| Mutation | Result |
|---|---|
| the handler made one-shot — fires once, then returns forever, which is what a collected listener looks like | **6 red**, the four-flip check among them, and the single fire is spent before the first read |
| `resize` and `orientationchange` removed, leaving only the media query (the shipped build's trigger) | **1 red** — the 1280px window, which is landscape → landscape and fires no orientation change |

*Both were reverted and the run is green at 361.*

**What this still cannot close.** Neither cause is reproducible in Chrome over CDP, so both checks are
checks on the **symptom**. The 👤 list below is the only thing that closes the real one, and it now
wants **several** turns rather than one.

#### Paging across a turn — "I clicked Earlier three times and got the 4th"

**Reported by the owner 2026-08-07**, on the fixed build, and it is a second defect that the rotation
fix uncovered rather than caused: page back three windows in landscape, turn to portrait, and the
screen showed **8/4** instead of today. Two things were wrong behind one symptom.

**The position was counted in windows.** `dayColumns()` sliced at `offset * count`, so the number
standing for *where the teacher is* got multiplied by a number that changes under her: three taps is
eighteen weekdays back at six columns and three weekdays back at one. It is counted in **weekdays**
now, and the *step* is the window — `pageDays()` adds `count` rather than 1 — so "two taps is two
weeks back" is unchanged while the position is in a unit that a turn cannot rescale. This also fixes
a quieter version with no rotation in it: a laptop window dragged from six columns to five used to
slide the teacher from twelve weekdays back to ten.

**And portrait should not have a position at all** — the owner's rule, stated plainly: *in portrait we
only want to see TODAY*. `pageDaysBack` is pinned to 0 in `visibleColumns()`, which every paint goes
through. Enforced at the paint and not on the turn, because a turn is only one of the ways into an
upright screen that is paged away — a laptop window dragged tall, an iPad Split View pane, a class
opened while already upright, a view restored at boot. Fixing it on the turn would have closed the
route she reported and left the other four.

**The page controls stay on screen in portrait, disabled, and say why.** That is this strip's own
established answer — `Later ▶` has sat there greyed at today since WO-2.1 rather than disappearing —
and a control that vanishes when you rotate is a control you go hunting for. The tooltip reads *"Portrait
shows today. Turn the iPad to read the week or to correct a past day."*, which is the first time the
backfill route appears anywhere a teacher can see it. `Today` is **not** forced off: it is also the way
out of an unlocked past column, and that state has to stay answerable.

**Landscape comes back on the week ending today** rather than where you were before you turned. That
falls out of the pin rather than being a separate rule, and it is the honest one — the alternative is
remembering a paged position across an orientation that is not allowed to have one.

- [x] Three taps of Earlier in landscape walk a whole window at a time — six columns, today not among
      them (18 weekdays back, measured at 2026-07-14).
- [x] **Turning to portrait while paged three windows back shows today.** The reported symptom, and
      the old build read 8/4 here.
- [x] The page controls are disabled in portrait rather than gone, and the tooltip names the route out.
- [x] Turning back to landscape lands on the week ending today.
- [x] **Dragging a laptop window from six columns to five keeps the leftmost date** — fewer days
      shown, teacher not moved. No rotation involved; this is the anchor on its own.

*Two mutation proofs:*

| Mutation | Result |
|---|---|
| the portrait pin removed from `visibleColumns()` | **3 red** — portrait draws 8/4 while paged, the controls come back live, and landscape returns to the stale page |
| the window model restored (`offset * count`, stepping by 1) | **1 red** — and only one, because the portrait pin masks the rotation half. The laptop-drag check is what catches this on its own, which is exactly why it is written without a rotation in it |

*Both were reverted and the run is green at 366.*

*The one thing this work order fixed that nothing asked for.* `editingPast` is module state and
survives a repaint, so unlocking Tuesday in landscape and turning the iPad upright left `editDate()`
answering Tuesday with **no Tuesday on screen**: every cell in today's column came back read-only
and the banner above them named a day that was not there. A teacher at the door could not mark
anybody, and nothing about it would have looked like a rotation bug. `pageDays()` already carries the
rule — *the strip that says which day you are editing is only honest while that day is on screen* —
and a turn is simply the second way that day can leave, so it takes the same exit through
`lockPastDay()`.

*The rotation is **not simulated**. Nothing in that section calls `renderAttendance()` between the
two orientations: the device metrics change, `(orientation: portrait)` flips, and the grid either
redraws itself or it does not. Every other section of the harness renders after each resize, which is
exactly why a build with no listener in it could have passed everything before this.*

*Five mutation proofs, run before this was written:*

| Mutation | Result |
|---|---|
| the portrait branch removed from `dayColumnCount()`, leaving the width budget | **3 red** — the 834pt portrait grid comes back at four columns |
| portrait implemented as a WIDTH rule (`w < 1024 → 1`) instead of an orientation one | **1 red** — the 900px laptop window falls to one column, which is acceptance line 6 exactly |
| `MIN_DAY_COLS` applied to the portrait answer (`Math.max(3, 1)`) — the floor swallowing its own exception | **3 red** — portrait draws three |
| the `(orientation: portrait)` listener removed | **3 red**, the "no reload" one among them — the turn to landscape leaves three stale columns on screen |
| the turn repainting without locking a past column that has left the screen | **1 red** — after the turn the banner still says "not today" and today's cell is not a button |

*All five were reverted and the run is green on the shipped tree.*

*One mutation that did **not** go red, recorded because it changes what the third deliverable
claims.* Putting the coarse name cap back to **232px** leaves every check green: with one day
column the name column takes its spare either way and the 279px name is drawn in full at 232 and at
256 alike. The cap "releases the floor" rather than truncating — which is what the rule's own
comment has always said, and this is the first time it has been measured from both sides. So
**256 is a revisit, not a fix**: it restores the value WO-2.8's pressure took away, it is the top of
the 200-to-256 band and the one that truncates least where the column *is* squeezed, and nothing on
a full-screen iPad depends on it. `NAME_COL_COARSE_PX` in `src/attendance.js` moved with it.

**The 👤 iPad sitting this work order owes.** Neither the harness nor a stylesheet can answer these,
and the first two are acceptance lines rather than extras.

- [x] **Turn the iPad from portrait to landscape mid-class.** Six columns come back with no reload
      and no tap, the scroll position down a 26-name list is not thrown away, and a mark made a
      second earlier is still where you put it. 👤 *(Closed by the owner 2026-08-07, on the re-cut
      build — the first build failed this on her device and is what the re-cut answers.)*
- [x] **Then keep turning it — at least five or six times, both ways, and not in a hurry.** This is
      the line the first build failed and the one turn above did not catch: it worked once and then
      stopped, and a single flip looks identical either way. Leave the screen sitting for a minute
      between two of the turns, since the failure was a listener being collected while the page was
      idle. Every turn draws the count its orientation asks for, or this is not fixed. 👤 *(Closed by
      the owner 2026-08-07 — "everything's working good on the iPad", against the build that added
      `resize` and `orientationchange` to the trigger.)*
- [x] **The longest name on your real roster is readable in portrait, whole, with no ellipsis** —
      at the door, at arm's length, while the room fills. 👤 *(Closed by the owner 2026-08-07.)*
- [x] **One column is enough at the door.** Take a full period in portrait without turning the iPad
      and confirm nothing you reach for was on one of the five columns that are gone. 👤 *(Closed by
      the owner 2026-08-07, ahead of the school year rather than across a live period — she was told
      that was what this line asked for and closed it anyway. **If one column turns out not to be
      enough once classes start, this is the line to reopen**, and the fix is a decision about
      portrait rather than a defect.)*
- [x] **Backfilling still works, and the rotation is not a surprise.** Correct last Tuesday from
      portrait: turn to landscape, unlock the column, mark, turn back. 👤 *(Closed by the owner
      2026-08-07, on the build where the unlock clears on a turn and the pager tooltip names the
      route.)*
- [x] **Page back three windows in landscape, then turn to portrait: you are on today.** The exact
      thing you reported. Turn back to landscape and you are on the week ending today, not where you
      left off — that is deliberate, and the sitting is where to say if it should be otherwise. 👤
      *(Closed by the owner 2026-08-07, on the anchored build. She did not ask for the return-to-today
      behaviour to change, so it stands as built.)*
- [x] **In portrait, Earlier and Later are greyed out**, and holding one long enough to see the
      tooltip says to turn the iPad. Confirm that reads as a rule rather than as a broken button. 👤
      *(Closed by the owner 2026-08-07 — it reads as a rule.)*
- [x] **Six columns and twenty-six names in landscape**, no sideways swipe, leftmost column today —
      which is WO-2.1's acceptance line 2 as rewritten, and the line she closes to close that one. 👤
      *(Closed by the owner 2026-08-07. **This closes WO-2.1's last open line as well as this one.**)*

---

### WO-2.3 — Days off & pre-drops

**What this adds.** A panel — **Days off** on the class-grid header, and the 📅 in any covered
column head — where a holiday, a break or a planned drop is typed in once, ahead of time. Two kinds:
**No school**, which covers every class, and **a planned drop**, which names the classes an assembly
is stopping from meeting. A date, an optional second date, and a title. That is the whole form.

**The one thing to hold on to while testing it.** *Nothing typed on that panel is written into
attendance.* The registry **reads** the calendar when it paints; it never copies an exception onto a
record. That is why removing a holiday puts every day it covered straight back to "not taken yet" —
there was never a copy to go and find. If a future session is tempted to "apply" an event to
records, `plans/rotating-schedule.md` and `src/calendar.js`'s header are the two places that argue
why not, and the section of `verify-shell.mjs` below is what would catch it.

**The precedence rule, which is what every check here is really about.** A class **met** if it has an
attendance record with no exception — asked first, before the calendar is consulted at all.
Otherwise it did not meet, whether from its own record or from a covering event. So a retroactive
snow day laid over a week that was really taught **cannot** void a mark; the app warns, and leaves
the record exactly where it is.

**The fourth word.** A covered column says **"No school"** or **"Planned drop"** rather than
"Didn't meet", and it is drawn in the dropped column's quiet grey made **solid** instead of dashed.
The two mean the same thing about the class and different things about where the undo lives, and the
undo is what a teacher is reading that chip to find.

- [x] A `no-school` range across a week shows **every class** as not-meeting on **every date in it**,
      as one event rather than one per day — and the weekday just outside the range is untouched.
- [x] Deleting that event restores all those days to **"not taken yet"**, with `doc.attendance`
      byte-identical to what it was before the event was ever added.
- [x] A **future** `dropped` event naming two classes affects only those two; the other four are
      still "not taken yet" on that date. *(Asked of `stateOf()`, which is what this line is about.
      When it was written the registry also had no column after today; since 2026-08-08 it has, and
      the screen's own answer about a future day is measured in the punch list below.)*
- [x] Adding a **retroactive snow day** over a date that already has recorded attendance **warns**
      — a dialog naming every period that keeps its marks — and **does not void the record**. After
      confirming, every period that was taught still reads "taken" and every mark is still on it.
- [x] **No attendance record is ever created by authoring an event.** Asserted after every write,
      cancel and removal in the section, against `doc.attendance` serialised byte for byte.
- [x] Backing out of that warning writes **nothing at all** — no event, no record.
- [x] A planned drop that names **no class** is refused with a sentence, rather than quietly written
      as a school-wide one. *(Empty `classIds` **is** school-wide in the data model, which is exactly
      why the form will not write one under the other kind.)*
- [x] The covered week draws as not-meeting on the grid: the fourth word in every column head, a
      dash in every cell under it, and the 📅 door where the 🚫 would be.
- [x] A covered column and a dropped column, **side by side on one screen**, are drawn as two
      different things — different word, different fill, solid against dashed.
- [x] Every control in the days-off panel measures **≥44px** on an emulated coarse pointer, the two
      date fields and the class picker included.

*Desk pass 2026-08-07: `verify-shell.mjs` **379 of 379, 0 skipped**, up from 366 on the tree this
work order arrived on — thirteen new checks, twelve in a block at the end of the attendance section
and one in the coarse sweep. `wo-sweep.mjs` is 11 checks, 10 passed, 0 failed, 1 to review — the
standing sensitive-field-name line, at the same 172 mentions across the same files as before this
work order.*

*Six mutation proofs, all reverted:*

| Mutation | Result |
|---|---|
| **`commit()` also copies the event onto attendance records** — the Traps line's own failure | **10 red**, which is every check in the block but two. Nothing *visible* changes: the columns still go grey and the cards still say "No school". What gives it away is `doc.attendance` no longer matching itself |
| `stateOf()` stops consulting the calendar | **3 red** — the range, the grid, and the two-greys comparison |
| `stateOf()` consults the calendar **before** the record — the history rule inverted | **1 red**, and it is the snow-day line: four taught periods read "covered" |
| `coversDate()` returns `true` for any date — the range ignored | **1 red**, caught by the weekday just outside the range and by nothing else |
| the covered column painted in the dropped palette | **1 red** — the side-by-side comparison, which is the only check that can see it |
| the class picker stops wearing `.toggle-btn`, losing its 44px floor | **1 red** in the coarse sweep (plus four in the block, because the fixture helper finds chosen classes by that class) |

**One design consequence, stated rather than discovered.** A covered day is **read-only**: its cells
are inert and it offers no "Everyone's here". So **a class that genuinely met on a school-wide day
off cannot be recorded from the registry** — the escape hatch is the calendar, where the range can be
narrowed or the kind changed to a drop that names classes. That was chosen over leaving the cells
live, which would let one mis-tap invent a meeting on Thanksgiving. If it bites in a real term, the
fix is a decision about the registry rather than a defect here.

**The 👤 iPad sitting this work order owes.** Neither of these is an acceptance line — both were
closed at the desk — but both are judgements a headless browser cannot make, and both are cheap.
**Sat 2026-08-08, on the owner's iPad. All three pass.**

- [x] **The fourth column reads as its own state from across the room.** Put a covered week and a
      dropped day on screen together and confirm, at classroom distance, that "No school" and
      "Didn't meet" read as two different answers rather than as one grey smudge. The washes are two
      steps apart on a laptop and further apart under a coarse pointer; only eyes settle whether
      that is enough. 👤
- [x] **The two date fields are usable with a thumb, and clearing one does not trap the picker.**
      iPadOS keeps the date popover's own selection separate from the input's value — the trap
      `src/classes.js` paid for at WO-1.6. Add three days off in a row, some of them adjacent dates,
      and confirm nothing has to be tapped twice. 👤 *(This line used to end "…which is why this form
      clears the title after an add and deliberately leaves the dates alone." The sitting passed it
      and then asked for the opposite — see punch-list item 3 below. The trap is still real and is
      still answered; what changed is that it is answered by rebuilding the field rather than by
      leaving a stale date in it.)*
- [x] **Add a real break from the real school calendar**, then open a class and confirm the week
      reads the way you expect it to when you come back to it in November. 👤

#### What the sitting sent back — the 2026-08-08 punch list

Every acceptance line above passed on the iPad and five things were still wrong. That is the point
of the sitting, and it is worth writing down which kinds of thing a headless run cannot reach: two
were layout under a real coarse pointer, one was a software keyboard, one was a design rule that
only looks wrong once a thumb is doing the work, and one was a hole nobody had noticed because the
feature that opened it had shipped the day before.

| # | What the classroom found | What it turned out to be |
|---|---|---|
| 1 | "Days off" spilled through its own border | `.class-action-btn`'s coarse `min-width: 44px` **replaces** the `min-width: auto` a flex item gets for free, so a `nowrap` button was free to shrink under its own label. 44px checks cannot see it — the button was 44px and wrong |
| 2 | Future days off could be set and not looked at | The registry's window ended at today. Now it pages forward as far as the calendar reaches |
| 3 | Keeping the dates after an add was awkward | They clear, and the iPadOS picker trap is answered by rebuilding the field rather than by avoiding the clear. `To` now follows `From` as well |
| 4 | Focus returned to the title field, so the keyboard covered the list | Focus goes to the submit button — where the thumb is, and no keyboard |
| 5 | The way to the calendar was on the wrong screen | The 📅 door is now in the class screen's action row in every state, held at the far end away from the three controls that write |

- [x] The **Days off** button is not narrower than its own label under a coarse pointer, and neither
      is anything else in that header row.
- [x] A day off set for next week can be **paged forward to and read** on the registry, and the
      column shows the event's word with the 📅 door on it.
- [x] An ordinary day ahead of today says **"Ahead"** rather than "Not taken", carries no unlock, and
      its cells are inert — *not* the `?` in alarm amber that means "you left a hole here".
- [x] Paging forward **stops at the last thing on the calendar** and says so; with nothing scheduled
      it stops at today, exactly as it did before.
- [x] Reading a week that has not happened yet **writes nothing** — `doc.attendance` byte-identical
      across the whole forward walk. The columns opened up; the writer did not.
- [x] After an add the **whole form is empty** and focus is on a button, not in a text field.
- [x] Picking a start date **carries the end date with it**, and never overwrites an end date already
      set later than the new start.
- [x] The 📅 door is on the class screen's action row on an ordinary day, **last** in the row.
- [x] **Portrait still does not page**, with a day off ahead on the calendar. *(Regression, reported
      and fixed 2026-08-08: `Later` had one reason to be disabled — "you are at the forward end" —
      and that used to mean "you are on today", which portrait always is. Once the forward end could
      be next week, portrait's pinned position stopped being it and the button went live on the one
      screen that refuses to page. It now has both reasons, and anything added to that strip needs
      the same audit.)*
- [x] **The six fixes, back on the iPad.** Everything above is measured; what is not is whether the
      forward columns read as "ahead" rather than as broken, and whether three days off in a row now
      go in without a fight. Same sitting shape as the one above. 👤 *(Sat 2026-08-08, second
      sitting the same day. All eight checks pass — the button fits, a date can be re-picked
      immediately after the one before it, the keyboard stays down, the 📅 is far enough from
      "Didn't meet" to aim at, a forward column reads as ahead rather than as broken, the forward
      stop lands on the last thing on the calendar, and portrait greys both page controls. **This
      was the last line WO-2.3 owed.**)*

*Desk pass 2026-08-08 (punch list): `verify-shell.mjs` **389 of 389, 0 skipped**, up from 379 — ten
new checks, nine in a punch-list block at the end of the attendance section and one in the coarse
sweep.*

*Three mutation proofs, all reverted:*

| Mutation | Result |
|---|---|
| `.panel-title-row > .class-action-btn` goes back to `flex: 0 1 auto` — the shrink the coarse `min-width` had quietly allowed | **1 red**, and it reproduces the classroom report exactly: `"📅 Days off" 71x44, content over its box by 12px`. Every 44px check stays green through it, which is the whole reason this one measures `scrollWidth` instead |
| `futureLimit()` always returns 0 — the horizon pinned back to today | **3 red**: the day off cannot be paged to, there is no plain future column to read "Ahead" off, and the forward stop reports the old "tomorrow is not something to record" sentence. The *"wrote nothing"* check stays green under it, correctly — it is asserting an absence, and a build that never pages forward also never writes anything |
| the portrait guard dropped from `Later` — the regression as shipped | **1 red**, reading `{"disabled":false,"title":"The weekday after this"}` on a one-column portrait screen. Exactly one, and that is the point: the WO-2.12 portrait check stays green through it, because it runs after every event has been removed and the old test and the new one agree there |

---

### WO-2.4 — Counts & attendance percentage

**What this adds.** Under every name on the registry, and on a line above the grid: how many meetings
this class has actually recorded, each student's P / T / A / E / D, and a percentage. Per term where
the term has dates, and per year always.

**The formula, and why it is not ours to choose.** `(P + T + E + D) / (P + T + A + E + D)`. Excused
absences and dismissals sit in the **numerator**, so an excused absence does not damage a student's
rate. This matches Roll Call!'s per-quarter sheet formula at `src/bridge.gs:625-626` — verified
against that source, not against a description of it. The owner reads both apps' numbers this year
and they have to agree, which makes this a compatibility requirement rather than a design decision.
**Do not "fix" it to something more defensible.**

**The denominator is recorded meetings of that class — never calendar days.** A class met if it has
an attendance record with no exception, asked through the one predicate (`stateOf()`), and every
count runs through it. A dropped day, a school-wide day off, and a day nobody has taken yet are all
absent from both halves of the fraction. A denominator built from dates looks right in September and
diverges by November.

**Unconfirmed folds into absent — here and nowhere else.** `U` is WO-2.10's temporary code. It is not
a sixth mark, it never appears in a displayed count, and a finished class contains none. But in this
percentage every `U` sits in the denominator alongside the absences, because the alternative is a
rate that flatters a class nobody finished taking. **The consequence to know before hand-counting:
mid-marking, every student the teacher has not reached yet reads as an absence.**

- [x] Percentages match a hand count across a term of a randomly shifting rotation. 👤
- [x] Dropped days and `no-school` days are absent from both numerator and denominator.
- [x] A student with one excused absence out of ten meetings shows 100%, not 90%.
- [x] Untaken days do not appear in the denominator.
- [x] A student with zero recorded meetings shows an honest empty state, not `NaN` or `0%` —
      `percent` is `null` and the line reads "No recorded meetings".
- [x] Cross-checked against Roll Call!'s number for the same class and date range. 👤

*Desk pass 2026-08-08: `verify-shell.mjs` **400 of 400, 0 skipped**, up from 389 on the tree this work
order arrived on — eleven new checks, all in a block at the end of the attendance section.
`wo-sweep.mjs` is 11 checks, 9 passed, 0 failed, 2 to review: the standing sensitive-field-name line
at the same 172 mentions as before, and three new CSS selectors confirmed non-interactive (a layout
wrapper and two text spans inside the name cell, which owe no 44px rule).*

#### The 👤 sitting this work order owed — run 2026-08-08, both lines agreed

**Both lines needed a real class and Roll Call!'s own numbers**, so neither could be closed at a
desk. The owner ran the sitting on 2026-08-08 and the two apps agreed; WO-2.4 closed the same day.
The two preconditions below are kept because they are what made the sitting work, and **anyone
re-running this comparison needs them again** — the second one in particular is a permanent fact
about Roll Call!, not a one-time setup step:

1. **Set term start and end dates on the class first.** Terms ship with blank dates and that is a
   valid state — a teacher setting up in August has not been given the calendar yet. Until they are
   set there is no term figure at all: the line reads *"Term dates not set · Year: N recorded
   meetings"*, which is honest and is not something to compare against a quarter.
2. **Compare quarter against quarter. Never year against year.** Roll Call! disagrees with itself:
   its per-quarter sheet formula is the one above, but its year roll-up
   (`src/dashboard.html:4058-4073`) computes `(P+T)/(P+T+A+E)` — `E` dropped from the numerator, `D`
   gone entirely. Planbook's year figure matches Roll Call!'s *quarters summed*, not its year badge.
   A year-to-year comparison shows a divergence that is Roll Call!'s, not this app's.

- [x] **Hand-count one class across a term.** Pick a term with a genuinely shifting rotation, count
      the recorded meetings by hand off the grid, and count one student's marks. Confirm the
      denominator is the meeting count and not a number of weekdays. 👤
- [x] **Cross-check against Roll Call!, quarter against quarter.** Pick a class and a **completed**
      quarter tab — one where every cell carries a letter. Roll Call! counts letters; Planbook reads
      a blank cell on an existing record as present, so the two agree only where the quarter was
      marked through normally. Compare Planbook's per-student line against Roll Call!'s column J. 👤
- [x] **Read the wall.** The per-student rate now draws under every name on a screen that gets
      projected. It is not accommodation, medical or plan data, so presentation mode does not hide
      it and no rule is broken — but whether a projected column of attendance percentages is
      something you want the room to read is a judgement only you can make. 👤
- [x] **Mark a class and watch the rate while you do it.** Confirm the mid-marking dip described
      above reads as "not finished yet" rather than as a wrong number, on the iPad, at speed. 👤

### WO-2.13 — Totals computed once per render

- [x] `node --check src/attendance.js`, `node --check tools/verify-shell.mjs`,
      `node tools/wo-sweep.mjs`, and `git diff --check` pass.
- [x] The source diff adds no second `stateOf()` predicate or `readingOf()` cell reader. The one
      `readingOf()` call moved unchanged from `attendanceTotals()` into the shared-record fold.
- [x] `node tools/verify-shell.mjs` passes the additive WO-2.13 checks and all eleven unmodified
      WO-2.4 checks. Run on the owner's machine 2026-08-08 against this correction-round tree:
      `405 checks · 405 passed · 0 failed · 0 skipped`, twice. The same harness run against `HEAD`
      reports `404 passed · 1 failed`, so the new checks discriminate rather than passing vacuously.
- [x] Record the before/after medians for 875 records / 175 meetings / 27 rows. Measured 2026-08-08,
      same harness and same fixture both sides; the "before" came from a detached `HEAD` worktree
      with this branch's `verify-shell.mjs` copied in, so only `src/attendance.js` differs. Median of
      nine renders: **before 40.10 ms and 32.80 ms** across two runs, **after 9.20 ms** both runs —
      **3.6–4.4×**. Two before-runs are recorded because that column has real spread; the after
      column does not. The historical 76 ms does not reproduce on this machine and is not the
      baseline here.
- [x] Confirm the immediate post-mark totals on a real iPad. 👤 Confirmed by the owner 2026-08-08.
      The desk half is automated and passes here too: the harness drives an active filter with
      detail open, asserts exact term/year values, checks the filtered-out row, and covers
      `unconfirmAll()`.

### WO-2.5 — Keyboard & touch pass

**What this adds.** A class is marked from the keyboard: **↓** lands on the first name, then one
letter per student — **P** present, **T** tardy, **A** absent, **E** event, **D** dismissed — and the
selection moves down the list on its own. **Esc** stops. The keys are written down on screen, on a
**⌨ Keys** button in the registry's toolbar and behind **?**, plus a paragraph under the grid.

**The standard, which is not "the keys work".** Since 2026-08-08 the laptop is the device of record
and this is how a live class gets marked while it walks in — twenty-five to thirty students, by
someone greeting a room rather than watching a screen. **A class of thirty is thirty keystrokes.** A
path that needed an arrow key between the letters, or a look up at the screen to find where the
selection went, would pass every line below and still cost the seconds this screen exists to save.

**A letter SETS, it does not cycle.** `A` means absent from wherever the cell was reading. Tapping a
cell still cycles it — that is the tap's writer and it is unchanged — but a keyboard that cycled
would make one absence cost up to five keystrokes and would make the count depend on what the cell
already said, which is the opposite of not looking at it.

**The keys go quiet exactly where a thumb is refused.** Every letter writes through the same
`setMark()` a tap does, so a locked past column, a dropped day, a day the calendar has closed, a
date after today and a window paged off the day being edited all refuse a keystroke. There is no
second writer and no second set of rules. They also go quiet while a dialog is open and while the
caret is in a field — the search box is two inches above the grid and "Patel" is five marks.

**The row highlight is Roll Call!'s `.row-selected`** (`design/portable-components.md:152`), copied by
value: `rgba(91,111,204,0.07)` across the row and a 3px `#5b6fcc` rail down its left edge. One
departure, and it is measured: the rail is **reserved on every row** and only coloured on the
selected one, because adding a border on selection steps twenty-six names 3px sideways once per
student down a class of thirty.

- [x] A full class can be marked from the keyboard without touching the mouse. *(Measured: 26
      students in Period 3, one ArrowDown and 26 letters and nothing else, with the whole `marks`
      object compared against what those keystrokes should have produced — including the five `P`
      students, who must have **no entry at all**. The grid is reached the same way: 10 Tabs to the
      class card and Enter.)*
- [x] No attendance control is under 44px on a coarse pointer. *(Measured under an emulated coarse
      pointer, gated on `matchMedia('(pointer: coarse)')` actually matching: every visible
      interactive element in the document, every control inside `#classView` for a 26-name roster
      with two hall passes open, the days-off panel, and the new ⌨ door — the last of those also
      measured for `scrollWidth` against `clientWidth`, which is the "Days off" spill the first iPad
      sitting found. **Not the same as a sitting on the owner's own iPad**, which is the line below.)*
- [x] Keyboard focus is visible on every step and never lost after a mark. *(Measured by asking each
      focused element `:focus-visible` — not by reading the rule off the stylesheet — after every one
      of the 26 marks, at the last row where there is nothing to advance to, after Enter on a cell,
      and after Escape.)*
- [x] The shortcuts are documented somewhere in the UI, not only in this file. *(The ⌨ button is a
      real `<button>` in the tab order with an `aria-label`, so somebody who knows none of the keys
      can find them; `?` opens the same dialog for a hand already on the keys; the dialog names all
      five letters, both arrows and Escape; the hint paragraph under the grid says it in prose.)*

**The screen-reader deliverable was already met and had nothing watching it.** WO-2.1 wrote both an
`aria-label` and a `title` on every cell and every column head, so this work order added no labels;
what it added is the check, because a deliverable with no fixture behind it is one the next refactor
can quietly undo. 150 visible buttons on the class view, 55 of them a single glyph, all named.

*Desk pass 2026-08-08: `verify-shell.mjs` **428 of 428, 0 skipped**, up from 405 on the tree this work
order arrived on — 22 in a new keyboard section that runs on a FINE pointer before the coarse sweep,
and one in the coarse sweep. `wo-sweep.mjs` is 12 checks, 11 passed, 0 failed, 1 to review: the
standing sensitive-field-name line, unchanged at the same 172 mentions.*

*Eight mutation proofs, run before this was written:*

| Mutation | Result |
|---|---|
| the letter marks but does not advance (`selectStudent(selectedId)` always) | **3 red** — the full-class comparison, the advance check, and the last-row ring |
| `paintColumn()` does not hand focus to the replacement cell | **1 red** — Enter on a focused cell drops to `<body>`; every other check stays green, which is why that one exists |
| the keyboard cycles instead of setting (`cycleMark` for `setMark`) | **1 red** — the marks are one code off along the whole class |
| the `anyModalOpen()` guard removed from the keydown listener | **1 red** — a letter typed with the key list open marks a student behind it |
| the `INPUT` guard removed from the keydown listener | **1 red** — typing a name into the search box marks the selected student |
| the left rail added on selection instead of reserved on every row | **2 red** — the treatment check and the no-reflow measurement |
| Escape blurs instead of leaving focus where it was | **3 red** — the ring is gone, the arrow resumes from the wrong row, and the dialog has nowhere to return focus to |
| `cellFor()`'s editable branch writes no `title` | **1 red** — 26 icon-only cells with an `aria-label` and no tooltip, which is half of the third deliverable |

*All eight were reverted and the run is green on the shipped tree. The last of them cost this work
order a scare worth writing down: it was reverted with `git checkout -- src/attendance.js`, which
took **every** WO-2.5 edit in that file with it and turned the next run into eight reds that looked
like a regression. The other seven were driven by a script that held the original bytes in memory
and wrote them back. Revert a plant the way you made it.*

*Two of those mutations found a defect in the checks rather than in the app, and it is worth naming
because the shape recurs: **two of the three "this keystroke writes nothing" checks were vacuous when
first written**. `setMark()` refuses a no-op, so a letter that happens to match the mark already on
the cell leaves `doc.attendance` byte-identical whether the guard fired or not — both went green
against a build with the guard deleted. They now read the cell first and press a letter that would
change it, and the two that cannot select anything at all press two different letters instead.*

**The 👤 iPad and classroom sitting this work order owes.** The harness drives a headless browser at
a desk; none of the following can be answered there, and the first two are the ones with a term
riding on them.

- [x] **Mark a real class from the keyboard, at the door, while it walks in.** Thirty students,
      hand on the letters, eyes on the room. The question is not whether it works — it is whether you
      ever have to look down to find out where the selection is. 👤
- [x] **Then mark the next period the same way without reading anything first.** If the keys have to
      be looked up a second time, the ⌨ door is in the wrong place or the letters are wrong. 👤
- [x] **Every attendance control on your own iPad, in the orientation you hold it.** The 44px pass
      above is an emulator at 1024×768; a thumb on an 11″ is the line. Include the ⌨ Keys button,
      which is new, and the row of pass buttons at the cap. 👤
- [x] **Read the selected row across the classroom.** The indigo wash is 7% on a laptop and 10% on a
      coarse pointer; confirm it is findable at arm's length without being loud enough to compete
      with the amber of an untaken column. 👤
- [x] **A Smart Keyboard on the iPad, if you use one.** Everything above applies there and nothing
      about it has been tested — the coarse-pointer rules and the key handler are live at the same
      time on that device and on no other. 👤

*2026-08-08, the teacher's own sitting — **hardware: iPadOS 26.5.2**, plus the laptop. **All four
Acceptance criteria confirmed by hand on both devices** — the keyboard walk, the 44px targets, the
focus ring, and the ⌨ door. The iPad line follows from criterion 2, which *is* the 44px pass, run on
the real device rather than the emulator; the Smart Keyboard line follows from criterion 1, a
keyboard walk, which cannot have been run on an iPad without a keyboard attached. Those two
inferences are written down rather than left for the next reader to make.*

*The remaining three — both doorway lines and the read-across-the-room line — **were reported set by
the teacher on 2026-08-08**, and that is the basis recorded, deliberately, in place of the specific
claim each line makes. The doorway lines describe thirty students walking in, and this project's own
dates put the first of those at ~2026-08-24 (`work-orders/gates.md`). Whatever was run on the 8th
satisfied the owner; it was not that. **If the doorway is re-sat once a live class exists, note it
here** — the go-live rehearsal leans on these three.*

*`matchMedia('(pointer: coarse)')` **still matches with the keyboard attached** — owner, 2026-08-08,
iPadOS 26.5.2. So the coarse block keeps applying and every 44px rule stays live on the device where
a thumb is still the input. This was worth asking because `verify-shell.mjs` structurally cannot:
it sets the pointer type itself, so it can only ever confirm its own assumption.*

### WO-2.17 — The term nav repaints the screen it is sitting on

**What this fixes.** Tapping a term on the attendance registry moved the highlight in the header and
left the previous term's meeting counts and percentages on screen. Nothing said which term the number
belonged to, and the next repaint from any other cause corrected it — mark one student and the
figures jump, which reads as the mark landing rather than as the term arriving. The repaint is now a
property of the term change (`afterTermChange()` in `src/shell.js`) rather than something each class
screen remembers to ask for.

- [x] `node --check src/shell.js`, `node --check src/attendance.js`,
      `node --check tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass — the sweep at
      `15 checks · 14 passed · 0 failed · 1 to review`, the standing REVIEW line unchanged by this
      work order (no added line mentions a support, accommodation, medical or plan field).
- [x] `node tools/verify-shell.mjs` is green at **522 checks · 522 passed · 0 failed · 0 skipped**,
      seven of them this work order's.
- [x] **The pre-fix red is recorded rather than assumed.** The same seven checks were written and run
      first against the unfixed tree: `522 checks · 519 passed · 3 failed`, the three being the
      registry's class totals line, its per-student term line, and the pair of them moving without
      the grid being rebuilt. A check that has never failed is not evidence that it can.
- [x] Two mutations, both reverted, each turning exactly one check red and no other:

      | Mutation in `afterTermChange()` | Result |
      |---|---|
      | the registry branch calls `renderAttendance()` instead of `paintRenderedTotals()` — the blanket repaint this work order's Traps line forbids | **1 red**: the row the harness marked before the tap is a different element afterwards. The two "the figures moved" checks stay green, which is the point — a blanket repaint gets the numbers right and is still the wrong fix |
      | the `view === 'class'` test dropped, so any view falls through to the registry | **1 red**: a term tapped from the class grid repaints a screen nobody is looking at |
- [x] `src/classes.js` is untouched by this work order — `git diff` names only `src/shell.js`,
      `src/attendance.js`, `tools/verify-shell.mjs`, `sw.js` and the trackers — so its import list
      still holds no screen module and `selectTerm()`'s refusal of a term id that does not belong to
      the open class is the same three lines it was.
*No 👤 line is added here, deliberately. This work order's own Acceptance says the failure is
measurable at the desk, and it is — the seven checks above drive the real term buttons on the real
screens. Worth a glance on the iPad at the **next** sitting rather than a line of its own: with two
dated terms set up, a tap on the term nav should move the figures under it and nothing else, and a
repaint that skips the grid is the kind of thing that could read as a screen that did not respond.*

### WO-2.18 — The term-switch checks cover every surface the repaint paints

**What this changes.** Nothing a teacher sees: harness, not app, and `src/` is byte-identical to the
tree WO-2.17 left. Two checks are added to WO-2.17's own block — no second fixture and no new fixture
year — and they close the two gaps that work order's verification left. `paintRenderedTotals()` paints
**three** surfaces that know which term is open and the seven checks asserted two of them, which
licenses the third to be deleted; and WO-2.17's fourth acceptance line was half settled by reading a
guard rather than by driving it.

- [x] `node --check tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass — the sweep at
      `15 checks · 14 passed · 0 failed · 1 to review`, the same line it printed before this work
      order and the standing REVIEW unchanged (nothing added here mentions a support, accommodation,
      medical or plan field).
- [x] `node tools/verify-shell.mjs` is green at **537 checks · 537 passed · 0 failed · 0 skipped**,
      two of them this work order's. The tree it arrived on measured 535, not the 522 `tools/README.md`
      had recorded — WO-3.4's thirteen never reached that line, and it is corrected there.
- [x] **With a detail panel open, the term switch moves the panel's own figures** in the same tap as
      the class line and the row line. The panel is opened through the real ⋯ before anything is read,
      and its figures are read out of `.attendance-detail-totals` in the DOM rather than out of the
      totals map — the text the teacher reads, for the same reason WO-2.17's row sentinel is an
      attribute on a surviving element.
- [x] **`selectTerm()` driven with a term id belonging to another class writes nothing** — preference
      serialised byte for byte, the nav's active mark, and the live region pre-filled with a sentence
      of the harness's own so that silence is text still sitting there. Asserted from the harness, not
      from reading the guard.
- [x] Two mutations, both reverted, `git status --short src/` and `git diff --stat src/` empty
      afterwards and the run green again at 537:

      | Mutation | Result |
      |---|---|
      | `paintDetail(totals)` deleted from the foot of `paintRenderedTotals()` (`src/attendance.js:3306`) | **2 red**: the new panel check, and WO-2.13's "a filtered-out row and its open detail repaint exact term/year totals after a mark". **All seven of WO-2.17's stay green**, which is the claim this work order was written on. The second red is the correction to it: the harness was watching that line from the MARK path already and was blind to it only on the TERM-SWITCH path — the one WO-2.17 shipped, and the one where no other repaint would have brought the figures back |
      | `selectTerm()`'s foreign-term guard cut to `if (!cls) return;` (`src/classes.js:479`) | **1 red**, and nothing else in 537 — which is the whole reason the check exists. It fails in four ways at once, all of them printed: the preference is written with the foreign id, the resolver then answers with a term the teacher did not tap, the nav's highlight moves to it, and `term.label` throws on the way to the announcement. The throw is why the check catches rather than lets fly — uncaught it takes the run down, and a build that dies before writing satisfies all three "nothing was written" claims |

*No 👤 line, for the reason WO-2.17 gives above and one more: nothing here changes a pixel, so there
is nothing on the iPad to look at that was not already owed by WO-2.17.*

### WO-2.19 — The harness's own check count is checked

**What this changes.** Nothing a teacher sees, and nothing `verify-shell.mjs` prints: `src/` and the
harness itself are both byte-identical to HEAD. `tools/wo-sweep.mjs` gains a sixteenth check that
counts `check()` call sites in `verify-shell.mjs` and compares them against a number recorded in
`tools/README.md`, so the line that had gone stale three times (WO-1.5, WO-2.18, and again at WO-3.5)
is now maintained by a grep rather than by remembering.

- [x] `node --check tools/wo-sweep.mjs` passes, and `node tools/wo-sweep.mjs` is
      `16 checks · 15 passed · 0 failed · 1 to review` — one more PASS line than the
      `15 checks · 14 passed · 0 failed · 1 to review` it printed before, **no new REVIEW**, and the
      standing sensitive-field-name REVIEW byte-identical at *"174 mention(s) in index.html,
      src/attendance.js, src/home.js, src/letter-scale.js, src/prefs.js, src/presentation.js,
      src/roster.js, src/scores.js, src/shell.css, src/shell.js, src/supports.js, sw.js"*.
- [x] `node tools/verify-shell.mjs` is green at **554 checks · 554 passed · 0 failed · 0 skipped**,
      none of them this work order's, and `git diff --stat src/ tools/verify-shell.mjs` is empty
      afterwards. The line in `tools/README.md` had said 537 — WO-3.5's seventeen are counted in the
      § WO-3.5 block above and never reached it, which is the third miss and this work order's subject.
- [x] **The gap between the two numbers is structural, and the arithmetic that made it look like a
      short list of branches is a coincidence.** Measured, not reasoned: a throwaway copy of the
      harness with `new Error().stack` in `check()` reports that a green run fires **532 distinct call
      sites**, that **10 of them fire more than once** (22 extra results — `:11557` runs ten times
      across the note-panel matrix), and that **28 never fire at all** (all of them the failure arm of
      a fixture guard, `if (!plant.ok) check(…, false, plant.why)`). 532 + 22 = 554 against 560 call
      sites, and 28 − 22 = 6 is two unrelated corrections cancelling. The work order's *"four sites
      that a run does not reach"* was the same arithmetic on an older tree. Recorded in
      `tools/README.md` beside the count, with the reason.
- [x] The sweep asserts **call sites**, `tools/README.md` says so in the sentence the check greps, and
      the executed count sits beside it as prose — no check compares the two, and none passes on
      "close". Making the grep agree with the run would mean running the run, which this file's own
      header forbids.
- [x] Two mutations, both reverted, `git diff --stat tools/verify-shell.mjs` empty afterwards and the
      sweep green again at 560:

      | Mutation | Result |
      |---|---|
      | a throwaway `check('WO-2.19 throwaway mutation, reverted', true, …)` added at `tools/verify-shell.mjs:13120`, `tools/README.md` untouched | **1 red**, and the sweep exits 1: *"tools/verify-shell.mjs has 561 `check()` call site(s), up 1 on the 560 recorded at tools/README.md:504"*. Correcting that one line to 561 with the throwaway still in turns it green again at 561 — the both-directions proof the Deliverable asks for |
      | the throwaway removed with `tools/README.md` left at 561 — the *loses a check* direction | **1 red**, and the sweep exits 1: *"tools/verify-shell.mjs has 560 `check()` call site(s), down 1 on the 561 recorded at tools/README.md:504"*. A check that only noticed growth would have gone green here |

*No 👤 line. Nothing here renders, and a grep over two files in `tools/` has no iPad half. The one
thing a human still owes this line is the executed count itself: it comes off the summary line of a
177-second run and no grep can hold it, which `tools/README.md` now says in as many words rather than
leaving the next reader to infer that the two numbers are the same number.*

---

### WO-2.23 — Every date field in the app is short of 44px on the iPad

**What this changes.** One declaration and one number. `src/shell.css`'s BASE section gains
`input[type="date"] { -webkit-appearance: none; appearance: none; }` — the app-wide version of the
line WO-3.17 put on `.assign-field-date` alone — and `.term-date`'s coarse `min-width` goes from
44px to 160px, because the reset takes the native widget's intrinsic width away with its native
height. **Seven date fields on four screens** are affected: the assignment editor's *Assigned* and
*Due*, the term editor's *Starts* and *Ends*, the days-off form's *From* and *To*, and — not named
in the work order's 👤 list, and the reason this note says "four screens" — the student editor's
plan **Review date** (`.student-date`), whose comment had already written the diagnosis without the
reset ever following.

- [x] The reset is applied to every date input in the app, in one place or with the per-sheet choice
      argued at the rule. *One rule, keyed to the element rather than to the four classes, in
      `src/shell.css`'s BASE section with the argument written above it. `.assign-field-date` keeps
      WO-3.17's identical copy deliberately — the duplication is justified at that rule and
      cross-referenced from this one, so the tree does not hold two unexplained answers.*
- [x] 👤 On the iPad, portrait and landscape: the assignment editor's *Assigned* and *Due*, the term
      editor's *Starts* and *Ends*, and the days-off *From* and *To* are all full-height tappable
      fields rather than squat ones.
- [x] 👤 **The iPadOS date picker still opens from all six**, and a date picked in it still lands in
      the field. This is the thing the reset could plausibly break.
- [x] 👤 An empty date field still reads as a field on the device — iOS draws no placeholder in it,
      so "empty" and "not there" are a real pair to tell apart, and empty is a legal value everywhere.
- [x] 👤 Days off: the dates still clear after a successful add. `src/days-off.js` discards and
      rebuilds the element to beat the picker's retained selection (WO-2.3's scar, reported off the
      hardware on 2026-08-08), and the reset must leave that working.
- [x] A date field is never allowed to collapse to its tap-target floor: `.term-date` carries
      `min-width: 44px` in the coarse block, and with the native intrinsic width gone the field still
      has to be wide enough to show a whole date. *Raised to 160px, copied rather than re-derived
      from Roll Call!'s `#dateJumpInput` (`src/dashboard.html:437-440`) — which is a date-picking
      `<select>` under the same two reset declarations, **not** a date input. Roll Call!'s own date
      inputs carry no reset and no `min-width`, so what it lends is a width for a rendered date and
      not a precedent for this control; the hardware precedent for the reset itself is WO-3.17's.
      Both rows this class sits in wrap (`.term-dates` and `.dayoff-dates` are both
      `flex-wrap: wrap`), so the wider floor costs a wrapped line and never an overflow — **reasoned
      from the box model, not measured**: no check opens either of these two dialogs, which is the
      subsection below in miniature.*
- [x] `node tools/verify-shell.mjs` passes whole, and `node tools/wo-sweep.mjs` prints what it printed
      before.

**A seventh 👤 check this work order's own list does not carry.** The student editor's plan *Review
date* is fixed by the same one line and appears in no acceptance line above, so it needs the same
four looks on the device: full height, picker opens, a date lands, an empty field still reads as a
field. It is on a sensitive screen and the change to it is height and appearance only — nothing
about what that field stores, who sees it, or what leaves the roster.

***The four 👤 lines and the seventh check were run in one sitting on 2026-08-10**, on the owner's
iPad over a LAN server rather than the installed home-screen app — plain `http://` is not a secure
context, so no service worker registered and this sitting proves nothing about offline or install.
It does not need to: every line here is layout and the native picker, and neither goes through the
worker. All five screens good, the picker opens from all seven fields, and the Trap's
stop-and-report condition never fired.*

***The coarse block zeroes these fields' vertical padding, and this was the first time any date
input had been on glass in that state.** Nobody knew whether iOS would centre the date in the taller
box or clamp it to the top, and no harness can ask — Chrome under an emulated coarse pointer draws
the field itself. **Answered on the hardware: pinned centre, horizontally and vertically.** Recorded
because it is the question the next person to raise a `min-height` on a natively drawn control will
ask, and now it does not cost another sitting.*

***The 160px floor was argued three times and each argument was false; the fourth does not argue.**
Verification round 3 settled it by rendering rather than by reasoning — Roll Call!'s `#dateJumpInput`
declarations copied verbatim into a scratch page, headless Chrome at 2×: with the reset **160.0px and
no arrow**; with both the reset and the `min-width` removed **103.0px and an arrow**; reset kept,
`min-width` dropped, so intrinsic **83.0px**; and an `input[type="date"]` at 14px under the reset
**139.0px**. *(Round 4 reproduced all four independently and landed within 1px of each.)* So `appearance: none` is what removes a
select's arrow — the third draft had claimed the arrow as headroom — and the source control is
narrower than the destination, not wider. **The number is fine; every comparison drawn from it was
not.** These are Chrome figures and iOS draws its own, which is why the rule's comment now claims no
measurement at all and forbids re-deriving the floor from a desktop one.*

#### Why neither harness can see this defect, and why no check was booked for it

**This is the note WO-2.23's third Deliverable asks for. Do not book a check for this later without
reading it.** A check that goes green on the broken tree is worse than no check, because it tells
the next reader the rule is guarded.

- **`verify-shell.mjs` never measured these fields, and measuring them would not have helped.** The
  44px sweep skips anything computing to `display: none`, and all seven date fields live inside
  `.hidden` dialogs. But the deeper half is the engine: **desktop Chromium honours `min-height` on
  an `<input type="date">` whether or not the `appearance` reset is present**, so a coarse-pointer
  measurement of `.term-date` reports a compliant 44px on the tree that has the defect. WO-3.17
  found the same wall from the other side and wrote it into its mutation table — removing the reset
  from `.assign-field-date` moved **no measurement at all**, only the computed style.
- **`wo-sweep.mjs` cannot see it either**, and for a reason worth stating plainly: its coarse-block
  check asks whether every new selector *appears* in a `@media (pointer: coarse)` block. All seven
  fields passed that check for weeks. The declaration was there the whole time; what was missing was
  the one line that let it reach the glass, and no grep over a stylesheet distinguishes a rule that
  applies from a rule the platform is ignoring.
- **So the class of defect is: a correct declaration silently ignored by a natively drawn control.**
  It is device-only, it is invisible to both halves of the desk pass, and the only instrument that
  reports it is an iPad with a teacher's eyes behind it. What the desk *can* witness is that the
  reset is live as a **computed style** — `verify-shell.mjs` asserts exactly that on the two
  assignment fields (WO-3.17), which is what stops the line being tidied away silently. That check
  reads the computed value rather than which rule produced it, so it stayed green across this work
  order's move to a shared rule; it guards the *effect*, not the source, and it should not be read
  as proof that any particular declaration is load-bearing.

**Three checks were booked later, at WO-2.24, and they are the last bullet's check rather than this
note's reversal.** What this note refuses is a **height** assertion on a date field, and every word
of that refusal still stands, and WO-2.24 turned it from a prediction into a reading: the coarse
sweep has measured these fields for 44px since WO-2.21, and **on the tree with the reset deleted
every one of those height checks stayed green** while the new style checks went red. What WO-2.24
added is the **computed-style** claim above, carried from the two assignment fields to the five that
have no copy of the rule of their own — the term editor's *Starts* and *Ends*, the days-off *From*
and *To*, and the plan *Review date* — read while the dialogs those fields live in are open, which
is a thing the harness does for other reasons and had never once used to look at a *style*. It
guards the same *effect* on more elements and makes no new claim about what any of them look like.
**The 👤 lines above are untouched and stay owed forever**; § WO-2.24 below records the deletion
that was watched to make sure the guard can fail.

*The desk half of this work order: `verify-shell.mjs` **563 checks · 563 passed · 0 failed ·
0 skipped**, unchanged from the run WO-3.17 recorded — no check added, per the Trap above.
`wo-sweep.mjs` is **16 checks · 15 passed · 0 failed · 1 to review**, the REVIEW still the standing
sensitive-field-name sweep at **174 mentions**, byte-identical to the run before this work order.
Three PASS details move and none of them is a verdict: the style-line count 4462 → 4571 (comments),
the coarse-block check from "no new CSS selectors" to *"1 new selector(s), all covered"* — that
selector is `.term-date`, whose rule this work order rewrites and which is of course already in the
coarse block it sits in — and the CACHE line reporting the bump as uncommitted. `sw.js`'s `CACHE` is
bumped to `planbook-shell-v42` in the same pass, because `src/shell.css` and `src/assignments.css`
are both in `SHELL`.*

---

### WO-2.6 — Attendance history & output

**What this adds.** Two read-back surfaces over the attendance ledger, both reached from the
registry. **A student's own name in the grid** opens their history: a rate badge, a term-by-term
table, and every recorded meeting in the open term with its mark and the percentage as it stood
after it. **🖨 Record** in the toolbar opens the class's record for that term — a printed header, one
row per student with their counts, and the whole term day by day — with **Print** and **Download
CSV** on it.

**Nothing here decides which meetings count.** Every row and every number comes out of three readers
in `src/attendance.js` — `classRecord()`, `termHistory()`, `termTotals()` — and all three sit on one
walk over one set of records. That is what the first acceptance line is actually about: it says *the
two agree*, which is a claim about a shared source and not about two implementations landing on the
same number. A second filter chain would agree with itself on any fixture anybody wrote and disagree
in November, on the first retroactive snow day.

**Neither surface can leak a support field, and not because it is hidden.** No accommodation,
medical or plan data reaches either page or the CSV **in either presentation mode**, because
`src/attendance-report.js` never receives it: `classRecord()` hands over `{ id, first, last, name,
marks, totals }` and that module does not import `src/supports.js` at all. "Presentation-mode safe"
is therefore trivially true rather than conditionally true — the implementation that reads those
fields and hides them behind the visibility switch satisfies the deliverable and is a one-tap
disclosure the day somebody flips the switch back.

**What "fits a class on a page" was decided to mean**, because the work order leaves it open. A class
fits *down* a page: one row per student at 8pt. It is the term's meetings that do not fit *across*
one, so the day-by-day table is cut into **slices of 24 date columns**, each starting a new page and
repeating the student column — A4 is 210mm, the print block's margin is 10mm a side, a 45mm student
column leaves 145, and 24 columns at 6mm are 144. The slices are on screen as well as on paper, so
the dialog is a preview rather than an approximation. The summary table above them — counts and
percentage per student — always fits on its own, and it is the page a conference actually needs.

**Printing is gated on an attribute**, Roll Call!'s `body[data-modal-print]` idiom lifted whole: the
Print button sets `data-attendance-print` on `<body>`, prints, and takes it off. Without the gate a
Ctrl+P made on any other screen would print a blank sheet, because Planbook has no default print
surface at all — Roll Call! prints its registry and this app cannot, since its registry is a six-day
window rather than a term.

- [x] A student's history lists exactly the meetings counted in their percentage — the two agree.
      *(Measured as a LIST of dates and not as a count: a fixture of six recorded meetings inside the
      term, with a seventh record carrying an `exception` and an eighth outside the term's dates
      sitting beside them. Both are absent from the history; the last row reads `4 of 6 · 67%`, the
      badge reads `67%`, and the line under that student's name on the registry behind the dialog
      reads `P 1 · T 1 · A 2 · E 1 · D 1 · 67%`. The planted student wears one of every mark plus a
      `U`, which reads `Absent` and never `U`.)*
- [x] The CSV opens cleanly in a spreadsheet with dates as columns. *(Measured **as bytes**, through
      `recordCsv()` — the build-it/hand-it-over seam `src/backup.js` already uses — so every claim is
      character by character: a BOM so Excel reads UTF-8, CRLF endings with no bare LF anywhere, Roll
      Call!'s own column order `Last Name, First Name, Present, Tardy, Absent, Event, Dismissed,
      Meetings, Att %`, then the six meeting dates in ISO, oldest first. Three rows for three
      students, every row the header's width, and a student called `O"Brien, Jr` surviving as one
      cell. **Opened by the owner on 2026-08-11** in the spreadsheet she actually uses, on a real
      roster: dates across the top, and **the accents in a pasted roster intact** — the one thing the
      BOM exists for and the one thing no fixture covered, since every name in the harness is ASCII.)*
- [x] The print view fits a class on a page and carries the class, term, and date range. *(The second
      half was measured at a desk: the header reads `WO-2.6 Term · February 2, 2026 – February 13,
      2026 · 6 recorded meetings` over the class name, with `Printed August 11, 2026 · Planbook`
      under it, and a term of thirty meetings is drawn as two slices of 24 and 6 columns rather than
      one table. Also measured: all 24 `@media print` rules touching this surface are selected under
      `body[data-attendance-print]`, and `<body>` carries no such attribute at rest. **The paper half
      was settled by the owner on 2026-08-11 on her own printer, on a term of 42 recorded meetings**
      — which is the case that matters, since anything under 24 draws a single slice and never
      exercises the page break or the repeated student column at all.)*
- [x] Neither surface emits accommodation, medical, or plan data. *(A plan, a case manager, a review
      date, an accommodation, a medical line and a behavior plan are planted on the student first,
      and their presence in the serialised document is asserted before anything is read — an absence
      check over a student with nothing on file proves nothing. Then the history's text, the record's
      text and the CSV's text are searched for all five sentinels and for the word `IEP`, **twice**:
      once with presentation mode OFF, where the visibility switch answers true and the roster shows
      everything, and once with it ON. Zero hits in either pass, over surfaces of 799, 744 and 1316
      characters, so none of the three was empty.)*
- [x] 👤 **Print one class's record on the printer you actually have.** A roster of ordinary size on
      one sheet, the header readable, the five mark colours still telling P from T from A. Try it
      from a term with more than twenty-four meetings too, where it should come out as more than one
      page with the student column repeated and no columns lost between them. *(Owner, 2026-08-11 —
      run on a term of **42 recorded meetings**, so the multi-page path and the repeated student
      column were the thing under test rather than a single slice.)*
- [x] 👤 **Open the CSV in the spreadsheet you actually use.** Dates across the top as columns, one
      row per student, a name with a comma in it still in one cell, and the accents in a pasted
      roster intact — that last one is what the BOM is for. *(Owner, 2026-08-11 — accents came
      through. This is the check the desk half could not make: the harness has no non-ASCII name in
      it, so until this sitting the BOM was asserted present and never asserted useful.)*
- [x] 👤 **On the installed iPad PWA, tap Download CSV** and confirm the file lands somewhere you can
      reach in Files. This is `src/backup.js`'s own hand-off helper, borrowed rather than copied, so
      the mechanism is the one already proven on that device — what is new is the bytes. *(Owner,
      2026-08-11.)*
- [x] 👤 **Tap a student's name mid-class and confirm it is not in the way.** The name and the term
      line under it are one 44px control now. It writes nothing and a mis-tap costs a dialog and an
      ✕, but the row heights did not move and that is the thing to check by eye. *(Owner,
      2026-08-11.)*

*The desk half: `verify-shell.mjs` **582 checks · 582 passed · 0 failed · 0 skipped**, up from 564 on
the tree this work order arrived on — seventeen in a new section at the foot of the file and one in
the coarse sweep, which measures the 🖨 door for `scrollWidth` against `clientWidth` (the "Days off"
spill from the first iPad sitting, asked of the next button of the same shape) and a student's name
for 44px in both directions. `wo-sweep.mjs` is **16 checks · 15 passed · 0 failed · 1 to review** —
the REVIEW is the standing sensitive-field-name sweep, now **181 mentions across 13 files** rather
than 174 across 12: the seven new ones are `src/attendance-report.js`'s header stating, at the point
where a future author would break it, that none of that data reaches these surfaces. `sw.js`'s
`CACHE` is bumped to `planbook-shell-v44` in the same pass and `src/attendance-report.js` is added to
`SHELL`.*

*Six mutation runs, all reverted. One of them is in this table as a **failed run** rather than as a
result, and it is the more useful row: the first attempt at the CSV-quoting mutation never applied —
the edit script's own pattern did not match — and the harness went green over an unmutated tree. A
green mutation run is indistinguishable from a vacuous check until you go and look at the file, which
is why the row is here rather than quietly re-run.*

| Mutation | Result |
|---|---|
| `classRecord()` carries `supports` and the record prints the medical line behind the visibility switch — the implementation the work order's brief predicts by name | **3 red** — both presentation-mode passes AND the summary-row check. The gated build fails the mode-OFF pass, which is the point; it fails the mode-ON pass too because the sweep searches `JSON.stringify(classRecord())` as well as the rendered text, and the data had still reached the shape |
| `attendanceHistory()` walks `doc.attendance` itself, with no `stateOf()` in it | **3 red** — the history lists seven dates including the dropped day, and the detail line reads `last row "5 of 7 · 71%", badge "67%"`, which is acceptance line 1 failing in its own words |
| `U` is not folded into `A` in `walkMeetings()` | **8 red** — four of WO-2.4's own totals checks and four of this work order's, which is also the proof that re-expressing `totalsFrom()` on top of the new walk did not quietly fork it |
| `csvCell()` does no quoting | **2 red** — the `O"Brien, Jr` row parses to width 1 against a header of 15 |
| `DATES_PER_SLICE` raised to 100 | **1 red** — thirty meetings come out as one 30-column table |
| one `@media print` rule left ungated (`body[data-attendance-print]` prefix removed) | **1 red** — 23 of 24 gated, and the ungated selector is printed by name |
| *(failed run)* the same `csvCell()` mutation, first attempt | **0 red, and it proved nothing** — the edit never landed. Re-run above |

---

### WO-2.21 — The 44px sweep can see a screen that is not the one on screen

**What this changes.** Nothing a teacher sees: `src/` and `index.html` are byte-identical to HEAD.
`tools/verify-shell.mjs`'s coarse-pointer section stops measuring whichever view the section above it
left open and instead **enumerates the children of `<main>` and opens each one through the real
navigation**, each with its own floor. `.hidden` is `display: none !important`, the sweep skips
anything computing to `display: none`, and every view but the one on screen is `.hidden` — which is
how WO-3.5's ~250 score inputs were walked past by a green run.

- [x] Every view in `index.html` is measured under the coarse pointer, **enumerated from the document**
      — `document.querySelectorAll('main > *')`, never a list typed into the harness. The run prints
      `4 in <main>: homeView, classView, assignmentsView, scoresView` and measures 7 · 27 · 5 · 4
      controls on them, every one ≥44px.
- [x] **They are opened by driving the app's own navigation** — the "All classes" door, the class's own
      card, the `data-class-screen` segments — rather than by un-hiding them, and the reasoning is
      written at the block. Un-hiding is cheaper and would have gone **green over the defect that
      produced this work order**: `#scoresView` shipped with its only segment disabled, so the view was
      there and drawn and unreachable. A view whose door is missing or disabled fails by name here.
- [x] **Deleting WO-3.5's by-hand coarse block does not lose the view**: the run is
      `588 checks · 588 passed · 0 failed · 0 skipped` with `#scoresView` still opened through the real
      navigation and measured, at **4 controls** instead of the **259** WO-3.5's block prints on a real
      run (`measured 259 visible control(s) with the grid open`). What is lost is the *density*, not the
      coverage — and that is why the block stays, in one sentence at the block and in `tools/README.md`:
      the general sweep runs 2,700 lines before WO-3.5's 25×10 fixture is planted, on a document where
      every assignment has been deleted, so it can reach that screen and never a full one.
- [x] `node tools/verify-shell.mjs` is green at **591 checks · 591 passed · 0 failed · 0 skipped**,
      14,230 lines, 24.1 lines per check, 193s — nine results from three call sites, because two of
      them fire once per view.
- [x] `node tools/wo-sweep.mjs` is green at `16 checks · 15 passed · 0 failed · 1 to review`, the one
      REVIEW being the standing sensitive-field-name grep. §11 named the move itself —
      *"592 `check()` call site(s), up 3 on the 589 recorded"* — and `tools/README.md` now records
      **592 call sites** and **591 executed**, both off real runs rather than arithmetic.
- [x] The page is put back the way the section found it: the same view, the same open class, reached
      through the same doors. The run prints `left the page on #classView`.

*Two mutations, both reverted, `git status` clean of them afterwards:*

| Mutation | Result |
|---|---|
| an **empty** view planted as a real class screen — `<div id="wo221EmptyView" class="hidden"></div>` in `<main>`, wired into `src/views.js` (`VIEWS`, `CLASS_SCREENS`, `REMEMBERED_AS`) and `src/screen-nav.js`'s `SCREENS`, plus its own `VIEW_PLAN` entry with `floor: 1` | **2 red on its floor**, which is the acceptance line: *"#wo221EmptyView opens through the app's own navigation and draws at least 1 control(s) … `{"hidden":false,"display":"block","w":984,"h":0}` :: 0 control(s) measured"*, and the 44px check red beside it at *"measured 0"* rather than green for having nothing to complain about. Three of WO-3.3's own checks went red too — the strip really did grow a fourth segment |
| a view the harness has never heard of — `<div id="wo221UnknownView" class="hidden"></div>` in `<main>` and nowhere else | **1 red**: *"6 in `<main>`: homeView, classView, assignmentsView, scoresView, wo221EmptyView, wo221UnknownView :: NOT IN VIEW_PLAN, so nothing measured them: wo221UnknownView"*. This is the line WO-3.6, WO-3.7 and WO-3.9 will each hit on their way in |

*The empty-view run also found a defect in the first cut of the restore, which is why the mutation was
worth running rather than reasoning about: putting the page back clicked the switcher inside whatever
view was open last, and an empty view has no switcher in it — `could not put #classView back`. The
route is now out to the grid and back in through the class's card, which is the way a teacher leaves a
screen that has no door onward.*

*No 👤 line. Nothing here renders, and the thing this work order measures — that a screen is opened
before it is measured — has no iPad half that was not already owed by the screens themselves. The 44px
threshold and what is measured on each screen are untouched, deliberately: this work order is about
**which** screens are looked at.*

---

### WO-2.22 — A missing harness is a failure, and one call per line stops being an assumption

**What this changes.** Nothing a teacher sees, and nothing `verify-shell.mjs` prints: `src/` and the
harness are both byte-identical to HEAD by hash. `tools/wo-sweep.mjs` §11 changes in two places. A
missing `tools/verify-shell.mjs` or `tools/README.md` now **FAILs** where it printed a `REVIEW` and
exited 0 — the file's own header defines `REVIEW` as *"greppable evidence that needs a human
decision"*, and a vanished harness is not a decision anybody is being asked to make. And the section
gains a seventeenth check asserting that no call-site line in the harness holds a second `check(`,
which turns *the count is a count of lines and that is the same as a count of calls* from an unstated
premise into a check that names the line.

*Evidence for the Acceptance list in `plans/work-orders/phase-2-attendance.md` § WO-2.22 lives here
and in `tools/README.md`, not on the criteria themselves. Each block below names the line it closes.*

- [x] **Acceptance 1 — a missing file FAILs and exits 1, both ways, both reverted.** Each file moved
      out of the repo, the sweep run, the file moved back, `git status --porcelain tools/` showing
      only `tools/wo-sweep.mjs` afterwards. With **`tools/verify-shell.mjs`** moved aside: exit **1**,
      `16 checks · 14 passed · 1 failed · 1 to review`, and *"FAIL | the recorded `check()` call-site
      count matches the harness :: tools/verify-shell.mjs is not where this check expects it — the
      count is now watching nothing, and so is the one-call-per-line check beside it. Restore the file
      or point this check at the new path."* With **`tools/README.md`** moved aside: exit **1**, the
      same `16 checks · 14 passed · 1 failed · 1 to review`, and the same sentence naming
      `tools/README.md` instead. Sixteen rather than seventeen in both, because the one-call-per-line
      check cannot run when the file it reads is gone — which is what its detail line says.
- [x] **Acceptance 2 — the append FAILs, names the line, and the proof is non-vacuous.** A second call
      appended to `tools/verify-shell.mjs:495`, which already held one, leaving the file at the same
      **14,295 lines** and still parsing (`node --check`). The sweep exits **1** at
      `17 checks · 15 passed · 1 failed · 1 to review`, and the two clauses split exactly as the
      criterion requires — the count clause **PASSes**, *"596 `check()` call site(s) in
      tools/verify-shell.mjs, matching tools/README.md:636"*, the same 596 it prints on a clean tree,
      because an append adds no line; and the new clause is the only thing red:
      *"FAIL | one `check()` call per line in the harness :: tools/verify-shell.mjs:495 hold(s) more
      than one `check(` — the count above pushes one entry per line, so a second call on a line that
      already has one moves no number and leaves the count in tools/README.md quietly wrong."*
      Reverted from a byte copy taken before the edit; `git hash-object tools/verify-shell.mjs` equals
      `git rev-parse HEAD:tools/verify-shell.mjs` at `05bd4c06` afterwards.
- [x] **Acceptance 3 — `tools/README.md` states both.** The paragraph under the call-site count says
      the number is a count of lines, that a second call on an occupied line is the one edit that
      moves nothing, and that the new clause is what makes it a count of calls. The paragraph under
      the `wo-sweep.mjs` is **17 checks** sentence says why *that* number is deliberately unguarded:
      the sweep prints its own true figure on the summary line of every run, in a second, in front of
      the reader who is already running it — where the harness's count costs a three-minute browser
      run nobody spends on a README sentence, which is how that one went stale three times.
- [x] **Acceptance 4 — the refusal is recorded.** `tools/README.md` carries both grounds for
      `verify-shell.mjs` not asserting its own summary: a red harness run means the app is broken and
      must not also mean a stale sentence, and §11's failure text already tells the reader to fix the
      executed count from a run, so every check added or removed trips the sweep and hands over both
      numbers. What remains uncovered is named too, so the argument does not have to be rebuilt.
- [x] **Acceptance 5 — the rest of the run is unchanged.** `diff` of the whole run before and after is
      two hunks and nothing else: one added PASS line — *"one `check()` call per line in the harness
      :: 596 call-site line(s) …"* — and `16 checks · 15 passed · 0 failed · 1 to review` →
      `17 checks · 16 passed · 0 failed · 1 to review`. §11's count clause line is byte-identical,
      still PASSing at **596** against `tools/README.md:636`. **No new REVIEW**, and the standing
      sensitive-field-name REVIEW does not appear in the diff at all — still *"181 mention(s) in
      index.html, src/attendance-report.js, src/attendance.js, src/home.js, src/letter-scale.js,
      src/prefs.js, src/presentation.js, src/roster.js, src/scores.js, src/shell.css, src/shell.js,
      src/supports.js, sw.js"*. Exit 0.
- [x] **Acceptance 6 — the harness and `src/` are untouched, by hash.** `git hash-object
      tools/verify-shell.mjs` = `git rev-parse HEAD:tools/verify-shell.mjs` = `05bd4c06c529…`, and
      `git diff --stat -- src/ tools/verify-shell.mjs index.html sw.js` is empty. **No
      `verify-shell.mjs` run was spent**, on the criterion's own instruction: nothing here is reachable
      from a browser, and 177 seconds buys no claim the hash does not already make.

*Three mutations, all reverted:*

| Mutation | Result |
|---|---|
| `tools/verify-shell.mjs` moved out of the repo | **1 red, exit 1** — *"tools/verify-shell.mjs is not where this check expects it"*, where before WO-2.22 this printed `REVIEW` and the run exited **0** |
| `tools/README.md` moved out of the repo | **1 red, exit 1** — the same sentence naming `tools/README.md`; likewise a `REVIEW` and a green run before |
| a second `check('WO-2.22 mutation, reverted', …)` appended to `tools/verify-shell.mjs:495`, on the same line as the call already there | **1 red, exit 1**, and the count clause **green in the same run at 596** — the append moves no line, so the old clause is satisfied and the new one is the only thing red. *"tools/verify-shell.mjs:495 hold(s) more than one `check(`"* |

*The false-`FAIL` shape the work order's Traps warn about was measured rather than assumed before the
clause was written: instrumenting the sweep's own pattern over the harness reports **zero** call-site
lines holding a second occurrence of any shape, and **zero** non-comment lines whose trailing `//`
part mentions `check(` — so the clause is green today for a reason, not by luck. It reads the line as
written, which is why its failure text says so: a trailing comment that came to mention `check(` on a
call line would redden it, and the message names the line so that takes one look rather than a
bisect. Counting occurrences into the number itself, which is the fix that looks obvious, is the one
the Traps refuse — and the count in `tools/README.md` is untouched by this work order for the same
reason: nothing here adds or removes a call site.*

*No 👤 line. Two greps over two files in `tools/` have no iPad half, and nothing in this work order
renders.*

---

### WO-2.24 — Nothing in the tree notices if the shared date reset is deleted

**What this changes.** Nothing a teacher sees: `src/`, `index.html` and `sw.js` are byte-identical to
HEAD. `tools/verify-shell.mjs` gains one helper and three checks. WO-2.23 put a single
`input[type="date"] { -webkit-appearance: none; appearance: none; }` in `src/shell.css`'s BASE
section and seven date fields on four screens depend on it; two of them, the assignment editor's,
also keep an identical copy in `src/assignments.css` on purpose, and those two were the only date
fields anything here had ever read a *style* off. **The other five could lose the shared rule and
every check in the repo stayed green.** Now the computed `appearance` on each is read, at points in
the run where their dialogs are already open.

**The premise was re-measured rather than inherited, and half of it had gone stale.** The work order
says these five fields "live behind `.hidden` dialogs the harness never opens, so nothing measures
them and nothing ever has" — true when it was written, and no longer. WO-2.21 landed in between and
the coarse sweep now opens all three of those dialogs and asserts 44px on every control in them,
with the date fields named in the check messages. **That does not close this hole; it is the hole.**
On the deleted-rule run those three sweeps stayed green — *"every control in the term editor measures
>=44px, date fields included :: measured 22; under = []"*, *"…the days-off panel… date fields and
class picker included :: measured 13"*, *"…the support panel… the kind picker and review date
included :: measured 18"* — while the three new checks went red. So WO-2.23's Trap is no longer an
argument about what a height check would do here. It is a measurement of what the height checks
already in this harness *did* do, on the broken tree, in the same run.

**This is not the check WO-2.23's Traps forbid, and the section above says so at the point where the
refusal is recorded.** The ban is on measuring a date field's **height**: this engine honours an
author's `min-height` on a date input with the reset and without it, so a height check is green on
the broken tree and tells the next reader a rule is guarded when it is not — which is now a
measurement and not a prediction, see the paragraph above. `appearance` is the value that actually
moves between the two trees — `none` with the rule, `auto` without — which is what makes a guard out
of it. **No height, width or touch-target assertion was added to any date field**,
and the reader deliberately prints no box dimensions at all, so a number in a detail line cannot
drift into the claim. The rendered field stays a 👤 line under WO-2.23 forever.

*Evidence for the Acceptance list in `plans/work-orders/phase-2-attendance.md` § WO-2.24 lives here.
Each block below names the line it closes.*

- [x] **Acceptance 1 — all three surfaces, green on the tree as it stands.** `node
      tools/verify-shell.mjs` at `598 checks · 598 passed · 0 failed · 0 skipped`, 14,398 lines,
      24.1 lines per check, 193s, exit 0 — up from `595 checks · 595 passed` on the same tree before
      the three were added. The three PASS lines report *"the term editor is open = true, 2 of 2
      field(s) found :: term-date [date] appearance none, -webkit-appearance none · term-date [date]
      appearance none"*, *"the days-off panel is open = true, 2 of 2 field(s) found :: daysOffFrom
      … daysOffTo … appearance none"*, and *"the support panel is revealed on an open student editor
      = true, 1 of 1 field(s) found :: supportsReviewDate [date] appearance none"*. Each is taken at
      a point in the run where the dialog was **already** open for other reasons, and each asserts
      that it is open, that the expected number of fields matched, and that every one of them is
      laying out a client rect — a `display: none` node cannot answer here, which is WO-2.21's scar
      applied to a style read.
- [x] **Acceptance 2 — the deletion turns it red, and the failure names the field and the sheet.**
      `input[type="date"] { -webkit-appearance: none; appearance: none; }` deleted from
      `src/shell.css`'s BASE section (comment left in place — the "tidy" this guards against),
      `git diff --stat src/shell.css` = `1 file changed, 1 deletion(-)`. The run exits **1** at
      `598 checks · 595 passed · 3 failed · 0 skipped`, and the three red are exactly the three new
      ones — **nothing else in the harness noticed**, which is the whole reason this work order
      exists. Verbatim from the run:

      | Field | Failure detail |
      |---|---|
      | term editor | *"the term editor is open = true, 2 of 2 field(s) found :: term-date [date] appearance auto, -webkit-appearance auto · term-date [date] appearance auto, -webkit-appearance auto — the only rule in this tree that puts `none` there is input[type="date"] { -webkit-appearance: none; appearance: none; } in src/shell.css's BASE section"* |
      | days-off form | *"the days-off panel is open = true, 2 of 2 field(s) found :: daysOffFrom [date] appearance auto, -webkit-appearance auto · daysOffTo [date] appearance auto, -webkit-appearance auto — the only rule in this tree that puts `none` there is …"* |
      | plan Review date | *"the support panel is revealed on an open student editor = true, 1 of 1 field(s) found :: supportsReviewDate [date] appearance auto, -webkit-appearance auto — the only rule in this tree that puts `none` there is …"* |

      Restored with `git checkout -- src/shell.css`; `git hash-object src/shell.css` =
      `git rev-parse HEAD:src/shell.css` = `09f21b55bca9…` and `git diff --stat -- src/` is empty.
- [x] **Acceptance 3 — each check's own message draws the distinction, in its own words.** No
      message cites WO-2.23, a Trap or a line number. The term editor's says the computed value *"goes
      back to the platform's own the moment src/shell.css loses that one line, which is why it is a
      style being read here and not a height: this engine gives a date input the height its
      stylesheet asked for either way, and the height these fields actually draw at is the iPad's
      answer and nobody else's"*; the days-off one says it is *"a claim about the cascade only, never
      about how tall or wide these two fields come out, which is a question this browser answers
      differently from the one on the teacher's desk"*; the Review date's says *"what it does not
      touch is the height the field is drawn at, which this engine gets right whether the rule is
      there or not and which only the device can settle"*. The long form of the argument is in the
      block comment over `dateResetOn()` in the harness.
- [x] **Acceptance 4 — both numbers in `tools/README.md` come off a run.** The call-site sentence
      moves 596 → **599** (three literal sites, none in a loop) and a new paragraph records
      **598 executed**, copied from the summary line above rather than added to the old one. The gap
      paragraph goes `596 − 595 = 1` → `599 − 598 = 1`, unmoved for a third work order running. The
      sweep is what forced the update: on the pre-update tree it printed *"FAIL | the recorded
      `check()` call-site count matches the harness :: tools/verify-shell.mjs has 599 `check()` call
      site(s), up 3 on the 596 recorded at tools/README.md:636"*, exit 1.
- [x] **Acceptance 5 — the sweep prints what it printed before, but for the count.**
      `17 checks · 16 passed · 0 failed · 1 to review`, exit 0, the one REVIEW still the standing
      sensitive-field-name sweep — now at **181 mentions**, the same figure and the same file list as
      the run WO-2.22 recorded. §11's count clause reads *"599 `check()` call site(s) in
      tools/verify-shell.mjs, matching tools/README.md:636"* against 596 before, and the
      one-call-per-line clause *"599 call-site line(s) … none holding a second `check(`"* against
      596. No other line moved: no CSS was touched, so the coarse-block check still reports no new
      selectors, and nothing in `SHELL` changed, so the CACHE-bump check is untroubled.

*No 👤 line, and that is the point rather than an omission. Everything here is a computed style read
in headless Chromium; the thing an iPad would be needed for is the one thing these checks are careful
not to claim, and it is already owed under WO-2.23 § "Why neither harness can see this defect", where
this work order is now cross-referenced so the two read as one decision.*

*`sw.js`'s `CACHE` is **not** bumped: nothing in `SHELL` changed. Only `tools/` and two documents did.*

---

### WO-2.25 — The print gate is answered when it is read, on every surface

**What this changes.** Nothing a teacher sees on screen, and one thing they see on paper: the second
tap of a sitting now prints the right sheet on the **attendance record** and the **student detail**,
as it already did on the grade sheet. `src/print-gate.js` is a new module — one mechanism for all
three surfaces — and `src/attendance-report.js`, `src/detail.js` and `src/grades-report.js` each hand
it their own attribute and a predicate answering whether that surface is on screen. **Every
`PRINT_RELEASE_MS` and every timer around a print attribute is gone from the tree.**

**The bug is WO-3.9's, found by the owner on 2026-08-12 and fixed on one surface only.** Set the
attribute, call `window.print()`, clear it 500ms later — on the reasoning that `window.print()`
blocks while the browser's dialog is up. It does not always. Chrome refuses a repeated `print()`
with *"This website has been blocked from automatically printing"* and a **refused `print()` returns
at once**, so the timer cleared the gate while the teacher read the message and the print they then
allowed came out as **the whole app**. Turning a preview to landscape does it by the other road: the
preview re-generates from the **live DOM**, long after the timer. One mistake, not two — the gate was
*set* when the app asked to print and *read* when the browser actually printed. It is now answered
from a `beforeprint` listener at the moment the page is serialised, by asking the DOM.

**Why the copies went and not just the bug.** The idiom was lifted three times — WO-2.6 wrote it,
WO-3.7 copied it, WO-3.9 copied it again — which is exactly how one mistake came to live in three
places and be fixed in one. **The three attributes stay three** and that part was always right:
`data-attendance-print`, `data-detail-print` and `data-grades-print` each re-show a different
surface. It is the mechanism that stopped being copied, and the module takes the attribute and the
predicate as arguments so that Phase 4's signal lists and Phase 6's glance page cannot arrive with a
fourth timer in them.

**One decision the work order left open, taken here and written down.** `syncAll()` answers **every**
registered gate rather than only the caller's. On `beforeprint` this makes no difference — every
listener fires on the same event — but the belt-and-braces call made immediately before
`window.print()` is the case that matters: a teacher who *blocks* a print outright leaves that
attribute on, and on an engine that fires no `beforeprint` at all, printing a second surface
afterwards would serialise a page carrying two gates. The module still knows nothing about modals,
views or `.hidden`; it holds a list of `{ attr, isOnScreen }` and nothing else.

**The stale `@media print` headers are corrected.** `src/attendance.css` and `src/detail.css` both
described the timer in prose; `src/scores.css`'s header said so, at the point where a reader would
lift it a fourth time, and that sentence is now the census of one mechanism instead.

*Evidence for the Acceptance list in `plans/work-orders/phase-2-attendance.md` § WO-2.25 lives here.
Each block below names the line it closes.*

- [x] **Acceptance 1 — the module exists and no timer clears a print attribute.**
      `grep -rn "PRINT_RELEASE_MS" src/` returns **nothing**. The seven `setTimeout`s left in `src/`
      are `src/attendance.js:987` (the rotation settle), `src/backup.js:328` (the object-URL revoke),
      `src/live-region.js:25`, `src/save-indicator.js:70` (the fade) and `src/store.js:422`, `:423`,
      `:468` (debounce, max-wait, retry). None of them touches an attribute.
- [x] **Acceptance 2 — three surfaces, three attributes, asserted per surface.** One check on each,
      reading all three attributes and the boxes of all three surfaces out of the same snapshot taken
      inside the stubbed `window.print()`: *"at the moment the app asks to print, `<body>` carries
      this surface's own attribute and neither of the other two"* —
      `{"attr":true,"detailAttr":false,"gradesAttr":false,"recordH":407,"detailH":0,"gradesH":0,"headerH":0,"mainH":0}`
      for the record, `data-detail-print = true, data-attendance-print = false, data-grades-print =
      false; #attendanceRecordModal 0px, #gradesRecordModal 0px` for the detail, and the mirror of it
      for the grade sheet.
- [x] **Acceptance 3 — the same five readings on all three, the timed release gone, the run green.**
      `node tools/verify-shell.mjs` at **`674 checks · 674 passed · 0 failed · 0 skipped`**, 16,921
      lines, 25.1 lines per check, 206s, exit 0 — up from 662 on the tree this arrived on. Each
      surface now reads: the gate ON at print time, still on 700ms after the tap, re-armed by a
      `beforeprint` the app never asked for, cleared by `afterprint`, and cleared by a `beforeprint`
      raised while that surface is **not** up.

      **The line says "the two checks that asserted a timed release are gone" and there was only
      one.** The detail section's *"and the attribute comes back off, so the next Ctrl+P is the
      browser's business again"* is deleted here. The attendance section had none to delete — it
      never called `printRecord()` at all, and the one thing it measured about the gate was that
      `<body>` carried no attribute **at rest**, which is green on a build that prints the whole app
      on the second tap. The grade sheet's was already deleted at WO-3.9. Nothing in the harness
      asserts a release now.
- [x] **Acceptance 4 — every new check watched failing.** Thirteen call sites added, one deleted.
      **Four of the thirteen fail on the tree as it stands**; the other nine are shaped as absences
      that the timer build also satisfies — it had already cleared the attribute, so they passed for
      the wrong reason — and were watched failing under three mutations instead. **This box is ticked
      on thirteen of thirteen watched red, not on thirteen of thirteen failing pre-fix**, and the
      table says which is which.

      | Tree | Result |
      |---|---|
      | **The unfixed `src/attendance-report.js` and `src/detail.js`, verbatim as shipped** (`git stash push` on those two files only) | **4 red**, `674 checks · 670 passed · 4 failed`, exit 1. *"the gate is still on while the record is on screen … `<body>` carries data-attendance-print 700ms after the tap = **false**"*, *"a print the browser refused and the teacher then allowed re-gates itself … beforeprint with the record on screen left data-attendance-print on = **false**"*, and the same two on the detail: *"`<body>` carries data-detail-print 700ms after the tap = false"*, *"beforeprint with the detail on screen left data-detail-print on = false"*. **The other nine passed on the broken tree**, which is the point of the rest of this table |
      | `syncAll()` never removes an attribute, **and** the `afterprint` listener stops removing one (two independent edits, one run) | **6 red** — *"`afterprint` clears it … after afterprint = **true**"* and *"a Ctrl+P made when the surface is NOT up clears the gate … left the attribute on = **true**"*, on **all three** surfaces. The two failures are attributable by construction: the first is the listener, the second is the `else` arm |
      | All three print entry points call `window.print()` twice, **and** `syncAll()` sets every gate's attribute whenever any surface is on screen | **7 red** — the three *"one tap … calls window.print() exactly once"* checks at `= 2`, the detail and grade-sheet isolation checks (`data-detail-print = true, data-attendance-print = **true**`; all three true on the grade sheet), and two collateral: *"9 element(s) still drawn outside the sheet"* on the grade sheet and *"4 element(s) still drawn outside #detailView"*, naming `DIV.modal-panel attendance-report-panel` — which is the shared-attribute defect printing the wrong surface, exactly as the three `@media print` headers say it would |
      | `src/attendance-report.js`'s `PRINT_ATTR` set to `data-detail-print` — the Trap, made literal | **3 red.** The attendance isolation check reports `{"attr":**false**,…,"recordH":900,"headerH":**100**,"mainH":**816**}` — the whole app on the page, because the record surface set a gate that re-shows a screen nobody is looking at. The two timer readings go red with it. *(This mutation exists because the previous one cancels itself for the first-registered gate: attendance is `gates[0]`, so the later gates removed the attributes it had just set, and its isolation check stayed green for a mechanical reason rather than a good one.)* |

      **Nine of the thirteen new checks are in those three mutation rows** — four in the first (the
      attendance and detail `afterprint` and not-up readings; the other two red are the grade
      sheet's own, which is this work order re-verifying the surface that already worked), four in
      the second (the attendance and detail one-tap readings, and the detail and grade-sheet
      isolation readings), and one in the third (the attendance isolation reading). Four plus nine is
      thirteen, and every added check has been seen red at least once.

      All four trees restored; `src/print-gate.js` and `src/attendance-report.js` were diffed against
      byte copies taken before each mutation, and the **final green run above was made on the
      restored tree**, not on the tree before the mutations.
- [x] 👤 **Print the attendance record twice in one sitting, and the detail sheet twice**, allowing
      Chrome's block when it appears, and turn one preview to landscape. The right sheet comes out
      every time. **Run by the owner 2026-08-13 and passing on all three readings** — the four
      verbatim results are below, and the same sitting found the *Ignore* defect that correction
      round 2 fixed; the re-run against that fix closes the last box in this section. This is the
      only reading that matters
      and no emulator has it — the grade sheet's identical fix was confirmed this way on 2026-08-13,
      and this is that confirmation asked of the other two surfaces. Expect Chrome to show *"This
      website has been blocked from automatically printing"* on the second tap: **that is the browser
      and not the app**, one tap calls `window.print()` exactly once and there is now a check saying
      so on all three surfaces. What to notice is what comes out **after** you press Allow, and what
      the preview turns into when you rotate it.
- [x] **Acceptance 6 — both numbers off a run, and the sweep otherwise unmoved.** `tools/README.md`
      goes 663 → **675** call sites and 662 → **674** executed, each copied off a summary line rather
      than added up; the gap paragraph goes `659 − 658 = 1` → `675 − 674 = 1`, unmoved for a sixth
      work order. The sweep forced it: before the edit, *"FAIL | the recorded `check()` call-site
      count matches the harness :: tools/verify-shell.mjs has 675 `check()` call site(s), up 12 on
      the 663 recorded at tools/README.md:729"*. After it, **`17 checks · 15 passed · 0 failed · 2 to
      review`, exit 0 — the same line WO-3.9 recorded, but for the count.** Both REVIEWs are the
      standing pair and both were read rather than waved at: the sensitive-field sweep is **191
      mentions across 16 files**, the same figure and the same list as the WO-3.9 run (`src/print-gate.js`
      is not in it — the module names no field and imports nothing), and the due-date REVIEW is
      `src/detail.js:364, src/grades-report.js:509`, the same two lines of printed prose as before at
      new line numbers — `:364` is `git show HEAD:src/detail.js`'s `:349`, moved down by the fifteen
      lines this work order added above it. No CSS selector was added, so the coarse-block check
      still reports no new selectors, and the CACHE-bump check reads *"planbook-shell-v50 is not in
      any commit yet — the bump is uncommitted, which is the rule being followed"*.

*`sw.js`'s `CACHE` goes **v49 → v50** and `./src/print-gate.js` joins `SHELL`. A new file in `src/`
that is not in that list works in every test anybody runs — a live network serves it — and is missing
the first time a teacher opens the app on a plane.*

*One thing that is **not** here, and was not attempted: Chrome's throttle message. It is browser
policy, the work order's Out of scope line settles it, and the reading that says it is not ours — one
tap, one `print()` — is now a check on all three surfaces rather than on one.*

#### Correction round 2 — the owner's own run, and the regression it found (2026-08-13)

**The owner ran the 👤 checklist on her own machine and found a bug this work order introduced.** Her
four results, verbatim:

> ✅ Attendance record printed twice in one sitting, Chrome's block allowed — the record came out, not
> the app.
> ✅ Student grade detail, same, twice in one sitting with the block allowed.
> ✅ Portrait → landscape inside a preview — the sheet survived the rotation.
> ✅ Ctrl+P with no print surface open prints the ordinary page — **verified on the laptop only.**

**The fourth is a desktop-only verification and is recorded as one.** iOS has no Ctrl+P: the shortcut
raises no print dialog on the iPad at all, so nothing on that device can perform that step as written.
The guarantee itself is reachable there by another route — **Share → Print raises the same
`beforeprint`** the gate answers, and that is the version an iPad can actually run. It was not
claimed at the time, because it had not been run; **the owner ran it on 2026-08-13 as part of the
round-2 re-check below, and it passes both ways** — the sheet with one open, the ordinary page with
none.

**And then the fifth thing, which was not on the checklist.** Pressing **Ignore** on Chrome's *"blocked
from automatically printing"* prompt left every subsequent click anywhere on screen re-opening the
print dialog. The cause is one string used for two jobs: `src/print-gate.js` leaves
`data-detail-print` on `<body>` when a print is refused — **which is the fix working as designed** —
and the detail screen's Print button was *also* `data-detail-print`, so `src/shell.js`'s delegated
`e.target.closest('[data-detail-print]')` matched **every** click, because `closest()` walks up to
`<body>`. The deleted 500ms timer had been hiding this for three copies of the idiom by clearing the
attribute within half a second. **The fix that stopped clearing the gate is what made the collision
reachable**, and there was no check for it anywhere.

**Fixed by renaming the button, not by scoping the selector.** `data-detail-sheet-print` in
`index.html`, in `src/shell.js`'s delegated hook and in its attribute census. `button[data-detail-print]`
would have been a smaller diff and would have left the collision live for whoever copies the pattern
next. **The invariant, now written in `src/print-gate.js` where every future print surface reads it: a
gate attribute is never also a click hook.** The other two surfaces have that today only by luck of
naming — `data-attendance-record-print` against `data-attendance-print`, `data-grades-record-print`
against `data-grades-print`.

- [x] **The check that was missing exists, and was watched red before the fix.** One `check()` over
      all three gates at the foot of `tools/verify-shell.mjs`: with that gate stuck on `<body>`, a
      click on three things that are not controls — `<body>` itself, the header's own box, `<main>` —
      calls `window.print()` zero times. Green: `677 checks · 677 passed · 0 failed · 0 skipped`,
      17,011 lines, 25.1 lines per check, 214s.

      | Tree | Result |
      |---|---|
      | **The rename reverted — `data-detail-print` on the button, the hook and the harness's selector, i.e. the tree the owner ran** | **1 red**, `677 checks · 676 passed · 1 failed`. *"with `data-detail-print` stuck on <body> … a click on something that is not a control does NOT print :: window.print() calls per neutral target = `{"body":1,"header.header":1,"main":1}` — printed from ["body","header.header","main"]"*. The attendance and grade-sheet readings passed on that same run, **by luck of naming**, which is exactly why the check asks all three |
      | Two lines added to `src/shell.js` giving the other two surfaces the same collision (`closest('[data-attendance-print]')` and `closest('[data-grades-print]')` beside their real hooks) — a fourth surface's mistake, made literal | **2 red**, `677 checks · 675 passed · 2 failed`, both reading `{"body":1,"header.header":1,"main":1}`. Nothing else moved, which is what makes those two greens above real rather than accidental |

      `src/shell.js`, `index.html` and `tools/verify-shell.mjs` were restored from byte copies taken
      before each mutation and `diff`ed clean; the green run above was made **after** the restoration.
- [x] 👤 **Re-run the printer checklist against this fix, including the Ignore path.** The four
      results above stood for the tree they were run on, and the Ignore path had not been through a
      real printer since. **Closed by the owner 2026-08-13, against correction round 2.** Five
      readings, at a real printer in one sitting: after pressing **Ignore** on Chrome's block on the
      detail sheet, clicking the header and a blank patch of page opened **no** print dialog — the
      regression is gone; the same Ignore probe on the attendance record and the class grade sheet
      is likewise silent; printing twice with the block **allowed** puts the sheet on the paper and
      not the app; a preview turned portrait → landscape is still the sheet; and on the iPad,
      **Share → Print** gives the open sheet with one up and the ordinary page with none — the iOS
      stand-in for the Ctrl+P reading, run on the device for the first time here.

- [x] **Both numbers off a run, and the sweep otherwise unmoved.** `tools/README.md` goes 675 →
      **676** call sites and 674 → **677** executed. The gap paragraph goes `675 − 674 = 1` →
      `676 − 677 = −1` — **negative for the first time in this file's history**, because the three
      new readings come from ONE call site inside a loop over the three gates, which is the second
      bullet of that paragraph outrunning the first and nothing more. The sweep forced the edit:
      *"FAIL | … tools/verify-shell.mjs has 676 `check()` call site(s), up 1 on the 675 recorded at
      tools/README.md:766"*. After it, **`17 checks · 15 passed · 0 failed · 2 to review`, exit 0** —
      the same line as the first round. Both REVIEWs read again: the sensitive-field sweep is the
      same **191 mentions across the same 16 files**, and the due-date REVIEW is
      `src/detail.js:369, src/grades-report.js:509` — the same two lines of printed prose as the
      first round's `:364`, moved down five by the comment added over `PRINT_ATTR`. No CSS selector
      was added, so the coarse-block check still reports no new selectors, and no control was added,
      so there is no 44px work in this round.

*The sweep for the same collision elsewhere found **nothing else**. `src/print-gate.js` is the only
module in the tree that writes an attribute to `<body>` at all (`grep -n "body.setAttribute" src/`),
so the three gates are the only attributes any `closest()` can pick up from an ancestor of everything.
Cross-referencing all 141 delegated `closest('[data-…]')` hooks in `src/shell.js` against every
`data-` attribute written in `index.html` and in `src/*.js` leaves two hooks carried by a container
rather than a control — `data-pill-group` and `data-backup-drop`, both `<div>`s — and both are
deliberate: they exist to catch clicks on their own children, and nothing else in the tree sets
either string. Every other hook is written on the control it belongs to.*

*`sw.js`'s `CACHE` stays at **v50**, set in the first round and still uncommitted. `planbook-shell-v50`
appears in no commit, so no installed app has ever fetched a shell under that name; the bump made for
the first round carries this round's `index.html` and `src/shell.js` into the same still-unshipped
version. A v51 would name a version nothing ever served. The sweep agrees in as many words:
*"planbook-shell-v50 is not in any commit yet — the bump is uncommitted, which is the rule being
followed"*.*

---

### WO-2.9 — The elapsed clock, the overdue alerts, and the pass history

**What this adds.** Three things on top of the pass banner WO-2.11 shipped. The **elapsed clock** —
the big orange `m:ss` figure in the slot that card has been holding open — computed from the stored
time out on every paint and never counted up. **Two overdue alerts** at five and ten minutes: the
card lights amber and then red, and each one is announced once. And a **pass history**: one dialog
behind 🚪 Passes in the registry toolbar, carrying every student's trips in this class and, one tap
in, one student's own trips with their times, minutes and notes. Names on that dialog disappear in
presentation mode — the first surface in the app where a NAME rather than a support field is what
the switch hides.

- [x] **Elapsed time is correct after the app has been backgrounded for ten minutes.** 👤 — closed by
      the owner 2026-08-14 on the installed app; see the sitting below. The desk half is measured and
      is the strongest form a desk has: the stored stamp is wound 41 minutes into the past through
      the store while no timer is running, and the next paint reads `41:0x`. A build that counted
      ticks reads `0:0x` after the same fixture.
- [x] Both alerts fire **once each**, not repeatedly, and **not again after the student returns**.
      All three clauses measured: the level is written on the pass (`alerted: 1|2`), three seconds
      of ticks over the same threshold announce nothing new, and a student who comes back and goes
      out again gets a pass with no `alerted` key at all.
- [x] A trip that crossed **both** thresholds while nothing was running escalates straight to the
      second alert — one announcement, not two — and the sentence says how long it really has been
      (41 minutes), never which threshold was crossed.
- [x] The history view's totals match the log, student by student and in total. The expected numbers
      are computed **in Node** off `doc.passes`, so the dialog is compared with the record rather
      than with the module that drew it.
- [x] A hand count of one student's passes agrees: one row per trip, the stored minutes, the note
      typed on the card under the row it belongs to, and a trip that ended in a dismissal marked as
      one rather than reading "back after 4 minutes".
- [x] **A cancelled pass appears in no history view and in no total.** A trip is issued, noted with a
      phrase nothing else in the document uses, seen on the card, and cancelled — and the dialog's
      rows, footer and subtitle are exactly what they were, with the phrase nowhere in it.
- [x] **Presentation mode suppresses names in the history view**, in both readings: no name in the
      class table, no door into a student, and the strip saying why. The counts stay, which is the
      deliberate difference from a support surface (where even the count is a disclosure).
- [x] And the guard is in the module rather than in the absent button: calling `openStudentPasses()`
      directly under presentation mode names nobody either.
- [x] Flipping the mode back off brings the same names and the same doors back to the same open
      dialog — which is what makes every absence above a suppression rather than a screen that
      cannot draw one.
- [x] The elapsed figure did not cost WO-2.11's single-row card: three cards at the cap, in both
      orientations under a coarse pointer, still one row, with the figure measured at 52px and the
      row not spilling through its own box.

*Desk pass 2026-08-13: `verify-shell.mjs` **732 of 732, 0 failed, 0 skipped**, 241s — up from 714
executed, seventeen new call sites (sixteen in a new section at the foot of the hall-pass block, one
inside the pass-card sweep's two-orientation loop). `wo-sweep.mjs` **17 checks · 15 passed · 0 failed
· 2 to review**, exit 0; both REVIEWs are the standing pair, and `src/pass-history.js` joins the
sensitive-field-name list on its header prose alone — it holds no path to `student.supports` and
imports nothing that does.*

*Everything is driven through the controls a teacher touches: the passes are issued and returned from
the real buttons, the note is typed into the card's own field, the dialog is opened from the 🚪 door
in the toolbar and its student view from the name in the table, and presentation mode is flipped with
the real header control. Two exceptions, both named at the check: the wind-back that stands in for a
suspended device goes through the store (a desk cannot suspend an installed PWA), and the student view
under presentation mode is called through the seam, because it deliberately has no button there.*

*Four mutation proofs, run before this was written:*

| Mutation | Result |
|---|---|
| the elapsed figure **accumulates** a count per tick instead of subtracting from the stamp — the Traps line's own defect | **6 red**, the first reading `the card now reads "0:02"` where the stamp says 41 minutes; both alert thresholds stop being reachable with it |
| alerts fire off the elapsed time (`level > 0`) instead of off the level stored on the pass | **2 red** — the live region repeats the same sentence three seconds later, and the "starts clean" check hears it too |
| `cancelPass()` writes a zero-minute return — WO-2.11's forbidden defect | **5 red**, four of them WO-2.11's own and the fifth this work order's: the cancelled student gains a row and the footer goes from 10 trips to 11 |
| `src/pass-history.js` stops asking `presentationMode()` for names | **1 red** — four names on the projected dialog, doors still absent, which is why the check reads names rather than counting buttons |

*All four were reverted and the run above is green on the shipped tree.*

*One check was written wrong first and the run caught it, which is worth recording because it is the
vacuous-fixture failure in a new place: the presentation check searched for `First Last` and this
dialog draws `Last, First`, so it reported **0 names with the mode off** — the precondition, not the
assertion, is what failed. It now searches **both spellings** of every name in the document, which is
also what makes the student view's own heading (`First Last`) covered. And the note-row clause on the
per-student check was **true and vacuous** on the first green run — the busiest student had no notes —
so a second check now picks the student who has one and asserts the row under the trip.*

*One harness reading is deliberately a poll rather than a fixed wait, per `tools/README.md` trap 5: a
headless page that has been open for minutes is a background page to Chrome and its timers are
budget-throttled, so a 1-second interval measured over a fixed 1.4s window really did report "no
tick" on a build that ticks. The claim being made is that the figure advances on its own, not that it
advances on a particular second — the second is what the device this ships to gives it.*

**The 👤 iPad sitting this work order owes.** Neither the harness nor a stylesheet can answer these.

- [x] **Elapsed time is correct after the app has been backgrounded for ten minutes.** Issue a pass
      on the installed app, note the time out, switch to another app (or lock the iPad) for ten
      minutes, and come back: the figure must read ~10:00 and not ~0:0x or the number it had when
      the app went away. This is acceptance line 1 and no emulator can answer it — nothing has ever
      suspended a headless browser. 👤
- [x] The two alerts are noticeable from across a room without being alarming: amber at five, red at
      ten, on a card among two others. 👤
- [x] A pass that goes overdue while the iPad is asleep announces **once** on the way back in, not
      twice and not on every tap afterwards. 👤
- [x] The 🚪 Passes door, the names inside the dialog and the ← back control all clear 44px under a
      thumb, and the door does not spill through its own border in the toolbar beside ⌨ Keys and
      🖨 Record — the "Days off" failure, on the sixth control in that row. 👤
- [x] The history dialog is readable held at arm's length with a guardian beside you, and
      presentation mode leaves it usable rather than blank. 👤
- [x] VoiceOver reads an overdue announcement as a sentence about a student, and the elapsed figure
      is not read out as a pair of numbers on every tick (it is `aria-hidden`; the Return button
      beside it carries the time out in full). 👤

*The six 👤 lines were run by the owner in one sitting on 2026-08-14, on the installed home-screen
app, and all six passed. **One of them was a question rather than a check and came back an answer.**
The presentation-mode strip tells a teacher to turn the mode off "in the header," and the header sits
under the modal overlay — so the first tap closes the dialog and the second reaches the control. That
is not the dead first tap it was written up as: the dialog visibly disappearing is the feedback, and
the owner read the three-step walk (close, toggle, reopen) as the sensible flow. **It is also the
safer geometry** — a mode flip that reached through an open dialog would repaint names in front of
whoever is sitting there. The strip's wording still describes one action where there are three; that
was raised, and the owner left it as it stands on 2026-08-14.*

---

### WO-2.26 — The Student Report screen shows the hall passes

**What this adds.** A **hall-pass card inline on the Student Report screen** — WO-3.7's per-student
grade page, reached from a student's own name on the score grid or from *Grades for …* inside the
attendance history dialog. It sits last in the right-hand column, under the attendance card it is
not, and it lists every trip that student took in the open term with its date, its clock, its minutes
and the note that was typed on it. Behind no tap: the trips are on the page a teacher is already
reading. The **attendance history dialog** keeps a one-line count of the same trips — *"Hall passes ·
4 trips · 14 minutes out"* — and that is all it keeps.

*This work order was re-cut by the owner on the day it was built.* Its first cut put the count line
**and a 🚪 Every trip door** on the attendance history dialog; the re-cut deleted the door, because
the breakdown now has one home and one room with two doors is two rooms to the teacher who found the
second one first. **The 🚪 Passes dialog in the registry's toolbar is untouched** and is still the
class-wide, year-wide view it has always been.

**Two decisions, both recorded in the code that makes them.**

- **The card and the count line are both scoped to the open term** (owner, 2026-08-14): the whole
  screen answers one question about one stretch of time, and a year-wide list would be the only
  thing on it that does not. The date window lives in `src/passes.js` and nowhere else, so no screen
  in this app holds a second opinion about what a term is. A term with **no dates set** falls back to
  the whole year in `attendanceCard()`'s own words — *"this term has no dates set, so this is every
  trip on the year"* — rather than in new ones.
- **The trips print with the grade.** The sheet is the screen; a card the teacher and the guardian
  have just read together, silently missing from the page the guardian takes home, is the worst kind
  of disagreement. The reasoning is written where the gate is, in `src/detail.js` § PRINTING A VIEW.
  `studentCsv()` is deliberately untouched — a column of trips in the file is a separate decision
  with its own reasons on both sides, and it would be a work order rather than a line here.

- [x] The Student Report screen lists the trips **inline** — one row per trip in the open term, the
      minutes that were stored, and the note that was typed under the row it belongs to, with **no
      dialog open over it**, which is what makes "behind no tap" a claim about where the list is.
- [x] It is built as `attendanceCard()`'s sibling and not as a table bolted to the page: a titled
      `.detail-card` carrying its own count, the note underneath, last in the right-hand column.
- [x] The list is the **open term's**. A trip planted sixty days outside the window is on the log and
      on the year-wide 🚪 Passes view, and it is **off the card** — asserted four ways, because each
      fails differently: the note on that trip is absent, the count is the term's (`4 trips · 14
      minutes out`) and not the year's, the card covers one day where the log covers more, and the
      note names the term. *(The fixture is the point of this line. Every trip the run authors falls
      on today, so before this the scoping was invisible and a check that cannot fail when
      `passesForStudentInTerm()` is reduced to `passesForStudent()` is not a check. The app's own two
      readers are asked through the seam as well.)* *(**WO-2.27 planted a second out-of-window trip,
      after `term.end`**, because both of WO-2.26's fell on or before it and the upper bound
      therefore had nothing to exclude. The figures in this line moved with it: the year now reads
      `6 trips · 32 minutes out` over three days, the seam answers 4 against 6, and both sentinel
      notes are asked for separately.)*
- [x] The attendance history dialog shows the **same count and no door**: its line and the card's
      title are the same string character for character, `🚪 Every trip` is gone from the dialog, and
      no label reconciles the two — the number is one number because it is one call.
- [x] A term with **no dates set** falls back to the whole year in the attendance card's existing
      words. Asserted on the *same* term, stripped of its two dates and repainted, so what changed
      between the two readings is the window and nothing else.
- [x] The trips **print with the grade**: at the instant the sheet is taken, `data-detail-print` is
      on, the hall-pass card has a box (239px over a 138px table of five rows, beside a 63px hero),
      the rows are the term's, and the note typed on a trip is on the paper. *(A measurement under
      emulated print media in a headless window. The paper itself is the 👤 line below.)*
- [x] Presentation mode takes the card's list **and** its count off the Student Report screen — on
      the screen **already open** rather than at the next navigation, which is `src/shell.js`'s
      standing instruction obeyed — and says why, on a page that otherwise still draws in full.
- [x] And off the **attendance history dialog** too, on a dialog otherwise still drawn in full.
- [x] Both have a negative control: flipping the mode back off brings the same list and the same
      count back to the same card and the same line, which is what makes each absence a suppression
      rather than a screen that could not draw one.
- [x] A student with no trips is **stated as none on both surfaces** — `Hall passes · none` on the
      dialog, and a card that says *"No hall passes are recorded for this student in …"* rather than
      an empty table. Roll Call! omits its inline table when there are no passes
      (`dashboard.html:4718`); that is the half deliberately **not** lifted, because a missing block
      reads as "this build does not show that" rather than as "none".
- [x] The room behind the class dialog's own per-student door still strands nobody: called for a
      student the log never mentions, it says there are none and offers the ← back to the class.
- [x] The card holds **no control at all** — no button, no link, no field, nothing focusable —
      measured on the card as drawn, which is the only honest reason a new block on a touch screen
      owes no 44px floor. `.attendance-report-door` still declares its 44px **by name** in the coarse
      block for the two controls that do wear it: WO-3.7's *Grades for …* and WO-2.9's *← All
      students*.
- [x] `src/attendance-report.js` **and** `src/detail.js` both still import nothing from
      `src/supports.js` and hold no path to `student.supports`. Both greps come back empty on the
      shipped tree; every occurrence of either string in either file is prose in its own header,
      arguing why. The card and the count line are built by `src/pass-history.js` and handed over
      already built, which is the arrangement `src/assignments.js` has with
      `src/accommodation-prompt.js` one screen over.

*Desk pass 2026-08-14: `verify-shell.mjs` **746 of 746, 0 failed, 0 skipped**, 245s — fourteen call
sites inside the existing hall-pass section, replacing the first cut's eight, which asserted the door
the re-cut deleted and were **not** re-run. `wo-sweep.mjs` **17 checks · 15 passed · 0 failed · 2 to
review**, exit 0; both REVIEWs are the standing pair.*

*Two things the run itself is the record of, and both are worth reading.* **The first cut's harness
did not fail, it crashed** — its first check clicked the deleted door, `clickSel` threw, and the run
died before WO-2.3 and everything under it with no summary printed. The replacement asks for every
door with `has()` before it clicks one, and a fixture that does not land now fails one check and
skips the rest by name. **And the crash was hiding a real defect:** WO-2.6's *"every print rule is
gated"* check went red the moment the run got that far, because the first cut's eight
`body[data-detail-print]` rules for the trip table live in `src/attendance.css` — correctly, since
that is where those class names live — and that check demanded `data-attendance-print` on every one
of them. It now sorts rules by which surface's attribute gates them; ungated is still a failure, and
the borrowed arm is counted so that losing it goes red rather than reading as a tidier stylesheet.

*Everything is driven through the controls a teacher touches: the dialog is opened from a student's
name in the registry, the card is reached through the *Grades for …* door, the way back is the
screen switcher, and presentation mode is flipped with the real header control. Two exceptions, both
named at the check. The trip sixty days in the past is written through the store, because no control
in this app sends a student out last June — the same door this section already opens to wind a stamp
backwards, and both planted trips and the class's own terms are put back at the foot of the block.
And the trip view for a student with **no** trips is called through the seam, because the app
deliberately draws no button there to call it with.*

**The 👤 iPad sitting this work order owes.** Neither the harness nor a stylesheet can answer these.

- [x] The **printed page matches the decision**: print a student's report from the iPad and check the
      hall-pass card is on the sheet, that the table has not been cut across a trip, and that the
      column heads repeat if it breaks onto a second page. 👤
- [x] The card **reads at arm's length beside a guardian**, and the Student Report screen still reads
      as one page rather than as a page with a table bolted to it — four cards down two columns, with
      the trips last. 👤
- [x] The trip table is legible under a thumb on the real device: it wears `.attendance-report-table`
      and takes its coarse sizes from `src/attendance.css`'s own block, which was tuned inside a
      dialog and has never been read inside a card. 👤

### WO-2.27 — Where the pass work says one thing and does another

**What this changes.** Nothing a teacher can see. Four comment debts left behind by WO-2.9 and
WO-2.26 — a promise the code beside it did not keep, a standing instruction with an undocumented
exception, a harness comment pointing at a reload that does not exist, and a hook inventory missing
seven of its own rows — plus **two checks that could not fail**, which is the half that matters: a
comment that lies is found by the next reader and a green check that proves nothing is found by
nobody.

**The one thing here that is a mechanism rather than a fix** is the new sweep rule. Four of these
debts were found by a person reading and thinking *"that looks odd"*. The inventory is the only one a
script can hold, and it is the only one that had recurred — silently, across at least two work
orders. **The diff runs one way only**: an attribute found in a `closest('[data-…')` call and absent
from the census is a real omission; the reverse comparison turns up twenty-two entries that are
mostly *correct* documentation (value-carrying companions, form and field hooks reached by
`matches()`, three gate attributes named in prose on purpose, and one that is `docs/data-model.md`
read out of a sentence). The asymmetry and its reasons are written at the check.

- [x] `src/attendance.js`'s *"a run with an empty room costs nothing at all, not one timer doing
      nothing once a second"* is true of **every** path out of `paintPassBanner()`. The early return
      taken when the banner is not in the document now stops the clock too, and there is a check that
      drives that exact path — the banner's `id` is blanked for the length of one repaint, and the
      interval is watched through wrappers on `setInterval`/`clearInterval`, because the id lives in
      a module variable no harness can read. It reads `["paintPassElapsed"]` → `[]` → `["paintPassElapsed"]`.
- [x] **Re-cut rather than closed, and the finding is the reason (owner, 2026-08-14).** The line read
      *"navigating off the registry with a pass open leaves no interval running"*. It still does, and
      whether it should is now **WO-2.28**. `#attendancePassBanner`
      is static markup in `index.html` and `src/views.js` hides views rather than removing them, so
      leaving the registry never reaches that early return at all — nothing calls `paintPassBanner()`
      on the way out. And the ticks are **not** no-ops there: the cards the last paint left in the
      banner are still in the document, so `paintPassElapsed()` keeps recomputing from the stamps and
      keeps firing **WO-2.9's two overdue alerts**, on whatever screen the teacher is standing on.
      Standing the clock down when `currentView() !== 'class'` is four lines and would silence the
      overdue alert everywhere but the registry — a teacher entering scores with a student twenty
      minutes gone is the case that alert is *for*. Written down at `startPassClock()`. **Two things
      the close then turned up, both booked into WO-2.28**: off the registry that alert reaches a
      screen-reader user only, since `announce()` writes into `.sr-only` and the tinted card is on a
      hidden banner; and switching class while off the registry silences it for *both* classes until
      the registry is repainted, because `afterClassChange()` repaints only the screen on view.
- [x] A reader of `flipPresentationMode()` can tell **why WO-2.9's hall-pass history is not
      registered there** without opening a dispatch result file: the surface is a modal, and
      `.modal-overlay` is `position: fixed; inset: 0` at `z-index: 1000` while the header is
      unpositioned normal flow with no `z-index` at all — so the flip cannot happen while that
      dialog is up. The first tap closes it, the second reaches the control. Walked on the iPad by
      the owner on 2026-08-14, and named as the safer behaviour: a flip reaching through an open
      dialog would repaint names in front of whoever is sitting there. *(The work order recorded the
      header as `z-index: 999`; that value is `#loadingScreen`. The conclusion is unchanged and the
      real reason is stronger, so the comment states the geometry rather than the number.)*
- [x] `tools/verify-shell.mjs`'s *"not repeatedly"* check says what it actually rests on. It claimed
      *"a build that fired off a variable would say it again after the reload below"* and there is no
      reload below — the nearest `Page.reload` is thousands of lines away in either direction. What
      settles record-versus-variable is the **key set** on the pass one check above,
      `alerted,classId,id,note,out,studentId,type`, and that is what the comment now names.
- [x] `src/shell.js`'s hook inventory holds all seven that were missing — WO-2.9's three
      (`data-pass-history`, `-history-all`, `-history-student`) and four older ones from WO-2.6
      (`data-attendance-history`, `data-attendance-record`, and that record's print and CSV
      controls). 142 delegated attributes, all findable in the census.
- [x] **`wo-sweep.mjs` goes red when a delegated hook leaves the inventory.** Proved rather than
      asserted: the `data-pass-history-all` row was deleted from `src/shell.js` in a copy of the tree
      and the sweep failed with *"data-pass-history-all (src/shell.js:1422) — delegated by the one
      listener and absent from the census at src/shell.js:17"*, **exit 1**. *(In that copy the two
      git-backed checks REVIEW rather than pass, because the copy has no `.git`.)*
- [x] **The term window's upper bound is load-bearing.** A third trip is planted sixty days *after*
      `term.end`, and with it there `passesForStudentInTerm()` reduced to its `from` bound alone —
      one deletion — turns the suite red: **741 of 748, 7 failed**, exit 1, in a copy of the tree.
      The same deletion against the pre-WO-2.27 tree is the reason this line exists; that run is
      recorded below. All three planted trips come off the log at the foot of the block.
- [x] The hall-pass card is asserted present on the Student Report screen **reached from the score
      grid** — `#scoresBody [data-student-detail="…"]`, the route a teacher uses most — and not only
      on WO-2.26's own route through the attendance history dialog. One assertion on a walk WO-3.7's
      block already takes; it reads `["Where the grade comes from","Missing work · 10 points at
      stake","Attendance · 83%","Hall passes · none"]`.

*Desk pass 2026-08-14: `verify-shell.mjs` **748 of 748, 0 failed, 0 skipped**, 245s, exit 0 — two new
call sites, in two different sections, neither in a loop. `wo-sweep.mjs` **18 checks · 16 passed · 0
failed · 2 to review**, exit 0; both REVIEWs are the standing pair. `wo-gate.mjs --audit` and
`--self-check` both clean.*

*Three runs, and the third is the one worth reading.* Dropping the `to` bound against the tree **as
it stood before this work order** — the same deletion, on WO-2.26's own fixture, in a tree checked
out of `HEAD` — left the suite **green: 746 of 746, 0 failed, exit 0**. That is what "a check that cannot fail" means, and it is why the fix is a planted
trip rather than an extra assertion: **a bound with no trip beyond it is decoration.** WO-2.26's
verifier had proved *a* filter load-bearing by deleting the whole thing (739 of 746); proving one
bound is not proving both.

**No 👤 line.** Nothing here changes a pixel, a touch target or a printed page. The one thing a
device would add is confirming the modal stacking by hand, and the owner already walked it on
2026-08-14 — which is the fact the new comment records.

---

### WO-2.28 — The pass tick reads the document, not the banner

**What this changes.** One guard, in `paintPassElapsed()`. It used to be `if (!node) return;` at the
top of the per-pass loop, which was written for the empty-banner case and killed **the overdue alert**
along with the text write. It now wraps the two DOM writes only, so the threshold comparison, the
`fired` collection and the single `update()` run for every open pass of the open class, card or no
card. **The alert is computed from the year document; the cards are only where figures get written.**

**What a teacher gets.** A pass left open while she moves to Scores or a student's detail still
alerts, and — the case this is really for — an installed iPad that iOS suspended, coming back on a
screen that is not the registry, alerts **on the way in** rather than waiting for the registry to be
painted. The delay it removes was unbounded: it lasted as long as she stayed off the registry.

**What it does NOT do, and the line matters:** it fixes who the alert is *computed* for, not who can
*perceive* it. `#srLive` is visually hidden by design, so off the registry a sighted teacher is still
told nothing. That is **WO-2.29**, and this work order deliberately does not claim it.

*Desk pass 2026-08-14: `verify-shell.mjs` **752 of 752, 0 failed, 0 skipped**, 249s, exit 0 — four new
call sites, all in the existing WO-2.9 hall-pass block, none in a loop and none a failure arm.
`wo-sweep.mjs` **18 checks · 16 passed · 0 failed · 2 to review**, exit 0; both REVIEWs are the
standing pair.*

**The mutation, and this is the count Acceptance line 2 asks for.** Restoring `if (!node) return;` to
the top of the loop — the exact pre-fix code — turns the suite **red at 751 of 752, one failure**:

> *"with no banner node for the pass, the document still drives its overdue alert while the registry
> stays unpainted"* — reporting `alerted = undefined` and the live region **still holding the hush
> sentinel**, i.e. nothing announced at all.

**One red rather than four**, and the arithmetic is the point: the other three new checks stay green
under that mutation, because the Scores walk's card is still in the banner and the fixture and restore
checks do not depend on the guard. A check that went red along with it would have been a check about
the banner rather than about the alert. `src/attendance.js` was restored byte-identical afterwards
(md5 `2bc9914f76939da6729e1cfbb10e572e`).

*The fixture assumption that would hide a bug here, named as the verifier's standing question asks:
the hole is punched in the DOM by hand rather than reached through the app. Three things it does
break — a banner still holding the node (asserted 0 before the stamp moves **and** after the alert
lands), a pass carrying a stale `alerted` (cancelled and re-issued onto a fresh record), and a
registry repaint during the poll (`registry shown = false` asserted at the read). What it cannot
reach is the app-level route, for the reason recorded in the backlog row on the `list[0]` fallback.*

**No 👤 line.** The static preconditions were ruled out rather than deferred: the `visibilitychange`
listener exists (`src/attendance.js:3039`), the interval is started (`:2921`), and `sw.js` carries
`planbook-shell-v58` so an installed iPad will actually receive the fix. The physical residue belongs
to WO-2.29's iOS `AudioContext` unlock, not here.

---

### WO-2.29 — The overdue alert gets its primary channel back

**What this changes.** A new module, `src/alert-sound.js`, holding Roll Call!'s two alert tones
(`dashboard.html:3448`–`3508`) at its own frequencies, note counts, durations and gains, its iOS
`touchstart` unlock, and the `soundsOn` preference. `paintPassElapsed()` asks it for a tone at a level
and knows nothing else about it. A speaker button joins the header beside presentation mode.

*This section is two rounds, and it is written in the order they happened. The `touchstart` unlock
named above **is gone** — the 👤 run below failed and falsified the premise it was built on. What
replaced it is at **THE CORRECTION** at the foot of this section; the tones, the preference and the
control are the same as they were. Read the failed run before the correction: it is the evidence.*

**What a teacher gets.** The alert reaches her when she is not looking at the registry, which since
WO-2.28 is where it is computed and where it was still inaudible. And one tap silences it for a test.

- [x] Crossing either threshold plays its tone, and the two are distinguishable from each other.
- [x] `announce()` still fires at both thresholds with the same sentence, and its comment now names
      itself the accessible equivalent of the sound (WCAG 1.4.1) rather than the alert.
- [x] `soundsOn` silences the tone and leaves the announcement and the card tint alone; it is
      `planbook_soundsOn` and the string never appears in the year document.
- [x] The tone is asserted through the `alertSoundLog()` seam, and both thresholds' arms were watched
      failing under mutation (below).
- [x] No comment in `src/attendance.js` still says this app has no sound.
- [ ] The alert is audible on the teaching iPad from an installed PWA, on a screen that is not the
      registry, after the app has been backgrounded and resumed. 👤

*Desk pass 2026-08-14: `verify-shell.mjs` **756 of 756, 0 failed, 0 skipped**, 254s, exit 0 — four new
call sites in the existing WO-2.9 hall-pass block, none in a loop and none a failure arm.
`wo-sweep.mjs` **18 checks · 16 passed · 0 failed · 2 to review**, exit 0; both REVIEWs are the
standing pair, and the sensitive-name REVIEW now lists `src/alert-sound.js` for two lines of prose —
a cross-reference to `src/supports.js` and a sentence saying this module is never handed a student.
Neither emits anything; the module has no student data in it at all.*

**What the seam measures, and what it cannot.** *[Every figure in this paragraph is true, and none of
it was evidence of a sound — it is the reading that stayed green through the failure two blocks below.
What the seam can and cannot say is restated honestly under **THE CORRECTION**.]* `alertSoundLog()`
records an entry only after the
oscillators have been constructed, connected and **started** on a real `AudioContext`, and carries how
many there were and the context's state. On this run that reads
`{"level":1,"notes":10,"first":660,"peak":0.32,"played":true,"oscillators":10,"state":"running"}` and
`{"level":2,"notes":12,"first":700,"peak":0.4,"played":true,"oscillators":12,"state":"running"}` —
the audio path ran end to end on a live context. **No machine heard anything and none can.** Whether
a room hears it is the 👤 line.

**The mutations, and they are two because the acceptance line says *either* threshold.** Both are one
line of `src/attendance.js`, the `playOverdueAlert()` call gated to a single level:

| mutation | result | what went red |
|---|---|---|
| fires at level 2 only | `756 · 754 passed · 2 failed` | *"each threshold asks for its own tone"* (`1 tone(s) requested`) and *"with the sound off the tone is not played"* (`what the tick asked for = []`) |
| fires at level 1 only | `756 · 754 passed · 2 failed` | *"each threshold asks for its own tone"* (`1 tone(s) requested`) and *"turning it back on is the same one tap"* (`what the tick asked for = []`) |

**Two red rather than four each time**, and the split is the point: the checks that stayed green under
each mutation are the ones about the *other* threshold. A check that went red under both would have
been a check about the module rather than about a threshold. `src/attendance.js` was restored
byte-identical afterwards (md5 `e065501fb1ac2354a3b81a2bed2d242f`).

*The fixture assumption that would hide a bug here: the two winds are the escalation walk's own, and
the mute walk rides on the fresh quick pass the "starts clean" check leaves behind — so nothing here
plants a pass or a level by hand. What it does assume is that `alertSoundLog()` is written by the same
code path the device runs, which is why the entry is pushed inside `playToneSequence()` after the
oscillators start rather than by the caller.*

**The 👤 line, and exactly what closes it.** *[SUPERSEDED — this recipe tests a mechanism that no
longer exists, and its "tap once more to tell the prime dying from the prime never taking" is the
distinction the run below replaced. Kept because it is the recipe that produced that run. The current
one is at the foot of this section.]* On the teaching iPad, from the installed PWA (not
Safari), with the header speaker un-slashed: send a student out, tap **anything once** (that is the
unlock), move to **Scores**, background the app for six minutes, and come back. **Pass:** a tone on
the way in — five two-note beeps — with the pass card still tinted behind it. **Fail:** silence, with
the card tinted and the sentence in the live region, which is the pre-WO-2.29 behaviour. If it fails,
the primed context did not survive the suspend: the design already re-arms the primer on
`visibilitychange → visible`, so the next screen touch after the resume should restore it — tap once
more and cross the ten-minute threshold to tell "the prime died and re-arming works" apart from "the
prime never took at all". Either finding goes in this section.

**👤 RUN 2026-08-14 — FAILED. The premise this module is built on is false on current WebKit.** The
alert was silent on the teaching iPad at both thresholds, backgrounded and not, while the same build
sounded on the laptop. It is neither of the two things the section above anticipated: not the suspend,
and not Silent Mode.

An isolated probe (`tools/audio-probe.html`, served on a second port so the service worker could
not swap the page out) ran `playToneSequence()`'s exact note pattern four ways on the iPad. Safari,
`standalone PWA: false`, `audioSession API: yes, type=auto`:

| probe | log | heard |
|---|---|---|
| 1 — context built **inside** the tap | created `suspended` → `resume() RESOLVED` → `running`, `currentTime=0.99` | **audible** |
| 2 — context built 8 s **after** a tap | created `suspended` → `resume() RESOLVED` → `running`, `currentTime=0.84` | **SILENT** |
| 3 — primer first, then 8 s | created `suspended` → **no `resume()` settlement at all** → `suspended`, `currentTime=0.00` | **SILENT** |
| 4 — `<audio>` element, in the tap | `play() resolved` | **audible** |

**Read 1 against 2: identical logs, opposite outcomes.** The only difference is that 1's context was
constructed inside the user gesture and 2's was constructed eight seconds later. So a context created
outside a gesture reports `running`, advances `currentTime`, and starts its oscillators onto no
output. `src/alert-sound.js`'s comment at the unlock — *"WebKit then treats the document as one whose
audio was started by a gesture and lets later contexts run"* — is what this run falsifies. The silent
primer buffer buys nothing, because what carries is the **context**, not the document.

Probe 1 being audible is what rules out Silent Mode and the ambient session: raw Web Audio was heard
on this device, so the mute switch is not the story and `navigator.audioSession` is not the fix.

Probe 3 adds a second defect on top: `resume()` **hung** — neither resolving nor rejecting — on a
context created after the primer had already minted and closed one. `currentTime` never left 0.00.
iOS caps concurrent `AudioContext`s, and this module mints one per alert (`playToneSequence()`) and
another on every `visibilitychange → visible`, so the budget is spent by ordinary classroom use.

**Why the harness reported green throughout.** `alertSoundLog()` records that oscillators were started
on a context reading `running` — which is exactly what silent probe 2 reported. The seam cannot
distinguish audible from inaudible, the implementer said so (*"No machine heard anything and none
can"*), and this 👤 line is the only thing that could have found it. It did.

**What the fix has to be**, and it is a shape change rather than a tuning: one `AudioContext` created
inside the first gesture, held for the life of the page, never `close()`d, with every later tone
scheduled on that same context; `visibilitychange` resumes that one context instead of priming a new
one, and re-arms a touch listener for the case where a resume outside a gesture does not restore
output. Carried by WO-2.29's correction round.

*Also worth checking separately: Roll Call!'s `dashboard.html:3451`–`3462` is the origin of this
unlock and Planbook's is a faithful lift of it, so that app's 5- and 10-minute tones may have been
failing the same way on iPad, masked by its visual banner. It is the live classroom fallback.*

**THE CORRECTION, 2026-08-14 — one context, born in a gesture, held for the life of the page.**

**What changed, and it is only the unlock.** `src/alert-sound.js` now constructs an `AudioContext` in
exactly one place, `unlockAudio()`, which runs from a `touchstart` / `pointerdown` / `keydown`
listener and from nowhere else. That one context is held for the life of the page and **never
`close()`d** — the close-on-a-timeout that came across with the lift is what spent iOS's cap — and
every later tone is scheduled on it. `visibilitychange → visible` **resumes that same context**
instead of priming a new one, and re-arms the listener **unconditionally**, because a context reading
`running` after an interruption is exactly the thing this section has just learned not to trust. An
alert arriving before the page has ever been touched schedules nothing and records `state: "locked"`
rather than minting a context that would be silent (probe 2) and would cost a slot (probe 3); in this
app that gap is nearly hypothetical, since sending a student out is a tap and the pass has to be five
minutes old before anything asks for a tone. `keydown` joins the two touch events so that a teacher
driving the app from a keyboard is not left permanently locked.

**The tuned half of the lift did not move.** Frequencies, note counts, durations and gains are
unchanged, and `playToneSequence()`'s scheduling loop is still Roll Call!'s line for line. The
departure is argued in the module at the point of departure, with the probe table above named as the
evidence that beats the lifted rule — which is what `CLAUDE.md` asks of a Roll Call! rule that must
not come across.

**Two `visibilitychange` listeners now, and their order is load-bearing rather than lucky.**
`src/attendance.js` imports `src/alert-sound.js`, so the sound module's body — and its listener —
evaluates first, and listeners fire in registration order: coming back from a suspend, the context is
**resumed before `paintPassElapsed()` computes the alert that the same event fires**. That is written
into the module, because importing the other way round would silently reverse it.

**What the seam can now assert, and what it still cannot.** `alertSoundLog()` is unchanged in kind,
and it is the reading that said `played: true, oscillators: 10, state: "running"` throughout a silent
iPad — so on its own it never was evidence of a sound, and nothing here pretends otherwise. Each entry
now also carries `ctx` (how many contexts the page had constructed when the tone was scheduled) and
`ctxTime` (that context's own clock at that moment), and a second function `alertAudioState()` reports
the mechanism: contexts constructed, whether the held one was born in a gesture, its live state, its
clock, and whether the touch listener is armed. **None of that is audibility.** What it is, is the
shape the fix turns on, and it is machine-checkable where a sound is not.

*Desk pass 2026-08-14 (correction): `verify-shell.mjs` **757 of 757, 0 failed, 0 skipped**, 243s,
exit 0 — one new call site, in the same WO-2.9 hall-pass block, not in a loop and not a failure arm.
`wo-sweep.mjs` **18 checks · 16 passed · 0 failed · 2 to review**, exit 0; both REVIEWs are the
standing pair, `src/alert-sound.js` still on the sensitive-name list for the same two lines of prose,
and the CACHE check reads `planbook-shell-v60` — bumped from v59, without which the installed iPad
would keep serving the build that failed and would fail line 6 for a reason that is not audio.*

The new check reads:

> *both tones were scheduled on the ONE AudioContext the first gesture made — the alerts and the
> wake-ups mint no others, and nothing closes it* :: before the winds
> `{"contexts":1,"origin":"gesture","state":"running","currentTime":12.731,"armed":true}`, after them
> `{…,"currentTime":13.432,…}`; the five-minute tone was scheduled on context 1 at its clock 12.901s
> and the ten-minute tone on context 1 at 13.171s; `src/alert-sound.js` constructs a context at
> line(s) `[162]`, in `"function unlockAudio() {"`

**The mutations, and the first one is the whole argument for this round.** Both are `src/alert-sound.js`:

| mutation | result | what went red |
|---|---|---|
| `playToneSequence()` mints its own context again — **the build that shipped and failed** | `757 · 756 passed · 1 failed` | only the new check: *"the five-minute tone was scheduled on context 1 at its clock **0s** and the ten-minute tone on context 1 at **0s**"*, and two constructor call sites |
| the `visibilitychange` handler mints and closes a context, as the shipped one did | `757 · 756 passed · 1 failed` | only the new check, and **only its source clause**: `line(s) [162,210]`, *"(2 constructor call sites)"* — every dynamic reading was identical to the green run |

**One red each time, and the four checks from the first round stayed green under both** — which is
not a weakness in this round's check, it is the fact this whole entry exists to record. Mutation 1 is
the field failure reproduced exactly: the tones are requested, at the right frequencies, in the right
order, with ten and twelve oscillators started on a context reading `running`, and on an iPad it makes
no sound. A harness cannot tell that apart by listening. It can tell it apart by the clock: `0s` says
the context was born at the alert, `11.901s` says it was born at a tap and kept.

Mutation 2 is the honest limit stated as a result: a context minted **outside** the module's own
unlock moves none of the numbers, because nothing in the page can observe a construction it was not
told about. That is why one clause of the check is read off the source — exactly one
`new (window.AudioContext …)` in the file, and the nearest function declaration above it must be
`unlockAudio`. It is the clause a future edit is most likely to break and the only one that catches
that shape. `src/alert-sound.js` was restored byte-identical after both
(md5 `f49d75845807edce9dbfdf16d9beb5bc`, the file both mutations departed from); the delivered file is
that plus one line of comment rewrapping (md5 `d14cd751221b16ca30933f10b8acdc48`), and the desk pass
above is a run of the delivered file rather than of the one the mutations used.

*The fixture assumption that would hide a bug here, named as the verifier's standing question asks:
the context under test is made by the section's own taps rather than by anything this check does, and
`audioBefore` is read **before** either wind so that "older than the alert" is a comparison against a
reading rather than against a number written into the harness. What it assumes is that the browser
under CDP treats `Input.dispatchMouseEvent` as a real gesture — if it ever stopped doing so, the
context would never be constructed, `contexts` would read 0 and every tone would record `locked`, so
the assumption fails loudly rather than quietly. What it cannot reach is the only question that
matters on the device: **whether a sound left the speaker.***

**The 👤 line, and exactly what closes it now.** *(This replaces the recipe above; the old one tests a
mechanism that no longer exists.)* On the teaching iPad, from the **installed PWA** (not Safari), with
the header speaker un-slashed. **First confirm the device actually has this build** — an iPad still on
`planbook-shell-v59` is running the build that failed. Two legs, in this order, because they separate
the two things that could be wrong:

**Leg 1 — the mechanism, no suspend.** Open a class, send a student out on a pass (that tap *is* the
unlock — there is no separate "tap anything once" step any more, which is the point), move to
**Scores**, and stay there without leaving the app. At five minutes: **Pass** = five two-note beeps
while Scores is on screen. **Fail** = silence. A failure here says the held context does not sound
from outside a gesture on this device at all, and the suspend is irrelevant — the alert would have to
be *held* until the next touch instead of played, which is a queue and a work order of its own.

**Leg 2 — Acceptance line 6 proper.** Same setup: send a student out, move to Scores, **background the
app for six minutes**, come back. **Pass** = a tone on the way in, with the pass card tinted behind it
on the registry. **Fail** = silence, card tinted, sentence in the live region.

**If leg 1 passes and leg 2 fails**, the resume outside a gesture does not restore output after an
interruption on this device: tap once anywhere after coming back and stay past the ten-minute
threshold. If the second tone then sounds, the re-arm is doing its job and what is owed is deferring
an alert to the next gesture rather than playing it into a dead context. If nothing sounds even after
that tap, with the speaker un-slashed and Silent Mode off, it is not the unlock at all —
`tools/audio-probe.html`'s probe 1 answers in one tap whether raw Web Audio can sound on that device
today. **Serve it from a second port**, not from 8443 and not from the deployed origin: `sw.js`
answers every navigation with the cached shell, so the app opens instead of the probe and nothing
looks wrong. Whatever happens, it goes here.

**What this correction still cannot prove.** That a room hears anything. No machine heard the tone,
none can, and the seam that says `running` is the same seam that said `running` all through the
failure above. Every claim added this round is about the *mechanism* — one context, born in a gesture,
never closed, carrying both tones — and the mechanism being right is a necessary condition for the
sound, not a sufficient one. Line 6 stays open and stays 👤.

**👤 RUN 2026-08-14, second sitting — PASSED. Line 6 closes.** Both legs on the teaching iPad, from
the **installed** PWA in standalone, service worker active: the five-minute tone sounded while the
teacher stayed in the app and off the registry (leg 1, the mechanism), and a tone sounded on the way
back in after the app had been backgrounded for six minutes (leg 2, line 6 as written). The card was
tinted behind it, as it was in the failing run. The correction works on glass.

*What the build under test was, stated precisely because the last round's lesson was that an
imprecise reading is worse than none.* The app was installed from **the LAN server at
`192.168.50.142:8443` serving `planbook-shell-v60`**, not from `planbook.hwgteach.com` — that origin
was on `planbook-shell-v51` at the time of the run and had received neither this work order nor
WO-2.28. The origin's hostname is not what line 6 asks about: what it asks about is an installed PWA
in standalone with its own service worker, surviving an iOS suspend, and a LAN-origin install
exercises all three. **What this run therefore does not cover** is the deployed artefact itself —
Cloudflare Pages' headers, the precache as `verify-deploy.mjs` reads it, and the update path from an
older installed shell. Those are that tool's question and the deploy's, not line 6's.

*And the thing that was actually proven, against the failure above:* the shipped-and-failed build
put an audible tone on the laptop and silence on the iPad from the same source. This build sounds on
both. The variable that changed between them is the one the correction changed — where the
`AudioContext` is born — which is what makes this a fix rather than a coincidence.

---

## Phase 3 — Gradebook

*Phase goal: grades entered once or twice a week, in minutes, for five classes.*

WO-3.1 is the first entry here; WO-3.2 through WO-3.10 append theirs as they land. Append; don't
restructure.

Grade math gets hand-computed cases, not spot checks: an all-excused category, a zero-point
assignment, a term with one assignment, and a document where one category has no assignments at
all (its weight redistributes).

### WO-3.1 — Categories & weights

- [x] A new class arrives with four starter categories that already total 100%, so the warning is
      off on a class nobody has touched.
- [x] Weights of 40/35/25 show no warning; changing 25 to 20 warns and names the total as 95%.
- [x] The warning names the number rather than calling the weights invalid, and it blocks nothing —
      no error line, no disabled field.
- [x] The warning is on two surfaces: the banner in the editor, and a badge on the class-manager row
      behind it.
- [x] Two classes carry different category sets, weights and names without interference; the four
      untouched classes stay at 100%.
- [x] Add, rename, reorder and remove all work, and a category added arrives at 0% without
      reweighting the ones already there.
- [x] Removing a category with nothing filed under it takes one tap; removing one that holds work
      warns first and counts the assignments and scores it takes.
- [x] Cancelling that warning writes nothing — `rev` does not move.
- [x] Weights survive a reload and come back out of IndexedDB, warning and all.
- [x] Weights that are right only in decimal (40.1 + 34.7 + 25.2) are called right.
- [x] The categories editor is thumbable on the tablet — the 58px weight field in particular, and
      Remove beside a one-glyph arrow. 👤
- [x] iPadOS offers a numeric keypad for the weight field, and the spinner is reachable. 👤
- [x] The amber banner and the row badge are legible on a projector from the back of a room. 👤
- [x] The categories panel reads correctly on the tablet in both orientations. 👤
- [x] Offline launch with the network off, `categories.js` served from the precache. 👤
- [x] The removal confirm's counted form is read against real assignments, once WO-3.3 can create
      them. 👤 *(Split off the orientation line above on 2026-08-09 rather than ticked with it: the
      two were one line, one of them impossible until WO-3.3, and a single box cannot be honestly
      ticked for both. See the carried-forward limit at the foot of this section. **Read on the iPad
      2026-08-09**, the same day WO-3.3 landed the assignments it needed — the counted branch is
      reachable at last, since a category with nothing filed under it is removed with no dialog at
      all.)*

*Not ticked, and owed to WO-3.4/WO-3.5 rather than to a device: the work order's acceptance lines 2
and 4 both name a **displayed grade**, and nothing in this app renders a percentage yet. See the
note under those lines in `plans/work-orders/phase-3-gradebook.md`.*

*The desk half is `verify-shell.mjs`, **449 of 449** with zero skips, 21 checks added here and one
re-pointed. That re-point is the interesting one: `each one arrives with … its other collections
present and empty` asserted `categories.every(n => n === 0)` because `src/classes.js` seeded none on
purpose, in a comment naming this work order as the condition it was waiting for. It now asserts the
starter set and, more to the point, that the starter weights total 100 — a class arriving with the
warning already on would make the warning the ignorable state.*

*Five mutations, all reverted:*

| Mutation | Result |
|---|---|
| `isBalanced()` compares `weightTotal(cls) === 100` instead of within `BALANCE_EPSILON` | **1 red** — the decimal case only, which is the point of the tolerance |
| `newClass()` seeds `categories: []` again | **2 red**, then the section aborts with no rows to click |
| `removeCategory()` cascades unconditionally, never opening the confirm | **2 red** — the warning and the cancel |
| `afterCategoryChange()` dropped from `shell.js`'s typing chain | **3 red** — the manager row keeps a stale total behind the panel |
| the warning prints "these weights are invalid" instead of the total | **3 red** — every check that asserts the number |

*The first of those is worth its own note, because the first draft of that check proved nothing.
It used 12.5 + 87.5, which sums to **exactly** 100 in binary — it went green against the
strict-equality mutation. The set now used (40.1 + 34.7 + 25.2) was found by search rather than
guessed. This defect appears for some decimal weightings and not others, and never for the round
numbers anyone reaches for first.*

*The touch-target standing check was re-run for this feature. WO-3.1's new controls are the
Categories button on each manager row, and inside the editor the name field, the weight field, the
two reorder arrows, Remove, "Add a category", and the removal confirm's two buttons. The weight
field is the one this could plausibly have got wrong — an `<input type="number">` is drawn by the
browser with a spinner inside it and inherits no height from the row it sits in — so it carries its
own 44px with the vertical padding zeroed, keeping its 58px width. The persistent total is measured
too, but for legibility and for `scrollWidth > clientWidth` rather than for 44px: it is a sentence,
not a target, and the "Days off" spill from the first iPad sitting is the failure it is being asked
about.*

*One limit carried forward, the same one WO-1.6 recorded about its delete confirm. The counted form
of the removal warning — "9 assignments and 214 scores" — cannot be read on a real document yet,
because nothing creates an assignment until WO-3.3. It is exercised at the desk against fixtures
written through the store, and is owed a human read once there is real work to count.*

### WO-3.2 — Letter-scale editor

- [x] The door is in the class manager, document-level, and opens the panel over it — Escape closes
      the bands and leaves the manager up.
- [x] The panel lists the bands the document holds, twelve of them, and no boundary is written down
      anywhere but `src/store.js`'s seed.
- [x] Every band shows the range it works out to: the top one reads "and up", and every other stops
      where the band above it starts.
- [x] A seeded scale draws the positive note rather than a warning — a teacher who has decided
      nothing is not greeted by a complaint.
- [x] Typing 89.5 into the A boundary while A− still sits at 90 is caught **in the editor**: the note
      names A−, and A−'s own row reads "never reached" in amber.
- [x] The mapping agrees with that warning rather than working around it — 89.4 is the band *below*
      the stranded one, because nothing sorts the list to be helpful.
- [x] With A− moved below it, 89.5 is an A and 89.49 is an A−. So is 89.4999.
- [x] The boundary is stored as `89.5` — a number, not 90 and not `"89.5"` — and the field and the
      range beside it both say 89.5.
- [x] A faulty scale blocks nothing: no error line, every field live, and the only two disabled
      controls are the reorder arrows at the ends of the list.
- [x] A band added arrives at 0% with **no boundary invented for it**, and the note says at once that
      the scale is out of order.
- [x] A letter containing markup stays text.
- [x] Removing a band takes one tap and opens no dialog — nothing is filed under a band.
- [x] Reordering changes no boundary at all: moving the bottom band up strands the one it passed, and
      moving it back repairs the scale.
- [x] Raising the lowest boundary is caught as a gap at the bottom, and a percentage below it gets
      **no letter** rather than an invented one.
- [x] The subject row offers "Every class" and every class on the bar — an archived class is not
      offered, and keeps whatever override it had.
- [x] A class with no override is shown the bands it uses, read-only, with the door to give it its own
      and no "Add a band".
- [x] Turning the override on copies the bands that already applied; turning it off writes `null`
      rather than an empty array.
- [x] A per-class override applies to that class only: 94% is one letter in that class and another in
      every other class and document-wide, and exactly one class holds an array.
- [x] With the document scale up, the panel names the classes that have their own bands.
- [x] The bands survive a reload — the document scale and the class override both come back out of
      IndexedDB.
- [x] The editor is thumbable on the tablet: the 64px letter field beside the 66px boundary field,
      Remove beside a one-glyph arrow, and the subject pills. 👤
- [x] iPadOS offers a numeric keypad for the boundary field, and **89.5 can be typed into it** —
      `step="any"` rather than a whole-number step, which is the whole point of the feature. 👤
- [x] The amber "never reached" chip and the standing note are legible on a projector from the back
      of a room. 👤
- [x] The panel reads correctly on the tablet in both orientations with twelve bands in it, and the
      row does not spill sideways at 44px a control. 👤
- [x] Offline launch with the network off, `letter-scale.js` served from the precache
      (`planbook-shell-v35`). 👤

*The desk half is `verify-shell.mjs`, **473 of 473** with zero skips: twenty-two checks in a new
letter-grades section and two in the coarse-pointer sweep. Three of them are worth knowing about.*

***The mapping is read through the seam, and that is not a shortcut.*** *Nothing in this app displays
a grade — no engine (WO-3.4), no assignments (WO-3.3), no grid (WO-3.5) — and WO-3.2 forbids building
a preview over student data to demonstrate one. So "89.5 is an A" is asked of the exported
`letterFor()` after the boundary has been typed into the real field. That is also the only way to tell
a build where the ranges on screen come out of the exported mapping from one where the panel does its
own arithmetic and the export WO-3.4 will import says something else.*

***No boundary is written down in the harness except the ones it types on purpose.*** *The seeded
scale is compared against what came out of the document, because 90/80/70 belongs in seed data and
nowhere else — a check asserting `93` would be a second copy of a school's grading policy living in a
tool.*

***One fixture proved nothing until a mutation said so, which is WO-3.1's float-tolerance footnote
happening again in a new place.*** *The check that the scale is never sorted behind the teacher probed
89.4 and 89.6 — and a `letterFor()` mutated to sort descending answers both of them identically,
because reordering an A at 89.5 above an A− at 90 changes nothing below 90. That mutation turned
**nothing** red across all 473 checks. The probe that catches it is 92, where the list says A and a
sorted list says A−; it is now the third clause of that check.*

***`letterScale` is read as what the field HOLDS, not as a boolean.*** *`null` is the sentinel, an
array is an override, and `undefined` is a class stored by a build older than this work order — the
restored class in row 1 of the manager is exactly that. The first draft asserted `=== null` for every
class that has no override and went red on that one for a reason that had nothing to do with the
claim. Distinguishing the three is also what makes "turning the override off writes `null` rather than
an empty array" a check rather than a hope.*

*The touch-target standing check was re-run for this feature. WO-3.2's new controls are the Letter
scale door in the class manager, and inside the editor the subject pills, the override switch, the
letter field, the boundary field, two reorder arrows and Remove per band, and "Add a band" — 69
controls measured on a coarse pointer, none under 44px in either direction. Two of them are the ones
this could plausibly have got wrong: the boundary field is an `<input type="number">`, the control the
categories and term editors have each had to be told about once already, and `.pill` carries a coarse
height with no width, so a subject pill reading "AP" would have been half a target until the subject
row pinned it. The standing note and the derived range chip are measured too, but for legibility and
for `scrollWidth > clientWidth` rather than for 44px — they are prose, and the "Days off" spill from
the first iPad sitting is the failure they are being asked about.*

*Four mutations, all reverted:*

| Mutation | Result |
|---|---|
| `letterFor()` sorts the scale descending before matching — the tidying "fix" | **0 red** as first written, **1 red** once the 92 probe went in. See the note above; this is the one that matters |
| `editBandField()` rounds the boundary to a whole percent on the way in | **4 red** — 89.5 becomes 90, the stored boundary, the mapping, and the reload |
| `enableOverride()` stores the document array by reference instead of copying it | **3 red** — the isolation check, the reload, and turning the override off |
| the note says "this scale is invalid" instead of naming the band nothing reaches | **1 red** — the check that asserts the letter is in the sentence |

*One limit carried forward, and it is the one this work order cannot close by itself: **the letters
have never been read beside a percentage on a screen**, because nothing draws one yet. The mapping is
verified at the desk through the exported function and by the ranges the editor prints; a human read
of a letter next to a grade — and the re-key against the SIS that "no separate rounding rule" exists
for — is owed to WO-3.5.*

***The five 👤 lines were run in one sitting on 2026-08-09** on the installed iPad, in the order the
verifier set them: offline launch first, then the decimal keypad, then a thumb on every control of one
band row, then the stranded band read from the back of a room with the projector on, then twelve bands
in both orientations. All five pass. The keypad line is the one that could have gone either way —
`step="any"` is what makes 89.5 typeable, and a whole-number step would have failed here rather than
at the desk.*

***And the rounding prohibition is now actually guarded, which it was not when this section was first
written.*** *The desk note above says the fourth acceptance line is a grep; `verify-shell.mjs` said
that grep was "made in `tools/wo-sweep.mjs`", and the sweep had no rounding check at all. The line had
been read by hand once, in the dispatch, and the comment turned that reading into a standing guard
nobody was standing. `wo-sweep.mjs` § 10 now makes it real, in three clauses, and the split between
them is the design: **a round-to-whole-percent option is a hard FAIL** anywhere in the app, in either
word order (`roundGrades`, `gradeRounding`) — there is no version of that identifier that wants a
human's opinion. **`src/letter-scale.js` rounding anything at all is a hard FAIL**, which is only its
own header's promise made checkable. **Rounding anywhere else on the mapping path is a REVIEW, not a
FAIL**, because WO-3.4's engine will legitimately want `Math.round` to draw "87%" and a check that
went red on display formatting would be switched off inside a work order. Comment lines are excluded
from all three, or the prose stating the prohibition — which names `toFixed` and `Math.round` in order
to forbid them — would be read as the violation. `wo-sweep.mjs` is **15 checks, 14 passed, 0 failed, 1
to review** — the standing sensitive-field-name line, which now also names `letter-scale.js`, for a
comment citing `roster.js`; that module reads and emits no student data.*

*Four mutations against the new clauses, all reverted — the same discipline as the fixture above,
since a guard written to answer an audit is exactly the kind that goes green at nothing:*

| Mutation | Result |
|---|---|
| `const roundPercentToWhole = Math.round(94.6)` in `src/letter-scale.js` | **2 FAIL** — the option clause and the module clause, exit 1. **Proves neither on its own:** the line carries both signals at once, an option-shaped name *and* a rounding primitive |
| a `gradeRounding` setting read in `src/letter-scale.js`, no rounding primitive anywhere near it | **1 FAIL** — the option clause alone |
| `const shownAt = Math.round(94.6)` in `src/letter-scale.js` — a neutral name | **1 FAIL** — the module clause alone |
| `Math.round(87.4)` added to `src/shell.js`, which imports the mapping | **1 REVIEW, 0 FAIL** — surfaced by file:line with the question framed, and the run still exits 0 |

*Rows 2 and 3 are the ones that carry the proof, and row 3 exists because the owner asked which two
checks row 1 had turned red. **It was the wrong question to be unable to answer.** Row 1 mutates one
line that trips both clauses, so it cannot show either working alone — and row 2 had already shown the
module clause **passing** while the option clause failed, which left the module clause never once
fired on its own. A neutrally-named `Math.round` is the case it exists for, and until row 3 was run
nothing had asked it. This is the 89.4/89.6 fixture above happening to the guard written to answer for
it: a check whose evidence cannot distinguish its own clauses is evidence of less than it looks.*

*Row 2 is still the one that matters for the rule itself. A guard that only fires when a rounding call
is present would miss what the Traps line actually forbids — the **option**, which can be added a whole
work order before anything rounds.*

### WO-3.3 — Assignments, and the switcher between a class's screens

- [x] The assignment list is a **view** in `<main>` — a sibling of the class grid and the registry,
      toggled by `.hidden` — with no `role="dialog"`, no `aria-modal`, and no overlay open behind it.
- [x] One tap on the strip's *Assignments* segment gets there from the registry, and one tap back
      returns; the class manager is never involved.
- [x] The strip carries **three** segments — Attendance · Assignments · Scores — on both class
      screens, with no fourth and no student among them. *(As shipped at WO-3.3, *Scores* was drawn
      disabled and said why, because its view did not exist. WO-3.5 built the view and the segment
      became live — reworded 2026-08-10 at that work order's correction round 1, where the segment was
      found still disabled and the check that would have said so was asserting the disabling.)*
- [x] The strip sits on the white panel under the title, not in the navy header.
- [x] An empty list says so in words, naming the class and the term, with no table drawn.
- [x] A new assignment arrives with **both dates empty** — in the document and on both fields — and
      nothing anywhere fills one in. There is no "next meeting" and no term-start default.
- [x] It lands in the open class, the open term, and one of that class's own categories.
- [x] `0` typed into the points field is stored as `0`: not refused, not defaulted, not blanked. It
      survives closing the editor, redrawing the list and a full reload.
- [x] A 0-point row says **Extra credit** in words, so a lone zero cannot read as a slip.
- [x] An assignment name carrying markup renders as text, and so does a category name in a group head.
- [x] Every empty category is drawn with its own consequence in words — the weight redistributes —
      and a category at 0% says something else, because there the redistribution is a no-op.
- [x] An assignment moves between categories through the editor's `<select>`, the row redraws under
      its new group head, and its score column is byte-identical afterwards.
- [x] The coverage column counts entered cells against the class roster: 1/N and 0/N, not a guess.
- [x] Tapping another term in the header nav **repaints the list**: the other term's work goes, the
      summary line and the caption name the term now open, and switching back brings the work back.
      *(Added at correction round 1, 2026-08-09. Before it the chip in the header moved and the table
      did not — every row, the caption and the summary went on describing the term just left.)*
- [x] Duplicating into another class writes a **new** assignment with a new id, the target class's
      own term, and **no score column**. The source is untouched.
- [x] The copy carries the target's own category — matched by name — and **never** the source's
      category id. Where no category of that name exists there, it lands unfiled and the dialog says so.
      *(Un-ticked by the verifier on 2026-08-09 and **earned back the same day**, at correction round 1.
      Its finding stands as written: only the refusal was exercised, because no class in the fixture was
      ever named like another, so `matchCategory()` only ever took its `return ''` path and a version of
      it that returned `''` unconditionally would have passed every check in this section. The fixture
      now builds both cases instead of hoping for one — the source's category is renamed through the
      real name field to a name no other class has, and the target is then given a category of that same
      name through the real category manager, so the copy's `categoryId` can be told apart from the
      source's id for one name. The mutation the verifier named was run: **`matchCategory()` returning
      `''` unconditionally turns two checks red**, the proposal and the copy.)*
- [x] The duplicate dialog never **displays** a category it will not file the copy under. With no
      category of that name in the target, the control shows *— choose a category —* rather than the
      target's first category, and every real category below it is a change away from what is shown.
      Picking one moves the proposal onto it and takes the placeholder away with it.
- [x] The copy carries the points and both dates across unchanged.
- [x] Work belonging to another class never appears on this class's list, even when it wears this
      class's category id and this class's term id.
- [x] A category removal counts only the work in **its own class** — "1 assignment", not 2 — so a
      teacher never agrees to destroy work in a class the dialog does not name.
- [x] The ↑ ↓ arrows reorder an assignment inside its own category, and the document order is the
      order drawn.
- [x] Deleting warns first, counts the scores it takes, and names the assignment on the button.
      Cancelling writes nothing — `rev` does not move. Confirming takes the assignment and its score
      column and nothing else.
- [x] **Opening a class lands on Attendance every time.** Leaving one class on Assignments, opening a
      second and coming back lands on Attendance both times — there is no per-class memory.
- [x] Entering from a home card does the same, and so does a reload: `planbook_openView` never holds
      anything but `class`, because every class screen is written down as that.
- [x] "All classes" works from the assignment list and empties the strip on the way out.
- [x] The five controls in an assignment row are separable under a thumb, and Delete is not shoulder
      to shoulder with Edit. 👤 *(This is `design/mockups/README.md`'s open question 4, drawn wide on
      purpose. The coarse block gives each one 44px and widens the row's gap to 8px; whether that is
      enough at nine rows is a device question.)*
- [x] iPadOS offers a numeric keypad for the points field, and `0` is typeable on it. 👤
- [x] The date picker's **Clear** works on both date fields — the WebKit quirk `data-term-field`
      already answers for terms, answered here the same way and never tested on the hardware. 👤
- [x] The switcher is readable and tappable in both orientations, and does not push the panel title
      off the top in portrait. 👤
- [x] The amber "nothing filed here" note and the red "not in a category" note are legible on a
      projector from the back of a room, and neither reads as an error. 👤
- [x] Offline launch with the network off, `assignments.js`, `screen-nav.js` and `assignments.css`
      served from the precache. 👤
- [x] In the duplicate dialog on the iPad, a target class with no category of that name opens its
      category picker on *— choose a category —*, and choosing a real one from iPadOS's own wheel
      files the copy under it. 👤 *(Added at correction round 1, 2026-08-09, and read on the hardware
      the same day — a second, shorter sitting, because it arrived after the first one. iOS renders a `<select>` as a native picker and fires `change` on Done only
      when the value moved, which is the platform form of the defect this fix answers: with the
      placeholder showing, every real category is a move. The desk half is measured, the wheel is
      not.)*

***The six 👤 lines above them were run in one sitting on 2026-08-09** on the installed iPad, over
`tools/serve-https.mjs`. All six pass. The date-picker **Clear** is the one that was riding on an
assumption rather than on evidence — `data-term-field`'s answer to the WebKit quirk was copied to
both assignment date fields and had never been put on the hardware, and it holds. **The seventh 👤
line came later, with correction round 1, and is owed to a sitting of its own.***

*Three lines are not ticked and are owed to other work orders rather than to a device — see the note
under the Acceptance list in `plans/work-orders/phase-3-gradebook.md`. Lines 1 and 2 each name a
**grade** and nothing in this app renders one yet (WO-3.4, WO-3.5). Line 7's second sentence names a
screen that does not exist: there is no per-student detail to enter or leave, so the breadcrumb cannot
be shown appearing and then going. What is verified instead is the rule's safe direction — a name set
through `setDetailBreadcrumb()` with no detail open is drawn on neither strip — and WO-3.7 gained an
Acceptance box for the half that needs its screen.*

*The desk half is `verify-shell.mjs`, **515 of 515** with zero skips, 42 checks added in one new
section. Four of them needed a fixture the run does not otherwise leave behind, and each fixture is
asserted to be real before the claim that stands on it. The only class carrying students is the one
restored from a pre-WO-3.1 backup, which has neither terms nor categories and so cannot hold an
assignment, so the section adds two students through the real roster form and removes them again at the
end — deliberately not to the 26-student class the attendance section counts. The duplicate needs one
category name held by two classes and one held by only one, so it renames the source's category through
the real name field and then adds a category of that name to the target through the real manager. The
term switch needs two terms and adds one through the real term editor if the run has left only one.
All of it comes down at the foot of the section.*

*Seven mutations, all reverted:*

| Mutation | Result |
|---|---|
| `assignmentsOf()` filters by `termId` alone — the `classId` guard dropped | **1 red** — a foreign assignment appears on this class's list |
| `confirmCopy()` carries the source's `categoryId` into the target class | **1 red** — the trap check, and nothing else notices |
| `matchCategory()` returns `''` unconditionally — no name is ever matched | **2 red** — the proposal, and the copy that lands unfiled where a twin exists |
| `removalCounts()` in `src/categories.js` filters by `categoryId` alone | **1 red** — the confirm counts 2 assignments where 1 is in that class |
| a typed `0` falls back to the 100-point default | **3 red** — the field, the row's Extra credit badge, and the reload |
| `REMEMBERED_AS` stops collapsing a class screen to `class` | **1 red** — the reload comes back on the assignment list |
| `selectClass()` keeps the screen the browser was last on | **2 red** — the second class, and coming back to the first |

*The third row is correction round 1's, and it is the mutation the verifier asked for by name: it is
the one that would have passed the first cut of this section unnoticed. The three checks added at that
round were also run against the code **as it stood before their fixes**, both reverted together —
`copySelect()` without its placeholder option and the `[data-term-select]` branch without its repaint —
and three went red: the term switch, the dialog's proposal, and the dialog's display. The attribution is
unambiguous by what each check reads, but they were reverted in one run rather than two.*

*The first row is the one worth keeping, because **the check it turned red went green on the first
run of that mutation.*** The planted foreign assignment originally carried the target class's own
`termId`, so the term filter beside the guard was already excluding it and the guard under test could
be deleted with nothing to show for it. A naive duplicate copies everything and changes the class, so
the honest adversary shares the term as well as the category — the fixture now plants the source's own
open term, and only the `classId` guard can keep the row off the list. This is the WO-3.1 float-
tolerance footnote and the WO-3.2 89.4/89.6 footnote happening a third time, in a third place: **a
fixture that cannot express the failure is not evidence**, and only a mutation run says which kind you
have.

*The touch-target standing check was re-run for this feature. The new controls are the three segments
of the switcher, the "+ New assignment" button, the five controls in each assignment row, the four
fields and one `<select>` in the editor, the class pills and two `<select>`s in the duplicate dialog,
and the two buttons in each of the two confirms. `wo-sweep.mjs` REVIEWs eleven new selectors as having
no coarse-block rule; every one of them is a container, a column-width floor or a text badge —
`.assign-panel`, `.assign-body`, `.assign-actions`, `.assign-table-wrap`, `.assign-col-name`,
`.assign-col-entered`, `.assign-extra`, `.assign-bar`, `.assign-bar-fill`, `.assign-group-head`,
`.assign-field-wide` — and not one of them is tappable. The controls inside them are covered, either
by their own rule in `src/assignments.css` or by `.class-action-btn` and `.pill` in `src/shell.css`.*

*One limit this work order closes for somebody else, and it is worth naming: **WO-3.1's carried-forward
limit — the counted form of the category-removal warning, which had never been read against a real
assignment — now has real assignments to count.** The desk half is measured here, and **the human read
of "9 assignments and 214 scores" against work a teacher actually created was done the same day** —
the box under WO-3.1 is ticked. The counted branch was unreachable before this work order for a reason
worth keeping: a category with nothing filed under it is removed with no dialog at all.*

### WO-3.5 — The score entry grid

- [x] The grid is a **view** in `<main>` — a sibling of the class grid, the registry and the
      assignment list, toggled by `.hidden` — with no `role="dialog"`, no `aria-modal`, and no
      overlay open behind it. `.modal-panel` is 480px; this takes the full `.main`.
- [x] The strip's *Scores* segment is live, carries `data-class-screen="scores"`, and one tap on it
      from the registry lands on the grid. *(This is the defect correction round 1 was called for: the
      view shipped with that segment still disabled, so nothing — not a teacher, not the harness —
      could reach it. `index.html` asserted that `src/screen-nav.js` needed no change for it and that
      file had never been opened. `enabled` is now the question `isView()` that file's header always
      said it was.)*
- [x] Entering 25 scores down one column takes **25 keystroke-groups and no mouse** — the mouse
      events fired between the first cell and the last are counted, not assumed, and the count is 0.
- [x] The 25 scores land on the students in the order the grid **draws**, not the order the roster
      stores. The fixture's roster is deliberately the exact reverse of the drawn order, and every
      score in the column is a different number, so a build that wrote against the roster would put
      twenty-five marks on the wrong twenty-five students and look fine doing it.
- [x] `Enter` at the bottom of a column clamps rather than wrapping: the caret stays in the last
      cell, the value stays selected for overtyping, and the live region says *"that is the last
      student. 25 of 25 entered."* — because a key that does nothing and says nothing reads as a key
      that was not received.
- [x] `Esc` pressed **twice** two thirds of the way down a column, with a freshly typed digit in the
      field, closes nothing, navigates nowhere, opens no dialog, and leaves the caret and the digit
      where they were. There is no `Esc` binding in `src/scores.js` at all; that is what makes it true.
- [x] `late`, `missing` and `excused` are distinct **four** ways — the fill and the border read as
      computed style rather than as class names, the corner glyph, and the accessible name — and a
      blank cell wears none of the four. `missing` shows no number and placeholders `0`; `excused`
      placeholders `Ex`.
- [x] Clearing a cell **deletes the key**. Not `{ v: null }` with no flag — and when the last cell in
      a column goes, the column's own key goes with it rather than leaving an empty object under an
      assignment id. Asserted over the whole document, so a second writer added later cannot pass by
      being somewhere else.
- [x] The live grade is `docs/grade-math-cases.md` **case 1 to the digit** — 87.0% and a B, read off
      the screen — and the engine, asked separately, answers 87 and B. A screen doing its own
      arithmetic cannot pass by agreeing with itself.
- [x] The grid is usable on an iPad in landscape. 👤 *(Owner, on the hardware, 2026-08-10. Acceptance line 6, and it is the one no
      emulator can answer. What is measured at the desk is below.)*
- [x] **Moving an assignment to another category moves every displayed grade in the class on the
      keystroke** — all 25 of them, case 1's row 87.0% → 86.7%, the column head's chip from
      *Tests 50%* to *Homework 20%*, with the score map and the weight list byte-identical either
      side. *(Inherited from WO-3.3. This was the second defect of correction round 1: there was no
      `afterAssignmentChange()` chain at all, so the engine moved and the screen did not.)*
- [x] And moving it back restores every displayed grade, so the chain runs in both directions rather
      than only on the way out.
- [x] **No grade is shown at all while the weights do not total 100.** Every grade cell is a quiet em
      dash, the class average is an em dash, the banner stands where the number would have been and
      **names the total** — *"These weights add up to 90%, not 100%…"* — and the word *provisional*
      appears on no figure. *(Inherited from WO-3.1. The word is searched for in the grade column, the
      summary and the banner, deliberately not in the whole view: the standing hint under the grid
      uses the word in order to tell the teacher it is never used.)*
- [x] **The crossing works in both directions.** Typing the weight back to 50 brings all 25 grades
      back on the keystroke, with the categories panel still open over the grid. *(Inherited from
      WO-3.1, and the disappearing half was driven first, because that is the half a build can pass
      while getting wrong.)*
- [x] Nothing is blocked while the weights are wrong: every score field stays live behind the banner.
- [x] Opening the grid never writes `scores` into `planbook_openView` — it holds `class`, on the way
      **in**, which is `REMEMBERED_AS` rather than a read-side fix that would leave the wrong value
      sitting in storage.
- [x] The two frozen columns: the name column's declared width and the grade column's `left` offset
      are one number in the base rules and one number again in the coarse block, and the two blocks
      differ. With the grid scrolled sideways they stay pinned to its left edge and do not overlap —
      on both pointers, 190px and 168px.
- [x] Every control on the **open** grid measures ≥44px on an emulated coarse pointer: 259 of them,
      250 of which are score cells, none under 44px in either direction.
- [x] iPadOS offers a **decimal keypad** for a score cell — `type="text"` with `inputmode="decimal"`,
      which is `design/mockups/README.md`'s open question 1 answered the way the drawing drew it, and
      never put on the hardware. 👤 *(Owner, on the hardware, 2026-08-10, and the answer is not quite
      the one this line asked for: what opens is the **full keyboard on its number pane**, not the
      compact decimal keypad. The owner accepts it — the digits are under the thumb either way — so
      this is ticked as adequate rather than as exact. Recorded because `design/mockups/README.md`'s
      open question 1 now has a real answer, and it is "close enough on this hardware", not "yes".)*
- [x] A 44px cell in a 96px column (104px on touch) is hittable under a thumb down a 25-row grid,
      and the grid is not so tall that the frozen name column stops being enough. 👤 *(Owner, 2026-08-10.)*
- [x] The frozen name and grade columns hold under **momentum scroll** on WebKit, sideways and
      vertically, without shearing or flicker. 👤 *(Owner, 2026-08-10.)*
- [x] The three flag fills and their corner glyphs are legible on a projector from the back of a
      room, and none of them reads as an error. 👤 *(Owner, 2026-08-10.)*
- [x] Offline launch with the network off, `scores.js` and `scores.css` served from the precache
      (`planbook-shell-v40`). 👤 *(Owner, 2026-08-10.)*
- [x] A term's worth of real grades re-keyed into the school's SIS against this screen, which is what
      WO-3.2 left owed: **the letters have never been read beside a percentage by a human.** 👤
      *(Owner, on real grades, 2026-08-10. The letters read right beside the percentages. One
      mismatch found in the doing, and it is a precision difference rather than a wrong figure: the
      school's SIS carries percentages to **two** decimal places and this screen shows **one**, so
      re-keying is a rounding step done in the teacher's head at every row. Booked as WO-3.14 — not
      a defect of this work order, which never specified a precision, but the field discovering what
      the precision has to be.)*

*The desk half is `verify-shell.mjs`, **554 of 554** with zero skips, 17 checks added in one new
section and one existing check reworded. Four things about it are worth knowing.*

***The whole standing 44px sweep had walked past this screen and reported green.*** *That sweep
collects `button, input, …` across the page and skips anything computing to `display: none`;
`.hidden` is `display: none !important`, and every view but the one on screen is `.hidden`. So ~250
score inputs were never measured — and because of the disabled segment above, **nothing in that run
could have opened the view to measure them.** That is the backup-nag escape again: a green run over a
fixture that cannot express the failure. The new section opens the grid through the real segment
first, and *"the grid is OPEN and drawn under the coarse pointer"* is a check of its own, because a
sweep over nothing is exactly what this is closing.*

***Every score is typed as keystrokes at the page.*** *Not `.value` plus a dispatched `input` — that
would assert that `src/shell.js`'s listener works, which is not what the acceptance line says. The
fixture itself (a class of 25, three categories, ten assignments, a per-class four-band scale) is
planted through the store, because twenty minutes of clicking would prove nothing this file has not
proved elsewhere; the **scores**, which are what this work order is about, are all keyboard.*

***Seven of the ten assignments in the fixture are empty, and they change no grade.*** *An assignment
with no cell for a student contributes 0/0. What they change is the **width** of the grid, which is
the only way the two frozen columns can be tested at all: a three-column grid at 1200px does not
scroll sideways, and a sticky check over a grid that cannot move is a check that cannot fail.*

***The category-move check reads the screen, never the engine.*** *86.7% is hand-computed here —
Quizzes keep 90% at 30, Homework becomes (80 + 10) / 110 = 81.81…% at 20, Tests empties and its 50
redistributes — because an engine and a screen that agree with each other and disagree with the
arithmetic is the failure this file exists to catch.*

*Two mutations, both reverted — the two defects of correction round 1, re-introduced deliberately to
prove the new checks are not decorative:*

| Mutation | Result |
|---|---|
| `src/screen-nav.js` marks the *Scores* segment disabled again — the state WO-3.5 shipped in | **the run CRASHED**: `clickSel` found nothing to click and threw before a summary was printed. Fixed in the harness, not in the app — the door is now asked for before it is clicked, and a missing one is a red check plus an announced skip. This file's rule is that a missing fixture is a failed check and never a crash, and this section had broken it |
| `afterAssignmentChange()` dropped from the category `<select>` hook in `src/shell.js` | **1 red** — *"0 of 25 displayed grades moved; case 1's row 87.0% → 87.0%; that column head now reads Tests 50%"*. Every other check in the section stayed green, which is the point: this is the one box only this claim can tick |

*The first row is the more useful of the two, and it is not about the app at all. A negative control
that takes the run down does not tell you the check works — it tells you nothing, because there is no
summary to read. **The mutation found a defect in the check rather than in the code**, which is the
only reason it is worth a row.*

*`wo-sweep.mjs` is **15 checks, 13 passed, 0 failed, 2 to review**, and both REVIEWs were read and
answered rather than silenced. The sensitive-field-name line now names `src/scores.js`; the hit is
that file's own prose saying **no support data appears on this screen at all** — there is no indicator
dot, no plan, nothing, which is the safest form of the discreet-by-default rule on a grid of names a
teacher projects. The six selectors with no coarse-block rule — `.grade-none-text`, `.scores-panel`,
`.scores-body`, `.scores-actions`, `.scores-grid-wrap`, `.scores-cell` — are a text span, four
containers and an inline wrapper; not one is tappable, and the 21 real controls inside them are
measured above.*

*Three limits carried forward. **The six 👤 lines are owed to a sitting on the owner's own iPad**, and
the decimal keypad is the one that could go either way — it is the drawing's answer to its own open
question, and this build is committed to that shape rather than to having proved it. **The per-student
detail is not here** (WO-3.7): tapping a name does nothing yet, which is why `setDetailBreadcrumb()`
is still exercised only through the seam. **And paste-a-column is deliberately absent** — split to
WO-3.13 on 2026-08-10 — so there is no clipboard handler, no preview and no alignment rule on this
screen, and the sort control the drawing carries was not built with it, because the question that
control is really about is that work order's.*

---

### WO-3.17 — The Assigned and Due fields

- [x] A newly created assignment opens with **both dates on today**, in the document and in the two
      fields, in the `YYYY-MM-DD` an `<input type="date">` wants. Today is derived in Node off the
      same machine clock and compared, rather than read back out of the field it was written from:
      two runtimes, one clock, one answer, and a check that asked the app what day it was would agree
      with a build that wrote UTC's tomorrow into an October evening.
- [x] **Clearing either date stores it empty and leaves the rebuilt field empty.** Driven on the real
      `change` the iPad picker's Clear fires — which is also the event that throws the input away and
      builds a fresh one — so what is asserted is the *rebuilt* field, not just the document.
- [x] And **reopening that assignment shows both dates still empty** rather than filling them in
      again. The editor is filled from the document every time it opens, so this is the line that
      catches a default applied on OPEN rather than on creation.
- [x] **Editing an existing assignment with a blank date shows blank, not today.** The fixture is
      planted through the store rather than clicked into being, and deliberately so: after this work
      order there is no control that makes one, and the shape comes from a restore, a hand edit, or a
      build older than this. Asked *first*, before this block has created anything.
- [x] **The hint no longer says the dates do not fill themselves in, and still says why there is no
      next-meeting guess.** Asserted on **two** surfaces — the standing hint under the list and the
      note inside the editor — because the bold sentence had been copied into the dialog as well, and
      the work order names only the first of them.
- [x] **Both fields measure ≥44px under a coarse pointer and neither exceeds the panel width at
      390px**, the narrowest supported width: 159.25 × 44 each, inside a panel capped at 370.5px,
      spanning 96.75–256 and 268–427.25 with the row's 12px gap intact and neither field squeezed
      narrower than what it draws. **Measured with both fields EMPTY**, which after part two is a
      state a teacher reaches only by clearing a date — the block creates an assignment and clears
      both dates to get there, and the emptiness is asserted inside the same check as the geometry.
- [x] 👤 On the iPad, portrait and landscape: both fields fully visible, no overlap, nothing off
      screen. **Passed on real hardware, owner, 2026-08-10** — portrait and landscape, and again with
      both dates cleared, which after part two is the only way back to the state the original
      screenshots were taken in. **The native date picker still opens and commits** with
      `appearance: none` applied; that was the one way this fix could have cost more than it bought.
      *(Nothing in the desk half touches this line. The mechanism is iOS Safari painting
      `<input type="date">` as a native control at its own intrinsic size while the flex layout
      shrinks the element's box; headless Chromium honours the box already, so it could demonstrate
      neither the defect nor the fix. What the desk could witness is that the `appearance: none`
      reset is live on both fields as a **computed style** — the declaration reaches the right
      element — and that is a check of its own so the one line the fix rests on cannot be tidied
      away silently.)*

*The desk half is `verify-shell.mjs`, **563 of 563** with zero skips and zero failures, 9 checks
added in one new section and one existing check **re-pointed**. Three things about it are worth
knowing.*

***One WO-3.3 check asserted the behaviour this work order overrules, and it was re-pointed rather
than deleted.*** *It read "no date field auto-populates: a new assignment arrives with both dates
empty". The half that changed is the emptiness; the half that did not is that nothing
**schedule-shaped** fills these fields, which is what the no-timetable rule actually forbids. It now
asserts both dates arrive on today and nothing else does.*

***The block runs at two widths, and an emulator artifact is why.*** *Written as a single 390px pass,
two checks failed reporting the values of a dialog that had never opened — the click on a row's Edit
button landed on nothing. At 390 the page reports `documentElement.clientWidth` 390 and
`window.innerWidth` 524 while `95vw` resolves to 370.5px: the layout viewport is 390 and the visual
one is 524, so `getBoundingClientRect` (layout coordinates) and `Input.dispatchMouseEvent` (visual
ones) disagree and a right-hand control is missed by about a third of the screen. Dropping the device
scale factor from 3 to 2 did not fix it. So everything that clicks runs at 1024×768 and only the
geometry runs at 390, and a check now asserts the two viewport widths are equal before anything is
clicked. **It read exactly like an app defect** — a dialog that would not open — which is what makes
it worth writing down.*

***Nothing here is the app-wide date-field squatness.*** *The owner reports the date fields on
Classes & terms and on Days off & drops are equally short and take their own `min-height: 44px` no
better. That is one shared failure across three shipped screens, it is booked separately, and
`.term-date` was deliberately left untouched — copying this fix onto it would ship an untested change
to two other dialogs under a work order about this one.*

*Four mutations, all reverted, over three runs — the last three were applied together, since each
turns a different check red and none of them can mask another:*

| Mutation | Result |
|---|---|
| the default applied on **open** instead of on creation — `dateField()` falls back to `todayISO()` for a blank value | **4 red**: the blank-assignment line, the cleared-field line, the reopen line, and the 390px geometry check — that last one because it asserts the values are empty in the same breath as the boxes, so a build that stopped clearing cannot turn it into a measurement of two filled fields |
| the creation-time default removed — `assigned: '', due: ''` in `createAssignment()` | **2 red**: this section's today check and the re-pointed WO-3.3 one, each from its own end |
| `-webkit-appearance: none; appearance: none` removed from `.assign-field-date` | **1 red**, computed style reading `auto` on both fields. Nothing else moved, which is the honest limit: on this engine the reset changes no measurement |
| the editor's own note reverted to *"neither fills itself in"*, with the list hint left correct | **1 red** — the prose check, on the second surface alone. The work order names only the first one, so this is the clause that would otherwise have been decorative |

*`wo-sweep.mjs` is **16 checks, 15 passed, 0 failed, 1 to review**, and the REVIEW is the standing
sensitive-field-name sweep, unchanged by this work order. `sw.js`'s `CACHE` is bumped to
`planbook-shell-v41` in the same pass, because `index.html`, `src/assignments.js` and
`src/assignments.css` are all in `SHELL`.*

### WO-3.14 — Percentages to two decimal places

- [x] **`docs/grade-math-cases.md` case 1 reads `87.00%` on the grid, not `87.0%`, and the letter
      beside it is unchanged.** The screen and the engine are asked separately rather than the screen
      alone, so a formatter that agreed with a display that had drifted could not tick this.
- [x] **A grade that is not exact reads to two decimals and is rounded, not truncated** — case 1's
      row after the category move is 86.7272…%, which must render `86.73`. The assertion
      discriminates: truncation gives `86.72`, so a build that cut the digits instead of rounding
      them turns this red rather than passing on a number that happens to look right.
- [x] **The class average and the grade column agree to the same precision, asserted together in one
      check rather than three.** *There is no third surface to include.* WO-3.7's per-student detail
      does not exist yet, and that was re-checked against the tracker rather than assumed — when it
      lands it inherits this line.
- [x] 👤 **One row re-keyed into the real SIS with no mental arithmetic between screen and box.**
      *(Owner, 2026-08-11 — clean, no issues. This is the line the whole work order exists for: it is
      the only one that can witness the absence of a conversion done in a teacher's head, and no
      amount of desk checking can substitute, because a silent conversion produces a correct number.)*

*The desk half is `verify-shell.mjs`, **564 of 564** with zero skips and zero failures — one check
added, six existing string literals re-pointed from one decimal to two. `wo-sweep.mjs` is **16
checks, 15 passed, 0 failed, 1 to review**, the REVIEW being the standing sensitive-field-name sweep,
untouched by this work order. `sw.js`'s `CACHE` goes to `planbook-shell-v43`, because `src/scores.js`
is in `SHELL` — without it the installed iPad app keeps serving `toFixed(1)` and the change is
invisible on the one device it was written for.*

***The work order's own acceptance text carried a wrong number, and it cost a round.*** *The line
read "case 1's 86.666…", a figure back-inferred from the old one-decimal display and never checked
against the engine. The dispatch brief propagated it and the first implementation asserted `86.67%`
on its authority, leaving a comment headline contradicting the arithmetic three lines below it. The
real value is 90 × 30/50 + 81.81…% × 20/50 = 86.7272…%. **The acceptance line has been corrected in
place and says what it used to read**, so the next person to re-derive it does not re-derive the
error. The general form: a number written into a spec from a rounded display is a measurement of the
display, not of the thing.*

***Two observations logged rather than fixed.*** *The summary now reads `Class average 87.00% ·
Weights total 100%` at mixed precision, which is correct and deliberate — a weight is typed by the
teacher and never transcribed out, so it is not the same kind of number as a re-keyed grade. And
`tools/wo-sweep.mjs`'s `TOUCHES_MAPPING` is narrower than its own prose, missing
`letterFromPercentage`; that is pre-existing, predates this work order, and wants a work order of its
own rather than a quiet edit under this one.*

### WO-3.12 — The grade-engine cases cover the arguments the engine actually takes

**What this changes.** Nothing a teacher sees: harness and worked-cases doc only, and `src/` is
byte-identical to the tree WO-3.4 left. Four checks land in `verify-shell.mjs`'s grade engine
(WO-3.4) block — case 8's third direction, and new cases 13 through 15 — closing the two gaps that
block's own header named as an explicit follow-up: WO-3.4's twelve worked cases are all one class,
one term, one student, and the only unbalanced-weight fixture among them (`50/30/15`) uses integer
weights, which cannot expose the float bug the `formatWeight()` fix (`src/grade-engine.js:96`) was
written for.

- [x] **A `40.1 / 34.7 / 20` case asserts the message string, not the number.** `40.1 + 34.7 + 20` is
      `94.8` in decimal and `94.80000000000001%` in IEEE-754 double precision; the check asserts the
      message reads `The category weights total 94.8%, so there is no grade yet.`
- [x] **Reverting `formatWeight(total)` at `src/grade-engine.js:96` to raw concatenation is run, not
      reasoned**, and turns that check red on its own — table below.
- [x] **An assignment filed under a second class (`c2`) does not move `c1`'s grade**, and dropping the
      `classId` filter at `src/grade-engine.js:35` turns that check red on its own — table below.
- [x] **An assignment filed under a second term (`t2`) does not move `t1`'s grade**, and dropping the
      `termId` filter at `src/grade-engine.js:36` turns that check red on its own — table below.
- [x] **A second and third student's cells do not move the subject's grade** — true, and asserted.
      Reading the first cell in the score object regardless of the requested id turns that check red
      **together with four of WO-3.5's own**, which reach the same lookup through the screen. The
      acceptance line was amended 2026-08-11 to say so, by the owner, after re-running the mutation at
      the desk; the original "on its own" asked for something this defect cannot produce. See the
      honest exception below the table.
- [x] `docs/grade-math-cases.md` gains case 8's third direction and cases 13 through 15, hand-computed
      in the same form as the existing twelve, which are unedited.
- [x] `node tools/verify-shell.mjs` is green at **595 checks · 595 passed · 0 failed · 0 skipped**
      after every mutation is reverted, and `node tools/wo-sweep.mjs` shows the same standing line it
      showed before this work order — **16 checks · 15 passed · 0 failed · 1 to review**, the REVIEW
      being the pre-existing sensitive-field-name sweep, untouched here. (`tools/README.md:636`'s
      call-site count moved from 592 to 596 in the same commit, which is what keeps that sweep line
      itself green — see `tools/README.md`'s own WO-3.12 paragraph for the gap arithmetic.)
- [x] `git diff --stat src/` is empty across the whole work order — confirmed after every mutation's
      revert and again at the end. This work order is harness- and doc-only.

Four mutations, all reverted:

| Mutation | Result |
|---|---|
| `formatWeight(total)` at `src/grade-engine.js:96` reverted to raw string concatenation | **1 red**: case 8's third direction reads `"...94.80000000000001%..."` against the expected `"...94.8%..."`. Before: `595 checks · 595 passed`. During: `595 checks · 594 passed · 1 failed`. The other 594, including WO-3.4's thirteen, stayed green |
| `assignment.classId === classId` dropped from `assignmentsFor()`'s filter (`:35`) | **1 red**: case 13, reading `class 95.71428571428572` where `class 85` was expected — `134/140`, `c2`'s `a2` wrongly pulled in. `595 checks · 594 passed · 1 failed`, nothing else moved |
| `assignment.termId === termId` dropped from the same filter (`:36`) | **1 red**: case 14, the identical wrong value `95.71428571428572` for the identical reason one term over. `595 checks · 594 passed · 1 failed`, nothing else moved |
| `scoreCell()` (`:41-42`) changed from `byAssignment[studentId]` (guarded by `hasOwnProperty`) to `byAssignment[Object.keys(byAssignment)[0]]` — reads whichever cell is first regardless of the id asked for | **5 red**, not 1: case 15 (`class 2.5`, matching the hand-computed `1/40` if `s2`'s cell were read for `s1`) **and four of WO-3.5's own checks**, whose 25-student grid depends on this same lookup returning each student's own cell. `595 checks · 590 passed · 5 failed`. Investigated rather than reported as a clean proof — see below |

**The `studentId` mutation is the honest exception, in the WO-2.18 shape.** Dropping the `classId`
and `termId` filters each isolated cleanly because the WO-3.5 fixture this harness already drives
(`c_wo35` / `tm_wo35`) is one class and one term — there is nothing else in that document that could
spuriously qualify once either guard came off. The `studentId` change is different in kind: it
corrupts every student's cell in *any* multi-student document, and WO-3.5's own 25-student grid is
exactly that — its own acceptance line 5 already asks `weightedClassGrade()` for one named student's
grade on the real, rendered screen. The mutation that proves case 15 also reddens four of WO-3.5's
checks. That is not case 15 measuring nothing — it goes red on the mutation it names, with the wrong
value matching the hand-computed prediction exactly — it is that this argument is load-bearing enough
that the harness was already watching it, from a different section, through a real screen rather than
a hand-built fixture. No mutation that genuinely
drops the `studentId` lookup can avoid this: any real multi-student document breaks the same way, and
narrowing the mutation to spare WO-3.5's checks would mean it no longer represents the defect the
Deliverables describe. Recorded honestly rather than smoothed into "the proof worked."

**Re-run at the desk 2026-08-11**, by the owner, on the ruling that amended the acceptance line — a
third independent reproduction after the implementer's and the verifier's. `595 · 590 passed · 5
failed`, the same five. What settled it: all four extras fail on the *same* wrong number, case 1's
row reading `77.50%` where `87.00%` is expected, three of them because they use that row as the
anchor they measure their own behaviour against. And the second of the four is the check that exists
to catch the screen and the engine disagreeing — under the mutation it reports `screen 77.50% C ::
engine 77.5 C`, both halves in perfect agreement and both wrong, because both read through the one
broken lookup. That is the signature of a single defect propagating. A coupled fixture would have
reddened assertions with nothing to do with per-student scores; attendance, categories and backup all
stayed green, 590 of 595 in total.

*No 👤 line — this work order is explicit that it is harness, not app: `plans/work-orders/
phase-3-gradebook.md`'s own "Closes roadmap" line says inventing a product box here is the drift
WO-2.15 and WO-2.16 exist to catch.*

---

### WO-3.7 — Per-student grade detail

**What this adds.** The screen open during a guardian conference: one student's grade taken apart —
a hero with the percentage and the band, the category breakdown with each category's weight, what it
actually counts at, and what it contributes, the missing-work list with the points at stake, "what it
would take to move", and the attendance summary for the same student and term. **Print** and
**Download CSV** sit at the top of it.

**It is a view, and it is not a fourth tab**, which are two separate decisions and both are the
owner's. A screen a teacher sits in front of with a parent, scrolling and pointing, is not a dialog
(`plans/gradebook-surfaces.md`), so `#detailView` is a sibling of the other four in `<main>`. And it
owns **no navigation target**: you arrive from a NAME — the student's own name in the score grid, or
a door inside their attendance history — and the switcher shows that name as a **breadcrumb** while
you are standing there. A tab you cannot enter without first choosing a student is either dead on a
freshly-opened class or it invents a selection nobody made.

**Nothing on this screen computes a grade.** Every number comes out of `src/grade-engine.js`,
including the projections behind "what it would take to move": `openWork()`, `nextBandFor()` and
`projectedClassGrade()` were **added to the engine** for this screen rather than written into it,
because a detail page that summed its own points is a detail page that disagrees with the grid the
teacher just came from. `projectedClassGrade()` is linear in the rate — each category's percentage
becomes `(earned + rate × owed) / (possible + owed)` — which is what makes the "to move" figure
solvable rather than searched for, and reproducible with a calculator.

**The contribution column is rounded so that it adds up.** Rounding each contribution on its own and
printing the engine's total under it misses by a cent about half the time, and a guardian who adds
the column up and gets a different number has been handed a page that is wrong in the only way that
matters here. The cents are allocated by largest remainder instead.

**No support data reaches this screen, and not because it is hidden.** `src/detail.js` does not
import `src/supports.js` and has no path to `student.supports` — the same posture
`src/attendance-report.js` takes, and stronger than "presentation-mode safe": an implementation that
read those fields and hid them behind the visibility switch would satisfy acceptance line 4 and still
be a one-tap disclosure the day somebody flips the switch back. The mockup's `.detail-support-btn`
indicator is **deliberately not built**, and `src/detail.css` says so at the point where the rule
would have gone: this screen carries a print surface and a CSV, so building it would put the one
module that writes a sheet for a guardian to take home in reach of the one block of data that must
never be on one.

**Printing a view is a harder problem than printing a dialog**, which is the trap the work order names
against itself. WO-2.6's surface is a modal — a direct child of `<body>`, so `body[…] > *` hides
everything and one `> #id` brings it back. This one is inside `<main>`, under a panel header carrying
the title row, the switcher and the breadcrumb. So the hiding happens at **two levels**
(`body[data-detail-print] > *`, then `main > *:not(#detailView)`), the panel header is reached through
a class of this screen's own so that nothing in `src/detail.css` names a class `src/shell.css` styles,
and **every one of the rules is gated on the body attribute**. A second attribute rather than a second
idiom: sharing `data-attendance-print` would re-show a dialog that is not on screen here, which is a
blank sheet by a different route.

- [x] The breakdown's contributions sum to the displayed overall grade. *(Three claims and not one,
      because a build could satisfy any two: the column as PRINTED sums to the footer as PRINTED, and
      both agree with the engine. `["36.71","19.12","9.41"]` → 65.24, footer `65.24%`, hero `65.24%`,
      engine `65.23529411764706`. The fixture is four categories over a weight base of 85, so every
      figure in the section is over 85 and not 100 — a fixture whose categories all had work in them
      would pass an implementation that ignored redistribution entirely.)*
- [x] With a category empty, the breakdown shows the redistribution rather than hiding it.
      *(Participation carries 15% and holds nothing. Its row is drawn in the caution wash reading
      `nothing graded in it yet — its 15% is shared across the others`, and the three rows beside it
      print a **Counts at** column of `47.06% · 29.41% · 23.53%` rather than their face weights — which
      is redistribution shown rather than described. A hidden row is how a teacher concludes the app
      lost an assignment; a row printed as 0% is how a guardian concludes a student scored nothing.)*
- [x] The "to move" figure is reproducible by hand. *(Every figure was computed by hand first and
      written into the harness section's header, then asserted as a string — never read back off the
      screen and compared to itself. `78×40 + 65×25 + 40×20` over 85 = `65.24%`, a D; nothing scored
      on the outstanding 30 points leaves `52.54%`, full marks makes `75.09%`; the next reachable band
      is D+ at 67, so the rate is `(67 − 52.5392…)/(75.0882… − 52.5392…) = 0.6413…`, rounded **up** to
      `64.14%`, landing at `67.00%`. Rounded up and never to nearest: a rate rounded down is a figure
      that reads as reaching the band and does not, which is the one direction this card must never be
      wrong in. Handing in the one missing 10-pointer in full reads `77.00%` on its own line, and the
      0-point bonus assignment gets its own line too rather than being folded into a percentage it
      cannot move.)*
- [x] No `supports` data appears on this screen in presentation mode. *(See line 8 — asserted in both
      modes at once, with the data planted first.)*
- [x] It is a view in `<main>`, not a dialog. *(`#detailView`'s parent is `<main>`, it carries no
      `role`, and the tap that opened it left zero visible `.modal-overlay`s. Opened through the real
      door — a student's own name on the score grid, of which the fixture draws two.)*
- [x] One student's detail prints to one page carrying their name, the class, the term and the date it
      was printed — and the nav strip, breadcrumb and any app chrome are not on it. *(**The chrome half
      was measured; the paper half was the 👤 line below, answered on the owner's own printer
      2026-08-12 — one page, two columns.** Driven through the real Print button and the
      real delegated handler, with `window.print()` stubbed — the stub takes the snapshot **at the
      moment the app asks to print**, under emulated print media, so nothing races the 500ms attribute
      release. The hero carries `Zoë Ñuñez-Öztürk`, `WO-3.7 Detail` and `WO-3.7 Term`; the stamp reads
      `Printed August 12, 2026 · Planbook`. The app header, the panel header, the nav strip, the
      breadcrumb, the action row and every other view are `display: none` with **zero-height boxes**,
      and `0 element(s) still drawn outside #detailView`. Heights as well as `display`, because the
      computed display of an element inside a `display: none` ancestor is its own value — asking the
      switcher for its `display` reports `flex` on a build behaving perfectly. Also measured: **all 41
      `@media print` rules touching this surface are selected under `body[data-detail-print]`**, none
      ungated,
      `<body>` carries no such attribute at rest, the attribute comes back off afterwards, and a print
      with the attribute OFF leaves the whole app on the page — the blank-sheet regression the gate
      exists for.*
      *And since the correction round, **the sheet is also read at a real page box** — 740px, Letter
      less its 10mm margins — because `setEmulatedMedia: 'print'` switches the media type and relayouts
      nothing, so everything above was measured at 1280px, a width no printer has. The verifier caught
      the sheet printing as ONE column there: the gated block set `gap` on `.detail-cols` and never
      restated `grid-template-columns`, so `@media (max-width: 1024px)` — which resolves against the
      page box under print media — won on every real sheet of paper. Fixed by restating the columns
      inside the gate, and now measured at the page box with the narrow band asserted **matching**, so
      the check cannot pass by quietly falling back to 1280: `grid tracks ["416.422px","308.469px"]
      over 2 column(s), side by side = true`. A second check sweeps every `max-width` rule in the app
      against the elements of this sheet and requires the gated block to restate what they declare —
      `5 rule/element pair(s) on the sheet, 0 unpinned`.)*
- [x] The per-student CSV opens cleanly in a spreadsheet, **including a name with a non-ASCII character
      in it**. *(**The bytes were measured; the spreadsheet was the 👤 line below, opened by the owner
      2026-08-12 and clean.** Read through the
      `detailModel()` / `studentCsv()` seam — `src/backup.js`'s build-it/hand-it-over split, reused so
      the file can be asserted character by character without a download. A BOM so Excel reads UTF-8, no
      bare LF anywhere, sections rather than one padded table, five category rows all seven cells wide,
      `Ó"Brien, Jr` surviving as one cell. The figures are the screen's, character for character,
      contribution column included, with the empty category named rather than dropped. The file is
      `Planbook Ñuñez-Öztürk, Zoë WO-3.7 Detail WO-3.7 Term grades 2026-08-12.csv`. **And the BOM is
      asserted USEFUL rather than only present**, which is the hole WO-2.6 left: both fixture surnames
      leave ASCII, and the same bytes decoded as Windows-1252 read `Ã‘uÃ±ez-Ã–ztÃ¼rk` — the failure the
      BOM prevents, demonstrated rather than described, over 727 bytes for 716 characters.)*
- [x] Neither the printout nor the CSV emits accommodation, medical, or plan data — verified in both
      presentation modes, with the data asserted present in the document first. *(A plan, a case
      manager, a review date, an accommodation, a medical line and a behavior plan are planted on the
      student whose detail is opened, and **their presence in the serialised document is asserted
      before anything is read** — an absence check over a student with nothing on file proves nothing.
      Then the screen's text, the CSV's text and the model's JSON are searched for all five sentinels
      and for the word `IEP`, twice: once with presentation mode OFF, where `supportsVisible()` answers
      true and the roster shows everything, and once with it ON. Zero hits in either pass over surfaces
      of 2,735, 716 and 1,322 characters, so none of the three was empty. **The mode-OFF pass is the one
      that matters** — a build that gated the screen and the file on the toggle would pass mode-ON and
      fail this.)*
- [x] The strip shows the open student's name as a breadcrumb segment while this screen is up, and
      switching to any of the three tabs takes the name with it. *(Inherited from WO-3.3, which built
      the strip and could not demonstrate this half: there was no per-student detail to enter or to
      leave, so the name was never drawable. **Both directions, at last.** With the screen up the strip
      draws four segments — `Attendance · Assignments · Scores · Zoë Ñuñez-Öztürk` — the fourth carrying
      the `detail` class, `aria-current`, and no `data-class-screen` of its own. Then **each of the
      three tabs in turn**, not the one somebody tested: every strip on the page comes back to three
      segments with the name on none of them, and re-entering through the score grid puts it back.)*
- [x] 👤 **Print one student's detail on the printer you actually have.** ✅ **Done 2026-08-12 — one
      page, two columns, on the owner's own printer.** Two things, and the first one
      is why this line existed after a green run: the sheet must come out **one page** and it must
      come out **two columns**. No emulator has paper, so the page count is the half no run can close.
      The column count *is* now measured — at 740px, the width Letter actually lays out at — but it was
      measured only after the verifier found the shipped sheet printing as a single column that nothing
      in the harness could see, so it is worth confirming with your own eyes on the first sheet you
      pull off the tray. Then: the "to move" paragraphs readable at 8pt, no card cut across the middle,
      and the date stamp at the top where a page found in a folder next June needs it. A student with a
      long missing list is the case worth trying, since that is what pushes it to a second page.
- [x] 👤 **Open the per-student CSV in the spreadsheet you actually use.** ✅ **Done 2026-08-12 —
      opens clean in the owner's own spreadsheet.** Three sections down one
      sheet, the contribution column adding to the total under it, a name with an accent intact and a
      name with a comma in it still in one cell. The accents are what the BOM is for — measured here as
      bytes for the first time, but bytes are not Excel. **This is the line WO-2.6 left open on the
      same grounds, closed the same way: by someone opening the file.**
- [x] 👤 **On the installed iPad PWA, tap a student's name on the score grid mid-lesson.** ✅ **Done
      2026-08-12 — no mis-taps, row heights unmoved.** The name is a
      44px control down a frozen column now, next to cells you are typing into. The thing to check by
      eye is that reaching for a score cell does not open somebody's conference screen, and that the row
      heights did not move.
- [x] 👤 **Read the screen with a parent sitting beside you, at arm's length.** ✅ **Done 2026-08-12 —
      readable across a desk, and the wording holds up said out loud.** The type sizes in the
      coarse block were chosen for this and nothing else. The specific question is whether the
      breakdown table is readable across a desk, and whether "what it would take to move" says
      something you would actually say out loud.

*The desk half: `verify-shell.mjs` **628 checks · 628 passed · 0 failed · 0 skipped**, 207s, up from
598 on the tree this work order arrived on — thirty in a new section at the foot of the file, and none
anywhere else. (Twenty-eight of the thirty landed on the first pass at `626 checks · 626 passed`,
205s; the last two came with the page-box fix on the correction round.) `wo-sweep.mjs` is **17 checks · 14 passed · 0 failed · 3 to review**. All three
REVIEWs were read rather than waved at. The sensitive-field sweep is **188 mentions across 15 files**, and the
two files new to that list are `src/detail.js` and `src/detail.css`. Their five mentions between them
are all prose in comments, stating at the point where a future author would break it that none of
that data reaches these surfaces; neither file has a `supports` identifier in executable code, and
`src/detail.js` does not import `src/supports.js` at all. The coarse-block REVIEW lists thirteen new
selectors. Twelve of them are layout containers or text nodes rather than controls: the detail screen
adds no control of its own — every one is `.class-action-btn` or `.screen-nav-btn`, which carry their
floors in the sheets that own them. The thirteenth, `.attendance-report-door`, **is** a new target and
**is** on that list, first entry — which is exactly why the correction pass went and measured it
instead of reasoning about it (see below). Of the two new targets, only `.scores-name-btn` is absent
from the list. The due-date REVIEW is `src/detail.js:349`, a sentence on the missing-work card stating the rule
it is flagged for: *"Missing is marked by you and is never worked out from a due date."* `sw.js`'s
`CACHE` is bumped to `planbook-shell-v45` and `src/detail.js` and `src/detail.css` are added to
`SHELL`.*

*One check was added by the correction pass rather than by the original build, and it is the one worth
knowing about: **the door from the attendance history dialog was claimed at 44px by inheritance and
never measured**. `src/attendance.css` gives `.attendance-report-door` a margin and nothing else, on
the correct grounds that it wears `.class-action-btn` and that component already carries its floor —
but "it inherits one" answered by reading is the exact shape of the BOM this work order was told not to
inherit. It is now opened at 1024px under a coarse pointer, on the surface a teacher reaches it from,
and measured: `{"open":true,"found":true,"w":196.08,"h":44,"spill":0,"label":"Grades for Zoë
Ñuñez-Öztürk"}`.*

*A second correction round fixed **the one defect that reached paper**, and it is the more useful of
the two to have written down. The gated print block declared `gap` on `.detail-cols` and never
restated `grid-template-columns`, so `src/detail.css`'s `@media (max-width: 1024px)` — a rule written
about a tablet in portrait — won on every sheet of paper, because under print media a `max-width`
query resolves against the **page box** and Letter at this app's `@page { margin: 10mm }` is ≈740 CSS
px (landscape ≈981, A4 ≈718). The sheet printed as one column: "two pages of half-empty paper", in the
stylesheet's own words, under an acceptance line that says one page. **Twenty-eight green checks said
nothing about it**, because the harness snapshots the printed page at the 1280px its own device
metrics set and `setEmulatedMedia` relayouts nothing — 1280 is the one band where the shipped sheet
still looked like the designed one. Found by the WO-3.7 verifier by rendering to PDF, not by any run
in this repo. The fix is one restatement inside the gate (plus `gap` and `text-align` on the hero,
found by the same sweep and exposed on paper narrower than 640px, which Letter and A4 are not). Two
checks now express it, and **both were watched failing**: with the one line reverted the run is
`628 checks · 626 passed · 2 failed`, exit 1, reading `grid tracks ["740px"] over 2 column(s), side by
side = false` and `@media (max-width: 1024px) { .detail-cols { grid-template-columns } } unpinned on
div.detail-cols` — everything else green, which is the escape restated as a measurement. Confirmed
independently the way the verifier found it, by printing a page that links this stylesheet to PDF at
Letter: **2 pages before the fix, 1 page after.** Recorded as trap 10 in `tools/README.md`.*

---

### WO-3.9 — Grades print & CSV

**What this adds.** A class's grades for a term as one sheet: **🖨 Grade sheet** in the score grid's
toolbar opens a dialog carrying the printed page and a CSV of the same thing. Students down the page
alphabetically by **last name** as `Last, First`, assignments across in **due-date** order with each
column carrying its due date and what it is out of, and the total percentage and letter at the right.
Both surfaces carry the class, the term, the day it was printed and the letter scale in use.

**The order is the whole work order, and the order is the owner's** — recorded in the work order on
2026-08-12 against a drawn mock-up of both layouts, not decided here. Student-major, because a term
fits on a page or two and the same sheet doubles as the at-a-glance class picture; the alternative
(one section per assignment, the roster repeated inside each) reads straight down while typing and
never puts a student's whole term in one place. **No student-id column**, because the SIS entry screen
has no id to match on and the name is the join. If a real re-key wants a finger held on one assignment
column, that is the finding the first 👤 line below exists to catch — and the answer then is the
assignment-major layout, already designed.

**Three cases make the column order, and all three are in the fixture.** Sort by due date; a same-day
tie keeps the order the teacher put the work in with the assignment list's ↑ ↓; work with **no due
date at all** goes last rather than first, because a sheet whose first columns are the undated ones
opens on the work least likely to be what is being typed in.

**It is a dialog over the score grid, not a print of the score grid.** `plans/gradebook-surfaces.md`'s
rule is what the teacher is doing — printing a term is a task you finish and dismiss — and WO-2.6 made
the same call one screen over. Printing `#scoresView` itself would also have been wrong on the
artifact: that screen's columns are in the order the teacher arranged them and this sheet's are by due
date, its cells are ~250 live `<input>`s, and its grade column is frozen beside the name where this
sheet's total belongs at the right.

**Nothing on this sheet computes a grade, and nothing on it reads a cell for itself.** Every
percentage and letter comes out of `src/grade-engine.js`; the row order and the reading of a cell come
out of `src/scores.js` (`gridOrder()` and `scoreMark()`, both exported for this). The printout is what
gets typed into the SIS, and two implementations of one arithmetic is exactly how a sheet comes to
disagree with the screen it was printed from.

**`late` and `missing` are the teacher's marks and a blank stays blank.** One function turns a cell
into a string and **both surfaces call it**, so the page and the file carry identical text in every
cell. A late score prints `18 L` — it counts in full; late is a record, not a penalty — `missing` is
`M` because it holds no number, `excused` is `Ex`, and an ungraded cell prints **nothing at all**.
That last one is the one departure from `src/attendance-report.js`, which draws a dash into a blank
because an empty attendance cell would read as "present": here blank means ungraded, an empty cell is
what that looks like, and a printout that turned a blank into anything would be inventing a grade on
the sheet the SIS gets typed from. The key under the table says all four in words.

**No support data reaches this file, and not because it is hidden.** `src/grades-report.js` does not
import `src/supports.js` and has no path to `student.supports` — the same posture
`src/attendance-report.js` and `src/detail.js` take, and stronger than "presentation-mode safe": an
implementation that read those fields and hid them behind the visibility switch would satisfy the
deliverable and still be a one-tap disclosure the day somebody flips the switch back.

**This is the app's third `@media print` block and its third attribute** (`data-grades-print`, at the
foot of `src/scores.css`). Sharing either of the other two would re-show a surface that is not on
screen here — a blank sheet by a different route. The two older blocks each counted themselves in
their own headers and were both right when they were written; **both were corrected in this pass**,
because those comments are the only census there is.

**The print gate is answered when it is read, and that is a bug fix rather than a design (owner,
2026-08-12).** As shipped, the Print button worked exactly once. The second tap printed **the whole
app**: Chrome refuses a repeated `print()` with *"This website has been blocked from automatically
printing"*, and a **refused `print()` does not block** — it returns at once, so the 500ms timer that
clears the gate had long since run by the time the owner pressed Allow, and the print that finally
happened was ungated. Turning the preview from portrait to landscape did the same thing by the other
road: the preview **re-generates from the live DOM**, also after the timer. One mistake, not two — the
gate was *set* when we asked to print and *read* when the browser actually printed, and the gap
between those is however long a teacher looks at a preview. It is now answered from a `beforeprint`
listener, at the moment the page is serialised, by asking the DOM whether the grade sheet is on
screen. That is **self-correcting rather than balanced**: a print the teacher blocks outright leaves
the attribute on, which costs nothing because only `@media print` reads it, and the next print of
anything clears it. Four checks cover it below, and **the shipped build fails two of them.**

> ⚠️ **`src/attendance-report.js` (WO-2.6) and `src/detail.js` (WO-3.7) still carry the timer
> verbatim, so both of those print surfaces still have this bug.** It was lifted three times, which is
> how three copies came to share one defect. Deliberately **not** fixed here — that is a call about two
> closed work orders. Their `@media print` headers still describe a timer, and `src/scores.css`'s
> header now says so at the point where the next author would lift it a fourth time.

- [x] 👤 The print order matches the SIS entry screen, confirmed by the owner against a real re-key.
      **Closed by the owner 2026-08-12 — the order matches**, so the assignment-major layout this line
      existed to catch stays undrawn. **This could not be closed at a desk and was not.** What was
      measured here is that the build IS the
      recorded answer: rows `["Ñuñez-Öztürk, Zoë","Ó\"Brien, Jr, Ida","Zabkowski, Abe"]` off a roster
      stored as `["wo39-s3","wo39-s1","wo39-s2"]` — neither the answer nor its reverse, so the check
      cannot pass by printing what it was handed — columns `Unit 1 Test [9/18] · Cell Quiz [9/18] ·
      Ch 1 Homework [9/25] · Practice 1–6 [10/1–10/6] · Bonus poster [no due date]` off a document
      order that starts with Ch 1 Homework, and zero id-ish columns. Whether that order is the SIS's
      order is a question only the SIS can answer.
- [x] Percentages and letters on the printout match the app exactly. *(Three ways and not one, because
      "match the app" is a claim about two surfaces: the sheet is compared to arithmetic done by hand,
      to what `src/grade-engine.js` answers through the seam, and to what the score grid behind the
      dialog is drawing for the same three students at the same moment. `73.00% C · 63.53% D ·
      122.22% A` on all three, against engine answers of `73 · 63.529411764705884 ·
      122.22222222222223`. The fixture is four categories over a shifting weight base — Ñuñez-Öztürk
      has two empty categories so her base is 65 rather than 100, Zabkowski's Tests are excused so his
      is 45 — and his 122.22% is over 100 on purpose: extra credit is a scored zero-point assignment
      and nothing caps a percentage.)*
- [x] The CSV opens cleanly in a spreadsheet, with its rows and columns in the same order as the
      printout. **Closed by the owner 2026-08-12 — it opens cleanly.** Half was measured and half was
      owed to the owner, exactly as WO-2.6 and WO-3.7 left the same claim. *The ORDER half is asserted cell for cell: the file's grid
      section is reassembled against the DOM's slices and every column head, every row head and every
      cell has to be the same string in the same place, so a build whose slicing quietly reordered
      anything fails here rather than on paper. The FORMAT half is measured too — a BOM, no bare LF
      anywhere, four sections each at a consistent width (10 assignment rows of 4 cells, 3 student
      rows of 13), and `Ó"Brien, Jr, Ida` surviving as one cell through a doubled quote and two
      commas. What no run here can say is that it opens in the spreadsheet the owner actually uses.*
- [x] Neither surface emits accommodation, medical, or plan data. *(A plan, a case manager, a review
      date, an accommodation, a medical line and a behavior plan are planted on the first student and
      **their presence in the serialised document is asserted before anything is read** — an absence
      check over a student with nothing on file proves nothing. Then the dialog's text, the CSV's text
      and the model's JSON are searched for all five sentinels and for the word `IEP`, twice: with
      presentation mode OFF, where `supportsVisible()` answers true and the roster shows everything,
      and with it ON. Zero hits in either pass over surfaces of 1,503, 882 and 2,631 characters, so
      none of the three was empty. **The mode-OFF pass is the one that matters** — a build that gated
      the sheet on the toggle would pass mode-ON and fail this.)*
- [x] 👤 **Re-key a term into the SIS off the printed sheet.** **Done 2026-08-12: the order matches.**
      This is the acceptance line above, and
      it is the reason this work order exists: the sheet is only right if a teacher can type down it
      without losing her place. What to notice — whether the eye wants the assignment column held
      still rather than the student row (that is the assignment-major finding), whether `Last, First`
      matches what the SIS shows, and whether the total at the right-hand end is where you look for it
      or whether it wants to be beside the name the way the score grid has it.
- [x] 👤 **Tap 🖨 Print twice in one sitting, and turn the preview to landscape.** **Closed by the
      owner 2026-08-13: the preview is correct.** The second tap prints the grade sheet, and so does
      the preview after a turn to landscape. *(The third part of this line — Ctrl+P with the dialog
      **closed** giving the ordinary page rather than a blank sheet — is asserted directly by the
      harness, `beforeprint` with the sheet not on screen clearing the gate, so it is not owed to a
      human the way the paper is.)*

      **Chrome still shows "This website has been blocked from automatically printing" on the second
      tap, and that is the browser rather than the app.** It was the *symptom* that led to the bug, not
      the bug: the defect was what printed after you pressed Allow, and that is fixed. The reading that
      separates the two is now a check — **one tap calls `window.print()` exactly once**, so this is
      not a delegated handler firing twice from one gesture, which is the thing that throttle exists to
      stop. Nothing on the page can suppress it; it is Chrome's own repeat-print policy and the site
      can only be granted the exception from the bubble itself. **Left as a known browser behaviour
      rather than chased.** Worth knowing for the marketability goal: a teacher printing five classes
      back to back meets it four times, one click each.
- [x] 👤 **Print the grade sheet on the printer you actually have.** **Closed by the owner
      2026-08-13.** *No finding was reported against any of the four things below, including the
      one-slice page-break question the verifier raised — so the forced break stays as it is, and if
      a header ever does strand itself on page 1 that is a new report rather than a known one.*
      Eight assignment columns to a
      page is arithmetic against A4's 190mm — 42mm of name, 16mm of grade, 8 × 16mm of work — and
      arithmetic is not paper. The things to check by eye: that a column head's name is readable at
      6pt, that a row is not cut across the middle at a page break, that the second slice starts on a
      fresh sheet with the student and grade columns repeated on it, and that the whole thing is worth
      carrying to a computer. The page box is measured here at 740px (`panel 740px, table 740px`), so
      the sheet is known to take the full width of the paper rather than the dialog's own 480px — but
      **how many sheets it comes out on is a question no emulator has an answer to.**
- [x] 👤 **Open the class CSV in the spreadsheet you actually use.** **Done 2026-08-12: it opens
      cleanly.** The bytes are measured here for
      the first time — 894 bytes for 882 characters, the BOM asserted **useful** rather than only
      present (the same bytes decoded as Windows-1252 read `ï»¿Planbook â€” class grade sheet`) — but
      bytes are not Excel. Four sections down one sheet, the grid's row order matching the printout,
      and a surname holding a quote and two commas still in one cell. **This is the line WO-2.6 and
      WO-3.7 both left open on the same grounds and both closed the same way: by someone opening the
      file.**
- [x] 👤 **Tap 🖨 Grade sheet on the installed iPad, on a real class.** **Closed by the owner
      2026-08-13** — the preview is usable at arm's length on a real roster. Measured here at 1024px under
      a coarse pointer — the door is `112.47 × 44` with `spill: 0`, and every control in the dialog it
      opens clears 44px over a sheet that actually drew — but a real roster is twenty-five rows and a
      real term is more than ten columns, and the thing to find out is whether the preview is
      readable at arm's length or whether it is a wall of numbers you have to print to use.

*The desk half: `verify-shell.mjs` **662 checks · 662 passed · 0 failed · 0 skipped**, up from 636 on
the tree this work order arrived on — twenty-six in a new section at the foot of the file, and none
anywhere else. Twenty-two of those were the build; the print-gate fix replaced one check with four,
and **two of the four fail on the build the owner tested**, which is what makes them a regression test
rather than a description. The twenty-sixth came out of the re-test: a print-call counter the section
had collected from the first day and never asserted, promoted to a check to answer whether Chrome's
throttle message was ours.*

*The one they replaced asserted that the attribute was off again 700ms after the tap — it went green
on every run and the surface was broken anyway, because it measured the timer rather than the paper.
That is the check to remember the next time a print surface is verified: what a gate is 700ms after a
tap is not what it is when the browser prints.*

*The rest of the desk half: `wo-sweep.mjs` is **17 checks · 15 passed · 0 failed · 2 to review**. Both REVIEWs
were read rather than waved at. The sensitive-field sweep is **191 mentions across 16 files**, and the
file new to that list is `src/grades-report.js`: its three mentions are prose in comments, stating at
the point where a future author would break it that none of that data reaches these surfaces, plus the
note the dialog prints saying the same thing to the teacher. That file has no `supports` identifier in
executable code and does not import `src/supports.js` at all. The due-date REVIEW is
`src/grades-report.js:509`, which is that same printed note stating the rule it is flagged for:
*"Nothing on this sheet was worked out from a due date either: late and missing are only ever there
because you marked them."* The coarse-block sweep reports **29 new selectors, all covered** — this
sheet's block names every one of them, including the two that are text rather than targets, for the
reason `src/attendance.css`'s does. `src/grades-report.js` is added to `SHELL`, and `sw.js`'s `CACHE` went to `planbook-shell-v48` for the
build and then to **`v49` for the print-gate fix** — a second bump on an uncommitted change, which the
"one bump per deploy" rule does not obviously ask for and which is right anyway: the owner had already
installed v48, so v48's cache holds the **buggy** `src/grades-report.js`. Without the bump the re-test
would have been served the defect it was testing for.*

*Three mutations, all reverted, and the first two are the ones worth knowing about.*

| Mutation | Result |
|---|---|
| `sheetOrder()` returns the list untouched — the sheet prints assignments in document order | **3 red.** The column-order check names the order it got (`Ch 1 Homework [9/25]` first); the marks check goes red because the cells move with the columns; the CSV check goes red on the assignment key. `658 · 655 · 3` |
| A blank cell prints `0` instead of nothing | **1 red**, and the interesting part is which one. The hand-written cell matrix catches it (`0 empty cell(s), 21 reading "0"`) and **the CSV-versus-page comparison stays green** — both surfaces take their strings from one function, deliberately, so a defect they share keeps them in agreement. The two checks are complementary rather than redundant, and this is what established that rather than a reading of the code. `658 · 657 · 1` |
| The rows are resolved in stored roster order instead of through `gridOrder()` | **3 red.** The row-order check names `["Zabkowski, Abe","Ñuñez-Öztürk, Zoë",…]`, the totals check goes red because the totals move with the rows, and the marks check goes red on the flag positions. `658 · 655 · 3` |

---

### WO-3.6 — The past-due prompt

**What this adds.** A banner above the score grid and above the assignment list: *"6 blanks are past
due — mark them missing?"*, with **Review the 6**, **Mark them missing** and **Not now** beside it.
Accept writes `{ v: null, flag: "missing" }` to exactly the cells the review listed; dismiss writes no
cell at all and stops the prompt asking about that work on this browser.

**It is a prompt and it is never arithmetic**, which is the whole work order. An earlier draft of this
app computed `missing` from the due date — blank plus past-due equalled zero — and the rule that
replaced it is stated in four places before this build: `CLAUDE.md`, `docs/data-model.md` § *"Missing
is marked, never inferred"*, `src/assignments.js` decision 1 and `src/scores.js` decision 1. Nothing
here writes until the teacher taps the button that says in words what it will do, and the sentence
under the question says the same thing the overdue tint's tooltip says one screen over: *nothing has
been marked and no grade has changed*.

**A past-due blank is narrower than an empty cell, and that is the safety of the feature.** The set is
a cell carrying **nothing** — no key at all, or (from a restore or a hand edit) neither a value nor a
flag — on an assignment whose due date is a real date **strictly before today**, in the open class and
term, for a student on that class's roster. `excused` is not in it, because an excused student swept
into `missing` is a teacher's decision turned into a zero. Neither is a `late` with no score yet: that
flag records that the work arrived, and marking it missing would record that it never did. So this
count and the score grid's own "N blanks" can legitimately differ on screen at once — they answer two
different questions, and this one is allowed to be the smaller.

**It is a banner in the view rather than a dialog, and that was the decision most likely to go wrong.**
`plans/gradebook-surfaces.md`'s test — a surface you work in is a view, a task you finish and dismiss
is a modal — does not settle a prompt that appears unasked. Three things do. WO-3.5 shipped *"`Esc`
mid-column closes nothing, because there is no dialog to close"* as a tested acceptance line, and a
dialog on arrival would put something on screen for that key to close. A focus trap on arrival stands
between the teacher and the first cell of the column she came to type. And the prompt is not a task she
came to finish: it is the screen telling her something before she starts, which is exactly what the
no-grade banner one row above it is — so it is the **same component**, Roll Call!'s inline notice
banner as `src/scores.css` already lifted it, in the overdue tint's own amber. The review expands
**inline** under the sentence for the same reason.

**A dismissal is a UI preference, not a field in the year document.** `planbook_pastDueDismissed` holds
`{ "<assignmentId>": true }` and nothing from inside a document — no name, no due date, no student, no
score — which is the same category of fact as `openClassId`. The year document was the other candidate
and is the wrong home: it syncs and is restored from backup, so a field there would be a schema change
for a banner, and a restore would resurrect or destroy dismissals along with the grades. The accepted
cost, stated rather than hidden: **dismiss on the laptop and the iPad still asks once.** For a prompt
whose job is to ask, that is the right way round.

- [x] On opening the class gradebook the prompt is up and says the work order's own sentence word for
      word — **"6 blanks are past due — mark them missing?"** — asserted as that string rather than as
      a regex over a number, because the copy is a deliverable.
- [x] It names the two assignments it means, and the one due **today**, the one due **tomorrow** and
      the one with **no due date** are named nowhere. An empty due date is valid and can never be past
      due; a date that is today has not gone by.
- [x] It is a **banner in the view** — inside `<main>`, no `role="dialog"`, no `aria-modal`, no overlay
      anywhere in the score grid and nothing open over it — carrying exactly three controls.
- [x] `Esc` pressed **twice** with the prompt on screen closes nothing: the banner is still up, the
      grid is still up, no dialog appeared, and the caret is still in the cell it was in. This is
      WO-3.5's acceptance line 7 re-asserted over the new surface, because the obvious build of this
      work order is the one that breaks it.
- [x] The review lists **exactly the six cells** the sentence counted, and the excused cell, the late
      blank, the scored cell and every cell on the three assignments that are not past due are none of
      them.
- [x] The same prompt, from the same computed set, is on the **assignment list** — the other screen the
      work order names — saying the same sentence.
- [x] **Dismissing changes no score.** Every score cell in the whole document is byte identical either
      side of the tap — asked of `scores` entire rather than of this fixture's own columns, so a build
      that wrote somewhere else could not pass by being out of frame.
- [x] **Dismissing changes no grade.** All five displayed grades are the same strings after the tap as
      before it, and both agree with the engine asked separately.
- [x] What a dismissal *did* write is one UI preference and nothing else: `planbook_pastDueDismissed`
      holds the two assignment ids and `true`, and nothing from inside the document.
- [x] **A dismissed prompt does not reappear on every render** — four renders, each a real navigation:
      the repaint the dismissal itself did, a switch to the assignment list, a switch back to the grid,
      and a **full page reload**, which is the one that tells a preference apart from a variable
      somebody set.
- [x] And the dismissal is **per assignment rather than global**: on the same reloaded page the other
      class's prompt is still up, still counting six. This is the half a build passes by switching the
      feature off.
- [x] **The grade before accepting is identical to the grade with the prompt never shown.** The second
      arm is a twin class — same weights, same points, same scores — whose prompt was dismissed before a
      reload, so the render being read has never drawn one. Both arms also agree with the engine.
- [x] **Accepting writes to exactly the previewed cells.** The set of cells that changed in the document
      is the set the review listed, with nothing added and nothing left out — and the previewed ids are
      read off the **screen** rather than out of the module, because the acceptance line is about what a
      teacher could have read.
- [x] And what it wrote is `{ v: null, flag: "missing" }` in exactly that shape, six times, while the
      excused cell, the late blank, the scored cell and the cell on the assignment due today are byte
      identical to what they were.
- [x] **The grades move when she accepts** — row 1 from a hand-computed 68.00% to a hand-computed
      50.00%, all five rows moving — which is what makes every "nothing changed" reading above a claim
      rather than a screen that cannot move at all.
- [x] After accepting there is nothing left to ask about, so the prompt goes, and the six cells wear the
      **missing flag in the grid**, where any of them can be taken off again.
- [x] All three of the prompt's controls measure **≥44px on an emulated coarse pointer**, on a banner
      that is actually up. The standing WO-2.21 sweep opens every view and cannot find these: it runs
      thousands of lines before this fixture, where nothing in the document is past due, so the banner
      is not on screen to be walked.
- [x] On the iPad, the three controls are separately tappable and **"Mark them missing" is not
      mis-tapped for "Not now"** — the one control in this app that writes a flag onto a column of cells
      the teacher did not point at. 👤 *(Owner, 2026-08-13, on the installed app. The boxes are measured
      above; no emulator has a thumb.)*
- [x] On the iPad, the banner reads as **an offer rather than an error** at a glance, in amber, above a
      grid the teacher came to type in — and it does not push the first row of the grid off the fold in
      landscape. 👤 *(Owner, 2026-08-13. This is the WO-2.11 question again — a lifted component can be
      right in every measurement and wrong in the room, and this time the lift held.)*
- [x] Offline launch with the network off, `src/past-due.js` served from the precache
      (`planbook-shell-v51`). 👤 *(Owner, 2026-08-13.)*

*The three 👤 lines were run by the owner in one sitting on 2026-08-13, on the installed home-screen
app against `planbook-shell-v51`, and all three passed as written. The banner reads as an offer.*

*The desk half is `verify-shell.mjs`, **694 of 694 with zero skips**, in 226s, 17 checks added in one new
section at the foot of the file (19 call sites, two of them fixture-guard failure arms that never fire
on a green run). Three things about the fixture are worth knowing.*

***It is two classes, and it has to be.*** *Acceptance line 2 is "the grade before accepting is
identical to the grade with the prompt never shown", and one class cannot hold both arms of that — the
prompt has been shown on it. So `c_wo36` and `c_wo36b` are twins, the run dismisses the prompt on the
second one and then reloads the page, and the dismissal is already true in `localStorage` before the
document is open on the way back up. That is a render where the prompt was never drawn, obtained
rather than argued for.*

***Five assignments, and each one is a case.*** *Due yesterday (2 blanks, plus the scored, excused and
late cells that must survive every tap); due yesterday again (4 blanks, which is what makes the "In A
and B" sentence and the per-assignment dismissal testable); due **today**, which is the off-by-one the
whole feature turns on; due tomorrow; and no due date at all. Two plus four is six, which is the work
order's own sentence. The dates are derived in Node off the same machine clock and never asked of the
app, for the reason `nodeToday` states above the assignments section: a check that asked the page what
yesterday was would agree perfectly with a build that read UTC.*

***Every "nothing moved" reading is taken beside one that proves the screen could move.*** *Three of
the four acceptance lines are satisfied perfectly by a build that draws no prompt at all, so the accept
at the foot of the section is the negative control for all of them: row 1 goes from a hand-computed
68.00% to a hand-computed 50.00% on the same rows the checks above assert are still.*

*`wo-sweep.mjs` is **17 checks, 14 passed, 0 failed, 3 to review**, and all three REVIEWs were read and
answered rather than silenced. The sensitive-field-name line now names `src/past-due.js`; the hit is
that file's own prose saying the review lists **student names and nothing else** — no plan, no
accommodation, no indicator — which is `src/scores.js` decision 5 applied to a list of names on a
screen a teacher projects. The due-date REVIEW names five lines in `src/past-due.js` and one in
`src/shell.js`, and every one of them is prose or teacher-facing copy: the header's account of the
draft this work order replaced, the button label "Mark them missing", its `title`, and the sentence
itself. **The comparison that actually reads the clock is `assignment.due < today`, on a line that does
not contain the word `missing` at all** — which is a fact about how the grep is written rather than a
claim, and is the reason that check is a REVIEW. The four selectors with no coarse-block rule —
`.past-due-said`, `.past-due-lead`, `.past-due-review`, `.past-due-names` — are two containers and two
text elements; not one is tappable, and the three real controls inside them are measured above.
`src/past-due.js` is added to `SHELL` and `sw.js`'s `CACHE` went to `planbook-shell-v51`.*

*Two mutations, both reverted, and both are about the set rather than about the plumbing — because the
plumbing is the part a green run over the wrong set would still report.*

| Mutation | Result |
|---|---|
| `isUntouched()` stops asking about the flag — every cell with no number is a past-due blank, which is the score grid's own `isUngraded()` and the obvious thing to reuse | **8 red**, and the one to read is *"the excused cell reads `{"v":null,"flag":"missing"}`"*. The sentence goes to *"8 blanks are past due"*, the review lists the excused and late cells, and accept turns a teacher's decision into a zero. `694 · 686 · 8` |
| `assignment.due < today` becomes `<=` — a date that IS today counts as past due | **9 red.** *"10 blanks are past due"*, the cell on the assignment due today stops being byte identical, and the dismissal preference picks up a third assignment id. `694 · 685 · 9` |

*What is **not** here. The **overdue tint on a score-grid column head** is drawn in
`design/mockups/proposed.css` and was not built here: this work order's Deliverables are the prompt,
the accept/dismiss and the review. It was written up as a proposed follow-up in
`.claude/dispatch/WO-3.6-result.md` rather than folded in, booked the same day as **WO-3.19**, and
landed there — see § WO-3.19 below, which rides on this section's own fixture because its third
acceptance line is an identity with the set this one computes.
`shortDate()` is now the **third** copy of the same eight lines in `src/` — `src/scores.js` and
`src/assignments.js` carry the other two, each with a note saying why it is not an import — and the
honest fix is one exported formatter, which is two shipped files this work order does not own. Also in
the result file.*

---

### WO-3.8 — Accommodation prompts at point of use

**What this adds.** A summary inside the assignment editor, for the category the teacher has chosen:
*"3 students have extended time, 2 need a separate setting."* — with **Show which students** beside it
and nothing else. The counts are the default, the names are one deliberate tap away, and the whole box
is **absent from the DOM** while presentation mode is on.

**"A list nobody opens protects nobody."** `docs/data-model.md` § Accommodations rule 3 asks for
exactly this and gives the sentence above as its worked example; the shipped build produces that
string rather than approximating it, which is why the check asserts it as a string. A teacher is
legally obligated to implement an accommodation, and a roster field she has to remember to open is a
field she opens in September and not in March.

**The match between `appliesTo` and a category is between two pieces of teacher prose, and it leans
toward firing.** `appliesTo` is free text typed on the roster (`src/supports.js`'s `parseAppliesTo`
records why there is deliberately no id to join on: an accommodation follows the student across five
classes whose categories differ), and a category name is free text typed in the categories editor. So
`appliesToMatches()` folds both sides to lower case, splits on anything that is not a letter or a
digit, stems each word, and matches when either side's words are a **subset** of the other's — `tests`
covers `Unit Tests` and `unit tests` covers `Tests`. Word sets rather than substrings, because `art`
is a substring of `Participation`. **Under-firing is the failure that matters**: a prompt that does
not appear is a legal obligation not surfaced, and it is invisible. A prompt that appears when it need
not is one extra line in a dialog.

**Presentation mode means nothing at all, and a count is a disclosure too.** *"3 students have extended
time"* on a projected screen, in a room of thirty, beside a roster on the wall, narrows to individuals
— so there is no greyed-out version, no collapsed version with a number in it, and no styling that
only looks absent. The host is emptied and hidden, `src/accommodation-prompt.js` asks
`src/supports.js`'s one question rather than testing the preference, and every string that comes out
of `supports` is written through `setSensitiveText()` so a caller cannot route one somewhere else.

- [x] Creating a test surfaces the counts, in the data model's own words — **"3 students have extended
      time, 2 need a separate setting."** — through the real **+ New assignment**, which files into the
      class's first category.
- [x] It says where the counts came from, so a count with no scope on it is not left to be guessed at:
      *"They apply to work in “Tests”… never printed, exported or put in a draft… presentation mode
      hides it entirely."*
- [x] **The default view is counts, not names**: the reveal is drawn and collapsed, and not one of the
      five students is named anywhere in a dialog of 1,094 characters.
- [x] One deliberate tap puts the five names on screen, grouped under the kind they belong to — and
      the sixth student, whose accommodation is scoped to `labs, field work`, is not among them.
- [x] **Changing the same open editor to Homework surfaces nothing at all.** Host hidden, host text
      `""`, zero reveal hooks, kind phrases gone from a page of 23,771 characters. The roster still
      carries an accommodation, so this is a scope that does not match rather than a class with
      nothing on file — and the summary is recomputed rather than remembered, which is the failure a
      summary computed once on open would be.
- [x] Changing back to Tests restates the same sentence **with the names back behind the tap.**
- [x] **In presentation mode nothing appears at all — not even the count.** Host empty, `.hidden`,
      `display: none`, zero reveal hooks, no kind phrase left on a page of 24,104 characters, read
      with the editor still open on the category that was showing all of it a moment earlier.
- [x] And the reveal is **not merely un-drawn**: called straight through the seam with the mode on, it
      writes nothing either — so the guard is in the module rather than in the absence of a button.
- [x] Flipping the mode back off brings the same counts back to the **same open dialog**, names still
      behind the tap. This is the negative control for every absence above.
- [x] A flip made the way a teacher can actually make one — **with the editor shut**, because a modal
      scrim owns the viewport while it is open — leaves no summary sitting in the shut dialog, where
      it would be out of sight and still in the DOM.
- [x] **An empty `appliesTo` means everything, and a blank accommodation row means nothing.** The
      second class's one student carries a `breaks` row scoped to nothing and a blank row of the kind
      a mis-tap writes; its homework assignment says exactly *"1 student needs breaks."*
- [x] The match rule answers **thirteen cases** as described — case, whitespace, plurals and both
      directions of narrowing all fire; `tests` against `Homework` and `art` against `Participation`
      do not; an empty `appliesTo` fires on everything including no category at all.
- [x] **A keyboard print with no gate set leaves the whole app on the page and takes this prompt off
      it.** The three gated print blocks already hide every child of `<body>` but their own surface;
      what is left is a Ctrl+P made with this dialog open, and one ungated `display: none` closes it.
- [x] The reveal measures **≥44px on an emulated coarse pointer**, on a prompt that is actually up.
      The standing WO-2.21 sweep cannot find this one: it runs thousands of lines before this fixture,
      and the prompt is only on screen while a matching category is chosen.
- [x] On the iPad, **"Show which students" reads as a disclosure rather than as a "more" link**, and
      is not mis-tapped for Done or Delete… beneath it. 👤 *(The box is measured above; no emulator
      has a thumb.)*
- [x] On the iPad, the box reads as **a fact about students rather than as a warning** — it wears the
      student editor's subdued support card, deliberately not the past-due amber twenty lines up the
      same stylesheet. 👤 *(This is the WO-2.11 question again: a lifted component can be right in
      every measurement and wrong in the room.)*
- [x] On the iPad, a teacher who turns presentation mode on with this dialog open can **tell that the
      box has gone** rather than wondering whether the assignment lost something. 👤 *(There is no
      replacement sentence where the box was — deliberately, since any placeholder says that
      something is being hidden about this class. Whether that silence is the right call is a
      judgement to make in the room.)*
- [x] Offline launch with the network off, `src/accommodation-prompt.js` served from the precache
      (`planbook-shell-v52`). 👤

*The desk half is `verify-shell.mjs`, **710 of 710 with zero skips**, in 226s, 16 executed checks in
one new section at the foot of the file ahead of the print-gate block (18 call sites, two of them
fixture-guard failure arms that never fire on a green run).*

***The fixture is two classes, and each exists for a line the other cannot make.*** *`c_wo38` carries
six students and **not one empty `appliesTo`**, which is what lets Homework be genuinely empty while
the roster still has accommodations on it. Its Tests half is arranged to produce the data model's own
sentence: three students scoped `tests` / `Tests` / `unit tests` and two scoped `quizzes, tests` /
`TESTS ` — exact, case-only, narrower-category, multi-term and trailing-whitespace, in one reading.
`c_wo38b` carries one student with two rows, `breaks` scoped to nothing and a blank row, so a build
counting rows rather than answers says "1 student needs breaks, 1 has an accommodation on file" and is
red there and nowhere else.*

***The first run found the check wrong rather than the app.*** *Written as one sentinel set swept over
the whole page, five checks went red naming all five students — on the first paint, with zero name
chips drawn. The names were real and were not this prompt's: the class's attendance registry inside
`#classView` had drawn its six rows, the Assignments segment hides that view rather than emptying it,
and `document.documentElement.textContent` reaches every hidden element by design. **A student's name
is not the secret** — it is on the roster, the registry, the grid and the printed sheet. What is
secret is the pairing, and the kind phrase on its own. So the sets split: kind phrases are swept over
the whole page, names over the assignment editor.*

*`wo-sweep.mjs` is **17 checks, 15 passed, 0 failed, 2 to review**, and both REVIEWs were read. The
sensitive-field-name line now names three more files: `src/accommodation-prompt.js`, which is the
feature and whose every hit is its own prose or its own imports; `src/assignments.js`, whose nine hits
are one paragraph of header comment and one `import` line — that file reads no student's `supports`
block and has no path to one; and `src/assignments.css`, whose hits are class names and comments. The
due-date REVIEW is unchanged from WO-3.6 and names no line this work order wrote.
`src/accommodation-prompt.js` is added to `SHELL` and `sw.js`'s `CACHE` went to `planbook-shell-v52`.*

*Three mutations, all reverted.*

| Mutation | Result |
|---|---|
| the module's own `supportsVisible()` guard dropped from both `groupsFor()` and `draw()` — the presentation-mode suppression removed, leaving only the `setSensitiveText()` funnel under it | **2 red.** The funnel held the parts it covers — the sentence blanked, the name chips blanked, zero kind phrases and zero names on the page — and **the box, its scope line and the reveal button survived**: *"They apply to work in “Tests”… Show which students"*, `hidden = false`, `display = flex`, 1 reveal hook. Which is the acceptance line failing exactly as written: *not even the count*, and a box saying something applies here is a disclosure with the number taken out. `710 · 708 · 2` |
| `isRealRow()` dropped, so a blank accommodation row counts | **1 red**, and only the class that has one: *"says `1 student needs breaks, 1 has an accommodation on file.`"* One student, counted twice, over a row a mis-tap wrote. `710 · 709 · 1` |
| `appliesToMatches()` tightened to exact equality — the tidy rule, and the one that under-fires | **6 red.** The sentence drops to *"2 students have extended time"*, the reveal lists four names instead of five, and the rule table names both directions that stopped working: `unit tests` against `Tests` and `tests` against `Unit Tests`. This is the invisible failure the design leans against, made visible. `710 · 704 · 6` |

*What is **not** here. **Acceptance line 4 is deferred to WO-4.4 and its box stays `- [ ]`**, with a
`→ WO-4.4` pointer and a `**Owes**` field on the header — `wo-gate.mjs --audit` resolves it. The
deferral is for a narrower reason than the work order's own parenthetical guessed: attendance marking
and its counts shipped at WO-2.1 and WO-2.4, so the behavior log was never what it was waiting on.
What is missing is the clause. `supports` has no attendance-clause field, `appliesTo` is documented as
being about grading categories, and `signals` is deliberately empty in `src/store.js` — so both the
clause's shape and its N are Phase 4's to decide, and a heuristic over the free-text `behaviorPlan`
would be this app guessing at a teacher's prose about a child. Also not here: a `closeModal` hook that
lets a dialog wipe sensitive DOM at the moment it closes. This prompt clears on the next paint and on
a presentation-mode flip, which is the same posture `src/roster.js`'s student editor has held since
WO-1.8 — the general fix would improve both and is two shipped files this work order does not own. It
is written up in `.claude/dispatch/WO-3.8-result.md`.*

---

### WO-3.19 — The overdue tint on a score-grid column head

**What this adds.** One colour. A column head whose work the past-due prompt is asking about prints
its due date in `#8a6d1a` instead of `#a0aab8` — the amber the assignment list's own due dates already
wear and the banner is already written in. The banner says *"6 blanks are past due"*; this says
**which columns**, without the teacher opening the review.

**The comments were the deliverable, not the pixel.** Nine comment sites across five files named
WO-3.6 as the owner of every rule about a past due date on the score grid, and WO-3.6 closed ✅ DONE
without the tint — correctly, since it was not in its Deliverables. That left prose pointing the next
reader at a closed work order for work nobody was going to do, on the two files (`src/scores.css`,
`src/scores.js`) that WO-3.13, WO-3.15 and WO-3.16 each open on their way in. `src/scores.css`'s rule
had a paragraph explaining why it was *absent*; that paragraph now explains what it is.

**One reader of the clock.** `src/scores.js` still contains no comparison against a date and imports
no `todayISO()` — its decision 1 is unchanged and is the reason the tint is built this way.
`columnHead()` asks `src/past-due.js`'s `pastDueAsksAbout()`, a read of the set the banner was drawn
from a few lines earlier in the same render. So the amber heads and the sentence cannot name different
work, and `AGENTS.md`'s *"do not add a second reader of the date"* is honoured by there being nothing
new to read it with.

- [x] The tint is on **exactly** the column heads the prompt is asking about — `["wo36-past",
      "wo36-past2"]` against the assignment half of the review's own previewed cell ids, taken off the
      screen rather than recomputed in the check.
- [x] The assignment due **today**, the one due **tomorrow** and the one with **no due date** are none
      of them — and three of those four columns do print a due date, so the untinted ones are present
      and grey rather than missing.
- [x] The tint **writes nothing**: with two heads amber on screen, every score cell in the whole
      document is byte identical to what was planted — through a coarse pass, two reloads, four
      navigations and two `Esc` presses — and all five grades still agree with the engine asked
      separately.
- [x] A column **stops being amber on the same render** its blanks are marked: `["wo36-past",
      "wo36-past2"] -> []` on the redraw after **Mark them missing**, with all four due dates still
      printed. The tint comes off; the head does not empty.
- [x] The ink is **`rgb(138, 109, 26)` — `#8a6d1a` — on both screens at once**, read off the drawn
      column head and the drawn assignment-list date in the same reading. Lifted from
      `design/mockups/proposed.css`, matching `.assign-date.overdue` and the `.past-due` banner: one
      amber at three volumes.
- [x] `grep -rn "WO-3.6" src/ design/` names no comment claiming WO-3.6 owns unbuilt work. Nineteen
      hits across eight files, each read; the accurate ones are still there, because a blanket rewrite
      would destroy true provenance — which is this work order's own failure pointed the other way.
- [x] 👤 On the iPad in a lit classroom, the tint reads as a **nudge rather than an error state**, and
      is legible at the coarse-pointer 10px against the head's existing `#a0aab8` beside it. *(Owner,
      on the teaching iPad, 2026-08-13. Asked in the same sitting: is the amber staying up for one
      render after **Not now** noticeable or confusing? Answered **no** — which is the one behavioural
      question the desk could not settle, and it closes in favour of the existing behaviour.)*

*The desk half is `verify-shell.mjs`, **714 of 714 with zero skips**, in 233s — four checks added
inside the existing WO-3.6 section rather than in a new one, because acceptance line 3 is an identity
with that section's own set and a second fixture could only ever have been compared for agreeing with
the first. `wo-sweep.mjs` is **17 checks, 15 passed, 0 failed, 2 to review**, and both REVIEWs are
WO-3.6's unchanged: the sensitive-field-name line names no file this work order wrote a field into,
and the due-date line names the same eight prose lines it named before this landed. The one new CSS
selector, `.scores-col-due.overdue`, is covered in the coarse block by its own base rule — it is a
colour on a label, not a control, and there is no target here to hold at 44px. `sw.js`'s `CACHE` went
to `planbook-shell-v53`.*

*One mutation, reverted.*

| Mutation | Result |
|---|---|
| `pastDueAsksAbout()` answers its own `due < today` off the document instead of reading the prompt's set — the obvious build, and the one the work order's third deliverable forbids | **1 red**, and it is the line that matters: *"amber heads `["wo36-past","wo36-past2"]` -> `["wo36-past","wo36-past2"]`"* after **Mark them missing**. Every other check stays green, including the two that compare the tinted set to the prompt's — a date-only tint agrees with the prompt right up until the blanks are filled, which is why acceptance line 4 exists and why the first three could not have caught this. `714 · 713 · 1` |

*What is **not** here. **No tint on a cell**, and no change to what the prompt counts — both are the
work order's Out of scope line. The **assignment list's own tint is untouched**, and it deliberately
does not match this one after a dismissal: it asks "this date has gone by with the column unfinished",
this one asks "the prompt is asking about this column", and `src/assignments.js`'s import comment now
says so at the point a reader would ask. A **"Not now" leaves the amber up until the next render** —
`src/past-due.js` paints its own banner and cannot touch a grid it does not import, and rebuilding the
grid under a teacher who may have a digit half-typed is a cost `src/shell.js` already refuses to pay
for a tap that wrote nothing. That is written down at the chain rather than left to be found.*

---

### WO-3.16 — Left and right arrows move across the grid

**The rule the work order refused to decide in advance, and what it came out as.** `←` and `→` are
also how a caret moves inside a score being corrected, so they belong to the grid only when the caret
has nowhere left to go in the direction pressed: the field is empty, the whole value is selected —
which is what every keyboard arrival leaves behind — or the caret is collapsed against that end.
Anything else is an edit in progress, `handleScoreKey()` answers `false`, and `src/shell.js` does not
`preventDefault`, so the browser moves the caret. **The edge behaviour is symmetric with the vertical
pair and which presses reach the edge deliberately is not**: up and down mean nothing to a caret in a
one-line field, and left and right mean everything.

**What it costs, accepted rather than missed.** In a cell arrived at *by keyboard*, with the value
selected, neither arrow puts a caret inside the number — both move a cell. The ways in are a tap and
the first digit typed, which collapses the selection and hands the arrows straight back. The
alternative — a first press that only collapses the selection and a second that moves — would make
four columns eight presses, and the odd-numbered ones would read as keys that were not received.

**What it says at the edge, and what it does not.** *"Score Row12: that is the first assignment."*
The fixed thing is named first on both axes — the column being worked down, the student being worked
along — and the count is dropped. *"N of M entered"* down a column is progress through a task the
teacher is in the middle of; along a row it would count one student's blanks, which is not a task
anybody is finishing, and a bare *"4 of 10 entered"* beside a name invites being heard as how that
student is doing. The grade two columns to the left is this app's only answer to that question, and
it is weighted.

- [x] `→` from a full cell moves **one column right along the drawn row**, same student, with the
      arrived-at value selected for overtyping — `wo35-a1 "72" → wo35-a2 "15" → wo35-a3 "10"`, each
      arriving selected `0..2`, asserted as an **index along the row** rather than by assignment id so
      that a grid drawing its columns in another order could not pass.
- [x] `←` at the first assignment **clamps rather than wrapping**: the caret and its selection do not
      move, the whole score map is byte-identical either side of the press, and the live region says
      *"Score Row12: that is the first assignment."* — **exactly once**, counted through a
      `MutationObserver` on `#srLive` rather than inferred from what the region holds afterwards,
      because `announce()` replaces its text and a second sentence would leave one `textContent`
      behind and read as a single one. **The right edge is pressed too**, added on the correction
      round: `→` walked out to the tenth of ten drawn columns with the key itself says *"Score
      Row12: that is the last assignment."* — once, with the caret unmoved and the score map
      byte-identical. Until then that sentence, which the Deliverables name by hand, existed only as
      the `step > 0` arm of a ternary no keystroke had reached.
- [x] **With the caret mid-value, `←` moves the caret and not the cell.** Driven with real keystrokes:
      15 corrected to 100 over the selection, which leaves the caret at 3, then two `←` presses take
      it to 2 and to 1 with the cell unchanged and `{"v":100}` still stored. Pressed at the column
      **one in from the edge**, so there is a column to its left for a build that stole the key to
      land on — at the first column it would have passed by geography.
- [x] The vertical pair is unchanged and its checks are green unchanged — `Enter` at the bottom of a
      column, `↑` mid-column, and `Esc` twice, all still passing with no edit to their code. The two
      movers are separate functions; `moveWithinColumn()` was not refactored into a shared one.
- [x] Twenty-five scores down a column is still **twenty-five keystroke-groups and no mouse** — the
      pre-existing check, with its page-side mouse counter still reading 0.

*The desk half is `verify-shell.mjs`, **762 of 762 with zero skips**, in 246s on the corrected tree
(761 in 253s on the first) — four checks added at
the foot of the existing WO-3.5 score-grid block rather than in a section of their own, because the
horizontal pair needs twenty-five rows and ten drawn columns to move across and a second fixture
could only have been that one retyped. They go last in the section deliberately: the third types a
correction into a cell in order to press `←` inside it, and every arithmetic claim above is made
against case 1's row, so row **s12** is used and case 1's **s20** is never touched. The fourth
carries on from where the third leaves the caret and walks to the right edge with the key, so the
two presses that only move the caret inside `100` are part of what it proves. `wo-sweep.mjs` is
**18 checks, 16 passed, 0 failed, 2 to review**, and both REVIEWs are the pair WO-3.19 recorded,
unchanged: no line added here names a due date or a support field. `sw.js`'s `CACHE` went to
`planbook-shell-v62`. **No new CSS and no new control** — the arrows are keys, and the one legend
entry added to `index.html` reuses `.scores-key`, so there is nothing new for the coarse block to
hold at 44px.*

*The correction round was two visible strings and nothing else. The legend entry and the standing
hint both said the pair steps sideways **"from the end of the number"**, which is true of `→` and
backwards for `←`: the implemented rule leaves the cell when the caret has run out of number **in
the direction pressed**, so `←` goes sideways from position 0. The code and the rule were right and
the documentation was wrong — the worse way round for a key whose whole defect mode is reading as
"not received". They now say **"once the caret runs out of number in that direction"** (legend) and
name both ends explicitly (hint). The wording here in `TESTING.md` was correct throughout and is
unchanged.*

*Two things a desk cannot answer and one it can, all three left open. **Nothing here was pressed on
the iPad**, which for this work order is a smaller gap than usual — a hardware keyboard is optional on
that device and the on-screen number pane has no arrow keys — but "optional" is not "absent", and a
Smart Keyboard is how the owner grades at a desk. **The `Shift`+arrow case is named in the code and
not fixed**: `src/shell.js` passes `handleScoreKey()` a key name rather than an event, so a modified
arrow is read as a plain one, exactly as the vertical pair has always read `Shift`+`↓`. And **nothing
asserts what a tap-then-arrow does**, because where the caret lands from a tap is the browser's
answer to where the finger went.*

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

WO-8.1 through WO-8.6 append their acceptance lines as they land. WO-8.8's are below, because a
check that nobody watched fail is not evidence and the place that record goes is here.

### WO-8.8 — read the deployment, not the repository

**What this changes.** Nothing a teacher sees and nothing any other tool prints: `src/`,
`index.html`, `sw.js` and `tools/verify-shell.mjs` are untouched. One new file,
`tools/verify-deploy.mjs`, run by hand after a deploy, plus its section in `tools/README.md`. It
reads the live origin over `fetch` and asserts twelve things about what came back. `verify-shell.mjs`
was **628 of 628 green through both** of the faults it exists for, which is the whole argument.

*Evidence for the Acceptance list in `plans/work-orders/phase-8-packaging.md` § WO-8.8 lives here
and in `tools/README.md`.*

- [x] **Acceptance 1 — green against the live origin.** `node tools/verify-deploy.mjs` against
      `https://planbook.hwgteach.com`, 2026-08-12: `12 checks · 12 passed · 0 failed`, exit **0**.
      Read off the wire: `/` 200 `text/html` `no-cache`; `/sw.js` 200 `application/javascript`
      `no-cache`; **42 SHELL entries parsed out of the deployed worker**, all 200, none redirecting,
      each matching the content type its name implies; `CACHE` both `planbook-shell-v46`; and
      `/_worker.js`, `/_routes.json`, `/functions/`, `/functions/index.js` answering the shell at
      200 `text/html` rather than as script or config.
- [x] **Acceptance 2 — every check watched failing against its own defect**, on a throwaway fixture
      origin in a scratchpad (not committed, the way every mutation in this file is run and
      reverted). The table below. The control fixture is green at 12 of 12, which is what makes the
      reds mean something.
- [x] **Acceptance 3 — unreachable is not a red check.** Three shapes, each exiting **2** under a
      `COULD NOT REACH THE ORIGIN` banner with no summary and no check added: a closed port
      (`fetch failed [ECONNREFUSED]`), a name that does not resolve (`[ENOTFOUND]`), and an
      unroutable address (`[UND_ERR_CONNECT_TIMEOUT]`). The fourth is the one that matters most —
      **the fixture killed part way through the walk**, which stopped at *"nothing was asserted after
      7 check(s)"*, `0 check(s) had failed before the connection did`, exit 2, with the seven passes
      standing and nothing below them turned red.
- [x] **Acceptance 4 — it gates nothing.** `grep -rn "verify-deploy"` over the repository returns
      the file itself, its row and section in `tools/README.md`, this section, and the work order —
      no script, no hook, no workflow. There is no `.github/`, no `.husky/`, no `.git/hooks` beyond
      the samples git ships. The app is `index.html` and `src/` served as they sit on disk, and
      nothing in the deploy path runs Node (`tools/README.md` § The rule).
- [x] **Acceptance 5 — `tools/README.md` gains its section**, including **when to run it**: by hand
      after a deploy, and again after any change to `_headers`, `sw.js`'s `SHELL` list, or the
      Cloudflare zone's caching settings — the three inputs whose effect exists only at the origin.
      Its table row is in place too.

*Thirteen fixture mutations, all of them against a throwaway origin rather than against the
repository, so there is nothing to revert:*

| Fixture | Result |
|---|---|
| `/sw.js` served `public, max-age=14400` — **the WO-8.7 zone fault** | **1 red**: *"cache-control: public, max-age=14400 — a positive max-age here is the Cloudflare zone rewriting `_headers`, not the file being wrong"*, with the dashboard path in the same sentence |
| `/` served `public, max-age=0, must-revalidate` | **1 red**. That value is what this host sends on every path nobody pinned, which is why the check asserts the literal `no-cache` token rather than a semantic equivalent |
| deployed `SHELL` carries `./index.html`, host 308s it to `/` — **the WO-1.14 fault** | **2 red**: the redirect check naming the chain it followed *afterwards* to diagnose (`./index.html 308 → / 200`), and the 200 check. Both of those pass if `redirect: 'manual'` is dropped |
| deployed `CACHE` is `planbook-shell-v45`, working tree `v46` | **1 red**: *"the origin is not serving this tree. Either the push has not landed, the build failed, or you are reading the wrong origin"* |
| a precached stylesheet answering the shell document at 200 | **1 red** on the content type. **Status alone is green here** — this host answers unknown paths with the shell at 200, so a file that was never deployed is invisible to a 200 check |
| `/_worker.js` answering `200 application/javascript` | **1 red**: *"server-side code in this deployment is a decision nobody has made"* |
| an apostrophe inside the deployed `SHELL` array | **4 red**: the parse floor (*"3 entries parsed … below the floor of 10"*), and the three walk checks reporting **"not run"** rather than passing over an empty list. `sw.js`'s own WO-1.10 scar, arriving through the deployment |
| deployed `SHELL` carries an entry the local `sw.js` does not, which 404s | **1 red** — and this is the one that proves the list is read **off the wire**. A build that parsed the local `sw.js` never requests that path and passes |
| `/sw.js` served as `text/html` (the worker never deployed, host falls back to the shell) | **6 red**, cascading correctly: not JavaScript, no `SHELL` to read, three walk checks not run, no `CACHE` found |
| `/` answering `308 → /app/` | **4 red**, including the shell-document check printing the chain and the walk catching `./` as a redirecting precache entry |
| `/` answering `application/json` | **2 red**: the document is not HTML, and `./` fails the walk's type check by the same reading |
| the control fixture, everything correct | **12 of 12 green, exit 0** — an all-red rig proves nothing about a check's aim |
| the fixture killed after four requests | **not a red check**: `COULD NOT REACH THE ORIGIN`, `UND_ERR_SOCKET`, exit 2, seven passes standing and no summary printed |

*The followed-redirect trap was also measured on the live origin rather than argued:
`fetch('/index.html', { redirect: 'manual' })` reports `308 → /`, and the same request with `fetch`'s
default reports `200`, `redirected: true`, `text/html`. That is the WO-1.14 defect being invisible,
in two lines.*

*No 👤 line. Nothing here renders, and nothing here says the app works — that is what the rest of
this file is for.*

**Two follow-ups from this work order, applied 2026-08-12 and measured the same way.**

- **The content-type check printed the pass sentence under a FAIL.** Its condition also covers a
  floor — fewer than ten of the walked paths carrying a type the check recognizes — but its detail
  string branched only on a wrong type, so tripping the floor produced a red line reading *"…carry a
  type this check knows, and each matched"*. A fourteenth fixture proves the new branch: a deployment
  whose `SHELL` parses cleanly at **12 entries** but whose names are extensionless, so `typed` lands
  at 1. Result **11 of 12, one red**, reading *"only 1 of 12 path(s) carry a type this check knows,
  below the floor of 10 — … reported unproven rather than passed. Nothing here says a type is wrong;
  `expectedType()` is what to suspect first."* The failure it describes is one nobody has seen yet,
  which is how it survived review: the live origin types 42 of 42.
- **`verify-shell.mjs` now sets its exit code instead of calling `process.exit()`**, for the reason
  written up in `tools/README.md` — undici holding a socket at exit aborts the process on Windows
  after the output has printed. It is the only other script here that can hold one, through the CDP
  `WebSocket`. Measured **three runs before the change and four after: exit 0 every time, ~200 s
  each, no abort and no hang** — the point of the after-runs being that it still *terminates*, and
  the sweep still reads 629 `check()` call sites, because the change is one line and a comment. No
  abort was ever observed in that file; the change is on exposure, not on a reproduction.

---

This phase's first roadmap item is *this file, complete and fully passing* — which is the
argument for filling it in as the work lands rather than at the end. It also carries the
accessibility pass: screen reader, keyboard-only, contrast. Run it, don't assert it. Roll Call!'s
headless run found 66 unlabelled buttons in an area already ticked done. 👤

---

## Known limitations

Empty until there is an app to have limitations. They get written down here and in `README.md`
before launch, not discovered by a teacher in week one.
