# WO-2.27 — where the pass work says one thing and does another · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.27-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude at Opus tier, on its own merits** — the deciding signal
is that the Traps section is judgment end to end rather than mechanics (do *not* add the
presentation-mode redraw; do *not* delete the promise instead of honouring it; the hook diff run in
reverse destroys the inventory), and four of the five deliverables are prose whose entire value is
that the next reader trusts it. The runner-up consideration set aside: the two harness gaps are
mechanically specified and would read as Codex work in isolation, but they ship inside a size-S order
whose central deliverable is a sweep rule whose asymmetry has to be *argued* in a comment, and
splitting one small work order across two runners costs more than it saves.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.27 — where the pass work says one thing and does another

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-14 · **Size** S · **Depends on** WO-2.9, WO-2.26

**Booked 2026-08-14, out of WO-2.9's verification, and widened the same day out of WO-2.26's.** Two
dispatches' worth of findings that were correctly **not** acceptance failures — nothing either work
order promised is unmet — and that would otherwise live only in `.claude/dispatch/WO-2.9-result.md`
and `.claude/dispatch/WO-2.26-result.md`. The rule that puts them here is the one written under the
Ship 2 table when WO-3.19 and WO-3.20 were booked: *a follow-up that lives only in a dispatch result
file is a follow-up nothing reads.* **The count came out of the title on 2026-08-14** for the reason
this work order is otherwise about: a number in a heading is a promise that rots the next time
anything is added, and this one rotted within a day of being written.

**Why it exists.** *Two kinds of debt, and the second is the one that can cost a term.* The first
kind is a comment making a promise the code beside it does not keep — the failure mode this
repository treats as expensive, because every dispatch here is briefed by comments before it is
briefed by anything else. WO-3.19 was booked for the same reason one phase over and its note says the
pixel was the smaller half. **The second kind is a check that cannot fail**, which is worse, because a
comment that lies is found by the next reader and a green check that proves nothing is found by
nobody. WO-2.26 went to real trouble to make its term-scoping check falsifiable and got the lower
bound only; the two harness items below are that gap and its neighbour.

**The comment debts**
- **The pass clock outlives its banner.** `src/attendance.js:2833` — `paintPassBanner()` returns at
  line 2835 when the banner element is not in the document, so the `stopPassClock()` at line 2860 is
  unreachable on that path and navigating off the registry with a pass open leaves a 1-second
  interval running. Every tick is a no-op, which is why this is XS and not a bug report. **What makes
  it a comment problem is line 2856**: *"A run with an empty room costs nothing at all, not one timer
  doing nothing once a second."* That is true of the empty-room path and false of the navigated-away
  path, and it is the sentence a reader would trust instead of checking. A live timer on a device
  that suspends is also the exact hazard class WO-2.9's own Traps section is about.
- **`flipPresentationMode()` carries a standing instruction that WO-2.9 did not obey.**
  `src/shell.js:747` tells the next screen that shows support data to add its redraw there; WO-3.8
  obeyed it, and WO-2.9 added a third name-bearing surface without one. **It is not a bug and must
  not be "fixed" by adding the redraw**: the header sits at `z-index: 999` under the modal overlay's
  `1000`, so the mode cannot be flipped while the pass dialog is showing names — the first tap closes
  the dialog and the second reaches the control. The owner confirmed that walk on glass on
  2026-08-14 and read it as the sensible flow. **The geometry is also the safer behaviour**, since a
  flip reaching through an open dialog would repaint names in front of whoever is sitting there. What
  is missing is that none of this is written anywhere. One comment, at the instruction or at the
  dialog, naming the stacking as the reason and the date it was checked on a device.
- **A harness comment points at something that is not there.** `tools/verify-shell.mjs:10077` reads
  *"a build that fired off a variable would say it again after the reload below."* There is no reload
  below. The check is sound; the sentence explaining why it is sound is not.
- **`src/shell.js`'s hook inventory claims to be one and is not — and it is missing SEVEN, not three.**
  The block under *"The hooks, all handled by the one listener below"* lists every delegated attribute
  in the app. Diffed 2026-08-14 against every `closest('[data-…')` in the same file, these are
  delegated and absent:

      data-pass-history · data-pass-history-all · data-pass-history-student      (WO-2.9)
      data-attendance-history · data-attendance-record
      data-attendance-record-csv · data-attendance-record-print                  (earlier)

  WO-2.26's first verifier found the **three** because it was reading WO-2.9. **The other four have
  been missing longer and nobody ever flagged them**, and that is the finding rather than the count:
  this list does not rot when one person forgets once, it has been rotting continuously across at
  least two work orders, in silence. An inventory is a promise of completeness in a way a paragraph is
  not, so a missing row reads as *"no such hook exists"* rather than *"this list is partial"* — and it
  is the first thing a dispatch looking for the delegation seam reads.

  **The diff is trustworthy in ONE direction only, and the other direction is a trap** — see Traps.

**And two gaps in the harness, from WO-2.26's verification**

Both are checks that pass and would keep passing if the thing they cover were removed. Neither is a
failure of WO-2.26 — its verifier ran 746 of 746 and proved the scoping check falsifiable by deleting
the whole term filter — but proving *a* filter is load-bearing is not proving *both bounds* are.

- **Nothing is planted after `term.end`, so a dropped upper bound stays green.** Every trip in the
  hall-pass fixture falls on or before the term's end, and the out-of-term trip WO-2.26 planted to
  make scoping visible sits *before* `term.start`. So `passesForStudentInTerm()` reduced to
  `(from)` only — the `to` bound dropped, the commonest way a date window rots — passes the suite.
  **The fix is one more planted trip, dated after `term.end`**, and the check that proves the fix is
  the same one the verifier already ran by hand: drop the bound in a copy of the tree and watch it go
  red. A bound with no trip beyond it is decoration.
- **WO-3.7's `#scoresBody` route is walked but not asserted.** WO-3.7's block opens the Student Report
  screen through `#scoresBody [data-student-detail="…"]` and WO-2.26's asserts the card — but on its
  own route. Nothing checks the card is on the screen *when it is reached from the score grid*, which
  is the route a teacher actually uses most. It is one assertion on a walk that already happens.

**Deliverables**
- The clock is stopped on every path that leaves the banner, including the one that returns early.
- The stacking argument is written down at the point a reader will look for it, with the date it was
  confirmed on the device.
- `tools/verify-shell.mjs:10077` says what the check actually rests on.
- `src/shell.js`'s hook inventory lists all **seven** missing hooks, or says in one line that it is not
  exhaustive. **Either discharges it; a third option — adding some rows and leaving others out —
  discharges nothing** and leaves the same false promise a few rows shorter.
- **A sweep rule in `tools/wo-sweep.mjs` that diffs the delegated hooks against the inventory**, so the
  eighth omission is a red check rather than a discovery. *This is the deliverable that matters more
  than the seven rows.* Four of this work order's debts were found by a human reading and thinking
  "that looks odd"; this is the only one a script can hold, and it is the only one that has recurred.
  Listing the seven by hand fixes today and leaves the mechanism that produced them running — the same
  reasoning that took the count out of this work order's own title.
- **A trip planted after `term.end`**, and the upper bound of `passesForStudentInTerm()` thereby made
  load-bearing.
- **One assertion that the hall-pass card is on the Student Report screen when it is reached from the
  score grid**, on the walk WO-3.7's block already takes.

**Acceptance**
- [ ] Navigating off the registry with a pass open leaves no interval running, and there is a check
      that fails if the early return stops stopping it.
- [ ] `src/attendance.js:2856`'s comment is true of every path through the function it describes.
- [ ] A reader of `src/shell.js:747` can tell why WO-2.9's surface is not registered there without
      opening a dispatch result file or this work order.
- [ ] `tools/verify-shell.mjs:10077` describes the mechanism the check actually uses.
- [ ] A reader of `src/shell.js`'s hook inventory who searches it for any of the **seven** named above
      either finds the hook or finds a sentence telling them the list is partial.
- [ ] **`wo-sweep.mjs` fails when a delegated hook is missing from the inventory.** Prove it the way
      WO-2.26's verifier proved the term filter: delete one row from the inventory in a copy of the
      tree, watch the sweep go red, and state that in the result file. A rule that has only ever been
      run against a list somebody just finished fixing has not been shown to catch anything.
- [ ] **The term window's upper bound is load-bearing:** with a trip planted after `term.end`,
      reducing `passesForStudentInTerm()` to its `from` bound alone turns the suite red. State the
      count in the result file, the way WO-2.26's verifier stated 739/746 for the whole-filter case —
      *"it would go red"* is the claim this line exists to stop anyone making by reading.
- [ ] The hall-pass card is asserted present on the Student Report screen reached from
      `#scoresBody [data-student-detail="…"]`, not only on WO-2.26's own route.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but
      for the count.

**Traps** — **Do not add the presentation-mode redraw.** The finding is a missing *comment*, not a
missing call; adding the redraw would wire a repaint for a state that cannot occur and would have to
be reasoned about again by everyone after. **Do not delete the promise in `src/attendance.js:2856`
instead of making it true** — "a run with an empty room costs nothing" is a real guarantee about a
device that suspends, and the cheap fix is to honour it on the fourth path rather than to stop
claiming it.

**THE HOOK DIFF RUNS ONE WAY, AND RUNNING IT THE OTHER WAY WILL DESTROY THE INVENTORY.** Attributes
found in a `closest('[data-…')` call and missing from the list are real omissions — that is the seven.
The reverse comparison produces **twenty-odd inventory entries with no `closest()` call, and they are
mostly correct entries**: `data-pass-type`, `data-score-student`, `data-term-id`, `data-assignment-id`
and `data-model` are value-carrying companions read off an element some *other* hook matched, and
several more are reached by `matches()` or `getAttribute()` rather than by `closest()`. A dispatch that
diffs both ways and deletes the difference will strip working documentation and call it tidying. **The
sweep rule must assert one direction only**, and its comment must say why — that sentence is itself one
of this work order's deliverables in spirit, since a rule whose asymmetry is undocumented is the next
comment debt.

**No `src/` file needs to change for either harness gap**, and if one starts to, stop: both are
fixtures and assertions, and a source edit made to satisfy a test this work order is writing is the
tail wagging the dog. **The planted trip is put back the way WO-2.26's block puts its own back** —
that block already plants trips and terms and restores both at its foot, and a second plant that
leaks would be read as a scoping bug by every check after it. **`src/shell.js:747` is unchanged and
its bullet above is not an instruction to register anything**: WO-2.26 *did* add
`detail.renderDetail()` there, guarded on the view being on screen, so the standing instruction now
has two obeyers and one documented exception — which is the state the missing comment has to
describe, and the reason that bullet got no wider when this work order did.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/attendance.js`
  - `src/shell.js`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a specific reason:

- **`.claude/dispatch/WO-2.26-result.md` and `.claude/dispatch/WO-2.9-result.md`** — every finding in
  this work order was lifted out of these two files. Read them for the detail the work order
  compressed, especially WO-2.26's falsifiability demonstration: it deleted the whole term filter in a
  copy of the tree and reported **739/746**. That is the shape acceptance lines 6 and 7 are asking you
  to reproduce, count and all. It is also the block whose fixture you are extending, so read how it
  plants its trip and its term and how it puts **both** back at the foot of the block. Your second
  plant restores the same way or it leaks into every check after it.
- **`src/detail.js`** — the Student Report screen that acceptance line 8 asserts against. WO-2.26 put
  the hall-pass card there and asserts it on its own route; you are adding one assertion on the
  `#scoresBody [data-student-detail="…"]` walk that WO-3.7's block already takes. Note this file has a
  header firewall (its lines 36–42) that recent work orders have been told to read before writing —
  you are adding a harness assertion, not touching the module, so it should not come up, and if you
  find yourself editing `src/` to satisfy an assertion, the work order's own Traps say stop.
- **`plans/work-orders/README.md`** — the convention for what an Acceptance line means and when a box
  may be ticked. You may tick the lines your own run closed; none of these nine looks like a 👤 line,
  but say so explicitly if you conclude otherwise rather than ticking on inference.

**On the sweep rule, which is the deliverable that matters most.** `tools/wo-sweep.mjs` is a set of
standing greps — match its existing rule shape rather than inventing a new one, and do not reach for a
parser or a dependency. Its output line count is part of acceptance line 9: the count may change
because you added a rule, but nothing else about what the two harnesses print may drift. The one-way
assertion and the reason for it belong in a comment at the rule, in this repository's voice — a rule
whose asymmetry is undocumented is the next entry in a work order like this one.

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

## 5. Done means these 9 lines, reported against one by one

1. Navigating off the registry with a pass open leaves no interval running, and there is a check that fails if the early return stops stopping it.
2. `src/attendance.js:2856`'s comment is true of every path through the function it describes.
3. A reader of `src/shell.js:747` can tell why WO-2.9's surface is not registered there without opening a dispatch result file or this work order.
4. `tools/verify-shell.mjs:10077` describes the mechanism the check actually uses.
5. A reader of `src/shell.js`'s hook inventory who searches it for any of the **seven** named above either finds the hook or finds a sentence telling them the list is partial.
6. **`wo-sweep.mjs` fails when a delegated hook is missing from the inventory.** Prove it the way WO-2.26's verifier proved the term filter: delete one row from the inventory in a copy of the tree, watch the sweep go red, and state that in the result file. A rule that has only ever been run against a list somebody just finished fixing has not been shown to catch anything.
7. **The term window's upper bound is load-bearing:** with a trip planted after `term.end`, reducing `passesForStudentInTerm()` to its `from` bound alone turns the suite red. State the count in the result file, the way WO-2.26's verifier stated 739/746 for the whole-filter case — *"it would go red"* is the claim this line exists to stop anyone making by reading.
8. The hall-pass card is asserted present on the Student Report screen reached from `#scoresBody [data-student-detail="…"]`, not only on WO-2.26's own route.
9. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but for the count.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

