# WO-2.56 — result

**Implementer:** Claude Opus (work-order-implementer), 2026-09-28. Nothing is committed and no
`wo-gate` command was run. The row is still `🤖 CLAIMED`. Eight of the nine Acceptance boxes are
ticked in `plans/work-orders/phase-2-attendance.md`. The 👤 line is open.

## What was built

- **The unconfirmed note no longer appears.** `paintActions()` draws no note for unconfirmed
  students. The sentence *"12 students have no mark yet, and count as absent until you confirm
  them. Tap a question mark once for present."* now sits on `#attendanceState` as its `title`. The
  same sentence goes into its `aria-label`, after the visible text. The count and the amber wash
  are unchanged, so WO-2.10's "do not make `U` quieter" still holds. The note row is still used for
  did-not-meet, covered, locked past day and off term.
- **The paging, editing and arrival messages are in the state line now, and one function owns it.**
  - `paintActions()` is the only writer of `#attendanceState`, and a comment at the function says so.
  - A new function, `stripPlace(columns, on, summary)`, sits beside `paintBanner()` and writes the
    sentences. The reasoning is in its comment.
  - `paintBanner()` now draws only the rollover band and the off-term band. It never touches the
    state line and it draws no *Back to …* button.
  - Its comment block was rewritten. The one-band-at-a-time precedence argument is replaced by
    ruling 3 and its reason: the messages no longer share a slot, and hiding the rollover when
    paging is defect 2 again.
  - `paintBanner()` lost its `columns` parameter. `paintActions(columns = visibleColumns())` gained
    one, and `renderAttendance()` passes the columns it just drew.
- **The pager.** `paintPager()` draws no range span. `.attendance-pager` has
  `justify-content: flex-end`, and all three `.attendance-pager-range` rules are gone.
- **Styling.** New `.attendance-state.away`: the band's indigo, colours only. The comments at the
  band, the state line, the pager and the coarse `.attendance-banner-btn` rule were rewritten.
- **`index.html`.** The comment at `#attendanceBanner` now says what the band carries, and a comment
  at `#attendanceState` names its one writer.
- **`sw.js`.** `CACHE` goes from `planbook-shell-v144` to `v145`.
- **The fence.** A new section, `tools/verify/strip-holds-still.mjs` (12 call sites, 16 results). It
  is registered in `tools/verify-shell.mjs` right after `calendar-opens-on-day.mjs`.
- **Rewritten harness checks.** Ten checks in four files, all rewritten rather than deleted:
  - `attendance.mjs`: 4 checks, plus one teardown click.
  - `calendar-opens-on-day.mjs`: 3.
  - `portrait-landscape.mjs`: 1.
  - `term-ended.mjs`: 2, plus its header paragraph and the Phase A comment.
  - `register-opens-on-term.mjs` and `today-goes-to-term.mjs` needed nothing. They read only the
    rollover and off-term bands, which did not move.
- **Documentation.** New section `TESTING.md` § WO-2.56. `tools/README.md` has its call-site count
  moved 1561 → 1573, its file count moved seventy-five → seventy-six, and a new ledger paragraph.

## Acceptance, line by line

1. **[x] The fence is green at all three sizes.**
   - **How it measures:** it records document-coordinate rects for `◀ Earlier`, `Today`, `Later ▶`
     and the first grid row, once per size and never re-based. It compares every later reading
     with `===`.
   - **1280×800 (fine pointer) and 1024×768 (touch emulation):** it drives the first tap on a
     student, `◀ Earlier`, `Later ▶`, the ✏ on a past column, `Today`, and all twelve remaining
     `?`s. It reads the rects after every action and after every intermediate tap: 17 readings per
     size.
   - **768×1024 (touch emulation):** 16 readings. It presses the three disabled pager buttons where
     a thumb lands, and does the first and last taps.
   - **No ✏ in portrait.** Portrait draws no past column. The only two ways to stand on a past day
     there (a calendar arrival, a term that has ended) put the strip on a locked day. The ✏ would
     remove that day's note, and that note is Out of scope. I ticked the line on that reading,
     because the ✏ is not an available action in portrait. The check's own label and `TESTING.md`
     both say this.
   - **Guarding against a vacuous pass:** each size has a second check that the actions happened
     (the window paged, the ✏ unlocked, the ledger took 12 then 0 `U`).
   - **Evidence:** the run prints *"17 readings, every one {…}"* at each landscape size and 16 in
     portrait.
2. **[x] Mutation-proved twice, each reverted before anything else was written.**
   - **Mutation 1** (the note un-hidden again in `paintActions()`): `604 · 598 passed · 6 failed`.
     The fence went red at all three sizes. Every rect moved 46px at 1280×800 and 47.5px at both
     iPad sizes.
   - **Mutation 2** (the paging/editing sentence put back into `#attendanceBanner`):
     `603 · 593 · 10 failed`. The fence went red at 1280×800 (~50px) and 1024×768 (55px). The
     rollover check went red too.
   - **Portrait stayed green under mutation 2, and that is correct.** Portrait cannot page and has
     no ✏, so that band never appears there.
   - **How each was reverted:** by exact string. `cmp` then showed the file byte-identical to a copy
     taken before the mutation. The revert came before any other write.
   - **Disclosure:** both mutation runs used a trimmed scratch copy of `verify-shell.mjs`
     (`tools/zz-wo256-quick.mjs`). It held 20 browser sections: the setup sections, every
     attendance section, the four rewritten files, and the fence. It cut the turnaround to about
     four minutes. The fence code in it is identical to the full harness. The file was deleted
     before the sweep ran. None of the full-harness green figures come from it.
3. **[x] Twelve unconfirmed.** After the first tap at 1280×800:
   - text `"12 unconfirmed"`
   - class `attendance-state taken unconfirmed`
   - `title` `"12 students have no mark yet, and count as absent until you confirm them. Tap a question mark once for present."`
   - `aria-label` `"12 unconfirmed. 12 students have …"`
   - `#attendanceNote` hidden (`note:false`).
4. **[x] Paged back.**
   - The state line reads exactly `"Today is not on screen."`, both mid-marking and on a clean
     start. It wears `attendance-state away`.
   - The band is down, and no visible `Back to…` button exists anywhere (`[]`).
   - One `Today` press puts today back as the newest column, the state reads `"Not taken yet"`, and
     `Today` is disabled again.
5. **[x] A past day unlocked.**
   - With `?`s left: `"Editing Thu 9/24 · 3 unconfirmed"`, class `taken unconfirmed`, and the rule
     on its title.
   - After the three `?`s are tapped: `"Editing Thu 9/24 · Taken · all present"`, class `taken`, no
     title and no aria-label.
6. **[x] The rollover band while paged.**
   - Two `◀ Earlier` presses and two `Later ▶` presses leave the band up. Its text and its rect
     (`[40,360.875,1200,47]`) are identical each time.
   - The fence's pager and row rects are identical too.
   - While paged, the state line reads `"Wed 9/23 is not on screen."`.
   - The Switch, pressed from a paged strip, moves the term `tm_wo256a` → `tm_wo256b` and the band
     goes. The check reports a missing Switch rather than throwing, which mutation 2 showed was
     needed.
7. **[x] The pager.**
   - At all three sizes it has exactly the children `BUTTON:earlier BUTTON:today BUTTON:later` and
     zero `.attendance-pager-range`.
   - The gaps between buttons are equal. `Later ▶` ends on the pager's right edge and `◀ Earlier`
     sits in the right half. At 1280 the buttons sit at x 1031 / 1110 / 1175, ending at 1240.
8. **[x] `node tools/verify-shell.mjs` green.**
   - **Delivered tree:** `1588 checks · 1588 passed · 0 failed · 0 skipped`, 50,451 lines, 31.8
     lines per check, 645s, exit 0. I read this summary and the `EXIT=0` line from the log after
     the process exited.
   - **Baseline** (before any change): `1572 · 1572 · 0 · 0`, 614s, exit 0.
   - **`tools/README.md`:** the call-site count went 1561 → 1573, and the new paragraph explains the
     gap widening from −11 to −15 (two in-loop sites over three sizes).
   - **Sweep:** `node tools/wo-sweep.mjs` gives `45 checks · 42 passed · 0 failed · 3 to review`.
     The three REVIEWs are the standing ones: sensitive field names, due dates beside late/missing,
     and the mockup banners. None of my added lines names a sensitive field.
9. **[ ] 👤 iPad, not ticked.** I have no iPad. `CACHE` is bumped to v145, so a force-quit and cold
   relaunch will put this build on the glass.

## Decisions the work order did not settle

- **Which function owns the state line: `paintActions()`.** Both functions are called on every
  write path, in orders that differ by path. So the sentences are composed in `stripPlace()` (next
  to `paintBanner()`, where their reasoning lives) and written only by `paintActions()`. The
  Deliverables' wording is "`paintBanner()` writes … into the state line". I read that as naming
  the move of the messages, not as asking for two writers, which is the Trap. Stated at both
  functions.
- **Date format: `Mon 9/21` for both the editing and the paged line.** It is the column head's own
  numerals with a title-case weekday: a private `lineDate()` beside `numericDate()`. The booking's
  example for the paged line read *"Sep 2 is not on screen."*, but the ruling was "short, numeric
  dates". `Sep 2` above a column printing `9/2` is WO-3.20's two-formats defect.
- **Acceptance 5's second half.** With no `?`s left, the line reads *"Editing <date> · <the day's
  own state>"*, for example *"Editing Thu 9/24 · Taken · all present"*. The day's state is always
  the second half.
- **What the paged line shows: the sentence alone.** It carries no `?` count and no title, in the
  `away` indigo. The day the count would describe is not among the columns, and the owner's reason
  for keeping the state (it describes the day about to be tapped) applies only to an unlocked day.
  An unlocked day wins over paging and keeps its count, per the Trap. The alternative was *"Today
  is not on screen · 12 unconfirmed"*, which keeps WO-2.10's count visible while paged. I declined
  it because it contradicts Acceptance 4's literal text. The owner may prefer it.
- **An arrival (WO-6.5) reads the day's state, then the off-term clause if any, then "Today is not
  on screen" if true.** The parts are joined with ` · `. The old *"Showing …"* prefix and the range
  are gone, because the column heads show the dates.
- **Portrait.** I found no way to do the ✏ in portrait without the locked-day note, which is out of
  scope. Details are under Acceptance 1.
- **A `finally` in the new section** puts back 1280×900 with touch off. `runSection()` contains a
  throw by reloading, which does not reset emulation, so without it the next section would inherit
  a coarse pointer.
- **`aria-label` on a `<p>`.** Done as the Deliverables ask. ARIA 1.2 does not name a plain
  paragraph, so some screen readers will read the text and not the label. The `title` is the part
  that is certain to be reachable. I did not add a `role`, which would have been outside scope.

## Declined as out of scope (noted, not done)

- The direction of the columns against the arrows.
- Any wording or tone change to the rollover or off-term band.
- A height guarantee on the state line such as `nowrap` or an ellipsis. The fence measures that the
  state line keeps one height through every click-driven variant (its rect is printed and
  constant). The only long variant is the calendar arrival with an off-term clause, which appears
  on arrival and never mid-pointer. Truncating a day's state to protect a height nobody is moving
  through seemed worse.

## Mistakes and recoveries worth knowing

- A `sed -i` on `tools/verify/calendar-opens-on-day.mjs` silently rewrote it from CRLF to LF, and
  the substitution itself did not apply.
  - **Recovery:** converted back to CRLF by script and applied the edit in Python.
  - **Verification:** `file` reads CRLF again, and the diffstat is 33 lines, all mine.
- An escaped `\s` inside a template-literal page reader was fixed to `\\s`.
- A backtick in a comment inside a template literal broke `attendance.mjs`'s parse. Caught by
  `node --check` before any run.
- **`grep -rn MUTATION src/ index.html sw.js tools/` was the last check I ran.** It matched only
  existing prose (a `src/shell.js` comment, `tools/README.md` history, three harness comments and a
  `wo-gate.mjs` comment). There are no `/* MUTATION */` markers and no `MUTATION WO-2.56` strings.

## Files changed

- `src/attendance.js`
- `src/attendance.css`
- `index.html`
- `sw.js`
- `tools/verify-shell.mjs`
- `tools/verify/strip-holds-still.mjs` (new)
- `tools/verify/attendance.mjs`
- `tools/verify/calendar-opens-on-day.mjs` (CRLF preserved)
- `tools/verify/portrait-landscape.mjs`
- `tools/verify/term-ended.mjs`
- `tools/README.md`
- `TESTING.md`
- `plans/work-orders/phase-2-attendance.md` (8 boxes ticked; the claim status was already in the tree)
- `.claude/dispatch/WO-2.56-result.md` (this file)

## Draft CHANGELOG entry (for the teacher to decide on; not landed)

### Nothing above the attendance grid moves while you mark — 2026-09-28

Three things above the attendance grid used to jump under your finger.

- **The first tap no longer pushes the grid down.** The first tap on a student opened a sentence
  about unconfirmed students counting as absent, which pushed every row down. That sentence is now
  the state line's tooltip. The count and the amber colour are unchanged, and a question mark still
  counts as absent until you tap it.
- **Paging no longer moves the pager.** Pressing ◀ Earlier opened a band above the state line,
  which pushed the pager down under your next click, and the band's own *Back to today* button
  duplicated `Today`. Now the state line itself says *Today is not on screen.*, at the same size and
  with no button.
- **An unlocked past day keeps its count.** The state line reads *Editing Mon 9/21 · 3 unconfirmed*,
  so that day's question marks stay visible.
- **The term-rollover band stays up while you page.** The band saying today is in another term no
  longer disappears when you page back, and its Switch button still works.
- **The pager's buttons sit together.** ◀ Earlier, Today and Later ▶ are grouped at the right, and
  the date range between them is gone, since every column already shows its date.

(WO-2.56. Harness green at 1588/1588. A new check measures the pager and the first row to the pixel
across the first tap, paging, unlocking, Today and the last question mark, at laptop, iPad landscape
and iPad portrait sizes. The iPad reading is still owed.)
