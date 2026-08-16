# WO-2.30 — archiving the open class misdirects the pass alert · implementation result

**Implementer** Claude (work-order-implementer), Opus tier · **Date** 2026-08-15
**Work order** `plans/work-orders/phase-2-attendance.md` § WO-2.30 (now ✅ DONE — 2026-08-15)

---

## The decision, first, because it was the first deliverable

**The second candidate: leave the passes, and refuse the act that would leave them behind.**
`archiveClass()` refuses while `openPassesFor()` finds anybody out of that class, and says so in the
class manager's own error line. Nothing is written, nothing is closed, the class stays on the bar.

It is argued in the work order itself, in `plans/work-orders/phase-2-attendance.md` immediately above
the Deliverables — five paragraphs: the decision, why not candidate 1 (neither `closePass()` nor
`cancelPass()` means "archived"; one invents a return nobody saw and the other deletes a trip that
happened, and both are the app asserting that a student who is out of the room is not), why not
candidate 3 (the cross-class alert, refused on the record three times, needs a surface of its own),
why the refusal is cheap (nothing changes in the common case, and both Traps are honoured — the
`list[0]` fallback and `paintPassElapsed()`'s scoping are untouched), and **what happens to
deletion**, which the bug statement names and which I deliberately left alone. That prose was written
and saved before the first line of code.

**Deletion, since the brief said not to scope this to archive alone without saying so.** Delete is
offered on an archived row only, and after this change nothing can archive a class with somebody out
— so no sequence of taps in the app reaches `confirmDelete()` with an open pass. Refusing there too
would trap the teacher: an archived class is off the tab bar, so there is no screen left on which to
tap Return, and a refusal she cannot satisfy is a class she can never delete. So the delete path is
unchanged; what it now carries is a fourth bullet in its "what it deliberately leaves alone" comment
saying why, and naming the one state it cannot reach through the app (a document that arrives already
holding an open pass on an archived class — see the follow-up below).

---

## Against the Acceptance list, one by one

### 1. `[x]` Archiving a class with a student out on a pass has a defined, written-down outcome, and the work order says which of the three it is and why

**Met.** `plans/work-orders/phase-2-attendance.md`, the block headed **"THE DECISION, taken
2026-08-15 … the SECOND candidate"**, which names which of the three it is in its first sentence and
argues the other two down. The same decision is recorded at the two places the code lives:
`src/passes.js`'s header (a new titled section, *"AND WHAT ARCHIVING THE CLASS DOES TO AN OPEN PASS,
WHICH IS NOTHING"*) and `src/classes.js`'s `archiveClass()` comment.

**How verified:** by reading it back. This is a prose deliverable; there is nothing to execute.

### 2. `[x]` A student out on a pass in the archived class is not silently left un-alerted while a different class's passes are processed in their place

**Met, and by making the state unreachable rather than by handling it.** The archive is the only way
a class becomes archived, and it now refuses while anybody is out. Measured, not argued —
`verify-shell.mjs` issues a pass on the real 🚽 button, taps Archive in the real manager, and then
winds the stamp back 5.2 minutes and lets the real interval tick:

```
PASS | archiving a class with a student still out is refused: the class stays on the bar, the pass
       stays open, and the manager says who has to come back first
       :: archived = false, still on the bar = true, open passes = 1, the manager reads
       "1 student is still out on a hall pass from Period 3 — Biology. Open the class and tap Return
       — or Cancel, if the pass never happened — and then archive it. …", and the live region heard
       [the same sentence]
PASS | and the clock still reaches that student five minutes later, because the class it belongs to
       is still the one that is open
       :: the open class is "c_b1", the pass belongs to "c_b1" and records alerted = 1; the
       announcement was "José Álvarez has been out on a bathroom pass for 5 minutes."
```

**One honest limit, stated rather than assumed:** this closes the *app-reachable* route only. A
document that arrives from a restore, a hand edit or a sync **already** holding an open pass on an
archived class is still un-alerted, and nothing in this work order changes that. It is written up in
`TESTING.md` § WO-2.30 and as a proposed follow-up below. I did not widen the work order to chase it.

### 3. `[x]` The check drives the real path — issue, archive, tick — and fails on today's build

**Met, and demonstrated rather than asserted.** Five call sites at the foot of the existing WO-2.9
hall-pass block in `tools/verify-shell.mjs`. Nothing is punched into the DOM: the pass is issued by
clicking `[data-pass-issue]`, the archive is `header [data-class-manage]` then
`#classList [data-class-archive="…"]`, and the clock is the app's own interval after a wind-back
through the store (the idiom the WO-2.9 block already uses).

**The red run.** `src/classes.js` was copied aside, the guard removed (leaving exactly today's
`archiveClass()`), and the same harness run:

```
785 checks · 783 passed · 2 failed · 0 skipped
20,776 lines · 26.5 lines per check · 256s

FAIL | archiving a class with a student still out is refused: …
       :: archived = true, still on the bar = false, open passes = 1, the manager reads "", and the
       live region heard "Period 3 — Biology is archived. Everything in it is kept — restore it here
       any time."
FAIL | and the clock still reaches that student five minutes later, …
       :: the open class is "c_2b2z71075k", the pass belongs to "c_b1" and records
       alerted = undefined; the announcement was "nothing has been announced since this sentinel was
       written"
```

`c_2b2z71075k` is the id the fixture check named one line earlier as *"the one archiving would fall
to"*, so the misdirection is measured rather than described: the clock is not broken, it is busy in
the wrong room, and the student in `c_b1` is never announced. `src/classes.js` was then restored
byte-identically — md5 `df7b2e98c83d7e00543ce5b0da9b7991` before and after.

**Three of the five stay green on the unfixed build and are meant to** (fixture; refusal-lifts;
hand-back). The block carries a defensive restore arm so a red run does not end at a `clickSel` that
finds nothing — the WO-2.26 scar in `tools/README.md`. Five red checks would have been one claim
asserted five times.

### 4. `[x]` `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` print what they printed before, but for the count

**Met.** Both run locally, both read to completion, quoted from the output files:

- `verify-shell.mjs` — **`785 checks · 785 passed · 0 failed · 0 skipped`**, 20,776 lines, 26.5 lines
  per check, **250s**, exit 0. Previous delivered tree printed 780. The +5 is exactly this block.
- `wo-sweep.mjs` — **`20 checks · 18 passed · 0 failed · 2 to review`**, and the two REVIEWs are the
  standing pair (sensitive field names; due-date beside late/missing). Identical to the pre-change
  baseline I took before writing anything.
- The count line in `tools/README.md` was updated 783 → 788 in the same pass, which is what keeps the
  sweep's own check green: *"788 `check()` call site(s) in tools/verify-shell.mjs, matching
  tools/README.md:812"*.
- `wo-gate.mjs --audit` — `PASS | every fragment matches exactly one roadmap box, every **Owes**
  pointer lands on an open box, and every dashboard row matches its own boxes.`

**The green run stands for the delivered tree.** It was made after every code and harness edit; the
only files touched afterwards are `TESTING.md`, `tools/README.md` and `plans/`, and the harness reads
`sw.js`, `index.html`, `src/` and itself — no doc file. `src/classes.js` is byte-identical to what
that run measured (md5 above).

---

## Files changed

| File | What |
|---|---|
| `plans/work-orders/phase-2-attendance.md` | The decision and its argument, above Deliverables; four Acceptance boxes ticked; status → ✅ DONE (via `wo-gate.mjs --tick`) |
| `src/classes.js` | `openPassesFor` leaf import; the refusal in `archiveClass()` with its reasoning; a fourth bullet in `confirmDelete()`'s "leaves alone" list saying why delete is untouched |
| `src/passes.js` | Header section recording the agreement: there is no verb here for "the room went away", and why neither existing one can be borrowed |
| `sw.js` | `CACHE` v66 → v67 (two SHELL files changed) |
| `tools/verify-shell.mjs` | Five checks at the foot of the WO-2.9 hall-pass block |
| `tools/README.md` | Call-site count 783 → 788, and the WO-2.30 paragraph beside the others |
| `TESTING.md` | § WO-2.30 — what changed, the desk pass, the red run verbatim, the fixture assumption, and what stays uncovered |
| `plans/work-orders/README.md` | Dashboard, written by `wo-gate.mjs --tick` (Phase 2 → 28, overall → 70) |

No `CHANGELOG.md` entry — that is the teacher's. A draft is at the bottom of this file.
No new control, so nothing is owed to the `@media (pointer: coarse)` block; the sweep confirms zero
added CSS selectors. No stylesheet, no `localStorage`, no schema change, and no accommodation,
medical or plan data goes anywhere near this path.

---

## Decisions the work order did not settle, and which way I went

1. **Archive and delete get different answers.** The brief flagged that they may not deserve the
   same one. Archive refuses; delete is untouched, because it is offered on archived rows only and a
   refusal there would be one the teacher cannot satisfy. Both halves are argued in the work order.
2. **The refusal counts students rather than naming them.** Naming would need `fullName()` from
   `src/roster.js`, and `src/roster.js` already imports `src/classes.js` — that is the import loop
   this repo has refused four times. The count plus the class name gets her to the banner, where the
   name, the time out and both buttons already are. Written down at the code.
3. **Refused, not disabled.** The Archive button stays live and answers with a sentence rather than
   going grey, matching the registry's own pass-column note ("on screen rather than a dead control").
4. **The harness block lives inside the existing WO-2.9 hall-pass section**, not in a new section at
   the foot of the file. That section already hands over a 26-student class with the registry up, a
   clean pass log and a known open-pass state; a new section would have had to rebuild all of it. The
   block restores everything it disturbs and the last check asserts that.

---

## What I could not verify

- **Nothing here needs an iPad, and I ticked no 👤 line.** No 👤 line exists for this work order:
  nothing was drawn, no control was added, no touch target moved, and the whole path is drivable at a
  desk. If a reviewer wants a human reading of the refusal sentence on glass, that is a copy review,
  not a hardware one.
- **The wording of the refusal is my draft, not the owner's.** It is the one thing here a teacher
  meets, and it has not been read by one.

---

## Proposed follow-up work orders (not done, deliberately out of scope)

1. **An archived class can still arrive holding an open pass.** Not through the app any more, but a
   restore, a hand edit or a Drive sync can land a document in that state, and nobody is watching
   that pass: no card, no banner, no clock. `confirmDelete()` would also leave the entry dangling in
   `openPasses` naming a class that no longer exists. This is the residue of WO-2.30 and it is the
   same shape as the cross-class problem — it needs a surface, not a guard. Sensible scope: what the
   app says at load about open passes belonging to classes that are archived or missing.
2. **The cross-class overdue alert**, refused now for the fourth time. Named here only because it is
   what item 1 would most naturally be built on; it still needs its own argument and its own surface
   (a card, a Return button, and something to act on), per `src/attendance.js`'s standing refusal.
3. **The temptation I declined:** pruning `openPasses` inside `confirmDelete()` and adding an
   "N students still out" line to the delete confirm's counted fact list. It is defensible — an open
   pass is *state* and history is not, so state about a room that no longer exists is a false claim —
   but it fixes nothing that is actually reachable, it would put a fact line in front of the teacher
   that no sequence of taps can produce, and the delete dialog's contract is that it destroys exactly
   what it listed. It belongs with item 1 if item 1 is taken.

---

## Draft CHANGELOG entry — for the teacher to write or discard

> **Fixed** — Archiving a class while a student is out on a hall pass is now refused, with a line in
> the class manager naming the class and how many students are still out. Before this, archiving took
> the class off the bar and the overdue-pass clock quietly moved to a different class: the student who
> was actually out of the room was never announced again, and nothing on screen said so. Bring the
> student back (or cancel the pass) and the class archives in one tap, as before.
