# WO-2.39 — four line references in tools/README.md have been wrong for thousands of lines · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-2-attendance.md`
**Report to** `.claude/dispatch/WO-2.39-result.md` — as your last act, and return it in-band too.

**Routing decision.** This routed to **Claude, Opus tier**, on its own merits rather than by
fallback. The deciding signal is that the two hardest deliverables have no answer to look up —
`tools/README.md:1869` and block B's `markKeys` pointer are both explicitly unresolved, and the work
order says in as many words that an honest "this referred to X, which is gone" beats a plausible
number; the sweep-or-don't-sweep call and the text-anchoring note are the same shape, judgment and
prose rather than a mechanical edit. The runner-up consideration set aside: it is size `S`, touches
only documentation and one comment, and `wo-sweep.mjs` already asserts a cross-file number, all of
which reads Codex-shaped — but a runner optimizing for a clean diff would answer the unresolved
pointers with a number that looks right, which is precisely the failure this row exists to end.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-2.39 — four line references in tools/README.md have been wrong for thousands of lines

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-17 · **Size** S · **Depends on** nothing · **Blocks** nothing
**Closes roadmap** *(no box. Documentation, not app.)*

**Not a go-live blocker.** Booked 2026-08-16 out of WO-2.36's verification, which audited the
reference drift in the direction nobody had checked.

**Why it exists.** `tools/README.md` carries `:NNN` pointers into `tools/verify-shell.mjs`, and four
of them do not land. They were **already wrong at HEAD before WO-2.36**, by roughly 3,200–3,500 lines
each, so this is inherited debt rather than any one row's doing:

| Reference | Cited | Actually at |
|---|---|---|
| `else check(` | `:10773` | `:14286` |
| the WO-3.5 fixture guard | `:12532` | `:16304` |
| the `wo38-s1` Ashdown fixture | `:17574` | `:21372` |
| `:1869` | `:1869` | *unresolved — find what it meant* |

**The right-hand column was re-resolved 2026-08-17, and two of the three had been wrong in a second
way.** WO-2.38 inserted ~297 lines above all three, so every number in it was stale again within a
day of being written — but shifting them by 297 would have preserved an error rather than fixed one.
`:15996` was inside the WO-3.5 fixture's plant block, eleven lines above the `check('the WO-3.5
fixture is real…')` the reference actually names, and `:21064` was the `categories:` line of the
fixture rather than `wo38-s1` Ashdown. Both were close enough to look right and land a reader in the
neighbourhood instead of on the thing. So these three are resolved **to the named referent**, freshly
grepped, which is this row's own trap applied to the table that exists to hold the right numbers.
`else check(` is unambiguous — there is exactly one in the file.

**A fifth pointer, in a different file, added to this row 2026-08-17 — the heading still says four
because four is the count of `tools/README.md` pointers, and this one is in the harness.** WO-2.38's
implementer found it on the way past and left it alone, which was the right call, since guessing was
the only alternative. `tools/verify-shell.mjs:595` (block B) says *"`markKeys` is read FILE-WIDE out
of src/shell.js (`:611`)"*, and nothing at `:611` in either file is that read:

| Reference | Cited | Actually at |
|---|---|---|
| block B's `markKeys` read | `src/shell.js:611` | *unresolved — `MARK_KEYS` is at `src/shell.js:1617`, and `src/shell.js:611` is prose inside an unrelated function* |

Read the other way — as the harness's own line — it is no better: that read was at
`tools/verify-shell.mjs:623` before WO-2.38 and is at `:647` now, so whichever was meant had already
rotted. **This is the same judgment `:1869` needs, in a second file**, which is why it belongs to this
row rather than to a quiet fix inside somebody else's commit. It is also the sharper argument for the
sweep question below: this one sits in a comment whose whole subject is that a mitigation cited for a
case it does not cover is worse than none.

**Why it is worth a row rather than a quiet fix.** The suite keeps taking the same wound: WO-2.35 had
to re-point two cross-references after its own insertions moved them, WO-2.36 re-pointed six more,
and **WO-2.36's entire thesis is that a comment pointing at the wrong line is a defect** — while the
row itself added 145 lines to this file's drift without touching it. A pointer that is off by three
thousand lines does not read as stale; it reads as a pointer, and the reader who follows it lands in
unrelated code and concludes they have misunderstood the document. That is worse than no pointer.

**The fourth one is the interesting one.** `:1869` has no obvious referent, which means the honest
deliverable may be "this pointed at something that no longer exists, and here is what it should say
instead" rather than a corrected number.

**Deliverables**
- **The four references corrected**, or replaced with something that does not rot where no correct
  number exists.
- **A decision on whether this should be swept mechanically.** `wo-sweep.mjs` already asserts one
  cross-file number (the `check()` call-site count against `tools/README.md`), so the precedent for
  a standing check exists. A sweep that resolves `tools/README.md`'s `:NNN` claims against the file
  they point into would end this class of drift rather than paying it down once. **Either answer is
  acceptable** — build it, or write down why the hand-maintained version is the right cost — but the
  question gets answered rather than left.
- **A note on anchoring by text instead of by line**, which is what several comments in
  `verify-shell.mjs` already do and what makes them survive insertion.

**Out of scope** — the `:NNN` references *inside* `tools/verify-shell.mjs` and inside `TESTING.md`,
which WO-2.36's verification checked and found landing correctly — **except block B's `markKeys`
pointer named above**, carved in by name because that audit missed it, and by name rather than by
reopening the whole set. Re-auditing the rest is not this row. Also out of scope: renumbering or
restructuring `tools/README.md`.

**Acceptance**
- [ ] Each of the four references resolves to what it claims, or says something that cannot go stale,
      with the reasoning recorded for any that could not be resolved.
- [ ] The fifth reference — block B's `markKeys` pointer in `tools/verify-shell.mjs` — is corrected or
      replaced with something that cannot rot. An honest "this cannot be established, and here is what
      the comment should say instead" closes this line; a plausible number nobody resolved does not.
- [ ] A spot-check of at least six other `:NNN` references in `tools/README.md` is reported —
      whether they land or not — so the size of the remaining debt is known rather than assumed.
- [ ] The sweep question is answered in writing, and if a check was built it is demonstrated failing
      on a deliberately wrong reference before it is demonstrated passing.
- [ ] `node tools/wo-sweep.mjs` green, `git diff --stat -- src/` empty.

**Traps** — **Line numbers move while you work.** Fix the references last, after every insertion this
row makes is final, and re-resolve each one immediately before reporting rather than trusting a
number read earlier in the session. **Do not fix these by deleting the pointers**; the pointer is
carrying real information and a reader wants it. **`:1869` may not have an answer** — an honest "this
referred to X, which is gone" beats a plausible number nobody verified.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `src/shell.js`
  - `tools/README.md`
  - `tools/verify-shell.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Also open, and specific to this row:

- `plans/verification-tooling.md` — why the harness is shaped the way it is. If you answer the sweep
  question by **building** a check, this is the file whose reasoning it has to sit inside, and if you
  answer it by declining, this is where the "why the hand-maintained version is the right cost"
  argument belongs alongside `tools/README.md`.
- `tools/wo-sweep.mjs`'s existing cross-file assertion — the `check()` call-site count validated
  against `tools/README.md`. That is the named precedent in the Deliverables; read how it is written
  and how it reports before deciding whether a `:NNN` resolver belongs beside it. Note the shape of
  the existing check: it asserts a *count*, which cannot be satisfied by a wrong-but-plausible value.
- `git log --oneline -6` and the commit `820f41c Re-resolve WO-2.39's line references to what they
  name` — that commit is why the work order's right-hand column is fresh as of today. It is **not** a
  substitute for re-resolving: the Traps require you to re-grep every number immediately before you
  report, because your own insertions into `tools/README.md` may move nothing but your insertions into
  `tools/verify-shell.mjs` (if you build a check, or edit block B's comment) will.

Two notes on how to work this one:

- **Two of the five pointers may legitimately end as prose rather than numbers.** That is a stated
  acceptable outcome, not a shortfall, and it is the outcome the work order predicts for `:1869` and
  for block B. What is not acceptable is a number you inferred, rounded, or shifted by a delta. If you
  cannot grep it and land on the named thing, say you could not, and say what the comment should read
  instead.
- **Read the block B pointer both ways before you decide.** The work order already checked
  `src/shell.js:611` (unrelated prose; `MARK_KEYS` is at `:1617`) and the harness-relative reading
  (`tools/verify-shell.mjs:623` pre-WO-2.38, `:647` now). Both were already rotten. Do not simply
  adopt one of those numbers — the comment's subject is that a mitigation cited for a case it does not
  cover is worse than none, so the fix has to be something that survives the next insertion.

**On the two verification commands.** Acceptance line 5 names only `node tools/wo-sweep.mjs` plus an
empty `git diff --stat -- src/`, and that is what this row is graded on. Run `verify-shell.mjs` if it
runs in your environment — a green run is worth having — but it usually cannot run in a sandboxed
dispatch, and "could not run" is a report about the environment, not a result. Say which happened
rather than inferring either way. If you build a sweep check, its demonstration-failing evidence is
your own transcript of it failing on a deliberately wrong reference and then passing after the
reference is restored; paste both, and confirm you restored the tree.

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

1. Each of the four references resolves to what it claims, or says something that cannot go stale, with the reasoning recorded for any that could not be resolved.
2. The fifth reference — block B's `markKeys` pointer in `tools/verify-shell.mjs` — is corrected or replaced with something that cannot rot. An honest "this cannot be established, and here is what the comment should say instead" closes this line; a plausible number nobody resolved does not.
3. A spot-check of at least six other `:NNN` references in `tools/README.md` is reported — whether they land or not — so the size of the remaining debt is known rather than assumed.
4. The sweep question is answered in writing, and if a check was built it is demonstrated failing on a deliberately wrong reference before it is demonstrated passing.
5. `node tools/wo-sweep.mjs` green, `git diff --stat -- src/` empty.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

