# WO-1.29 — the Owes field on WO-4.3 names no work order, and nothing notices · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.29-result.md` — as your last act, and return it in-band too.

**Routing decision.** Routed to **Claude, Opus tier, on the work order's own merits** — not a
fallback, and no Codex probe was run. The deciding signal is `ROUTING.md` § "Route to Claude"
bullets 4 and 5: two of the five Deliverables are project prose in suite voice (the
`README.md` § "Header fields" clause and the `plans/verification-tooling.md` scar paragraph), and
the Traps are judgment rather than mechanics — chiefly the shared "value parses to zero IDs"
predicate over `Owes` and `Depends on`, which is the clean factoring and refuses about thirty
legitimate work orders including the three written to repair this family. The runner-up I set
aside: Size S, bare Node, no UI, mechanically checkable Acceptance — genuinely Codex-shaped on the
first four Codex bullets, and set aside because it edits the gate tool this pipeline runs on.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.29 — the Owes field on WO-4.3 names no work order, and nothing notices

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-07 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — `wo-gate.mjs` is not a promise the roadmap
makes, the way WO-1.26, WO-1.27 and WO-1.28 are not. Booked 2026-08-27, owner-directed, found by
WO-1.28's verifier while reading WO-4.3's header for an unrelated reason.)*

**Why it exists.** `plans/work-orders/README.md` § "Header fields" is unambiguous about this one
field: it is **"the one field here that is acted on rather than only reported"**, it is
*"present exactly when a line has been moved, absent everywhere else"*, and *"each named ID must be
pointed at by a `- [ ] … → WO-x.y` line below."* **WO-4.3 carries it with no ID in it, no line moved,
and no marker anywhere below.** It reads:

```
the real-data box (Acceptance line 3) — and nothing else; the 👤 sitting is green, 2026-08-25
```

That is a true and useful sentence. It is not a field, and it is sitting in the one slot the parser
treats as machine-readable.

**What that costs, concretely.** `rehomesOf()` extracts the named work orders with a single match at
`tools/wo-gate.mjs:582` *(:425 when this was booked; WO-1.27 moved it on 2026-09-07 without touching
it)*:

```js
const named = [...new Set((wo.owesRaw.match(/WO-[\dG][\w.]*/g) || []))];
```

Against WO-4.3's value that returns `[]`. `pointed` is `[]` too. Both cross-check loops — the one
that catches a field naming a work order no line points at, and the one that catches a line pointing
somewhere the field does not name — iterate **zero times**. The field is read, found to contain
nothing, and reported clean. **A check that cannot fail on the input it was written for is not a
check**, and this is the second one this directory has found in three days.

**And the audit prints the discrepancy without seeing it.** The section skips a work order only when
it has neither a field nor a marker (`tools/wo-gate.mjs:1976`, `:1571` when booked), so WO-4.3 is counted into
`withOwes`; the rows are printed per marker, so it prints none. Today's run says, in full:

```
  ok   WO-G2    [ ] → WO-3.18   WO-3.18 OAuth paperwork **submitted**, with the date re…
  ok   WO-2.31  [ ] → WO-2.33   👤 **RUN 2026-08-16 — FAILED, and left unticked deliber…
  ok   WO-6.1   [ ] → WO-6.4   A grades-due event warns at its configured lead time.

  4 work order(s) with a **Owes** field or a "→" marker, 3 pointer(s) resolving, 0 problem(s)
```

**Four counted, three shown, nought wrong.** The missing row is the whole defect, printed every run
since 2026-08-24 and read by nobody, because a summary line that says `0 problem(s)` is where a
reader stops.

**It is also now redundant, which is what makes it cheap to remove.** The sentence exists to say
*this work order landed with one box open and here is which one*. Since WO-1.28 that box carries 📆 at
`plans/work-orders/phase-4-signals.md:257`, which says the same thing **in the place a tool looks** —
`--tick` refuses it, `WO-4.5`'s gate report names it, and `WO-G3` refuses on it. The header sentence
is a second statement of a fact the line now carries itself, and § "Header fields" already records
what happens to those: they rot apart.

**This is WO-1.27's family and not its duplicate.** WO-1.27 is about how a field is **found** — a
field name in prose read as a field. This is about what a found field is allowed to **contain**. The
two are orthogonal and neither blocks the other, but they touch the same neighbourhood; see Traps.

**Traps**

- **Do not write a bold `Owes` inside this work order's own header block.** *(Rewritten 2026-09-07:
  WO-1.27 landed first and the reason inverted.)* When this was booked, `fieldRe()` matched a field
  name anywhere in the collapsed block, so a work order *about* this field could give itself a
  phantom one and the audit would report the defect on the work order written to fix it. `fieldRe()`
  is gone — `positionalFields()` is the sole holder of the rule — so a bold `**Owes**` in prose is
  no longer read as a field at all; it draws WO-1.27's NOTE instead. **The instruction stands and
  the risk is smaller**: keep it out of the header block, and expect a NOTE naming the line rather
  than a phantom field if it goes anywhere else. This heading says `Owes` unbolded for the original
  reason and there is no cause to change it. Body prose after a blank line is safe; WO-1.28's body
  carries it a dozen times and parses clean.
- **Do not generalise the refusal to `**Depends on**`.** WO-1.30 below is this defect one field over
  and its answer is **not** the same one: zero-IDs-plus-prose is illegitimate in every case for
  `Owes` and legitimate in about thirty for `Depends on`, which is the whole of why that row is an M
  and this one an S. A shared "value parses to zero IDs" predicate over both fields is the tempting
  factoring, and it refuses correct work orders — including the three written to repair this family.
  Constrain `owesRaw` and nothing else. *(Added 2026-09-07: WO-1.30's gates cleared when WO-1.27
  landed, so both rows are buildable now and a reader of this neighbourhood meets them together.)*
- **Removing WO-4.3's field makes the symptom vanish whether or not the tooling changed.**
  `4 counted, 3 shown` becomes `3 counted, 3 shown` on the document fix alone. **A clean audit after
  both changes is therefore not evidence the refusal works** — the plants are the only proof. That
  is this work order's own "a check that cannot fail on the input it was written for" arriving one
  level up, against the person building it.
- **A refusal here, not a NOTE, and the argument is not WO-1.27's.** WO-1.27 chose a NOTE because
  prose legitimately discusses field names and a refusal would make this file unwriteable. That does
  not apply: this field is positional and real, and § "Header fields" says a value with no ID in it
  is wrong **in every case**, with no legitimate reading. Once WO-4.3's is removed nothing in the
  tree trips it.
- **`--tick` must refuse on it too, and that is the point rather than a side effect.** The field is
  cross-checked in both directions at tick time; an empty one currently passes that gate silently.
- **Removing the field must not lose the sentence.** "The 👤 sitting is green, 2026-08-25" is
  evidence, and it is the only place in the tree that records it. It moves into WO-4.3's body prose,
  where a reader looks for it and no parser does.
- **Do not touch 📆, `calendarHold()` or the fences.** WO-1.28 landed 2026-08-26 and is not reopened
  here. This work order reads that mark as *already carrying the fact* and removes the duplicate.
- **`--self-check` writes synthetic work orders into a copy of `plans/`.** A plant for this class
  needs a header whose field holds prose with no ID — which is a header the *other* plants must not
  accidentally match. Check the two existing fixtures before adding a third.

**Deliverables**

- **`rehomesOf()` refuses a field that parses to zero IDs.** A non-empty value from which
  `/WO-[\dG][\w.]*/g` extracts nothing is a problem, worded so the fix is obvious: name the work
  order carrying the line, or take the field off and say it in prose.
- **The audit's section prints a row for every work order it counts.** A work order with a field and
  no marker gets a line of its own rather than vanishing between the rows and the tally — so
  `4 work order(s) … 3 pointer(s)` can never again be the only trace of a defect.
- **WO-4.3's header loses the field**, and the sentence it carried moves into that work order's body
  beside the 📆 line, which is where the same fact is now enforced.
- **New `--self-check` plants**: a field holding prose with no ID is caught; a field naming a real
  work order with a matching marker still passes; a work order with no field and no marker is still
  skipped rather than flagged. The plant count rises and the closing summary names the new ones.
- **`plans/work-orders/README.md` § "Header fields"** gains a clause on that row saying a value from
  which no ID parses is refused, and `plans/verification-tooling.md` gains the scar — *a cross-check
  whose input is a list can pass by being handed an empty one* is the general shape, and it is worth
  one paragraph beside WO-1.28's.

**Acceptance**
- [ ] A header field holding prose with no work-order ID is refused by `--audit`, naming the work
      order and the file line, and `--self-check` has a plant that fails if that regresses.
- [ ] `node tools/wo-gate.mjs --tick` refuses a work order whose field parses to zero IDs. Output
      quoted.
- [ ] The audit's section prints one row per counted work order — the printed rows and the
      `N work order(s)` tally agree on every run. Quote the section before and after.
- [ ] WO-4.3 no longer carries the field, its body records the 2026-08-25 👤 sitting, and
      `node tools/wo-gate.mjs WO-4.3` still reports the 📆 line exactly as it does today.
- [ ] `node tools/wo-gate.mjs --audit` passes, and every work order's parsed `Ship`, `Status`,
      `Size`, `Depends on`, `Blocks`, `Target`, `Closes roadmap` and `Amends roadmap` is unchanged
      across all 169 — dump before and after and diff. *(141 when booked; take the count from the
      tree on the day rather than from this line.)*
- [ ] `node tools/wo-gate.mjs --self-check` passes with more plants than it has today — 35 as of
      2026-09-07 — and the new ones are named in its closing summary.
- [ ] This work order's own header parses with **no** field of the kind it is about — `--audit`
      reports nothing against WO-1.29 itself.
- [ ] `node tools/wo-sweep.mjs` is unaffected — quoted, green. `verify-shell.mjs` is not touched by
      this work order and does not need re-running; say so rather than quoting a stale run.
- [ ] No file's line endings changed: `git diff --stat` shows no whole-file rewrite.

**Not in scope, and each is a decision rather than an omission.**
- **The field is not widened to carry prose alongside an ID.** A field that means two things is the
  rot § "Header fields" exists to prevent; the prose goes in the body.
- **No new header field, and no change to `KNOWN_FIELDS`.** This constrains a value, not the set.
- **WO-1.27 is not done here and is not a dependency.** *(Settled 2026-09-07: WO-1.27 landed first,
  so this is the one that rebases.* `fieldRe()` *is gone and* `positionalFields()` *hands*
  `rehomesOf()` *the same string it always got — the value this work order constrains is untouched
  by that landing. It is still not a dependency and this row's gates were clear before it.)* Both
  are small and neither changes what the field *means*.
- **The 📆 mechanism is not reopened.** WO-1.28 is done and this work order depends on its output
  being correct, not on its code changing.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/verification-tooling.md`
  - `plans/work-orders/README.md`
  - `plans/work-orders/phase-4-signals.md`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four things to have open, and one thing not to trust.**

- **`tools/wo-gate.mjs` — read the tree, not the work order's line numbers.** WO-1.27 landed
  earlier today (commit `a1698c2`, *"Read a header field's value by position, not by name"*) and
  moved every line this work order cites; the text already carries one correction of its own
  numbers and may need a second. `fieldRe()` is gone. `positionalFields()` is now the sole holder
  of the find-a-field rule and hands `rehomesOf()` the same string it always got — the value you
  are constraining is untouched by that landing, which is why this row was buildable without it.
- **`plans/work-orders/README.md` § "Header fields"** — the spec you are enforcing, and the file
  one Deliverable edits. Quote its own words back in the refusal wording where you can; the whole
  argument for a refusal rather than WO-1.27's NOTE is that this field has no legitimate
  zero-ID reading.
- **`--self-check` and its existing plants** — a Traps line tells you to read the two existing
  fixtures before adding a third, because your new plant's header must not be matched by theirs,
  nor theirs by yours. That interaction is the likeliest way this work lands green and wrong.
- **`plans/verification-tooling.md`** — WO-1.28's paragraph is the model for the length and voice
  of the scar you are adding beside it.

**The trap the work order aims at you personally.** Removing WO-4.3's field makes `4 counted, 3
shown` become `3 counted, 3 shown` on the document fix alone, so **a clean `--audit` after both
changes is not evidence the refusal works** — the `--self-check` plants are the only proof, and a
plant that would pass against unmodified code is this work order's own defect one level up. Prove
each new plant bites, and say in your report how you established it.

**Scope.** `Owes` only. Do not touch `Depends on`, `KNOWN_FIELDS`, what `**Owes**` means, 📆,
`calendarHold()`, or WO-1.30's territory. `verify-shell.mjs` is not touched by this work order —
say so in your report rather than quoting a stale run.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

1. A header field holding prose with no work-order ID is refused by `--audit`, naming the work order and the file line, and `--self-check` has a plant that fails if that regresses.
2. `node tools/wo-gate.mjs --tick` refuses a work order whose field parses to zero IDs. Output quoted.
3. The audit's section prints one row per counted work order — the printed rows and the `N work order(s)` tally agree on every run. Quote the section before and after.
4. WO-4.3 no longer carries the field, its body records the 2026-08-25 👤 sitting, and `node tools/wo-gate.mjs WO-4.3` still reports the 📆 line exactly as it does today.
5. `node tools/wo-gate.mjs --audit` passes, and every work order's parsed `Ship`, `Status`, `Size`, `Depends on`, `Blocks`, `Target`, `Closes roadmap` and `Amends roadmap` is unchanged across all 169 — dump before and after and diff. *(141 when booked; take the count from the tree on the day rather than from this line.)*
6. `node tools/wo-gate.mjs --self-check` passes with more plants than it has today — 35 as of 2026-09-07 — and the new ones are named in its closing summary.
7. This work order's own header parses with **no** field of the kind it is about — `--audit` reports nothing against WO-1.29 itself.
8. `node tools/wo-sweep.mjs` is unaffected — quoted, green. `verify-shell.mjs` is not touched by this work order and does not need re-running; say so rather than quoting a stale run.
9. No file's line endings changed: `git diff --stat` shows no whole-file rewrite.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

