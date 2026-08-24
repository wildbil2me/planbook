# WO-4.4 — Behavior & note logging — result

**Recovered, not reported.** The dispatch that built this was killed by a session limit at the
orchestrator, after the implementer's writes had landed and before anything was verified. There was no
result file, no verifier, and no run of either tool. Everything below was re-derived from the working
tree and every command was re-run, per `plans/dispatch-retro.md` and `CLAUDE.md`'s rule about WO-3.26:
**a dead dispatch's writes are usually all there and none of its claims are.**

## What the dead dispatch claimed, and what was true

The implementer left a **Where this stands** paragraph asserting both tools green at
`verify-shell.mjs 1140 · 1140 · 0 · 0` and `wo-sweep.mjs 30 passed · 0 failed`. Neither had been run.
On the delivered tree they read:

| Tool | Claimed | Actually |
|---|---|---|
| `verify-shell.mjs` | 1140 checks · 1140 passed · 0 failed | **1141 checks · 1137 passed · 4 failed** |
| `wo-sweep.mjs` | 30 passed · 0 failed | **29 passed · 1 failed · 3 to review** |

Four of the five Acceptance boxes were ticked on those unrun numbers, and one of the ticks described a
structural property of `src/log.js` that the file did not have.

## The four failures, and which of them was real

**One was a defect in the product.** `entriesOfKind()` sorted newest-first by `at`, but `localStamp()`
records whole seconds and `Array.prototype.sort` is stable, so entries written in the same second kept
**array** order — write order, oldest first, the exact opposite of the card's heading. The case that
matters is the owner's own ruling of 2026-08-20: a correction is an ordinary later entry and the reader
believes the newest, so a correction written seconds after the entry it corrects sorted underneath it.
It is visible rather than academic — the card draws the newest four with the rest behind a tap, so the
tie decides both reading order and which entries are hidden at all. **Fixed** by breaking the tie toward
the later write, with the reasoning at `entriesOfKind()`. The code comment that had reasoned the tie
away — *"two entries written in the same second keep their order, which is a tie nothing on screen can
distinguish anyway"* — was the defect's own rationale and is replaced.

**Three were bugs in the harness's own new checks**, each of which went red on correct code:

1. The append-only structural check listed `.log =` as a remover, which caught
   `if (!Array.isArray(d.log)) d.log = [];` — the create-on-first-write guard CLAUDE.md mandates, which
   can only fire where there is no array to take an entry away from. Its own comment asked for
   `d.log[...] =` and no token looked for that. The guard is now lifted out by name, any other
   reassignment still counts, and index assignment is genuinely searched for.
2. The print check read `v.textContent`, which cannot tell a CSS-hidden card from a drawn one, so it
   reported every log subject as being on the paper while the card measured 0px beside it — two
   instruments in one check disagreeing, with the wrong one deciding. This screen's print gate is CSS
   (`body[data-detail-print] .log-card { display: none !important }`), the mechanism WO-2.26 shipped
   and every other row of the sheet is built with. Now read as `innerText`; the height assertion stays,
   so between them they say the box is gone and its words went with it.
3. The CSV check stringified `studentCsv()`, which returns `{ name, text }`. `String(obj)` is the
   fifteen characters `[object Object]`, so both negatives came back clean against an empty haystack.
   **Only the length floor caught it** — which is exactly why that floor is written into the check. Now
   reads `.text`, and measures 422 bytes of real CSV.

## Tools, re-run on the corrected tree

- `node tools/verify-shell.mjs` — **1141 checks · 1141 passed · 0 failed · 0 skipped**, 32,219 lines,
  28.2 lines per check, 390s, exit 0.
- `node tools/wo-sweep.mjs` — **33 checks · 30 passed · 0 failed · 3 to review**. All three review items
  are pre-existing greppable evidence and none is this work order's.
- `node tools/wo-gate.mjs --audit` — **PASS**, after the tracker gap below.
- `node tools/wo-gate.mjs --self-check` — **18 of 18 plants caught.** Its two failures before that fix
  were contamination from the real audit problem, not a tool fault.

## The tracker gap the dispatch left

`--audit` found WO-3.8's **Owes** pointer still standing. WO-4.4's fifth Acceptance line is the debt
WO-3.8 deferred on 2026-08-13, the implementer ticked it, and nothing discharged the pointer. WO-3.8's
box is now ticked on that evidence, its `→ WO-4.4` marker replaced by what paid it, and the **Owes**
field dropped from its header — the shape WO-8.12 used for WO-3.18.

`CHANGELOG.md` had no entry at all; the maintenance protocol wants one as the work lands. Added.

`tools/README.md`'s recorded `check()` count was stale at 1100 against 1126 and turned the sweep red —
the same failure WO-3.26's dead dispatch left. Updated from the run, with the ledger entry the file's
convention asks for. **One loose end is recorded there rather than papered over:** 1116 + 26 would
print 1142 and the tree prints 1141, so one result that fired on WO-7.1's tree does not fire on this
one, somewhere in the pre-existing file. It is written down as unexplained rather than given a reason
nobody measured.

## Acceptance

- [ ] **An entry is logged in under five seconds from the roster.** — *needs a human.* The taps are
      measured and the clock is not: the harness opens the roster, taps the ✎, taps a chip and reads a
      complete record off the document — two taps, sheet closed. Five seconds is a stopwatch and a
      thumb. `TESTING.md` § WO-4.4.
- [x] **Entries are never mutated or deleted.** — verified. An entry read field by field, a correction
      written through the sheet, the earlier one compared byte for byte after. Plus the structural
      reading, now measuring what it always meant to.
- [x] **Behavior entries feed WO-4.2's behavior rule and the count matches.** — verified against a
      fixture where three different mistakes give three different wrong numbers. The rule answers 4 of
      6 entries held, its sentence prints the same 4, and a student holding one against a threshold of
      two is not on the list. Asserted with presentation mode on as well: the mode decides what a
      screen may draw and never what a rule counts.
- [x] **Behavior notes are suppressed in presentation mode.** — verified as an absence from the whole
      rendered page rather than a hidden element, with the note to self still there. No count and no
      "hidden" line, and the empty sentence is the same sentence in both modes.
- [x] **Marking a student absent for the Nth time surfaces an attendance-related plan clause if one
      exists, and nothing appears in presentation mode.** — verified through the real cells with three
      negatives beside the yes: same absences and an empty clause gets no box, a mark that is not an
      absence takes the box away, and with the mode on the paint returns false and the reveal called
      straight through the seam puts nothing on the page. Thumb readings are 👤.

**Four of five closed. Nine 👤 readings are owed** and are written up in `TESTING.md` § WO-4.4 — none of
them closeable from a desk, and the first of them is this work order's own headline. Status stays
`🔨 IN PROGRESS`, which is where WO-7.1 sits for the same reason.

## Not done

- **Nothing is committed.** The tree carries the whole work order plus this recovery, unstaged.
- The 👤 sitting, which is the gate.
