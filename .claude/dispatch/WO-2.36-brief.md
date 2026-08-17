# WO-2.36 — retiring a key correctly turns both key checks red · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.36-result.md` — as your last act, and return it in-band too.

**Routing decision — Claude, Opus tier.** The deciding signal is Deliverable #1: this work order does
not hand you a fix, it asks for a *decision* among three named options and states outright that "the
tension is the work, and it does not have a free answer" — and Acceptance line 3 wants that decision
in a comment written "in the words the next reader needs," which is reader-facing prose. Judgment
trap and prose are two separate Claude columns in `ROUTING.md`. The runner-up set aside: the
mechanical shape reads Codex cleanly — harness only, `src/` out of scope, acceptance proved by
mutation, a byte-level precedent ninety lines up the same file — but the complete spec that would
make it Codex work is precisely what is missing, and independently the Traps' three-plus harness runs
at ~4.4 min each leave nothing inside `codex-invoke.mjs`'s twenty-minute `INVOKE_TIMEOUT_MS`. No
Codex probe was run; step 2b is a Codex-route step only.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.36 — retiring a key correctly turns both key checks red

**Ship** 2 · **Status** 🤖 CLAIMED — 2026-08-16 · **Size** S · **Depends on** WO-2.34 · **Blocks** nothing, and
that is deliberate — no key is being retired today, so this is a row to cut if the fortnight tightens
**Closes roadmap** *(no box. Harness, not app: nothing here changes what a teacher sees. The same call
WO-3.12, WO-3.21, WO-3.24 and WO-2.34 made.)*

**Not a go-live blocker, and nothing here is a defect.** Booked 2026-08-16 out of WO-2.34's
verification. Both checks are green and correct on today's tree. This is about what they do on a
*future* correct tree.

**Why it exists.** Both key checks floor themselves against a vacuous pass with hardcoded counts
taken from the tree the day they were written — `bound.length >= 8 && glyphs.length >= 8 &&
rows.length >= 7` on the score grid, `>= 9 && >= 9 && >= 8` on the marking screen. The floors exist
for a real reason and it is the right reason: **empty agrees with everything**, so a renamed modal
id, a renamed constant or a regex that quietly stops matching all produce two empty lists that
compare equal, and the check passes while measuring nothing. WO-3.22 and WO-2.34 both had to prove
that floor by mutation.

**But the floor also fires on the one edit that is entirely correct.** Retire a key — take `D` out of
`MARK_KEYS` *and* delete its row from the legend, leaving the two sides in perfect agreement — and
`bound.length` is 8, `rows.length` is 7, and the check goes **red on a correct tree**. The two
directions it exists to police are both satisfied; only the floor objects. The same is true of the
score grid.

**What that costs is the floor itself, not a morning.** The person who retires that key sees red,
reads the failure, finds the tree is right, and edits the number down. **A floor that is edited every
time it fires is a floor nobody defends** — the next reader has already been taught it is a
formality, and the pass it is guarding against is exactly the one that arrives looking like a
formality. This is the same erosion WO-3.22's `stray` line suffered in a different form: a guard that
answers the wrong question is not a guard, and a guard the procedure says to edit is on the way to
being one.

**The tension is the work, and it does not have a free answer.** A floor derived from the thing it is
guarding is vacuous again — count the legend rows and assert the bound keys match that count, and a
lost modal id empties both sides and passes. So the fix is not "make it dynamic." It is a decision
about **where an independent expected count can honestly come from**, or an admission that it cannot
and the number stays hand-maintained with the failure made legible enough that moving it is a
considered edit rather than a reflex.

**Deliverables**
- **A decision, written into the harness comment**, on whether each floor becomes an independently
  sourced count, stays a hand-maintained constant, or is replaced by a different anti-vacuity guard
  entirely — the id being *found*, the slice being non-empty, the regex having matched at all. Note
  that the third option may make the counts unnecessary rather than accurate, which would be the
  cleanest answer if it holds.
- **Whatever replaces them keeps the vacuity mutations red.** The three WO-3.22 proved and the three
  WO-2.34 proved are the regression set; a floor that is easier to move must not be easier to walk
  past.
- **A failure message that tells the reader which case they are in** — the tree drifted, or a key was
  retired and the expected count is owed a move. Today both read as the same red.
- **Both blocks**, score grid and marking screen. Not merged; WO-2.34 decided that.

**Out of scope** — merging the two blocks, retiring any actual key, rewording either legend, and
WO-2.35's separate question of *which* bindings the read can see at all. The two rows touch the same
lines and should be read together, but a floor that counts the wrong keys correctly is a different
fault from a count that is right and inconvenient.

**Acceptance**
- [ ] Retiring a key on both sides at once — removed from the binding **and** its legend row deleted,
      leaving them in agreement — leaves the check **green** on at least one of the two blocks.
      Run, not reasoned. This is the case that fails today.
- [ ] A renamed modal id, a renamed `MARK_KEYS`, and a regex that matches nothing each still turn the
      relevant check red rather than passing vacuously — run at least two of the three, on the block
      that was changed, with counts quoted.
- [ ] Both blocks carry the decision in their comment, in the words the next reader needs rather than
      a reference to this work order.
- [ ] `node tools/verify-shell.mjs` passes whole, the check count in `tools/README.md` moved in step
      if a call site was added, and `git diff --stat -- src/` is empty across the whole work order.

**Traps** — **Do not derive the floor from the list it guards.** That is the vacuity the floor exists
for, arriving through the fix. **The retire-a-key mutation must touch both sides**, or it is
WO-2.34's Acceptance line 2 again rather than this work order's line 1 — the point is a tree where
the two sides *agree* and the check still objects. **Revert every mutation before the next and
confirm it with `git diff`**, not by remembering. **Acceptance needs three or more full harness runs
at ~4.5 minutes each**, which is a routing fact before it is an implementation one.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/README.md`
  - `tools/verify-shell.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**The two blocks you are editing, and nothing else in that file.** In `tools/verify-shell.mjs` as it
stands today (line numbers move the moment you insert, so anchor on text, not on these):

- **The score-grid block**, WO-3.22's, around `:240–400`. Its floor is the line
  `bound.length >= 8 && glyphs.length >= 8 && rows.length >= 7` inside the `check()` whose name begins
  *"every key the score grid binds is on the ⌨ Keys legend"*.
- **The marking-screen block**, WO-2.34's, around `:420–580`. Its floor is
  `bound.length >= 9 && glyphs.length >= 9 && rows.length >= 8`, inside *"every key the attendance-marking
  listener answers to is on the ⌨ Keys legend"*.

Each block also carries a **second, newer `check()` from WO-2.35** — the refusal check, guarded by
`body.length > 200` rather than by a count. Those two are **not** the floors this work order is about,
but read them: they are a worked example of the third option in Deliverable #1, chosen deliberately,
by the run that landed hours before yours.

**Read these three, in this order, before you touch the file:**

1. `.claude/dispatch/WO-2.35-result.md` — landed on these exact lines this morning. Its
   § "Out of scope, held to — and one temptation declined" hands you the floors by name and says why
   it left all six numbers alone; its § "Judgment calls" explains why the anti-vacuity guard for the
   new checks is a slice-length test rather than another hand-maintained count. That is prior art for
   your decision, not a decision already taken.
2. `.claude/dispatch/WO-2.34-result.md` — the marking block's origin, and the source of three of the
   six vacuity mutations in your regression set.
3. `plans/work-orders/phase-2-attendance.md` — the **WO-2.34** and **WO-2.35** rows above yours, for
   what each already settled (two blocks not one; `stray` asks `bound`, never `Object.keys(GLYPH_OF)`).
   Neither is up for revisiting here.

**Also open:** `TESTING.md` § "Phase 2 — Attendance", whose `### WO-2.34` and `### WO-2.35` sections
are the shape yours should follow; and `tools/README.md`, both for the CDP traps section named above
and for the asserted `check()` call-site count near `:817` that Acceptance line 4 makes you move if you
add a call site.

**Three orchestrator notes:**

- **The comments in both blocks cross-reference each other by line number** (`:271-319`, `:349-355`).
  WO-2.35 had to correct two of those after its own insertions shifted the file. If your edit moves
  lines, re-check every `:NNN` reference in `tools/verify-shell.mjs` **and** in `TESTING.md`, and fix
  what drifted. A comment pointing at the wrong line is the failure mode this whole row is about.
- **The 264-second harness run is the budget.** Plan the mutation sequence before running anything —
  the Traps ask for three or more full runs, and each mutation must be reverted and the revert
  confirmed with `git diff` before the next one is applied.
- **`INVOKE_TIMEOUT_MS` and `ROUTING.md`'s missing runtime input belong to WO-2.37**, already booked.
  If you notice something about them, it is a line in your report, not an edit.

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

## 5. Done means these 4 lines, reported against one by one

1. Retiring a key on both sides at once — removed from the binding **and** its legend row deleted, leaving them in agreement — leaves the check **green** on at least one of the two blocks. Run, not reasoned. This is the case that fails today.
2. A renamed modal id, a renamed `MARK_KEYS`, and a regex that matches nothing each still turn the relevant check red rather than passing vacuously — run at least two of the three, on the block that was changed, with counts quoted.
3. Both blocks carry the decision in their comment, in the words the next reader needs rather than a reference to this work order.
4. `node tools/verify-shell.mjs` passes whole, the check count in `tools/README.md` moved in step if a call site was added, and `git diff --stat -- src/` is empty across the whole work order.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

