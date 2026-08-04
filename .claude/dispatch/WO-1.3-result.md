# Result — WO-1.3 PWA install path & eviction warning

**Implementer:** Claude (`work-order-implementer`) · **Branch:** `phase/1-shell-store-roster`
**Date:** 2026-08-04 · **Not committed** (the brief did not ask for a commit)

---

## Against the Acceptance list, one line each

| # | Line | |
|---|---|---|
| 1 | Installs to the iPad home screen from Safari and launches without browser chrome | 🙋 |
| 2 | With the network disabled, the installed app opens and every built screen works | 🙋 |
| 3 | Run uninstalled in Safari: the warning appears, names the risk in plain language, gives the install steps | 🙋 (half-verified) |
| 4 | Run installed: the warning does not appear | 🙋 |
| 5 | Deploying a new version updates the service worker and clears the previous cache | 🙋 |
| 6 | Verified on a real iPad, not a desktop emulator — iPadOS version in `TESTING.md` | 🙋 |

Nothing here is ✅ and I want to be blunt about why: **five of the six lines require either an
installed PWA or a real deploy, and I have neither.** What I can report is what is on disk, what
the headless run measured, and exactly where the gap is.

**1 — Installs to the iPad home screen. 🙋**
Everything the install path needs is present and statically valid: `manifest.webmanifest` parses
(`node -e` JSON.parse), declares `display: standalone`, `start_url: "./"`, `scope: "./"`, and five
icons that all exist on disk at the sizes claimed; `index.html` links the manifest and four
`apple-touch-icon` PNGs (152/167/180 plus an unsized default). Safari does not read the manifest
for the home-screen icon, it reads `apple-touch-icon`, which is why those exist separately and as
PNG. *Whether Safari accepts it and launches chromeless is a device fact I cannot produce.*

**2 — Offline with the network disabled. 🙋**
`sw.js` precaches a 15-entry shell and I verified by script that **every path in `SHELL` exists on
disk**, that every `src/*.js|css` is on the list, and that every file in `icons/` is on the list —
a single typo there makes `addAll` reject, the install fail, and offline silently not exist, which
is the failure this check is guarding. Navigations fall back to the cached `index.html`, so a
home-screen launch offline lands on the shell rather than the browser's offline page.
**I never observed the worker register or serve.** `tools/verify-shell.mjs` drives no service
worker, and the brief forbids a second harness — see *Proposed follow-up* below.

**3 — Uninstalled: the warning appears, names the risk, gives the steps. 🙋, one half measured.**
The "appears" half has real evidence. `node tools/verify-shell.mjs` measured **22** visible
interactive elements where `HEAD` measured **21**, and the extra one is
`.install-banner-dismiss` — the harness excludes anything `display:none` or zero-size, so the
banner was genuinely revealed by `refreshInstallBanner()` in a browser that is not installed.
It also passed the ≥44px coarse-pointer check. The copy is at `index.html:102-120`; judging
whether it reads as plain teacher language, and confirming it in *Safari* specifically, is human
work.

**4 — Installed: the warning does not appear. 🙋**
One line of code, unexercised: `el.classList.toggle('hidden', isInstalled() || snoozed)` in
`src/install-banner.js`. The banner is `hidden` in the markup and only ever revealed by that call,
so an installed launch cannot flash it. `isInstalled()` tests `display-mode: standalone` **or**
`navigator.standalone` — the second is what covers the older iPads in a school cart, where the
first does not match. Cannot be checked without installing.

**5 — A new version updates the worker and clears the previous cache. 🙋**
Code-level: `activate` deletes every cache whose name is not the current `CACHE`, then claims
clients; `install` calls `skipWaiting()`. The precache uses `new Request(url, {cache: 'reload'})`
so a deploy cannot precache the HTTP-cached copy of the file it is replacing — that one bites as
"I bumped the version and nothing changed." **Not exercised.** This is the one line that is
desktop-testable without an iPad, and I put the exact procedure in `TESTING.md` so it is a
two-minute check rather than a research task.

**6 — Verified on a real iPad. 🙋**
Cannot be faked and I did not try. The Environment table in `TESTING.md` already carries
iPadOS 26.5.2 from WO-1.2's pass; the WO-1.3 line asks for it to be re-recorded for this pass.

### Also owed, and added to `TESTING.md` unticked

`viewport-fit=cover` is now set, so **WO-1.2's safe-area line is live for the first time** —
`node tools/verify-shell.mjs` now passes the precondition check that failed by design before this
work order (28 checks, 28 passed, 0 failed, 0 skipped; it was 27/1 fail at `HEAD`). That check
proves the insets *can* resolve non-zero, not that nothing sits under them. The iPad half is
👤 and I added it to the checklist rather than letting WO-1.2's tick stand for it.

---

## Files created

- `c:\dev\planbook\src\install-banner.js` — install detection, the banner's show/hide, the dismissal
- `c:\dev\planbook\tools\make-icons.mjs` — draws the icons, writes PNGs with `node:zlib`
- `c:\dev\planbook\icons\icon-152.png`, `icon-167.png`, `icon-180.png`, `icon-192.png`, `icon-512.png`

## Files modified

- `c:\dev\planbook\index.html` — `viewport-fit=cover`, `black-translucent`, `theme-color`,
  `apple-mobile-web-app-title`, manifest link, four `apple-touch-icon` links, the banner markup
  and its copy, header comment updated
- `c:\dev\planbook\manifest.webmanifest` — replaced the WO-1.1 placeholder wholesale
- `c:\dev\planbook\sw.js` — replaced the WO-1.1 placeholder wholesale; both of its warnings
  (`file://`, never cache the year document) are kept and the second is now enforced in code
- `c:\dev\planbook\src\shell.css` — `.install-banner` section, the tappable-class group, the
  `(pointer: coarse)` entry, the 640px padding
- `c:\dev\planbook\src\shell.js` — `data-install-dismiss` hook, `refreshInstallBanner()` at boot,
  service worker registration, two more entries on the `window.planbook` seam
- `c:\dev\planbook\src\prefs.js` — the first real `PREF_DEFAULTS` entry
- `c:\dev\planbook\src\README.md` — one table row saying where images live and why not `src/`
- `c:\dev\planbook\tools\README.md` — `make-icons.mjs` row, and a sentence on what keeps a
  generator from being a build step
- `c:\dev\planbook\tools\verify-shell.mjs` — **two-line bug fix, no new checks** (see below)
- `c:\dev\planbook\TESTING.md` — the WO-1.3 subsection, all lines unticked

Nothing under `plans/` was touched. `CHANGELOG.md` untouched. No roadmap or work-order box ticked.

---

## The two decisions the work order asked me to name

### The banner's return interval: **3 days**

Derived rather than picked. The constraint is that it must be **strictly less than half the ~7-day
eviction window**, so that at least one warning always falls between a dismissal and the earliest
moment data could be erased.

The intuitive number is 7 days, and it is exactly the wrong one: the banner would come back the
week after the grades were already gone. Session-only is the other failure — it returns on every
launch, which is indistinguishable from not being dismissible and trains the eye to skip it by
October. Three days means a teacher who taps *Not now* on Monday sees it again on Thursday, still
inside the window, roughly twice a week rather than every period.

Stored as `planbook_installBannerDismissedAt` (epoch ms, default 0) via `prefs.js`, which refuses
any key not declared in `PREF_DEFAULTS`. It is a fact about this browser's chrome, not about a
student.

### Icons without a build step: **draw the pixels in bare Node**

Three options, and the first two do not survive contact with Safari:

- **SVG only.** iOS will not take an SVG for `apple-touch-icon`; Safari falls back to a screenshot
  of the page, so the home-screen icon becomes a picture of a loading spinner.
- **Data-URI PNGs in the manifest.** Chrome accepts them; Safari's `apple-touch-icon` does not,
  and Safari is the target that matters.
- **Write the PNG bytes.** Node ships `zlib`, a PNG is a header plus one deflated block of scan
  lines, and the mark is four rectangles. `tools/make-icons.mjs` is ~170 lines, imports only
  `node:fs`, `node:path`, `node:zlib`, `node:url`, and draws a notebook — white page, green
  binding, three rule lines — over the header gradient, supersampled 4×4 for antialiasing.

**The PNGs are committed.** Nothing at runtime, at deploy, or at page load runs the script; it is
optional exactly as `tools/README.md` requires, and it exists so the icons are re-derivable source
rather than binaries nobody can account for. I added a sentence to `tools/README.md` making that
the test for any future generator: *a script whose output has to be regenerated to serve the app is
a build step by another name.*

Two device constraints shaped the drawing, both invisible until hardware shows you: it is
**full-bleed with no transparency and no pre-rounded corners** (iOS applies its own rounded mask —
a self-rounded icon gets rounded twice and shows dark wedges), and the mark sits inside the middle
68% of the canvas, against Android's 80% maskable safe zone, which is what lets one file serve
`any maskable` instead of shipping a second padded variant.

---

## The `verify-shell.mjs` edit — please read this one

I changed the verification script, which the brief told me not to grow. **I added no check and no
kind of check; I fixed a latent bug that my own change exposed**, in two places, ~2 lines each.

`Input.dispatchMouseEvent` takes **viewport** coordinates, and `clickSel` read
`getBoundingClientRect()` without scrolling the target in first. The install banner added ~150px
above the component shelf and pushed the second modal opener off an 800×600 headless window, so
the click landed on nothing and the run reported `FAIL | modal opens on click` — an app defect that
was not one, which is precisely the class of thing `tools/README.md` § "Driving a browser over CDP"
exists to record. Both call sites now `scrollIntoView({block:'center'})` before measuring.

The second one has its own tail: fixing the first made Chrome **restore the scroll offset across
`Page.reload`**, which scrolled the header opener off the top and turned the modal touch-target
check into a `SKIP`. I caught that only because I ran the harness at `HEAD` in a throwaway git
worktree and compared: `HEAD` was 28 checks / 27 pass / 1 fail (the expected `viewport-fit` one) /
**0 skips**, and a skip is not a pass. Final state is 28 / 28 / 0 / 0.

If you would rather the script had stayed untouched, the revert is those two `scrollIntoView`
calls, and the cost is one false FAIL and one false SKIP on every future run.

**Proposed follow-up (not done, not in scope):** the script cannot say anything about a service
worker, which is why acceptance lines 2 and 5 have no desk-side evidence. A check that would earn
its keep: register the worker over the tool's existing local server, wait for `activated`, assert
`Cache Storage` holds exactly one cache whose name is `sw.js`'s `CACHE` and that its keys equal
`SHELL`, then use `Network.emulateNetworkConditions` with `offline: true`, reload, and assert the
page still boots. That is a real new capability, not a re-point, and
`plans/verification-tooling.md` says new kinds of check are a conversation rather than a refactor —
so it is a conversation, here, and not a commit.

---

## Decisions the work order did not settle, and which way I went

**`apple-mobile-web-app-status-bar-style: default` → `black-translucent`.** `TESTING.md` says
WO-1.3 owns "both settings," and this is the second. `viewport-fit=cover` alone is not enough on a
standalone iOS launch: with `default`, iOS insets the web view *below* the status bar, so
`env(safe-area-inset-top)` is still 0, the header's `padding-top` is still inert, and there is a
pale strip above a navy header. `black-translucent` runs the web view under the status bar, which
is what the header's existing top padding was written for. **This is the change in this work order
most likely to look wrong on hardware** — if the status-bar text collides with the header or reads
badly over the navy, reverting is one word in `index.html:38`. I flagged it in the `TESTING.md`
line.

**Where the copy lives.** In `index.html`, not in the module. It is the part of this feature a
teacher actually reads, it is longer than any string that belongs in a template literal, and
keeping it in markup means it can be revised without opening a JavaScript file.

**Banner placement: normal flow under the header, not fixed.** A fixed strip would have to fight
the safe-area inset the header already owns, and it would eat vertical space on an iPad in
landscape, which is where that space is scarcest. "Persistent" is satisfied by returning on every
launch, not by refusing to scroll away.

**`skipWaiting()` + `clients.claim()`.** The usual hazard is a running page lazily fetching a v2
module. Every shell module is a **static** import resolved at boot, so no running page fetches a
file later and the two-version mix cannot happen. That is a condition, not a property, and I wrote
the tripwire into `sw.js` above the `fetch` handler: *the first `import()`, lazily-fetched
template, or on-demand stylesheet breaks it — drop `skipWaiting` then and tell the teacher an
update is ready instead.*

**One copy call I want on the record.** The banner says "Everything Planbook keeps — your roster,
your attendance, your grades — is in that storage." **Nothing is stored yet** (WO-1.4 brings the
store), so today that sentence describes the app rather than the device. The alternative was a
temporary "nothing is stored yet" wording that WO-1.4 immediately rewrites, and a warning that
under-sells the risk in the exact week a teacher decides whether to install. I kept the
future-correct wording. The About modal still says plainly that nothing is stored yet.

---

## Temptations declined, and one small edit I did make

- **`beforeinstallprompt` for Chrome.** The work order says "welcome but optional." Declined —
  the banner's desktop line already points at the browser's own install control, and a second
  install surface is a second thing to verify for a target that does not decide go-live.
- **A "How to install" modal** behind a button on the banner. Declined: it puts the steps one tap
  away, and the acceptance line says the warning *gives* the steps.
- **Platform sniffing** to show only the iPad half of the instructions on an iPad. Declined —
  fragile, and two labelled lines cost less than one wrong guess.
- **A `mobile-web-app-capable` meta** alongside the `apple-` one to quiet Chrome's deprecation
  warning. Declined as noise; Chrome installs from the manifest.
- **One edit I did make that is arguably maintenance:** the trailing marker in `TESTING.md`'s
  Phase 1 section said "WO-1.3 through WO-1.10 append their own subsections here." I inserted my
  subsection above it and changed the marker to "WO-1.4 through WO-1.10" so it still names the
  right next author. No box ticked, nothing else in that file altered.

## Two stale sentences I deliberately left for the teacher

Both say a check fails on purpose until WO-1.3 lands, and both are now false:

- `TESTING.md` line ~50 — "**One check fails on purpose** until WO-1.3 lands — the
  `viewport-fit=cover` precondition…"
- `tools/README.md` § `verify-shell.mjs` — "**One check is expected to fail until WO-1.3 lands.**"

A third lives in `plans/verification-tooling.md`, which I am not allowed to touch at all. I left
all three rather than half-fix a claim across files I have uneven permission over; they are
maintenance, and maintenance follows verification.

## Commands run

```
node tools/make-icons.mjs                 # wrote 5 PNGs into icons/
node tools/verify-shell.mjs               # 28 checks · 28 passed · 0 failed · 0 skipped
node --check sw.js                        # parses
node -e "…"                               # manifest parses; every SHELL path, src module and icon accounted for
git worktree add …/base HEAD              # baseline comparison, removed afterwards
```
