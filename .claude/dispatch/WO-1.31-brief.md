# WO-1.31 — a 🔒 GATED work order that never says what it is gated on · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.31-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier, on `ROUTING.md` § "Route to Claude": this work order
**produces prose in the pipeline's own maintained documents** — three gate suffixes, each of which has
to compress a gate argued at length in a work order body, plus a new row in § "Header fields" — and
**its Traps are judgment, not mechanics** (do not widen to `🚧 BLOCKED`; the suffix must not be
mistaken for a date). The runner-up I set aside: the check itself is a mechanically-checkable
one-liner with a `--self-check` plant, which reads Codex-shaped, but the prose half is not delegable
and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.31 — a 🔒 GATED work order that never says what it is gated on

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-12 · **Size** S · **Depends on** — · **Blocks** nothing
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — the same call WO-1.26 through WO-1.30
made. Booked 2026-08-28, owner-directed, found when WO-7.2's lock came off.)*

**Why it exists.** `plans/work-orders/README.md` § "Header fields" states the rule and puts the
obligation on the document: **`🔒 GATED` means do not start it, and what it is gated *on* is the
work order's to say.** `wo-gate.mjs` enforces the first half in one line —

```js
if (wo.status.startsWith('🔒 GATED')) problems.push(`${wo.id} is 🔒 GATED — do not start it`);
```

— and **nothing anywhere enforces the second.** A lock with no stated gate cannot be audited, cannot
expire, and outlives the argument that put it there. `--audit` reads fragments, `Owes` pointers,
§ The files and the dashboards; it has never once asked a gated work order what it is waiting for.

**What that cost, concretely.** [WO-7.2](phase-7-sync.md#wo-72--document-transfer--conflicts) wore
`🔒` from the day Phase 7 was cut until 2026-08-28. The glyph was the phase's original blanket —
*sync stays behind a flag until it is verified* — and
[WO-3.10](phase-3-gradebook.md#wo-310--the-oauth-client-exists-and-asks-for-one-scope) demolished
that reasoning **for the whole phase** on 2026-08-11: verification gates public launch, not
development. WO-7.1 took its lock off on that argument and shipped. WO-7.2 kept one, with its single
`Depends on` ✅ DONE and no sentence in its body naming a gate — **so there was nothing to re-check
and nothing to lift it.**

It then went circular, which is how it was finally found:
[WO-3.18](phase-3-gradebook.md#wo-318--verification-submitted-) owes Google a demo video **showing
the scope in use**, and the only work order that uses the scope was the locked one. That is the
second turn of a loop WO-7.1's note records the first turn of — **the paperwork could not film a
sign-in marked do-not-start, and then could not film a file transfer marked do-not-start.**

**There is no live instance, and that is worth saying out loud.** All four gated work orders today —
WO-G2, WO-G3, WO-3.18, WO-7.3 — name their gate in their bodies, the last two as of 2026-08-28.
**This work order is a plant, not a repair.** It is booked because the failure took seventeen days to
notice, was invisible to every tool, and was found by a human reading an unrelated runbook.

**The shape to build, and why it is not a new field.** Put the gate on the **status line**, as a
suffix: `🔒 GATED — <what it waits for>`. Three statuses already take one — `✅ DONE — <date>`,
`🚫 STRUCK — <date>`, `⏳ DEFERRED — <date>` — so the grammar exists, the parser already tolerates
it (`--self-check` writes `'🔒 GATED — waiting on a fixture'` in its own fixture at
`tools/wo-gate.mjs:2227`), and § "Header fields" needs a row rather than a rewrite. A new
**Gated on** field is the alternative and is refused for the reason that table records three times.

**Traps**

- **All four gated work orders read bare `🔒 GATED` today** and will need the suffix in the same
  sitting, or the check lands red on a directory that is otherwise correct. They are WO-G2, WO-G3,
  WO-3.18 and WO-7.3; each already has the sentence in its body to copy from.
- **The suffix must not be mistaken for a date.** `✅ DONE` parses one; this does not, and whatever
  reads statuses must not start expecting one here.
- **A refusal, not a note.** The gate report already refuses a `🔒` outright, so this adds a second
  sentence to a report that is failing anyway — it costs a reader nothing and is the only way the
  omission is ever seen.
- **Do not make it retroactive to `🚧 BLOCKED`.** That status has its own vocabulary row and is not
  in scope; widening this to every non-⬜ status is how a small check becomes an M.

**Acceptance**
- [ ] A work order whose status is `🔒 GATED` with no `—` suffix is reported as a problem naming the
      § "Header fields" rule it breaks.
- [ ] `🔒 GATED — <text>` passes that check and still refuses the work order for being gated.
- [ ] WO-G2, WO-G3, WO-3.18 and WO-7.3 each carry a suffix that matches the gate already stated in
      their bodies, and `--audit` passes.
- [ ] § "Header fields" records the suffix in its `🔒 GATED` row.
- [ ] `--self-check` gains a plant for the bare-lock refusal.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/work-orders/README.md`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

### Four things verified at dispatch time — do not spend the run rediscovering them

**1. The work order's census is STALE, and this is the one thing likely to cost you time.** The body
says *"All four gated work orders today — WO-G2, WO-G3, WO-3.18, WO-7.3 — name their gate in their
bodies."* Two moves since it was booked: WO-G2 came off `🔒` in `3149bea` when the calendar landed,
and WO-7.2 shipped in `f22d863`. **The live gated set today is THREE**, confirmed by
`grep -rn 'Status\*\* 🔒 GATED' plans/work-orders/*.md`:

| Work order | File:line |
|---|---|
| WO-G3 | `plans/work-orders/gates.md:319` |
| WO-3.18 | `plans/work-orders/phase-3-gradebook.md:1421` |
| WO-7.3 | `plans/work-orders/phase-7-sync.md:354` |

Two consequences. **Your fixtures and your third Acceptance line are written against the count taken
on the day**, not against the four the body names — and the third Acceptance line reads "WO-G2,
WO-G3, WO-3.18 and WO-7.3", so say in your result file how you read a line naming a work order that
is no longer gated (WO-G2 needs no suffix because it is no longer `🔒`; do not put one on it).
**And the body's sentence wants an *(italic paren note)* recording the move** — the same treatment
WO-1.30's Traps table got when it was re-measured. Correct the prose; do not silently leave a false
census in a work order about documents that lie.

**It does not touch the argument.** There is still no live instance of the defect, it is still a
**plant and not a repair**, and the seventeen-day WO-7.2 story that motivates it is unchanged.

**2. This work order does NOT depend on WO-1.30.** `Depends on` is `—` and the gate reports
`depends nothing · PASS`. Row 16's "Pairs with row 15" in the running order is **sitting economy**
— same file, same neighbourhood — not sequence. Do not build it as a follow-up to anything.

**3. WO-1.51 is NOT in this dispatch.** The 🎒 ride-along *"the word boundary that keeps `nothing` a
sentinel"* sits in the same file and gets its own `/wo` after this one's verifier returns. Running
them together would have each clobbering the other's unstaged edits. **Out of scope — leave it
alone**, even though you will be in `tools/wo-gate.mjs` with it in view.

**4. Where the pieces are.** The one-line enforcement of the first half is
`tools/wo-gate.mjs:1036`. Statuses are listed at `:132`. `--self-check` starts at `:2517`, and two
existing fixtures already write `'🔒 GATED — waiting on a fixture'` (`:2845`, `:3885`) — so the
parser already tolerates the suffix and those two fixtures are evidence, not obstacles. The
§ "Header fields" table starts at `plans/work-orders/README.md:93`; the `🔒 GATED` suffix is a row
there, **not a new field** — the work order refuses a `Gated on` field and says the table records
that refusal three times.

### Two standing rules that bite here

- **Baseline both harnesses before you touch anything**, so you can tell what you broke from what
  was already so: `node tools/wo-gate.mjs --audit`, `--self-check`, `node tools/wo-sweep.mjs`. They
  were `PASS`, `39/39`, `41 checks 0 FAIL` on 2026-09-08.
- **`tools/README.md` carries a mutation table and a `check()` count.** A new plant changes both.
  A stale count there is the one sweep line that goes red on work being *done* rather than wrong —
  it is what a dead dispatch left behind on WO-3.26. Prove each new plant non-vacuous by mutating a
  **copy in the scratchpad**, never the tree, and record the rows.

### Out of scope, explicitly

`🚧 BLOCKED` (its own vocabulary row, and widening this to every non-`⬜` status is how an S becomes
an M) · WO-1.51 · any change to what `🔒 GATED` *does* — it still refuses outright, and this adds a
second sentence to a report that was already failing.

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

## 5. Done means these 5 lines, reported against one by one

1. A work order whose status is `🔒 GATED` with no `—` suffix is reported as a problem naming the § "Header fields" rule it breaks.
2. `🔒 GATED — <text>` passes that check and still refuses the work order for being gated.
3. WO-G2, WO-G3, WO-3.18 and WO-7.3 each carry a suffix that matches the gate already stated in their bodies, and `--audit` passes.
4. § "Header fields" records the suffix in its `🔒 GATED` row.
5. `--self-check` gains a plant for the bare-lock refusal.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

