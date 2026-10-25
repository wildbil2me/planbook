# WO-1.86 — the two append-only checks close what one token settles · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.86-result.md` — as your last act, and return it in-band too.

**Routing.** Claude, at **Opus** (no model override): the work order is argument before code — each token must be ruled per file against the legitimate code in `src/log.js` and `src/term-record.js`, and the Traps forbid landing by symmetry — and it produces `TESTING.md` prose. That is the Claude column's judgment-trap and teacher-prose rows. Codex was set aside on the merits and on the budget: one plant per newly refused shape, each a run of its check, plus full `verify-shell.mjs` and sweep runs, will not fit a 20-minute cap.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.86 — the two append-only checks close what one token settles

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-25 · **Size** M · **Depends on** WO-1.85 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.85 made.)*

**Booked 2026-10-25**, owner-directed, the second of `TESTING.md` § WO-1.84's three
recommendations. It covers **F1** (`tools/verify/log-entries.mjs`, over `src/log.js`) and **F3**
(`tools/verify/term-record.mjs`, over `src/term-record.js`). Both make the same claim about the same
kind of writer, and WO-3.72's header says the second was copied from the first. So here symmetry is
argued rather than assumed. The worst gap is F3: it **never got WO-1.83's fixes**, so
`d.termRecords.length = 0` and `d['termRecords'] = []` both pass it.

**Deliverables**
- **Refuse, in both fences**, after arguing each token against the guarded file's legitimate code:
  - the compound-assignment family on the dotted and bracketed key (A6–A9). This is the item where
    F1's patterns disagree with F1's own argument;
  - `delete` in every key form (E2, E3). F3 already refuses a bare `delete `;
  - `.length` update expressions (C2, C4);
  - for F3 only, WO-1.83's `.length` and bracketed-key patterns (C1, C3, C5, A2–A4);
  - `Reflect.set`, `Reflect.deleteProperty` and `Object.defineProperty` by name (F3–F6);
  - `restoreDocument(` and `adoptRemoteDocument(` by name (G1–G3).
- **Name, in each fence's *fence, not a reading* line**, what is left passing:
  - computed keys (A5);
  - destructuring (A12, A13);
  - entry edits (B4–B6, E5);
  - `['splice'](` and `Array.prototype.….call` (D11, D12);
  - `Object.assign` in F1, unless the per-file argument finds no legitimate use of it in
    `src/log.js`. F3 refuses it outright today.
- **Re-run WO-1.84's probe** (its source is quoted in `TESTING.md` § WO-1.84) against both fences,
  and put the new F1 and F3 columns in `TESTING.md` § WO-1.86.
- **`TESTING.md` § WO-1.86** and the `CHANGELOG.md` entry.

**Acceptance**
- [ ] Before any token lands, `TESTING.md` § WO-1.86 records whether `src/log.js` or
      `src/term-record.js` holds a legitimate use of it. WO-1.84 did not check this.
- [ ] Each newly refused shape is planted in its guarded file and turns its check red, naming the
      remover. Every plant is reverted, and the red output is in `TESTING.md` § WO-1.86.
- [ ] WO-1.84's probe, re-run, shows every shape listed above under *Refuse* as *refused* in both
      F1 and F3. Every shape still *passes* is named in that fence's *fence, not a reading* line.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.86 carries these lines verbatim with the evidence for each.

**Traps** — **Plants go in `src/` and come out before anything else is written** (AGENTS.md, the
WO-5.1 scar), and **stage before planting**, because `git checkout` reverts unstaged work in that
file too. **A `.length` token must not fire on a read**: WO-1.83's pattern already refuses `=` only
when no `=` follows it, so reuse that rather than re-deriving it. **Rule per token, not by
symmetry**: a token both files are argued for lands in both, and one only one file is argued for
lands in that one. **Nothing in `src/` moves in the end**, so no `CACHE` bump is owed.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/log.js`
  - `src/term-record.js`
  - `tools/verify-shell.mjs`
  - `tools/verify/log-entries.mjs`
  - `tools/verify/term-record.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- **`TESTING.md` § WO-1.84** (line ~4670): the shape table (IDs A2–A13, B4–B6, C1–C5, D11–D12, E2–E5, F3–F6, G1–G3 are its row IDs) and **the probe's source**, which you re-run. Use its IDs exactly; do not renumber.
- **`TESTING.md` § WO-1.83** (line ~4587): WO-1.83's `.length` and bracketed-key patterns, the ones F3 never got. **Reuse that pattern text, including its read-vs-write discrimination** (it refuses `=` only when no `=` follows); do not re-derive it.
- **`TESTING.md` § WO-1.85** (line ~5482): the *fence, not a reading* lines it just wrote in both fences. You are amending those lines, not replacing their form.

**Orchestrator's notes — traps the work order states once and that are easy to miss:**
- **F1's compound-assignment patterns disagree with F1's own argument** (the work order says so under the first Deliverable). Read F1's comment before its regex and say in `TESTING.md` which one you corrected toward.
- **`Object.assign` in F1 is conditional**: refuse it only if `src/log.js` has no legitimate use; F3 already refuses it — leave that alone.
- **Order inside `TESTING.md` § WO-1.86 matters**: the per-file legitimacy argument is the first Acceptance line and must be written before any token lands. Write it first, and make the order visible.
- **Stage before every plant; `grep -rn MUTATION src/ tools/` must be empty before you write the result file.** A plant left behind is the WO-5.1 scar.
- **Do not widen into WO-1.87** (F2, F4–F6, § 17/§ 24 `MUTATES`, `src/contact-history.js:52`). Not a shared shape module under `tools/` either. If you see a need there, name it in the result as a follow-up.
- If `tools/README.md` records a `check()` count that your new assertions change, update it, or the sweep goes red (WO-3.26).
- The `CHANGELOG.md` entry is a draft deliverable here; write it.
- Tick the Acceptance boxes you can prove; none is 👤 or 📆.

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
- Write `TESTING.md` § <your work order>, every time: its Acceptance lines copied verbatim and the
  evidence for each. **It is a deliverable, not a permission** — the brief's § 5 names the heading,
  docs-only and process work owe one too (only a gate, whose boxes live in `gates.md`, does not), and
  `wo-gate.mjs --tick` refuses ✅ DONE without it.
- You may tick the boxes your own run closed, and update `plans/` and the rest of `TESTING.md` as
  you go. Two
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

1. Before any token lands, `TESTING.md` § WO-1.86 records whether `src/log.js` or `src/term-record.js` holds a legitimate use of it. WO-1.84 did not check this.
2. Each newly refused shape is planted in its guarded file and turns its check red, naming the remover. Every plant is reverted, and the red output is in `TESTING.md` § WO-1.86.
3. WO-1.84's probe, re-run, shows every shape listed above under *Refuse* as *refused* in both F1 and F3. Every shape still *passes* is named in that fence's *fence, not a reading* line.
4. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
5. `TESTING.md` § WO-1.86 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.86 — it is a deliverable, not a permission.** Add `### WO-1.86 — the two append-only checks close what one token settles` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.86` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

