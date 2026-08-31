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

**Status: Ship 1 delivered; Ship 2 — first grades — build queue empty, gate waiting on the term;**
**Ship 3 building, and Phase 5 opened inside it on 2026-08-28.**
*(This line carried "its first four rows landed" until that day, when a fifth made it wrong. It now
names no count for the reason stated two paragraphs down —* **take the numbers from the roadmap's
dashboard** *— because a count written here is one nothing maintains, and this one had already rotted
once.)*
The day-one gate (WO-G1) closed 2026-08-08, ahead of its ~2026-08-24 target: install,
backup/restore, classes and terms, roster with
accommodations, attendance marking, days off, home screen. The app is deployed at
`https://planbook.hwgteach.com/`.

*(The status line above changed on 2026-08-19; its counts were corrected twice on 2026-08-20 — once
when WO-2.53 landed and WO-2.54 was booked, and again that evening when WO-2.54 landed too. Every
work order in `plans/work-orders/README.md` § Ship 2 is ✅ except WO-3.18 and WO-G2 itself, and*
**WO-G2 is calendar-bound by construction** *— four of its nine boxes want a real class's real grades, which do not exist until
Sep 2. **Do not read that as a stall:*** **§ Ship 3 is the running order now**, *written the same day
by WO-1.24, for the same reason § Ship 2 was written the day after Ship 1 closed —* `next` *was one work
order from having no rows left to read.)*

*(**Ship 2 got a row back later that same day, and gave it up again the same evening.** WO-1.25's
audit of Phase 6 found the home screen's ungraded slot belonged to Phase 3 and booked*
[WO-3.26](plans/work-orders/phase-3-gradebook.md#wo-326--the-ungraded-count-on-the-home-screen)
*ahead of WO-3.18 and WO-G2 — one row to build, not a reopening of the ship. It is* **✅ as of
2026-08-19**: *every class card now carries the work waiting on it, and* `next` *returned WO-3.18
again — until 2026-08-20 took that row out of the ship altogether; see the two blocks above. The warning this block used to carry — "do not go looking for Ship 2 work" — stays gone, and
the reason is unchanged:* **§ Ship 3 is the running order.** *What is left in § Ship 2 is one
submission and a calendar-bound gate.)*

*(**§ Ship 2 lost that submission on 2026-08-20, and now holds nothing but its gate** — owner-directed,
and the reason is a dependency nobody had written down.* [WO-3.18](plans/work-orders/phase-3-gradebook.md#wo-318--verification-submitted-)
*owes Google a demo video* **showing the scope in use**, *and* **nothing in the app uses the scope**: the
token flow is [WO-7.1](plans/work-orders/phase-7-sync.md#wo-71--auth), *which had not been built and was
itself wearing Phase 7's* `🔒` — *so the paperwork was blocked on a sign-in and the sign-in was marked
"do not start it." WO-7.1 was* `⬜ NOT STARTED` *and buildable, and is* `🔨 IN PROGRESS` *as of
2026-08-24 — read the last block in this run before acting on the two sentences above. WO-3.18
gained it as a third dependency and dropped to* `**Ship** —` *beside it, in a new* **§ After Ship 3** *section. **The ship
argument is WO-G2's own, from 2026-08-10** — Ship 2 is first grades and contains no sync — and WO-G2's
eighth box was* **re-homed to WO-3.18's own third Acceptance line, not waived**, *which is the hatch that
box has named since it was written.)*

*(**Two things to know before reading `next` again.** Taking WO-3.18 out of § Ship 2 promoted*
**WO-G2** *into its slot, and `next` stops at the first* `⬜` *in document order — so for part of that
day the tool answered with a gate nobody can work until Sep 2, hiding seven* `⬜` *work orders behind
it. **WO-G2 is now** `🔒 GATED`, which is the word the vocabulary already had and whose gate report
reads "do not start it"; `next` returns* **WO-4.2** *again, the head of § Ship 3.* **Put it back to**
`⬜` **when there are real grades to run it against** *— `--tick` refuses the status, so the gate
cannot close while wearing it. And the one piece of WO-3.18 that is not blocked is its* **privacy
policy**, *which is now* [WO-8.12](plans/work-orders/phase-8-packaging.md#wo-812--the-privacy-policy-and-the-ferpa-document)
*together with* `docs/FERPA.md`*.* **Both landed 2026-08-21 and WO-8.12 is** ✅ **DONE** *— the policy
is live at* `/privacy`*, the FERPA document is in the tree, and § Accommodations below no longer
records a missing half. Two things from that sitting are worth carrying: the app had no link to
either document until About got one, because* **an installed PWA has no address bar and a document
that lives only at a URL does not exist for a teacher**; *and* **the host rewrote the policy's
contact address after deploy with no file in this repository moving** *— Cloudflare Scrape Shield,
`<!--email_off-->` is the repair, and* `verify-deploy.mjs` *now fails if it comes back. WO-3.18's
first Acceptance line is paid on this and its* **Owes** *pointer discharged; what it still wants is
the consent screen, the demo video WO-7.1 gates, and a submission date.)*

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

*(**Row 2 was built on 2026-08-20, four days ahead of the table** —* [WO-4.2](plans/work-orders/phase-4-signals.md#wo-42--concern-signals)
*, the concern list, and with it the app's* **first screen that refuses rather than hides**: *under a
projector it closes and names the control that undoes it, which is a deliberate departure from the
roster, the calendar and the student detail, argued at its own point of departure. It is* **✅ the
same day** *— all six Acceptance boxes, including the one that wanted all nine rules read by hand,
and thirteen 👤 readings taken on a test install carrying test grades and test attendance rather than
deferred to the term (`TESTING.md` § WO-4.2). **The dispatch that built it was killed mid-flight**,
which is the second one in this file's history and the first whose prose had run ahead of its code:
a harness comment describing a row-counting assertion nobody had written, sitting directly on top of
the four-segment assertion it claimed to replace. The scar is in* `plans/dispatch-retro.md`
*§ "The comment that ran ahead of its code" and the recovery in*
`.claude/dispatch/WO-4.2-status.md`*.)*

*(**The sign-in exists as of 2026-08-24, and it is the block above's two sentences going stale rather
than a new row of Ship 3.*** [WO-7.1](plans/work-orders/phase-7-sync.md#wo-71--auth) *— the Google
Identity Services token flow — is* `🔨 IN PROGRESS`*: built, both harnesses green, the consent
screen read on the laptop by the owner the same day showing* **one permission line**, *and its own
first two Acceptance boxes ticked on that reading. What holds it open is an hour nobody can hurry — a
real token lapsing at ~3,600s — and one glance at the iPad.* **Three things about it that are
decisions, not details.** *The token lives* **in memory and only in memory**, *so a reload is a
sign-out: there is no refresh token in a browser flow, so persisting a bearer credential would buy the
tail of one hour and cost a laptop handed to a substitute.* **The control is in the About modal, not
the backup panel** — *sync is not a backup, and a Connect button under "Download a backup" teaches the
one misconception that costs a term of grades.* **And the flag** `docs/sync.md` **asks for is the
origin** — *the section draws only on a loopback host, because the OAuth client's only authorized
JavaScript origin is* `https://localhost:8443`*. So the deployed app and the iPad show the About modal
exactly as before, fetch no Google script, and contact Google not at all — which is what keeps*
`privacy.html`*'s "no third-party code of any kind" true word for word.* **It moves no data**: *upload,
download, the* `rev`/`baseRev` *comparison and the keep-both conflict are* [WO-7.2](plans/work-orders/phase-7-sync.md#wo-72--document-transfer--conflicts)*,
still* `🔒`*, and the panel says so on screen because a teacher who connects and assumes her
gradebook is in Drive would stop downloading backups. **WO-3.18's demo video is unblocked** — the
scope is now in use and there is a handshake to film.)*

*(**Row 4 landed 2026-08-24, a week early, and it is the one row of Ship 3 that cannot close on
build quality alone.*** [WO-4.3](plans/work-orders/phase-4-signals.md#wo-43--praise-signals) *— the
praise column — is* `🔨`*: four of five Acceptance boxes closed and both claims worth mutating
mutation-proved, the* 👤 *sitting green on hardware 2026-08-25, and* **one box left that nobody can
hurry** *— a fortnight of a real term, ~Sep 16.* **Do not read the** `🔨` **as unfinished work.**
*Three things about it that are rulings rather than details.* **The ranking is banded by rule before
anything is compared** *(*`PRAISE_RANK`*), which is what makes "delta, not level" structural instead
of incidental: a rule that can only ever fire for high achievers — a run of top scores — is last in
the band order and can never head a column holding a climber. A flat sort on the figure would
subtract* rules cleared *from* points *and let whichever number happened to be larger lead, which is
the question the concern side already refuses to ask about "61%" versus "3 missing".* **The* Sorted
by *control orders the concern list only** *— two of its four options are concern errands with no
praise reading — so the praise column keeps one ranking and says so in its own head, and a second
sort control was declined on a screen already carrying two filter strips.* **And a rule chip narrows
the column its rule is in and leaves the other whole**: *filtering to* a run of low scores *is a
concern errand, and emptying the praise half while a teacher does it would bury the column this phase
exists to protect for a reason she never asked for. The dispatch that built it was* **killed by an
API session limit at the handoff to its verifier** *— the third dead dispatch here and the first
killed by a quota; the implementer's writes were all present and none of its claims were, so every
command its result file cited was re-run from the tree before anything was ticked. See*
`.claude/dispatch/WO-4.3-status.md`*.)*

*(**Phase 5 opened on 2026-08-28 and its head row is ✅ the same day** —*
[WO-5.1](plans/work-orders/phase-5-outreach.md#wo-51--merge-field-resolver)*, the merge-field
resolver, all six Acceptance lines closed, no* 👤 *and no* 📆*. What it is and the ruling behind it
are in § Accommodations below; what belongs here is* **how it nearly went out.** *The dispatch was*
**killed by an API session limit at the handoff to the implementer's return** *— the fourth dead
dispatch here and the second killed by a quota — and it is the first whose corpse was* **dangerous
rather than merely incomplete.** *The implementer had inserted a mutation to prove its own refusal
check non-vacuous — a path expression walked against the document whenever the whitelist missed —
and was killed between* the check went red *and* the mutation came out. *So the delivered tree
resolved* `{{student.supports.medical}}`*,* `.accommodations`*,* `.behaviorPlan`*,* `.caseManager`*,*
`.attendanceClause` *and* `.reviewDate` *to the roster string, unblocked, with no error code —*
**while every document in it already read ✅ DONE with all six boxes ticked.** *The rule this adds is
in* [`AGENTS.md`](AGENTS.md) *§ "If you were dispatched with a work order" — revert the mutation
before writing anything else — and the scar is in* `plans/dispatch-retro.md`*. Two things about it
that generalise.* **Re-running the tools would not have caught it:** `wo-sweep.mjs` *was green at
34 · 31 · 0 · 3 with the hole open, and so were both gate tools, because* **a mutation names nothing
a grep is looking for** *— so the standing recovery rule (re-run every command the prose cites)
walks straight past this one, and the first move on a dead dispatch is now* `grep -rn MUTATION` *over
its delivered files.* **WO-1.32 closed that for this one file the same week** *— § 20 gained a fifth
claim on 2026-08-28,* no dynamic property read in `src/merge-fields.js`*, and this exact mutation now
turns the sweep red at the line.* **It changes nothing in the sentence before it:** *claim 5 is about
one file on purpose, because every other module here indexes by a computed key legitimately, so a
mutation anywhere else in the tree still names nothing a grep is looking for and* `grep -rn MUTATION`
*is still the first move.* **And a green harness number in a dead dispatch's prose is a timestamp, not a
state:** *the implementer's cited 1194/1194 was real, taken before the mutation went in. Recovered,
repaired and re-verified by a separate verifier on 2026-08-28 — 1194 checks green, sweep green, both
gate tools PASS.)*

*(**Phase 5 has a send flow as of 2026-08-29, and the way it got there is the fifth dead dispatch
and the third killed by a quota.** [WO-5.3](plans/work-orders/phase-5-outreach.md#wo-53--send-flow)
is ✅ — all seven Acceptance lines, the last two closed by the owner on hardware. **The corpse left
FIVE live mutations**, where WO-5.1's left one, and the shape was identical: the implementer had
finished its whole doc pass and died mid-mutation-proof, so every document read finished over a tree
that was deliberately broken. `grep -rn MUTATION` found them in one command — **it has now paid for
itself twice and is still the first move on any dead dispatch.** Two of the five mattered: a deleted
CRLF normalisation, invisible on screen and producing exactly the mangled-paragraph email the work
order's Traps line exists to catch, and a presentation-mode disclosure leaving a student's business
and a guardian's address on the glass. **All five sat under already-ticked boxes.** Two things
generalise. **A recovered tree that reproduces the corpse's own figures is the evidence the
reconstruction was right** — 1251/1251 at 37,466 lines matched what the implementer had written
down, and a wrong rebuild fails a check rather than matching a total. And **the owed mutation round
is worth re-running rather than writing off**: three of the five bit, one was correctly not caught
(defence in depth), and one exposed a real defect in the delivered harness — `update()` only
SCHEDULES a save and `rev` advances 800ms later, so the check claiming "the whole flow wrote nothing
at all" had a blind spot at exactly the point the flow ends. It awaits `flush()` now. The record is
`.claude/dispatch/WO-5.3-status.md`.)*

*(**The template editor takes the class tabs without being a class screen, and that is a third kind
this app did not have** — 2026-08-29, the owner's call after finding no way out of it.
`src/classes.js` drew the header strip only for `CLASS_SCREENS` entries; `#templatesView` is not one,
so it landed in the caption branch and showed a dead `<span>Your classes</span>` over a panel headed
*Message templates*. **That is word for word the bug WO-6.6 fixed for the calendar**, and
`src/classes.js` had written down in advance that a third view would produce it. **The fix is not the
one that comment predicted**: templates are global — `templatesFor(doc, tone, audience)` takes no
`classId` — so putting it in `CLASS_SCREENS` would hand it a switcher segment and a
`paintClassScreen()` branch it has no use for. It takes the TABS without the KIND, via `carriesTabs`,
and **no tab is marked active** because there is no class it is in. Before adding a fourth view to
either branch, read that note: a screen genuinely about nothing still wants a caption, and the
lookup that used to provide one is gone.)*

*(**The cooldown has an input as of 2026-08-29, and the sixth dead dispatch is a correction to the
two blocks above rather than a repeat of them.**
[WO-5.4](plans/work-orders/phase-5-outreach.md#wo-54--contact-log--history) *— the contact log — is
✅, all five Acceptance lines, no* 👤 *and no* 📆*. It matters for Sep 2 more than its Size S
suggests:* **two readers in `src/log.js` had been reading a `contact` entry nothing in the app
wrote**, *so the concern list would have repeated itself every week and WO-4.5's own* 📆 *fortnight
would have measured a rule with no input.* **Contact history is a second card and not a widened
reader** *— folding* `contact` *into* `LOG_KINDS` *would put an email's subject onto the card headed*
"What you have written down"*, under a footer promising the teacher those notes go nowhere; the rule
is in § Accommodations' list above now. **The dispatch was killed by a session limit, the fourth
quota death, and it left one live mutation** —* `ruleId: ''` *in* `recordHandoff()` *—* **aimed
straight at the line that makes the cooldown work**: `lastContactAbout()` *returns* `null` *for an
empty rule, so every contact the app wrote would have silenced nothing, with every screen looking
exactly as it does when it works.* `grep -rn MUTATION` *found it in one command and has now paid for
itself three times.* **Here is what corrects the WO-5.1 and WO-5.3 blocks above.** *Both of those
corpses had finished their doc pass and died in the mutation round, so both blocks teach that the
danger sign is* **a tree full of ticked boxes over broken code** *— and a reader who learned it that
way would have under-audited this one, which died* before *its doc pass and presented as an honest,
obviously-unfinished tree with not one box ticked.* **The tick state of a dead dispatch says nothing
about whether its code is armed.** *Run the grep either way. The record is*
`.claude/dispatch/WO-5.4-result.md` *and* `TESTING.md` *§ WO-5.4.)*

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
skeleton. The at-risk threshold model. The FERPA stance in **Roll Call!'s** `docs/FERPA.md` — which Planbook
strengthens rather than weakens, and **has now actually strengthened**: this repository has its own
[`docs/FERPA.md`](docs/FERPA.md) as of 2026-08-21, built on that one's six headings plus two this app
needs. Mind which you are reading — an unqualified `docs/FERPA.md` in *this* file means the local one. Its `CLAUDE.md` is also a model of the kind of documentation this
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
  which is the shape to keep if a later screen asks the same question. **WO-6.6 added the second way to
  arrive filtered** — the calendar is now the fourth pill on every class screen's switcher, and coming
  through it filters to the class you came from — and that filter is a **door, recomputed on arrival,
  never a stored preference**: a remembered filter is a month quietly hiding four fifths of the year
  from a teacher who does not recall setting it. Nothing about scale, anchor or filter reaches
  `localStorage`.)*
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
- **Concern state is derived at read time, and there is no "was flagged" bit** (WO-4.3). The
  turnaround rule asks *was this student on the concern list and is she off it now* by running the
  concern rules a second time against a shifted `{ through }`. `src/signals.js` holds **no writer of
  any kind** — the document is byte-identical either side of a pass, and `newYearDocument()` gained
  nothing, so every backup written by every earlier build still restores. The obvious way to pay for
  it is to walk every day of the window, which is twenty-one full concern passes per student per
  class on a screen a teacher opens across five classes — WO-2.13's defect reached from a different
  direction. So the rule samples **once**, at the far edge, and **under-fires rather than
  over-claims**: a student flagged ten days ago and clear since is not caught. Praise not sent is a
  missed opportunity; praise claiming a student came off a list she was never on is what stops the
  column being trusted. A second honest limit: only rules whose facts are *dated* can differ across
  the gap — the ledger and the log are dated, a score is not — so **a grade recovery on its own
  produces no turnaround**, it produces `grade-rose`, which is the better sentence for it anyway.
- **The log is append-only, and nothing in the app can delete an entry** (WO-4.4). A correction is
  an ordinary later entry that says so — no `correctsId`, no strikethrough, and no rule about which
  of two entries a reader should believe, **because the reader believes the newest**. `src/log.js`
  exports **two** writers since WO-5.4 — `writeEntry()` for a behaviour note or a note to self, and
  `writeContact()` for outreach that actually left the building — and **each does exactly one thing
  to the document, a `push` inside one `update()`**. There is no updater, no delete and no id lookup
  anywhere in the file, so append-only is a property of what is there rather than a promise made
  about it; *a second handoff is a second entry.* **The `kind` filter is the whole of the firewall
  between them**, and it is not optional: every reader names the kinds it wants, and there is no
  exported reader that hands back all three — an email's subject line on the card headed *"What you
  have written down"*, under a footer promising the teacher those notes go nowhere, is one missing
  filter away. That last clause is load-bearing:
  entries are ordered newest-first by `at`, and **the tie is broken toward the later write** because
  `localStamp()` is second-granular, so two entries logged in one sitting carry the same stamp and a
  stable sort left alone resolves them *oldest* first — the opposite of the card's heading, and it
  put a correction underneath the entry it corrected. The card draws four and hides the rest, so the
  tie decides what is visible as well as what order it reads in.
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
  *(**Built 2026-08-28, WO-5.1, and "by construction" turned out to mean a whitelist rather than a
  refusal list.** `src/merge-fields.js` holds the sixteen documented names and matches a token
  against them by **exact string over an array** — no path expression, no split on `.`, no property
  read named after a token — so `{{supports.medical}}` is refused for the same reason a typo is, and
  **a support field added to the data model next year is refused on the day it is added**.
  `REFUSED_WORDS` survives as the wording of an error and as a test surface; deleting it would
  change no outcome, which is the difference between a fence and a filter. Two consequences worth
  keeping: the whitelist is an **array scanned by `===`**, because indexed by the token
  `{{constructor}}` and `{{__proto__}}` both find something truthy; and **a refused token stays
  visibly intact**, told apart from the other two failures by a named `code` and never by the shape
  of the output — dropping or blanking it produces a body that reads clean and could be sent. The
  module owns no writer and no screen. **`{{behavior.recent}}` carries a date and a subject and
  never a `body`**, and the limit is stated rather than claimed away: a subject is free text, the
  same open edge the note-under-a-projector ruling below records.)*
- **A note to self is the one thing here a projector does not hide, and that is a ruling rather than
  an oversight** (WO-4.4, the owner, 2026-08-20, seen on hardware 2026-08-24). `logKindVisible()`
  returns `true` for `note` unconditionally: **behavior** entries are absent from the page in
  presentation mode — not redacted, not counted, no "2 hidden" line, because a count is the
  disclosure — and **notes stay**, because they are the teacher's working memory and suppressing them
  costs her the half of the card that has nothing to do with conduct. **The premise is not enforced
  anywhere**: a note is free text whose placeholder invites *anything you want to remember*, so
  nothing stops one being about a child, where a behavior entry is structurally about conduct. Read
  that as a known open edge before widening what the note field is used for, not as a bug to fix
  quietly — reversing it is the owner's call and costs the teacher the useful half of the card.
- **`supports.attendanceClause` is sensitive and is on this list** (WO-4.4). Free text beside
  `medical` and `behaviorPlan`, holding what an IEP or 504 says about a student's attendance. It is
  in the backup, and `docs/FERPA.md` and `privacy.html` name it.
- **Backups now contain this data.** The backup UI says so in as many words (`index.html`, the backup
  panel), **and since 2026-08-21 so does [`docs/FERPA.md`](docs/FERPA.md)** — WO-8.12, ✅ DONE, which
  is the obligation in `docs/data-model.md` § Accommodations discharged rather than half-kept. That
  document names IEP and 504 details, accommodations, case managers, review dates, medical needs and
  behavior plans **in its backup section, in as many words**, and says they are neither redacted nor
  encrypted — addressing the backup directly rather than only discussing grades, which is what this
  file spent two weeks recording as missing. Its public twin is [`privacy.html`](privacy.html), served
  at `/privacy`. **They carry the same data-flow statement word for word and divide everything else**;
  change a fact in one and change it in the other in the same sitting, which both files say at their
  own tops.

## How work is run here

Every change goes through a **work order**. The pipeline is orchestrator → implementer → verifier,
defined in [`.claude/agents/`](.claude/agents/); the scars behind its rules are in
[`plans/dispatch-retro.md`](plans/dispatch-retro.md), and the harness reasoning is in
[`plans/verification-tooling.md`](plans/verification-tooling.md). Start a dispatch by checking the
gates — `node tools/wo-gate.mjs next` — never by opening an editor.

If you were dispatched *with* a work order, [`AGENTS.md`](AGENTS.md) has your rules. The two files
must never drift apart: **a rule changed here is changed there in the same sitting.**

**Before editing the pipeline, read `plans/work-orders/README.md` § "The pipeline's own files"**
(WO-1.40, 2026-08-30). It is the map of which of these files are watched and by what, and two of its
rows say **"Nothing"** on purpose. It exists because WO-1.38 changed the pipeline in six files, wrote
five, and the sixth — `.claude/commands/wo.md`, *the file a human types* — spent two days giving a
person an instruction the new shape had made wrong, with nothing in the repository able to notice:
`.claude/` is in the sweep's `IGNORE_DIRS`, and `--audit` never reads it. **`wo.md` and
`work-order-orchestrator.md` are now checked against each other** by `wo-sweep.mjs` § 21, which
reaches them by path rather than by widening the walk. It tests for **contradiction, not symmetry** —
a file may legitimately omit what the other says, and only disagreement about the pipeline's stops
fires. Two things it does not do: green means *no unexcused occurrence* rather than *no
contradiction*, and it reads a hand-written list of claims rather than two whole files.

**`CLAUDE.md` and `AGENTS.md` are the second watched pair as of 2026-08-30**
([WO-1.41](plans/work-orders/phase-1-shell-store-roster.md#wo-141--the-two-files-that-must-never-drift-apart-are-held-together-by-nothing))
— four claims about rules both files carry, with **`CLAUDE.md` as the reference half**, because this
is where the rules are maintained and it is the file that grows by accretion. **It is a fence, not a
reading:** it knows four rules, and the bolded rule above still rests on the reader for the rest. The
claim list at `tools/wo-sweep.mjs` § 21 is **a fourth thing to keep in step** — after these two files
and the map row — so it is short on purpose and every addition costs something; the rules left out are
named there with their reasons. *(**And it cannot see itself.** The sentence you are reading replaced
one saying this pair was unfenced, and its twin in `AGENTS.md` replaced another — both made false by
the landing that fenced them, both repaired by hand, and* **neither catchable by the thing just
built**: `CLAUDE.md` *is searched for anchors and never scanned for contradiction, and the*
`AGENTS.md` *twin was an italic parenthetical the engine skips by construction. The first false
statement in the pipeline's own files after this landed was a false statement about this fence, in
both halves, structurally invisible to it. Read that before trusting a green § 21 further than its
four claims.)*

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

**An Acceptance line can also say it is waiting on the calendar, and 📆 is the mark for it** (WO-1.28,
2026-08-26). 👤 means *no headless browser can close this*; **📆 means *no build can close this*** — the
line wants a date, usually a fortnight of a real term. `--tick` refuses both. What 📆 changes is
**dependency gating and nothing else**: a work order whose every open Acceptance line is 📆 reports as
**code-complete**, so it stops blocking work orders that need only its code — WO-4.3's open praise box
was refusing WO-4.5, which wants nothing from it but its rules. **It closes nothing.** The box stays
open, the work order stays 🔨 IN PROGRESS, and the ship **gate** refuses it outright, because the gate
is where the wait is actually paid and a mark that could open one would have eaten the only check that
reads these lines on the far side of the wait. Every hop of a chain is named, so a two-hop wait cannot
report as a one-hop pass. Defined in [`plans/work-orders/README.md`](plans/work-orders/README.md)
§ "Acceptance-line marks" — which is also the first place 👤 was ever written down — and argued in
[`plans/verification-tooling.md`](plans/verification-tooling.md).

**A row in the running order can also say it is a ride-along, and 🎒 is the mark for it** (WO-1.35,
2026-08-28). 👤 and 📆 sit beside an Acceptance line; **🎒 sits in the `Suggested` column and is not
about a checkbox at all.** It says the row is `⬜ NOT STARTED` and fully buildable but is **not work to
schedule** — an hour to fold into a sitting that already has that file open. `next` **steps over a
marked row, names it, says what it rides with, and prints the `--start` that takes it anyway**:
nothing is in flight, so nothing needs `--release`, and a row that vanished from the report would be
a row nobody remembers, which is the defect inverted. **It changes ordering and nothing else** — it
closes no box, opens no gate, satisfies no dependency, and naming the ID produces exactly the gate
report it always did. It exists because **position is not a fence**: WO-8.13 spends a paragraph
arguing it must not lead the running order, its only protection was sitting at the foot of the table,
and on 2026-08-28 the three rows above it cleared and it led anyway, silently. So `--audit` reports a
ride-along that has become the first `⬜` in its section — as a **note and not a failure**, because
*re-place it*, *start it* and *take the mark off* are all correct answers and only a person can pick.
Defined in [`plans/work-orders/README.md`](plans/work-orders/README.md) § "Ride-along rows"; the
glyph is the owner's to change and the behaviour is not.

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
- **Mockups:** a screen drawn before it is built follows
  [`design/mockups/PROTOCOL.md`](design/mockups/PROTOCOL.md) — two stylesheets, `src/shell.css` linked
  and never copied, no JavaScript, the black band, and a pending section that styles nothing `src/`
  already styles. `wo-sweep.mjs` § 19 is the half of it a grep settles. **A drawing is not a work
  order** (WO-1.25): the questions it raises are answered in the phase file or they are not answered.
- **`localStorage` prefix:** `planbook_`, and **UI preferences only** — never student data.
- **License:** Apache 2.0, in [`LICENSE.md`](LICENSE.md) since 2026-08-21, owner-added. It is a
  **permissive** licence and that is a decision with a consequence rather than a formality: anyone
  may fork this, sell it, and keep their own changes closed, and all they owe is attribution and the
  licence text. Weigh that against "marketable to other teachers" above before assuming the two are
  unrelated. **Do not add a per-file Apache header** — the licence covers the work without one, and
  a nineteen-line banner on top of this repo's file headers would bury the thing those headers exist
  to say. The two public documents that claim the source is public — [`privacy.html`](privacy.html)
  and [`docs/FERPA.md`](docs/FERPA.md) — now name the licence too, changed in the same sitting per
  § Accommodations' rule about that pair, and the app itself is booked to say it in
  [WO-8.13](plans/work-orders/phase-8-packaging.md#wo-813--the-about-modal-names-two-documents-and-not-the-licence).
  **The copyright holder is stated in exactly one place** — `Copyright 2026 Bill Toomey`, in the
  Apache appendix at the foot of `LICENSE.md`, filled 2026-08-21. Anything else that states it
  (the README, [WO-8.5](plans/work-orders/phase-8-packaging.md#wo-85--readme-ferpa-and-known-limitations),
  still unbuilt) **quotes that line rather than composing its own.**
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
  *(**Asked and answered on 2026-08-20, the owner's call: still `main`, still directly.** Ship 3 had
  opened the day before, which is the moment the paragraph above reserved the question for, and
  WO-4.2 was the first work order to reach a commit inside it. Nothing about a branch would have
  helped this one — it was built, recovered from a dead dispatch, verified and mutation-proved in a
  single sitting, and the only reader of the intermediate states was the sitting itself. **So the
  deferral above is closed rather than still pending**: the next session should not re-open it
  looking for a decision that was never made. Reverse it when work starts arriving that a second
  person has to review before it lands, which is the condition that would actually make a branch
  earn its keep here.)*

## Working agreements with the teacher

- The school's SIS remains the official record. It has **no usable export**, so rosters are pasted
  and grades are re-keyed there by hand. Don't design around a sync that cannot exist.
- Grades are entered once or twice a week; attendance is marked at the start of every class. The
  attendance flow is on the critical path — it has to be fast enough to do while students arrive.
- Five classes, reachable at a touch. The roster turns over every year; nothing may assume a fixed
  class list.
- Grading is **weighted categories**, configurable per class, since the five classes differ.
