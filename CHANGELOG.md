# Changelog

Notable changes to Planbook, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions, once they exist, follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Nothing has been released.** Everything lands under `## [Unreleased]` until the 1.0.0 call,
which is made against the criteria in `plans/ROADMAP.md` → "What 1.0.0 means" rather than on how
finished the app feels.

An entry goes in as the work lands, per the maintenance protocol — a changelog written at the end
records what someone remembered.

## [Unreleased]

### Ship 1 rehearsed — 2026-08-08

**The go-live rehearsal ran clean, two weeks early.** A full simulated school day in a throwaway
year — five classes, one dropped, one marked late, one left untaken, one marked for yesterday —
then the year deleted and the live ledger confirmed untouched. A mark survives a reload and a
force-quit. A full class marks in airplane mode and loses nothing on reconnect. Browser storage was
wiped to the floor and every mark, student and class came back from the backup file — which also
re-proved the install path, since clearing site data takes the service worker with it. Installed on
the teaching iPad (iPadOS 26.5.2), launching without browser chrome. Roll Call! is still deployed
and stays deployed.

**What is verified and what is not.** The attendance arithmetic agrees with a hand count — but
against backfilled test data, because no real class exists before the term. That check re-runs in
week one against a live roster, and until it does, the tick is about the formula rather than about
the term.

**One thing the rehearsal could not close, recorded here so it is not lost.** The backfilled test
data is still in the live year. The rehearsal was designed so it could not contaminate the ledger,
and it did not — but the ledger was already carrying fabricated meetings before the sitting began,
and in this data model a fabricated meeting *is* a meeting: it sits in the denominator of every
percentage and in the recorded-meetings count, indistinguishable from a real one. The term should
open in a fresh year, with the test data left in one labelled unmistakably.

### Added

- **A new assignment can be made from the score grid.** The quiz you just gave gets its column
  without leaving the screen: **+ New assignment** sits above the grid beside **⌨ Keys** and opens
  the same editor the assignment list opens — same fields, same rules, no second set of them — with
  the new column appearing in the grid the moment you are done. No repaint, no navigating back. It
  replaces a four-step trip out to Assignments and home again.

  **Cancel now does what it says, on both doors.** The editor writes the assignment first so every
  field can save as you type, which meant backing out of a create used to leave an *Untitled*
  assignment behind. There is now an explicit Cancel that removes it and its empty column, and
  because it belongs to the shared create flow rather than to the new button, the assignment list
  gained the same way out. Close, Escape and a tap outside still leave your typing where it is —
  those are interruptions, not decisions.

- **Overdue hall passes now make a sound.** A student five minutes out gets a steady double beep;
  ten minutes gets a faster, rising one, so the two are tellable apart without counting. The alert
  follows you off the registry — it reaches you on the score grid or a student's detail, where it
  was silent before. The spoken announcement and the colour on the pass card are unchanged, and a
  new speaker button in the header silences the sound in one tap for a test, showing a slash through
  itself while it is off. The announcement and the card colour stay either way, so silencing the
  room does not silence the alert.

  The tones are the ones Roll Call! has used for a year — the same frequencies, note counts and
  gains — because they were tuned against an occupied classroom and re-deriving them would be
  guessing at an answer somebody already has.

  **This shipped inaudible on the iPad and had to be corrected the same day, which is worth
  recording rather than quietly fixing.** The first build created a new audio context each time an
  alert came due, which is what the source app does. On current WebKit an audio context created
  outside a user gesture reports itself healthy and plays to nothing: it says it is running, its
  clock advances, its notes are scheduled, and no sound leaves the device. It was audible on the
  laptop throughout, which is exactly how it passed. The app now holds a single audio context from
  the teacher's first touch and plays every later tone through it.

  **No automated check could have caught it, and none can.** The harness can confirm that notes were
  scheduled on a context that claims to be running — which is precisely what the silent build
  reported. Whether a room hears anything is a question only a person in a room can answer, and it
  took two sittings on the teaching iPad: one that found it, one that confirmed the fix.

### Changed

- **Hall-pass overdue alerts are computed from the year document rather than from the banner's cards,
  so leaving the registry no longer delays them.** One guard, in the code that ticks the pass clock
  once a second, had been written for the empty-banner case and was switching off the alert as well
  as the on-screen figure. The practical effect: a student who has been out twenty minutes is
  announced while you are entering scores, and an iPad that iOS suspended mid-period alerts on the
  way back in rather than waiting for you to return to the attendance screen. The delay this removes
  had no upper bound — it lasted as long as you stayed off that one screen.

  **What it does not do, stated because the distinction is easy to lose.** This fixes who the alert
  is *computed* for, not who can *perceive* it. The announcement goes to a region that is deliberately
  invisible, so away from the registry a sighted teacher is still told nothing. Restoring the sound
  that Roll Call! has always had is the next work order, not this one.

  **A second bug was found on the way and deliberately not fixed here.** Archiving a class while a
  student is out on a pass silently re-points the alert at a different class's passes — the student
  in the archived room is simply never alerted on again. It has its own cause, in how the app
  resolves which class is open, and no check in the project can currently reach it. It is booked
  rather than folded in, because a fix smuggled into an unrelated work order is a fix nobody reviews.

- **Nothing you can see, and one thing you can now trust.** Four comments in the hall-pass code were
  saying things the code beside them did not do, and two checks in the harness were passing over
  behaviour that could have been deleted without turning them red. Both are fixed. The one that
  matters is a new standing check: `src/shell.js` keeps a list of every hook in the app, that list
  had been quietly seven rows short across two work orders, and a missing one now turns the sweep red
  instead of waiting for somebody to notice.

  **The work order got its own diagnosis wrong, and that is the part worth recording.** WO-2.27 was
  booked to pay comment debt and opened by asserting that the pass clock keeps ticking pointlessly
  after you leave the attendance screen. It does keep ticking — the ticks are not pointless. They are
  what fires the overdue alert when a student has been gone twenty minutes, and stopping them, which
  is what the work order asked for in as many words, would have silenced that alert on every screen
  but one. The implementer declined and wrote the argument down; the verifier failed the line anyway,
  on the grounds that reading the code right is not the same as delivering what was asked. Both were
  right, and what they had actually found was a decision nobody had taken.

  So the line was re-cut to what the work really delivered, and the question — *how far should the
  overdue alert follow you off the registry?* — went to a work order of its own. Asking it turned up
  two things nobody had noticed, and they are not the same kind of thing.

  **One is a plain bug, and it is booked as WO-2.28.** Switch class while you are anywhere but the
  attendance screen and the overdue alert goes quiet for *both* classes until you go back to it. One
  guard, written for an empty banner, was stopping the alert as well as the clock face.

  **The other turned out to be a missing half of the feature, and it is booked as WO-2.29.** Off the
  attendance screen the alert only ever reaches a screen reader: the card that changes colour is on a
  banner you are not looking at, and the spoken sentence goes to a region that is invisible by
  design. Roll Call! is where this alert was lifted from, and over there the thing that gets your
  attention is **a sound** — the spoken sentence sits beside it as the version for a teacher who
  cannot hear it. Planbook took the second half and left the first, and then a comment was written
  claiming the second half was the whole alert. The sound is being brought across, with an off switch
  for test days. Neither of these is a regression; both have been true since the alert shipped.

- **The briefing layer is true again, and now inside the maintenance protocol.** `CLAUDE.md` told
  every session and every dispatched agent that this project was *"pre-code… no app code exists yet"*
  and that git was *"not yet initialized"* — through 133 commits, 25.5k lines of app, a live
  deployment, and roughly fifty dispatches. Its Commands table read *"No code yet, so nothing to build
  or test"* while ten scripts sat in `tools/`, including the two an implementer reaches for first.
  `AGENTS.md` was accurate the whole time and opens by pointing at `CLAUDE.md` as "the real briefing,"
  so every Codex run was routed by a current document into a stale one.

  **Nothing caught it, and that is the part worth recording.** The roadmap boxes, the dashboard, the
  work-order status lines and this file all stayed accurate to the commit across those nine days, and
  `wo-gate.mjs --audit` checks three of the four against each other on every run. `CLAUDE.md` was
  simply not a member of any set anything iterated over. **A protocol that lists its artifacts by name
  silently exempts every artifact added after it was written** — which is now `ROADMAP.md`'s
  maintenance **step 5**: if the work changed what a cold reader needs to know, `CLAUDE.md` and
  `AGENTS.md` move in the same sitting, both or neither.

  **What the file says now.** Ship 1 delivered and Ship 2 in flight, the deploy origin, a real
  Commands table, and a short pointer section naming the orchestrator → implementer → verifier
  pipeline without restating its rules. No progress count is written into it at all — the file now
  says to take those from the dashboard, because a number kept in two places is a number that rots in
  one. The phase-branch convention is restated as standing, with its August drift recorded rather than
  quietly ratified: WO-3.9 and the eight commits before it landed straight on `main`.

  **Two operating rules reached `AGENTS.md`** that had never been written down anywhere: a sandboxed
  agent that cannot start `verify-shell.mjs` reports *"could not run"* as an environment, not a
  result — a pass is never inferred from a harness that did not execute — and no agent ever ticks a
  👤 line. The five-document briefing layer this exposes (~1,400 lines across `CLAUDE.md`,
  `AGENTS.md`, the three agent definitions, and two `plans/` files, split under cost pressure and
  never designed) is written up in `plans/dispatch-retro.md` as a question for the Ship 2 pipeline
  audit, not answered here.

- **WO-3.14 — grade percentages now read to two decimal places.** The screen and the school's SIS
  disagreed in precision — the SIS carries two decimals and this app showed one — so every grade
  re-keyed into it went through a rounding step done in the teacher's head, at every row of a class
  of twenty-five. That is the one place a transcription error costs a student a grade, and it is
  silent, because converting a number looks exactly like reading one. The re-keying tax is the tax
  this app cannot remove (the SIS has no import), so the one thing it can do is make the number on
  the screen the number that goes in the box.

  **Rounded, not truncated.** A grade of 86.7272… reads `86.73`, not `86.72`. One function formats
  every percentage, so the grade column, the class average and the summary moved together or not at
  all — a grid at two decimals beside a summary at one would be worse than the mismatch this fixes.

  **Two things deliberately did not move.** The attendance percentage still reads as it did: it is
  not re-keyed into anything, so precision there buys nothing and costs a digit of glanceability.
  And `Weights total 100%` stays whole beside a `87.00%` average, which looks like mixed precision
  and is not the same kind of number — a weight is typed by the teacher, never transcribed out.

  **Letter grades are untouched**, and still computed from the unrounded percentage. A boundary of
  89.5 is decided by the real value, not by what the screen happens to display, which is the rule
  WO-3.2 set and this change was careful to leave standing.

### Added

- **WO-2.26 — the hall passes are on the student's page now.** Open a student from the score grid — or
  from *Grades for …* on their attendance — and the trips they took **this term** sit on the page
  beside the grade and the attendance: the day, the time out, the time back, the minutes, and whatever
  was typed on the pass. It prints with the sheet. The attendance history dialog still says how many
  trips and how many minutes while you are marking attendance, and that number is the same number,
  because it is the same count over the same term. Presentation mode takes both of them off the screen.

  **Two decisions worth knowing.** The count is **term-scoped on both surfaces**, which the class-wide
  **🚪 Passes** dialog is not — that one stays the year-wide view it has always been, and the date
  window telling them apart lives in `src/passes.js` alone rather than in either screen, so three
  callers ask one question. And the breakdown has **one home**: the first cut of this work order put a
  🚪 Every trip door on the attendance history dialog, one screen upstream of where a teacher actually
  talks about a student. The door was deleted and the trips became a card on the page itself, which is
  where Roll Call! has always carried them.

- **WO-2.9 — a hall pass says how long, and the record says how often.** The pass card now carries the
  elapsed time, counted from the moment the student left rather than by a timer running — so it is
  still right after the iPad has spent ten minutes in a bag. The card turns amber at five minutes and
  red at ten, and says so once each rather than once a second. And **🚪 Passes** in the registry
  toolbar opens the record: who has been out of this room, how often and for how long, and one tap
  further in, one student's own trips with their times, their minutes and any note typed on the card.
  Names on that screen disappear in presentation mode — the first surface in the app where what the
  switch hides is a **name** rather than a support field.

  **Two decisions worth knowing.** Whether an alert has fired is a field on the pass itself
  (`alerted: 1|2`) rather than a variable in a module — the same inversion WO-2.8 made about the pass —
  so "fires once" survives a repaint, a reload and a force-quit, and a trip that crossed both
  thresholds while the app was shut announces once at the level it actually reached rather than twice
  on the way up. And the history is its own file, `src/pass-history.js`, rather than a section of the
  attendance report: that module's header promises it never imports `src/supports.js`, and this surface
  has to ask about presentation mode. Two files, two promises, both true — **at the cost of two dialogs
  where Roll Call! gives one page.** The owner found that the same afternoon, asking where the record
  of a hall pass was; WO-2.26 is booked to join them without either file breaking its promise.

- **WO-3.19 — the score grid says *which* columns are past due, in one colour.** A column head whose
  work the past-due prompt is asking about prints its due date in `#8a6d1a` instead of `#a0aab8` — the
  same amber the assignment list's dates have always worn for the same fact, and the same the banner is
  written in. The banner says *"6 blanks are past due"*; the tint says which columns, without opening
  the review. It writes nothing and marks nobody, and it goes as soon as the blanks are filled or marked.

  **The comments were the deliverable; the pixel was the smaller half.** Nineteen comment sites across
  eight files named WO-3.6 as the owner of every rule about a past due date on the score grid, and
  WO-3.6 closed ✅ DONE without the tint — correctly, since it was never in its Deliverables. That left
  prose pointing the next reader at a *closed* work order for work nobody was going to do, on the two
  files (`src/scores.css`, `src/scores.js`) that WO-3.13, WO-3.15 and WO-3.16 each open on their way in.
  `src/scores.css` carried a paragraph explaining why the rule was *absent*; it now explains what the
  rule is, with the old paragraph preserved verbatim under a dated heading rather than deleted. Six
  comments were rewritten, four gained a clause, nine were left exactly as they stood — because WO-3.6
  really does own the prompt, and a blanket rewrite would have destroyed true provenance, which is this
  work order's own failure pointed the other way.

  **One reader of the clock, and the check that proves it.** `src/scores.js` still contains no
  comparison against a date and imports no `todayISO()`. `columnHead()` asks `src/past-due.js`'s new
  `pastDueAsksAbout()`, a read of the same `previewed` set the sentence and the review are drawn from a
  few lines earlier in the same render — so the amber heads and the sentence *cannot* name different
  work, by construction rather than by two comparisons happening to agree. Mutation-tested: a build
  whose tint answers its own `due < today` off the document reddens exactly one check, and it is the
  one that matters — the heads stay amber after **Mark them missing**. The first three acceptance lines
  stay green under that mutation, which is why the fourth exists.

- **WO-3.21 — the harness now proves the accommodation prompt counts students, not rows.** WO-3.8's
  prompt says *"3 students have extended time"*, and `groupsFor()` keeps that true by deduping on
  student id. Nothing tested that it did: the WO-3.8 fixture never gave one student two rows of the
  same kind, so **the `seen` Set could be deleted outright and all 710 checks stayed green** —
  measured at that work order's own verification rather than assumed. `wo38-s1` Ashdown now carries a
  second real `extended-time` row scoped `['unit tests']` beside the original scoped `['tests']`,
  both matching **Tests** through the same lean-toward-showing match rule the prompt already relies
  on, so a row being ignored as unreal is not what the check is measuring.

  **Five red, and which five is the whole point.** With the dedupe gone the run reads `710 checks ·
  705 passed · 5 failed`, exit 1: the sentence becomes *"4 students have extended time"*, the reveal
  puts six chips on screen with Ashdown named twice, and both readings fail again on the round trip
  back from Homework and on each edge of the presentation-mode flip. Nothing in attendance,
  categories or backup moved. **Nothing reddening would have meant the fixture proves nothing;
  everything reddening would have meant it is coupled to something it should not be.** The failure
  text for each of the five is tabulated in `tools/README.md` § WO-3.21.

  **No check was added, and that is the result rather than a shortfall.** The work order asked for a
  new one only if the existing checks did not already carry the case, and the mutation showed they
  did — so `verify-shell.mjs` still holds 713 call sites and still executes 710 of them, and the
  count in `tools/README.md:783` that `wo-sweep.mjs` greps for correctly did not move. The single
  edit is the fixture row. `src/accommodation-prompt.js` was reverted and confirmed byte-identical to
  `HEAD` by hash, twice — once by the implementer and once independently.

- **WO-3.8 — accommodations announce themselves where the work is written down.** Create an
  assignment and, if anyone on that roster has an accommodation that applies to the category you
  picked, the editor says so: *"3 students have extended time, 2 need a separate setting."* Beside it,
  **Show which students** — and nothing else. Change the category to one nothing applies to and the box
  goes; change it back and the sentence returns.

  **It exists because a list nobody opens protects nobody.** A teacher is legally obligated to
  implement an accommodation, and a roster field you have to remember to open is a field you open in
  September and not in March. So the prompt goes where the decision is actually made — in the dialog
  where a test is written down, at the moment its category is chosen — and it says *how many*, not
  *who*, until you ask.

  **Counts are the default and names are a deliberate tap, and the names do not stay.** They re-hide on
  every repaint: a category change, a re-opened dialog, a presentation-mode flip. A panel that sprang
  back open by itself would be putting a student's file on screen without the tap the rule asks for.
  The box also says where the counts came from — *"They apply to work in 'Tests', which is where this
  assignment counts"* — because a count with no scope on it is a count you have to guess at, and it
  states in the same breath that this is on screen only: never printed, never exported, never put in a
  draft.

  **In presentation mode there is nothing at all — not even the count.** No greyed-out version, no
  collapsed box with a number in it, nothing that only looks absent. *"3 students have extended time"*
  on a projected screen, in a room of thirty, beside a roster on the wall, narrows to individuals. So
  the box is gone from the page rather than hidden on it, and the reveal cannot be reached even by
  someone who goes looking for it — the guard is in the code that writes the names, not in the absence
  of a button. Deliberately there is **no placeholder** where the box was: any "something is hidden
  here" sentence announces that this class has accommodations on it, which is the disclosure being
  prevented.

  **The match leans toward showing, on purpose.** What an accommodation applies to and what a category
  is called are both prose you typed, months apart — so `tests` covers `Unit Tests`, `unit tests`
  covers `Tests`, and case, spacing and plurals do not matter. Under-firing is the failure that counts:
  a prompt that does not appear is a legal obligation not surfaced, and it is invisible. A prompt that
  appears when it needn't is one extra line in a dialog.

  **It counts students, not rows.** Two extended-time notes on one student is one student who needs
  extended time. A number larger than the room is the kind of number that makes you stop believing the
  prompt.

  **Checked on the hardware on 2026-08-13.** "Show which students" reads as a disclosure rather than a
  "more" link and is not caught while reaching for the buttons below it; the box reads as a fact about
  students rather than as a warning, wearing the roster's own subdued support card rather than the
  past-due amber twenty lines up the same stylesheet; turning presentation mode on with the editor open
  reads as the box having gone rather than as the assignment having lost something; and the screen
  comes up offline from the precache.

  **What is not here.** An accommodation with an attendance clause — *"call home on the third
  absence"* — does not surface anywhere yet. It waits on Phase 4, and for a narrower reason than it
  first looked: attendance marking and its counts have shipped, so the behaviour log was never the
  blocker. What is missing is the clause itself. There is no field to hold it, and guessing at one out
  of the free-text behaviour plan would be this app inventing a teacher's intent about a child.

- **WO-3.6 — the past-due prompt.** Open a class's scores or its assignment list and, if work whose
  due date has gone by still has blank cells, a banner asks: *"6 blanks are past due — mark them
  missing?"* **Review the 6** lists exactly which cells it means, student by student. **Mark them
  missing** writes them all at once. **Not now** writes nothing and stops the prompt asking about that
  work on this device.

  **It is a prompt and it is never arithmetic.** An earlier draft of this app computed `missing` from
  the due date — blank plus past-due equalled zero — which meant a teacher who hadn't finished grading
  was failing half the class by Sunday. No grade in Planbook has ever changed because a date rolled
  over, and none does now: nothing is written until you tap the button that says in words what it will
  do. Work due *today* has not gone by, and work with no due date can never be past due.

  **What the prompt will not touch is the safety of the feature.** A cell it offers to fill is one
  carrying *nothing at all*. A cell you marked `excused` is a decision, and sweeping it into `missing`
  would turn that decision into a zero — the most expensive mistake this feature could make. A `late`
  with no score yet records that the work *arrived*; marking it missing would record that it never did.
  Both are left alone. So this count and the grid's own "N blanks" summary can legitimately differ on
  screen at once — they answer two different questions, and this one is allowed to be the smaller.

  **A dismissal is a preference, not part of your year.** It lives beside the other UI settings as an
  assignment id and nothing else — no name, no date, no student, no score. The year document was the
  other candidate and is the wrong home: it syncs and is restored from backup, so a restore would
  resurrect or destroy dismissals along with the grades, making a nudge part of the record of a school
  year. The accepted cost, stated rather than hidden: **dismiss on the laptop and the iPad still asks
  once.** For a prompt whose whole job is to ask, that is the right way round — accepting on either
  device writes the same cells.

  **It is a banner, not a dialog, and that was the decision most likely to go wrong.** A dialog on
  arrival would put a focus trap between you and the first cell of the column you came to type, and
  would break WO-3.5's shipped guarantee that `Esc` mid-column closes nothing. So it is the same inline
  notice the no-grade banner beside it is, in the overdue tint's own amber, with the review expanding
  inline underneath. Checked on the hardware on 2026-08-13: the three controls are separately tappable,
  **"Mark them missing" is not caught while reaching for "Not now"**, the banner reads as an offer
  rather than an error above a grid, and the screen comes up offline from the precache.

  **What the desk check could not have caught on its own.** Three of the four acceptance criteria are
  satisfied perfectly by a build that draws no prompt at all, so every "nothing moved" reading is taken
  beside an accept that proves the screen *can* move — one row from 68.00% to 50.00% on the same cells
  the checks above assert are still. Two deliberate breakages confirmed the set is the part under test:
  reusing the score grid's own idea of "ungraded" turns the excused cell into a zero and goes 8 red,
  and counting today as past due goes 9 red.

- **WO-3.9 — grade sheets you can print and re-key from.** A class's whole term on one page.
  **🖨 Grade sheet** on the Scores screen opens the sheet in the order the SIS is typed in: students
  down the page by last name as `Last, First`, assignments across by due date, each column carrying
  its due date and what it is out of, and the grade and letter at the right. The same sheet downloads
  as a CSV in the same order. Your marks print as your marks — a late score keeps its number *and* its
  `L`, missing is `M`, excused is `Ex` — and an ungraded cell prints as nothing, because a blank is
  not a zero. **Nothing from a student's support details is on either one, in either mode.**

  **The order is the whole value of this, and it was answered rather than guessed.** The SIS has no
  import, so every grade in it is typed by hand off a sheet of paper, five classes at a time. A
  student-major grid was chosen against a drawn mock-up of the alternative — one section per
  assignment with the roster repeated inside each — which reads straight down while typing but never
  puts a student's whole term in one place and costs several times the paper. Confirmed against a real
  re-key on 2026-08-12: the order matches.

  **Nothing here computes a grade.** Every percentage and letter comes from the one grade engine, and
  what a cell holds is asked of the score grid the sheet is printed from — two implementations of one
  arithmetic is exactly how a sheet comes to disagree with the screen it came off. The printed page
  and the CSV take every cell string from the same function, so *"the printout and the file must not
  disagree"* is a fact rather than a promise.

  **Fixed before it left the desk: the second print came out as the whole app.** The Print button
  worked exactly once per sitting. Chrome refuses a repeated `window.print()` with *"This website has
  been blocked from automatically printing"* — and a refused `print()` does not block, so the 500ms
  timer that cleared the print gate had run by the time you pressed Allow, and the print that finally
  happened was ungated. Turning the preview from portrait to landscape did the same thing by the other
  road: the preview re-generates from the live page, also after the timer. One mistake, not two — the
  gate was *set* when the app asked to print and *read* when the browser actually printed, and the gap
  between those is however long you look at a preview. **It is now answered at the moment the browser
  serialises the page**, by asking whether the grade sheet is what is on screen, which is
  self-correcting rather than balanced: a print you block outright leaves the gate on, costing nothing
  because only `@media print` reads it, and the next print of anything clears it.

  **The check that was watching this went green through the whole bug.** It asserted the gate was off
  again 700ms after the tap — measuring the release timer rather than what comes out of the printer,
  and the timer *was* the bug. It is gone, replaced by four that fail on the build that shipped, plus
  a fifth that settles what the timer never could: one tap calls `window.print()` exactly once, so the
  message Chrome still shows on a second tap is the browser's own repeat-print policy and not a
  handler firing twice. That one is left alone — nothing on the page can suppress it.

  ⚠️ **The same timer is still in the attendance record and the per-student detail sheet**, lifted
  there first and copied here from them, so both of those print surfaces still have this bug. Left for
  a decision of its own rather than folded in here.

- **WO-8.8 — a check that reads the deployment instead of the repository.** `tools/verify-deploy.mjs`
  makes one pass of HTTP requests against the live origin and reports what came back: status,
  `Cache-Control` and the redirect chain for the shell and the service worker, every path in the
  deployed `sw.js`'s precache list resolved without following a redirect, and the deployed `CACHE`
  string compared against the working tree's so *"I forgot to push"* stops looking like *"the fix
  didn't work"*. Run it by hand after a deploy, and after any change to `_headers`, the `SHELL` list,
  or the Cloudflare zone's caching settings.

  **It exists because the first deployment shipped two faults and every check in this repository was
  green through both of them** — 628 of 628 before, 628 of 628 after, the same number both times.
  One fault was the host's routing and one was a setting in a dashboard; neither is a fact that
  exists in these files, so nothing that reads these files could have found either. What found them
  was a single request against the live origin, typed by hand during a support conversation. This is
  that request, written down.

  **It reads the deployed `sw.js`, never the local one**, which is the whole point: sourcing both
  sides from the working tree would compare the repository with itself and pass forever. It follows
  no redirects, because a followed 308 is indistinguishable from a 200 and that is exactly how
  WO-1.14 stayed invisible. And it does not retry — a flaky result is information, and a retry that
  smooths it over turns this into the confident pass over nothing that is worse than no check.

  **An origin it cannot reach reports as unreachable, not as a failure.** This is the first check
  here that needs a network, so it is useless on a plane and will misbehave on bad hotel wifi; a
  network error dressed up as a failed assertion would be worse than having no check at all. It has
  its own exit code for that case, distinct from a red check, including when the connection dies
  partway through — *"nothing was asserted after 7 check(s)."*

  **Each check was proved against the defect it is named for**, on throwaway origins built to fail:
  the zone rewriting `Cache-Control` on `/sw.js`, a shell path answering with a redirect, and a
  precache entry that exists only on the wire — the last of which a repository-reading tool cannot
  fail by construction. **It gates nothing**: no hook, no CI, referenced by no other script, and the
  app ships without it.

- **WO-8.7 — Planbook has an address: `planbook.hwgteach.com`.** The app is on the internet, over
  HTTPS, installing to a home screen. The distribution story is one sentence and no store is in it:
  *a teacher hears about Planbook from another teacher, types the URL, and taps Add to Home Screen —
  no store, no download, no account, and nothing to sign into before she marks her first class.*

  **That sentence ends at the home screen on purpose.** iOS evicts a non-installed site's storage
  after about a week of non-use, and installed PWAs are exempt — so *Add to Home Screen* is not the
  polish at the end of the distribution story, it is the step that makes the app safe to keep a term
  of grades in. A version of the sentence that stops at "types the URL" is describing a way to lose
  them.

  **Its own subdomain, not the apex, and that choice is about storage rather than tidiness.**
  IndexedDB and service worker scope are per-origin. Sharing an origin with anything else on
  `hwgteach.com` would mean sharing a storage namespace with it, and this app keeps a year of grades
  in there.

  **Cloudflare Pages, chosen on a property rather than on price.** With no `functions/` directory
  there is nowhere for server-side code to run, so "no vendor server ever touches student data" is a
  checked fact about the deployment instead of a promise about our future behaviour. Confirmed in the
  build log and the dashboard, not assumed. `_headers` pins the shell and the service worker to
  `no-cache` so a deploy actually reaches a teacher who already has the app.

  **`hwgteach.com` is verified with Google**, which is what unblocks Drive sync reaching a second
  device. Nothing about sync ships yet, and the app works fully signed-out as it always has.

### Fixed

- **WO-2.25 — the second print of a sitting came out wrong, and dismissing the browser's warning
  made the app unusable.** Printing the attendance record or a student's grade detail twice without
  leaving the screen, or turning a preview to landscape, could put **the whole app** on the paper
  instead of the sheet asked for. Chrome refuses a repeated `print()` with *"This website has been
  blocked from automatically printing"* — and a refused `print()` does not block, it returns at
  once, so the half-second timer that un-marked the page had long since run by the time **Allow**
  was pressed. Rotating a preview does the same thing by a different road: the sheet is re-drawn
  from the live page, and by then the mark was gone too.

  **The page is now marked at the moment the browser prints it, not half a second after the tap.**
  Both failures were one mistake — the question was answered when we asked to print and read when
  the browser actually printed, and the gap between those is however long a teacher looks at a
  preview. All three print surfaces share one mechanism for it, so the next printable screen
  inherits the fix instead of copying the bug; it had already been copied twice.

  **The fix's own regression, found at the printer and fixed the same day.** Pressing **Ignore**
  rather than Allow deliberately leaves the page marked — harmless by design, since only the print
  stylesheet was supposed to read that mark. The detail screen's Print button carried the *same
  name* as the mark, so afterwards **every click anywhere on screen re-opened the print dialog**,
  which is an app a teacher cannot use until reload. The button was renamed; the two other surfaces
  had escaped by luck of naming and are now guarded by the same check, which asks all three rather
  than the one that broke.

  **What a teacher should notice.** Chrome still shows the block on the second print — that is the
  browser's own repeat-print policy and nothing on the page can suppress it. What changed is what
  comes out **after** Allow, and what happens after Ignore. Verified at a real printer on
  2026-08-13, including Share → Print on the iPad, which is that device's only route to the same
  guarantee.

- **WO-1.15 — the restore confirmation could not see what it was about to delete.** It compared the
  two documents by roster: which year, how many classes, how many students, when each was saved. A
  roster barely changes across a term, so a file saved in week one and a device holding ten weeks of
  marks looked *the same* on that screen — same year, same twenty-five names — and the only honest
  thing on it was a date the teacher had no reason to read as a warning. Pressing **Replace** was
  the correct-looking act that destroyed the term.

  **The confirm now counts the record on both sides** — recorded meetings, attendance marks,
  assignments and score cells — and when the year on this device holds more of it than the file
  does, a red line says so in words, naming what would be lost before the button is reachable. The
  numbers in that sentence are the **subtraction**, not the stored totals: a file holding one of
  each against a device holding three meetings, three marks, two assignments and three scores reads
  *loses 2 recorded meetings, 2 attendance marks, 1 assignment and 2 scores*.

  **It is silent whenever the act is safe**, and that is the point rather than an omission.
  Restoring a year from its own backup, or from a fuller one, or adding a year this device has
  nothing for, says nothing extra — a red panel a teacher meets on every ordinary restore is one she
  learns to tap through before the day it matters. The test is an excess, not a difference.

  **Nothing sensitive is counted.** No accommodation, medical or plan data appears on the panel in
  either presentation mode, not even as a bare number — the four record counts are the whole of it,
  deliberately.

  **What this is and is not.** The year label remains the primary guard, and opening the term in a
  fresh year (WO-1.16) remains the primary fix; this is defence in depth for the case where both
  devices carry the same label, which is the case today. Worth recording alongside it: the 628
  existing automated checks were green over the whole of this defect and stayed green through every
  mutation of it — the eight checks added here are the only ones that ever saw it. A check can only
  see what it was pointed at.

- **WO-1.14 — the app loaded once and then refused to load again.** On the first real deployment,
  Planbook came up, and every navigation after that failed. Safari said *"the response served by the
  service worker has redirections"*; on a home-screen icon that is a white screen where a term of
  grades used to be.

  The service worker precached `index.html`, the host answers that path with a redirect to `/`, and
  the cached copy carried the redirect with it — which a browser is not allowed to serve to a page
  navigation. The worker now caches and serves `/`, the same bytes without the redirect, and the
  cache version was bumped so the bad copy is deleted rather than inherited. **Anyone who loaded the
  broken version is fixed by opening the app again**; no reinstall, and nothing stored was ever at
  risk — the failure was in delivering the app, not in the data it holds.

  **Worth saying plainly: every automated check passed the whole time.** All 628 of them, before the
  deploy and after the fix, with the same number both times. The redirect belongs to the host and
  does not exist anywhere in this repository, so nothing that reads the repository could have seen
  it. The first deployment was the instrument, which is the argument for having done one three weeks
  before the term rather than three days.

- **WO-8.7 — the service worker was being cached for four hours despite the rule that said not to.**
  `_headers` asked for `no-cache` and was correct; the Cloudflare zone's own four-hour browser cache
  setting rewrote it on the way out. The shell document escaped only because HTML is not edge-cached,
  so the one file the pinning exists for was the one file it failed on, and the page it protects
  looked fine. Fixed by setting the zone to respect existing headers, and read back off the wire
  rather than off the file.

### Added

- **WO-3.7 — a student's whole grade, on one screen you can hand across a desk.** Tap a student's
  name on the score grid — or the new *Grades for…* button inside their attendance history — and
  their grade opens as its own screen: where the number comes from category by category, what is
  still missing and what it is worth, what score on the outstanding work would reach the next
  letter, and their attendance for the same term. The student's name sits in the class switcher
  while you are in it and leaves when you go.

  **It prints, and it downloads as a CSV** — one student, the sheet a guardian takes away from a
  conference. Neither carries anything from a student's support details, in either presentation
  mode. That is not a filter that could be switched off: `src/detail.js` has no path to that data
  at all, so the question is trivially true rather than conditionally true. The check that matters
  is the one run with presentation mode **off** and a plan, a case manager, a review date, an
  accommodation, a medical line and a behavior plan all planted on the student first and asserted
  present in the document — a build that merely gated the screen on the toggle would pass the
  mode-on pass and fail this one.

  **The "what it would take to move" figure rounds up, never to nearest**, and the code argues it
  at the site: a rate rounded down reads as reaching the next band and does not. Missing work and
  zero-point bonus work each get their own line rather than being folded into the main figure,
  because a percentage of nothing is nothing. A student with nothing outstanding is told so in
  words instead of shown an empty number.

  **The contribution column is rounded so that it adds up to the total printed under it.** On a
  student where rounding each row on its own gives 36.71 + 25.00 + 21.18 = 82.89 under a total of
  82.88, the screen prints 36.70 + 25.00 + 21.18. A column that does not sum is the one thing a
  parent will check by hand.

  **One defect is worth recording, because three green runs missed it.** The sheet shipped printing
  in a single column — "two pages of half-empty paper" — and no run of the harness could see it.
  Under print media a `max-width` query resolves against the **page box**, not the viewport, and
  Letter at a 10mm margin is ≈740 CSS px, so a tablet-portrait `@media (max-width: 1024px)` rule
  was live on paper and beating the print block's two-column grid. The harness snapshots at 1280px,
  where that rule is dormant. It was found by rendering to an actual PDF, fixed by restating the
  grid inside the gate, and then generalised: a check now requires **every** `max-width` rule that
  touches this sheet to be restated inside the print gate (`0 unpinned`), which turned up two more
  dormant instances of the same defect. Both new checks were watched failing against the pre-fix
  stylesheet before being accepted green.

  **The BOM is asserted useful rather than merely present**, which is the hole WO-2.6 left open:
  both fixture surnames leave ASCII, and the same bytes decoded as Windows-1252 read
  `Ã‘uÃ±ez-Ã–ztÃ¼rk` — the failure the BOM prevents, demonstrated rather than described. The paper
  and the spreadsheet were then confirmed by hand, on a real printer and in the spreadsheet the
  teacher actually uses, because bytes are not Excel and no emulator has paper.

  This also settles the half of WO-3.3 that could never be demonstrated when it was built: there
  was no per-student screen to enter or leave, so the breadcrumb name was never drawable. Both
  directions are now shown, against each of the three tabs in turn rather than the one somebody
  tested.

- **WO-2.24 — the harness now notices if the shared date reset is deleted.** WO-2.23 put a single
  `input[type="date"] { -webkit-appearance: none; appearance: none; }` in `src/shell.css`, and seven
  date fields on four screens depend on it. Two of them — the assignment editor's — keep an identical
  copy in `src/assignments.css` on purpose and were the only ones anything had ever read a style off.
  **The other five could lose the shared rule and every check in the repo stayed green.** Three new
  checks read the computed `appearance` on the term editor's dates, the days-off *From* and *To*, and
  the plan *Review date*, each at a point in the run where that dialog is already open for other
  reasons — and each asserting the dialog *is* open and the fields matched, because a `display: none`
  node cannot answer a style question either. **595 → 598 executed checks**, 599 call sites.

  **Deleting the rule turns exactly those three red and nothing else** — `598 checks · 595 passed ·
  3 failed`, exit 1, each detail reading `appearance auto, -webkit-appearance auto` and naming the
  sheet the rule belongs in. The 595 that stayed green are the reason the work order existed.

  **The work order's premise was re-measured rather than inherited, and half of it had gone stale.**
  It says these five fields live behind dialogs the harness never opens — true when written, and no
  longer: WO-2.21 landed in between and its coarse sweep opens all three of them and asserts 44px on
  every control, date fields named in the messages. That does not close the hole; it *is* the hole.
  On the deleted-rule run those three sweeps stayed **green** — *"measured 22; under = []"* and its
  two siblings — while the three new checks went red. So WO-2.23's Trap is no longer an argument
  about what a height check would do here. It is a measurement of what the height checks already in
  this harness *did* do, on the broken tree, in the same run.

  **This is a claim about the cascade and never about the box, deliberately.** Desktop Chrome honours
  an author's `min-height` on a date input with the reset and without it, so a height check is green
  on the broken tree — which is the check WO-2.23's Traps forbid. `appearance` is the value that
  actually moves between the two trees, which is what makes a guard out of it. No height, width or
  touch-target assertion was added to any date field, and the reader prints no box dimensions at all
  so that a number in a detail line cannot drift into the claim. **The rendered field stays owed to
  the iPad** under `TESTING.md` § WO-2.23's existing 👤 lines, which this work did not touch.

- **WO-3.12 — the grade engine's checks now exercise the three arguments it actually takes.** The
  arithmetic was already right and still is; what was missing was the check that would notice if it
  stopped being. WO-3.4's twelve worked cases are all one class, one term, one student — so an engine
  that ignored `classId`, `termId` or `studentId` **entirely** passed all thirteen checks. Confirmed
  by mutation rather than by reading: three separate mutants dropping those filters all stayed green.
  A grade is the answer to *this student, in this class, in this term*, and none of those three words
  was under test.

  **A decimal-weight case catches the float the old fixture could not express.** The only unbalanced
  fixture in the suite was `50 / 30 / 15` — integers, which is precisely the shape where the bug that
  was fixed last week cannot appear. With `40.1 / 34.7 / 20` the banner and the engine had disagreed
  about the same class on the same screen, `94.8%` against `94.80000000000001%`. Reverting that fix
  left all thirteen checks green. It now turns one red. A fixture whose values cannot express the
  failure is the shape this project has recorded three times.

  **One proof came back messier than the work order predicted, and it is written down that way.**
  Each new check had to be proved by breaking the thing it watches and confirming it — and only it —
  goes red. Three of the four did exactly that. The fourth, dropping the student lookup, reddens
  **five** checks: the new case, and four of WO-3.5's, whose 25-student grid reaches the same lookup
  through the screen. That is not a coupled fixture. All four extras fail on the same wrong number,
  and the check that exists to catch the screen and the engine disagreeing fails with both halves in
  perfect agreement and both wrong — one defect propagating, watched from a second path. No faithful
  version of that mutation can avoid it: an engine ignoring `studentId` corrupts every cell in any
  document holding two or more students. The acceptance line asked for something the defect cannot
  produce, so **the line was amended and the reason recorded**, rather than the result being trimmed
  to fit it.

  **No app code changed** — `src/` is byte-identical to where WO-3.4 left it, confirmed after every
  mutation's revert — and nothing here is visible to a teacher. The suite stands at 595 checks.

- **WO-2.6 — attendance you can hand to somebody.** Tap a student's name in the registry to see every
  day the class met, what they were marked, and what their attendance percentage was after each one.
  The new **🖨 Record** button in the toolbar opens the whole class's term — counts and percentage per
  student, then the term day by day — ready to print, or to save as a CSV that opens in any
  spreadsheet with the dates as columns. Both are read-only: nothing on either one can be edited, and
  neither carries anything from a student's support details, in either presentation mode.

  **The history and the percentage cannot disagree**, because they are not two calculations. Every
  row and every number on both surfaces comes off one walk over one set of records, so a day that
  counts in the percentage is a day in the list and there is no third place for the two to drift
  apart. A dropped class and a day outside the term are absent from both.

  **What "fits a class on a page" turned out to mean.** A class fits *down* a page. It is the term's
  meetings that do not fit *across* one, so the day-by-day table is cut into slices of 24 date
  columns, each starting a new page with the student column repeated, and the summary table above
  them — every student's counts and percentage — always fits on its own. That summary is the page a
  conference actually wants. What is on screen is what prints, page breaks included, so the dialog is
  a preview rather than an approximation. Printed on real paper from a term of 42 meetings before
  this went in.

  **Printing is gated deliberately.** Ctrl+P anywhere else in the app still prints the page in front
  of you, because Planbook has no default print surface — its registry is a six-day window rather
  than a term, so an ungated print rule would have handed you a blank sheet from any other screen.

- **WO-3.17 — the Assigned and Due dates.** A new assignment now starts with **both dates on today**,
  which is the day you are almost always writing it down on. Type over either one, or clear it and
  leave it blank — a date is still never required, and clearing one leaves it empty rather than
  filling itself back in. **An assignment you already have is untouched**: the default is applied when
  the assignment is created, not when the editor opens, so a blank *Due* from last month opens blank.
  A duplicate still carries its original's dates across, because the copy dialog tells you in words
  that the dates come across as they are, and a copy that re-dated itself would be doing the thing
  this work order is fixing the hint for.

  **Nothing schedule-shaped fills these fields, and nothing is going to.** Planbook has no timetable
  and is not getting one, so there is no "next meeting" to advance a due date to — today is a fact
  rather than a guess, which is why this could change while the reasoning under it did not. The hint
  that used to promise *"Neither date fills itself in"* now says what the app actually does, and so
  does the note inside the editor, which had the same sentence sitting an inch from the field.

  **And on the iPad the two date fields no longer overlap.** They were drawing at about half the
  height of *Name* and *Points*, running into each other, with *Due* clipped by the edge of the panel
  — in both orientations, and not reproducible at a desk in either. iOS Safari paints a date field as
  a native control at its own intrinsic size no matter what the layout asks for, so the box shrank and
  the widget did not; every symptom falls out of that one fact, including the 44px touch target it was
  already being given and ignoring. It is told not to now, in one line of CSS, with no width tuned
  anywhere. Confirmed on the teaching iPad on 2026-08-10 — portrait, landscape, and again with both
  dates cleared — and the native date picker still opens and commits. **The same squatness on
  *Classes & terms* and *Days off & drops* is a separate fix and is still open.**

- **WO-3.5 — the score entry grid.** Students down, assignments across, one column per assignment,
  reached from a third segment on the class strip beside Attendance and Assignments. **Type a score,
  press `Enter`, and the caret drops to the next student in the same assignment** — a class of
  twenty-five is twenty-five numbers and no mouse. At the bottom of a column it stops rather than
  wrapping, holds the caret where it is, and says *"that is the last student. 25 of 25 entered"*,
  because a key that does nothing and says nothing reads as a key that was not received.

  **`L`, `M` and `X` mark late, missing and excused from the keyboard**, and each shows in the cell
  two ways — the fill and a corner letter — because a score that silently is not what you typed is
  the worst thing a gradebook can do. Blank still means ungraded and affects nothing; `missing` is
  still the only flag that scores zero, and it is still marked by the teacher rather than inferred
  from a date. **Clearing a cell deletes the score** rather than storing an empty one, so nothing is
  left behind for a later reader to interpret.

  **Every grade beside every name is live**, recomputed on the keystroke from WO-3.4's arithmetic —
  including when an assignment moves to another category, which now moves every displayed grade in
  the class rather than only the number underneath. **And there is no grade at all until the category
  weights total 100%**, in either direction: the grades go the moment the weights leave 100 and come
  back the moment they reach it, with a banner standing where the number would have been naming what
  the weights actually come to. Nothing is blocked meanwhile — every score field stays live behind
  the banner.

  **`Escape` does nothing here, deliberately.** The grid is a screen rather than a dialog, which is
  the whole reason it is one: `Escape` is the key nearest a hand typing a column of numbers, and on a
  dialog it would throw the screen away mid-column. There is no `Escape` binding in the file at all,
  which is what makes that true rather than merely intended.

  **Verified on the teaching iPad on 2026-08-10**, in landscape, on real grades: the frozen name and
  grade columns hold under momentum scroll without shearing, the flag fills read from the back of a
  room under a projector, and the grid launches offline from the precache. Two things came back from
  that sitting. iPadOS offers the full keyboard on its number pane rather than the compact decimal
  keypad the drawing asked for — accepted, since the digits are under the thumb either way. And **the
  school's SIS carries percentages to two decimal places where this screen shows one**, which turns
  every re-keyed row into a rounding step done in the teacher's head; that is booked as WO-3.14 rather
  than left as a surprise.

  **A note for whoever adds the next screen.** The standing 44px touch-target sweep had been walking
  past this one and reporting green: it skips anything computing to `display: none`, and every view
  but the one on screen is `.hidden`. Roughly 250 score cells were never measured. The checks that
  cover this grid open it through the real navigation segment first and assert the cells are there
  before measuring — but **that fix is this screen's, by hand.** The next new view arrives with the
  same hole until the sweep itself is generalised.

- **WO-2.18 — the term-switch checks now cover all three surfaces a term change repaints, not two.**
  WO-2.17 made a term change repaint the screen it lands on, and the checks that came with it watched
  the class line and the row line. The open detail panel — the one a teacher opens *because* she wants
  the detail behind a number — had nothing on it: deleting the line that repaints it left every
  existing term-switch check green.

  **The check reads the panel out of the screen, not out of the arithmetic.** Re-reading the totals
  the paint was computed from would go green whether or not anything reached the panel, which is a
  check that proves the test rather than the app. So the ⋯ is tapped open before the term changes and
  the figures are read from the panel's own cells afterwards, with the *year* half holding still while
  the *term* half moves — the pair is what makes it a claim about the term rather than about the panel
  merely having been redrawn.

  **`selectTerm()`'s refusal of a term id belonging to another class is driven now rather than read.**
  The guard is two lines and obviously right, which is exactly the condition under which a guard gets
  refactored away by someone who is sure. Cutting it turns the new check red and nothing else in the
  whole run — the measurement of how much coverage that guard had, which was none.

  **Both checks were proved able to fail, because a check that has never failed is not evidence that
  it can.** Counts quoted before, during and after each mutation; `src/` byte-identical to where it
  started. One thing the mutation corrected about this work order's own premise: deleting the repaint
  turns **two** checks red, not one — WO-2.13 was already watching that line from the *mark* path. The
  gap was real but narrower than stated, and it is written down that way in `tools/README.md` and
  `TESTING.md` rather than trimmed to fit.

  **No app code changed**, and nothing here is visible to a teacher. Also corrected in passing: the
  running check count in `tools/README.md` was stale by thirteen — WO-3.4 added checks without
  updating it, the second time that has been missed. It now reads the measured 537.

- **WO-3.4 — grades add up.** Weighted category math, computed from the assignments and scores a
  teacher has actually recorded. **A category with no graded work drops out and its weight is shared
  across the categories that do have work**, so a grade is right in week one rather than wrong until
  every category has something in it.

  **Extra credit is simply an assignment worth 0 points** — there is no extra-credit flag, field or
  category type, and there is not going to be one. A 0-point assignment scored `5` adds 5 to what a
  student earned and nothing to what was possible, which is what carries 13/20 in Quizzes to 18/20.
  **Nothing is capped at 100%**, not the category and not the overall grade: a cap would quietly
  throw away points the teacher chose to award. A category holding *only* extra credit has no
  percentage at all and steps aside like any other empty one, rather than reading as a perfect score.

  **A class whose category weights do not total 100 shows no grade, and says what the total is.** Not
  a provisional figure and not a best guess — a weighted average over weights that do not add up is
  arithmetic nobody asked for, and a number on screen would be believed. The same holds for a class
  with no categories yet, and for a class where nothing has been graded: the answer is an honest
  "no grade yet", never `0%`.

  `late` still changes no arithmetic — it is a record of what happened, not a penalty — and a blank
  cell means ungraded and affects nothing, exactly as an absent cell does. `missing` is the only flag
  that scores zero, and it is marked by the teacher, never inferred from a date rolling over.

  **No screen changes yet**; this is the arithmetic underneath, and the score grid that shows it
  comes next. It is verified against twelve hand-computed cases in `docs/grade-math-cases.md` that a
  teacher can check with a calculator and no JavaScript — the standard the 1.0 criteria set for the
  one part of this app that has to be right.

- **WO-3.3 — a class has an assignment list.** Name, points, category, and assigned and due dates,
  created and edited in Class → Assignments: the spine the rest of the gradebook hangs off. Create,
  edit, reorder within a category, and delete — the delete warns first and counts the scores it takes
  with it. **Nothing schedule-shaped fills these dates in**, because Planbook has no timetable and is
  not getting one, and a date here still marks nobody and changes no grade. *(As WO-3.3 shipped it,
  both dates also arrived empty; WO-3.17 later made a new assignment start on today, which is a fact
  rather than a guess at a schedule. The half of this sentence that changed is noted here so the two
  entries do not contradict each other.)*

  **Duplicate to another class**, for teaching the same content to more than one section. The copy
  arrives with no scores on it, and it lands in the *target* class's own term and category — matched
  by name rather than carried across, which is the difference between a copy and a booby trap. Where
  the other class has no category of that name, the dialog **asks** rather than quietly showing you
  its first one: the category box reads *— choose a category —*, and the copy is filed under nothing
  until you pick.

  **The term buttons repaint the list.** The assignment list is a term at a time, so tapping
  *Quarter 2* changes the work on screen and the line above it, not just the highlighted button.

  **Worth 0 points is how you give extra credit.** Type `0` and it stays `0`; the row says **Extra
  credit** in words. A 0-point assignment scored 5 will add 5 to what a student earned and nothing to
  what was possible, once there is a grade to add it to.

  **A switcher between a class's screens** — Attendance · Assignments · Scores — sitting on the white
  panel under the title rather than up in the navy header, where a fourth control puts the page into
  horizontal overflow at 390px. **A class always opens on Attendance, every time, including after a
  reload**: marking at the door is the flow that has to be fast, and a per-class memory of where you
  were last is a thing nobody asked for. It is built so the preference cannot even hold the other
  screens — every class screen is written down as `class`, so there is no stale value to restore.

  **A guard was widened past this work order's own code, deliberately.** Category removal used to
  find the work it destroys by category alone, which was safe only while no assignment could exist in
  two classes at once — and duplicate-to-another-class ends that. Guarding only the new queries would
  have covered documents this build wrote while leaving a restored or hand-edited one able to produce
  the dangerous shape: a teacher agreeing to destroy work in a class the dialog does not name.
  `src/categories.js` is class-scoped now too, and the harness plants that document.

  **Read on the teaching iPad on 2026-08-09** — offline launch with `assignments.js`,
  `screen-nav.js` and `assignments.css` from the precache, iPadOS's numeric keypad taking `0` into the
  points field, the date picker's **Clear** working on both date fields, a thumb on all five controls
  of an assignment row with Delete not shoulder to shoulder with Edit, the amber and red category
  notes legible from the back of a room on a projector, and the switcher in both orientations without
  pushing the panel title off the top. The same sitting closed a line WO-3.1 had been owed since it
  shipped: **the removal warning's counted form** — *"9 assignments and 214 scores"* — had never been
  read against real assignments, because until this work order there were none to count.

  **Two acceptance lines could not close here and now point at the work orders that will close them.**
  Both name a **grade**, and nothing in this app renders one yet: the arithmetic is WO-3.4's on
  purpose, so that it lands together with the document that checks it. What was built and verified is
  the half that is real today — `0` survives in the points field, and an assignment moves between
  categories.

- **WO-3.11 — the tracker can now say "landed, with lines owed."** Nothing here is visible to a
  teacher, and this is the one Ship 2 item that buys nothing that is. It is about the tools that
  decide what to build next telling the truth about what is finished.

  **`🔨 IN PROGRESS` was carrying two unrelated facts, and no tool could tell them apart** — *a
  dispatch is building this right now* and *this landed, and some acceptance lines are open on
  purpose because they name something no work order has built yet.* WO-3.1 was the second and read as
  the first for a day. `next` stepped over finished work, WO-3.3's dependency gate failed on a
  deliverable that had actually shipped, and `--release` — the way back for a dispatch that died —
  could not be run at all, because releasing the second kind writes `⬜ NOT STARTED` over completed
  work and hands it to the next run as unstarted. A claim is `🤖 CLAIMED — <dispatch>` now. `🔨`
  keeps only the honest meaning: part-built, nobody in flight.

  **Landed-with-lines-owed is `✅ DONE` plus a new `**Owes**` field, and it is the one header field
  that is acted on rather than only reported.** A line that names work another work order will
  actually do stays `- [ ]`, gains a `→ WO-x.y` marker and a quotation of the box that carries it
  now, and stops holding its own work order open — **but only while the pointer still lands on an
  open box.** Reword the target and the tick is held; delete it and the tick is held. `--audit`
  resolves every pointer in the directory on every run.

  **The migration was the proof, and it is why the field is shaped this way.** WO-3.1's two owed
  lines were `- [x]` for a day, each with a paragraph underneath explaining that ☑ meant *resolved on
  this work order, not verified* — a mark that needs a paragraph to stop it meaning "verified" is the
  wrong mark, and the paragraph sat in a place no check reads. They are open boxes pointing at WO-3.5
  now, checkable from both ends. **The debt ends when WO-3.5 ticks them:** `--audit` then fails on the
  pointer, which is the signal to tick at the source on that evidence and drop the field. Exactly two
  lines converted; the two beside them were genuinely done and were left alone.

  **`--self-check` goes 9 plants to 13**, and the four new ones were mutation-tested rather than
  believed: breaking the pointer resolver reddens the two plants that name it and leaves the
  positive-path plant green, which is the only thing that catches a resolver that says no to
  everything. Against the pre-change script, 11 of 13 go red.

  **One correction found by the verifier, in this work order's own subject matter.** Five files were
  updated to the new vocabulary and a sixth was missed — the orchestrator's own operating
  instructions, which still promised that claiming a work order writes `🔨 IN PROGRESS`. A human
  reading a stale document is misinformed; an agent reading one acts on it. That is precisely the
  gap between what the tools do and what the record says they do that this work order exists to
  close, reappearing inside it.

  **The dispatch that built this was killed mid-flight by an API session limit**, and left seven
  ticked acceptance boxes behind with no report to justify them. They were treated as claims from a
  run that did not survive to make them, and every one was re-checked from scratch — four of them
  against the real work-order text rather than the synthetic fixture, because the fixture cannot
  express strikethrough, wrapped boxes, or a marker written inside backticks that must not be read as
  a marker. All seven held.

- **WO-3.2 — letter scales are the teacher's, not the app's.** The bands that turn a percentage into
  a letter are now edited in Class manager → Letter scale, document-wide or per class, and each band
  shows the range it actually covers. Setting an A boundary of 89.5 makes 89.5 an A — which is the
  whole of the rounding rule, because there isn't a second one to disagree with the SIS about. A band
  the scale can never reach says so, in place, without blocking anything.

  **Read on the teaching iPad on 2026-08-09** — offline launch with `letter-scale.js` from the
  precache, iPadOS's numeric keypad accepting `89.5` into the boundary field, a thumb on every control
  of a band row, the amber "never reached" chip legible from the back of a room on a projector, and
  twelve bands in both orientations without a row spilling sideways.

  **The prohibition that has no UI: there is no "round to nearest whole percent" option, and there
  must never be one.** It is the second, disagreeing rule this design exists to delete. That was
  stated in three places and enforced in none — and worse, `tools/verify-shell.mjs` recorded that the
  check "is a grep, made in `tools/wo-sweep.mjs`" when the sweep had no rounding check at all. The
  acceptance line had been read by hand once, during the dispatch, and the comment promoted that
  reading into a standing guard nobody was standing. `wo-sweep.mjs` gains it for real, **12 → 15
  checks**: the option identifier is a hard failure in either word order, `src/letter-scale.js`
  rounding anything at all is a hard failure, and rounding elsewhere on the mapping path is handed to
  a human undecided — because WO-3.4's grade engine will legitimately round to draw "87%", and a check
  that failed on that would be switched off within a work order. Verified by mutation, including one
  that adds the option with no rounding call anywhere near it: the feature can be added a whole work
  order before anything actually rounds.

  **A cross-reference between the two harnesses is a claim, not a check** — neither can see the
  other's absence, so "this is checked over there" is exactly as unverified as any other comment.
  Written up in `tools/README.md` beside the WO-1.10 `CACHE` miss it rhymes with: that was a rule
  nobody enforced, this was a rule the record said was enforced.

- **WO-3.1 — every class carries its own grading categories, and what each one is worth.** Tests,
  quizzes, homework, whatever you actually put in the book. A new class arrives with four that
  already total 100%, and all of it is yours to rename, reweight, reorder or throw away. A category
  you add starts at 0%, because any other guess would silently reweight the ones already there.

  **The weights are watched rather than policed.** If they come to 95% instead of 100%, Planbook
  says so — in the editor, and on the class-manager row behind it, so a class left half-finished is
  visible without opening five panels to find it. Then it gets out of the way: nothing is blocked,
  no field is disabled, no number is repaired. You are told the total, and told that any grade
  worked out from it is provisional until it adds up. Half-finished is the normal state of a class
  in August.

  **Removing a category is the one thing here that destroys anything, so it counts first.** The
  confirm names the assignments filed under it and the scores they hold, and offers the other answer
  while it has your attention — set the weight to 0 and the category stops counting without losing
  the work. A category holding nothing goes on a single tap. This deliberately departs from the term
  editor next door, which refuses the same move: a removed term would leave assignments pointing at
  an id that no longer exists, still looking like work and counted by nothing, where a category
  removal that takes its assignments with it leaves no orphan at all. The argument is written at the
  point of departure in `src/categories.js`, not only here.

  **Weights are stored exactly as typed** — nothing clamps, rounds or repairs, per the data model's
  own rule that a number which silently isn't what you typed is the worst thing a gradebook can do.
  The one tolerance is 0.005, which exists solely so binary floating point cannot call
  40.1 + 34.7 + 25.2 wrong; it is half the smallest gap a two-decimal field can express, so it
  cannot hide a real one. 33.33 × 3 = 99.99 still warns, correctly.

  **Read on the teaching iPad on 2026-08-09** — the editor is thumbable including the 58px weight
  field, iPadOS offers the numeric keypad, the amber banner and the row badge carry to the back of a
  room on a projector, both orientations read correctly, and the app launches with the network off
  with `categories.js` served from the precache.

  **Two of the work order's four acceptance lines are still open, on purpose, and WO-3.1 stays
  🔨 IN PROGRESS because of it.** Both name a *displayed grade*, and nothing in this app renders a
  percentage yet — the grade engine is WO-3.4 and the score grid WO-3.5. Building the arithmetic
  here would have landed it without the hand-computed cases WO-3.4 names as its only test suite, so
  it was left alone and the boxes were left open rather than ticked against a half-measure.
  `weightTotal()` and `isProvisional()` ship as pure functions for those work orders to read, and
  the editor already says the word *provisional* in the meantime. One further check is owed to
  WO-3.3 rather than to a device: the removal confirm's counted form has only ever been read against
  fixtures, because nothing creates an assignment yet.

  **Superseded the same day, and left standing rather than rewritten.** Hours after this landed the
  owner settled the rule it was written against: **there is no grade at all until the weights total
  100** — not a provisional figure, not a figure with a label on it. So the two paragraphs above are
  an accurate record of what shipped and a misleading guide to where the app is going, which is
  exactly the kind of entry worth annotating instead of quietly editing. What actually changes:
  `isProvisional()` keeps its signature and its truth value but now means *"this class has no
  grade"*, and the sentences built on it — in the categories editor and on the class-manager row —
  are owed a correction that is folded into WO-3.5. Nothing shows a grade before then, so no teacher
  reads a false claim about a number she can see. The reasoning is in `docs/data-model.md` § Grade
  math.

- **WO-2.15 — `wo-gate.mjs` now checks itself, and reads the fragments it has been trusting.**
  Two new read-only verbs, `--self-check` and `--audit`, plus the nine rotted header fragments the
  first `--audit` run found.

  **`--self-check` plants nine known violations in a throwaway copy of `plans/` and fails if any one
  of them stops being caught.** The gate is the control that keeps the trackers honest, and until now
  nothing kept the gate honest: every guard it prints was believed because it printed. The plants
  cover the guards that matter — a tick over an open Acceptance list, `--start` against a status that
  forbids it, a fully ticked order closing its roadmap box and both dashboards. It writes nothing
  inside the repository and leaves no temp directory behind on either exit path, including the
  failing one.

  **A plant that cannot fail proves nothing, so each one was proved able to fail.** Two of the nine
  do not go red against the pre-WO-2.14 script — they were proved by mutation instead, each mutation
  reddening only the plants that name that behaviour and no others. That gap was disclosed rather
  than papered over, which is the whole risk this work order was written against: a self-check passes
  green forever the moment a plant is caught for a reason unrelated to the guard it is meant to test.

  **`--audit` reads every work order's `Closes roadmap` fragment and every roadmap dashboard row and
  reports drift without writing.** A fragment that matches no roadmap box now holds the tick at
  `HELD` instead of noting it and passing — a fragment that closes nothing is a broken link, not a
  style choice, and passing on it is how a work order gets ticked while the roadmap it was supposed
  to close stays open.

  **Nine fragments had already rotted.** The worst was WO-2.8's, whose entire `Closes roadmap` line
  sat one blank line below the header paragraph — outside the header every script parses, so it was
  invisible to all of them. `--tick` would have closed nothing there and said so quietly.

  **One thing to know before running it:** `--self-check` copies the live `plans/`, so it needs the
  trackers already clean and goes red when they are not — the failure it prints blames the plants
  rather than the drift. Fails loud, which is the safe direction, but the message points the wrong
  way.

- **WO-2.5 — a class is marked from the keyboard, one keystroke per student.** `↓` lands on the
  first name, then one letter each — `P` present, `T` tardy, `A` absent, `E` event, `D` dismissed —
  and the selection moves down the list on its own. A class of thirty is thirty keystrokes and the
  mouse is never touched. `Esc` stops. The keys are behind a **⌨ Keys** button beside search and
  sort, and behind `?` for a hand already on the keyboard.

  **A letter sets the mark; it does not cycle.** That is the whole design, and it is a deliberate
  departure from Roll Call!, where the same keys step through the codes. Cycling makes one absence
  cost up to five keystrokes and makes the count depend on what the cell already said — which means
  looking at the screen. The standard this was built to is marking a class at the door while it
  walks in, so `A` means absent from wherever the cell was reading. The tap keeps its own cycling
  writer, untouched.

  **The selected row is a real focus, not a painted highlight.** It wears Roll Call!'s indigo wash
  and 3px rail, copied by value, but the focus ring stays on the cell your next letter writes into —
  including at the bottom of the list, where it used to be dropped, and after `Esc`, which removes
  the target and leaves the focus where your eyes last were. The rail is reserved transparent on
  every row, so selecting a name does not step it 3px sideways thirty times down a class.

  **The keys go quiet exactly where a thumb is refused.** Every letter writes through the same
  `setMark()` a tap does, so a locked past column, a dropped day, a covered day, a date after today,
  and a window paged off the day being edited all refuse a keystroke — one writer, one set of rules.
  A held modifier, an open dialog, focus in a text field, or any view but the class one is ignored.
  `Enter` is deliberately unbound: the selected cell is focused, so binding it would fire the cell
  *and* move the row.

  **The 44px touch pass was re-run across the whole attendance screen**, measured on a coarse
  pointer rather than read off the stylesheet — every control on the registry, the days-off panel,
  and the new ⌨ button, which is also checked for the label spill that the first iPad sitting found
  on "Days off". Reading the sheet alongside the measurement turned up six `.attendance-*` selectors
  with no rule in any coarse block, three of which were cited elsewhere in the file as the precedent
  for being there; none is a control, and all six are now declared with their base values restated
  rather than changed.

  **Confirmed by hand on both the laptop and the iPad on 2026-08-08.** What is still owed is the
  doorway itself — a live class walking in — which `TESTING.md` § WO-2.5 keeps open.

### Fixed

- **WO-2.22 — a vanished harness now turns the sweep red, and "one `check()` per line" stops being
  something nobody had checked.** `wo-sweep.mjs` §11 has compared `tools/README.md`'s recorded
  call-site count against `verify-shell.mjs` since WO-2.19, and it did two things quietly wrong. If
  either file was **missing** it printed a `REVIEW` and **exited 0** — but this file's own header
  defines `REVIEW` as *greppable evidence that needs a human decision*, and a harness that is not
  there is not a decision anybody is being asked to make; it is the one condition under which every
  claim the section makes is void. A run that exits green over a file that does not exist reads
  correct from a distance and is not. It **FAILs** both ways now, naming which file went, proved by
  moving each one out of the repo: exit 1, `16 checks · 14 passed · 1 failed · 1 to review` — sixteen
  rather than seventeen, because the new check beside it cannot read a file that is gone, which its
  own detail line says.

  **And the count is a count of *lines*, which was true, load-bearing, and written down nowhere.**
  The sweep pushes one entry per line holding a call, so it equals the number of calls only while no
  line holds two — meaning a second `check()` appended to a line that already had one is the single
  edit that moves nothing: no new line, so the number does not budge, the comparison passes, and the
  sentence in `tools/README.md` goes silently wrong. A seventeenth check asserts it and names the
  line. The proof is deliberately non-vacuous rather than merely red: with a second call packed onto
  `tools/verify-shell.mjs:495` the file stayed at 14,295 lines, the count clause stayed **green at
  596**, and the new clause was the only thing failing — which is the whole point, since an append
  adds no line. **16 → 17 checks.** WO-2.19 named both of these gaps in its own changelog entry and
  left them; this closes them.

  **The obvious fix was refused, and it was refused on a measurement.** Counting occurrences per
  line instead of lines looks like the correct repair and is the wrong one: `check(` also appears in
  trailing comments and inside the harness's own quoted prose, and the comment filter drops whole
  comment lines rather than trailing ones — so occurrence counting trades a hypothetical undercount
  for a plausible overcount and a false red. Before the clause was written, the sweep's own pattern
  was run over the harness to check the shape rather than assume it: **zero** call-site lines hold a
  second occurrence and **zero** non-comment lines mention `check(` in a trailing comment. The clause
  is green today for a reason, not by luck. The recorded count itself is untouched, for the same
  reason — nothing here adds or removes a call site.

  **Two numbers are left unguarded on purpose, and the reasoning is now in the file so the next
  reader does not re-propose it.** `verify-shell.mjs` still does not assert its own summary against
  `tools/README.md`, the eight-line follow-up WO-2.19's implementer suggested. First, a red harness
  run means *the app is broken*; in week one of a live term that signal has to stay clean enough to
  drop everything for, and making it also mean *a sentence in a README is stale* spends the one alarm
  that must not be second-guessed. Second, the hole is already mostly shut sideways: §11's failure
  text tells the reader to fix the executed count from a run rather than by arithmetic, so every
  check added or removed trips the sweep and hands over both numbers. What is left over is somebody
  mis-editing the executed count while touching no check at all, which is not the failure that has
  happened three times. And the sweep's own **17 checks** stays unguarded because the asymmetry cuts
  the other way there: the sweep prints its true figure on its summary line in about a second, in
  front of the only reader who would care, who is by definition already running it — where the
  harness's count costs a three-minute browser run nobody spends to settle a README sentence, which
  is exactly how that line went stale at WO-1.5, WO-2.18 and WO-3.5.

  **Nothing a teacher can see changed, and nothing a run prints changed.** `src/`, `index.html`,
  `sw.js` and `verify-shell.mjs` are byte-identical to HEAD by hash, so no `verify-shell.mjs` run was
  spent settling that — 177 seconds buys no claim a hash does not already make. The whole-run diff of
  the sweep is two hunks: one added PASS line and the summary count. No new `REVIEW`.

  *A practice ruling was settled on this dispatch and belongs beside the work, not inside it.* An
  implementer reports evidence **beside** an Acceptance line, never **into** it: measured counts,
  mutation results and failure text go in `TESTING.md` and `tools/README.md`, the criterion's own
  words change only by the owner's ruling, and any amendment says on its face that it happened and
  why. The scar is WO-3.12, which folded its measured counts into five of the lines it was being
  judged against — an implementer editing the bar it is graded on, which is not a documentation
  slip but a broken instrument. It held here: the work order file's diff is six checkbox characters
  and a status line, and Acceptance 2's figures — stale *by design*, as a trap — are untouched.
  Nothing mechanical enforces this; `wo-sweep.mjs` cannot tell a criterion from a note about one.

- **WO-2.21 — the touch-target sweep now measures every screen, not whichever one happened to be
  open.** It enumerates every view in `<main>` off the document, opens each one the way a teacher
  does — the card, the "All classes" door, the switcher segments — and measures it there, with a
  floor per view so that a screen which opens empty fails instead of passing quietly. A screen added
  to `index.html` and not to the harness now turns a check red rather than going unmeasured. That is
  how roughly 250 score inputs came to be walked past by a green run.

  **Opened through the app's own navigation, not by un-hiding.** The cheap version of this — strip
  `.hidden` and measure what appears — would have gone green over the exact defect that produced the
  work order: `#scoresView` shipped with its only segment disabled, so un-hiding measures a grid no
  teacher could reach. A view that exists but cannot be opened now **fails by name** instead of being
  quietly skipped, which is the whole difference between a harness that checks the app and one that
  checks the document.

  *A limit recorded rather than papered over.* The general sweep runs before the score-grid fixture
  exists, on a document where every assignment has been deleted, so the assignments and scores views
  are in their empty states and their floors equal their static chrome. What the mechanism guarantees
  is therefore *this screen is reachable and its chrome is thumb-sized* — **not** *its content was
  measured*. That is precisely why WO-3.5's by-hand block survives rather than being folded in: with
  the grid genuinely open it measures 259 controls where the general mechanism sees 4. A screen
  registered later with a chrome-level floor inherits the same limit, and it must not be mistaken for
  coverage.

- **WO-2.23 — every date field in the app now takes the 44px touch target it was already declared.**
  The assignment editor's *Assigned* and *Due*, the term editor's *Starts* and *Ends*, the days-off
  *From* and *To*, and the plan *Review date* on the student editor — seven fields across four
  screens, all of them about half the height of the text boxes beside them, and all of them declared
  44px in a rule that was never wrong.

  iOS Safari paints `<input type="date">` as a native control, and while it is doing that, the
  author's box model is advisory: `min-height` does nothing on the date field and everything on the
  text field 10px away. `-webkit-appearance: none` is the switch that hands the box back, and the app
  had never used it anywhere. One rule now does, keyed to the element rather than to the four date
  classes, so every date field added after this one is covered without anybody remembering to.

  **Confirmed on the iPad on 2026-08-10**: full height in both orientations, the iPadOS picker still
  opens from all seven fields and the date still lands, an empty field still reads as a field, and
  the days-off dates still clear after an add. The date sits centred in the taller box — which
  nobody knew, because no harness can ask.

  *Two limits recorded rather than papered over.* Neither harness can see this defect: desktop
  Chrome under an emulated coarse pointer honours `min-height` on a date input and reports a
  compliant 44px on the broken tree, so a check written for it would have gone green and told the
  next reader the rule was guarded. And the width floor that the reset makes necessary — a reset
  date input has no intrinsic width, and iOS draws no placeholder to hold an empty one open — is
  reasoned from the box model rather than measured. `TESTING.md` § WO-2.23 says both in writing.

- **WO-2.20 — the orchestrator now waits for its implementer before reporting.** On 2026-08-10 a
  dispatch on WO-3.5 returned a complete, confident report sixty seconds in: the route with its
  reasoning, the claim written, the brief written, and *"the implementer is in the background. Expect
  20 to 40 minutes."* Every word was true except the tense. It had **spawned** the implementer and
  returned, having observed no work at all.

  **A report written at spawn time is indistinguishable from one written at completion**, and
  everything downstream follows from a reader being unable to tell those apart. A finished-shaped
  report read against a status file frozen at the dispatch line said the child had never launched, so
  it was re-dispatched. It had launched. It was reading — **21 minutes between spawn and first write**
  on that work order, and for all of it the status file does not grow, no result file appears and
  `git status` is unchanged. Those are the three signals a watcher naturally reaches for, all blind,
  and blind longest on the largest work orders, which are exactly the ones a duplicate hurts most. Two
  implementers then built WO-3.5 concurrently for nineteen minutes; the tree survived because both
  lifted the same mockup and surfaces document rather than inventing, which is luck resting on a
  shared brief and not a property of the system. It still cost the two defects the verifier found.

  **The fix is to stop producing the ambiguous report**, not to build the instrument that would let a
  reader see through it — no heartbeat, no liveness protocol, deliberately out of scope. The
  orchestrator waits for its child, says *spawned, awaiting return* at dispatch and gives the duration
  only in words that read as a prediction, writes down that an implementer's first write is not its
  start, and refuses to re-dispatch over a live `🤖 CLAIMED` line. `--release` is the one way a live
  claim is cleared and it is a deliberate, named act; a silent second spawn is not.
  `work-order-verifier` and `work-order-implementer` carry no `Agent` tool and so cannot have this
  defect — each was read and fixed anyway for the one shape available to it, a backgrounded shell call
  written up before it exited.

  **Nothing mechanically guards any of this.** `wo-sweep.mjs` ignores `.claude`, so someone trimming
  these paragraphs for length would trip no check — and a check asserting the file contains the word
  *wait* would pass happily over a file rewritten to say the opposite. No app code changed; nothing
  here is visible to a teacher. The last acceptance line could not be checked at a desk and was
  deliberately last: it closed on the next real dispatch producing a report that arrived when the
  work did. **That was WO-2.19, on 2026-08-10** — one line at dispatch, then the full graded report
  31 minutes later, the report itself made of the verifier's own measurements, which is the content
  the sixty-second WO-3.5 report had none of.

- **WO-2.19 — the standing sweep now checks the harness's own size.** `tools/README.md` has recorded
  how many checks `verify-shell.mjs` runs since WO-1.3, maintained by whoever landed a work order
  remembering to update it, and it had gone stale three times: 79 where the tree held 82 at WO-1.5,
  522 where it held 535 at WO-2.18, and 537 where it holds 554 now, WO-3.5's seventeen never having
  reached the file. `node tools/wo-sweep.mjs` counts the `check()` call sites and goes red when that
  line disagrees, in **either** direction — the growth case and the loss case were both proved by
  mutation, because a check that only noticed a check being added would have passed happily over one
  being deleted. **15 → 16 checks.** The third miss had already happened; this work order caught it
  rather than prevented it.

  **What the count is, exactly, is now written down instead of assumed, and the work order's own
  arithmetic was wrong.** It asked for the four call sites a run does not reach to be named, off
  *"roughly 541 call sites against 537 executed"*. There is no fixed gap and there never will be: on
  this tree 560 call sites yield 554 results, and the 6 between them is two unrelated corrections
  cancelling. **Twenty-eight call sites never fire at all** — every one of them the failure arm of a
  fixture guard, so a run in which one fires is a run in which something is wrong — and **ten more sit
  inside loops** and fire once per viewport, per orientation, per note code, one of them ten times.
  532 distinct sites plus 22 extra results is 554. That was measured rather than reasoned, by
  instrumenting a throwaway copy of the harness with `new Error().stack` inside `check()` and diffing
  the executed line numbers against the same grep the sweep uses; the method is recorded so the next
  reader can re-derive it in one run instead of reasoning to another wrong four.

  **So the sweep asserts the number a grep can hold, and the run's own number sits beside it in
  prose** — still measured by hand, labelled as such, with `tools/README.md` saying which quantity is
  which rather than letting the next reader assume they are the same. No check compares the two, and
  none passes on "close": the alternative was a tolerance, and a tolerance is how 522 + 2 = 524 nearly
  read as a green run. The sentence the sweep greps is ordinary prose rather than a marker comment, so
  rewording it turns the sweep **red with the wording it expected**, not off.

  **Nothing a teacher can see changed, and two gaps are left open on purpose.** The executed count is
  still the one number in this system that nothing watches — closing it means either opening a browser
  from a tool that is deliberately all greps, or changing what `verify-shell.mjs` prints, and it would
  make a full run red for a documentation edit, which is a different bargain from the one the sweep
  makes. That wants a decision, so it is proposed rather than smuggled in here. And the sweep's own
  count — *16 checks*, in the same file — is now the unguarded number one level up: the same defect
  class, one turn of the screw smaller. The new check also counts *lines* holding a call, so a second
  `check()` appended to a line already holding one would be invisible; harmless today, since all 561
  occurrences sit on distinct lines, and worth knowing before someone packs two onto one.

- **WO-2.17 — switching term on the attendance registry now brings the counts under the term nav
  with it.** Tapping *Quarter 2* moved the highlight and said the term out loud, then left Quarter 1's
  recorded meetings and percentages sitting on the screen, with nothing to say which term the numbers
  belonged to. They corrected themselves on the next repaint from any other cause — mark one student
  and the figures jump — which is what kept this invisible: the jump reads as the mark landing rather
  than as the term finally arriving.

  **The repaint now belongs to the term change itself**, the way the category controls already work,
  rather than being something each screen remembers to ask for. The assignment list, which already
  behaved, keeps behaving; the screens still to come inherit it instead of arriving with this same
  bug again. A term change still repaints only the screen that is up — the registry paints a grid of
  students × days and the score grid will be larger still, so repainting everything is a cost on the
  flow the whole app is measured by.

- **WO-2.16 — a header field the gate had never heard of was being swallowed by the field above it,
  and that made the sprint's one hard ordering constraint point backwards.** `**Blocks**` is the
  opposite of a dependency, and the gate was reading the `WO-` tokens off it as dependencies. So
  WO-1.5 — the backup work order the whole sprint is ordered around, the one the *no feature that
  writes student data lands before backup and restore* rule is about — was reported as **depending
  on WO-1.6**, which in fact waits on it. Both were already `✅ DONE`, so nothing was ever gated
  wrongly. That was luck: the same line between two open work orders is a cycle, and the gate would
  have called the ordering satisfied while pointing the wrong way down it.

  **The fix is to the class of defect, not to the field.** The boundary between one header field and
  the next is now a *position* — the start of a header line, or a `·` — rather than a closed list of
  names. Previously any field the script had never heard of was absorbed into whatever field was
  written above it, silently changing what that field meant. `**Blocks**` and `**Target**` are now
  fields in their own right, reported to the reader and acted on by nothing. And a field with **no
  row in the field table** is named by the gate as unread, instead of quietly editing its neighbour.
  That last control is why this is a fix and not a patch: three fields — `**Amends roadmap**`,
  `**Blocks**`, `**Target**` — were each invented by a hand, absorbed in silence, and then found one
  at a time by a human reading the gate's output and thinking it looked odd. The fourth will announce
  itself.

- **WO-2.16 — `--self-check` states its precondition and checks it first, and a failing plant no
  longer loses its reason at 160 characters.** The self-check copies the trackers, and tracker drift
  is exactly what `--tick` refuses over — so a dirty tree meant two healthy plants were reported as
  failures. It now stops before planting anything, with the drift named. When a plant does fail, the
  subject's own `HELD` line and its cause survive into the output rather than being clipped.

  **The `next` plant no longer depends on what the live running order happens to contain** — its
  fixture row sits above every real row. It had been red since the Ship 2 table was written, for a
  reason that was never a defect in `next`, which is the failure mode a self-check is most vulnerable
  to: a control that goes red for a reason the reader learns to dismiss is worse than no control.

- **WO-2.13 — the totals are computed once per render, and a stale row nobody had reported is
  gone.** The registry recomputed every student's counts inside the per-row loop: `attendanceTotals()`
  walked the whole `doc.attendance` array once per name, and `meetingDates()` rebuilt the class's
  meeting list twenty-seven times to answer one question. It now runs as a single shared pass per
  `renderAttendance()`, folded over the roster, and `meetingDates()` is called **twice** — counted at
  runtime, not read off the source.

  **Measured on the owner's machine, same harness and same fixture both sides** — 875 records, 175
  meetings, 27 rows, median of nine consecutive renders. Before **40.10 ms** and **32.80 ms** across
  two runs; after **9.20 ms** both runs; **3.6–4.4×**. The before column came from a detached `HEAD`
  worktree with this branch's `verify-shell.mjs` copied into it, so the only thing differing between
  the two numbers is `src/attendance.js`. Two before-runs are recorded because that column carries
  real spread and the after column does not. The 76 ms this work order was written against does not
  reproduce here — a shifted baseline, not a discrepancy, and the pair above replaces it.

  **The speed is not what this work order proved.** Run against the pre-refactor tree the new
  regression goes red, and what it catches is a filtered-out row reading `Quarter 1 · P 87 · T 1 ·
  A 2 · E 0 · D 0 · 98%` both before *and after* a mark — stale — while the detail panel beside it
  repaints correctly. That defect was already shipping. It is invisible at `filterCode === 'all'`,
  which is the only configuration the first implementation round was ever checked in, and it takes an
  ordinary teacher action to reach: filter to one mark, open a student's detail, change that
  student's mark. Acceptance asked the detail panel and the class line to stay byte-identical, and
  they do; the row was never inside that sentence. **A pure refactor that fixes something was not
  reviewing itself honestly** — the fix is real and welcome, and it is also evidence that the
  original code path had no coverage under an active filter.

  **`stateOf()` is still the only meeting predicate and `readingOf()` still the only cell reader.**
  The fold calls them; it does not reimplement them. A hand-rolled loop testing `record.exception`
  directly would have been quicker to write and would have put the precedence rule in a second
  place — which is the arrangement WO-2.4 exists to hold together.

  `tools/verify-shell.mjs` 400 → **405** checks, zero skipped, and the five new ones were proved by
  running them against the pre-refactor tree rather than by reading them. One soft spot is recorded
  at the assertion itself: the call-count check is `calls === null || calls === 2`, so it would go
  quietly green if the counting exports were ever dropped. It measured `2` here, so it is not vacuous
  today.

  **`sw.js` cache stayed at `v30`, which this work order did not notice and the next entry fixes.**
  `src/attendance.js` is in `SHELL`, and the rule written at the top of `sw.js` is to bump `CACHE` in
  the same commit that changes any file in it. WO-2.4 broke it first; this work order broke it again.

- **Three shell files had drifted past the service worker's cache name, and the installed app would
  have kept the old ones.** `sw.js` says it in its own header — *"bump `CACHE` in the same commit"* —
  because `activate` deletes every cache that is **not** the current one. The name is the version, so
  an unchanged name is not a stale deploy that eventually catches up; it is a deploy that never
  happens. `CACHE` had sat at `planbook-shell-v30` since WO-2.3 while `index.html`,
  `src/attendance.css` and `src/attendance.js` all changed underneath it, across WO-2.4 and WO-2.13.
  Now `v31`.

  **What an installed iPad on `v30` was actually holding was the pre-WO-2.4 app** — no counts, no
  attendance percentage, and none of WO-2.13's fix. That is the device Ship 1 goes live on, and it
  would have gone into WO-G1's rehearsal serving code from two work orders ago. A rehearsal against
  the wrong build passes or fails for reasons that have nothing to do with the app.

  **Neither existing tool could see it, for the same reason.** `verify-shell.mjs` drives a real
  browser over a live local server, where the newest file on disk is always the file served — the
  service worker's cache is the one layer a live-network harness is structurally unable to observe.
  `wo-sweep.mjs` never asked. So the miss survived two work orders, two verifier passes and a green
  405-check run, and was found by writing a changelog entry and going to look up the version number.

  `tools/wo-sweep.mjs` gains the check: **since the commit that introduced the `CACHE` string sw.js
  carries right now, has any file in `SHELL` changed?** It asks git across commits rather than only
  the working tree — a working-tree check would have gone green on the very defect that prompted it,
  both offences having already been committed, which is the failure this repo keeps re-learning. It
  reads `SHELL` by the single-quoted-string parse `sw.js` documents, honouring the apostrophe warning
  in that header rather than re-deriving it. A `CACHE` value in no commit at all is a bump sitting
  uncommitted ahead of the commit that will carry it, and passes. Proved by running it against the
  committed `v30` tree, where it names all three files and exits non-zero, rather than by reading it.

  `tools/wo-sweep.mjs` 11 → **12 checks**. It stays a grep-shaped check in the grep-shaped tool, per
  `plans/verification-tooling.md`: the browser cannot answer this one, and git can.

- **The accommodations-in-storage check went red about the clock, roughly one run in ten.**
  `tools/verify-shell.mjs` asserts that nothing sensitive reaches `localStorage`, and part of that is
  searching a JSON dump of every stored value for the three plan words — `IEP`, `504`, `ELL`. `504`
  is three digits, and every epoch-millisecond stamp we write is thirteen of them; on 2026-08-08
  `planbook_lastBackupAt` held `{"2026-2027":1786195504308,…}` and the check failed on a timestamp.

  **The reason this was worth stopping to fix is what the failure teaches.** It is not a flake in a
  cosmetic check — it is a red on the single check whose subject is accommodation data leaking into
  storage, and the remedy that works is to run it again. A control that goes red for a reason the
  reader learns to dismiss is worse than no control, because the dismissal is what survives; the next
  time it means something, the response is already trained.

  The three plan words are now matched with a word boundary, **in the storage check only.** A real
  leak arrives there as JSON, where a plan value is always delimited — `"504"`, `"plan":"504"`,
  `has a 504 plan` — so the boundary cannot hide one; a thirteen-digit number has word characters on
  both sides and no longer matches. The screen checks keep plain substring matching on purpose:
  `innerText` runs adjacent nodes together, so a real leak can land as `504Smith` with no boundary at
  all, and tightening there would have been a way to miss one. Substring on screen, boundary in the
  store, and the difference is written down at the matcher.

  Checked against nine cases rather than a green run — the two collisions that used to fire, and six
  shapes a real leak takes, all still caught. A passing harness run proves nothing here, since the
  bug only appears when the clock cooperates.

### Added

- **WO-2.14 — a work order can now be claimed, and a tick can be refused.** `tools/wo-gate.mjs`
  grew `--start` and `--release`, and `--tick` grew a conscience.

  **A dispatch claims its work order before the brief is written.** That is what finally arms the
  "already 🔨 IN PROGRESS" guard the gate report has printed since the beginning and has never once
  been able to fire — WO-2.4 ran two Codex rounds, a correction and two verifier passes while the
  tracker said nobody had started it. A claim writes one status line and moves no dashboard, because
  a claim is not progress; the dashboards count `✅ DONE` and nothing else. `--release` puts it back
  when a dispatch dies, and `next` names every claimed row it steps over — with the command to
  release it — so an abandoned claim cannot quietly delete a work order from the running order.

  **`--tick` now reads the work order's own Acceptance list before it writes anything.** One box
  still open and it writes `🔨 IN PROGRESS` instead of `✅ DONE`, names the lines that held it open
  by file and line number, and leaves the roadmap boxes and both dashboards alone — an unfinished
  work order closes nothing. It exits non-zero under a third verb, `HELD`: nothing failed, the tool
  wrote what was true, but the caller asked to close a work order and it is not closed.

  **Landing at 🔨 with 👤 lines owed is what this project actually does** — WO-2.1, WO-2.11, WO-2.12
  — and until now that status was hand-edited every time, because the tool could only write done. At
  WO-2.4 the offered maintenance would have stamped `✅ DONE` on a go-live blocker with two lines
  still owed to the owner. That was caught by reading the source, which is not a control. The old
  script was run against the same planted state to confirm it: it stamps done over an open box,
  closes the roadmap line, moves both dashboards, and exits 0.

- **WO-2.4 — the counts, and a percentage that agrees with the app it replaces.** Under every name
  on the registry, and on a line above the grid: how many meetings the class has actually recorded,
  each student's P / T / A / E / D, and a rate. Per term where the term has dates, and per year
  always.

  **The formula was not ours to choose.** `(P + T + E + D) / (P + T + A + E + D)` — excused absences
  and dismissals sit in the *numerator*, so being out sick with a note does not damage a student's
  rate. The owner reads both apps' numbers this year and they have to agree, which makes this a
  compatibility requirement rather than a design decision. It was checked against Roll Call!'s
  per-quarter sheet formula at `src/bridge.gs:625-626` — against the source, not against this
  project's description of the source, which is a distinction that earned itself below.

  **The denominator is recorded meetings of that class, never calendar days.** A class met if it has
  an attendance record with no exception, asked through the one predicate every count already runs
  through. Dropped days, school-wide days off, and days nobody has taken yet are absent from both
  halves of the fraction. A denominator built from dates looks right in September and diverges by
  November.

  **Unconfirmed folds into absent — here and nowhere else.** `U` is not a sixth mark, never appears
  in a displayed count, and a finished class contains none of it. But in this percentage every `U`
  sits in the denominator beside the absences, because the alternative is a rate that flatters a
  class nobody finished taking. The consequence is worth knowing before anyone hand-counts:
  mid-marking, every student not yet reached reads as an absence.

  **A student with no recorded meetings says so.** `percent` is `null`, not zero, and the line reads
  "No recorded meetings" — because week one is exactly when a confident `0%` would be read as a
  fact about a child rather than about an empty ledger. Terms ship with blank start and end dates,
  which is a valid state for a teacher setting up in August, and the line is honest about that too
  rather than labelling a whole year "Quarter 1".

  **Roll Call! turned out to disagree with itself, and the divergence is its.** Its per-quarter sheet
  formula is the one above; its year roll-up at `src/dashboard.html:4058-4073` computes
  `(P+T)/(P+T+A+E)` — `E` dropped from the numerator, `D` gone entirely. So Planbook's year figure
  matches Roll Call!'s *quarters summed*, not its year badge, and the comparison to run is quarter
  against quarter. Found by reading the reference implementation while verifying, not by anything
  failing. It is recorded in `TESTING.md` as a permanent fact about the old app rather than a
  one-time setup note, because the next person to compare the two will otherwise find a bug that
  isn't there.

  *And then there is what the harness did.* This work order failed verification twice, both times in
  its own fixtures rather than its arithmetic, and in opposite directions: first an assertion that
  demanded a percentage be simultaneously 100 and 90.9, which could never pass; then a guard added
  to fix it that skipped all ten checks on a fixture that had no terms, which could never run and
  reported exit 0 for it. **A check that cannot fail and a check that cannot run are the same defect,
  and only one of them shows up in a summary line.** The fixes went in with the close: the front door
  is a real check rather than a silent return, and the meeting window asks for ten days rather than
  three — at three it never reached the dropped day, so a function that ignored dropped days would
  have passed a check named for counting meetings rather than days.

  The owner ran the hand count against a real class and a completed Roll Call! quarter on
  2026-08-08. The two agreed.

- **WO-2.3 — days off and planned drops, typed in once, ahead of time.** A **Days off** panel —
  reachable from the class grid's header, from the 📅 in any covered column, and from the action row
  of the class screen itself — where a holiday, a break or a planned drop goes in as one entry. Two
  kinds: **No school**, which covers every class, and **a planned drop**, which names the classes an
  assembly is stopping from meeting. A date, an optional second date, and a title. Thanksgiving is
  one line, not fifteen.

  **Nothing typed on that panel is written into attendance, and that is the whole design.** The
  registry *reads* the calendar when it paints; it never copies an exception onto a record. Copying
  is the obvious implementation — five classes across a three-day break is fifteen rows and the
  marking screen would have needed no changes at all — and it is the one thing this shape exists to
  prevent, because the copy is a second source of truth. Shorten the break by a day and the stale
  rows survive it, each one asserting that a class did not meet on a day it did. Because there is no
  copy, **deleting a holiday puts every day it covered straight back to "not taken yet"** — there is
  nothing to go and unpick.

  **A day with attendance actually recorded on it stays a meeting.** A snow day is added the morning
  after, retroactively, over dates that may already hold a real period. The predicate answers the
  record *before* it consults the calendar, so nothing the panel can write is able to void a mark —
  the protection is structural rather than a check somebody has to remember. What the teacher gets is
  the other half: a dialog naming every period that keeps its marks, raised only when there is
  something to protect, because a dialog that appears every time is a dialog that gets tapped
  through. It warns rather than refuses, deliberately — Monday and Wednesday of that snow week are
  still legitimately closed, and an app that will not record a two-day closure because one period was
  marked in the middle of it is an app she works around.

  **A covered day says a fourth word.** Not "Didn't meet" — the teacher's own title, shortened to
  what a 72px column holds — and it is drawn in the dropped column's quiet grey made **solid**
  instead of dashed. The two mean the same thing about the class and different things about where
  the undo lives, and the undo is what she is reading that chip to find: a dropped day is taken back
  with the ↩ on the registry, a covered day is taken back on the panel that authored it. So a covered
  column's control is a **door rather than an undo** — removing the event affects every class on
  every date of its range, which is far too much to hang on a glyph in one class's column head.

  *And then it met a classroom.* Every acceptance line passed on the desk and again on the owner's
  iPad, and the sitting still sent back **five defects that nothing green had caught** — then a sixth,
  against the fix for the largest of them. Worth naming because of what kinds of thing they were: two
  were layout under a real coarse pointer, one was the software keyboard, one was a design rule that
  only looks wrong once a thumb is doing the work, and one was a hole nobody had noticed because the
  feature that opened it had shipped the day before.

  **Future days off could be set and not looked at.** The registry's window ended at today — there
  was no index that could even name tomorrow — so a break entered in September could not be checked
  by going and looking at it. The grid now pages **forward** as far as the last thing on the
  calendar, and stops there rather than running on into empty weeks: past the last holiday there is
  nothing to see, and a screen that pages forever is one where the teacher cannot tell the end from a
  hang. With nothing scheduled it stops at today, exactly as it always did. A day ahead of today
  draws locked cells, no unlock, and says **"Ahead"** in neutral grey rather than "Not taken" in the
  alarm amber — reading next week is not five jobs you forgot. **What did not move is the write.**
  Every writer still refuses a date after today outright, which is precisely why the columns could be
  opened up at all: the block was never in the rendering.

  *That change then broke a rule it had no obvious connection to, and it is worth the sentence.*
  `Later ▶` was disabled by one test — *are you at the forward end* — and for as long as the forward
  end was today, that test also answered *are you in portrait*, because portrait pins the screen to
  today. Once the end could be next week the two questions came apart, and the button lit up on the
  one screen that refuses to page: live, tappable, and discarded by the pager. **A control with two
  independent reasons to be off needs both of them written down**, which is the general form of it,
  and the one above it — `Earlier` — had only ever needed the one. Caught on the iPad within the
  hour and fixed the same day.

  **"Days off" spilled out through its own border on the iPad**, and nowhere on the laptop. The touch
  pass gives every action button `min-width: 44px`, which *replaces* the `min-width: auto` a flex
  item gets for free — and that auto was the only thing stopping a `nowrap` button from being made
  narrower than its own label. A shrunk nowrap button does not reflow; it overflows. Every 44px check
  in the harness stayed green through it, because the button really was 44px and really was wrong,
  which is why the new check measures content against box rather than measuring the box.

  **The form now empties itself after an add**, and the iPadOS trap that was the original reason for
  leaving the dates in place is answered rather than avoided: the field is discarded and rebuilt, the
  same fix the term dates already use, so the day just used can be picked again on the first tap.
  **Picking a start date carries the end date with it** — the second date is almost always the first
  one. And **focus goes to the button rather than back into the title field**: focusing a text input
  summons the software keyboard, which comes up over the bottom half of the screen, which is where
  the list the add just changed lives.

  **The way to the calendar is now on the class screen too**, past the controls that write. It was
  reachable only from a covered day — the one day you have no reason to go there, because the thing
  is already done — while the tap that actually wants it is *"we are off next Thursday"*, made
  standing in the room with a class open. It sits at the far end of the action row, held away from
  the three controls a teacher aims at with students walking in; it writes nothing and acts on no
  day, so it is not one of them.

  **One consequence stated rather than discovered:** a covered day is read-only, so a class that
  genuinely met on a school-wide day off cannot be recorded from the registry. The escape is the
  calendar — narrow the range, or change the kind to a drop that names classes. That was chosen over
  leaving the cells live, which would let one mis-tap invent a meeting on Thanksgiving.

  **Two sittings on one day**, and that is the shape of this work order rather than an accident of
  it. The first found five things behind a harness that was entirely green, and the fix for the
  largest of them introduced the sixth — a change that opens a new axis on a screen re-opens every
  rule that was phrased against the old one. The second closed all eight checks over all six.

  `tools/verify-shell.mjs` 366 → **389** checks, zero skipped — thirteen with the work order and ten
  more with the punch list — and `sw.js` cache v28 → v30. Nine mutation proofs. The one that earns
  its keep is copying the event onto attendance records inside the writer: **ten of the twelve new
  checks go red and nothing visible changes at all.** The columns still go grey, the cards still say
  "No school"; the only thing that gives it away is `doc.attendance` no longer matching itself.

- **WO-2.12 — portrait shows today; landscape shows the week.** The registry now draws **one day
  column in portrait — today's** — and six in landscape. Held at the classroom door the screen is for
  marking the period walking in; the six-day window is something you read at a desk, and you turn the
  iPad for it. Turning it repaints straight away: no reload, no tap, and the mark you just made stays
  where you put it.

  This replaces the width budget WO-2.8's hall-pass column forced on the grid, which had been quietly
  taking day columns away — four on a 768pt iPad, five on an 11″. With only today's column to pay for,
  the name column stops competing for width and full surnames fit without an ellipsis.

  **The orientation is the signal and nothing else is.** A browser window dragged narrow is still
  landscape and still shows its week, because a teacher at that window is at a desk reading days. There
  is no toggle and there will not be one — a preference to override this is a setting nobody finds and
  everybody has to maintain.

  The cost, stated rather than discovered: **backfilling a past day needs a day column, so correcting
  last Tuesday means turning the iPad.** *Earlier* and *Later* are greyed out in portrait and their
  tooltip says so — the rotation is the route, and now the screen tells you that rather than leaving
  it in a work order.

  *One defect this opened and closed in the same pass.* Which day you are editing is module state and
  survives a repaint, so unlocking Tuesday in landscape and turning the iPad upright left the screen
  editing a day that was no longer drawn: every cell in today's column read-only, under a banner naming
  a day that is not there. A teacher at the door could not mark anybody, and nothing about it would
  have looked like a rotation bug. A turn now takes the same exit a page-away already took — the strip
  saying which day you are editing is only honest while that day is on screen.

  *And then the turn itself had to be re-cut, hours after it shipped.* On the owner's own iPad the
  first turn worked and the second did not; a reload restored the week, and the next turn did nothing.
  The arithmetic was never wrong — 359 desk checks were green over a build that failed at the door —
  and the **trigger** was, in two ways no headless Chrome can produce. A media-query listener whose
  query object nothing holds a reference to can be garbage-collected on WebKit, taking the listener
  with it, which is exactly "worked once, then never again"; and iOS reports the pre-turn window size
  while the change event is being delivered, so the repaint measures the orientation the device just
  left and redraws what is already there. The trigger is now the media query **plus** `resize` **plus**
  `orientationchange`, each looking three times — now, next frame, and once more after the rotation
  settles — and the cost of listening to all of them is paid by a guard that compares the count it
  would draw against the count on screen and touches nothing when they match. That guard also answers
  the original argument against `resize`: a window dragged across the whole budget repaints on the few
  widths where the answer changes and does nothing on the rest. It falls out of that fix that a laptop
  window dragged narrower now redraws the grid where before it needed a reload.

  *And paging was re-anchored, on a second report the same day.* Page back three windows in landscape,
  turn the iPad, and the screen showed **the 4th** rather than today. Where you are in the past was
  counted in *windows* — so the number standing for your position got multiplied by however many
  columns were on screen, and a window is six weekdays wide in landscape and one in portrait. Three
  taps back meant eighteen weekdays in one orientation and three in the other, and turning the iPad
  silently moved you four weeks. It is counted in **weekdays** now, while *Earlier* still steps a whole
  window at a time — so "two taps is two weeks back" is unchanged and nothing moves under you when the
  width changes. The quiet version of the same bug is gone with it: a browser window dragged from six
  columns to five used to slide you two weekdays sideways, and now it just shows fewer days of the
  same stretch. **Portrait no longer pages at all** — it shows today, which is the whole point of it,
  and turning the iPad is how you reach anything else.

  `tools/verify-shell.mjs` 349 → **366** checks, zero skipped, with nine mutation proofs behind the
  new ones; `sw.js` cache v25 → v28.

- **WO-2.11 — the pass banner, and cancelling a pass issued by mistake.** A band above the registry
  grid carries one card per student who is out of **this** room: their name, the type, the time they
  left, `✓ Return`, `✕ Cancel`, and a note field. Before this, the only way out of a mis-tapped pass
  was Return — which appended a trip that never happened to a log that is append-only by rule and
  read by Phase 4 as a signal. WO-2.8 shipped naming that as a go-live blocker; this closes it.

  **Cancel writes nothing.** Not a zero-minute trip, not a corrected entry — nothing. The student
  never left, so there is no trip to record: `passes` is byte-identical after the tap and the slot
  against the per-class cap of three frees immediately. This is the one exception being carved into
  the append-only rule and it must not become two, so `cancelPass()` is addressed by class and
  student and **never names the history array at all** — it cannot reach a pass that has already
  been returned even if asked by that entry's own id. Correcting a finished trip stays a job for the
  history view.

  **Cancel lives on the card and nowhere else.** The Passes column is 160px and already holds three
  targets; a fourth beside Return is how a thumb aiming at Return destroys a real trip's minutes.
  Roll Call! puts cancel on the card for that reason and Planbook does the same. Both Returns — the
  card's and the row's — call one writer, and the two surfaces repaint together.

  **A pass can carry a note**, typed on the card: *went on to the counsellor*, *third time today*.
  It rides onto the log entry when they return, and goes wherever the pass goes — nowhere — if the
  pass is cancelled. No note means no `note` key at all, the same shape rule a mark cell's note
  follows.

  The banner is scoped to **the class on screen**. A pass left open in period 2 is not hidden by
  that — its own row in period 2 still shows a Return and the time out — but it is not noise on the
  screen you are standing in front of, naming students from a room you are not in. The band sits
  above the grid rather than beside it, so it costs the registry no day columns; the portrait width
  budget is already tight and WO-2.12 is about to spend it.

  *The card was then re-cut against Roll Call!'s own.* The first build kept the predecessor's card
  **shape** and re-derived everything else — a light amber card where the original is a dark band
  with an orange edge, no avatar, the name sharing one line with the type chip and the clock, and no
  place held for the elapsed count. The owner caught it against the running app on 2026-08-07. Both
  apps are hers; re-deriving a layout that a year of classroom use had already tuned is retreading a
  settled decision, not designing. The card now takes `dashboard.html`'s structure, measurements and
  colours: avatar, name over a quiet meta line, the elapsed clock's slot, then filled-green Return
  and outline Cancel, note field beneath. One rule deliberately not copied — Roll Call!'s note input
  suppresses its focus ring, and this project forbids that anywhere; the departure is commented where
  it happens. The general rule is now in `CLAUDE.md` under Reference implementation.

  *And then the card was made to fit its one row on a thumb.* A second iPad sitting found three open
  passes drawing **two rows of buttons in landscape and three in portrait**, while the desktop
  layout — same markup — was already correct. The cause was entirely in `@media (pointer: coarse)`:
  the info block pinned to full width leaves the buttons nowhere to go but downward, and a Return set
  to grow then takes the rest of the line and puts Cancel on a third row. Both rules removed. Two
  things bought back the width that made them seem necessary: **the type chip lost its emoji** — the
  row's three pass buttons carry glyphs because they lost their words to a 160px column, but this
  chip kept its word, so the glyph was saying the same thing twice — and the two buttons went to
  equal, tighter padding. The 10px between Return and Cancel did not give; that gap is the one this
  work order exists to protect, and it is now asserted rather than assumed.

  **What is still missing on purpose:** the elapsed counter itself. Its place on the card is held
  open, but a clock that ticks is the thing iOS stops ticking when it suspends a backgrounded PWA,
  and that trap belongs to WO-2.9 along with overdue alerts and pass history — cut to Ship 2.

  `tools/verify-shell.mjs` 330 → 349 checks, zero skipped; `sw.js` cache v22 → v25. Seven mutation
  proofs, including the two the work order named as traps — cancel written as Return with
  `minutes: 0`, and a `cancelPass()` general enough to delete a returned entry — go red as designed.
  An eighth was added with the one-row fix: putting the two wrap rules back turns the new check red
  at 139px against a 47px tallest child, which is the three-row card exactly as it was reported.

- **WO-2.8 — hall passes: one tap out, one tap back, and the app does not forget who is out.** The
  registry has a **Passes** column between the name and the day columns. 🚽 Bath · 🏥 Nurse · ⚡ Quick
  sends a student out and records the time they left; **Return** brings them back and writes down how
  long they were gone. Three students at a time **per class**, and at that limit the buttons grey out
  and the screen says why in a sentence — a greyed control with no explanation is a dead control.

  **An open pass is stored, not remembered.** Close the app, drop the iPad, force-quit it from the
  app switcher, come back after lunch: whoever is out is still out, with the time they left beside
  their name. This is the one place the feature deliberately does **not** copy Roll Call!, where
  active passes live in a module variable and vanish on reload. Here the pass is in the year document
  and reaches IndexedDB on the same save as everything else. It is a safety property, not a
  convenience — an app that loses track of a child who is physically out of the room cannot say so,
  because it no longer knows.

  **A pass never changes anybody's attendance.** A student at the nurse was present. The single
  exception is a dismissal: marking someone **D** while they are out closes their pass, and taking
  the **D** back opens it again with the original time. Both halves only apply to today — a `D` typed
  onto last Tuesday says nothing about who is in the corridor now.

  Passes are their own two collections rather than entries in the existing `log`, and the reason is
  disclosure rather than tidiness: `log` is the outreach record that Phase 4's cooldown and Phase 5's
  templates read, and a bathroom trip sitting in it is one missing filter away from going home to a
  guardian. `openPasses` holds what is happening now, `passes` is the append-only history, and both
  are keyed by student id, so renaming a student neither orphans their passes nor attaches somebody
  else's. `MIGRATIONS[2]` takes documents from schema 2 to 3 by seeding the two collections empty;
  running it twice is byte-identical.

  *Two things to know.* **There is no way to cancel a pass issued by mistake** — the only exit is
  Return, which records a trip that did not happen. That is booked as WO-2.11 and is a go-live
  blocker. And **the new column costs the portrait grid a day column**: an 11″ iPad held upright now
  shows five days instead of six, a 10.2″ shows four, and landscape and every laptop still show six.
  Turn it sideways for the full week. WO-2.12 replaces that trade with a better one — portrait shows
  today, landscape shows the week.

  `tools/verify-shell.mjs` 314 → 330 checks, zero skipped; `sw.js` cache v21 → v22.

### Added

- **WO-1.13 — `<main>` holds views now, and the header row that always looked like navigation
  finally is.** `selectClass()` wrote the `openClassId` preference and repainted the tab strip, and
  that was all it did, because there was nowhere in `<main>` to go: one panel, "Your classes", that
  nothing ever swapped. WO-1.6's own note in `index.html` had called the header class row "the app's
  navigation rather than a styled strip" — it was never navigation, and no work order between them
  noticed.

  `<main>` now holds sibling views toggled by `.hidden` (`src/views.js`, 88 lines — not a router and
  not a framework), which is the shape Roll Call! has used all along. The home grid became
  `#homeView`, one view among several rather than the only thing there is, and **WO-2.1's attendance
  grid moved out of `attendanceModal` into a main-area view, rendering unchanged** — a re-parenting,
  not a redesign.

  **The cost landed a phase later, which is what makes this a defect and not a taste.** Attendance
  needed somewhere to live, the only established pattern was `openModal()`, so the marking screen
  opened as a dialog *on top of* the class cards it had just made irrelevant — and the app carried
  **two** class selectors, the header tabs and the home cards, both feeding one invisible variable
  and neither one going anywhere. The owner found it immediately and asked why the panel was not the
  screen. We had lifted Roll Call!'s modal components and its visual language and left its view
  architecture behind; `CLAUDE.md` says to lift from Roll Call! rather than hand-design, and this was
  the second defect in a single day traceable to not having done that.

  **The owner's call, recorded because it is a product decision and not a build one: cards enter,
  tabs switch.** The class tab strip is not drawn on the home view at all — there, the cards are how
  you enter a class and a tab row duplicating them *is* the defect. On the class view the strip is
  the fast switcher between classes, the job it can do that the cards cannot, because the cards are
  not on screen then. The two are never visible at once meaning the same thing.

  *The first pass answered a third way*, recasting cards-and-tabs as "two renderings of one control"
  by analogy with `data-class-manage`'s three doors, and then ticked its own box on it. The analogy
  is where it went wrong: three doors onto a modal are three ways to reach one **task**, while cards
  and tabs were two ways to reach one **place**, both on screen simultaneously. The verifier failed
  the line and referred it up rather than accepting it, which is the behaviour that was supposed to
  happen and did.

  `sw.js` cache v15 → v16, with `src/views.js` added to `SHELL` in the same commit that created it.

  *Entered 2026-08-08, two days after the work landed.* The standing obligation is that a changelog
  entry goes in as the work lands; this one did not, and the omission was invisible until WO-G1's
  "`CHANGELOG.md` current" gate was actually checked against the file rather than assumed.

### Changed

- **WO-2.10 — an unmarked student now reads as absent, and the first tap means "present".** The
  registry's mark model was backwards for how the owner stands in a room, and two complaints on
  2026-08-06 said so: a cell started on `?` and the first tap jumped to `A`, so confirming a student
  *present* cost four taps round the cycle; and tapping one student took the whole class, flipping
  every other `?` to `P` at once, so there was no way to tell who had actually been looked at.

  A new code **`U` — unconfirmed** is written for every student when a class is first touched and
  deleted as each student is confirmed, so the count of people still to account for is real and on
  the home card. One tap now moves **one** cell and no other. The cycle reads `P → A → E → T → D` and
  returns to `P`, never back to `?` — un-confirming is a deliberate act with its own control, not a
  place the cycle lands. Underneath all of it: a teacher pulled out mid-period leaves an honest
  record that says "I had not accounted for these students", instead of a silent room full of `P`.

  **A class nobody has touched still has no record at all.** Initialization is an act, not a side
  effect of arriving on the screen — otherwise every class the teacher merely *looked* at would
  become a meeting that happened, and "did the class not meet, or did I forget?" is the question this
  screen exists to answer.

  **Every `marks` cell is an object now** — `{ code, at, note }` — where it used to be a bare code
  string. That is what buys the other half of the work order: tardies and dismissals carry an `at`
  timestamp stamped by the app, drawn under the glyph as `8:14a` and spoken in full, with no report
  anywhere that resolves it. Notes attach per mark, per student, per date. Times are stored with a
  real UTC offset and never as `Z`, because a mark read back in a different offset must still say the
  minute the student walked in.

  **The two changes are folded into one work order on purpose.** Both rewrite every reader and writer
  of `marks`, and shipping them in sequence would have migrated live student data twice — the second
  time over a real term, weeks after go-live. `MIGRATIONS[1]` takes documents from schema 1 to 2:
  bare strings become objects with their codes intact, no `at` is invented for a mark that never had
  one, empty-string cells are dropped, and applying it once, twice or three times is byte-identical,
  so a re-run cannot produce `{ code: { code: 'A' } }`. It runs on restore as well as on open, which
  matters because every backup already on the teacher's disk is a schema-1 document.

  `tools/verify-shell.mjs` 282 → 299 checks, zero skipped; `sw.js` cache v19 → v20.

- **The 720px cap was lifted from the wrong half of the stylesheet, and the iPad kept it for three
  hours.** `.attendance-panel`'s dialog-era width had already been overruled and removed from the
  base rule — with a comment saying not to put it back — but an identical `width: 720px` was still
  sitting in `src/attendance.css`'s `@media (pointer: coarse)` block. A fine pointer never reads that
  block, so the change landed on the laptop and **never reached the only device it was for**.

  What it cost was the new note panel. The grid's own columns want 711px — a 279px name column plus
  six day columns at 72px — against 680px of panel body, so the wrap's `overflow-x` safety valve
  engaged and the note field sat **16px past the right edge**. Identically in both orientations,
  because a fixed panel width makes the geometry the same whichever way the iPad is held: rotating to
  landscape left 288px of screen unused and changed nothing. Present, absent and at-an-event were the
  worst of it; tardy and dismissed escaped only because their longer mark chip ("Tardy at 8:14a")
  wrapped the field onto a line of its own.

  Two rules fix it and they are not interchangeable. `.attendance-panel { width: 100% }` in the
  coarse block gives landscape the room outright. `.attendance-name { max-width: 256px }` is what
  clears portrait, where even the whole screen is 8px short: the cell is `nowrap`, so its min-content
  is the entire name laid flat, and a table cell's min-content is a floor the browser widens the
  whole *table* to honour. 256px is the arithmetic — 688px of body less six 72px columns. The cap
  truncates nothing on its own; it releases the floor, and the column still takes 512px in landscape
  where there is room.

  **The trigger was name length, which is why no fixture had ever caught it.** The harness types
  short names; "Delacroix-Nguyen, Xiomara" is 279px and real rosters are full of them. The first
  regression check written for this passed with the fix fully reverted — it was measuring a screen the
  defect had never been on. It now writes the long name in deliberately, asserts that precondition,
  and renders *after* each resize, because `dayColumnCount()` reads `window.innerWidth` when the grid
  is painted rather than when it is read, and a grid painted at the previous section's 390px keeps
  three columns at 768px. Reverting either rule now turns it red.

  Two things a reader of that file should know. The name column truncates in portrait for the first
  time — the ellipsis and the full name on the row's `title` were built for this moment and nothing
  had ever made them engage. And the coarse block's `.attendance-day { width: 54px }` is a dead rule:
  the base `min-width: 72px` beats it, so the column is 72px, and doing the arithmetic with 54 is
  what made the cap look safe in a comment that confidently claimed six columns were 324px.

  `tools/verify-shell.mjs` 299 → 314 checks, zero skipped; `sw.js` cache v20 → v21.

- **Four Codex failures were one missing directory, and Codex is back in the rotation.** WO-1.4,
  WO-1.6 and WO-1.7 all died at exec time on `codex-windows-sandbox-setup.exe: program not found`,
  and the WO-1.12 probe made it four. Every one of them named the same file, and nobody had gone
  looking for it *as a file*: it lives in `codex-resources\`, a directory sitting beside `bin\` in
  every installed standalone release, and that directory was never on `PATH`. `codex.exe` resolving
  from its own separate launcher install proved nothing about whether its helper spawns could find
  each other by name — which is exactly what "helper failures across read, `apply_patch`, and exec"
  had been describing four times over, in a vocabulary that read as *the runner is down again*.

  **The fix is set inline in the same command as every `codex exec` call, not persisted.** A
  registry-level `SetEnvironmentVariable` write was tried first: it lands correctly and then does
  nothing, because a session already running when it was written has already built its environment
  block and does not re-read the registry for child processes. A dispatch cannot tell from the
  inside whether its own session postdates the change, so the persisted form is not safe to depend
  on and the inline one is. The `current` junction under `~\.codex\packages\standalone\` is used
  rather than a version string, so the fix does not go stale the next time Codex updates itself —
  the same silent staleness this repo keeps cataloguing everywhere else.

  The probe went **2 for 2 immediately after 0 for 4**, which is the exit condition
  `plans/work-orders/ROUTING.md` had already written down for the suspension, so WO-2.2, WO-2.3 and
  WO-2.4 return to Codex. The Because column is untouched in both directions: the rubric was never
  what failed, and the record of why those routes were right is worth more than a table that always
  agrees with the current state of the runner.

- **"Claude" was one destination where it should have been two, and Phase 1 paid for it.** The cost
  audit that prompted the hunt above put a number on the other half: WO-1.4, WO-1.6 and WO-1.7
  landed in the Claude column *by fallback rather than by rubric* — every one classified Codex on
  its own merits, moved only because the runner was down — and ran on Opus anyway, because the
  fallback had exactly one address. That is **433,460 output tokens, 36% of the phase's
  implementation**, spent at the top tier on work `ROUTING.md` had already judged not to need it.

  The route is now two questions: who, and then which tier. A Codex row that falls back goes to
  **Sonnet**; a row that earned the Claude column on its own merits — sensitive surface, convention,
  design lift, teacher-facing prose, a judgment trap, size `L` — still gets **Opus**. A fallback is
  explicitly *not* a re-rubricing: the reasoning stays in the Because column exactly as the ⏸ marks
  kept it, and a Sonnet fallback that fails the verifier twice is the signal to re-read the work
  order rather than to quietly raise the tier and run it again.

  **The verifier stays Opus, and is not a saving to go looking for.** It is 23% of pipeline output
  and looks like box-ticking, which is precisely what makes it the tempting cut and the wrong one:
  it is the only role asked to notice what is *absent*, and this pipeline's documented failure mode
  is a confident pass over nothing. Three defects escaped a green run in Phase 1 with Opus already
  reading them. The tier is a spawn-time override rather than an edit to the agent frontmatter, so
  every downgrade stays a deliberate act in one dispatch instead of a default somebody forgets to
  raise back.

- **WO-1.12 closed the two harness blind spots WO-1.10's verifier found, and corrected a claim
  about the harness that turned out to be wrong.** `tools/wo-sweep.mjs`'s coarse-block check now
  reads `git ls-files --others` alongside `git diff HEAD`, so an untracked stylesheet — the exact
  shape `src/home.css` took at WO-1.10 — is read in full instead of silently skipped. `verify-shell.mjs`
  gains a `homeVsDoc()` helper driven after all eleven `afterClassChange()` call sites — create,
  rename, reorder (up/down), archive, restore-from-archive, delete — 224 → 231 checks, zero skips.
  Six of the eleven were genuinely uncovered before this work order; three were already caught by
  existing checks, and the eleventh (delete) is offered only on an archived class already off the
  grid, so no `#homeGrid` read can tell the difference. `tools/README.md` had claimed a dropped call
  site "left every check in here green," which overstated the gap this closes, and is corrected to
  name the six branches instead.

  Both proofs were independently re-driven by the verifier rather than trusted from the
  implementer's report: a planted untracked CSS fixture with an uncovered coarse selector is now
  caught, and was not before; deleting each call site one at a time turns seven of eight drivable
  branches red, and the eighth was confirmed undrivable rather than assumed so.

  `afterRestore()` (`src/shell.js`) is not covered by the new checks — the restore fixture and the
  document it replaces hold the same single class, so a dropped redraw there is invisible to
  `homeVsDoc()` too. Left as a follow-up rather than folded in, since this work order's scope was
  the two blind spots named at WO-1.10, not a general audit.

### Added

- **WO-1.11 — back up every year on the device in one tap, not just the open one.** A second
  control on the backup panel, shown only when there's more than one year, downloads a single
  `.zip` holding one JSON file per school year — hand-written zip writer (`src/zip.js`), no
  dependency. Each year gets its own `lastBackupAt` stamp, so backing up one year no longer
  silences the nag for another. A year a newer Planbook build wrote gets no file, no stamp, and is
  named on screen with the reason instead of failing silently. The single-year download stays the
  fast path for the common case and is untouched. **Shipped as a zip, not the original design.**
  The first build downloaded one file per year in sequence; it failed completely on a real
  installed iPad, because iOS's native "Open in…" sheet is a context switch the page's JS does not
  resume after, so a download loop can never reach its second file. The single-hand-off zip design
  survived the same hardware test the sequential version failed.

### Changed

- **`plans/verification-tooling.md` corrected two claims WO-1.10 proved wrong, in place rather than
  deleted.** The document predicted that deleting the WO-1.2 component shelf would take
  `#aboutModal`, `[data-modal-open]`, and the `window.planbook` seam with it. None of the three
  lived in the shelf: the About modal and its `data-modal-open` hook were header markup all along,
  and `window.planbook` was kept on purpose — `src/shell.js` now carries that reasoning at the seam
  itself. Both wrong passages are marked "Superseded" with the correction beside them and the
  original prediction kept intact below, the same pattern the retired line cap already uses in this
  file. A decision record that is wrong about the architecture it describes is worse than silence
  about it.

### Added

- **WO-1.12 opened: two harness blind spots the WO-1.10 verifier found, neither an app defect.**
  `tools/wo-sweep.mjs`'s coarse-block check reads `git diff -U0 HEAD -- src\*.css`, which cannot see
  an untracked file — it missed all nine selectors in the new `src/home.css` at WO-1.10 and reported
  a pass based on `shell.css` alone, true about the wrong file. And `verify-shell.mjs` only re-reads
  `#homeGrid` after one of the eight `afterClassChange()` call sites, so a future missed wire-up on
  delete, reorder, create or rename would leave every check green while a screen goes stale. Neither
  is an app defect today; WO-1.12 exists so the gap is a plan rather than a memory.

- **The home screen — every class in one tap, and a frame built to be grown rather than rebuilt.**
  All classes on one screen as cards, six of them fitting an iPad portrait screen with 548px to
  spare, each one tap from the class it names. This is the owner's founding requirement and the
  screen that becomes Phase 6's glance page, which is why it is built now and grown: build the
  glance page before the things it glances at and you build it twice.

  **The cards are deliberately unfinished, and that is the deliverable.** Each one reserves 42px
  of empty space for Phase 2's today-state, Phase 3's ungraded count and Phase 4's attention
  count — no dash, no zero, no skeleton, nothing that looks like data that isn't there. The
  reserved *height* is the load-bearing part: a slot with no height reflows the grid the day it is
  filled, and the six-cards-in-portrait promise quietly stops being true in a work order that
  never touches this file. One renderer, `classCard()`, is the only place a card is built.

  A tap makes that class the open class through the header tab row's own hook, so the cards and
  the tabs are two views of one selection and cannot disagree about which class is open. A fresh
  document gets a real empty state that leads to the first class, not five blank cards — a grid
  that renders nothing and an empty state that says nothing are the same picture to a teacher on
  day one. The header gained the teacher's name in place of the strapline, which is the only one
  of its five required items that was actually missing; the other four were already there, and
  the save chip moved out of the deleted shelf rather than being added twice.

### Changed

- **`verify-shell.mjs` is re-pointed off the WO-1.2 component shelf, and the count went up rather
  than down.** Replacing `<main>` deleted the shelf that the modal, focus-trap and live-region
  checks were anchored to. Re-pointed at `#classesModal` driven through the real header control,
  201 → 209 checks with **zero skips** — the number that mattered was not the passes but the
  skips, because a run that degrades to announced skips is honest and still worthless. The
  `window.planbook` seam was kept rather than deleted: without it the harness has to keep its own
  copy of the id resolution, the parser and the visibility rule, which is a second truth to
  maintain against the first.

### Added

- **The roster — paste a class list, and keep the contacts that outreach will need.** The school's
  SIS has no usable export, so a roster arrives as text on a clipboard. That is the supported path
  rather than a fallback, and the paste box is built for what real paste sources actually contain:
  `Last, First` and `First Last` mixed in one list, tabs, ragged whitespace, trailing blank lines.
  The format is detected **per line**, not per paste.

  **The preview is the feature, not a confirmation step.** A per-line guess between `Van Dyke, Mary`
  and `Mary Van Dyke` is going to be wrong sometimes — both are real names and both are real
  formats — so the preview shows the split it chose as separate, editable first and last values.
  A wrong guess is caught before it commits, by the one person who knows which is the surname. Any
  row can be swapped with a single control, or typed over, or skipped. A count alone would have
  looked like it implemented this and would have caught nothing.

  **Re-pasting last week's list is a no-op, not a doubled roster.** Every preview row is one of
  three things and says which: new to the year, already in the year but not this class, or already
  on this class's roster. The third is off by default. The middle one is the case that matters
  structurally — a student already in the document is *linked* to the second class rather than
  copied into it, so a student in two classes stays one record with one set of contacts, and
  removing them from one class leaves the other untouched. That is a property of how students are
  stored, not a de-duplication pass afterwards.

  Each student carries nickname, graduation year, email and notes; repeatable guardians with
  relation, email, phone, language and a *contact first* flag; and a counselor. Phase 5's audience
  picker reads all of it from here, which is why it lives on the roster rather than waiting for the
  phase that sends the mail. Teacher settings — name, school, email, admin email, default-cc —
  land alongside it.

  Accommodations are deliberately **absent rather than stubbed**, and WO-1.8 adds them. A stub for
  the most sensitive data in the app is a shape someone later has to migrate, and a placeholder is
  exactly the kind of thing that gets wired to a merge field by accident.

- **Accommodations, medical needs, and behavior plans — on the roster, and discreet by
  construction.** A `supports` block per student: plan (IEP/504/ELL), a case manager, a review
  date, repeatable accommodation cards, medical needs, and a behavior plan. None of it shows on a
  list view without a deliberate tap — the roster carries a single generic dot for "something is on
  file" and nothing else, the same dot for every plan and every student, because a class roster
  gets projected onto a classroom wall and a color-coded plan indicator would turn that wall into a
  legible chart of who has what. The student editor's panel opens shut every time, including via
  Edit, and its fields are emptied rather than hidden while shut — a `display: none` block still
  full of data is readable from the DOM and the accessibility tree, which is the same disclosure
  with the painting turned off. One function, `supportsVisible()`, is the single choke point every
  read and write path consults; WO-1.9's presentation mode changes that function alone. The backup
  file and its UI now name this data as present, truthfully — it was always going to be backed up,
  and the notice said so before it was true.

- **Presentation mode — one toggle in the header, hit before the projector goes on, that
  suppresses every `supports` field app-wide.** Teachers project attendance and gradebook screens
  onto classroom walls; IEP status on that wall is a disclosure to thirty students, and remembering
  which screens are safe is not a plan. The toggle is obviously on when it's on — a filled button,
  `aria-pressed`, and a purple strip naming the mode, all readable from arm's length without
  reading the strip text. It changes exactly one function, `supportsVisible()` (the choke point
  WO-1.8 built), so every screen suppresses at the render helper rather than by a per-screen
  conditional — a roster opened while the mode is on shows no dots, no support text, and refuses to
  let the panel open at all, and none of the underlying data is touched by any of it. The state is
  a bare `planbook_presentationMode` boolean, nothing more, and it survives both a reload and a real
  app relaunch on iPad — installed, toggled on, force-quit from the app switcher, relaunched from
  the home screen icon, verified 2026-08-05.

  **The inheritance is real but not unconditional.** A screen that doesn't exist yet gets
  suppression for free the moment it asks `supportsVisible()`, which is the whole point of the
  render-helper approach. But a screen already on the glass when the toggle is flipped is redrawn
  by a short, hand-maintained call list in `flipPresentationMode()`, not by the render helper
  itself — so a screen Phase 4 adds needs its own line in that list, or a signal card quoting a
  behavior note stays on screen after the switch is hit. Re-check this the moment Phase 4 puts
  something on screen; the acceptance line was written expecting exactly this trap.

### Changed

- **Codex is 0 for 3, and its pending work orders are suspended to Claude until one run lands.**
  WO-1.4, WO-1.6 and WO-1.7 all routed to Codex correctly by the rubric in
  `plans/work-orders/ROUTING.md`, and all three died at exec time on the same missing sandbox
  helper. The WO-1.7 failure was the worst-behaved of the three: **`codex exec` exited zero having
  written nothing**, which is a runner that failed and then reported success. The rows are marked
  suspended and keep the reasoning that put them in the Codex column, because the rubric is not what
  failed and editing it to match a broken runner would lose the only record of why those routes were
  right. The orchestrator still probes every dispatch, so the suspension lifts itself the first time
  a probe writes a file.

- **The Codex smoke probe was itself broken, and would have condemned a healthy runner forever.**
  It created a bare temp directory and ran `codex exec` in it — but Codex refuses to run outside a
  trusted directory, so it died with `Not inside a trusted directory` before exec was reached and
  reported `SMOKE FAILED` for a runner it had never actually tested. Its output was
  indistinguishable from the three real failures above. The probe now runs `git init` first. This is
  the third variant of this failure mode in `plans/dispatch-retro.md`, and the general form is worth
  keeping: **a gate that cannot pass is worse than no gate, because it produces confident wrong
  answers instead of obvious silence.**

- **`verify-shell.mjs`'s ~950-line soft cap is retired, and two metrics that can actually bind
  replace it.** The conversation that `plans/verification-tooling.md` had owed since WO-1.4 was
  finally held, and its outcome is not a second raise: the number goes away entirely.

  Measuring settled it. The file is 2,938 lines across 164 checks — **17.9 lines per check**, against
  17.2 at WO-1.6. It is not bloating; it is accreting at constant density, growing because the app's
  surface grows, with no grep-shaped work smuggled in. **A total-line cap on a file that grows
  linearly with coverage is structurally guaranteed to bind every work order and lose every one** —
  raised once at WO-1.4, then ignored at WO-1.5, WO-1.6 and WO-1.7. That is not a neglected control,
  it is a disproved one, and keeping it meant writing "recorded rather than decided" into this file
  at every work order until 1.0.0.

  The cap was aimed at a real risk: a harness so large that checks rot, duplicate, or go vacuous.
  Line count was a proxy for it, and the proxy broke — the file passed three times the cap while its
  density held and its checks stayed honest. What replaces it is **lines per check** (~17.9; catches
  400 lines buying five checks, ignores 700 buying forty) and **wall-clock runtime** (58s; a harness
  that stops being run before a commit is how one actually dies, which the line count never
  modelled). Both fall out of a run, so neither costs anything to check.

  Recorded against the decision, not argued away: retiring a control because it never binds is also
  how a control quietly disappears. If both replacements sit flat for three work orders while the
  file doubles again, that is the signal to reopen this — and the document says so in the place
  someone would look.

  **The trim itself happens at WO-1.10**, which deletes the WO-1.2 component shelf and must re-point
  the harness regardless — every check bound to `#aboutModal`, `[data-modal-open]` or the
  `window.planbook` seam degrades to an announced `SKIP` if nobody does. That is the first occasion
  the file gets read end to end, and doing it sooner would be a refactor for its own sake, which is
  the thing the one-file rule exists to prevent.

- **The two `verify-shell.mjs` localStorage checks had their strict assertion put back, after WO-1.9
  dropped it once.** Two runs at WO-1.9 went red on `shopifySelectors` and `debug` — keys nothing in
  this repo could have written, since `src/prefs.js` is the only door to `localStorage` and prefixes
  everything. The first response dropped the assertion that every key present starts with
  `planbook_`, on the reasoning that a check going red about the browser's own noise can't be made
  green by fixing the app — which is trap 5's shape but the wrong lesson from it. Trap 7 in
  `tools/README.md` is the actual precedent, and it says the opposite: dropping a sensitive-feeling
  assertion because the harness looks unreliable leaves the check measuring almost nothing, and it
  goes green whether or not a leak is present. The fix belongs in the environment — the
  `--disable-extensions` flags already on the launch line — not in the assertion, so the strict check
  is back in both places it was removed from, `tools/README.md` trap 8 now records the reversal and
  why, and `tools/wo-sweep.mjs`'s static grep was widened at the same time to catch bracket-access
  `localStorage['x']`, which the dot-anchored pattern had been letting through unseen. Both tools
  reran clean with the stricter checks live: 201/201 and 9 passed/0 failed/2 review, unchanged.

### Fixed

- **A save inside a modal was invisible, so the app answered "did that save?" with silence.** Every
  student and guardian edit happens in a modal; modals sit at `z-index: 1000` and the save indicator
  sat at `999` — and its only live mount was inside the WO-1.2 component shelf, never the real
  header. Change a guardian's email, close the panel with the ✕, and nothing anywhere confirmed it
  landed.

  Nothing was ever at risk: the store debounces and then flushes a pending edit when the page stops
  being visible, and the desk half proves it on disk within 3ms of that, with 800ms still left on
  the debounce. But an app a teacher trusts with a term of grades cannot be silent about it, and
  "probably saved" is a thing she would reasonably check by re-opening the panel every time.

  The live indicator now floats above the modal layer at `1050`, with `pointer-events: none` — at
  rest it is a fully transparent chip occupying a screen corner, and without that it would have
  silently eaten taps there. This is a rung Roll Call!'s shared z-index ladder does not have, and it
  is marked in the stylesheet as a deliberate divergence so a later sync reads it as intent rather
  than drift. **WO-1.10 still owns giving the indicator a real home in the header**; this fixes the
  stacking, not the mount. Found on the WO-1.7 iPad sitting, by using the app rather than by testing
  it.

- **Four defects in the class bar and the term editor, found by the first iPad sitting and by the
  checks written for it.** Two were visible on the tablet; two were not, and came out of checks
  added for the first pair.

  **A term date, once cleared, would not accept the same date again.** The iPadOS date popover keeps
  its own selection separate from the field's value, so clearing a field holding 9/4 leaves the
  calendar still showing the 4th selected — and tapping it again changes nothing the picker will
  report. The workaround a teacher finds is to tap the 3rd and come back, which is worse than an
  annoyance: it writes a date she never chose into the year document on the way past. A cleared date
  field is now discarded and rebuilt, since a fresh element carries no picker state. The rebuild is
  bound to `change` rather than `input`, because a date field reads as empty while a date is being
  typed and rebuilding there would replace the element under the caret — there is a check for each
  half, and each fails without its fix.

  **Class tabs were squeezed narrower than their own labels**, which then wrapped across the rounded
  background and past its edge. They are ordinary flex items in a strip that scrolls, and a flex
  item shrinks by default; at 390px this was an 85px label inside a 44px button. They no longer
  shrink, so the overflow goes where it was always meant to — the strip's own scroll — and a
  `max-width` with an ellipsis stops one very long class name from pushing every other tab out of
  reach.

  **The open class was never scrolled back into view.** Replacing a scroller's children resets
  `scrollLeft`, and the bar is rebuilt on every change, so a teacher whose class was fifth of six
  got a header scrolled to the left with no tab on it looking selected — which reads as the app
  having forgotten which class she was in. The strip's own `scrollLeft` is corrected after each
  rebuild, rather than `scrollIntoView`, which would also be free to scroll every ancestor.

  **At 390px the class strip measured zero pixels wide** — the entire bar, tabs and all. `flex: 1`
  means a flex-basis of 0, and an over-full flex row distributes shrinking in proportion to basis,
  so a strip with basis 0 beside a term nav sized from its content shrank by nothing and simply
  stayed at nothing. Both strips are now sized from their content with a floor under each. This one
  shipped in the work order as delivered and was **not findable on the hardware it affects**: an
  iPad in portrait is wider than the width where it happens.

  `verify-shell.mjs` is 130 of 130, up from a baseline of 82 — a number the phase file and
  `TESTING.md` both recorded as 79 until it was re-counted by extracting `HEAD` into a scratch tree
  and running there. A remembered count is not a count.

- **The backup nag no longer goes quiet for a year that was never backed up.** `lastBackupAt` was
  one timestamp for the whole browser, so downloading the open year marked every other year on the
  device as backed up too. A teacher part-way through a rollover — 2027-2028 started, 2026-2027 kept
  for reporting she has not finished — could download one, watch the strip disappear, and reasonably
  read that as "Planbook is backed up." The strip is the only thing standing between a set-aside year
  and silence, and a warning that silences itself for the year you did not save is worse than no
  warning, because it also answers the question.

  The preference is now a map of year to timestamp, the nag asks about the **open** year and names
  it, and a year switch joins boot, backup and restore as a moment the answer is re-evaluated. Still
  per-browser underneath: a file downloaded on the laptop does nothing for the iPad whose storage
  iOS will evict. A device holding the old bare-number value reads as "no year has been backed up",
  which nags once too often rather than once too few — the only direction a data-safety default may
  round.

  The backup panel also names any year on the device that has never been downloaded, because the nag
  only fires on the year that is open: a teacher who never switches back was otherwise never told.
  Backing every year up in one tap is WO-1.11; this is the half that stops the gap from being
  silent, which is the half that matters.

  `verify-shell.mjs` gains the check that would have caught it — one year is exactly the case where
  this bug is invisible, so it drives two — and is now 82 of 82.

### Added

- **Four scripts for the dispatch pipeline, and a measurement that says why they exist.** Six work
  orders have gone through the orchestrator → implementer → verifier chain, and the transcripts put
  a number on what that costs: **549,554 output tokens of implementation, 100,472 of orchestration,
  178,902 of verification** — a 51% premium over implementation alone. Most of the premium buys
  something real. One prevented a bricked install: WO-1.4's verifier caught two new modules missing
  from `sw.js`'s precache, which would have meant an installed iPad that could not open offline and
  would never receive the build. Thirteen sessions have run with zero compactions, because the
  implementer's context is discarded rather than accumulated into the conversation.

  But three parts of it were waste, and all three were the same kind: **work that was re-derived
  from prose every single run.** `tools/wo-gate.mjs` parses the work order header line — status,
  size, `Depends on`, the `🔒 GATED` and WO-1.5-before-WO-1.6 checks — which the orchestrator was
  doing in eight to thirteen tool calls plus the reasoning to interpret them. `tools/wo-brief.mjs`
  assembles the verbatim two-thirds of a brief: the work order, the constraints block from
  `ROUTING.md`, the referenced files, the acceptance list restated. WO-1.5's brief was 15 KB of
  largely-existing text against 14,629 output tokens spent producing it. `tools/wo-sweep.mjs` runs
  the standing sweep as greps, **with its allowlists written down** — WO-1.2's verifier had to
  reason out from scratch that every `prefers-color-scheme` hit in the repo was documentation
  stating the prohibition, and every verifier since would have had to do it again.

  `tools/wo-cost.mjs` is the fourth, and it is the one that names the pattern. The analysis above
  was rebuilt from scratch four times in one afternoon, in a scratchpad, and thrown away each time —
  which is exactly how two throwaway browser harnesses preceded `verify-shell.mjs`. It prints
  orchestration output per dispatch as a trend, because that is the number that grows on its own:
  **6,965 → 15,561 → 11,985 → 20,507 → 14,629 → 30,825**. WO-1.6's orchestration cost more than the
  entire WO-1.1 dispatch.

  **`wo-gate.mjs --tick` is the only one that writes**, and only into `plans/`. It sets the work
  order status, ticks the roadmap boxes named in `Closes roadmap`, and **recomputes** the dashboard
  counts and progress bar from the phase files rather than trusting the number already sitting
  there. It refuses a work order that is not open, refuses to run without an explicit ID, prints the
  exact diff under `--dry-run`, and never touches a 👤 line or `CHANGELOG.md` — those stay owed to a
  human, which is the whole reason the mark exists.

  The sweep adds a third state beside pass and fail: **`REVIEW`, for greppable evidence that needs a
  human decision.** Whether a mention of `supports` in a file actually *emits* accommodation data is
  a reading question, and a check that guessed would either cry wolf on the roster editor or wave
  through the one line that matters. A `REVIEW` never fails the run; it narrows what the verifier
  must read instead of pretending to have decided it.

- **The scars moved out of the agent definitions** into `plans/dispatch-retro.md`, read when a step
  fails rather than on every dispatch. `work-order-orchestrator.md` had grown 169 → 274 lines in a
  single day, one retrospective paragraph at a time, and every dispatch paid to read all of them.
  The rule for the move: **the imperative stays, only the narrative goes.** "`--summary` is a boolean
  and takes no value" is an instruction and stayed put; the three paragraphs on how that was
  discovered are now next door. It came to 201 lines, not the ~120 aimed for — what is left is
  procedure, and cutting further would have meant cutting instructions to hit a number.

- **The Codex probe is a real write now, not a health report.** `codex doctor` reported
  `16 ok · 0 fail · sandbox ✓` six minutes before WO-1.6's `codex exec` exited **zero** having
  written nothing — `codex-windows-sandbox-setup.exe: program not found`, 31 helper failures. Doctor
  reports *installation* health; a dispatch depends on *exec-time helper* health, and only the second
  one matters. So the gate is a `codex exec` that creates a file in a temp directory under the real
  sandbox flags, checked for existence. It exercises helper spawn and `apply_patch`, which is what
  failed both times.

  **Codex is 0 for 2** — WO-1.4 and WO-1.6, both routed correctly by the rubric, both dead at exec
  time, neither producing a line of code. `ROUTING.md` records that as a transient condition rather
  than a standing fact about the machine, because doctor was healthy afterwards both times. If a
  third fails, the orchestrator proposes moving the pre-routed table to Claude until one run lands.
  The smoke test itself is **unexercised**: it needs a working sandbox, and the sandbox is the broken
  thing.

- **The verifier now has to name the fixture assumption.** For each surface a work order adds:
  *what would have to be true of the test fixture for a bug here to be invisible, and does the
  harness break it?* This is the question that would have caught all three defects that escaped a
  green run. The backup nag shipped with `lastBackupAt` as one browser-wide timestamp against a
  fixture holding **one year** — precisely the case where that bug cannot manifest, with 79 checks
  green. A green run over a fixture that cannot express the failure is not evidence.

  The same discipline was applied to the sweep's own checks while writing them. The coarse-block
  check first reported an empty block on a stylesheet with fifty rules in it, because `findIndex`
  matched a header comment discussing `` `@media (pointer: coarse)` `` in backticks twenty lines in
  — a green-looking wrong answer. Every check was then run against a planted violation and confirmed
  to fail, including inside an inline `<style>` block, and against a control (`<!--note: x-->`)
  confirming it does not fire on markup that only looks like CSS.

- **Classes and terms — the first screen that writes to a year document.** Create, rename, reorder,
  archive and delete classes; give each its own term structure. The class tabs and the term nav in
  the header are live, and every later screen reads which class and which term are open from here.

  **Reorder is explicit up/down arrows, not drag.** The tab strip scrolls, and a drag handle on a
  scrolling strip fights the scroll on a tablet — the gesture that reorders and the gesture that
  scrolls are the same one. Arrows are also measurable by the 44px pass, and they carry `min-width`
  as well as `min-height`, because a one-glyph button 44px tall and 30px wide is half a touch
  target.

  **Archive and delete are different operations, and delete is offered only on an archived row.**
  Archiving keeps every attendance record, assignment and score and only takes the class off the
  bar; deleting destroys them. So getting a class out of the way is one tap that costs nothing, and
  destroying a term of attendance is two taps and a dialog that counts what goes — read off the open
  document, never from a specimen. Cancelling leaves `rev` unmoved, which is the check that proves
  nothing was written.

  **Term dates are labels on a range and nothing else.** They are never sorted, never repaired,
  never checked for gaps or overlaps, never used to decide which term is current, and an empty date
  is valid — a teacher setting up in August has not been given the school calendar yet, and a term
  she cannot create until she has it is a term she creates wrong. There is no `min`, no `max`, no
  `required`, no `.sort(` and no `new Date` in `src/classes.js`, and a check asserts that absence.
  This is `plans/rotating-schedule.md` staying deleted: the moment anything validates these into a
  contiguous calendar, the app has a schedule model again.

  Term ids are opaque (`tm_…`) and no code anywhere reads meaning out of a term label. Seed
  structures use whole words a teacher edits — "Quarter 1", not `Q1` — and a check sweeps the source
  for the literal.

- **The teacher can get the year back out, and back in** (WO-1.5). One tap downloads the open year
  as plain JSON, named for the year and the date; a file input and a drop target read one back.
  This is the gate the whole phase was ordered around — *no feature that writes student data lands
  before the path that gets it back out* — and it is open. WO-1.6 onward may now create data.

  **A file the teacher holds is the only recovery path that survives everything.** Not the browser,
  which iOS empties after about a week of an uninstalled site; not the laptop; and specifically not
  sync, because Drive holds one live copy that sync will happily overwrite. Sync is not a backup and
  never becomes one, which is why this shipped in Phase 1 rather than as a Phase 8 formality.

  **The restore confirm names both documents before anything is replaced** — the year, the class and
  student counts, and when each was last saved, outgoing beside incoming. The outgoing side is read
  raw off disk rather than from the open document, so it can also describe a document `boot()`
  refuses; the whole point of that path is that the app could not open the thing being replaced. A
  restore replaces the year named in the file rather than the year on screen, and says so in a
  separate line whenever those differ, because renaming the incoming document to the open year would
  fold two years of grades into one record.

  **Nothing is written until a validated document exists in memory.** The migration ladder runs
  first — so an older backup is legitimately allowed to be missing whatever a later version added —
  then the shape check, then the swap. Six kinds of bad file were driven through it: empty,
  truncated, a shopping list, a newer `schemaVersion`, a document with its `students` deleted, and
  one with `students` as a string. Each is refused by its own fault rather than a generic message,
  and each says *"Nothing on this device has been changed."* A restore that fails halfway is worse
  than no restore.

  **`rev` continues this device's count instead of reverting to the file's.** A restored document
  takes `max(this device's rev for that year, the file's rev) + 1`, so `rev` never moves backwards
  for a year on a device and Phase 7 can never compare against a version that existed nowhere. The
  consequence is deliberate: restoring a two-week-old file legitimately supersedes the Drive copy
  rather than quietly losing to it. Everything the teacher typed, `docId` included, comes back
  exactly.

  **The nag appears after seven days and goes down when a backup is taken** — and does not appear at
  all for a document holding nothing the teacher typed. Nagging about an empty gradebook on day one
  is how a warning becomes wallpaper, and this one has no snooze, because the way to clear it is the
  button beside it and a snooze here is a snooze on the only copy of a term of grades.

  **The backup panel says what is in the file, in the teacher's words.** Accommodations, IEP and 504
  plans, medical needs, behavior plans — named, plus that the file is plain text and should be kept
  like a paper folder rather than emailed. The file is genuinely unfiltered, and there is now a check
  asserting the sensitive fields are still in the downloaded bytes, so no later work order can
  quietly strip them "for safety" and leave a backup that does not bring the gradebook back.

  **The boot-failure screen has an exit.** WO-1.4 made `boot()` hold the loading screen up rather
  than reveal a gradebook it cannot write to, which was right and left the teacher nowhere to go.
  Restore *is* the way out, so it is reachable from that screen — over the top of it — and the
  download button beside it reads "Nothing open to back up" and is disabled, because a button that
  fails on tap is worse than one that says why it can't.

  The file is pretty-printed at some cost in size. It is the artifact a teacher opens when everything
  else has gone wrong, sometimes in a text editor to prove her students are still in there, and one
  four-megabyte line proves nothing.

  Verified on iPadOS 26.5.2 on an iPad (A16), installed to the home screen: the download lands in
  Files → On My iPad and opens readable with the roster in it, the JSON is selectable in the picker
  rather than greyed out, a drag out of Files in Split View reaches the confirm, a cancel leaves the
  year alone, and the boot-failure screen's restore button was staged and tapped on a real screen.
  `tools/verify-shell.mjs` is now 79 of 79.

- **The app holds a year of work, and gives it back after the app is closed** (WO-1.4). One JSON
  document per school year in IndexedDB — classes, roster, attendance and grades together — loaded
  when the app opens and written back on a debounce as the teacher works. This is the first work
  order where Planbook keeps anything, and everything after it depends on the document being there
  when the app comes back.

  **One object store, keyed by year, one record per document.** Splitting it across stores would
  read as the efficient choice and would quietly delete the property that makes whole-document
  last-writer-wins sync correct later. The shape is the sync design, not a storage detail.

  **`rev` advances exactly once per save, and is put back when a write never lands.** That second
  half is the part worth stating plainly: a `rev` that moved on a save storage never saw would
  leave memory claiming a version that exists nowhere, and the backup in WO-1.5 and the sync in
  Phase 7 both compare against it. A retry of a failed write is the same save and does not bump
  again.

  **Saves are debounced, and flushed on both `visibilitychange` and `pagehide`.** iOS kills
  backgrounded tabs without warning, and a debounce timer that has not fired dies with the tab —
  a period of grades the teacher already typed, gone with no error and nothing on screen to
  suggest it. Both events are wired because they fire in different situations, and the write lands
  in one to two milliseconds against an eight-hundred-millisecond debounce.

  **A save failure says so.** The indicator from WO-1.2 is wired to real state, and the error names
  the year, says the last change is only in memory, and offers the two causes a teacher can act on
  — storage full, or a private browsing window. Silence was the alternative, and silence here means
  a teacher who believes the grades are saved.

  **Years are switchable, and switching refuses while a change is unsaved.** The roster turns over
  every year and nothing may assume a fixed class list, so creating, listing and opening years is
  in from the start. The picker is its own module (`src/year-picker.js`), keeping `store.js` free
  of the DOM. A migration ladder keyed on `schemaVersion` is present and empty: it refuses a
  document from a newer build and refuses a gap, so adding a step later is not a refactor.

  **If the store cannot open, the loading screen stays up and explains itself** rather than
  revealing a shell that looks like a working gradebook it cannot write to. Showing the teacher a
  gradebook that silently discards what they enter is the worse of the two lies available.

  Verified on iPadOS 26.5.2 on an iPad (A16), installed to the home screen: a year created through
  the picker survived a force-quit and relaunch, and then survived it again with Wi-Fi fully off —
  where a new year could still be created with no network at all, which is the difference between
  a cached shell and a store that genuinely does not need the network.

- **The app installs, and warns the teacher who hasn't installed it** (WO-1.3). A real
  `manifest.webmanifest` — standalone display, palette theme colors, and five committed PNG icons
  drawn by `tools/make-icons.mjs` in the sizes iOS actually reaches for. A service worker that
  precaches the shell under a versioned cache name, serves it cache-first, and deletes every older
  cache on `activate`. The app runs with the network off once it is on the home screen.

  `src/install-banner.js` detects an uninstalled launch through `display-mode: standalone` and
  `navigator.standalone` — the second for the older iPads a school still has in a cart — and
  reveals a banner that says what can be lost and exactly which taps prevent it. The copy lives in
  `index.html` rather than a template literal, because it is the part a teacher actually reads.
  Neither `minimal-ui` nor `fullscreen` counts as installed: a false "you're installed" stops the
  warning and is discovered at the end of a holiday.

  **The banner is dismissible but returns after three days,** and the number is derived rather
  than chosen. It has to be strictly under half the ~7-day eviction window so at least one warning
  always falls between a dismissal and the earliest moment data could be erased. Seven days is the
  intuitive number and exactly the wrong one — the banner would come back the week after the
  grades were already gone.

  `index.html` finally carries `viewport-fit=cover`, with `apple-mobile-web-app-status-bar-style`
  set to `black-translucent`. Until this, the ten `env(safe-area-inset-*)` declarations in
  `src/shell.css` resolved to `0` on iOS and the padding WO-1.2 shipped was inert — WO-1.2's iPad
  tick passed because there were no insets to sit under. `tools/verify-shell.mjs` is now 28 of 28;
  the check that failed by design was this precondition.

  Verified on iPadOS 26.5.2 on an iPad (A16), installed to the home screen: launches without browser
  chrome, opens with the radios off after being swiped out of the app switcher, and the banner
  appears uninstalled and is absent installed. One line is still open — that nothing sits under a
  now-non-zero safe-area inset, which needs a sweep of the edges rather than the status-bar check
  that was run.

- **A local HTTPS server, because `localhost` is a secure context and a LAN address is not.**
  `tools/make-cert.mjs` mints a local CA and a server certificate; `tools/serve-https.mjs` serves
  the repo under it. Both are bare-Node `.mjs` with no dependencies, and `certs/` is gitignored —
  the one thing `tools/` writes that is not committed, because it holds private keys.

  This is not convenience. WO-1.2's iPad pass ran on `http://192.168.50.142:8000`, where a service
  worker cannot register at all — and the failure is invisible, because **Safari's own HTTP cache
  re-serves the pages once the Wi-Fi is off.** The offline check passes and proves only that
  Safari has a cache. The server sends `no-store` on everything so the worker is the only thing
  left that can answer, and it refuses to serve the app over its plain-HTTP port at all: that port
  carries the certificate and the setup page and nothing else, since a working HTTP copy beside
  the HTTPS one is how the wrong port gets tested at nine at night.

  `tools/README.md` documents the four ways this fails closed while saying nothing useful —
  chiefly that installing a root on iOS is not trusting it, and that Safari will let you past the
  interstitial to read a page but never to register a service worker.

- **A verification script, and a fence around it.** `tools/verify-shell.mjs` drives the real page
  in headless Edge or Chrome and measures 28 things a stylesheet review gets wrong — rendered
  geometry, resolved styles, focus movement under dispatched input, runtime storage state. It came
  out of a retrospective on WO-1.2 rather than from a Deliverable, after two agents independently
  built the same throwaway harness and discarded it. Zero dependencies, one `.mjs` run by hand,
  per `tools/README.md`.

  It found one thing immediately: eight rules declare `env(safe-area-inset-*)` while `index.html`
  carries no `viewport-fit=cover`, without which iOS resolves every one of them to `0`. That check
  fails on purpose until WO-1.3 owns the fix. Both the implementer and the verifier had marked
  that acceptance line "needs a real iPad" and stopped there, so the iPad pass succeeded by having
  nothing to test.

  `plans/verification-tooling.md` records why it exists and the rules that keep it a script rather
  than a test framework — one file, no config, gates nothing, closes no checklist box and no 👤
  item ever. `tools/README.md` documents four CDP traps that all present as app defects, two of
  which were diagnosed twice by two different agents before being written down.

- **App shell and design frame** (WO-1.2). The suite's visual language, lifted from Roll Call!'s
  `design/starter-template.html` and `design/portable-components.md` rather than designed again:
  two-row navy-gradient header, `#f0f2f5` page, white 14px-radius panels, the wash/strong chip
  grammar, ten-color avatar palette, and the inset toolbar. The modal system — scrim, gradient
  header, `srIn` entrance, Escape and backdrop close, focus trapped and returned to whichever
  control opened it. The save-indicator chip with its five states (saving · saved · error ·
  syncing · retry), driven by a stub until WO-1.4 gives it a store. An `announce()` helper into a
  single `aria-live` region, and the `.sr-only` utility. The `@media (pointer: coarse)` touch pass
  with its 44px floor, plus the 1024px and 640px breakpoints in the order `design/style-guide.md`
  §6 declares them. iOS chrome: viewport `maximum-scale=1.0`, `apple-mobile-web-app-capable`,
  `env(safe-area-inset-*)` padding, `overscroll-behavior-y: contain`, and
  `touch-action: manipulation` on every tappable class.

  `src/` gets its first code: `shell.css`, and the modules `shell.js`, `modal.js`,
  `save-indicator.js`, `live-region.js`, `prefs.js`. Handlers are delegated from declarative
  `data-*` hooks rather than inline `onclick` — an inline attribute evaluates in global scope and
  cannot see an ES module's exports, so Roll Call!'s idiom would throw at click time here.
  `prefs.js` is the only code permitted to touch `localStorage`; it owns the `planbook_` prefix and
  refuses any key not declared as a UI preference, which is what keeps student data in IndexedDB by
  construction rather than by discipline. It declares no keys yet.

  `modal.js` takes its opener explicitly instead of reading `document.activeElement`, because
  Safari — desktop and iPadOS both — does not focus a `<button>` when you tap it, so the inferred
  opener is `<body>` and focus returns nowhere. Roll Call! infers it and gets away with it on
  desktop Chrome. The iPad is the device that decides go-live.

  Roll Call!'s sixth save state, `queued`, is deliberately absent: it means "waiting on the Apps
  Script outbox", and Planbook writes to the device it runs on, so a write that has not landed has
  failed rather than queued.

  Verified on iPadOS 26.5.2, installed to the home screen. One gap found and left for WO-1.3: the
  `env(safe-area-inset-*)` padding is declared but inert, because `index.html` carries no
  `viewport-fit=cover` and iOS resolves every inset to `0` without it.

  `<main>` holds a component shelf rather than a screen — every piece of the frame, so it can be
  seen and touched before there is data. Nothing on it is wired to anything and WO-1.10 replaces it.
  Still deliberately absent: the manifest link and service-worker registration (WO-1.3), IndexedDB
  and the year document (WO-1.4).

- **Repo skeleton and docs spine** (WO-1.1). `git init` with integration branch `main` and the
  first phase branch `phase/1-shell-store-roster` cut from the initial commit. The flat,
  buildless file layout: `index.html`, `sw.js`, and `manifest.webmanifest` at the root, plus
  `src/` and `tools/` beside the existing `design/`, `docs/`, and `plans/`. `TESTING.md`, keyed
  to the roadmap's eight phases with an environment header naming desktop and iPad Safari and a
  slot for the iPadOS version. This changelog. A `.gitignore` covering OS cruft and local
  scratch and nothing from a build, because there is no build — and deliberately *not* ignoring
  `package.json` or `node_modules/`, so that one appearing shows up in `git status` instead of
  being hidden.

  `index.html`, `sw.js`, and `manifest.webmanifest` are placeholders that say so in their own
  first lines: WO-1.2 builds the app shell, WO-1.3 the installable offline app. `src/README.md`
  and `tools/README.md` document what belongs in each directory and set the conventions the rest
  of the repo copies — ES modules with relative paths in `src/`, bare-Node `.mjs` scripts in
  `tools/`, no `package.json` in either.

  No app code and no styling ship with this entry. It is the container.
