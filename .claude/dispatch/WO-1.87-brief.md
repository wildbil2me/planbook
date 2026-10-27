# WO-1.87 — the four whole-file no-writer checks share one pattern that sees only dotted writes · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.87-result.md` — as your last act, and return it in-band too.

**Routing.** Claude Opus, on its own merits. The deciding signal is that the Traps are about
judgment — each guarded file must be *argued* against the widened pattern for legitimate code before
it lands, and the output is mostly prose (`TESTING.md` § WO-1.87, four *fence, not a reading* lines,
`tools/README.md`, a `CLAUDE.md` bullet, `CHANGELOG.md`). Runner-up set aside: Codex, since the regex
widening itself is mechanical — but the plant-and-revert rounds across four fences plus a full
`verify-shell.mjs` run do not fit the cap with room to read, and ties go to Claude.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.87 — the four whole-file no-writer checks share one pattern that sees only dotted writes

**Ship** — · **Status** 🤖 CLAIMED — 2026-10-26 · **Size** M · **Depends on** WO-1.85 · **Blocks** nothing
**Closes roadmap** *(no box. Tooling, not app — the same call WO-1.26 through WO-1.85 made.)*

**Booked 2026-10-25**, owner-directed, the third of `TESTING.md` § WO-1.84's three
recommendations. It covers **F2** (`tools/verify/contact-log.mjs`, over `src/contact-history.js`),
**F4** (`wo-sweep.mjs` § 17, `src/calendar-derived.js`), **F5** (§ 20 claim 4,
`src/merge-fields.js`) and **F6** (§ 24, `src/outreach.js` and `copyDraft()`). § 17 and § 24 share
a `MUTATES` pattern that sees only `doc.`/`d.` followed by a name, so `delete doc.events`,
`doc.events.length = 0`, `doc.events[0] = null`, `doc['events'] = []` and `.copyWithin(` all pass.
F2 searches for three words, and 47 of the 50 shapes inside its claim get past it.

**Deliverables**
- **One widened `MUTATES`**, used in identical text by § 17 and § 24. It adds bracketed root keys,
  index writes, `.length` writes, `delete`, the compound-assignment family and `.copyWithin(`.
  `restoreDocument` and `adoptRemoteDocument` go into both `WRITERS` lists.
- **F2 and F5, ruled by the owner.** Each either adopts the widened shape or narrows its words to
  what it actually searches: `update`/`push`/`splice` for F2, and named store calls plus no store
  import for F5. The orchestrator asks; the implementer does not pick.
  **Ruled 2026-10-25, the owner, before dispatch — the orchestrator does not ask again:**
  - **F2 takes neither option.** `src/contact-history.js` never binds the document to a name: all
    three uses (lines 215, 241, 270) hand `getDoc()` straight to `visibleContactsFor(`, so a
    `doc`/`d`-rooted `MUTATES` would match nothing there and look stronger without being stronger.
    F2 instead asserts that **every `getDoc()` in the file is the direct first argument of
    `visibleContactsFor(`** — the year never gets a name, which rules out nearly every shape in
    WO-1.84's table — and keeps its writer-call search. Its *fence, not a reading* line names
    what is left: a write inside `log.js`'s reader, which is F1's file, and an alias of the
    returned entries.
  - **F5 narrows its words** to the named store calls plus no store import. `src/merge-fields.js`
    reads the year as `ctx.doc.…` and `doc.…`, and the file's danger is disclosure, which claims
    1–3 and 5 already fence; claim 4 is a backstop and says exactly what it is.
- **Correct `src/contact-history.js:52`**, which says *nothing here imports the store* above a
  line-62 import of `getDoc` from it. Comment-only, so the commit may carry
  `Shell-Cache: not needed — comments only` rather than bump `CACHE`.
- **Re-word, against the widened pattern, the overclaims WO-1.85 left outside its scope** (its
  verifier, 2026-10-25): the § 17 banner's *has no writer*, the § 24 banner's *writes nothing* and
  § 24's comment above `MUTATES`, the `wo-sweep.mjs` row in `tools/README.md`, and the
  `CLAUDE.md` § Data bullet on `src/calendar-derived.js`, which WO-1.85's tick narrowed to a
  holding sentence until this one lands.
- **Name, in each fence's *fence, not a reading* line**, what is left passing:
  - writes through an alias of the root (A14, B3, B5, C5, D10), the WO-1.83 alias family;
  - computed keys;
  - borrowed prototype methods;
  - reflective calls, if the per-file argument finds a legitimate use of them in these files.
    WO-1.84 did not check this.
- **Re-run WO-1.84's probe** against F2, F4, F5 and F6, and put the new columns in
  `TESTING.md` § WO-1.87. **Print it so it runs as printed**: the copy in `TESTING.md` § WO-1.84
  no longer does, because WO-1.85 reworded F8 and the probe's F8 anchor went missing (WO-1.86's
  verifier, 2026-10-25). Fix the anchor in the copy printed here; leave § WO-1.84 as the record of
  what was run then.
- **Three under-claims in F1 and F3, folded in from WO-1.88's third verifier pass** (2026-10-26,
  the owner). These are comments and printed strings only, in `tools/verify/log-entries.mjs` and
  `tools/verify/term-record.mjs`. Those two files are outside the four fences above, and this
  bullet is the only reason this work order touches them.
  - Comments that say the checks catch less than they do: `d.log[(0)] = x` is in fact refused.
  - A title that names only the postfix `--`, where the regex also refuses `--d.log.length`.
  - *"One per writer"*, which is really a count over the whole file. That wording predates WO-1.88.

  Each is re-worded to what the pattern does. **No regex moves**, so no plant is owed.
- **`TESTING.md` § WO-1.87** and the `CHANGELOG.md` entry.

**A ruling that exists, and does not bind here.** On WO-1.88 the owner ruled *option 3*: after a
second verifier FAIL on "no title claims a spelling its patterns let pass", **name the passing class
and stop chasing it**, because each round closed exactly the spellings it was shown and a regex
cannot follow JavaScript's parentheses or comments (`TESTING.md` § WO-1.88, CR2.2). That ruling was
made for WO-1.88 only. If this work order's fourth Acceptance line fails twice the same way, the
pipeline stops and asks. It does not apply option 3 on its own authority, and it does not assume
the answer will be different.

**Acceptance**
- [ ] The owner's ruling on F2 and on F5, as recorded under Deliverables on 2026-10-25, is quoted in
      `TESTING.md` § WO-1.87 before either fence's code or prose changes, and F2's new assertion
      turns red on a planted `const year = getDoc();`.
- [ ] § 17's and § 24's `MUTATES` are byte-identical, and each guarded file was argued against the
      widened pattern for legitimate code before it landed. The argument is in `TESTING.md`
      § WO-1.87.
- [ ] Each newly refused shape is planted in its guarded file and turns its check red. Every plant
      is reverted, and the red output is in `TESTING.md` § WO-1.87.
- [ ] WO-1.84's probe, re-run, shows every shape the widened pattern covers as *refused*, and every
      shape still *passes* is named in that fence's *fence, not a reading* line.
- [ ] F1's and F3's three under-claims folded in from WO-1.88 are re-worded to what their patterns
      do, and `git diff` on the two files touches no regex, token list or `check(` condition.
- [ ] `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
- [ ] `TESTING.md` § WO-1.87 carries these lines verbatim with the evidence for each.

**Traps** — **Do not make the shape list a shared module under `tools/`.** WO-1.84 named that option
and recommended against it: each fence reads a different file with different legitimate operations,
and WO-1.83 ruled per token. § 17 and § 24 sharing one pattern *in text* is the exception, because
they were already identical. **A widened pattern can fire on legitimate code**: `src/calendar-derived.js`
builds new arrays and may index them, so an index write on a *local* is not a document write. Argue
before landing. **Check whitespace around the dot**: WO-1.86's verifier found `d . log = []` passing
F1, and a pattern that wants `doc.` or `d.` followed directly by a name probably misses
`doc . events = []` the same way. Unverified for `MUTATES` — plant it and see before ruling either
way. **Plants come out before anything else is written, and stage before planting.**
**Nothing in `src/` moves in the end but the one comment at `src/contact-history.js:52`**, so no
`CACHE` bump is owed — the commit carrying it ends with the `Shell-Cache: not needed — comments only`
trailer, or `wo-sweep.mjs` § 9 goes red.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/calendar-derived.js`
  - `src/contact-history.js`
  - `src/merge-fields.js`
  - `src/outreach.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/verify/contact-log.mjs`
  - `tools/verify/log-entries.mjs`
  - `tools/verify/term-record.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `TESTING.md` § WO-1.84 (the probe and the F1–F8 table, shape IDs A14/B3/B5/C5/D10), § WO-1.85
  and § WO-1.86 and § WO-1.88 — the precedent for how these fences were widened and worded. Print
  the re-run probe in § WO-1.87 so it runs as printed (the § WO-1.84 copy's F8 anchor is stale; fix
  it in your copy only).
- `CLAUDE.md` § Data, the `src/calendar-derived.js` bullet — WO-1.85 left it as a holding sentence
  for this work order ("WO-1.87 is booked to widen it"); re-word it to what the widened fence does.
- **Traps the orchestrator adds.** The owner's F2/F5 rulings are already made — do not ask, do not
  re-open; quote them in `TESTING.md` before changing either fence. **Stage before every plant**,
  `grep -rn MUTATION` clean before you write the result file. The commit carrying the
  `src/contact-history.js` comment ends with the `Shell-Cache: not needed — comments only` trailer.

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

## 5. Done means these 7 lines, reported against one by one

1. The owner's ruling on F2 and on F5, as recorded under Deliverables on 2026-10-25, is quoted in `TESTING.md` § WO-1.87 before either fence's code or prose changes, and F2's new assertion turns red on a planted `const year = getDoc();`.
2. § 17's and § 24's `MUTATES` are byte-identical, and each guarded file was argued against the widened pattern for legitimate code before it landed. The argument is in `TESTING.md` § WO-1.87.
3. Each newly refused shape is planted in its guarded file and turns its check red. Every plant is reverted, and the red output is in `TESTING.md` § WO-1.87.
4. WO-1.84's probe, re-run, shows every shape the widened pattern covers as *refused*, and every shape still *passes* is named in that fence's *fence, not a reading* line.
5. F1's and F3's three under-claims folded in from WO-1.88 are re-worded to what their patterns do, and `git diff` on the two files touches no regex, token list or `check(` condition.
6. `node tools/verify-shell.mjs` and `node tools/wo-sweep.mjs` pass.
7. `TESTING.md` § WO-1.87 carries these lines verbatim with the evidence for each.

**Write `TESTING.md` § WO-1.87 — it is a deliverable, not a permission.** Add `### WO-1.87 — the four whole-file no-writer checks share one pattern that sees only dotted writes` under `## Phase 1 — Shell, store, roster`, with this work order's Acceptance lines copied verbatim and the evidence for each beside it. If there is nothing to run, the section says so in two lines; a missing section cannot be told from a forgotten one, and `node tools/wo-gate.mjs --tick WO-1.87` refuses ✅ DONE without it.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

