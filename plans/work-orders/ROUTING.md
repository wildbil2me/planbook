# Routing — which agent gets which work order

[`README.md`](README.md) says how a work order is used. This file says **who does it**: a Claude
Code agent or a Codex agent. It exists so the choice is a rule rather than a mood, and so the
reasoning is auditable after the fact.

The orchestrator (`.claude/agents/work-order-orchestrator.md`) reads this file every dispatch. If
you disagree with a routing it made, change the rubric here rather than arguing with the agent.

---

## The pipeline

Three agents, each with a different job and deliberately different powers.

| Agent | Does | Can write? |
|---|---|---|
| **work-order-orchestrator** | Checks gates, routes, writes the brief, dispatches, relays | yes |
| **work-order-implementer** *or* **Codex** | Builds the one work order it was handed | yes |
| **work-order-verifier** | Reads the work order cold, walks the Acceptance list, names what's next | **no** |

The verifier has no Write and no Edit on purpose. A verifier that can quietly repair what it finds
stops being a verifier and becomes a second implementer with nobody checking it. It also never sees
the implementation reasoning — it reads the work order fresh, so it grades what is on disk rather
than what someone meant.

The orchestrator does not grade its own dispatch. It chose the route and wrote the brief, which
makes it the wrong party to mark the homework.

**Nobody ticks anything.** Not the implementer, not the verifier, not the orchestrator. The
verifier's 🙋 marks are the acceptance lines that need a real iPad, and those are exactly the ones no
agent can close. You get a ready-to-apply maintenance list and you make the call. That is the
project's own rule — *do not tick a work order that is written but unverified* — enforced by giving
no agent the authority to do it.

---

## The one-line version

**Codex gets work that is fully specified. Claude gets work that requires judgment about what the
spec should be.**

Most of Planbook's work orders were written *with* the reasoning attached — the "Why it exists"
paragraph exists precisely because the constraints are non-obvious and easy to undo. A work order
whose value is in honoring that reasoning is a Claude job. A work order whose value is in correctly
implementing arithmetic already written down in [`../../docs/data-model.md`](../../docs/data-model.md)
is a Codex job.

---

## Route to **Codex** when the work order has all of these

- **The spec lives outside the work order and is complete.** Grade math, attendance counts, signal
  thresholds — the formula is in `docs/data-model.md` or the roadmap, and the job is to make code
  match it.
- **Acceptance criteria are mechanically checkable.** "Empty categories redistribute weight" can be
  verified by running it. "Colors match the style guide" cannot — that needs eyes.
- **No new visual language.** Either no UI, or UI that is a lift of a component already built.
- **It touches none of the sensitive surfaces** listed below.
- **Conventions already exist to follow.** Codex is good at matching an established pattern and
  worse at choosing one.

Typical shape: a pure module with a clear input and output. Store layer, grade engine, CSV parser,
percentage math, signal ranking, service worker cache plumbing.

## Route to **Claude** when *any* of these is true

- **The work order touches a sensitive surface.** Accommodations, medical, or plan data ·
  presentation mode · the merge-field resolver · backup and restore · OAuth scope decisions ·
  anything in `docs/FERPA.md`. These are the places where a plausible-looking implementation is a
  legal disclosure. Not delegated, ever.
- **It establishes a convention.** The first work order in a phase, the app shell, the file layout.
  Whatever it decides, everything after it copies.
- **It is a design-system lift from Roll Call!.** Requires reading another repo's design docs and
  exercising taste about what transfers. Cross-repo reading plus judgment.
- **It produces teacher-facing prose.** Install warnings, error copy, `CHANGELOG.md`, `TESTING.md`,
  docs. Suite voice is a thing you have or don't.
- **Its Traps section is about judgment, not mechanics.** "The style guide's 'colors inline, not CSS
  variables' reads like a mistake and is not. Don't tidy it." A model optimizing for clean code will
  tidy it.
- **Size is `L`, or the work order is ambiguous.** Split it or think it through first; don't hand
  sprawl to a second process.

## Ties go to Claude

Not because Codex is worse, but because the cost is asymmetric. A Codex run that quietly undoes an
architectural decision costs more to find and unwind than the Claude run costs to sit through. 🚩
go-live blockers in particular default to Claude unless they land squarely in the Codex column.

---

## Ship 1 — pre-routed

Advisory. The orchestrator still re-derives from the work order text; if it disagrees with this
table it says so and explains why.

| # | Work order | Route | Because |
|---|---|---|---|
| 1 | WO-1.1 Repo skeleton & docs spine | **Claude** | Establishes every convention; writes `TESTING.md` and `CHANGELOG.md` prose |
| 2 | WO-1.2 App shell & design frame | **Claude** | Cross-repo design lift; the inline-colors trap |
| 3 | WO-1.3 PWA install path & eviction warning | **Claude** | Teacher-voice warning copy is the deliverable that matters |
| 4 | WO-1.4 Year document store | **Codex** | Schema is fully specified in `docs/data-model.md`; mechanically verifiable |
| 5 | WO-1.5 Backup & restore | **Claude** | Sensitive surface — the backup carries accommodation data and must say so |
| 6 | WO-1.6 Classes & terms | **Codex** | CRUD against a settled schema, on conventions WO-1.2 established |
| 7 | WO-1.7 Roster & contacts | **Codex** | Same, plus paste-parsing — a well-defined transform |
| 8 | WO-1.8 Accommodations on the roster | **Claude** | The most sensitive data in the app |
| 9 | WO-1.9 Presentation mode | **Claude** | Sensitive surface; failure mode is disclosure to a classroom wall |
| 10 | WO-1.10 Home screen v0 | **Claude** | Answers "did the class not meet, or did I forget?" — judgment about what to surface |
| 11 | WO-2.1 Attendance marking screen | **Claude** | Size L, on the critical path, speed-of-use is a design problem |
| 12 | WO-2.2 Marking a past date | **Codex** | Small, bounded, follows WO-2.1's pattern |
| 13 | WO-2.3 Days off & pre-drops | **Codex** | Three-state logic, fully specified in `plans/rotating-schedule.md` |
| 14 | WO-2.4 Counts & attendance % | **Codex** | Pure arithmetic over recorded meetings |
| 15 | WO-G1 Ship 1 go-live rehearsal | **Claude** | A judgment call about whether to ship |

**Later phases, at a glance:** WO-3.4 grade engine and WO-4.1 signal engine are the strongest Codex
candidates in the project — both are specified arithmetic with testable output. WO-3.8, WO-3.10,
all of Phase 5 (merge fields and outreach), and all of Phase 7 (OAuth scope) are Claude-only.

---

## What every Codex brief must carry

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
- Stay inside the work order's **Out of scope** line. Do not tick roadmap boxes, edit `plans/`, or
  touch `CHANGELOG.md` / `TESTING.md` — the teacher does maintenance, after the verifier reports.
