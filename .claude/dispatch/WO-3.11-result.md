# WO-3.11 — `**Owes**`, and splitting what 🔨 IN PROGRESS means · dispatch record

**This file was not written by the implementer.** It is a reconstruction, assembled in the parent
session from the working tree, the verifier's report, and the gates re-run cold. It is filed under
the implementer's name in the directory listing and nowhere else, so the distinction is written here
at the top: **no sentence below is the implementer's own account of what it did.** Where its
reasoning would have gone — why it chose a fixture over reverting the repo, why it migrated its own
status row — there is either evidence read back off the tree or an explicit gap.

**Route** Claude (work-order-implementer), Opus tier, on this work order's own merits.
**Verdict** FAIL on one ❌, corrected in the parent session, then ticked. `✅ DONE — 2026-08-09`.

---

## What happened to the run

The orchestrator dispatched the implementer and was killed by an API session limit before the
implementer returned. Because the implementer was a nested child, it died with its parent. Its last
write was `plans/work-orders/phase-2-attendance.md` at 15:08; the dispatch had begun at 14:40.

It had, by then, finished the work and ticked all seven of its own Acceptance boxes. What it never
reached was its last act — this file. The consequence worth recording: **seven ticked boxes existed
in the tracker with no report behind them**, which is the exact shape the project treats as a lie
(`plans/work-orders/ROUTING.md`, and this work order's own Traps). They were treated as claims by a
run that did not survive to report, and every one was re-checked from scratch before it was allowed
to stand.

The pickup ran the four gates cold, then dispatched `work-order-verifier` with completeness — not
just correctness — named as in question, on the grounds that a process killed mid-write is the case
where a doc describing behaviour the code does not have is most likely.

## The ❌, and its correction

`.claude/agents/work-order-orchestrator.md:113` — § "2c. Claim it, before you write the brief" —
still read *"Writes `🔨 IN PROGRESS` and nothing else."* `--start` writes `🤖 CLAIMED — <dispatch>`
as of this work order.

The implementer corrected this same sentence in its human-facing twin (`ROUTING.md:31`) and in
`ROADMAP.md`, `work-orders/README.md`, `tools/README.md` and `phase-2-attendance.md`. It missed the
orchestrator's own operating instructions — **the one file in that set an agent executes from rather
than reads.** A human reading a stale doc is misinformed; an agent reading one acts on it, and the
next dispatch would have been told its claim wrote a glyph it did not write.

That is this work order's own **Why it exists** — the tracker's vocabulary saying one thing while the
tool does another — reproduced inside the work order that exists to end it. Corrected in the parent
session, one sentence plus a dated parenthetical. `:233` (`--tick` writes `🔨 IN PROGRESS` over an
open Acceptance list) is still true and was deliberately not touched; so were `:118-121` on
`--release`.

## Acceptance — seven of seven, verified cold

Verified by `work-order-verifier`, which read none of the implementer's reasoning because none was
written down. Lines 1, 2, 3 and 5 were run against the **real** WO-3.1/WO-3.5 text in an isolated
copy of `plans/` + `tools/wo-gate.mjs`, not against the self-check fixture — see the fixture note
below for why that mattered.

1. ✅ A `- [ ] … → WO-x.y` line with a resolving target ticks to `✅ DONE`, dependents' gates pass.
   Real WO-3.1 → `✅ DONE — 2026-08-09 · **Owes** WO-3.5`, both re-homed lines named as owed;
   `gate WO-3.3` → `PASS | gates clear for WO-3.3`.
2. ✅ Target box deleted or reworded holds the tick, names the line, writes nothing. `HELD`, exit 1,
   `→ WO-3.5 matched 0 of its 9 Acceptance boxes`; `md5sum -c` over all three writable files `OK`.
3. ✅ `--audit` fails on an `**Owes**` naming a work order that does not exist, and on one whose
   target box is already ticked. Both planted, both exit 1; the second carries the "the debt was
   paid, so tick this line on that evidence and drop the **Owes** field" message.
4. ✅ `--release` refuses `✅ DONE` and `🔨 IN PROGRESS`, works on `🤖 CLAIMED`. Both refusals exit 1
   with distinct messages; `git status --porcelain` unchanged across the sequence.
5. ✅ `next` returns a work order WO-3.1's old state would have hidden, and still skips 🤖 and 🔨.
   **The implementer built a self-check plant rather than reverting the repo** — the brief's
   sanctioned option. The verifier did not accept the plant as evidence for the live behaviour and
   reproduced WO-3.1's actual old state on the real file: at `🔨`, `next` reaches WO-3.3 and then
   `depends WO-3.1 🔨 IN PROGRESS <-- not done`, exit 1; at `✅ DONE` + `**Owes**`, `PASS`, exit 0.
6. ✅ `--self-check` plants all three new violations and fails when any stops being caught. 13/13, up
   from 9. Mutation-tested rather than read: breaking `resolveRehome()` → 2 plants red (the resolving
   plant staying green, which is what proves the discrimination runs both ways); breaking the
   holds-open rule → 2 red; narrowing `--release` → 1 red; against `git show 128d6f4:tools/wo-gate.mjs`
   → 11 of 13 red, matching the claim in `tools/README.md:66`.
7. ✅ WO-3.1's two re-homed lines converted from `- [x]` to `- [ ] → WO-3.5`, WO-3.1 still `✅ DONE`.
   **Exactly two** — boxes 2 and 4. Boxes 1 and 3 are genuinely done and were left `[x]`; converting
   either would have been a regression, not thoroughness. Both "☑ here means *resolved on this work
   order*, *not verified*" paragraphs are gone, and the surviving ☑ mentions all describe the retired
   mark as retired.

No 👤 line exists in this Acceptance list, so no agent-ticked 👤 offence was possible.

## Deliverables — six named, six landed

| Deliverable | Where |
|---|---|
| `**Owes**` field | `wo-gate.mjs:62` (`KNOWN_FIELDS`), `:206` (`owesRaw`), **and the field-table row** at `work-orders/README.md:56` |
| Re-homed lines + conditional `--tick` | `wo-gate.mjs:99-155`, `:924-1015` |
| The status split | `STATUSES` `:47`; `--start` `:678`; `next` `:549`; gate `:428`; `--release` fence `:723`; `--tick` accepts 🤖 `:377` |
| ROADMAP status vocabulary line | `plans/ROADMAP.md:41-46` |
| `--audit` third section | `wo-gate.mjs:1169-1194`, folded into the exit code at `:1218` |
| `--self-check` plants | `:1729-1845`, second synthetic fixture `WO-9.8` at `:523` |

The field-table row is the one most easily skipped and it is there, in the voice of the rows around
it. The held-tick path still writes `🔨 IN PROGRESS` — brief item 4, correctly *not* "fixed" to 🤖,
and plant 1 now asserts it.

**The in-scope question the brief flagged, answered:** neither `tools/wo-sweep.mjs` nor
`tools/verify-shell.mjs` parses a status token — a grep for `IN PROGRESS|NOT STARTED|CLAIMED` across
`tools/*.mjs` returns `wo-gate.mjs` alone (verify-shell's hits are all the `backupStatus` DOM id).
`.claude/commands/wo.md` carries no glyph either. So 🤖 cannot miscount there and no edit was needed.
**This check has no other record** — it is the kind of negative result that dies with an unreported
run, which is why it is written out here.

## Both Traps honored

- **No re-homed line is `- [x]`**, and no `- [x]` anywhere carries an explanation paragraph under it.
- **No compound status.** `✅ DONE — <date>` is untouched and the debt lives in a field of its own;
  `🤖 CLAIMED — <dispatch>` has the compound shape the Deliverables specified, not the one the Traps
  forbid.

## Two additions beyond the literal deliverable list, both earning their place

- `phase-2-attendance.md:1193-1199` reconciles WO-2.14's four ticked lines with the new vocabulary
  **without re-ticking anything**, and says so in its own text.
- WO-3.5's two inherited boxes were moved *into* its Acceptance list (`:304-310`). This fixed a real
  latent defect: `acceptanceOf` ends a list at the next bold line (`wo-gate.mjs:347`), so those two
  boxes were invisible to the tool and `--tick WO-3.5` would have written `✅ DONE` straight over
  them. The pointers this work order builds cannot resolve without it.

## The fixture assumption, named

The verifier asked what would have to be true of the self-check fixture for a bug to be invisible,
and found three properties the fixture cannot express: `~~strikethrough~~` inside a target (`norm()`
at `:769` strips backticks and `**` but **not** `~~`, and WO-3.1's line 2 is struck through); wrapped
multi-line boxes joined by the `/^\s{2,}\S/` continuation rule; and a marker written inside backticks
that must *not* be read as a marker — which WO-3.11's own Acceptance line 7 contains. It broke all
three against the real text rather than the fixture. All survive: both real pointers resolve, and
`--audit` reports **one** work order with markers, not two — the backticked marker is correctly
invisible.

## Mechanical pass

```
node tools/wo-gate.mjs --self-check   PASS   13 plants, 13 caught, 0 missed
node tools/wo-gate.mjs --audit        PASS   2 pointers resolving, 0 problems
node tools/wo-sweep.mjs               14 PASS · 1 REVIEW (standing)
node tools/verify-shell.mjs           473/473 · 0 failed · 0 skipped · 153s
```

`verify-shell.mjs` **ran fine** — 473 of 473, zero skips, so no fixture quietly stopped existing. The
standing REVIEW is the `sensitive field names outside src/backup.js` grep at 173 mentions; this work
order touches no app code, so that review set is byte-identical to before it. Not a finding.

Scope: seven files, all tracker and tooling. No `src/`, no `index.html`, no `sw.js`.

## The status row, and why it was not released

The implementer migrated its own row from `🔨 IN PROGRESS` to `🤖 CLAIMED — 2026-08-09` — the brief
asked it to decide and justify, and the decision is legible in the tree even though the justification
died with the run. It was the right call: leaving the repo's only live claim spelled in the retired
vocabulary would have reproduced, in this work order's own header, the ambiguity it exists to remove.

At pickup it was a **stale claim** — 🤖 with no dispatch in flight. It was **not** released.
`--release` would have written `⬜ NOT STARTED` over completed, verified work and handed it to the
next `/wo` as unstarted, which is precisely the failure `ROUTING.md:41-46` now describes. The ❌ was
corrected first, then `--tick WO-3.11` wrote `✅ DONE — 2026-08-09` and moved the Phase 3 row 2 → 3
and the overall count 28 → 29 (43% → 45%). `ROADMAP.md` stays at Phase 3 `2/10`: this work order
closes no roadmap box by design, and inventing one to tidy the dashboard is the drift WO-2.15 and
WO-2.16 exist to catch.

## Follow-ups, none blocking

1. **A `- [x]` line carrying a `→ WO-x.y` marker at a still-open target passes `--audit` as `ok`**
   (`wo-gate.mjs:489` even prints the `[x]`). The Deliverable says *"a re-homed line must never be
   `- [x]`"* and `work-orders/README.md:100-106` says **"Never `- [x]`"** — but nothing enforces it.
   Narrow window, since `--audit` fails regardless once the target ticks, and no Acceptance line
   required it. Worth a plant.
2. `work-orders/README.md:289` still explains this work order's placement with *"a `🔨` there blocks
   WO-3.5"* — true of the world before the change, and now the thing it prevents. Harmless as
   history, misleading as a live prediction.
3. `phase-3-gradebook.md:54-55` carries a ragged line-wrap left by the edit. Cosmetic.

## What comes next

**WO-3.3 — Assignments** (M, Ship 2, G2 dependency, no 🚩). `gate WO-3.3` passes today —
`depends WO-3.1 ✅ DONE owes WO-3.5` — and it passes *because* this work order landed, which is the
whole point of inserting it at #4. WO-3.3 is the next work order that will land with Acceptance lines
it cannot close, so it is the first real exercise of the field this one built.

`CHANGELOG.md` is untouched, by rule — that is prose the teacher writes.
