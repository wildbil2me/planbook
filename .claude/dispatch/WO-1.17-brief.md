# WO-1.17 — the backup nag cannot see a year whose only content is grades · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.17-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at the **Opus** tier: this work order edits `hasSomethingToLose()` in
`src/backup.js`, and backup-and-restore is a named sensitive surface in `ROUTING.md` § "Route to
Claude" and in the orchestrator's standing never-delegate list — so it is not Codex-eligible whatever
its size. The runner-up I set aside: at Size `S`, with an Acceptance list that is almost entirely
fixture-checkable, the first deliverable reads Codex-shaped — but the second one asks you to *invent*
a mechanism that makes the next omission loud, which is a design decision and not a written spec, and
that is the half this dispatch is really for. No Codex probe was run; that step applies only on the
Codex route.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.17 — the backup nag cannot see a year whose only content is grades

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-15 · **Size** S · **Depends on** —
**Closes roadmap** Phase 1 → *(no box. A latent defect in code Phase 1 shipped, found on 2026-08-12
by the WO-1.15 verifier while reading `src/backup.js` for a different reason.)*

**Why it exists.** `hasSomethingToLose()` (`src/backup.js:1055`) decides whether the backup nag is
allowed to appear, and it does it by enumerating collections: `classes`, `students`, `assignments`,
`attendance`, `log`, `events`, `templates`. **`scores`, `passes` and `openPasses` are not on that
list.** The nag is the one thing standing between a teacher and the iOS eviction described in
`CLAUDE.md`, and it stays silent on any document whose content lives only in the three it cannot see.

**It is masked today, and that is the argument for booking it rather than watching it.** Score cells
cannot exist without an assignment to hang them on, so `count(doc.assignments)` fires first and the
nag appears anyway — the omission is invisible precisely because a second field happens to be doing
its job. It stops being invisible the moment a document can hold scores with no assignment: an
assignment deleted while its column is kept, an import, a partial restore. The failure is silent, it
is about the only copy of a term of grades, and the code reads correct.

**The same shape as WO-1.15**, one screen over. That work order fixed a panel that counted the roster
and not the record; this is the nag counting most of the record and not the rest.

**Deliverables**
- **`hasSomethingToLose()` sees score cells and both hall-pass collections.** Scores go through
  `countScores()` (`src/backup.js:112`), which WO-1.15 added for exactly this reason; `passes` and
  `openPasses` are arrays and `count()` is right for them.
- **The enumeration gains whatever makes the next omission loud** rather than silent — the point of
  failure is that a list of collection names has to be kept in step with `docs/data-model.md` by
  hand, and nothing today notices when it is not.

**Out of scope** — when the nag is evaluated (boot, backup, restore, year switch — that list is
correct and reasoned at the call sites); the wording of the nag; the compare panel, which is
WO-1.15's and is done.

**Acceptance**
- [ ] A document holding score cells and **no** assignments raises the nag. *(The masked case, made
      unmasked — this is the check that fails against today's build.)*
- [ ] A document whose only content is a hall pass — open or closed — raises the nag.
- [ ] A brand-new document still does **not** raise it. A year and a letter scale are not something
      a teacher typed, and a nag on day one is wallpaper by October — the rule the current comment
      states and which must survive the fix.
- [ ] `verify-shell.mjs` gains checks proved against a fixture where the omitted collection is the
      **only** content, so a check that would go green against the current build is not written.
- [ ] The collection list is checked against `docs/data-model.md` rather than against memory, and the
      way it is checked is written down.

**Traps** — **`count(doc.scores)` is 0 for a full gradebook.** `scores` is an object keyed by
assignment then student, not an array, and `count()` answers 0 — the exact trap WO-1.15 documented at
`countScores()` and the reason that helper exists. Adding `count(doc.scores)` to the sum looks like
the fix, changes nothing, and closes the work order. **Do not widen the nag into "anything non-empty"**
— a document is never empty, and that is what the current comment is defending against.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/backup.js`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and each for a stated reason:

- **`plans/work-orders/phase-1-shell-store-roster.md:888`, WO-1.15** — the sibling work order this
  one is explicitly "the same shape as." It is done, it added `countScores()`, and it already made
  the argument about a panel that counts most of the record. Read how it solved its half before
  solving this one differently; if you depart from its approach, say why in a comment at the point of
  departure.
- **`src/backup.js:105–119`** — `count()` and `countScores()`, and the comment block above
  `countScores()` that spells out the `scores`-is-not-an-array trap. This is the Traps section of
  your own work order, already written down in the code.
- **`src/backup.js:1055`, `hasSomethingToLose()` itself, and its comment** — the comment states the
  day-one rule that Acceptance line 3 protects. That rule survives the fix. A rewrite that loses the
  comment loses the reasoning, which is the failure mode this project cares most about.
- **`docs/data-model.md`, the year-document collections** — the top-level shape, and § "Hall passes
  are two collections, and neither of them is `log`" (~line 214) for why `openPasses` and `passes`
  are separate and why either alone is real content worth nagging about. Acceptance line 5 says the
  collection list is checked **against this file**, not against memory — so whatever mechanism you
  build for deliverable 2, this document is the source of truth it reconciles against.
- **`tools/verify-shell.mjs`** — find how existing backup/nag fixtures are constructed and follow
  that pattern rather than inventing a second one. Acceptance line 4 has a sharp edge: a check is
  only evidence if it **fails against today's build**. Prove each new check red before you make it
  green, and report that you did, per check.

One judgment call is genuinely yours, and it is deliverable 2. "Whatever makes the next omission
loud" is deliberately unspecified — a runtime assertion, a harness check that reconciles the
enumeration against the documented collections, a single derived list with one place to edit, or
something else. Pick one, and write down in the code or in `tools/README.md` **why that one** and
what it would and would not have caught. `wo-sweep.mjs` and `verify-shell.mjs` are the two harnesses
this project has; do not write a third.

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

## 5. Done means these 5 lines, reported against one by one

1. A document holding score cells and **no** assignments raises the nag. *(The masked case, made unmasked — this is the check that fails against today's build.)*
2. A document whose only content is a hall pass — open or closed — raises the nag.
3. A brand-new document still does **not** raise it. A year and a letter scale are not something a teacher typed, and a nag on day one is wallpaper by October — the rule the current comment states and which must survive the fix.
4. `verify-shell.mjs` gains checks proved against a fixture where the omitted collection is the **only** content, so a check that would go green against the current build is not written.
5. The collection list is checked against `docs/data-model.md` rather than against memory, and the way it is checked is written down.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

