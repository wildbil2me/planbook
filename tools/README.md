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
                                       and ROADMAP.md's dashboard against its own box counts
node tools/wo-gate.mjs --self-check    plant every violation this script is supposed to catch, in a
                                       temp copy of plans/, and fail if one stops being caught
```

`--self-check` copies `plans/` to a temp directory, writes a **synthetic** work order into the copy,
plants nine violations against it, runs the script over the copy, and deletes the directory on both
exit paths. Two things about it are load-bearing. **Every plant path goes through a guard that
refuses anything inside the repository** — WO-2.15 was itself `🔨 IN PROGRESS` while it was being
written, so a plant that escaped would have corrupted a live work order and looked hand-written
afterwards. And **the fixture is synthetic on purpose**: WO-2.15's own acceptance list had to be
re-cut twice because it named real work orders as fixtures and both were spent within the week.
`--against <path>` runs the plants over a *different* copy of the script, which is how each plant is
proved able to fail — `git show 7973a42:tools/wo-gate.mjs` into a temp file and seven of the nine go
red. **A green run is not coverage**, and the run says so in its own output.

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

Update this line when you add checks — a stale count here reads as "the harness has not been touched since
WO-1.3", which is the opposite of true and makes a green run look smaller than it is.

*(This line said 79 for WO-1.5 and the real number was 82: the three checks added with the per-year
backup fix on 2026-08-04 never reached it. Measured, not guessed — `git stash` and a run on the
WO-1.5 tree. A count that is nearly right is the same problem as a stale one, so it is worth the
thirty seconds.)*

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
