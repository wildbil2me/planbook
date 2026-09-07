# WO-1.27 — a field name in prose is read as a field, and only half the parser knows the rule · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.27-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude at the **Opus** tier, on the work order's own merits: `ROUTING.md`
§ "Route to Claude" — *its Traps section is about judgment, not mechanics*. The deciding signal is
the "do not over-tighten" trap, which names two **regression cases, not edge cases** — a cleverer
regex is exactly what a model optimizing for clean code reaches for here, in the one parser every
gate report in this project is read from. The runner-up was **Codex**: the spec genuinely lives
outside the work order (`plans/work-orders/README.md` § "Header fields") and the whole Acceptance
list is mechanically checkable — set aside on the Claude column first, and independently on the
budget, since `tools/wo-gate.mjs` is 3,624 lines to read before writing and Acceptance line 6 wants a
~4.4-minute `verify-shell.mjs` run inside a 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.27 — a field name in prose is read as a field, and only half the parser knows the rule

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-06 · **Size** M · **Depends on** — · **Blocks** nothing; every
header block in the directory is parsed by the function this fixes
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — `wo-gate.mjs` is not a promise the roadmap
makes, the way WO-2.14, WO-2.15 and WO-1.26 are not. Booked 2026-08-25, owner-directed, found while
reading a gate report for an unrelated work order.)*

**Why it exists.** `plans/work-orders/README.md` § "Header fields" states the rule in as many words:
**a field is recognised by where it sits as much as by its name** — it must start a line of the
header block or follow a `·`, and *"the asterisks must hold nothing but capitalised words."*
**`wo-gate.mjs` enforces that in one of the two functions that need it.**

`fieldsIn()` reads the block's **lines** and applies the position rule; it is what populates
`unknownFields` and the "field nothing reads" note. `fieldRe()` — which extracts the field's
**value**, and is what every consumer actually uses — is a bare `\*\*Name\*\*\s*(.*?)` match run
against `joined`, the block collapsed into one string with the line boundaries gone. It cannot apply
a position rule because by the time it runs there are no positions left.

**What that cost, concretely.** WO-6.3's header paragraph ran straight on into an italic note with no
blank line between them, so seven lines of prose were inside the header block. The note ends:

```
here under WO-6.2's `**Owes**`.)*
```

`fieldsIn()` correctly declined to call that a field. `fieldRe('Owes', …)` matched it anyway and
captured `` `.)* `` as the value. WO-6.3 then carried a phantom **Owes** field, and because
`wo-gate.mjs:481` prints a *dependency's* `Owes` beside it, the phantom surfaced on **WO-6.4 and
WO-6.5** — two work orders that have no `Owes` field at all and never had one. It read as a
malformed field on the wrong work orders.

**The blank line is repaired and the tree is clean — do not go looking for a live reproduction.**
Fixed 2026-08-25 in the same sitting that found it, and all 138 work orders were scanned for the
same shape: WO-6.3 was the only one. **This work order is about the parser, not the document**, and
it needs a fixture.

**And nothing was watching.** `--audit` passed clean with the phantom in place, every run, because it
checks fragments, `Owes` *pointers*, § The files and the dashboards — not whether a field it read was
field-shaped in the first place. This is the same failure the § "Header fields" table already
records three times — **Amends roadmap**, **Blocks** and **Target** were each invented by a hand,
absorbed in silence, and found one at a time by a human who thought the output looked odd. That row
says a new field is *"read by nothing, and said so once per gate report."* A field name in prose is
the inverse: read by everything, and said nowhere.

**Traps**

- **`joined` is the problem, not the regex.** Making the value parse position-aware means reading it
  off `block`'s lines the way `fieldsIn()` does. A cleverer regex over `joined` cannot recover a
  boundary that was replaced by a space.
- **Do not over-tighten — bold prose inside a value must stay in the value.** § "Header fields" names
  two that break if the fix is a blanket "a value ends at the next `**`": WO-1.13's
  *see **Why it exists** below* must not end its **Closes roadmap**, and WO-1.11's
  **Not a go-live blocker.** must not end its **Depends on**. Both are regression cases, not edge
  cases.
- **`**Takes from WO-2.9**` holds a `WO-` id inside the asterisks** and is a real field. A rule of
  "capitalised words only, no digits" refuses it.
- **A field may follow a `·` mid-line** — that is the normal case for **Ship**, **Status** and
  **Size**, which share one line. Position-aware does not mean line-start-only.
- **The four refusals, the fences and the dry runs are `--self-check`'s to keep.** It stands at 18
  plants and this class is not among them, which is why the bug survived. A fix without a plant is
  the same bug waiting for the next italic note.
- **CRLF.** `parseFile` splits on `/\r?\n/` and the writers preserve terminators. A rewrite of the
  block-reading path must not start converting line endings — `wo-gate.mjs` says so at its own
  definition and WO-3.25 is the scar.

**Deliverables**

- **`fieldRe()`/`field()` are replaced by a value parse that reads the block's lines**, applying the
  same position rule `fieldsIn()` already uses: a field starts a line or follows a `·`, and a
  field-shaped token anywhere else is prose and belongs to whatever value it sits inside.
- **`fieldsIn()` and the value parse read the position rule from one place**, so the two cannot drift
  again. One predicate, used twice — this is WO-2.25's argument, the one mechanism lifted rather than
  reimplemented.
- **A gate-report note when a header block contains a field-shaped token that is *not* positional**,
  naming the line. The tree is clean today; the note is what catches the next one at the moment it is
  written rather than a week later. It is a NOTE and not a refusal — prose legitimately discusses
  field names, as this very work order does.
- **New `--self-check` plants**: a field name in prose mid-line is not read as a field; the two
  bold-prose-in-value regressions above parse unchanged; `**Takes from WO-x.y**` parses; a field
  after a `·` parses. The plant count rises and the closing summary says what the new ones cover.
- **`plans/work-orders/README.md` § "Header fields"** gains a sentence saying the position rule is
  enforced in both the name scan and the value parse, and `plans/verification-tooling.md` gains the
  scar — a rule documented in one file and half-implemented in another is the shape worth recording.

**Acceptance**
- [ ] A header block containing `` here under WO-6.2's `**Owes**`.)* `` yields **no** `Owes` value,
      and `--self-check` has a plant that fails if that regresses.
- [ ] WO-1.13's **Closes roadmap** and WO-1.11's **Depends on** parse byte-identically to today —
      quote both values before and after in the result file.
- [ ] `node tools/wo-gate.mjs --audit` passes, and every work order's parsed `Ship`, `Status`,
      `Size`, `Depends on`, `Owes`, `Blocks`, `Target`, `Closes roadmap` and `Amends roadmap` is
      **unchanged across all 139**, proved by dumping them before and after and diffing.
- [ ] `node tools/wo-gate.mjs --self-check` passes with more plants than it has today, and the new
      ones are named in its closing summary.
- [ ] A header block with a non-positional field-shaped token draws a NOTE naming the line, and no
      work order in the tree draws one today.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` are unaffected — quoted, both green.
- [ ] No file's line endings changed: `git diff --stat` shows no whole-file rewrite.

**Not in scope, and each is a decision rather than an omission.**
- **No new header fields, and no change to `KNOWN_FIELDS`.** This fixes how a field is *found*, not
  which ones exist.
- **`--audit` does not gain a refusal for this.** A NOTE is the right weight: the malformed case is
  rare, the false-positive case is prose about fields, and a refusal that fires on a work order
  discussing `**Owes**` would make this file unwriteable.
- **WO-6.3 is already repaired** and is not re-touched. The fixture carries the shape.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/verification-tooling.md`
  - `plans/work-orders/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-gate.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/wo-gate.mjs` — read `fieldsIn()` and `fieldRe()`/`field()` together before writing
  anything; the position rule you are lifting already exists in the first and the Deliverables want
  **one predicate used twice**, not a second copy of it. `:476` and `:481` are the phantom's
  print site.
- `plans/work-orders/README.md` § "Header fields" — the rule being enforced, and the source of both
  named regression values.

**Four things this brief will not repeat, because the work order says them better:**

1. **There is no live reproduction.** WO-6.3 was repaired 2026-08-25 and all 138 blocks were
   scanned. You need a **fixture**, and Acceptance line 1 names its exact text.
2. **The before/after dump is the proof, not a formality.** Acceptance line 3 wants nine fields
   across all 139 work orders diffed. Write the dumper, run it before you touch the parser, keep the
   output.
3. **`--self-check` plants are a Deliverable, not a nicety.** It stands at 18 and this bug class is
   not among them, which is why it survived. Four new plants are named; the closing summary must say
   what they cover.
4. **The NOTE is a note.** Prose legitimately discusses field names; a refusal would make the
   phase files unwriteable.

**Scope fence.** Do not add a header field, do not touch `KNOWN_FIELDS`, do not re-touch WO-6.3, and
do not convert a line ending (WO-3.25 is the scar; check `git diff --stat` for a whole-file rewrite
before you report).

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

## 5. Done means these 7 lines, reported against one by one

1. A header block containing `` here under WO-6.2's `**Owes**`.)* `` yields **no** `Owes` value, and `--self-check` has a plant that fails if that regresses.
2. WO-1.13's **Closes roadmap** and WO-1.11's **Depends on** parse byte-identically to today — quote both values before and after in the result file.
3. `node tools/wo-gate.mjs --audit` passes, and every work order's parsed `Ship`, `Status`, `Size`, `Depends on`, `Owes`, `Blocks`, `Target`, `Closes roadmap` and `Amends roadmap` is **unchanged across all 139**, proved by dumping them before and after and diffing.
4. `node tools/wo-gate.mjs --self-check` passes with more plants than it has today, and the new ones are named in its closing summary.
5. A header block with a non-positional field-shaped token draws a NOTE naming the line, and no work order in the tree draws one today.
6. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` are unaffected — quoted, both green.
7. No file's line endings changed: `git diff --stat` shows no whole-file rewrite.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

