# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Planbook** — a gradebook and communication assistant for classroom teachers. It tracks grades
and attendance, surfaces the students who need attention **in both directions** — concern
(falling grades, serially low scores, missing work, absences, behavior) and praise (improvement,
turnarounds, strong streaks) — and drafts the outreach to guardians, counselors, and admin.

The praise half is not decoration. It is what makes this a teacher's assistant rather than a
gradebook with alarms, and it ranks by **delta, not level** — see `plans/ROADMAP.md` Phase 4.

Built first for its author's own five classes, but intended to be marketable to other teachers.
That second goal is what drives the architecture below.

**Status: Ship 1 delivered; Ship 2 — first grades — in flight.** The day-one gate (WO-G1) closed
2026-08-08, ahead of its ~2026-08-24 target: install, backup/restore, classes and terms, roster with
accommodations, attendance marking, days off, home screen. The app is deployed at
`https://planbook.hwgteach.com/`. The path to 1.0.0 is [`plans/ROADMAP.md`](plans/ROADMAP.md) — read its
maintenance protocol and delivery plan before working a phase, and **take the current progress numbers
from its dashboard, never from this file**; a count written here is a count nothing maintains. The
roadmap is cut into work orders in
[`plans/work-orders/`](plans/work-orders/README.md); **that is where to start when building
something.** Each carries its own dependencies and testable acceptance criteria.

**This app goes live in a real classroom in late August 2026** (decided 2026-08-03, risk stated and
accepted). Roll Call! is the fallback and **stays deployed until Planbook survives a full term**.
The governing rule for the sprint: *no feature that writes student data lands before the backup and
restore path that gets it back out.*

## The architecture, and the reasoning you must not undo

**Local-first PWA. No account, no permissions, no backend.** The app installs to the home screen,
works offline, and stores everything in the browser's own storage. Google Drive sync is an
**opt-in** extra that carries the year document between the teacher's laptop and iPad.

This shape was chosen deliberately over two alternatives, both of which will look tempting again:

- **An Apps Script bridge** (what the predecessor app uses — see below). Each teacher deploys
  their own script, which means each teacher is their own unverified developer and the "Google
  hasn't verified this app" warning can never be cleared. Plus a seven-step, ten-minute setup.
  Fatal for adoption. **Do not reintroduce Apps Script.**
- **A backend of our own** (Cloudflare, Supabase, anything). Solves sync cleanly and destroys the
  "no vendor server ever touches student data" position, which is a real asset with principals and
  district IT — and turns us into a FERPA data processor with breach liability. **Not a technical
  decision to revisit casually.**

Consequences that follow, and that keep the consent screen clean:

| Rule | Why |
|---|---|
| **`drive.file` is the only scope, ever** | Anything more is a sensitive-scope escalation the teacher sees and fears. Details in [`docs/sync.md`](docs/sync.md) |
| **Outreach goes out via `mailto:`** | A mail scope reads "Send email as you." No scope, no fear, and the teacher's own sent-mail record stays intact |
| **No dependencies, no framework, no bundler** | Inherited suite rule; a service worker is the only build-adjacent piece |
| **The app must work fully signed-out** | Sync is a feature, not a prerequisite. A teacher whose Workspace admin blocks third-party apps is still a customer |

## Reference implementation: Roll Call!

```
C:\Users\WildB\OneDrive\Documents\Coding Projects\Attendance App
```

**Roll Call!** (v0.9.0-beta, in daily classroom use) is the author's attendance app and Planbook's
predecessor. Read its `CLAUDE.md` and `design/README.md` before writing code here.

**Take from it:** the design system (`design/style-guide.md`, `design/portable-components.md`,
`design/starter-template.html`) — visual identity, modal patterns, touch targets, the setup-flow
skeleton. The at-risk threshold model. The FERPA stance in **Roll Call!'s** `docs/FERPA.md` — the
path is relative to the reference implementation above, not to this repository, where no such file
exists yet — which Planbook strengthens rather than weakens. Its `CLAUDE.md` is also a model of the kind of documentation this
project wants: every gotcha carries the scar that produced it.

**Lift the design with the function — copy, don't re-derive.** When a screen here has a counterpart
over there, take its markup structure, its measurements and its colours, not just its behaviour.
Both apps are the same author's, so re-deriving a palette or a layout is not independent design, it
is retreading a decision that was already made and then tuned by a year of classroom use. The scar:
WO-2.11's pass banner kept Roll Call!'s card *shape* and invented everything else — a light amber
card where the original is a dark band, no avatar, the name sharing a line with three other things,
and no place held for the elapsed clock. The owner caught it against the running app on 2026-08-07
and it was re-cut the same day. If a Roll Call! rule genuinely must not come across, say so in a
comment at the point of departure and name the local rule that beats it — the way the pass note
field does where Roll Call! suppresses a focus ring and this project forbids that.

**Do not take from it:** `src/bridge.gs`, JSONP reads, the GET-only outbox, the per-teacher deploy,
or any Google Sheets storage. All of that exists to work around `file://` CORS and Apps Script
constraints. Planbook is served over HTTPS and talks to no bridge, so none of it applies.

Planbook **absorbs attendance** rather than integrating with Roll Call — reading its sheets would
require the `spreadsheets` scope we're specifically avoiding. Migration is a one-time file import
(export the class sheet, drop it on a file input, zero permissions). See
[`docs/data-model.md`](docs/data-model.md).

## Data

One JSON document per school year, in IndexedDB. Full schema and grade math:
[`docs/data-model.md`](docs/data-model.md). Sync protocol: [`docs/sync.md`](docs/sync.md).

The classes run on a rotation that also **changes at random** — assemblies, delays, drills. There is
deliberately **no schedule model**: a class met if it has an attendance record without an exception,
and the teacher taps *dropped* on the ones that didn't. A cycle model was designed and removed the
same day; the decision record is [`plans/rotating-schedule.md`](plans/rotating-schedule.md), and it
exists because the next session will want to build one.

Four things that will bite:

- **iOS evicts IndexedDB after ~7 days of non-use for non-installed sites.** Installed PWAs are
  exempt. A teacher who bookmarks instead of installing can lose a term of grades over a holiday.
  The install prompt is data safety, and the downloadable JSON backup is mandatory.
- **Taken · dropped · not-taken-yet are three states, not two.** "Did the class not meet, or did I
  forget?" is the question the home screen exists to answer. Everything counts *recorded meetings*,
  never calendar days.
- **`late` and `missing` are marked by the teacher, never inferred from a due date.** Blank means
  ungraded and affects nothing. The grade must never change because a date rolled over. The date may
  still **ask**: `src/past-due.js` (WO-3.6) offers to mark past-due blanks missing and writes only
  what the teacher accepts. That is the one place the rule allows the clock to be read, and the
  set is narrower than "empty" — `excused` and a scoreless `late` are decisions and are never swept.
- **Empty categories redistribute their weight.** Otherwise every grade is wrong until each
  category has an assignment.

## Accommodations are the most sensitive data here

IEP/504 plans, medical needs, and behavior plans live on the roster, because a teacher is legally
obligated to implement them and a list nobody opens protects nobody. Three rules that are not
negotiable and are easy to break by accident:

- **Discreet by default, and a global presentation mode.** Teachers project these screens onto
  classroom walls. IEP status on that wall is a disclosure to thirty students.
- **No merge field ever resolves accommodation, medical, or plan data.** The resolver refuses those
  paths by construction — otherwise a template makes disclosure a one-keystroke mistake.
- **Backups now contain this data.** The backup UI says so in as many words (`index.html`, the backup
  panel). **`docs/FERPA.md` does not exist yet** — it is a WO-8.5 deliverable, still ⬜ NOT STARTED,
  and when it is written it must address the backup directly rather than only discussing grades. Until
  then the disclosure lives in the UI alone, which is the weaker half of the obligation in
  `docs/data-model.md` § Accommodations.

## How work is run here

Every change goes through a **work order**. The pipeline is orchestrator → implementer → verifier,
defined in [`.claude/agents/`](.claude/agents/); the scars behind its rules are in
[`plans/dispatch-retro.md`](plans/dispatch-retro.md), and the harness reasoning is in
[`plans/verification-tooling.md`](plans/verification-tooling.md). Start a dispatch by checking the
gates — `node tools/wo-gate.mjs next` — never by opening an editor.

If you were dispatched *with* a work order, [`AGENTS.md`](AGENTS.md) has your rules. The two files
must never drift apart: **a rule changed here is changed there in the same sitting.**

## Commands

The toolchain is nearly nothing, by suite convention (`plans/b-hygiene.md` in Roll Call!): **no
dependencies, no linter, no test framework, and no `package.json`** — not even "just for scripts,"
because that is how a bundler arrives six weeks later. Anything scripted is a `.mjs` under `tools/`
run by bare Node. Full notes: [`tools/README.md`](tools/README.md).

| Task | Command |
|---|---|
| Run locally | `node tools/serve-https.mjs` — app on `:8443` over HTTPS, iPad setup page on `:8080` |
| Once per machine | `node tools/make-cert.mjs` — and again if the LAN address changes |
| Verify before a deploy | `node tools/verify-shell.mjs` — drives the app in headless Edge over CDP |
| Verify after a deploy | `node tools/verify-deploy.mjs` — the only check that reads the live origin |
| Work-order gates | `node tools/wo-gate.mjs next` (or a `WO-` id) · `--audit` · `--self-check` |
| Deploy | Cloudflare Pages, static assets only — no `functions/` directory, ever |
| Test | [`TESTING.md`](TESTING.md) is the gate |

**A green harness closes no 👤 item.** `verify-shell.mjs` drives a page, not an installed app, and has
never seen a service worker — no emulator has a thumb or a safe-area inset. It also **cannot run in a
sandboxed agent**: a dispatch reporting "could not run" has reported an environment, not a result, and
it gets re-run locally before any box is ticked.

## Conventions

- **Visual language:** `design/style-guide.md`. Colors inline, not CSS variables — deliberate.
  **No dark mode**; the suite is light-theme only. 44px touch targets under `@media (pointer: coarse)`.
- **Components:** lift from Roll Call!'s `design/portable-components.md` rather than hand-designing.
- **`localStorage` prefix:** `planbook_`, and **UI preferences only** — never student data.
- **Git:** one integration branch `main`, phase branches `phase/<n>-<slug>`, short imperative commit
  summaries. A work order is a commit or a short stack of them, worked on its **phase** branch — not a
  branch per work order. *(This drifted during the August sprint — a run of work orders through WO-3.9
  landed straight on `main`, and all three `phase/*` branches now trail it. The convention stands; the
  branches need catching up. `git rev-list --count phase/3-gradebook..main` for how far.)*

## Working agreements with the teacher

- The school's SIS remains the official record. It has **no usable export**, so rosters are pasted
  and grades are re-keyed there by hand. Don't design around a sync that cannot exist.
- Grades are entered once or twice a week; attendance is marked at the start of every class. The
  attendance flow is on the critical path — it has to be fast enough to do while students arrive.
- Five classes, reachable at a touch. The roster turns over every year; nothing may assume a fixed
  class list.
- Grading is **weighted categories**, configurable per class, since the five classes differ.
