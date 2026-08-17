# WO-2.46 — three readings in the pass block sit behind waits that do not assert them · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.46-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude, at Opus**, on its own merits: two of its four
Deliverables are decisions that must be *stated in writing at the code* rather than merely made
(the `waitForPassAlert()` shape — "an unstated choice is not" acceptable — and the fourth-site
answer), a third asks you to articulate what a check meant before versus after, and the Traps
section is judgment rather than mechanics ("do not fold the interval poll and the escalation wait
into one loop **unless you can say why** the interval check still means what its comment says").
The runner-up set aside was **Codex** — mutate · run · revert against a fully written spec reads
Codex-shaped, and the sibling rows WO-2.42 and WO-2.37 sit in that column — but the Acceptance here
demands **five** full `verify-shell.mjs` runs (two at the 3000ms defer, one at 30000ms, two clean)
at a measured ~4.3 min each, **~21.5 minutes against the hard 20-minute `INVOKE_TIMEOUT_MS`**, so
`--budget` refuses the dispatch outright. Per `ROUTING.md` § "Which Claude" the Claude column is
read first, which is why this is Opus and not a Sonnet budget-fallback.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.46 — three readings in the pass block sit behind waits that do not assert them

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** S · **Depends on** WO-2.42 · **Blocks** nothing
**Closes roadmap** *(no box. Harness, not app — the same call WO-2.42 made.)*

**Not a go-live blocker, and none of the three has ever been seen red.** Booked 2026-08-17 out of
WO-2.42's sibling audit, which was a deliverable of that row and turned up three sites its own
**Out of scope** line forbade it to touch. **The claim here is structural, not observed** — which is
the honest version of WO-2.42's own history, since that helper was also correct-looking for weeks and
then reddened a green tree one run in three.

**Why it exists.** WO-2.42 fixed one wait and wrote the rule the fix implies into `tools/README.md`
trap 5: *"wait on the condition the check asserts, and return what you tested. A wait that exits on a
proxy for the real thing is a sleep with extra steps."* Three readings in the same block still break
it. The mechanism is unchanged and is the whole reason any of this is a race rather than an ordering
nobody can observe: `paintPassElapsed()` marks the record **synchronously**, `announce()` in
`src/live-region.js` **defers its `textContent` write by 30ms** so a repeated message reaches
assistive tech as a change, and a CDP round-trip can land between the two tasks.

| The site | What it waits on | What the check asserts |
|---|---|---|
| `const said41 = await heard();` | the tick poll above it exits when the **elapsed figure changes** | `alerted === 2`, the card at level 2, **and** the 41-minute sentence |
| `const saidFive = await heard();` | a fixed `setTimeout(250)` after `wakeUp()` | `alerted === 1`, the card at level 1, **and** the five-minute sentence |
| `const saidTen = await heard();` | a fixed `setTimeout(250)` after `wakeUp()` | `alerted === 2`, the card at level 2, **and** the ten-minute sentence |

*(All three are in `tools/verify-shell.mjs`. Find them by the text in the first column — one hit each.
On the tree that booked this they were at `:11355`, `:11535` and `:11554`, with their checks at
`:11357`, `:11536` and `:11555`; the numbers are recorded because a reader can check them today and
will not be able to tomorrow.)*

**`said41` is the closest analogue to the bug WO-2.42 fixed, and it is worse in one way.** The poll
exits on the elapsed figure moving — which is exactly the claim of the check directly beneath it,
*"the figure moves on its own… the interval is running"*, and that check is **right**. What rides the
same loop is the next one: the escalation reads `alerted === 2` off `ticked`, the loop's own exit
sample, while the sentence is a **later, separate** `heard()`. So the two halves of one check come
from two different samples, and neither of them is the thing the loop exited on. The figure moving is
a proxy for the escalation, and the escalation and its announcement are the two-task pair again.

**The other two are trap 5 in its original clothes** — a fixed sleep before a measurement — with a
220ms margin over a 30ms defer. Wide today on this machine. The margin is the whole defence, and a
margin is what trap 5 says is not one.

**Why it is worth a row rather than a fix-on-touch.** These three are the *last* readings in this
file that WO-2.42's audit could not reach, they are all in the block that has already produced two
work orders (WO-2.30, WO-2.42), and the failure they would produce is the one this project has
decided it will not accept twice: a check that reddens rarely, trains its readers to re-run, and
discounts the next real regression in the same block before anyone reads it.

**Deliverables**
- **All three exit on the condition their check asserts**, on the **same pair of samples**, handing
  that pair back — WO-2.42's shape, applied three more times. The two fixed sleeps are **removed**,
  not lengthened.
- **A decision on `waitForPassAlert()`, made and written at the code.** It hardcodes `alerted === 1`
  and two of these three want 2. Either give it the level as an argument beside the pattern it already
  takes, or write a second local wait and say why one helper should not serve both. Either is
  acceptable; an unstated choice is not.
- **`said41`'s interval check keeps its exact meaning.** It is *"the only check here that watches the
  TIMER rather than the arithmetic"* by its own comment, and it is the one that goes red if the
  interval is never started. Say — in the work, not only in the report — what it asserted before and
  what it asserts after, and if those differ the row has broken the thing it was protecting.
- **A sentence on the fourth site in the same fixture**: the `setTimeout(250)` after `wakeUp()` that
  feeds `cardAwake`, whose check reads the card's figure, sentinel and note field and **no
  announcement at all**. Fixed or deliberately left, said out loud either way — the same deliverable
  WO-2.42 was given, and the reason this row exists is that WO-2.42's first answer to it undercounted
  by one.

**Out of scope** — anything under `src/` as a *change*; the app's write order is correct and the two
mutations below are measurements that get reverted. Also out of scope: the rest of `verify-shell.mjs`,
whose named waits WO-2.42 already audited and cleared, and any new check — this row fixes waits, it
does not add coverage.

**Acceptance**
- [ ] Each of the three waits exits on the flag **and** the sentence its check tests, from one pair of
      samples, with no fixed sleep anywhere in the change and no cap raised.
- [ ] **The fix is measured as a difference, not asserted.** With `announce()`'s defer raised from
      30ms to **3000ms** — well inside the 6s cap — the three checks go **red on the unfixed tree and
      green on the fixed one**. Both runs reported, with the failing sentences quoted from the red one.
- [ ] **The new condition can still fail.** With the defer raised past the cap (30000ms), the fixed
      waits go red at these three checks and the failure text names the announcement that never
      arrived — a wait that cannot go red is a sleep that has learned to poll.
- [ ] `src/live-region.js` is restored byte-identically: md5 taken before the first mutation and again
      after the last revert, both quoted, and `git diff --stat -- src/` empty at the end.
- [ ] The `waitForPassAlert()` decision and the fourth-site answer are both in writing, at the code.
- [ ] `node tools/verify-shell.mjs` green on two consecutive unmutated runs, quoted with their summary
      lines.
- [ ] `node tools/wo-sweep.mjs` green.

**Traps** — **The 3000ms measurement will redden checks that are not this row's**, anywhere in 22,000
lines that reads the live region behind its own margin. That is data, not a failure: report the whole
summary line, name the failures that are these three, and do not chase the others into scope. **Mutate ·
run · revert on `src/live-region.js` is the hazard this project has a scar for** — WO-2.37's constant
edit, WO-2.42's `src/classes.js` md5 that no blob in the file's history matches. Take the hash first,
commit nothing while the tree is dirty, and prove the revert rather than reporting it. **Do not fold
the interval poll and the escalation wait into one loop** unless you can say why the interval check
still means what its comment says; the cheaper shape is a second bounded wait after it, which leaves
the timer claim untouched. **And a longer sleep is not a fix here either**, which should not need
saying in a row whose entire subject is trap 5 — but WO-2.42's traps said it and WO-2.42 is why this
row exists.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/classes.js`
  - `src/live-region.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The model to copy is in the same file, and reading it is not optional.**
`tools/verify-shell.mjs` **:11098–11154** is WO-2.42's fix — the `PASS_ALERT_SAID` constant held
once "so that what this helper WAITS for and what those checks TEST are the same object rather than
two copies that can drift apart", the 34-line comment block headed `── WO-2.42: IT WAITS FOR THE
SENTENCE, NOT FOR THE FLAG ──`, and `waitForPassAlert()` itself. That comment already answers, for
its own site, three of the questions this row asks you to answer for three more: why the cap stays
at 24 × 250ms, why the pair the loop exited on is the pair handed back, and why it cannot go green
on nothing. **Your three fixes should read as siblings of it**, and whatever you write at the code
should be answering the same questions rather than restating that block.

**Where the four sites are on the tree as it stands right now** (verified today; the work order
recorded `:11355`, `:11535`, `:11554` from the tree that booked it, and they have not moved):

- `const said41 = await heard();` at **:11355**, its state sample `alerted41` at **:11356** off
  `ticked`, its check at **:11357–11366**. The interval poll it rides is **:11332–11340** and the
  interval check is **:11341–11345**, with the comment that names it *"the only check here that
  watches the TIMER rather than the arithmetic"* at **:11321–11331**. Note that the escalation check
  reads `cardTicked.over === 2` as well as `alerted41.alerted === 2` — `cardTicked` is the interval
  poll's own sample, so "the same pair of samples" has a wrinkle here worth thinking about
  explicitly rather than around: if a second bounded wait returns a fresh state, decide and say
  where the card level should be read from, and make sure the interval check at :11341 is left
  reading what it reads today.
- `const saidFive = await heard();` at **:11535**, behind `await wakeUp();` +
  `setTimeout(250)` at **:11531–11532**, with `atFive` at **:11533** and `cardB5` at **:11534**;
  check at **:11536–11546**. This one wants `alerted === 1` — the level `waitForPassAlert()`
  already hardcodes.
- `const saidTen = await heard();` at **:11554**, same shape at **:11550–11553**; check at
  **:11555–11563**. Wants `alerted === 2`.
- **The fourth site**, the one the work order asks for a sentence about: `await wakeUp();` +
  `setTimeout(250)` at **:11306–11307**, feeding `backAwake`/`cardAwake` at **:11308–11309** and the
  check at **:11310–11319**, which reads `elapsed`, `sentinel` and `note` and **no announcement**.
  Read it before you decide — it is materially different from the other three, and "deliberately
  left" is an acceptable answer if you say why.

**The mutation is one line.** `src/live-region.js:25` is
`setTimeout(() => { el.textContent = message; }, 30);` — the `30` is what goes to 3000 and then to
30000. Line **:23** (`if (message === lastMessage) el.textContent = '';`) is why the defer exists at
all. Take the md5 before you touch it, and prove the revert with the hash rather than by looking at
it.

**One thing to check early, because it decides whether this row can close at all.** Four of the
seven Acceptance lines are `verify-shell.mjs` runs, and per `CLAUDE.md` the harness *usually* cannot
run in a sandboxed agent — though it did run in one, twice, on 2026-08-16. Try it first, before you
write anything. If it genuinely cannot run here, **say so plainly and do not manufacture summary
lines**: a dispatch reporting "could not run" has reported an environment, not a result, and the
orchestrator re-runs it locally. A fabricated run is the one failure mode this pipeline cannot
recover from. If it does run, quote the real summary lines verbatim, including the whole line from
the 3000ms run with its unrelated reddened checks (Traps: that is data, not a failure — name which
failures are these three and leave the rest alone).

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 7 lines, reported against one by one

1. Each of the three waits exits on the flag **and** the sentence its check tests, from one pair of samples, with no fixed sleep anywhere in the change and no cap raised.
2. **The fix is measured as a difference, not asserted.** With `announce()`'s defer raised from 30ms to **3000ms** — well inside the 6s cap — the three checks go **red on the unfixed tree and green on the fixed one**. Both runs reported, with the failing sentences quoted from the red one.
3. **The new condition can still fail.** With the defer raised past the cap (30000ms), the fixed waits go red at these three checks and the failure text names the announcement that never arrived — a wait that cannot go red is a sleep that has learned to poll.
4. `src/live-region.js` is restored byte-identically: md5 taken before the first mutation and again after the last revert, both quoted, and `git diff --stat -- src/` empty at the end.
5. The `waitForPassAlert()` decision and the fourth-site answer are both in writing, at the code.
6. `node tools/verify-shell.mjs` green on two consecutive unmutated runs, quoted with their summary lines.
7. `node tools/wo-sweep.mjs` green.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

