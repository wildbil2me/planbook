# `tools/` — scripts, run by hand

| Script | What it does |
|---|---|
| `verify-shell.mjs` | Drives the real app in headless Edge/Chrome and **measures** what a stylesheet review can only assert. `node tools/verify-shell.mjs` |
| `verify-deploy.mjs` | Reads the **deployed** origin off the wire — status, `Cache-Control`, redirects, and the precache list as the deployment declares it. Run by hand after a deploy. `node tools/verify-deploy.mjs` |
| `make-icons.mjs` | Draws the home-screen icons and writes them as PNGs into `icons/`, using `node:zlib` and nothing else. `node tools/make-icons.mjs` |
| `make-cert.mjs` | Mints a local CA and a server certificate into `certs/`, so the LAN address is a secure context. `node tools/make-cert.mjs` |
| `serve-https.mjs` | Serves the repo over HTTPS for a device sitting, plus a plain-HTTP page that hands the iPad the CA. `node tools/serve-https.mjs` |
| `wo-sweep.mjs` | The verifier's standing sweep as greps — the checks a `grep` settles correctly, with their allowlists written down. `node tools/wo-sweep.mjs` |
| `wo-gate.mjs` | Work order gates, "what's next", claiming a work order for a dispatch, the maintenance ticks with a recomputed dashboard, and — since WO-2.15 — a read-only `--audit` of both trackers and a `--self-check` that plants its own violations. `node tools/wo-gate.mjs next` |
| `wo-brief.mjs` | Assembles the verbatim parts of a dispatch brief. `node tools/wo-brief.mjs WO-1.7 > .claude/dispatch/WO-1.7-brief.md` |
| `wo-cost.mjs` | What each dispatch cost, from the session transcripts. `node tools/wo-cost.mjs` |
| `codex-invoke.mjs` | The Codex exec-time probe and the real dispatch, one file so the `codex-resources\` `PATH` fix can't drift between copies. `node tools/codex-invoke.mjs --probe` / `--brief <path> --out <path>` |
| `audio-probe.html` | **Not a script** — a page, opened on the device. Tells iOS Silent Mode apart from an AudioContext that will not start outside a gesture, which are the same silence otherwise. See below; it has a way to be served wrong that looks like nothing being wrong. |

The four `wo-*.mjs` scripts and `codex-invoke.mjs` are **dispatch plumbing**, not app tooling — they
read `plans/` and the agent transcripts, and none of them touches `src/`. They exist because the
pipeline was re-deriving the same work every run: gate parsing, brief assembly, sweep allowlists, and
a cost analysis that was rebuilt from scratch four times in one afternoon and thrown away each time.
Same failure mode as the two throwaway browser harnesses that became `verify-shell.mjs`.
`wo-gate.mjs` is the only one that writes to the repo, and only ever to `plans/`: `--start` and
`--release` write one status line, `--tick` writes the status, the roadmap boxes and the dashboard —
and all three refuse to touch a 👤 line or `CHANGELOG.md`. Since WO-2.14 `--tick` reads the work
order's own Acceptance list first and writes `🔨 IN PROGRESS` rather than `✅ DONE` when a line is
still open, because the one script that edits the tracker is the one nothing else checks.

**Since WO-3.11 the statuses it writes are three different facts rather than two.** `--start` writes
`🤖 CLAIMED — <dispatch>` (the date, unless `--dispatch <label>` says otherwise) and `--release` is the
way back out of it — and out of nothing else, so a caller who is wrong gets a refusal instead of a
finished work order set back to `⬜ NOT STARTED`. `🔨 IN PROGRESS` now means only what `--tick` writes:
part-built, nobody in flight. A work order that **landed** carrying Acceptance lines another work order
will close is `✅ DONE` with a `**Owes**` field, and those lines stay `- [ ]` with a `→ WO-x.y` marker.
`--tick` honours a marker **only while it can find the matching open box under the named target** —
resolve or hold, because a marker taken on trust is a `- [x]` spelled with an arrow, and the hand-ticked
version with a paragraph under it explaining that ☑ did not mean "verified" is what WO-3.11 replaced.

**Since WO-2.15 it also refuses, writing nothing at all, when the trackers are wrong about
themselves** — a `**Closes roadmap**` fragment that closes no box, or a `ROADMAP.md` dashboard row
that disagrees with the boxes under its own heading. An open Acceptance line means the *work* is
unfinished and `🔨 IN PROGRESS` is the true thing to write; these two mean the *tracker* is wrong,
and there is no status that makes that true. **`--tick` still never writes `ROADMAP.md`'s progress
dashboard** — that is the roadmap's own maintenance step 3 and stays a hand edit; the run prints the
row it just made stale so the edit is a copy out of the output.

Two flags that write nothing anywhere:

```
node tools/wo-gate.mjs --audit         every **Closes roadmap** fragment against ROADMAP.md's boxes,
                                       every **Owes** pointer against the box it names, and
                                       ROADMAP.md's dashboard against its own box counts
node tools/wo-gate.mjs --self-check    plant every violation this script is supposed to catch, in a
                                       temp copy of plans/, and fail if one stops being caught
```

`--self-check` copies `plans/` to a temp directory, writes two **synthetic** work orders into the copy,
plants thirteen violations against them, runs the script over the copy, and deletes the directory on
both exit paths. Two things about it are load-bearing. **Every plant path goes through a guard that
refuses anything inside the repository** — WO-2.15 was itself `🔨 IN PROGRESS` while it was being
written, so a plant that escaped would have corrupted a live work order and looked hand-written
afterwards. And **the fixture is synthetic on purpose**: WO-2.15's own acceptance list had to be
re-cut twice because it named real work orders as fixtures and both were spent within the week.
`--against <path>` runs the plants over a *different* copy of the script, which is how each plant is
proved able to fail — `git show 7973a42:tools/wo-gate.mjs` into a temp file and seven of the nine go
red. **A green run is not coverage**, and the run says so in its own output.

**WO-3.11's four plants were proved the same way and then again more narrowly**, because the broad
run proves less than it looks like it does: against `git show 128d6f4:tools/wo-gate.mjs`, eleven of the
thirteen go red — but most of them go red because that script has never heard of `🤖 CLAIMED` and
refuses the tick, which says nothing about whether a pointer plant can see a pointer defect. So each
was also run against a copy of the *current* script with one behaviour mutated, and the interesting
part is what did **not** go red beside it:

| Mutation | Result |
|---|---|
| `resolveRehome()` returns `null` always — the marker is taken on trust | **2 red**: the deleted/reworded plant and the unresolvable-`**Owes**` plant. The resolving plant stays green, which is the point — a resolver that says yes to everything passes it |
| a re-homed line still counts as holding the work order open | **2 red**: the resolving plant, and `next` still hiding the dependent |
| `--release` refuses only `⬜ NOT STARTED` | **1 red**: the release plant, on `✅ DONE` and `🔨 IN PROGRESS` |
| a target box that is already `[x]` resolves anyway | **1 red**: the unresolvable-`**Owes**` plant, on that case alone |
| `**Owes**` and the `→` markers need not agree | **1 red**: same plant, on the orphaned-field case |

Five mutations, all reverted, none of them touching a plant it was not aimed at.

**It has a precondition, and since WO-2.16 it states it and checks it first: the trackers must already
be clean.** The copy inherits whatever drift `plans/` is carrying, drift is what `--tick` refuses over,
and a refusal is indistinguishable from a plant that broke — so a dirty tree used to be announced as
two unrelated plants going red, neither of which had done anything wrong. `--audit`'s own two readers
now run over the copy before anything is planted, and a dirty copy stops the run with the drift named
and `0 plants made`. Only what can earn a `HELD` counts: `ROADMAP.md` dashboard drift, and a
`**Closes roadmap**` fragment matching no box. Drift in *this* directory's dashboard does not, because
`--tick` recomputes that table itself. **A plant failure means a plant failed**, and when one does the
subject's own `HELD` and its reason are printed under it rather than clipped off at 160 characters,
which is how the same morning was spent twice.

`codex-invoke.mjs` writes outside the repo (a temp dir for
`--probe`, the dispatch result file for `--brief`/`--out`) and exists because the `codex-resources\`
`PATH` fix was re-derived and re-typed at two call sites inside `work-order-orchestrator.md` — one
file means the fix can only be right or wrong in one place. Full saga in
[`../plans/dispatch-retro.md`](../plans/dispatch-retro.md) § Codex.

The demo build lands in Phase 8 (WO-8.2), modelled on Roll Call!'s `tools/build-demo.mjs`.

## The rule

**Anything scripted is a `.mjs` file here, run under bare Node, with zero dependencies.**

```
node tools/build-demo.mjs
```

That is the whole invocation. There is no `npm run`, because there is no `package.json` — and
there is not going to be one, not even "just for scripts." A `package.json` is how a bundler
arrives six weeks later; it has been proposed and rejected before (see `CLAUDE.md`, and
`plans/b-hygiene.md` in Roll Call!).

- **`.mjs`, not `.js`.** Without a `package.json` declaring `"type": "module"`, Node reads `.js`
  as CommonJS. The extension is what makes `import` work here — it isn't a style preference.
- **Node's standard library only.** `node:fs`, `node:path`, `node:url`. If a script needs a
  dependency, the script is doing too much.
- **No script may be required to run the app.** Everything in `tools/` builds something
  optional — a demo, a report, a fixture. `index.html` and `src/` are served as they sit on
  disk, and a teacher's laptop never runs Node. `make-icons.mjs` is the shape to copy if a
  future asset needs generating: its **output is committed**, it is run by hand when the
  drawing changes, and no deploy, server, or page load ever invokes it. A script whose output
  has to be regenerated to serve the app is a build step by another name.
- **Exit non-zero on failure and say what failed.** These get run once every few months by
  someone who has forgotten how they work.

## `audio-probe.html` — the one thing here that is not a `.mjs`

It is a page rather than a script because the question it asks can only be asked from inside a
tap on the device itself, and Node cannot make a sound. The rule above is about how scripts get
**run** — no `npm run`, no bash, no `package.json` — and a hand-opened diagnostic page does not
put a crack in it. It still meets every other line: optional, run by a human, gates nothing, and
no deploy, server or page load ever reaches it.

**What it is for.** The overdue-pass alert (WO-2.29) is silent on the teaching iPad, and silence
has two causes a log cannot tell apart — Silent Mode, and an AudioContext that reports `running`
and produces nothing because it was not born in a gesture. The page runs
`playToneSequence()`'s exact note pattern from `src/alert-sound.js` four ways; probe 1 against
probe 2 is the discrimination, and probe 4 (`<audio>` element) separates the audio-session
category from Web Audio proper.

**It has to be served from an origin the service worker does not control.** `sw.js` answers
*every* navigation with the cached shell, whatever path was asked for — the offline clause, and
correct — so both the deployed origin and `serve-https.mjs`'s 8443 hand back the Planbook app
instead of this page on any device that has installed the worker. The 2026-08-14 sitting reached
it on a second port for that reason. **The symptom of getting this wrong is the app opening and
looking fine**, which is why it is written here and in the file's own header rather than left to
be rediscovered: nothing errors, and the tool you came for is simply not the thing on screen.

**It is kept on a condition.** Its first header said "delete when done" and it is still here
because WO-2.29's acceptance line 6 is still 👤 and still failing; `TESTING.md` names probe 1 as
the one-tap answer for the next run. When that line closes, this goes with it — the row above,
this section, and the two references in `TESTING.md`.

## Testing on the iPad — `make-cert.mjs` and `serve-https.mjs`

```
node tools/make-cert.mjs      # once per machine, and again if the LAN address changes
node tools/serve-https.mjs    # every sitting
```

Then open **`http://<address>:8080/`** on the iPad — the setup page — and work down it. The app
itself is on **8443, over HTTPS**.

**Why not the static server `TESTING.md` used for WO-1.2.** A service worker requires a secure
context. `localhost` is specially exempted from that rule; a LAN address is not. So
`http://192.168.50.142:8000` cannot register `sw.js` at all — and the failure does not look like
one, because **Safari's own HTTP cache will re-serve the pages after the Wi-Fi goes off**. The
offline walk passes, the tick goes in, and what was actually proven is that Safari has a cache.
This is the WO-1.2 safe-area miss in a new place: a check that reports green while measuring
nothing. `serve-https.mjs` sends `no-store` on everything for exactly that reason, leaving only
the service worker able to answer. (`no-store` does not affect the precache — Cache Storage is
explicit and ignores `Cache-Control`.)

These do not break the no-script-required rule above. A teacher's tablet loads the deployed site
over ordinary HTTPS; this is scaffolding for testing that on hardware before there is a deploy.

**`certs/` is gitignored, and is the one thing `tools/` writes that is not committed.** It holds
two private keys, one of them a CA root that a machine has been told to trust. Regenerating costs
one command.

### Four things that fail closed and say nothing useful

1. **Installing the root is not trusting it.** iOS puts a newly installed root in a disabled
   state. Settings → General → About → **Certificate Trust Settings**, switch it on. Until that
   toggle is flipped nothing changes, and the symptom is a generic certificate warning that
   looks like the certificate is wrong rather than untrusted.
2. **There is no click-through for a service worker.** Safari will let you past the interstitial
   to *read* a page over an untrusted certificate, and still silently refuse to register a
   worker behind it. The app looks broken, or worse, looks fine until the network goes off.
3. **iOS ignores Common Name entirely**, and needs `IP:` in `subjectAltName` for an
   address-based URL, plus ≤398 days, `serverAuth`, and EC P-256 / RSA-2048 upward.
   `make-cert.mjs` sets all of it; the list is in its header because a hand-rolled replacement
   will get one of them wrong.
4. **A DHCP lease that moved leaves a valid certificate for the wrong host.** Signed, unexpired,
   and refused — reported identically to every other certificate problem. `serve-https.mjs`
   compares the certificate's addresses against the machine's on startup and says so.

And one that is not a certificate problem at all: **Windows Defender prompts on first bind**, and
a dismissed prompt — or a network typed Public — leaves the port open here and invisible from the
tablet. Symptom is "Safari cannot open the page", same as a wrong address. Load the HTTPS URL in
this laptop's browser first; if it works here and not there, it is the firewall.

## `verify-deploy.mjs` — the only check here that reads the deployment

```
node tools/verify-deploy.mjs                          the production origin
node tools/verify-deploy.mjs https://foo.pages.dev     any other one
```

**When to run it: by hand, straight after a deploy** — and again after any change to `_headers`, to
`sw.js`'s `SHELL` list, or to the Cloudflare zone's caching settings, because those are the three
inputs whose effect exists only at the origin. It is the mirror image of `verify-shell.mjs`, which is
run *before* a deploy: that one drives the app on `localhost`, this one reads what the host actually
served and asserts nothing about behaviour at all.

**It exists because WO-8.7's first deploy shipped two faults and every check in this repository was
green through both** — 628 of 628 before and 628 of 628 after the fix, the same number, because
neither fault is in the repository. `sw.js` precached `./index.html`, Cloudflare Pages answers that
path with a 308, `cache.addAll` followed it, and Safari then refused to serve the stored response to
a navigation: a white screen on the home-screen icon (WO-1.14). And `_headers` pinned
`Cache-Control: no-cache` on `/sw.js`, spelled correctly, and did not bind — the zone's own
four-hour Browser Cache TTL rewrote it to `max-age=14400`. One is the host's routing and one is a
setting in a dashboard. **What found both was a single HTTP request against the live origin.**

Twelve checks, in five blocks: the shell document (200, HTML, `no-cache`), `/sw.js` (200,
JavaScript, `no-cache`), the precache list read **out of the deployed worker** and walked entry by
entry, the deployed `CACHE` string against the working tree's, and the four paths that would carry
server-side code. Every request is printed with its status, content type, `Cache-Control` and byte
count, so a run is evidence a human can read rather than a row of ticks.

**Three things in it look like oversights and are the work order.** The `SHELL` list is read out of
the **deployed** `sw.js` and never the local one — sourcing both sides from the working tree
compares a file with itself and passes forever, including against a deploy that never landed. Every
request is `redirect: 'manual'`, because `fetch` follows redirects by default and a followed 308 is
indistinguishable from a 200: measured on the live origin, `/index.html` reads `308 → /` with the
flag and `200` without it, which is exactly how the defect stayed invisible. And **there is no
retry**: a flaky answer is information, and a loop that hides one turns this into the confident pass
over nothing that `plans/dispatch-retro.md` keeps naming as worse than no check at all.

**An unreachable origin is not a red check.** This is the first thing in `tools/` that needs a
network, so a transport failure at any point — DNS, TLS, refused, timed out, or a socket dropped
half way through the walk — stops the run under a `COULD NOT REACH THE ORIGIN` banner, adds no
check, prints no summary, and exits **2** rather than 1. A network error reported as a failed
assertion says the deployment is broken when what is broken is the hotel wifi, and it spends the
credibility of the next red run. Exit codes: **0** all green, **1** a check failed, **2** could not
reach.

**Two things the host does that the checks are shaped around, both measured 2026-08-12.** This
deployment answers *any* unknown path with the shell document at **200 `text/html`** —
`/nope-does-not-exist` comes back byte-identical to `/` — so a status alone cannot see a file that
was never deployed, and the walk asserts that each entry's content type matches what its name
implies. That is also why the `_worker.js` / `_routes.json` / `/functions/` block asks whether those
paths answer **as a script** rather than whether they answer at all. What that block cannot do is
prove no worker is running: a live `_worker.js` intercepts every path including its own. The
repository half of that claim is WO-8.7's, checked in the tree and in the dashboard.

**Every one of the twelve was watched failing against the defect it is named for**, on a throwaway
fixture origin, before this section was written: `/sw.js` answering `max-age=14400` (the zone fault,
1 red), a `SHELL` carrying `./index.html` against a host that 308s it (the WO-1.14 fault, 2 red), a
deployed `CACHE` of `v45` against a working tree at `v46` (1 red), a precached stylesheet answering
the shell document at 200 (1 red), `/_worker.js` answering `application/javascript` (1 red), an
apostrophe inside the deployed `SHELL` array (4 red — the parse floor, and the three walk checks
reported *"not run"* rather than green over an empty list), a `SHELL` entry that exists only in the
deployment and 404s (1 red, which is the proof the list is read off the wire), `/sw.js` served as
HTML (6 red), `/` redirecting (4 red), `/` served as JSON (2 red), and the control fixture green at
12 of 12. Plus the three unreachable shapes — refused, `ENOTFOUND`, and the fixture killed mid-walk,
which stopped at *"nothing was asserted after 7 check(s)"* with **no** red check and exit 2.

**And one finding that is not about the deployment at all: `process.exit()` after a `fetch` aborts
the process on Windows.** Two of five runs on Node v24.16.0 exited `0xC0000409` — bash reports 127 —
with the full, correct output already on the terminal. A tool whose entire product is an exit status
handing back a random one is the worst defect available to it, so the exit code is **set**
(`process.exitCode`) and the process ends naturally; that measured 3 of 3 correct and costs nothing,
since the sockets are unref'd and the run still ends in about half a second. Worth knowing before
anyone "tidies" it back.

**The other scripts here were then looked at rather than left to a someday.** Only two of them can
hold a socket at exit: this one, and `verify-shell.mjs`, whose CDP connection is a global
`WebSocket` — which is undici, the same library. The rest (`wo-sweep.mjs`, `wo-gate.mjs`,
`wo-brief.mjs`, `wo-cost.mjs`) read files and cannot be exposed, so they were left alone rather than
converted on suspicion. `verify-shell.mjs` was converted to `process.exitCode` and measured three
runs before and four after: **exit 0 every time, ~200s each, no abort and no hang.** The
before-runs matter as much as the after-runs — they are why the conversion is not credited with
fixing anything observable, and why it is the *hang* that was being watched for. The hang is the risk
— that file kills a browser, closes a server and removes a profile directory before it ends, and if
any of those ever stops releasing its handle the run will sit there forever instead of exiting. That
would be a teardown bug, not an exit-code bug, and the comment at the bottom of the file says so.
No abort was ever *observed* in `verify-shell.mjs`; the change was made because the exposure is the
same and the cost is nothing, which is a different and weaker claim than the one above it.

**It gates nothing**, like everything else in this directory: no hook, no CI, no schedule, no other
script calls it, and the app ships whether or not it has ever been run. It closes no 👤 line either
— it reads headers, and whether the app *works* on a teacher's iPad is `TESTING.md`'s question.

## `verify-shell.mjs` — and why it is not a test framework

It is one `.mjs` under `tools/`, zero dependencies, run by hand. `CLAUDE.md` and Roll Call!'s
`plans/b-hygiene.md` rule out linters and test frameworks; Roll Call!'s
`design/execution-guide.md` §7 already says to verify by driving the built demo in headless
Edge over CDP. This is that, written down. **`TESTING.md` is still the gate** — nothing here
closes a 👤 item, because no emulator has a thumb or a safe-area inset.

It exists because WO-1.2 shipped `.search-box { min-height: 44px }` around a **19px input**.
The wrapper measured 44px, the input did not, and tapping above the text did nothing. A
stylesheet review calls that line compliant. Measuring it does not.

**It went green at WO-1.3**, 28 of 28. The one check that used to fail by design — the
`viewport-fit=cover` precondition, without which iOS resolves every `env(safe-area-inset-*)` to
`0` and the padding is inert — passes now that WO-1.3 set the meta value. That the run is green
still closes no 👤 item: it drives a page, not an installed app, and it has never seen a service
worker.

**It grows with each work order: 28 at WO-1.3, 54 at WO-1.4, 82 at WO-1.5, 130 at WO-1.6, 162 at
WO-1.7, 164 once the line cap was retired and its two replacement measurements went in, 184 at
WO-1.8, 201 at WO-1.9, 222 at WO-1.11, 224 once WO-1.11's correction round added the fixture that
would have caught its one defect — fifteen of those last are WO-1.11's own, and the rest came
with WO-1.10, whose own figure was never written down here. Still 224 after WO-1.11's *second*
correction round on 2026-08-05, and that flat number is the interesting part: the iPad rejected
one-download-per-year outright, so "Back up all N years" was rebuilt on a hand-written zip
(`src/zip.js`) and six of those fifteen checks were rewritten around the new mechanism —
same claims, same count, different evidence, including a minimal ZIP reader in this harness
because Node has none and this repo will not take a dependency to get one. 231 at WO-1.12, and
those seven are one check repeated after seven class mutations: the home screen's cards are the
tab bar's second view and only the bar redraws itself, so until this work order, dropping one of
`src/shell.js`'s eleven `afterClassChange()` call sites left six of the eight drivable branches
green — three sites were already caught by existing checks, and the eighth (delete, offered only
on archived classes already off the grid) cannot be driven red at all. 260 at WO-2.1, measured on
the shipped tree — twenty-six of those twenty-nine are the attendance section, and the other
three are in the touch block: a home card that stopped being one button and became a container
with two, the marking screen's own coarse-pointer sweep, and the row that must not spill sideways
at 44px a mark. Three of the attendance checks assert an ABSENCE — no `P` anywhere in the
document, no control that commits anything, and focus that must not end up on the body — so each
was proved non-vacuous by mutation before the count went in here: storing `P` instead of deleting
it turns five checks red, repainting the dropped state in the untaken palette turns the
three-state comparison red, and handing the modal the detached opener sends focus to `<body>`.
274 at WO-2.1's rebuild, and the fourteen is a net figure rather than a count of additions: that
work order replaced the one-day marking screen with a six-day registry, so the attendance section
was rewritten rather than extended and three of its old checks had nothing left to ask. Two of the
new ones are worth knowing about. The column window is compared against a list this harness derives
from the CALENDAR in Node — the same "two runtimes, one clock, one answer" posture the local-date
check already used — because a window built from the records that exist would pass any check that
asked the app which dates it had picked, and omitting a forgotten day is the one failure that
screen exists to prevent. And the future-date refusal is the only place in this file that WRITES
through the `window.planbook` seam: there is no control to click, by construction, which is the
claim. Four mutations, all reverted: storing `P` turns seven red, painting an untaken cell in the
taken palette turns the three-state comparison red, dropping the `<= today` clause turns two red,
and dropping the past-column unlock takes tappable-cells-per-row from one to five. 280 at WO-1.13,
and six is a small number for a work order that moved a whole screen because ten checks were
RE-POINTED rather than added: the registry became a view in `<main>`, so everything that used to
open `attendanceModal` now drives `#classView` through a card, a header tab, or one of the two "All
classes" doors. Seven were added and one retired, which is where the net six comes from. The seven:
a card tap swapping what is in `<main>` with "no dialog opened" as its own clause, the way back
through the panel's door, the way back through the header's, a reload coming back to the class
rather than to the grid, the view carrying no dialog semantics at all, the registry carrying no
support data in either presentation mode, and the three states told apart ON A CARD rather than only
in a column head — that last one revived `window.__look`, which had been dead since WO-2.1 and was
still naming a hook that no longer exists. The one retired is the focus-return check: it asserted
that closing the dialog handed focus back to the card that opened it, and there is no dialog and no
close to hand it back from. The two "way back" checks are what stand in its place. Three mutations, all reverted: dropping
`showView` from `selectClass()` turns six red, leaving `role="dialog"` on the view turns one red, and
booting to the grid instead of the saved view turns one red. 282 at WO-1.13's correction, and the two
are the acceptance line that work order failed the first time: the class tab strip is no longer drawn
on the home view at all, so the added pair counts the controls a teacher could tap RIGHT NOW in each
view — visible ones, by `offsetParent`, because both sets live in the DOM at all times and a count of
the markup would report the same number from either screen. Nothing was deleted for it: five checks
in the classes section now take their reading of the strip from the class view, arriving through a
card the way a teacher does, and the year-switch check moved one clause onto the cards while keeping
the term nav as its proof that `refreshClassBar()` ran. Two mutations, both reverted: drawing the
tabs on the home view again turns two red, and blanking the caption that replaced them turns one
red. 299 at WO-2.10, and seventeen is a net figure over a section that was mostly RE-POINTED: a cell
became an object and a tap on a `?` came to mean "present", so nearly every existing attendance
check was reading a shape or a sequence that no longer exists. The reader changed with them —
glyphs come off `.attendance-cell` rather than off the `<td>`, because a `<td>` can now hold the
time caption too and `"T8:14a"` breaks every comparison against a string of letters. Three of the
new ones are worth knowing about: "one tap changes no other cell" reads all twenty-six cells before
and after, because the build this work order replaces would have passed a check that read the tapped
one; "every cell is an object" is asked of the whole document with the object count printed beside
the zero, since an empty document answers it just as happily; and the pre-WO-2.10 restore goes in
through `restoreFromText()` and the real confirm, because that path is the only thing standing
between a teacher and the backup already on her disk. Four mutations, all reverted and tabulated in
`TESTING.md` § WO-2.10. 330 at WO-2.8, and sixteen of those are hall passes — the reload check
among them reads the open pass straight out of IndexedDB rather than asking the app, because that
is the only question a desk can answer about "survives a force-quit". 344 at WO-2.11, and the
fourteen are the pass banner and cancel. Four of them are worth knowing about: the byte-identical
claim is asserted against `JSON.stringify` of the whole log rather than against a count, because
cancel-as-a-zero-minute-return keeps a count honest and is exactly the defect; the cancelled note is
searched for across the **whole serialised document** rather than in the two arrays a check might
think to look in; and the gate — cancelPass() refusing a pass that has already been returned — is
the one thing in this section driven through the seam rather than through a control, because a
finished pass has no card and therefore no button. And the fourth is the desk half of a 👤 line
rather than the line itself: Return and Cancel are measured as different SHAPES (filled against
outline) because "they cannot be confused at speed" is the owner's call, but "they are drawn
identically" is a thing a refactor can do by accident and a computed style can catch. Seven
mutations, all reverted and tabulated in `TESTING.md` § WO-2.11. 359 at WO-2.12, and **ten** of
those are portrait showing today — but the tree WO-2.12 arrived on measures **349**, not the 344
this line recorded at WO-2.11. That figure was five short of what shipped, and the correction is
arithmetic rather than a re-run: `git diff` against the WO-2.11 commit adds exactly ten `check()`
calls and re-points one, so 359 − 10 = 349 is the number the previous tree really had. The footnote
below already describes this happening once; it has now happened twice, both times the same way —
checks added after the count was written down. Three of the ten are worth knowing about. **The
rotation is not simulated**: nothing between the two orientations calls `renderAttendance()`, because
"landscape still draws six, with no reload" is a claim about a media-query listener and a harness
that repainted the screen by hand would go green against a build with no listener in it — which is
precisely what every other section of this file does, and why the defect could exist unnoticed. And
the long-name check in the WO-2.10 note-panel block **changed sides** rather than being deleted: it
used to assert that a long name in portrait wants MORE than the other columns leave (the cap being
load-bearing was the precondition that made the note-panel measurement non-vacuous), and one day
column reverses that arithmetic, so it now asserts the thing WO-2.12 promised in its place — the
name is drawn in full and the ellipsis never engages. The third is the only check in that section
that is nobody's acceptance line: an unlocked past column is module state, a rotation walks straight
past it, and turning the iPad upright with Tuesday unlocked left today's cells read-only under a
banner naming a day that was no longer drawn — so the check drives the ✏ in landscape and reads the
screen after the turn. Five mutations, all reverted and tabulated in `TESTING.md` § WO-2.12.
**361 after the rotation trigger was re-cut the same day**, and the two added checks are the ones the
shipped build would have failed: the owner's iPad turned once, worked, and then stopped answering, so
the section now turns the device **four more times** and asserts a count on each. The other change is
a subtraction — the narrow-laptop-window checks no longer call `renderAttendance()` by hand, because
the repaint hangs off `resize` now as well and a hand render would hide the loss of it a second time.
Everything above about the rotation not being simulated still holds and now covers three signals
rather than one. **366 after the paging anchor**, five checks later the same day: the owner paged back
three windows, turned to portrait and landed on the 4th rather than on today. Four of the five turn
the device; the fifth deliberately does not — a laptop window dragged from six columns to five is the
same defect with the rotation taken out, and it is the only one of the five that catches the window
arithmetic on its own once portrait is pinned to today.** **379 at WO-2.3**, and the thirteen are
days off and pre-drops: twelve at the end of the attendance section, one in the coarse sweep. Four
are worth knowing about. **Every one of the twelve carries `doc.attendance` serialised byte for
byte**, beside whatever else it is asserting — that work order's Traps line is a copy appearing in
that array, and a build that made the copy would pass every *visible* claim in the section: the
columns go grey, the cards say "No school", and the only thing that gives it away is the array being
compared to itself. Proved by mutation, and it is the largest single mutation result in this file so
far — copying the event onto records turns **ten** of the twelve red. **The range is five weekdays of
a six-weekday window and the sixth is dropped by hand first**, which is two precautions in one
fixture: the day outside the range is what stops a covering test that ignored its dates from passing
(mutating `coversDate()` to `return true` turns one red), and it puts a covered column and a dropped
column side by side on one screen, because those are the two quiet greys in this palette and "they
are still two colours" is a claim a refactor breaks by accident (painting covered in the dropped
palette turns one red). **The future pre-drop is asked of the predicate rather than of the screen**,
and that is not a shortcut: the honest question about "a *future* dropped event naming two classes"
is what `stateOf()` answers on that date for all six classes. *(When this was written the registry
also had no column after today, so there was no rendering to read either. Since 2026-08-08 there is —
the punch-list block below reads it.)* And **the snow-day check is arithmetic over
three groups, not two** — taught, dropped-from-its-own-record, and nothing recorded — which is the
precedence rule in full; it was written over two groups first and went red against a correct build,
because a class that dropped today from its own ledger stays `dropped` and does not become
`covered`. Six mutations, all reverted and tabulated in `TESTING.md` § WO-2.3. **One trap re-paid on
the way**: the coarse-sweep check navigates to the home view to reach the days-off door, and the
class tab strip is drawn on the class view only — so leaving the run there made the roster block
below read an empty tab list and fail four checks about panels it never opened. It goes back into a
class through a card before it hands on.

**The punch-list block at the end of that section (2026-08-08) is a different kind of thing, and
worth naming as such: it is what the first iPad sitting sent back after every acceptance line above
had already passed.** Nine checks, plus one in the coarse sweep. Six of them are about the
registry paging FORWARD, which is the hole the sitting found — a day off could be set ahead and not
looked at ahead. The one to keep is *"reading a week that has not happened yet wrote nothing"*: the
change that opened those columns is a rendering change, and the only reason it was safe is that the
refusal to write tomorrow lives in the writer, so the check asserts `doc.attendance` byte-identical
across the whole forward walk exactly as the block above it does. The coarse-sweep one is the other
lesson: **"Days off" spilled through its own border on the iPad with every 44px check green**, because
a `nowrap` button can clear 44px in both directions and still be narrower than its own label — so
that check measures `scrollWidth` against `clientWidth`, which is the defect itself rather than a
proxy for it, and asks it of every button in that header row.

**405 on the tree WO-2.5 arrived on, and 428 when it left** — and the first of those two numbers is
measured rather than carried forward, because the line above stops at 379 + the ten-check punch-list
block and the tree really had 405. That is the footnote below happening a third time; the run was
made before a line of this work order was written, so the twenty-three are a count of additions and
not an arithmetic difference. Twenty-two of them are the keyboard section, which runs on a FINE
pointer and before the coarse sweep on purpose — the keyboard path is the laptop's, and since
2026-08-08 the laptop is the device of record. The twenty-third is in the coarse sweep: the new ⌨
door measured for `scrollWidth` against `clientWidth`, which is the "Days off" spill from the first
iPad sitting asked of the next button of the same shape rather than left to be rediscovered.

Five of the twenty-two are worth knowing about. **The walk dispatches exactly one ArrowDown and
then one letter per student and nothing else** — no arrow between the letters — because a check that
pressed ↓ to move on would go green against a build where a letter marked but did not advance, and
that build passes the acceptance line and still fails the term. **Two of the three "this keystroke
writes nothing" checks were VACUOUS when first written**, and were caught by the mutation runs
rather than by review: setMark() refuses a no-op, so a letter that happens to match the mark already
on the cell leaves `doc.attendance` byte-identical whether the guard is there or not — they now read
the cell first and press a letter that would change it. **The focus check asks the element
`:focus-visible` rather than reading the rule off the stylesheet**, because the global rule being
present and the ring being drawn are two different facts and it is the second one acceptance line 3
is about. And **Enter-on-a-cell is a check of its own**, because the keyboard walk re-focuses through
selectStudent() and would paper over the loss: removing paintColumn()'s hand-off to the replacement
cell leaves every other check green and only that one red. And the fifth is the only one in the
section that is not about the keyboard at all: **the screen-reader deliverable was already met by
WO-2.1 and had nothing watching it**, so the check asks the whole class view what that deliverable
asks — every button has an accessible name, and every button whose visible text is one glyph carries
both an `aria-label` and a `title`. 150 buttons, 55 of them one glyph. Eight mutations, all reverted
and tabulated in `TESTING.md` § WO-2.5.

**449 at WO-3.1**, and twenty-one of the twenty-two is a new section; the twenty-second is a
RE-POINT rather than an addition, which is why the arithmetic reads 428 + 21. The re-pointed one had
asserted that a new class arrives with `categories` EMPTY — true, deliberate, and documented in
`src/classes.js` in a comment naming WO-3.1 as the condition it was waiting for — and now asserts
the starter set and that its weights total 100. Three of the twenty-one are worth knowing about.
**The float-tolerance check was vacuous when first written and was caught by its own mutation
run**: it used 12.5 + 87.5, which sums to exactly 100 in binary, so it went green against a build
where `isBalanced()` compared with `===`; the set it uses now (40.1 + 34.7 + 25.2 = 100.00000000000001)
was found by search, and it is the only check in the section that can tell the tolerance from a
strict equality. **The total is asserted as a SUBSTRING of the sentence a teacher reads** — "95%" —
rather than as a boolean about the banner being amber, because "these weights are invalid" satisfies
every other clause in that check and is precisely what the work order forbids; mutating the copy to
say exactly that turns three red. And **every claim about the total is made twice, once on the
banner in the editor and once on the badge on the class-manager row behind it**, because those are
two renderings of one number drawn by two modules — dropping the repaint chain in `src/shell.js`
leaves the banner right and the row a keystroke behind, which is a defect only a check that reads
both can see. Five mutations, all reverted and tabulated in `TESTING.md` § WO-3.1.

**473 at WO-3.2**, and twenty-four is a count of additions: twenty-two in a new letter-grades section
and two in the coarse sweep. Three of them are worth knowing about. **The mapping is read through the
seam and driven through the fields**, because nothing in this app displays a grade — no engine, no
grid — and that work order forbids building a preview over student data to demonstrate one; so a
boundary is typed into the real `<input>` and `letterFor()` is then asked what it makes of a
percentage, which is the only way to tell a build whose ranges come out of the exported mapping from
one whose panel does its own arithmetic. **No boundary is written down in this file except the ones it
types on purpose** — the seeded scale is compared against what came out of the document, because
90/80/70 belongs in seed data and a harness asserting `93` would be a second copy of a school's
grading policy living in a tool. And the third is a fixture that proved nothing until a mutation said
so, which is the WO-3.1 float-tolerance footnote happening again in a new place: **the check that a
scale is never sorted behind the teacher probed 89.4 and 89.6, and a `letterFor()` mutated to sort
descending answers both of them identically** — reordering an A at 89.5 above an A− at 90 changes
nothing below 90. It went green against the defect it exists for. The probe that catches it is 92,
where the list says A and a sorted list says A−. Four mutations, all reverted and tabulated in
`TESTING.md` § WO-3.2.

**515 at WO-3.3**, and forty-two is a count of additions in one new section: the assignment list, the
three-tab screen switcher, and the two dialogs that write one assignment. Five of them are worth
knowing about. **The trap check is asserted from both ends and only one end has a control.** WO-3.3
forbids a duplicate carrying its source's `categoryId` into another class, so one check reads the copy
the real dialog wrote and asserts it wears the TARGET's category or none; the other plants an
assignment in class B wearing class A's category id — the shape a restore or a hand edit can produce,
which no button can — and asserts it is absent from A's list **and** absent from the count in A's
category-removal confirm. The second is the expensive half: an unguarded count is what a teacher agrees
to destroy. **The always-opens-on-Attendance line is driven the way the work order asks for it and not
the way a desk would reach for.** It leaves one class on Assignments, opens a second, and comes back,
because a per-class memory is invisible until the second class; then it does the same thing across a
reload and asserts `planbook_openView` never held anything but `class`, which is the cross-reload form
of the same defect. **The coverage bar needed a roster and the run does not leave one where it can be
used** — the only class carrying students is the one restored from a pre-WO-3.1 backup, which has
neither terms nor categories and so cannot hold an assignment at all — so this section adds two
students through the real roster form and takes them out again at the end. Deliberately not added to
the class that already has 26: the attendance section asserts that number, and a fixture that quietly
changes another section's arithmetic is worse than no fixture. And **one check is honest about being
unable to demonstrate its line**: WO-3.3's seventh acceptance line says a student's name leaves the
strip when you switch away from their detail, and there is no detail screen in this build to leave —
so what is asserted is the rule's safe direction, that a name set through `setDetailBreadcrumb()` with
no detail open is drawn on neither strip. The line is re-homed to WO-3.7 rather than ticked. And
**the duplicate's fixture had to be built in both directions, which it was not at first.** The check
that says a copy wears the target's own category id "or none" was written against a document in which
no two classes shared a category name, so only the *no match* path was ever taken and a
`matchCategory()` returning `''` unconditionally would have passed the whole section — the verifier
found it by asking what would have to be true of the fixture for the bug to be invisible, and the
answer was the fixture. It now renames the source's category through the real name field to a name no
other class has, drives the dialog against that, then adds a category of that same name to the target
through the real manager and drives it again: the refusal and the match, each asserted, with the
fixture itself asserted before both. Seven mutations, all reverted and tabulated in `TESTING.md`
§ WO-3.3.

**522 at WO-2.17**, and the seven are one new section directly under the assignments one, which is
where that section's own comment had left the registry's term-totals gap "to whoever owns it". Three
things about it are worth knowing. **The three checks that carry the acceptance line were written and
run RED first**, against the unfixed tree — `519 passed · 3 failed` — because this work order asks for
the pre-fix failure in as many words, and a check written after a fix has never demonstrated that it
can fail. **The fixture is two dated terms over records the block plants, three meetings in one window
and five in the other**, so the claim is a number that has to move rather than a repaint that has to
happen: a check that read the term LABEL at the front of the totals line would go green against a
build that redrew that line out of the same stale totals. And **the Traps line is measured with a
sentinel attribute rather than argued from the diff** — `data-wo217-sentinel` on one row of the grid
survives a repaint of the figures and does not survive `renderAttendance()`, which empties tbody, so
the blanket fix this work order forbids turns exactly one check red while leaving the two "the figures
moved" checks green. The totals element is overwritten by hand before every term tap made from a
screen that is *not* the registry, which is how "a screen that does not read the term is not
repainted" is asserted as text still sitting there afterwards. Two mutations, both reverted and
tabulated in `TESTING.md` § WO-2.17.

**537 at WO-2.18**, and only two of the fifteen are that work order's: the tree it arrived on
measured **535**, because WO-3.4's thirteen grade-engine checks landed without reaching this line.
Measured on the tree, not carried forward — which is the footnote below happening for the third time,
and the reason it is worth thirty seconds is that the arithmetic 522 + 2 would have read as a green
run of 524 for as long as anyone believed this line. **Both of the two hang off WO-2.17's fixture
rather than standing up a second one**, which is what the work order asks for and also what makes the
first of them cheap: the two dated terms, the planted student and the three-meetings-against-five are
already there, and all the check adds is the ⋯ tapped before the term is. **The first is the third
surface `paintRenderedTotals()` paints.** Its header comment names three — the class line, one line
per row, and the open detail panel — and WO-2.17's seven asserted the first two, so a check that
asserts two of three painted surfaces licenses the third to be deleted. It is read out of the DOM,
from the text in `.attendance-detail-totals`, and never from the totals map: a figure recomputed
correctly and never painted is the whole bug, and re-reading the map is how a check goes green
against exactly that. *One correction to that reasoning, found by running the mutation rather than
arguing it: deleting the call turns **two** red, not one — WO-2.13's "a filtered-out row and its open
detail repaint exact term/year totals after a mark" was already watching that same line from the MARK
path. So the harness was not blind to the deletion; it was blind to it on the term-switch path, which
is the one WO-2.17 shipped and the one where nothing else would have moved the figures back.* **The
second drives `selectTerm()` with a term id borrowed from another class
in the same document**, which no control can do — the nav only ever draws the open class's terms —
and asserts the absence of all three of its writes: the preference serialised byte for byte, the
nav's own active mark, and the live region, pre-filled with a sentence of the harness's own so that
silence is text still sitting there rather than an empty string that was always empty. It catches the
throw rather than letting it fly, and asserts on that too, because a build whose guard is gone
reaches `term.label` on a term the class does not have and dies **before** it can write a preference
or announce — so the three absence claims would all have been satisfied by a screen that had just
broken. Two mutations, both reverted and tabulated in `TESTING.md` § WO-2.18.

Update this line when you add checks — a stale count here reads as "the harness has not been touched since
WO-1.3", which is the opposite of true and makes a green run look smaller than it is.

*(This line said 79 for WO-1.5 and the real number was 82: the three checks added with the per-year
backup fix on 2026-08-04 never reached it. Measured, not guessed — `git stash` and a run on the
WO-1.5 tree. A count that is nearly right is the same problem as a stale one, so it is worth the
thirty seconds.)*

**554 at WO-3.5, and the line above stops at 537 — the third miss, and the reason WO-2.19 exists.**
WO-3.5's seventeen are counted in `TESTING.md` § WO-3.5 (*"554 of 554 with zero skips, 17 checks added
in one new section"*) and never reached here, which is WO-3.4's thirteen happening again one work
order later. Measured on `1f5217c` on 2026-08-10, not carried forward: `554 checks · 554 passed ·
0 failed · 0 skipped`, 13,150 lines, 23.7 lines per check, 177s. **That number is still maintained by
hand and there is no honest way to make it otherwise** — it is `results.length` at the end of a
177-second browser run, and the sweep that guards the line below opens no browser by design.

**563 at WO-3.17**, measured the same way: `563 checks · 563 passed · 0 failed · 0 skipped`, 13,558
lines, 24.1 lines per check, 182s. Nine of the ten call sites added are a new section at the foot of
the file — the Assigned and Due fields — and the arithmetic 554 + 10 = 564 does not hold because one
existing check was RE-POINTED rather than added, while the tenth new site is a fixture guard's
failure arm that a green run never reaches. WO-3.3's
*"no date field auto-populates: a new assignment arrives with both dates empty"* asserted the exact
behaviour the owner overruled on 2026-08-10, so it now asserts that both dates arrive on today and
that nothing schedule-shaped fills them, which is the half of that line that never changed. Four
things about the new section are worth knowing.

**It runs at two widths, and the split was forced by an artifact that reads exactly like an app
defect.** Written as one 390px pass, two of its checks failed reporting the values of a dialog that
had never opened: at 390 the page reports `document.documentElement.clientWidth` 390 and
`window.innerWidth` 524, and `95vw` resolves to 370.5px — the layout viewport is 390, the visual one
is 524, and the page is at a scale of about 0.74. `getBoundingClientRect` answers in layout
coordinates and `Input.dispatchMouseEvent` takes visual ones, so a click at the left edge lands and
one aimed at a row control near the right edge misses by about a third of the screen. Changing the
device scale factor from 3 to 2 did not fix it, which is how that suspicion was eliminated. So
everything that clicks a control runs at 1024x768 and only the geometry runs at 390, reached with the
one control at the top of the panel. It is **not** in the numbered trap list below, because that
list's rule is two independent diagnoses and this has one; it is written up at the point in the
harness where it bit, and a check now asserts the two viewports are equal before anything is clicked.

**The fields are measured EMPTY, and after this work order that is a state a teacher reaches only by
clearing a date.** Part two puts today in both dates on creation, so a block that opened a new
assignment and measured what it found would be measuring boxes with values holding them open — while
the owner's screenshots are of empty ones. The section therefore creates an assignment, clears both
dates through the real fields, and measures what is left; the emptiness is asserted **inside** the
same check as the geometry, so a build that stopped clearing cannot quietly turn it into a
measurement of two filled boxes. Proved by mutation: applying the default on OPEN rather than on
creation turns that check red along with three others.

**One check is honest about measuring the mechanism only as far as a laptop can see it.** The iPad
symptom is WebKit painting the native date widget over the box the stylesheet sized; headless
Chromium honours the box already, so it can demonstrate neither the defect nor the fix. What is
asserted instead is that the `appearance` reset is live on both fields as a **computed style** — it
says the declaration reaches the right element, not that iOS obeys it, and it exists so the one line
the whole fix rests on cannot be tidied away without something going red. The 👤 line stays owed.

**And the prose check reads two surfaces rather than the one the work order names.** The bold
promise that had become false was copied in the editor dialog as well as under the list, and a
rewrite that fixed one would have left the dialog contradicting itself an inch from the field.
Reverting only the editor's copy turns that check red with the list hint still correct. Four
mutations, all reverted and tabulated in `TESTING.md` § WO-3.17.

**582 at WO-2.6**, measured the same way: `582 checks · 582 passed · 0 failed · 0 skipped`, 14,038
lines, 24.1 lines per check, 185s. Eighteen call sites added — seventeen in a new section at the foot
of the file for the history dialog, the printed record and the CSV, plus one in the coarse sweep for
the 🖨 door and the student's name, which became a control at this work order. Four things about the
new section are worth knowing.

**The fixture is built so that a second walk over the ledger cannot survive it.** Inside the open
term there are six recorded meetings and, beside them, two records that must appear nowhere: one
carrying an `exception`, and one outside the term's dates. Both are what a hand-rolled filter gets
wrong, and both are why acceptance line 1 is written as *"the two agree"* — a history built from its
own walk would list eight rows over a percentage computed from six and nothing on screen would look
broken. The dates are written down in the harness and compared **as a list**, never counted. Proved:
giving `attendanceHistory()` its own filter with no `stateOf()` in it turns three red, and the
detail line reads `last row "5 of 7 · 71%", badge "67%"` — which is the acceptance line failing in
its own words.

**Acceptance line 4 is asserted in BOTH presentation modes, and the mode-off pass is the one that
matters.** Support data is planted on the student first — a plan, a case manager, an accommodation,
a medical line and a behavior plan, each with a sentinel — and its presence in the serialised
document is asserted before either surface is read, because an absence check over a student with
nothing on file proves nothing. Then the history, the record and the CSV **text** are searched for
every sentinel with the toggle off (support data visible everywhere else in the app) and again with
it on. The search covers `JSON.stringify(classRecord())` as well as the two rendered surfaces, which
is deliberate: the strongest form of this guarantee is that the data never reaches the shape the
surfaces are built from. Proved by the mutation the work order's brief predicts by name — carrying
`supports` onto the record shape and printing it behind the visibility switch turns **three** red,
including *both* mode passes, because the gated build still has the data in hand.

**The CSV is read as text through the seam and never as a downloaded file**, which is `src/backup.js`'s
own build-it/hand-it-over split reused: `recordCsv()` takes a record and returns bytes with no DOM in
it, so the BOM, the CRLF endings, the column order and the quoting are asserted character by
character. A student called `O"Brien, Jr` is in the fixture for one clause alone — a `join(',')` with
no quoting turns that row into two extra columns, silently, in a file the teacher opens weeks later.
Proved: removing the quoting turns two red, on a row that parses to width 1.

**And the section never calls `printRecord()`.** *(True until WO-2.25, which taught it WO-3.7's stub
and drove the real 🖨 Print button — see that block below. Everything else in this paragraph still
holds, including what stays owed to a human with a printer.)* `window.print()` in a headless browser prints
nothing and can block, and no emulator has a sheet of paper, so *"the print view fits a class on a
page"* stays owed to a human with a printer. What is measured instead is the two halves a laptop can
see — the header carries the class, the term, the range and the meeting count, and a term of thirty
meetings comes out as **two** slices of 24 and 6 rather than one table nobody could print (mutating
the slice size to 100 turns one red) — plus the gate: every `@media print` rule touching this surface
is selected under `body[data-attendance-print]`, and `<body>` carries no such attribute at rest, which
is what keeps a Ctrl+P made anywhere else in the app from printing a blank sheet. Six mutations, all
reverted and tabulated in `TESTING.md` § WO-2.6 — and one of the six is tabulated as a **failed
mutation run** rather than as a result, because its edit never applied and the green run it produced
meant nothing until it was re-run.

**591 at WO-2.21**, measured the same way: `591 checks · 591 passed · 0 failed · 0 skipped`, 14,230
lines, 24.1 lines per check, 193s. Nine results out of **three** call sites, and that ratio is the
work order: the sweep now opens every view in `<main>` and measures each one, so two of the three
sites fire once per view. **The nine exist because the old sweep measured one screen and sounded like
it had measured the app** — `.hidden` is `display: none !important`, the sweep skips anything that
computes to `display: none`, and every view but the one on screen is `.hidden`. WO-3.5's ~250 score
inputs went through that gap and this harness reported green over all of them. Three things about it
are worth knowing.

**The views are enumerated from the document and opened through the real navigation, and the second
half of that is the decision.** `<main>`'s element children *are* the view list (src/views.js's
header), so a screen added to `index.html` and not to the harness's `VIEW_PLAN` turns a check red and
names itself rather than being silently unmeasured. Un-hiding each view in turn would have been
cheaper and would have gone **green over the defect that produced this work order**: `#scoresView`
shipped with its only segment disabled, so the view existed and was drawn and no teacher could reach
it — un-hiding measures a beautiful grid there, and clicking the door cannot. A view whose door is
missing or disabled therefore fails by name here instead of being skipped.

**Every view carries its own floor, and the floors are small on purpose.** Zero controls measured and
zero controls undersized are the same green, so each view asserts a count before it asserts a
measurement — 7 · 27 · 5 · 4 on this tree, floors 3 · 20 · 5 · 4. They are that low because of what
the run's document holds by then: the assignments section has deleted every assignment and the class
left open has no roster, so `#assignmentsView` and `#scoresView` are in their empty states and what
is left on them is panel chrome. **That is also why WO-3.5's by-hand block stays**, which is the one
sentence its work order asks for: the general mechanism can reach that screen and cannot reach a
*full* one, and 250 cells is what WO-3.5's acceptance line is about. Proved rather than argued —
deleting that block outright leaves `588 checks · 588 passed`, with `#scoresView` still opened and
measured by the general mechanism at **4 controls** instead of the **259** the block itself prints on
a real run (`measured 259 visible control(s) with the grid open`, 250 of them score cells). What is
no longer duplicated is the measurement itself: one `measureIn()` builds it, and the two skips and
the definition of "a control" are written down once.

**Two mutations, both reverted.** Planting an empty view that is a real class screen (`index.html`,
`src/views.js` and `src/screen-nav.js`, plus its `VIEW_PLAN` entry) turns its two checks red on the
floor — *"0 control(s) measured"* — rather than passing for having nothing to complain about; planting
a second view that the harness has never heard of turns the enumeration check red naming
`wo221UnknownView`. The same run also caught something a desk review would not: the restore that puts
the page back for the sections below depended on the last view opened having a switcher in it, which
an empty one does not. It now goes out to the grid and back in through the class's own card, which is
the route a teacher has when a screen has no door onward.

**674 at WO-2.25**, measured the same way: `674 checks · 674 passed · 0 failed · 0 skipped`, 16,921
lines, 25.1 lines per check, 206s. Thirteen call sites added and one deleted, all literal, none in a
loop and none a fixture-guard arm — so the executed count moves by the same twelve, 662 → 674. The
work order is one module (`src/print-gate.js`) replacing three copies of a print gate, and the
harness half of it is that **all three print surfaces now make the same five readings**, where two of
them made almost none. Three things about it are worth knowing.

**The check that was deleted is the reason the work order exists.** *"and the attribute comes back
off, so the next Ctrl+P is the browser's business again"* asserted that `data-detail-print` was gone
700ms after the tap. It passed on every run and the surface was broken anyway — it measured the
release timer, and the timer was the bug. The grade sheet's equivalent had already gone the same way
at WO-3.9; this is the second and last of them. **What a gate is 700ms after a tap is not what it is
when the browser prints.**

**The attendance section drives `printRecord()` for the first time.** Its header used to say it never
could — `window.print()` blocks in a headless browser — and WO-3.7's answer, stubbing `window.print`
and taking the reading inside the stub, is what it now borrows. Until this work order the only thing
measured about that gate was that `<body>` carried no attribute **at rest**, which is green on a
build that prints the whole app on the second tap of a sitting.

**Four of the thirteen fail on the tree as it stands, and the other nine were watched failing under
mutation instead**, which is the honest version of the acceptance line that asks for all of them.
Thirteen is the denominator and not twelve: twelve is the net after the deleted check, and a check
that no longer exists is not one anybody can watch fail. Against the unfixed
`src/attendance-report.js` and `src/detail.js` — the timer, verbatim, as shipped — the run is `674
checks · 670 passed · 4 failed`, and the four are *"the gate is still on"* and *"a print the browser
refused and the teacher then allowed re-gates itself"* on **both** surfaces. Of the nine that passed
there, four are shaped as absences the buggy build also satisfies — the timer had already cleared the
attribute, so *"`afterprint` clears it"* and *"a Ctrl+P made when the surface is NOT up clears it"*
pass for the wrong reason — and they went red on mutating `src/print-gate.js`'s `afterprint` listener
and `syncAll()`. The other five are not absence-shaped at all: the two one-tap readings and the three
isolation readings, four of them red under a doubled `print()` with the gates shared, the fifth under
`src/attendance-report.js` gating on `data-detail-print`. Four plus four plus four plus one — the
table under `TESTING.md` § WO-2.25 has each mutation, with the failure text.

**677 at WO-2.25's second correction round**, and it is the first section in this file whose subject
is not a screen: `677 checks · 677 passed · 0 failed · 0 skipped`, 17,011 lines, 25.1 lines per check,
214s. **A gate attribute is not a click hook**, asked of all three gates, at the foot of the file after
the WO-3.9 teardown because it depends on no fixture. The owner found the bug it covers on her own
machine the day the work order passed: pressing **Ignore** on Chrome's *"blocked from automatically
printing"* leaves the gate on `<body>` — which is the fix behaving correctly — and the detail screen's
Print button was named `data-detail-print`, the same string as its gate, so `src/shell.js`'s delegated
`closest()` walked up to `<body>` and matched **every click anywhere on screen**. Every click re-opened
the print dialog. The deleted 500ms timer had been hiding it for a year of copies; **the fix that made
the gate self-correcting is what made the collision reachable**, which is why there was no check for it
anywhere in this file. The check sets each gate on `<body>` in turn, clicks three things that are not
controls — `<body>` itself, the header's own box, `<main>` — and counts `window.print()`. On the
unfixed tree it reads `{"body":1,"header.header":1,"main":1}`. **It asks all three surfaces on
purpose:** the other two are safe by luck of naming (`data-attendance-record-print` against
`data-attendance-print`), so a detail-only check would have re-asserted an accident, and the fourth
print surface Phase 4 and Phase 6 want is the one this is really for.

**`verify-shell.mjs` holds 760 `check()` call sites**, and that is the number `tools/wo-sweep.mjs`
asserts on every run — the sentence you are reading is the one it greps for, so rewording it turns the
sweep red rather than turning the check off. Its allowlist is written down at the check: the
definition at `tools/verify-shell.mjs:68` is not a call, the `else check(` at `:10773` is why the
pattern is not line-anchored, and comment lines are excluded because the harness quotes call names in
its prose constantly. WO-3.12 moved it from 592 to 596, four literal call sites (case 8's third
direction and cases 13-15) added to the grade-engine block, none inside a loop; WO-2.24 moved it from
596 to 599, three literal call sites in three different sections, likewise none inside a loop; WO-3.7
moved it from 599 to 627, twenty-eight in one new section at the foot of the file, of which one is a
fixture-guard failure arm and one sits inside a two-pass loop, and then to 629 on its correction
round — two more in the same section, both about the page box (see the WO-3.7 block below); WO-1.15
moved it from 629 to 637, eight literal call sites inside the existing `backup & restore` section,
none of them in a loop and none of them a failure arm — its own two-pass presentation-mode loop is in
Node, around one call site that fires once; WO-3.9 moved it from 637 to 659, twenty-two in one new
section at the foot of the file, of which one is a fixture-guard failure arm that never fires on a
green run and one sits inside a two-pass presentation-mode loop that fires twice — so the section
contributes twenty-two executed results to the 636 the tree already ran, and the run prints 658; then
WO-3.9's print-gate fix moved it from 659 to 662, a net three in that same section — one call site
deleted and four added, all literal and none in a loop — and the run prints 661. **The deleted one is
the reason this entry is worth reading.** It asserted that the print gate was off again 700ms after
the tap, it passed on every run, and the surface was broken anyway: it was measuring the release
timer rather than what the browser prints, and the timer was the bug. Two of the four that replaced
it fail on the build that shipped. Then 662 to 663 on the re-test: **a counter the section had
collected since it was written and never asserted**, promoted to a check the day the owner reported
Chrome still showing "blocked from automatically printing" after the fix. One tap calls
`window.print()` once, so the throttle is the browser's policy and not a delegated handler firing
twice — which is the difference between a bug and a browser, and there was no reading that told them
apart until this one. **WO-2.25 moved it from 663 to 675**: thirteen added and one deleted, all
literal and none in a loop — six in the attendance section, which had never driven `printRecord()` at
all; six in the detail section; and one in the grade sheet's, so that each of the three surfaces
asserts on its own that a print carries its own attribute and neither of the other two. The deleted
one is the detail section's *"the attribute comes back off"*, which is the paragraph above happening
a second time on a second surface — same lifted idiom, same timer, same check green over it. **Its
second correction round moved it from 675 to 676**, and that one site is the first this file has added
inside a loop since WO-2.21: one `check()` over the three gate attributes, three results, which is why
the gap below is negative for the first time. **WO-3.6 moved it from 676 to 695**: nineteen literal
call sites in one new section at the foot of the file, none of them inside a loop, of which **two are
fixture-guard failure arms** that never fire on a green run — one for a build with no `[data-past-due]`
host to paint into, one for a fixture that could not be planted — so the section contributes seventeen
executed results. **WO-3.8 moved it from 695 to 713**: eighteen literal call sites in one new section
at the foot of the file, ahead of the print-gate block, none of them inside a loop, of which **two are
fixture-guard failure arms** that never fire on a green run — one for a build with no
`[data-accommodation-prompt]` host, one for a fixture that could not be planted — so the section
contributes sixteen executed results and the run prints 710. **WO-3.19 moved it from 713 to 717**:
four literal call sites, none in a loop and none a failure arm, added *inside* the existing WO-3.6
section rather than in a new one — the tint's third acceptance line is an identity with the past-due
prompt's own set, and two fixtures could only ever have been compared for agreeing with each other.
Its own reading rides on the same `READ` block, which is why the section's other checks are unchanged
and its executed count goes up by exactly four. **WO-2.9 moved it from 717 to 734**: seventeen call
sites, **sixteen of them a new section** at the foot of the hall-pass block — the elapsed clock, the
two overdue alerts and the pass history — none inside a loop and none a failure arm, plus a
`skip()` beside one of them for the run in which no trip in the log carries a note (a `skip` is not
a `check(` and is not in this count). The seventeenth is **one call site inside the existing
two-orientation loop** in the pass-card sweep, so it prints twice: the section contributes eighteen
executed results and the run prints **732**. That loop is where the elapsed figure had to be measured
rather than in the new section — it arrived into a card row whose single-line property was paid for
with two iPad sittings, and the reading beside it is `scrollWidth` against `clientWidth`, which is the
"Days off" spill asked of the element that grew. **WO-2.26 moved it from 734 to 748**: fourteen call
sites, none inside a loop and none a failure arm, added *inside* that same hall-pass section rather
than in a new one — the join between the pass log and the Student Report screen is only checkable
against a log that already has trips in it, and this section spends forty checks filling one. A block
of its own beside WO-2.6's would have had to plant the fixture it then read back. So the run prints
**746**, and the section's own reader (`reportPasses()`) is a second reader beside `readHistory()`
rather than a change to it: they read two different dialogs, and `detailCard()` beside them reads a
screen rather than either. **The number went 734 → 742 → 748 inside one day, and the middle figure is
the part worth reading.** That was the work order's first cut, aimed at a 🚪 Every trip door on the
attendance history dialog; the owner re-cut the work order the same day against the running build and
the door was deleted, so those eight checks were asserting a control that no longer exists. They were
not re-run — a green harness against the wrong target is not evidence — and the crash they left
behind is why this entry is here at all: the first check clicked the deleted door, `clickSel` threw,
and **the run died before WO-2.3 and everything under it**, with no summary printed. A failing check
is a red line in a report; a `clickSel` on a hook that has gone is the whole rest of the file not
running. The replacement asks for every door with `has()` before it clicks one, and a fixture that
does not land now FAILS one check and SKIPS the rest by name. *(One check outside this section moved
with it and is not in the count: WO-2.6's "every print rule is gated" now sorts rules by WHICH
surface's attribute gates them, because `src/attendance.css` grew a second arm under
`data-detail-print` for the trip table WO-2.26 draws onto the Student Report card. Ungated is still a
failure; the borrowed arm is counted so that losing it goes red rather than reading as a tidier
stylesheet.)* **WO-2.27 moved it from 748 to 750**: two call sites, neither in a loop and neither a
failure arm, and they sit in two different sections because they answer two different work orders'
gaps — one in the hall-pass block, driving the early-return path out of `paintPassBanner()` and
watching the elapsed interval through wrappers on `setInterval`/`clearInterval`, and one inside
WO-3.7's section, asserting that WO-2.26's hall-pass card is on the Student Report screen when that
screen is reached from `#scoresBody [data-student-detail="…"]` rather than only from the door in the
attendance history dialog. So the run prints **748**. *(That work order also planted a third trip in
WO-2.26's fixture, dated sixty days after `term.end`, which adds no call site and changes what four
existing ones assert: until then every trip in the fixture fell on or before the term's end, so
`passesForStudentInTerm()` reduced to its `from` bound alone passed the whole suite. It now fails
seven of them, 741 of 748, in the copy of the tree that proved it — the count is in `TESTING.md`
beside the work order.)* **WO-2.28 moved it from 750 to 754**: four literal call sites inside the
existing WO-2.9 hall-pass block, none in a loop and none a failure arm — the first drives Scores,
the next two assert the missing-banner-node fixture and its document-driven alert, and the fourth
asserts the state and screen restoration. **The run prints 752** — measured on the delivered tree
rather than derived, `752 checks · 752 passed · 0 failed · 0 skipped`, the gap to 754 being the two
allowlisted non-calls rather than anything that failed to fire. **WO-2.29 moved it from 754 to 758**:
four literal call sites in that same WO-2.9 hall-pass block, none in a loop and none a failure arm —
one reading the two tones the escalation walk's own winds asked for, and three around the header mute
(the switch and its preference, a threshold crossed with the sound off, and the same threshold
crossed again with it back on). **The run prints 756**, measured on the delivered tree:
`756 checks · 756 passed · 0 failed · 0 skipped`, 254s. *(That work order also upgraded an existing
clause rather than adding a site — the missing-node fixture guard's bare `!!beforeMissingNodePass`
now asserts the saved record carries no `alerted` key, which is a precondition for the alert check
below it and deliberately not a new claim.)* **Its correction round moved it from 758 to 759**: one
literal call site beside the tone reading in the same block, not in a loop and not a failure arm, and
it is there because the four before it went green through a device failure — it asserts the
*mechanism* the corrected iOS unlock turns on (one AudioContext for the life of the page, born in a
gesture, still open, carrying both tones) rather than the audio path, which reports the same numbers
whether or not a sound leaves the device. **The run prints 757**, measured on the corrected tree:
`757 checks · 757 passed · 0 failed · 0 skipped`, 243s. **WO-3.15 moved it from 759 to 760**: its
first round added one literal behavior check inside the existing WO-3.5 score-grid block and
inadvertently deleted WO-3.14's standalone precision check while folding those assertions into the
case-1 check. The correction restores that pre-existing call site under its original name, including
the `docs/grade-math-cases.md` reference, and removes the folded assertions, so WO-3.15's final
inventory is one added and none deleted. **The run prints 758**, measured on the corrected tree:
`758 checks · 758 passed · 0 failed · 0 skipped`, 252s. *(The
`else check(` has drifted from `:10773` — it was at `:10838` before WO-2.24 and is at `:10941` after.
The line number is illustration rather than something either tool resolves, and correcting it in one
of the two files that carry it would leave them disagreeing; it is noted here so the next reader who
follows it does not think the allowlist has stopped applying.)*

**That number is a count of lines, and since WO-2.22 that is a check rather than a premise.** The
sweep pushes one entry per *line* that holds a call, so what it asserts equals the number of calls
only while no line holds two — and a second call appended to a line that already has one is the one
edit that moves nothing: no new line, so the count does not budge, the comparison above passes, and
the sentence above goes quietly wrong. A second clause in the same section now asserts that no
call-site line holds a second occurrence, and names the line when one does —
*"tools/verify-shell.mjs:495 hold(s) more than one `check(`"*, from the mutation that proved it, with
the count clause still green in that same run at the 596 of the day, which is the proof it is not
vacuous: an append adds no line. Counting occurrences into the number itself is the wrong fix, refused:
`check(` also turns up in trailing comments and in the harness's own quoted prose, and the comment
filter excludes whole comment lines rather than trailing ones, so occurrence counting trades a
hypothetical undercount for a plausible overcount and a false red. **A missing `tools/verify-shell.mjs`
or `tools/README.md` is a `FAIL` there too, since WO-2.22** — it printed a `REVIEW` and exited 0 until
then, and a vanished harness is not a decision anybody is being asked to make; it is the one condition
under which every claim that section makes is void.

**Call sites and executed checks are permanently unequal, and the gap is not a list of things somebody
could go and name.** It is 713 − 710 = **3** on this tree: WO-3.8's eighteen sites include two
fixture-guard failure arms a green run never reaches, which is the first bullet below and moved the
gap by two. It was 695 − 694 = 1 after WO-3.6 (nineteen sites, two arms, seventeen results — that
work order moved the gap by two as well, and this paragraph was not updated for it at the time; the
number below it was `676 − 677` for two work orders and is corrected here). **It was 676 − 677 =
−1 at WO-2.25's second correction round**, and that sign was the point: that round added **one** call
site producing **three** results — a single `check()` inside a loop over the three print gates — so
the executed count had overtaken the call sites for the first time in this file's history. A negative
gap is the second bullet below outrunning the first, and nothing more. It was 675 − 674 = 1 before
that round (WO-2.25's thirteen added and one deleted are
all literal sites outside any loop, so both numbers moved by the same twelve and the gap did not
budge for a sixth work order running; 659 − 658 = 1 at WO-3.9, and 637 − 636 = 1 before it — whose
twenty-two sites produced exactly twenty-two results, by the same coincidence WO-2.6's eighteen did
and for the same two reasons at once: one fixture-guard arm a green run never reaches, and one call
site inside a two-pass presentation-mode loop that fires twice — 629 − 628 = 1 before WO-1.15,
627 − 626 = 1 before WO-3.7's correction round,
599 − 598 = 1 immediately before WO-3.7,
596 − 595 = 1 before WO-2.24 and
592 − 591 = 1 before WO-3.12 — the four sites WO-3.12 added and the three WO-2.24 added each execute
exactly once, WO-3.7's twenty-eight produced exactly twenty-eight results by the same accident
WO-2.6's eighteen did, its correction round's two are two more literal sites outside any loop, and
WO-1.15's eight are eight more of the same — its presentation-mode loop is in the harness's own Node
half rather than around a `check()`, which is why eight sites made eight results — so
the gap itself has not moved in five work orders), it was
589 − 582 = 7 before WO-2.21, and it was
560 − 554 = 6 at WO-2.19; what
follows is the WO-2.19 instrumentation, which has **not** been re-run since, so treat the three
counts in it as the measurement of that tree rather than of this one. **WO-2.21 moved it by six in
one go**, which is the second bullet below arriving in bulk rather than anything new: two of its three
call sites sit inside a loop over the views enumerated from `<main>`, and four views turn two sites
into eight results. A gap of 1 is not a harness that has become tidier; it is two unrelated
quantities that happen to be passing each other. The gap moved by one at WO-3.17,
because that section added one fixture-guard failure arm — the first bullet below is the shape of it.
**It did not move at WO-2.6, and that is a coincidence of both mechanisms below firing at once**: that
section added one fixture-guard arm a green run never reaches AND one call site inside a two-pass loop
that fires twice, so the eighteen sites it added produced exactly eighteen results. Nothing about the
reasoning changed. 560 − 554 = 6 reads like six unreached branches; the work order that
booked this check reasoned its way to *"roughly 541 call sites against 537 executed — four sites that a
run does not reach"* on the same arithmetic, and both numbers are a coincidence of two unrelated
quantities. Measured by instrumenting a throwaway copy of the harness — `new Error().stack` inside
`check()`, executed line numbers diffed against the grep — a green run on this tree fires **532
distinct call sites**, of which **10 fire more than once** (22 extra results, one site 10×), and
**28 never fire at all**. 532 + 22 = 554. The two corrections cancel to 6 by accident.

- **The 28 that never fire are all one shape: the failure arm of a fixture guard.** `if (!plant.ok)
  check('the WO-3.5 fixture is real…', false, plant.why)` — `tools/verify-shell.mjs:12532`, and
  `:4814`, `:6708`, `:10143`, `:12632` and the twenty-three like them. They exist so that a fixture
  that did not arrive is announced as a red check rather than as a section that quietly did not run,
  which is this file's oldest rule. **A run in which one of them fires is a run in which something is
  wrong**, so "call sites a green run does not reach" is a description of the harness working.
- **The 10 that fire more than once are `check()` inside a loop** — once per viewport, per
  orientation, per note code: `:11557` runs ten times across the note-panel matrix, and `:11269`,
  `:11296`, `:11332` and `:11338` three times each across three window sizes. One call site there is
  ten lines of output, and no grep can see that.

So the sweep asserts the call sites and this paragraph states the executed count beside it, rather
than a check that passes when two different numbers are close. **If you add a check, both numbers
move and neither moves by the same amount**: the sweep will tell you the first one by name, and the
second one comes off the summary line of a run.

**`verify-shell.mjs` does not assert its own summary against this file, and that is a decision rather
than an omission.** WO-2.19's implementer proposed it as the obvious follow-up — eight lines at the
foot of a run, and the executed count is the one number in this system that nothing watches — and
WO-2.22 refused it on two grounds, written down here so the next reader who spots an unguarded number
does not re-propose it. **First, a red `verify-shell.mjs` run means the app is broken.** In week one
of a live term that signal has to stay clean enough to drop everything for, and making it also mean
*"a sentence in a README is stale"* spends the one alarm that must not be second-guessed. **Second,
the hole is already mostly closed, sideways.** §11's own failure text says in as many words to update
the recorded call-site count *and the executed-check count in the paragraph beside it*, from a run
rather than by arithmetic — so every event that makes the executed count stale, a check added or a
check removed, trips the sweep and hands the reader both numbers to go and fix. What is left uncovered
is somebody editing the executed count wrongly while touching no check at all, which is not the
failure that happened three times.

**A cross-reference between the two harnesses is a claim, and it can be false.** `wo-sweep.mjs` is
**17 checks** since WO-2.22, and the three added at WO-3.2's follow-up exist because this file's sibling
had already written down that they did. The letter-grades section of `verify-shell.mjs` said its
fourth acceptance line — *there is no rounding code anywhere* — "is a grep, made in
`tools/wo-sweep.mjs`", at a point when the sweep had no rounding check of any kind. The line had been
settled by hand once, in the dispatch, and the comment quietly promoted that reading into a standing
guard. Nothing was measuring it, and the next person to propose a "round to nearest whole percent"
option would have been told by two files that something was watching.

The lesson generalises past this one comment: **the two harnesses can only point at each other for
checks that exist, and neither one can see the other's absence.** `verify-shell.mjs` cannot tell that
a grep it defers to was never written, and the sweep does not read the harness's prose. So a sentence
of the form "this is checked over there" is exactly as load-bearing as a check and exactly as
unverified as a comment — write it only after running the thing it names. This is the WO-1.10 CACHE
miss in a new register: not a rule nobody enforced, but a rule the record said was enforced.

**The 17 above is deliberately unguarded, and the asymmetry is the reason §11 was worth building for
the other file and is not worth building for this one.** Nothing greps this sentence the way §11 greps
the harness's count, and it does not need to: the sweep prints its own true figure on the summary line
of every run — `17 checks · 16 passed · 0 failed · 1 to review` on this tree — in about a second, in
front of the only reader who would care, who is by definition already running it. `verify-shell.mjs`'s
count is different in kind, because confirming it costs a three-minute browser run that nobody spends
to settle a sentence in a README, which is exactly how that line went stale three times (WO-1.5,
WO-2.18, WO-3.5). A stale figure here is corrected for free by the next person to run the sweep; a
stale one there survives until somebody instruments a copy of the harness. So when you add a check to
the sweep, **do not increment this number by arithmetic** — run it and copy the summary line, which is
the same instruction §11's own failure text gives about the two numbers it watches.

**595 at WO-3.12**, measured the same way: `595 checks · 595 passed · 0 failed · 0 skipped`, 14,295
lines, 24.0 lines per check, 194s. Four checks land inside the grade engine block (WO-3.4)'s own
section — case 8's third direction, and cases 13 through 15 — closing the gap that section's own
header named as an explicit follow-up: cases 1-12 are all one class, one term, one student, so an
engine that dropped `classId`, `termId` or `studentId` entirely passed every one of them, and the
only unbalanced-weight fixture used integer weights, which cannot expose the `formatWeight()` bug
WO-3.4's correction round fixed. Four mutations, three of them isolating cleanly and the fourth not,
all reverted and tabulated in `TESTING.md` § WO-3.12.

**The `studentId` mutation is the honest exception, in the WO-2.18 shape.** Dropping the `classId`
and `termId` filters in `assignmentsFor()` (`src/grade-engine.js:35-36`) each turned exactly one
check red, because the WO-3.5 fixture this harness already drives is one class and one term —
nothing else in that document could spuriously qualify once either guard came off. Dropping the
`studentId` lookup in `scoreCell()` (`:41-42`) is different in kind: it corrupts every student's cell
in ANY multi-student document, and WO-3.5's own 25-student grid is exactly that, so the same mutation
that proves case 15 also reddens four of WO-3.5's own checks — the ones that already ask
`weightedClassGrade()` for one named student's grade on a real, rendered screen. That is not case 15
measuring nothing; the check goes red on the mutation it names. It is that the argument is load-bearing
enough that this harness was already watching it, from a different section, through the real grid
rather than through a hand-built fixture — five red, not one, recorded as five rather than smoothed
into "the proof worked," because a mutation that reddens more than its own check is not the clean
isolation the other three gave and the honest count is worth more than a tidy one.

**598 at WO-2.24**, measured the same way: `598 checks · 598 passed · 0 failed · 0 skipped`, 14,398
lines, 24.1 lines per check, 193s. Three call sites, three results, none of them in a loop — and they
are the first checks in this file to open the term editor, the days-off form and the student editor's
plan panel in order to read a computed *style* off a field rather than to drive it or measure its
box. Each asserts that the one
`input[type="date"]` reset in `src/shell.css`'s BASE section is live as a computed `appearance` on the
date fields that have no copy of that rule of their own: the term editor's *Starts* and *Ends*, the
days-off *From* and *To*, and the plan *Review date*. WO-3.17's pair keep an identical declaration in
`src/assignments.css` on purpose, so they were the only date fields anything here had ever read a
*style* off — which meant the shared rule could be deleted as a duplicate and all 595 checks stayed
green. Three things about them are worth knowing.

**They read a computed style and not a height, and this is where that stopped being an argument.**
The defect the rule fixes is a squat field on iOS, so a height is the obvious thing to measure — and
these fields have in fact been measured for 44px since WO-2.21, when the coarse sweep started opening
these three dialogs; two of those three check messages say *"date fields included"* in as many words.
It makes no difference, because the measurement cannot fail for this: the engine applies an author's
`min-height` to a date input whether or not anything has told WebKit to stop painting the control. On
the deleted-rule run those three sweeps were **green** — `measured 22 · 13 · 18; under = []` — in the
same run where the three checks below went red. `appearance` is the value that moves, `none` with the
rule in the cascade and `auto` without it, so it is what the guard hangs on. Nothing here claims the
field is the right size on glass; that stays a 👤 line in `TESTING.md` § WO-2.23 forever, and the
shared reader prints no box dimensions at all, so that a number in a detail line cannot quietly
become part of the claim.

**Being open is asserted rather than arranged for.** All five of those
fields sit inside `.hidden` dialogs at rest and `getComputedStyle` answers just as happily for a
`display: none` node, so each call carries its caller's own evidence that the surface is up — the
modal's `hidden` class for two of them, and `hidden` false with `aria-expanded` true for the support
panel — plus the element laying out a client rect and matching the expected field count. A selector
that stopped matching is a `FAIL` and never a vacuous `every()` over an empty list. The reader never
touches `.value` either: one of the three fields is the plan review date, and no detail line out of
`tools/` may carry what a teacher typed into it.

**The guard was watched failing before it was written down.** Deleting the rule from `src/shell.css`
and re-running turns exactly these three red and nothing else — `598 checks · 595 passed · 3 failed`,
exit 1, each detail reading `appearance auto, -webkit-appearance auto` and naming the sheet the rule
belongs in. The 595 that stayed green are the reason the work order existed. Tabulated in
`TESTING.md` § WO-2.24; the rule was restored and `git diff -- src/` is empty.

**628 at WO-3.7**, measured the same way: `628 checks · 628 passed · 0 failed · 0 skipped`, 15,480
lines, 24.6 lines per check, 207s — thirty call sites, thirty results, of which twenty-eight landed
on the first pass (`626 checks · 626 passed`, 15,311 lines, 205s) and two on the correction round
below. **The gap did not move — which is the WO-2.6 coincidence happening a second time** rather than
anything new: the section carries one fixture-guard failure arm a green run never reaches (`if
(!plant.ok) check('the WO-3.7 fixture is real…')`) and one call site inside the two-pass
presentation-mode loop that fires twice, so the two corrections cancel exactly. Worth knowing before
the next reader reads a gap of 1 as a harness that has become tidier.

**Two of those twenty-eight could not be made from a stylesheet review, and one of them is why.** The
printed sheet is measured by **stubbing `window.print()` and taking the snapshot inside the stub**,
under `Emulation.setEmulatedMedia: 'print'` — so the reading happens at the instant the app asks to
print, with no race against the 500ms attribute release. It reads **box heights as well as computed
`display`**, and that distinction is load-bearing: the computed display of an element inside a
`display: none` ancestor is its own value, not `none`, so asking the nav strip for its `display`
reports `flex` on a build that is behaving perfectly. What it does not have is a box. The stub also
**reports that it took**, because a `window.print` that was not writable would produce no snapshot at
all and the check would read *"the printed page is missing its header"* over a build whose printed
page is perfect.

**And that guard earned itself on the first correction round.** The Print button reached
`printDetail()` — `{"ok":true,"label":"🖨 Print this page"}` — and `printCalls` was still 0, because
the page threw `Cannot access 'detail' before initialization`: `src/shell.js` imports
`src/detail.js` as `detail`, and a `const detail = e.target.closest(…)` further down the *same*
delegated click listener put the whole arrow body inside that local's temporal dead zone. The two
hooks 100 lines above it threw before they could run. Without the `attrRightAfter` / `printCalls`
fork in the detail line, that reads as a CSS defect in a print block that is correct. The local was
renamed; the module keeps the name.

**And then the print pass was found measuring a width no printer has, which is trap 10 below and the
reason two more checks exist.** Everything above snapshots the sheet at the 1280px the section's own
`setDeviceMetricsOverride` set; `setEmulatedMedia: 'print'` switches the media *type* and relayouts
nothing, so every `max-width` query in the app was still resolving against 1280 while the sheet was
being read. A page box is narrower than that — Letter at `@page { margin: 10mm }` is about 740 CSS px,
landscape Letter about 981, A4 about 718 — and all three fall inside `src/detail.css`'s
`@media (max-width: 1024px)`, which drops the detail screen to one column. It shipped that way: the
gated print block set `gap` on `.detail-cols` and never restated `grid-template-columns`, so the
responsive rule won on paper and the sheet printed as one column under an acceptance line that says
one page. **Twenty-eight green checks said nothing about it**, because 1280 is the one width band in
which the stylesheet still looked like the design. The WO-3.7 verifier found it by rendering to PDF.
The two checks added on the correction round re-drive the real Print button at 740px and (a) assert
the grid still resolves to two tracks side by side **with `matchMedia('(max-width: 1024px)')` asserted
matching**, so a metrics override that silently failed cannot pass the check at 1280 for the wrong
reason, and (b) sweep every `max-width` rule in the app against the elements of the sheet and require
each declared property to be restated by a gated `body[data-detail-print]` rule — the general form of
the same defect. Watched failing before being written down: with the one line reverted the run is
`628 checks · 626 passed · 2 failed`, exit 1, the first reading `grid tracks ["740px"] over 2
column(s), side by side = false` and the second naming
`@media (max-width: 1024px) { .detail-cols { grid-template-columns } } unpinned on div.detail-cols`.
Everything else stayed green in that run, which is the escape restated as a measurement.

**636 at WO-1.15**, measured the same way: `636 checks · 636 passed · 0 failed · 0 skipped`, 15,750
lines, 24.8 lines per check, 206s. Eight call sites, eight results, and **all eight are inside the
existing `backup & restore` section rather than in a new one at the foot of the file** — that work
order said so in as many words, and it is the right call: everything they need is already standing up
there (a document with support data on it, a real backup file of it, the confirm driven through
`restoreFromText()`), and a second section would have rebuilt all of it two hundred lines later. Four
things about them are worth knowing.

**The fixture is the whole argument, and it is built by ADDING to the file rather than by writing a
second document.** `describe()` used to count `classes` and `students` and nothing else, so a term of
marks and an empty test document drew an identical panel — the pair `plans/work-orders/gates.md`
§ "The iPad stays in the rotation" exists to keep apart. A check written against a fixture whose
rosters *also* differed would go green against that build. So the planted document IS the run's own
backup file with a record dropped into it: same class, same two students, by construction rather than
by two lists somebody kept in step, and the first of the eight asserts exactly that before any of the
others reads a number.

**The record is planted straight into IndexedDB, because the surface under test is the disk.** The
compare's outgoing side is `readStoredDocument()` — a raw get that does not open the year and does not
migrate (`src/backup.js`) — so `s.update()` would have been measuring the wrong document. It is lifted
out first and put back byte for byte at the end, the poisoned-year fixture's own shape, and the
put-back is asserted rather than assumed: everything after this section reads that year, and one check
in it compares the record on disk against the file byte for byte in content.

**Three of the five files it feeds through the dialog must produce NO warning, and those three carry
the Traps line.** Replacing a year from its own backup is what backups are for, so an equal file, a
file holding *more* than the device, and a file for a year the device does not hold are each asserted
silent — a red panel on the safe case is one a teacher learns to tap through before she meets the case
that can destroy a term. The two that must warn are a zero-record file (the acceptance line's own
case) and a file holding *some* of the term, and the second exists for one reason: against a
zero-record file, a sentence naming the difference and a sentence reprinting the count on this device
are the same string. 1/1/1/1 against 3/3/2/3 is the only fixture that can tell them apart.

**And the counter's three deliberate exclusions are all in one four-record fixture**, which is what
makes `3 recorded meetings · 3 attendance marks · 2 assignments · 3 scores` a claim rather than a
number: one record carries `exception: 'dropped'` (not a meeting), one mark cell carries `U` (not a
mark — nobody has looked at that student yet), and `scores` is an object keyed by assignment then
student, which `count()` answers **0** for. A naive counter reads 4/4/2/0 on that document, and every
one of those three errors is in the direction that reports a full gradebook as nothing at stake. Five
mutations, all reverted and tabulated in `TESTING.md` § WO-1.15.

**658 at WO-3.9**, measured the same way: `658 checks · 658 passed · 0 failed · 0 skipped`, 16,628
lines, 25.3 lines per check, 205s. Twenty-two call sites in a new section at the foot of the file,
twenty-two results, and none anywhere else. Four things about them are worth knowing.

**WO-3.21 lands no call site at all — the mutation proved the existing checks already carry the
case, so the third deliverable's "add one only if it does not" resolved to adding nothing.**
`groupsFor()` counts students, not rows (`src/accommodation-prompt.js:186`'s `seen` Set), and the
WO-3.8 fixture never gave one student two rows of the same kind to prove that dedupe does anything —
measured at that work order's own verification: delete the `seen` Set and all 710 checks stay green.
The only change here is to the fixture itself: `wo38-s1` Ashdown (`tools/verify-shell.mjs:17574`) now
carries a second `extended-time` row scoped `['unit tests']` beside the original scoped `['tests']` —
both rows real, both matching Tests (`wo38-s3` Corvane already proves `['unit tests']` fires), so
`isRealRow()` is not why the dedupe was never exercised. `tools/README.md:783`'s 713 call sites and
the 710 executed results beside it are both unchanged by this work order — nothing here is a new
`check(`.

**Before, unmutated, with the new fixture in place**: `710 checks · 710 passed · 0 failed · 0
skipped`, 18,135 lines, 25.5 lines per check, 227s. The sentence still reads *"3 students have
extended time, 2 need a separate setting."* and the reveal still lists five names with Ashdown named
once — Acceptance lines 1 and 2, unmoved by the second row.

**During, with the `seen` Set deleted** (`const seen = new Set();` and its two call sites at
`:190-191`): `710 checks · 705 passed · 5 failed · 0 skipped`, exit 1. Five of WO-3.8's own checks go
red and nothing else moves — every one of them a moment that reads the sentence or the reveal, not a
new assertion:

| Check | Failure detail |
|---|---|
| *"creating a test surfaces the counts … 3 students have extended time, 2 need a separate setting."* | category = "Tests — 60%", prompt says "4 students have extended time, 2 need a separate setting.", host hidden = false |
| *"one deliberate tap puts the five names on screen …"* | 6 chip(s): `["Ashdown, Wo38","Ashdown, Wo38","Braemore, Wo38","Corvane, Wo38","Dunmarrow, Wo38","Everleigh, Wo38"]` |
| *"and back to Tests recomputes the same sentence …"* | says "4 students have extended time, 2 need a separate setting.", aria-expanded = false, name chips = 0 |
| *"in presentation mode nothing appears at all …"* | names showing before the flip = 6; after: hidden = true, display = none, host text = "", reveal hooks = 0, kind phrases left on the page = [], names left in the dialog = [] |
| *"flipping presentation mode back off brings the same counts back …"* | says "4 students have extended time, 2 need a separate setting.", reveal hooks = 1, aria-expanded = false, name chips = 0 |

**Five red, not one and not seven-hundred-ten — the middle ground the work order's own Traps line
asks for.** Nothing had reddened means the fixture proves nothing; everything reddening means the
fixture is coupled to something it should not be. Five is exactly WO-3.8's own checks that read the
sentence or the reveal across the four moments it is asked for it — first paint, the round trip back
from Homework, and both edges of the presentation-mode flip — and nothing in attendance, categories,
backup or any other section moved. Reverted with `git checkout -- src/accommodation-prompt.js`;
`git hash-object src/accommodation-prompt.js` = `git rev-parse HEAD:src/accommodation-prompt.js` =
`30a6ef4b9cd4…`, and `git diff --stat src/` is empty.

**The fixture is built to fail a build that got the order right by accident**, because the whole of
this work order is an ORDER and an order is the easiest thing in the world to assert against itself.
The roster is stored in a third order — neither the answer nor its reverse — so a sheet that printed
what it was handed lands somewhere the check names; the ten assignments are stored out of due-date
order, two of them share a due date and one has none at all, which is the three cases the column rule
is made of. Proved rather than argued: `sheetOrder()` returning the list untouched turns **three**
checks red, and resolving the roster in stored order instead of through `src/scores.js`'s
`gridOrder()` turns **three** red.

**The sheet is compared to the SCREEN as well as to the arithmetic.** "Percentages and letters on the
printout match the app exactly" is a claim about two surfaces, so the check reads the score grid's own
`.scores-grade-num` and `.scores-grade-letter` for the same three students before the dialog is
opened, and asserts those, the engine's answers through the seam, and three hand-computed strings.
A sheet that agreed with itself and disagreed with the grid a teacher just came from is the failure the
work order names, and nothing that only read the sheet could see it.

**The CSV is compared to the printed page cell for cell, and that check cannot catch everything —
which is why the cell texts are also written down by hand.** Both surfaces take their strings from one
function in `src/grades-report.js`, deliberately, so a defect they SHARE keeps them in agreement:
making a blank print as `0` leaves the file/page comparison green and turns the hand-written cell
matrix red. The two checks are complementary rather than redundant, and the mutation is what
established that rather than a reading of the code.

**And the page box is read at 740px**, which is trap 10 obeyed rather than rediscovered: `.modal-panel`
is `width: 480px`, so without the restatement inside the gated block the whole grade sheet prints down
the left-hand third of the paper — and at the 1280px the rest of the section runs at, 480 of 1280
looks like a dialog rather than like a mistake. Three mutations, all reverted and tabulated in
`TESTING.md` § WO-3.9.

### Driving a browser over CDP — ten traps, all of which first look like app defects

Every one of these was hit and diagnosed twice, by two different agents, before it was written
down here. That is the entire reason this section exists.

1. **A modern `CSSStyleRule` has its own empty-but-truthy `.cssRules`** (CSS nesting). So the
   obvious rule walk — `if (r.cssRules) { walk(r.cssRules); continue; }` — treats every
   ordinary style rule as a container, recurses into nothing, and skips it. A 123-rule
   stylesheet reports 3, every selector search returns empty, and **nothing throws**. It reads
   as a clean pass. Process the rule, *then* recurse into children. `window.__eachRule` in
   `verify-shell.mjs` is the fixed version; use it rather than writing a second walker.
2. **Headless Chromium with no visible frame never advances a transition or a keyframe.**
   `getComputedStyle` and `getBoundingClientRect` return start-of-animation values, so
   `.modal-close` measures 42.24px — which is 44 × 0.96, the `srIn` keyframe's opening scale —
   and reads exactly like a failed touch target. Inject
   `*,*::before,*::after{transition:none!important;animation:none!important}` before measuring,
   and again after every reload.
3. **`Emulation.setEmulatedMedia`'s `features` list does not reach `pointer`.** It needs
   `setTouchEmulationEnabled` plus `mobile: true` device metrics. Get it wrong and you measure
   the desktop pass and report green — so **assert `matchMedia('(pointer: coarse)').matches`
   before trusting any measurement below it**.
4. **A fixed `--remote-debugging-port` collides** with a previous run that did not shut down
   cleanly, and the failure reads as "the app broke." Pass `--remote-debugging-port=0` and read
   the chosen port from `<user-data-dir>/DevToolsActivePort` (line 1 is the port, line 2 is the
   websocket path).
5. **A fixed sleep before a measurement is a race, and it hides defects rather than only causing
   flakes.** Wait on the condition — poll for the state you expect, with a timeout — and where the
   state can be transient, require it to *hold* for a beat. A single sample cannot tell a finished
   operation from the gap between two attempts.

   The forced-save-failure check slept `setTimeout(150)` and then read the chip. It failed
   intermittently on a green build, was investigated once, and was written off as "a flaky check,
   not a store defect." That was half right. Replacing the sleep with a poll made it fail
   *consistently*, which is how the actual behavior surfaced: a stale max-wait timer restarts a
   permanently-failed write about five seconds later, and `MAX_WAIT_MS` is 5000, so the first
   poll deadline landed exactly on it. The 150 ms sleep had been sampling before the defect
   became visible.

   This is the same shape as the four traps above — a check that reports green while measuring
   nothing — except that here the check was *believed* to be the broken part, which bought the
   underlying behavior another round of not being looked at.
6. **`Page.reload` does not wait for a debounced write, and the loss reads as a store defect.**
   Every save in `src/store.js` is debounced, so an edit made a moment before a reload is still
   sitting on a timer when the page goes away — and the document that comes back is the one from
   before the edit. What that looks like from the check is "the class I just created did not
   persist", which is a persistence bug in every respect except being one.

   It cost three runs at WO-1.6 to see, because the shape is so convincing: the write path is
   exactly what is under test, so the first suspect is the code the check was written for. Call
   `await window.planbook.store.flush()` before **every** reload — `verify-shell.mjs` does, at each
   of its reload points — and treat an unflushed reload as a defect in the check rather than a
   timing quirk to retry.

   Note the difference from trap 5: sleeping longer would in fact fix this one, which is what makes
   it dangerous. A sleep that is long enough today is a race that fails on a slower machine, and the
   flush is a fact rather than a bet.
7. **The pointer stays where you last clicked, so `getComputedStyle` reads a `:hover` rule.**
   `Input.dispatchMouseEvent` leaves the cursor at the release coordinates, and a check that
   measures the thing it just clicked measures it hovered. Every other element of the same class
   measures resting — so a comparison across several of them reports that one of them differs.

   Found at WO-1.8, by the check that compares the roster's support dots to each other to prove
   none of them encodes a plan type. It failed on its first run with two distinct colour sets, and
   the difference was real: the dot the harness had tapped a moment earlier was indigo, the other
   two were grey. That is *precisely* what a dot coded by plan would look like, which is what makes
   this worth a numbered entry — the artifact is indistinguishable from the defect the check exists
   for, so the answer is to park the pointer (`Input.dispatchMouseEvent` with `type: 'mouseMoved'`
   at a corner) rather than to drop the hover-sensitive properties from the comparison. Dropping
   them would have left the check measuring almost nothing, and it would have gone green.

8. **The browser can write into the page's `localStorage` too**, and the check that notices reads
   as "the app is storing student data under a key nobody declared." Two runs at WO-1.9 went red on
   `shopifySelectors` and `debug` — keys no line in this repo could have written, since
   `src/prefs.js` is the only door and it prefixes everything. Suspected to be Edge's, on a
   throwaway profile, on a page served from 127.0.0.1, appearing part-way through a 60-second run
   and never on a shorter probe of the same page.

   The first response dropped the assertion — the two localStorage checks stopped asserting
   *"every key here is ours"*, on the reasoning that a check going red about the environment
   cannot be made green by fixing the app. That was trap 5's shape but not its lesson: trap 7 is
   the actual precedent, and it says the opposite. Dropping a sensitive-feeling assertion because
   the harness looks unreliable leaves the check measuring almost nothing — it goes green whether
   or not a leak is present, same as trap 7's hover-sensitive properties would have. The fix
   belongs in the environment, not in the assertion: `--disable-extensions` and
   `--disable-component-extensions-with-background-pages` went on the launch line as the suspected
   source, and *that* is what makes the strict assertion trustworthy again. So the checks assert
   **every key present starts with `planbook_`**, kept alongside the half that was always about
   the app — every key and every value, ours or not, is searched for the fixture's own phrases,
   and a foreign key is printed rather than ignored, so a future red still shows what was in the
   store. If the strict assertion goes red again on a clean environment, that is real signal, not
   noise to route around a second time.

9. **A download check that diffs file NAMES reads a second run as a run that wrote nothing.** The
   backup file's name carries the year and the date, so tapping "Back up all 3 years" twice in one
   sitting writes the same three names — and whether the browser uniquifies them, overwrites them,
   or refuses a second burst of downloads from the same page is the browser's business. Found at
   WO-1.11: the check that proves an unreadable year is skipped ran the loop a second time and
   reported `0 file(s)` on a build whose status line, stamps and directory were all correct. Answer
   what "this run wrote it" means with a new name **or a moved mtime**, and keep the assertion on the
   file the app decided about — Chrome's own multiple-download blocking is the same class of behavior
   iPadOS is suspected of, and a check that requires the browser to cooperate twice is a check that
   goes red about the environment (trap 8).

   **It outlived the architecture that produced it.** That control now writes ONE zip file per tap
   rather than one .json per year, and the trap is unchanged: the archive's name carries the date
   too, so a second tap in the same sitting still writes the same name. What did get better is the
   second half — with one hand-off per tap, the browser only has to cooperate once, so the second
   run's check can assert what is *inside* the archive instead of narrowing itself to the one file
   the app decided about. Keep the mtime rule; the narrowing was a cost of the old shape.

10. **`Emulation.setEmulatedMedia: 'print'` changes the media TYPE and nothing else — the page is
    still laid out at the viewport width, so every `max-width` query answers about a window rather
    than about paper.** This is the one trap in the list that hides an app defect instead of
    imitating one: the harness looks perfect, the page it measured is not the page that comes out of
    the printer, and a green run says nothing about the difference. A page box is small — Letter at
    `@page { margin: 10mm }` is ≈740 CSS px, landscape Letter ≈981, A4 ≈718 — and this app's
    responsive blocks start at 1024, so a print snapshot taken at 1280 sits in the one band where a
    stylesheet with an unpinned responsive rule still looks right. It cost WO-3.7 a one-column sheet
    that twenty-eight green checks agreed was fine (see the WO-3.7 block above). **Set
    `setDeviceMetricsOverride` to the page box before you read a printed layout**, and then assert
    the narrow band actually MATCHES before believing what you measured — otherwise an override that
    quietly failed leaves you back at 1280, where the check passes for exactly the wrong reason
    (trap 3's rule, applied to width instead of pointer). Nothing in CDP relayouts at the page box
    on its own; `Page.printToPDF` renders one but hands back a PDF, which is bytes rather than a
    tree you can measure, so the width has to be set by hand.

### Two rules that follow from those

- **Guard every sweep against a vacuous pass.** Assert the walker saw a plausible number of
  rules, that the measurement found a plausible number of controls, that the emulated pointer
  really is coarse. An empty result set and a clean result set are the same value, and three of
  the four traps above produce an empty one silently.
- **A skip is announced, never silent.** When a fixture is missing — the WO-1.2 component shelf
  goes away at WO-1.10, and `window.planbook` with it — the check prints `SKIP` with a reason
  and is counted separately. A suite of 28 checks that quietly becomes a suite of 4 still
  prints green.
