# WO-2.9 — Pass banner, overdue alerts, and history · implementation result

**Implementer** Claude (work-order-implementer), Opus tier
**Date** 2026-08-13
**Work order** `plans/work-orders/phase-2-attendance.md:537`
**Status left on the work order** `🤖 CLAIMED — 2026-08-13`, deliberately unchanged — see
*"What I did not do"* at the foot.

---

## The two commands, from output I read

```
node tools/verify-shell.mjs     732 checks · 732 passed · 0 failed · 0 skipped
                                18,772 lines · 25.6 lines per check · 242s      exit 0

node tools/wo-sweep.mjs         17 checks · 15 passed · 0 failed · 2 to review  exit 0
```

Both were run to completion on the **shipped tree** — that is, after the last source edit and after
the line-ending repair described below — and both numbers are quoted from the summary block I read,
not predicted. The harness ran five times in total during this dispatch: one red (2 failed, both my
own new checks, both fixed), four mutation runs, and two green. The sweep's two REVIEWs are the
standing pair; `src/pass-history.js` now appears in the sensitive-field-name REVIEW list, on its
**header prose** alone (the header explains why it is not part of `src/attendance-report.js` and
names `supports`). It holds no path to `student.supports`, imports nothing that could produce one,
and emits to no merge field, export, print surface or log line.

---

## Against the Acceptance list, one by one

### 1. `- [ ]` Elapsed time is correct after the app has been backgrounded for ten minutes. 👤

**Left blank. I cannot close it and did not tick it.** Ten minutes of a real suspended, installed
PWA is not something a headless browser has; nothing has ever suspended one.

**Desk-side evidence I do have**, and it is the strongest shape a desk allows:

- The figure is a subtraction, by construction. `src/passes.js`'s `elapsedSeconds(out, now)` takes
  `now` as an **argument** — the module keeps no counter, no interval and nothing between two calls.
- The harness winds the stored `out` **41 minutes into the past through the store**, with no
  repaint, on a card that has been on screen for about a second, and then asks what the next paint
  says. It reads `41:0x`. A build that accumulated ticks would read `0:0x` after the same fixture —
  and does: mutating the figure into a per-tick counter turns **6 checks red**, the first of them
  reporting `the card now reads "0:02"`.
- The path back onto the screen is the real one: a `visibilitychange` on `document`, dispatched
  rather than simulated by a hand render, with `document.visibilityState` asserted `visible` first
  so the reading cannot be vacuous.
- The card is **patched, not rebuilt** — asserted by a sentinel attribute on the card element and by
  a half-typed note surviving in the field. That is what protects the note field's caret from a
  once-a-second repaint.

What is owed to the iPad is in `TESTING.md` § WO-2.9 as six 👤 lines, the first of which is this
acceptance line in the owner's own terms (issue a pass, leave the app for ten minutes, come back).

### 2. `- [x]` Both alerts fire once each, not repeatedly, and not again after the student returns

All three clauses are measured, and they are three separate checks:

- **Once each** — the level that has fired is `alerted: 1|2` on the open pass, in the year document.
  `markAlerted()` refuses anything that is not an increase, so the model decides rather than the
  renderer. Measured at five minutes (level 1, card amber, "…for 5 minutes.") and at ten (level 2,
  card red, "…for 10 minutes.").
- **Not repeatedly** — the live region is cleared to a sentinel, three seconds of ticks go by over a
  pass 41 minutes past both thresholds, and the sentinel is still there. Mutating the renderer to
  fire off elapsed time instead of off the stored level turns **2 red**.
- **Not again after the student returns** — the student comes back and goes straight out again: the
  new pass carries **no `alerted` key at all**, its card is at level 0, and the finished entry in
  `passes` has the same key set it had before this work order (`alerted` never crosses into
  history — `closePass()` builds its entry field by field).

One behaviour the work order did not specify and I decided: a trip that crossed **both** thresholds
while nothing was running (a suspended device) escalates **straight to the second alert** — one
announcement, not two. That is what "escalating" means; a teacher coming back to a student 41
minutes gone should not be told about five minutes first. Asserted as its own check, including that
neither "for 5 minutes" nor "for 10 minutes" appears in a sentence that says 41.

### 3. `- [x]` The history view's totals match the log; a hand count of one student's passes agrees

- The class summary's per-student rows **and** the class total under them are compared against a
  tally computed **in Node**, off `doc.passes` read from the document — not against the app's own
  `tallyPasses()`, which would be the dialog agreeing with the module that drew it. On the shipped
  run: 7 trips across 4 students, footer `["3","2","2","7","58"]` against `[3,2,2,7,58]`, every row
  agreeing, and the subtitle carrying the same two numbers in words.
- The hand count of one student: the busiest student's rows are one per trip, each carrying the
  **stored** `minutes`, with a dismissal marked as one rather than reading "back after 4 minutes".
- A second check covers the note row, because the busiest student had none and that clause was
  **true and vacuous** on the first green run — it picks the student who does have one and asserts
  `Note: walked down to the office` under the trip it belongs to.

### 4. `- [x]` A cancelled pass appears in no history view and in no total

Measured as a before-and-after over the **whole dialog**: a trip is issued, noted with a phrase
nothing else in the document uses, seen on the card and in the serialised document, and cancelled.
The dialog's rows, footer and subtitle come back identical and the phrase is nowhere in it.

It is free by construction rather than by a filter — `passesFor()` reads `passes` and nothing else —
and that is exactly why it needed a check rather than an argument. Mutating `cancelPass()` into a
zero-minute return (WO-2.11's forbidden defect) turns **5 red**: four of WO-2.11's own and this one,
which reports the cancelled student gaining a row and the footer going from 10 trips to 11.

### 5. `- [x]` Presentation mode suppresses names in the history view

- Flipped with the **real header control**. With the mode off the dialog names 4 of the 58 name
  forms in the document; with it on it names **0**, draws **0** doors into a student, and carries a
  strip saying why. The counts stay — see the decision note below.
- The guard is in the module, not in the absent button: `openStudentPasses()` called through the
  seam under presentation mode draws no table and names nobody.
- The mode-off pass is asserted **first**, and flipping back off brings the same names and the same
  doors back to the same open dialog — otherwise every absence above would be a screen that cannot
  draw.
- Mutating `src/pass-history.js` to stop asking `presentationMode()` turns **1 red**, naming the
  four names it put on the projected dialog.

---

## Mutation proofs (all four reverted; the green run above is the shipped tree)

| Mutation | Result |
|---|---|
| the elapsed figure accumulates a per-tick count instead of subtracting from the stamp | **6 red** |
| alerts fire off elapsed time (`level > 0`) rather than off the level stored on the pass | **2 red** |
| `cancelPass()` writes a zero-minute return | **5 red** (4 of them WO-2.11's, 1 mine) |
| `pass-history.js` stops asking `presentationMode()` for names | **1 red** |

---

## What I could not verify

- **Acceptance line 1** — above. Needs a real iPad and a real suspend.
- **Everything a thumb decides.** The 44px rules are in the `@media (pointer: coarse)` block in the
  same pass that added the controls, and the harness measures the card row at three cards in both
  orientations (still one row, figure at 52px, no spill). Whether the 🚪 Passes door — now the
  **sixth** control in that toolbar row — spills through its own border on the owner's own device is
  a 👤 line; the harness's general coarse sweep measures that row, but the "Days off" scar says the
  device is what settles it.
- **Whether the two overdue colours read from across a classroom.** Amber then red, at the style
  guide's warning and danger tones, mixed into the dark card at alpha. A laptop screen is not the
  room.
- **VoiceOver.** The elapsed figure is `aria-hidden` (the Return button beside it carries the time
  out in full) and the alert reaches a screen reader as a sentence. Neither is verified on a device.

All six of those are written down as 👤 lines in `TESTING.md` § WO-2.9.

---

## Decisions the work order did not settle

1. **The two thresholds are constants, not preferences.** The deliverable says "per Roll Call!'s
   configurable `alertOneMin` / `alertTwoMin`". Over there they are two fields on a settings dialog;
   **this app has no settings surface at all**, so a preference key nothing can move would be a
   preference that exists to be read. `ALERT_ONE_MIN = 5` / `ALERT_TWO_MIN = 10` live in
   `src/passes.js` with a comment saying where they go when a settings screen arrives (`src/prefs.js`,
   as a UI preference — a fact about the browser, never about a student) and that nothing else has to
   change, because every reader asks `alertLevelFor()` rather than the numbers. **If the owner wants
   them configurable now, that is a small follow-up and not a re-cut.**
2. **Fired-ness is a field on the open pass (`alerted`), in the year document** — not a module
   variable. Roll Call! keeps it in memory; here that would mean a relaunched force-quit app
   re-alarming about a student the teacher already knows about, which is the same inversion WO-2.8
   made about the pass itself. One number rather than Roll Call!'s `{five, ten}` booleans, because
   those key names bake the default minutes into the schema. Documented in `docs/data-model.md`.
3. **The history is a new module, `src/pass-history.js`**, not a section of
   `src/attendance-report.js`. That file's header promises it never imports `src/supports.js` and has
   no path to a student's `supports` block; this surface has to ask about presentation mode, so
   putting it there would mean writing that promise directly above the import.
4. **It asks `presentationMode()`, not `supportsVisible()`** — the same switch, from the same module,
   read through the accessor that matches the question. `supportsVisible()` asks whether a *support
   field* may be drawn; nothing here is one. Both the header and the report say so because a cold
   reader greps for `supportsVisible`. (The sweep still lists this file under "the support-visibility
   rule … asked by 3 other file(s)", on the header's prose.)
5. **Presentation mode hides the names and keeps the counts.** `src/accommodation-prompt.js` paints
   *nothing* in that mode — not even a count — because a count about a legally protected category
   narrows to individuals. A bathroom trip is not that, and the acceptance line asks for names to be
   suppressed rather than for the view to go dark. The per-student view is the exception: it is
   *about* one person, so it refuses entirely and offers the way back to the class summary.
6. **The history is not scoped to the open term.** A pass has a stamp and no term id, and scoping it
   would mean this file inventing a second date-window rule beside the one `src/attendance.js` owns.
   The dialog says what it holds in words and the date span is in the subtitle. Worth the owner's
   opinion; it is a small change if she wants the term.
7. **Alerts are scoped to the class on screen**, like the banner. WO-2.11 leaves the cross-class case
   to "WO-2.9's overdue alerts, if it ever wants one" — I did not walk through that door: an alert
   naming a period-2 student in the middle of period 3 offers no card, no Return and no way to act.
   The reasoning is a comment at `paintPassElapsed()`. Proposed as a follow-up below.
8. **The alert is visible and spoken, never a sound.** Roll Call!'s alerts are two AudioContext tone
   sequences and its card never changes; this app has no audio anywhere, and a first one here would
   be a feature of its own with an iOS gesture-unlock problem attached. So the card escalates (the
   departure is commented at the point of departure in `src/attendance.css`) and the live region
   carries a sentence. The colour is not the only channel: the figure beside it reads `5:02` and
   then `10:14`.
9. **The announcement says how long it really has been**, not which threshold was crossed. Roll Call!
   announces `config.alertOneMin` minutes; that rule would say "ten" about a student nineteen minutes
   gone, which is the elapsed-time trap arriving in the words instead of in the figure.
10. **A `**Closes roadmap**` field was added to WO-2.9.** The roadmap box "Overdue alerts, the
    elapsed clock, and pass history" has existed since the Ship 1 cut and no work order named it, so
    nothing would ever have ticked it. `node tools/wo-gate.mjs --audit` resolves it to exactly one
    box and stays green.

---

## Proposed follow-ups (noted, not acted on)

- **A cross-class overdue alert**, with a surface of its own. The residual case WO-2.11 named and
  this work order declined: a pass forgotten in period 2 is still open in period 3, and today only
  its own class's registry says so.
- **The two thresholds as real preferences**, when a settings surface exists (decision 1).
- **Does the clock's arrival change WO-2.11's "the banner is deliberately not presentation-gated"
  decision?** I did not touch it, as instructed. My honest reading: it does not. The clock adds no
  name and no health-adjacent word to the card; what the banner shows in presentation mode is exactly
  what it showed before, one figure louder. The residual case is unchanged and is still the one
  WO-2.11 wrote down (a stale pass open at a 6pm conference). **If the owner ever wants it gated, it
  is three lines and one `presentationMode()` call — but it is a work order, because it reverses a
  recorded decision.**
- **Term scoping for the history** (decision 6), if the owner wants it.
- **A print or CSV of the pass history.** Deliberately absent — WO-2.9 asks for a view, and the two
  print surfaces this screen already has each carry their own gate attribute. A third would be a
  third gate.

## Out-of-scope temptations I declined

- Putting the elapsed figure on the **row's** pass cell as well. The column is 160px and a figure
  changing every second beside a Return button is movement under a thumb aiming at it.
- "Fixing" WO-2.11's presentation-mode decision (above).
- Expiring or auto-closing a stale pass. WO-2.8 forbids it by name; my alerts notify and close
  nothing.
- A settings dialog for the thresholds (decision 1).

---

## Files changed

Modified:
- `c:\dev\planbook\src\passes.js` — `ALERT_ONE_MIN` / `ALERT_TWO_MIN`, `elapsedSeconds()`,
  `alertLevelFor()`, `alertedLevel()`, `markAlerted()`, and the history readers `passesFor()`,
  `passesForStudent()`, `passDate()`, `tallyPasses()`.
- `c:\dev\planbook\src\attendance.js` — `elapsedText()`, the elapsed span on the banner card,
  `paintPassElapsed()` with the two alerts, the one-second clock started and stopped by
  `paintPassBanner()`, a `visibilitychange` listener, and `clockTime()` exported for the new module.
- `c:\dev\planbook\src\attendance.css` — the elapsed figure's live rules, the two overdue card
  states, the pass-history dialog's own selectors, and every one of them named in the
  `@media (pointer: coarse)` block in the same pass.
- `c:\dev\planbook\src\shell.js` — the import, the three delegated hooks, and the seam entry.
- `c:\dev\planbook\index.html` — the 🚪 Passes door in the registry toolbar and `#passHistoryModal`.
- `c:\dev\planbook\sw.js` — `./src/pass-history.js` added to `SHELL`, `CACHE` bumped to
  `planbook-shell-v54`.
- `c:\dev\planbook\docs\data-model.md` — the `alerted` field on `openPasses`, why it never crosses
  into `passes`, and that elapsed time is stored nowhere at all.
- `c:\dev\planbook\tools\verify-shell.mjs` — 17 new `check()` call sites (16 in a new section, 1 in
  the pass-card sweep's two-orientation loop) plus three new fields on the shared reader.
- `c:\dev\planbook\tools\README.md` — the recorded call-site count 717 → 734, with the WO-2.9
  paragraph the sweep's count check reads.
- `c:\dev\planbook\TESTING.md` — a new § WO-2.9 with the desk lines, the mutation table and six 👤
  lines.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — the build note, four acceptance boxes
  ticked with their evidence, acceptance line 1 left `- [ ]`, and the `**Closes roadmap**` field.

Added:
- `c:\dev\planbook\src\pass-history.js` — the dialog: the class summary, one student's trips, and
  the presentation-mode rule.

## What I did not do

- **Did not tick acceptance line 1**, and did not tick any 👤 line in `TESTING.md`.
- **Did not write `CHANGELOG.md`.** A draft, for the teacher to accept, reject or rewrite:
  > **Hall passes now show how long a student has been gone**, counting from the time they left
  > rather than from a timer — so it is still right after the iPad has been in a bag for ten
  > minutes. The card turns amber at five minutes and red at ten, and says so once each. And
  > **🚪 Passes** in the registry toolbar opens the record: who has been out of this room, how often
  > and for how long, and one tap further in, one student's own trips with their times and any note
  > you typed. Names on that screen disappear in presentation mode.
- **Did not change the work order's status line.** It reads `🤖 CLAIMED — 2026-08-13`. `--tick`
  writes `🔨 IN PROGRESS`, which per `tools/README.md` means "part-built, nobody in flight" — and
  something is in flight until the orchestrator releases this claim. That call is the orchestrator's.
- **Did not commit or push.** The brief did not say to.

## One thing I broke and fixed, worth knowing

Four files were edited with a Python one-liner and came back **CRLF** — `TESTING.md`, `sw.js`,
`tools/README.md` and `tools/verify-shell.mjs` — which turned a 500-line diff into a 25,000-line one
without changing a character of content. Caught with `git diff --stat` before reporting, repaired by
converting back to LF, and both tools re-run green afterwards on the repaired tree. If a future
dispatch sees an implausible diffstat, this is the first thing to check.
