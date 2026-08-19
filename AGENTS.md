# AGENTS.md

**Read [`CLAUDE.md`](CLAUDE.md) first — it is the real briefing.** This file exists because Codex
and other agents look for `AGENTS.md` by name; everything of substance is in `CLAUDE.md`, and the
two must never drift apart. If you change a rule, change it there.

Planbook is a local-first PWA gradebook for classroom teachers. No account, no backend, no
dependencies.

## The rules that get broken by accident

- **No dependencies, no framework, no bundler, no linter, no test framework.** No `package.json`,
  ever — not "just for scripts." Anything scripted lives in `tools/*.mjs` under bare Node.
- **Colors inline, not CSS variables.** This reads like a mistake and is not. Don't tidy it.
- **No dark mode.** No `prefers-color-scheme`, no `[data-theme]`, anywhere.
- **44px minimum** for every control, in the `@media (pointer: coarse)` block.
- **`localStorage` prefix `planbook_`, UI preferences only** — never student data. Student data
  lives in IndexedDB.
- **Accommodation, medical, and plan data never leaves the roster.** No merge field resolves it, no
  log line prints it, no export emits it. The one exception is the JSON backup, whose own UI says so.
- **`drive.file` is the only OAuth scope.** Not `spreadsheets`, not a mail scope. Outreach goes out
  via `mailto:`.
- **No backend, no Apps Script.** Both were considered and rejected; `CLAUDE.md` has the reasoning.

## Data invariants

- **`late` and `missing` are teacher-marked, never inferred from a due date.** Blank means ungraded
  and affects nothing. A grade must never change because a date rolled over. The date may still
  **ask**: `src/past-due.js` (WO-3.6) offers to mark past-due blanks missing and writes only what the
  teacher accepts. It is the one place the clock may be read, and `excused` and a scoreless `late`
  are never in the set. Do not widen it, and do not add a second reader of the date.
- **Empty categories redistribute their weight.**
- **An absent threshold key IS its default** (WO-4.1). `signals` holds only what the teacher has
  changed, and *Put every threshold back* **deletes** the keys rather than writing today's numbers
  into the year — otherwise a default re-tuned in a later build never reaches anyone who once
  pressed reset. Read a threshold through `thresholdsOf()`, never off `doc.signals` directly.
- **A settings block is created by its first write, never seeded** (WO-6.1). The rule above is
  general: `newYearDocument()` returns no `calendar` block, and `leadDaysOf()` defaults when the
  key is absent. Seeding one as an empty object makes `parseBackup()` refuse **every backup written
  by every earlier build** — it validates against the shape `newYearDocument()` returns. Do not
  answer that with a `SCHEMA_VERSION` bump.
- **A signal rule is handed its own measured numbers and nothing else** — not the document, not the
  clock, not the threshold it just crossed. That is what makes an explanation unable to drift from
  the arithmetic behind it, and what keeps accommodation, medical and plan data out of a sentence
  that Phase 5 mails home. A new rule must not need a new explanation mechanism.
- **Taken · dropped · not-taken-yet are three states, not two.** Everything counts *recorded
  meetings*, never calendar days. There is deliberately no schedule model — see
  [`plans/rotating-schedule.md`](plans/rotating-schedule.md). The fourth state, `NOT_TAKEN`, is the
  *did-I-forget* answer: right on a home screen asking about **today**, wrong on a month grid, where
  it is a wall of amber that the cycle model is the obvious way to quiet (WO-6.2). Draw nothing where
  nothing was recorded. The trap arrives from the rendering side, so it will look new.
- **Everything the teacher did not type is computed at render, never stored** (WO-6.2). Due dates,
  term edges, meeting states and IEP/504 review dates are read out of the document on every draw;
  copying any of them into `events[]` is the second truth the phase forbids. `src/calendar-derived.js`
  holds no writer at all — `wo-sweep.mjs` § 17 asserts that structurally, and a new derived answer
  goes in that file rather than in `src/calendar.js`, which it must not import backwards into.

Full schema and grade math: [`docs/data-model.md`](docs/data-model.md).

## If you were dispatched with a work order

Stay inside its **Deliverables** and honor its **Out of scope** line.

**You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go.** This
file said the opposite until 2026-08-13 — *"no agent has the authority to tick a box"* — and that
ban was **retired on 2026-08-06**, so the sentence outlived the rule by a week and briefed Codex
into a policy Claude implementers had already stopped following. The reasoning is in
[`plans/work-orders/ROUTING.md`](plans/work-orders/ROUTING.md) § "Implementers may tick" and is
worth reading once: the ban was ignored by every implementer that had the opportunity, and enforcing
it never caught a single defect — WO-1.8 drew a FAIL for breaking it whose own opening line was
*"All five Acceptance lines verify clean. The failure is on the boundary rule, not the code."* A
tracker that is current is worth more than one that is ceremonially clean.

**What replaced it is narrower and harder: a tick has to be true.** Anything you tick must be
something you actually checked, and a tick you cannot point at evidence for is worse than a blank
box — WO-1.8's real defect was ticking three lines its own result file listed under "what I could
not verify." Two carve-outs survive the retirement whole: **never tick a 👤 line** (see the bottom of
this section — that is a claim about hardware, not about authority), and **leave the `CHANGELOG.md`
entry to the teacher**, who decides what a change means to a classroom.

A separate verifier reads your work cold against the **Acceptance** list, so report honestly:
what you did, what you could not satisfy, and anything you were unsure about. Claiming an acceptance
line you did not actually meet costs you a correction round, not a pass.

**`node tools/verify-shell.mjs` may not run where you are.** It drives headless Edge over CDP, which a
sandboxed agent usually cannot do. If it fails to start, say **"could not run"** and say why — that is
an environment report, not a result, and the teacher re-runs it locally before any box is ticked.
Never infer a pass from a harness you could not execute.

**Never tick a 👤 line.** Those need a real iPad, a thumb, or the live SIS, and you have none of them.

**When you hand a 👤 iPad line back, say "force-quit from the app switcher first."** A reload will not
do it. `sw.js` uses `skipWaiting` + `clients.claim`: the new worker takes over and deletes the old
cache immediately, but the open window keeps rendering the document it already had. That used to
leave the About modal naming the new build while the screen showed the old one. On 2026-08-16
(WO-3.24) the owner read the wrong string twice before a cold relaunch, and the assistant spent two
round trips misreading the device from the desk. **WO-8.11 fixed the report on 2026-08-18** —
About now says the screen is older than the stored copy and names the app switcher as the fix — but
it reports the swap rather than undoing it, so the instruction is unchanged. Two things follow for a
line you hand back. If it expects to *see* that stale message, say to pull down to refresh once
first: **iOS resumes a backgrounded app without loading a document**, so nothing re-registers the
worker and no update check ever starts. And an app that comes back showing an old build with **no**
warning has been resumed, not broken.
**If you changed a file in `SHELL`, bump `CACHE` in `sw.js` in the same commit** — `./` is entry one,
so `index.html` counts. Skip it and the owner verifies your work by looking at the previous build.
