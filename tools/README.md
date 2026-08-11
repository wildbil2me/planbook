# `tools/` — scripts, run by hand

| Script | What it does |
|---|---|
| `verify-shell.mjs` | Drives the real app in headless Edge/Chrome and **measures** what a stylesheet review can only assert. `node tools/verify-shell.mjs` |
| `make-icons.mjs` | Draws the home-screen icons and writes them as PNGs into `icons/`, using `node:zlib` and nothing else. `node tools/make-icons.mjs` |
| `make-cert.mjs` | Mints a local CA and a server certificate into `certs/`, so the LAN address is a secure context. `node tools/make-cert.mjs` |
| `serve-https.mjs` | Serves the repo over HTTPS for a device sitting, plus a plain-HTTP page that hands the iPad the CA. `node tools/serve-https.mjs` |
| `wo-sweep.mjs` | The verifier's standing sweep as greps — the checks a `grep` settles correctly, with their allowlists written down. `node tools/wo-sweep.mjs` |
| `wo-gate.mjs` | Work order gates, "what's next", claiming a work order for a dispatch, the maintenance ticks with a recomputed dashboard, and — since WO-2.15 — a read-only `--audit` of both trackers and a `--self-check` that plants its own violations. `node tools/wo-gate.mjs next` |
| `wo-brief.mjs` | Assembles the verbatim parts of a dispatch brief. `node tools/wo-brief.mjs WO-1.7 > .claude/dispatch/WO-1.7-brief.md` |
| `wo-cost.mjs` | What each dispatch cost, from the session transcripts. `node tools/wo-cost.mjs` |
| `codex-invoke.mjs` | The Codex exec-time probe and the real dispatch, one file so the `codex-resources\` `PATH` fix can't drift between copies. `node tools/codex-invoke.mjs --probe` / `--brief <path> --out <path>` |

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

**And the section never calls `printRecord()`.** `window.print()` in a headless browser prints
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

**`verify-shell.mjs` holds 592 `check()` call sites**, and that is the number `tools/wo-sweep.mjs`
asserts on every run — the sentence you are reading is the one it greps for, so rewording it turns the
sweep red rather than turning the check off. Its allowlist is written down at the check: the
definition at `tools/verify-shell.mjs:68` is not a call, the `else check(` at `:10773` is why the
pattern is not line-anchored, and comment lines are excluded because the harness quotes call names in
its prose constantly.

**Call sites and executed checks are permanently unequal, and the gap is not a list of things somebody
could go and name.** It is 592 − 591 = 1 on this tree, it was 589 − 582 = 7 before WO-2.21, and it was
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

**A cross-reference between the two harnesses is a claim, and it can be false.** `wo-sweep.mjs` is
**16 checks** since WO-2.19, and the three added at WO-3.2's follow-up exist because this file's sibling
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

### Driving a browser over CDP — nine traps, all of which first look like app defects

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

### Two rules that follow from those

- **Guard every sweep against a vacuous pass.** Assert the walker saw a plausible number of
  rules, that the measurement found a plausible number of controls, that the emulated pointer
  really is coarse. An empty result set and a clean result set are the same value, and three of
  the four traps above produce an empty one silently.
- **A skip is announced, never silent.** When a fixture is missing — the WO-1.2 component shelf
  goes away at WO-1.10, and `window.planbook` with it — the check prints `SKIP` with a reason
  and is counted separately. A suite of 28 checks that quietly becomes a suite of 4 still
  prints green.
