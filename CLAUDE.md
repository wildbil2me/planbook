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

**Status: Ship 1 delivered; Ship 2 — first grades — one row left to build, gate waiting on the term;**
**Ship 3 building, its first row landed.**
The day-one gate (WO-G1) closed 2026-08-08, ahead of its ~2026-08-24 target: install,
backup/restore, classes and terms, roster with
accommodations, attendance marking, days off, home screen. The app is deployed at
`https://planbook.hwgteach.com/`.

*(The status line above changed on 2026-08-19. Every work order in `plans/work-orders/README.md`
§ Ship 2 is ✅ except WO-3.18 and WO-G2 itself, and* **WO-G2 is calendar-bound by
construction** *— four of its nine boxes want a real class's real grades, which do not exist until
Sep 2. **Do not read that as a stall:*** **§ Ship 3 is the running order now**, *written the same day
by WO-1.24, for the same reason § Ship 2 was written the day after Ship 1 closed —* `next` *was one work
order from having no rows left to read.)*

*(**Ship 2 got a row back later that same day, and gave it up again the same evening.** WO-1.25's
audit of Phase 6 found the home screen's ungraded slot belonged to Phase 3 and booked*
[WO-3.26](plans/work-orders/phase-3-gradebook.md#wo-326--the-ungraded-count-on-the-home-screen)
*ahead of WO-3.18 and WO-G2 — one row to build, not a reopening of the ship. It is* **✅ as of
2026-08-19**: *every class card now carries the work waiting on it, and* `next` *returns WO-3.18
again. The warning this block used to carry — "do not go looking for Ship 2 work" — stays gone, and
the reason is unchanged:* **§ Ship 3 is the running order.** *What is left in § Ship 2 is one
submission and a calendar-bound gate.)*

*(**WO-3.26 is also the first work order here to be finished by a different session than started it.**
Its dispatch died after the implementer's writes had landed and before anything was verified or
reported — no result file, a stale* `check()` *count in* `tools/README.md` *that turned the sweep red,
and a scratch file left in* `tools/`. *Everything was recovered from the working tree. The scar worth
keeping is that* **a dead dispatch's writes are usually all there and none of its claims are** *— the
tree was green on both tools once the last mile was walked, but nothing had run it, so no box it
would have ticked was tickable. Re-derive from the tree and re-run every command; never read landed
files as a landed work order. See* `plans/dispatch-retro.md`.)*

*(**Ship 3 opened for real on 2026-08-19**, the same day it was written:* [WO-4.1](plans/work-orders/phase-4-signals.md#wo-41--signal-engine--thresholds)
*— the signal engine — is ✅, which is row 1 of six and the one the table says never to cut. The
other five rows are still ⬜, and two of them cannot close before late September no matter how fast
the building goes: they want a fortnight of a real term's data. Read the running order, not this
line, for what is next.)*

The path to 1.0.0 is [`plans/ROADMAP.md`](plans/ROADMAP.md) — read its
maintenance protocol and delivery plan before working a phase, and **take the current progress numbers
from its dashboard, never from this file**; a count written here is a count nothing maintains. The
roadmap is cut into work orders in
[`plans/work-orders/`](plans/work-orders/README.md); **that is where to start when building
something.** Each carries its own dependencies and testable acceptance criteria.

**This app goes live in a real classroom on 2026-09-02** (decided 2026-08-03, risk stated and
accepted). *That date read "late August 2026" here until 2026-08-19: the owner's own term dates moved
it to Aug 28 on 2026-08-18 (WO-2.50) and to* **Sep 2** *on 2026-08-19 (WO-2.52), and the capacity
argument under `plans/work-orders/README.md` § Ship 3 is built on the current one. **The setup
fortnight is longer than Ship 2's front-loading assumed** — that is the only thing the slip bought,
and it is already spent in § Ship 3's first four rows.* Roll Call! is the fallback and **stays
deployed until Planbook survives a full term**.
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

Seven things that will bite:

- **iOS evicts IndexedDB after ~7 days of non-use for non-installed sites.** Installed PWAs are
  exempt. A teacher who bookmarks instead of installing can lose a term of grades over a holiday.
  The install prompt is data safety, and the downloadable JSON backup is mandatory.
- **Taken · dropped · not-taken-yet are three states, not two.** "Did the class not meet, or did I
  forget?" is the question the home screen exists to answer. Everything counts *recorded meetings*,
  never calendar days. **The fourth state is right on the home screen and wrong on a month grid**
  (WO-6.2): `NOT_TAKEN` is the *did-I-forget* answer, which is exactly what a screen asking about
  **today** wants and is a wall of amber on a grid asking about twenty weekdays across five classes.
  The obvious way to quiet that wall is to know which classes were meant to meet — the cycle model
  `plans/rotating-schedule.md` rejects, reached from the rendering side rather than the modelling
  side, which is why it will look new. Draw nothing where nothing was recorded.
  *(**The grid exists now** — WO-6.3, 2026-08-19 — and it holds the line: a weekday with no
  attendance row and no authored `no-school`/`dropped` event draws nothing, and `weekdayOf()` says so
  at its own definition. With every class showing, a month draws no per-class meeting state at all
  and says so in words under the grid; the per-class ledger appears when you filter to one class, and
  in the **week** view. So the wall of amber was never rendered rather than rendered and then tuned —
  which is the shape to keep if a later screen asks the same question.)*
- **`late` and `missing` are marked by the teacher, never inferred from a due date.** Blank means
  ungraded and affects nothing. The grade must never change because a date rolled over. The date may
  still **ask**: `src/past-due.js` (WO-3.6) offers to mark past-due blanks missing and writes only
  what the teacher accepts. That is the one place the rule allows the clock to be read, and the
  set is narrower than "empty" — `excused` and a scoreless `late` are decisions and are never swept.
- **Empty categories redistribute their weight.** Otherwise every grade is wrong until each
  category has an assignment.
- **An absent threshold key IS its default** (WO-4.1). The `signals` block holds only what the
  teacher has changed, and *Put every threshold back* **deletes** those keys rather than writing
  today's numbers into the year — otherwise a default re-tuned in a later build never reaches a
  teacher who once pressed reset, and the two builds are indistinguishable on screen. Read a
  threshold through `thresholdsOf()`, never off `doc.signals`. A signal rule is likewise handed its
  own measured numbers and nothing else — not the document, not the clock, not the threshold it just
  crossed — which is what stops an explanation drifting from the arithmetic behind it and what keeps
  accommodation data out of a sentence Phase 5 mails home.
- **A settings block is created by its first write, never seeded** (WO-6.1). `newYearDocument()`
  returns no `calendar` block at all; `leadDaysOf()` defaults when the key is absent, exactly as
  `thresholdsOf()` does — the rule above is general, and this is its second block rather than a
  second rule. Seeding it as an empty object cost a whole verify run: `parseBackup()` validates a
  restored file against the shape `newYearDocument()` returns, so a block added there refuses
  **every backup written by every earlier build**, by name. A `SCHEMA_VERSION` bump whose entire
  content is an empty object was the other answer and was refused — it buys nothing and makes this
  build's documents unreadable to the previous one.
- **Everything the teacher did not type is computed at render, never stored** (WO-6.2). Due dates,
  term edges, which classes met, and IEP/504 review dates are read out of `assignments[]`,
  `classes[].terms[]`, `attendance[]` and `students[].supports.reviewDate` every time the calendar
  is drawn — copying any of them into `events[]` creates the second truth that then has to be kept
  in step by hand. `src/calendar-derived.js` is the read side and holds **no writer**, which
  `wo-sweep.mjs` § 17 asserts structurally rather than by fixture: the harness proves what today's
  paths wrote, the grep proves there is nothing in the file that could write on any input. It is a
  third calendar module because it reads the ledger through `src/attendance.js`, which imports
  `src/calendar.js` — the derived half living in the model would close an import loop this repo has
  refused six times.
  *(**And a fourth, `src/calendar-view.js`, draws it** — WO-6.3, 2026-08-19. Two things there that
  look like omissions and are not. It contains **no** `presentationMode()` test: the suppression of a
  review date arrives as an empty list out of `reviewDatesIn()`, so the rule stays defined in exactly
  one place — `src/supports.js` — and the screen cannot disagree with it. **Adding a check here would
  be the second opinion**, and `wo-sweep` counts the askers. Second, the view — not the model —
  decides that a review date follows its student through the class filter, because a review carries
  no `classId`; `src/calendar-derived.js` declined to answer that on the screen's behalf, in as many
  words, and `docs/data-model.md` § Events carries the ruling.)*

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
never seen a service worker — no emulator has a thumb or a safe-area inset. It also **usually cannot
run in a sandboxed agent**: a dispatch reporting "could not run" has reported an environment, not a
result, and it gets re-run locally before any box is ticked. When it *does* run there — it did, twice,
on 2026-08-16 — that is a green run and not a tick, and the first sentence still governs. *(Narrowed
from a flat "cannot" that day, WO-1.21, so this file and `AGENTS.md` say one thing: a rule that calls
a true report impossible teaches its reader to disbelieve one.)*

**Before any 👤 iPad reading, force-quit the app from the app switcher.** A reload is not enough and
neither is a pull-to-refresh. `sw.js` uses `skipWaiting` + `clients.claim`, so a new worker takes over
and deletes the old cache the moment it activates — but it does not re-render the open window, whose
document was fetched before the swap. **The About modal named the new build while the screen you
were reading was the old one**, both true, for exactly one launch. On 2026-08-16 (WO-3.24) that cost
three readings of one legend row: the first showed the pre-dispatch wording, the second a superseded
attempt, and only a cold relaunch showed what was actually on disk — with the build line reading v72
throughout. Two of those round trips were spent diagnosing the device from the desk against a build
line that was reporting honestly. **WO-8.11 closed that gap on 2026-08-18: About now says the screen
is older than the copy stored on the device and names the app switcher as the fix**, so the build
line can no longer be confidently wrong — but it *reports* the swap rather than undoing it, and the
force-quit is still the procedure. The same sitting found the other half on hardware: **iOS resumes
a backgrounded app without loading a document at all**, so nothing re-registers the worker, no
update is even looked for, and the app comes back as the build you left — honestly, silently, with
no amber line to say so. Waiting for that line without a force-quit or a deliberate pull-to-refresh
is waiting for an update check that never started. **And bump `CACHE` in `sw.js` for any change to a
file in `SHELL`** — `./` is entry one, so an `index.html` edit counts, and without the bump no
device sees the change at all.

## Conventions

- **Visual language:** `design/style-guide.md`. Colors inline, not CSS variables — deliberate.
  **No dark mode**; the suite is light-theme only. 44px touch targets under `@media (pointer: coarse)`.
  *(**One control in the app is smaller, and it is the owner's ruling rather than a precedent**:
  the month chip in `src/calendar-view.css` sits at a 28px floor, ruled in under a thumb on
  2026-08-19, WO-6.3. Seven columns of a portrait iPad is ~100px of cell, and four 44px chips plus
  the date line is a cell twice that — a month you scroll through twice has stopped being a month.
  What pays for it is the **week** view, where every chip is a real 44 and every item on the month
  has a thumb-sized path through the pair; `verify-shell.mjs` asserts the 28 **as a departure**, so a
  drift down and a silent "fix" up both go red. Two things to know before citing it: the
  `src/home.css` departure it was modelled on is a line of TEXT, not a control, so this is the
  first sub-44px control here; and the argument that pays for it is measured on 2 of the 6 item kinds
  and reasoned for the rest. **A new control does not get 28px by pointing at this one** — it gets 44,
  or it gets its own reading and its own note at its own point of departure.)*
- **Components:** lift from Roll Call!'s `design/portable-components.md` rather than hand-designing.
- **`localStorage` prefix:** `planbook_`, and **UI preferences only** — never student data.
- **Git:** one branch — `main`. Work lands on it directly, in short imperative commit summaries, and a
  work order is a commit or a short stack of them. *(**Phase branches were retired on 2026-08-15**, the
  owner's call, WO-1.19 — they were the WO-1.1 convention and no work order had used one since Aug 12.
  A dispatch stream that hops phases between consecutive work orders cannot sit on one phase branch:
  the eighteen commits before the retirement interleave Phases 1, 2, 3 and 8. All three branches held
  **zero** commits that were not already on `main`, so the delete cost only the per-phase history view —
  which had already stopped being one, since a fast-forward of `main` logs every other phase's commits
  too. The phase files in `plans/work-orders/` and `CHANGELOG.md` carry that story instead, and the
  branches survive on `origin` if the call is ever reversed. **This fits how the current sprint is
  worked; it does not settle branching.** When Ship 3 opens, be deliberate about development happening
  on branches rather than straight on `main` — what shape that takes is a decision for then, not one
  written down here in advance.)*

## Working agreements with the teacher

- The school's SIS remains the official record. It has **no usable export**, so rosters are pasted
  and grades are re-keyed there by hand. Don't design around a sync that cannot exist.
- Grades are entered once or twice a week; attendance is marked at the start of every class. The
  attendance flow is on the critical path — it has to be fast enough to do while students arrive.
- Five classes, reachable at a touch. The roster turns over every year; nothing may assume a fixed
  class list.
- Grading is **weighted categories**, configurable per class, since the five classes differ.
