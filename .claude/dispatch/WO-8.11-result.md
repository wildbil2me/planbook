# WO-8.11 — the build line can name a version the screen is not running · implementation result

**Route** Claude (work-order-implementer) · **Reported** 2026-08-18
**Brief** `.claude/dispatch/WO-8.11-brief.md` · **Work order** `plans/work-orders/phase-8-packaging.md` § WO-8.11

---

## 1. The decision the work order left open: which route

**Taken: page-side only, `skipWaiting` kept** — the route the work order marks *Preferred*. The
reasoning is written at the point where the route is taken, in the comment block above
`HAD_CONTROLLER_AT_BOOT` in `src/shell.js` (§ *THE ROUTE*), not only here. Three reasons:

1. It changes **when a device gets a fix** in order to **report** a fact the page can already
   observe on its own. `controllerchange` is a window event; the page needs nothing from the worker,
   which is the same shape as the build line reading `caches.keys()` rather than postMessaging.
2. Dropping `skipWaiting` reaches straight for the update **policy** — auto-reload, prompt, defer —
   that this work order puts out of scope. A report is not a policy.
3. The standing comment at the foot of `sw.js` that suggests dropping `skipWaiting` is **conditional
   on something that has not happened yet**: it says to drop it when the first dynamic `import()` or
   lazily-fetched template arrives, because only then can an immediate takeover mix two versions
   inside one running app. Every shell module is still a static import resolved at boot, so the
   boot-time guarantee holds and the honest change is to say what the window *is*, not to change
   what the worker *does*.

**`sw.js` was edited, in one respect only: `CACHE` `planbook-shell-v76` → `v77`.** This is not the
edit WO-8.10's trap forbids (the *logic*, and the fact being reported); it is the bump that
`CLAUDE.md` and `sw.js`'s own header require of **every** change to a file in `SHELL`, and
`src/shell.js` is in `SHELL`. Without it no installed device sees this work at all, which is the
WO-2.4 / WO-2.13 scar `wo-sweep.mjs` §9 exists to catch. WO-8.10 chose to leave its own bump to the
landing commit; I made it here instead, so the sweep is green now rather than green-once-committed.
Flagging it because a verifier reading *"it edits no `sw.js`"* will see a one-line `sw.js` diff.

### A second decision the work order did not settle: does staleness take the amber?

The brief asked for this explicitly. **Yes — the stale line wears the same caution palette as the
more-than-one line**, and WO-8.10's comment (*"the caution palette has to mean exactly one thing,
and that thing is more than one stored copy"*) has been rewritten rather than quietly contradicted.
The palette still means exactly one thing; what changed is that the one thing is now a **sentence**
instead of a **count**: *you may be looking at an old Planbook, and quitting it from the app switcher
is the fix.* Two states arrive there — an update that did not finish, and an update that finished
after the window was drawn — and the teacher's next move is identical in both. The three states that
stay grey are the ones that ask nothing of her (two cannot answer at all; the third settles itself).
The alternative, a third grey treatment, puts the one answer a teacher is diagnosing *for* into the
same grey as the four sentences of prose above it in the modal.

Two placement decisions that follow, both argued in the comment above `paintBuildLine()`:

- **The stale reading is asked only inside the one-cache branch.** Not in the more-than-one branch:
  that line already prescribes the same action and names the worse fault (`activate` did not
  finish), and a caveat bolted onto it would make the amber say two things at once while making the
  longest line here longer.
- **Not in the three grey states either.** The action this state names — *"quit Planbook from the
  app switcher"* — presupposes an installed app on a device holding its shell, which is precisely
  what those three say is not the case.

---

## 2. Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\shell.js` | `HAD_CONTROLLER_AT_BOOT` + the `controllerchange` listener above the registration; the sixth state inside `paintBuildLine()`'s one-cache branch; the five-states/amber comment rewritten to six. +84 lines. |
| `c:\dev\planbook\sw.js` | `CACHE` `planbook-shell-v76` → `planbook-shell-v77`. One line, nothing else. |
| `c:\dev\planbook\tools\verify-shell.mjs` | New section `--- the screen can be older than the worker serving it (WO-8.11) ---`, twelve checks, immediately under WO-8.10's. |
| `c:\dev\planbook\tools\README.md` | Call-site count 892 → 904 (the sentence `wo-sweep.mjs` §11 greps), and the history entry beside it with the executed count from a run. |
| `c:\dev\planbook\TESTING.md` | New § WO-8.11: the two lines a teacher sees, the route, the widened amber, the Acceptance evidence, both mutation tables, and what the desk cannot pay off. |
| `c:\dev\planbook\plans\work-orders\phase-8-packaging.md` | Acceptance 1–4 ticked. **Status left at 🤖 CLAIMED** — flipping it to ✅ DONE is the verifier's call, not mine. |

`index.html` is **unchanged**: `<p class="build-caches" id="buildCaches">` stays empty in the markup,
which the comment above it requires, and nothing about this state is expressible as markup.
No CSS changed — the amber is the existing `.warn` rule. No new control, so nothing is owed to the
`@media (pointer: coarse)` block (`wo-sweep.mjs` confirms: *"no new CSS selectors — 0 added line(s)
in tracked `src/*.css`"*). No `localStorage`, no new data, nothing sensitive anywhere near it.

---

## 3. Verification — both commands, run to completion, output quoted

### `node tools/verify-shell.mjs` — green, on the delivered tree

```
================ SUMMARY ================
926 checks · 926 passed · 0 failed · 0 skipped
24,754 lines · 26.7 lines per check · 295s
```
`EXIT=0`. That is the third of three full runs; the first two are named below because one of them
was red and the red was mine, not the app's.

All twelve new checks, verbatim from that run's section:

```
--- the screen can be older than the worker serving it (WO-8.11) ---
PASS | this page booted CONTROLLED by ./sw.js — … :: controller at document start = "http://127.0.0.1:<port>/sw.js", controllerchange events since = 0
PASS | and the line it reads is WO-8.10's sentence to the character, … :: line = "Running from planbook-shell-v77 — one stored copy on this device, which is what it should be.", expected = (identical), class = "build-caches"
PASS | a second worker really did take this loaded page over … :: controllerchange events = 1, controller = "http://127.0.0.1:<port>/sw.js?wo811=1"
PASS | the build line now SAYS the screen is older than what is stored, … :: "older than" at 17, planbook-shell-v77 at 138, names = ["planbook-shell-v77"]
PASS | and it names the action that actually clears it — quitting from the app switcher …
PASS | the refresh a teacher would try first is named AND refused in the same breath … :: the sentence carrying "refresh" = "Quit Planbook from the app switcher and open it again — pulling down to refresh does not clear this."
PASS | and it wears the same caution amber the more-than-one line wears … :: class = "build-caches warn", background = rgb(255, 248, 230), color = rgb(138, 109, 26)
PASS | with every worker unregistered and the page reloaded, this document booted with NO controller at all … :: registrations unregistered = 1, controller at document start = null
PASS | the app re-registered ./sw.js and that worker CLAIMED this page … :: controllerchange events = 1, controller = "http://127.0.0.1:<port>/sw.js"
PASS | and the line stays WO-8.10's quiet sentence: a first install is read as healthy … :: line = "Running from planbook-shell-v77 — one stored copy…", class = "build-caches"
PASS | the launch after the update is quiet again … :: controller at document start = ".../sw.js", controllerchange events since = 0
PASS | this section handed the device back as it found it … :: caches.keys() = ["planbook-shell-v77"], found at the top = ["planbook-shell-v77"], active worker = ".../sw.js"
```

**The one red on the way in was mine and is worth recording.** Run 1 read
`926 checks · 925 passed · 1 failed`, and the failure was the first-load precondition asserting that
no `controllerchange` had fired **yet** on the fresh document — `controller at document start = null,
controllerchange events since = 1`, on an app behaving exactly correctly. That is `tools/README.md`
trap 5 in its plainest form: a measurement racing an event. The clause came out (the count that
matters is asserted by the check below it), and the reason is written at the check. It is also
written into `tools/README.md`'s new history entry, because the next person to instrument a worker
will hit it.

### `node tools/wo-sweep.mjs` — green

```
22 checks · 20 passed · 0 failed · 2 to review
```
`EXIT=0`. The two REVIEWs are the standing pair (sensitive field names outside `src/backup.js`;
due-date and late/missing on the same line) and are unchanged by this work order — it adds no
sensitive field name and reads no date. Two sweep checks are worth naming because this work order
moved them: *"every SHELL file change is paired with a CACHE bump"* now reads **"planbook-shell-v77
is not in any commit yet — the bump is uncommitted, which is the rule being followed"**, and the
call-site count matches at **904**.

### Two mutation runs, both reverted

Both on the same tree the green run was measured on; `git diff -- src/shell.js` carries no trace of
either.

| Mutation | Result |
|---|---|
| the flag is set on **every** `controllerchange`, ignoring the boot reading — the exact Traps mistake | **1 red** of 926: the first-ever-load reading, detail line *"⚠ This screen is older than the copy of Planbook stored on this device…"* on a page whose `controller at document start` was `null`. All four stale readings stay green — the feature works perfectly and shouts at every new install, which is precisely what Acceptance 3 is guarding |
| the flag is never set — i.e. WO-8.10 exactly as shipped, the build this work order replaces | **4 red** of 926: *"older than" at -1*, the app-switcher clause absent, *the sentence carrying "refresh" = ""*, and `background = rgba(0, 0, 0, 0)` |

---

## 4. The Acceptance list, one by one

**1. `[x]` With a document loaded from cache A and a worker that has since activated cache B, the
build line says the screen is stale and names the action that fixes it. Driven, not reasoned.**
*Driven.* The takeover is produced by a **real** worker, not a `dispatchEvent`: the harness registers
a second script at the same scope (`./sw.js?wo811=1` — the same bytes, since the harness's server
strips the query), which is a real Update job, so `sw.js`'s own `skipWaiting` + `clients.claim`
deliver a `controllerchange` from the browser to a page that is already up. A synthesised event would
have proved that the app's listener runs when the harness calls it, not that the browser ever calls
it. Read after the takeover: the amber sentence, *"older than"* at position 17 and the cache name at
138 (the claim before the version — WO-8.10's own position comparison, in this block's shape), the
app-switcher action present, and the pull-to-refresh named **and** refused in the same sentence.
*Reasoned, not driven, and I want it on the record:* the two workers are the **same bytes**, so what
is proved is that a replacement is detected and reported — not that the markup on screen differs
from what the new worker would serve. That needs two deploys of two different trees onto one device,
which is the 👤 line.

**2. `[x]` In the healthy case the line is exactly what WO-8.10 ships today, with nothing added.**
*Driven.* Compared against the sentence **typed out in `verify-shell.mjs`** rather than read back out
of `src/shell.js` — a claim of unchangedness cannot be checked against the code it is a claim about.
String equality, not a substring, read three times in the section (before the takeover, on the
first-ever load, and on the launch after the update) and equal every time, with no `warn` class. The
code path is also literally untouched: the stale branch returns before it, and the WO-8.10 call below
is the same three lines it always was.

**3. `[x]` The first-ever load is read as healthy and not as staleness.**
*Driven end to end.* Every registration unregistered, the page reloaded, and the boot probe —
installed through `Page.addScriptToEvaluateOnNewDocument`, so it runs before any page script and
cannot lose the race — reading `controller at document start = null`. `src/shell.js` then
re-registers `./sw.js`, that worker claims the page, and **the `controllerchange` is asserted to have
fired** before the line is read, because a quiet line on a page where the event never arrived would
prove nothing at all. The line is WO-8.10's sentence with no amber. The mutation above is the other
half of this: keying off the event alone turns exactly this check red and nothing else.

**4. `[x]` `verify-shell.mjs` covers both states and hands Cache Storage back as it found it.**
*Driven.* Twelve checks in a new section directly under WO-8.10's. The `finally` removes the boot
probe from the browser and unregisters any `?wo811` registration on every path including a throw, and
the closing check asserts Cache Storage is the same one-entry list the section found **and** that the
page is controlled by `./sw.js` again — this section borrows the worker as well as the storage, so it
hands both back. Measured: `caches.keys() = ["planbook-shell-v77"]`, identical to the reading at the
top of the section, `active worker = ".../sw.js"`.

**5. `[ ]` 👤 On the installed iPad: deploy, launch once without force-quitting, confirm the app says
the screen is stale.**
**Not run, not ticked.** It needs a real installed app on real hardware after a real deploy and I
have neither. `TESTING.md` § WO-8.11 carries the sequence and what to expect at each step, including
that a pull-to-refresh is not a substitute for the force-quit. Nothing in this dispatch closes it,
and the green harness does not either — `verify-shell.mjs` *reloads* where a teacher *force-quits*,
and a reload is a new document from the current controller rather than iOS discarding a suspended
app. The two are the same thing as far as this feature's logic is concerned; they are not the same
event on the device.

---

## 5. Deliberately not done

- **No `CHANGELOG.md` entry.** Draft below; the teacher decides what a change means.
- **Status left at 🤖 CLAIMED** in `plans/work-orders/phase-8-packaging.md`. The verifier flips it.
- **No commit, no push.** The brief did not ask for one. Note that `wo-sweep.mjs` §9 currently passes
  on *"planbook-shell-v77 is not in any commit yet"*; once this lands the bump is in history and the
  check re-anchors to it, which is the rule working as designed.
- **Nothing outside the About modal.** No banner, no toast, no boot-time notice, no reload button —
  all of that is the update *policy* the Out-of-scope line reserves.
- **No third harness.** Everything new is in `verify-shell.mjs`'s existing shape.
- **`sw.js`'s standing comment at the foot was left exactly as written.** It frames a decision that
  is still open (drop `skipWaiting` when the first dynamic import arrives); this work order did not
  resolve that condition, so editing the comment would have made it look resolved.

### Temptations declined, named here rather than acted on

1. **Reporting staleness in the two "cannot answer" states.** Staleness is knowable without Cache
   Storage — the controller changed, and that is a page fact. It would have been more *complete* to
   say so when `window.caches` is absent or rejecting. Declined: those two states arise on a
   non-secure origin or in a private window, where there is no installed app to quit from an app
   switcher, so the only action the sentence can name is one the reader cannot take.
2. **Saying which version the screen was built from.** The page cannot know it — nothing records the
   cache the document came out of — and manufacturing one would need a constant in the served tree,
   which is WO-8.10's Traps line and a static check in the harness. The line names one version, the
   stored one, and describes the other as *"the copy before it"*.
3. **Asserting the harness summary against `tools/README.md`.** Tempting while updating two numbers
   by hand; `tools/README.md` records WO-2.22 refusing it, with reasons. Left alone.

### Proposed follow-up work orders (not booked, not acted on)

- **A `controllerchange` that arrives while the About modal is already open leaves the line stale on
  screen until it is reopened.** `paintBuildLine()` runs at open time by design (WO-8.10's argument:
  a modal that opens and then fills in flickers), and the window in which this matters is a few
  seconds wide. Worth a sentence in whichever work order next touches that modal; not worth a repaint
  path on its own.
- **The one thing neither tool can check:** that the markup on screen after a real takeover actually
  *differs* from what the new worker serves. Both workers in the harness are the same bytes. A check
  that could tell would need two trees deployed to one device, which is hardware, not a harness — so
  it belongs on the 👤 line rather than in a script, and that is where I have left it.

---

## 6. Draft `CHANGELOG.md` entry — for the teacher to accept, rewrite or bin

> **The About screen now admits when you are looking at an old Planbook.** After an update lands
> while the app is open, the screen in front of you was drawn from the copy that came before it —
> every pixel of it — even though the new copy is already stored on the device. The build line used
> to report the stored copy and be perfectly, uselessly right. It now says the screen is out of date
> and tells you the one thing that clears it: quit Planbook from the app switcher and open it again.
> Pulling down to refresh does not do it, and the line says so. Every other launch, which is almost
> all of them, reads exactly as it did before — including the first one after you install, which is
> not an update and does not get warned about.

---

*Reported honestly rather than favorably: line 5 is blank, and §4 says which parts of lines 1–4 I
drove and which I reasoned.*
