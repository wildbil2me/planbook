# WO-1.71 — result

**Status: built and green. Seven of eight Acceptance lines ticked; the 👤 line is open.**
Nothing committed. No `MUTATION` was ever inserted (`git diff | grep '^+' | grep MUTATION` finds one
line, and it is prose in TESTING.md saying so).

## Acceptance, line by line

1. **Top row / second row / orange rule — ticked.** `tools/verify/settings-hub.mjs`: top row
   `["backup","presentationBtn","yearButton","aboutBtn"]` with no sync opt-in, 0 sound controls and
   0 old icons in the header, second row ends in exactly `settingsBtn` (title and aria-label
   "Settings"). Rule read as 2px solid rgb(230,126,34) on homeView, classView, assignmentsView,
   scoresView, calendarView, signalsView; `.modal-panel` and `.modal-header` of open Settings have 0px
   bottom border. Sync on an opted-in device: `sync-button.mjs` now asserts the whole iPad-width row
   `["backup","syncBtn","presentationBtn","yearButton","aboutBtn"]` in all six states.
2. **Doors — ticked.** Roster → rosterModal, Classes and terms → classesModal, Your details →
   teacherModal, Message templates → templatesView with nothing open; Settings shut each time. After ✕
   on the roster, focus is on `settingsBtn` (the Traps line). `modal.mjs` now uses gear→door as its
   second opener and its two focus-return checks pass against the gear.
3. **Roster door names the resolved class — ticked.** Inside English III, from All classes (last
   visited), and with a stale `openClassId` (door, resolver and roster dialog all say
   "Period 3 — Biology"). The door asks `classes.getSelectedClass()` only.
4. **Switch — ticked.** Real taps on the row: on → off (announced) → on → reload → off → reload, and
   switch, `soundsOn()` and `planbook_alertSoundOn` agree at all five readings. Sound-off-still-
   announced-and-tinted is `attendance-passes.mjs` § THE OFF SWITCH, now driven through this switch;
   both its checks pass.
5. **390×844 coarse — ticked.** No overflow and nothing under 44px on home and class view, Settings
   shut and open (6/12/16/22 controls measured). The touch-targets roster block, which would have
   skipped silently once the header icon went, now gates on the door and measured 94 controls.
6. **Tools pass, CACHE bumped — ticked.** `node tools/verify-shell.mjs`: exit 0,
   `1927 checks · 1927 passed · 0 failed · 0 skipped`, 61,366 lines, 934s (I waited for the exit and
   read the summary). `node tools/wo-sweep.mjs`: exit 0, `50 checks · 46 passed · 0 failed · 4 to
   review`. The fourth REVIEW is new and belongs to this work order: ten new non-target classes
   (`.hub-door-icon`, `.toggle-track` and so on) are not named in the coarse block. I read them and
   confirmed they are not targets; their containers `.hub-door`/`.hub-pref` are. That check diffs
   against HEAD, so it goes quiet at commit. `sw.js` v178 → v179.
7. **TESTING.md § WO-1.71 — ticked.** Under Phase 1, after WO-1.70.
8. **👤 iPad — not ticked.** It needs the device.

## What I could not verify / what is owed
- Nothing headless can close line 8: both rows, the orange rule, and the switch under a real thumb,
  upright and lying down.
- **No mutation round.** Each full harness run took about 15 minutes and the window was tight, so no
  check in `settings-hub.mjs` has been proved non-vacuous with a planted fault. What the first run
  did prove: `focus-ring.mjs` refused my first switch focus ring, and the new rule check went red on
  its own fixture bug (it called the home view `home`), which I fixed.

## Decisions the work order didn't settle
- **The switch's input departs from Roll Call!.** Lifted as written (0x0, opacity 0), the app's one
  global `:focus-visible` ring drew nothing on it. A second ring on the track was refused by
  `focus-ring.mjs` ("exactly one :focus-visible rule"). So the input sits over the track, made
  invisible with `appearance: none` and a transparent fill rather than opacity, and the one ring
  lands around the track. The comment at the point of departure explains this, and so do the mockup
  banner and the README.
- **Focus after a door:** `leaveSettings()` closes the hub with `closeModal` and passes the gear on as
  the opener. Anything outside the hub (the + tab, the empty state, a harness `.click()`) is routed
  exactly as before.
- **The roster hint with no class at all** reads "Students, guardians and supports" and names no
  class (frame F option 1's wording). The work order didn't say.
- **640px-block departures left alone.** The divider is still hidden and the term-nav floor is still
  64px at phone width, though three of the four icons they paid for are gone. A comment there says
  so. Re-spacing the row is WO-1.73's measurement.
- **`.header-actions` coarse gap (6px) left alone**, for the same reason and with a comment.
- **WO-7.5 ruling 3** ("last before About") is recorded as replaced in `src/sync-button.js`'s header
  comment and in index.html. Only comments changed in that file.

## Out-of-scope notes
- Some index.html comments still justify an older layout ("a fourth control there overflows", ~2776
  and ~3028, the letter-scale and signals doors). They are historical reasons, not claims about
  today, so I left them. One present-tense claim (~836, the screen-nav note) I amended.
- No "‹ Settings" back button (WO-1.72) and no roster-row change (WO-1.74).

## Files changed
- `index.html`, `src/shell.js`, `src/shell.css`, `src/alert-sound.js`, `src/sync-button.js` (comment only), `sw.js`
- `tools/verify-shell.mjs` (the `openSettingsDoor()` helper, section registration)
- `tools/verify/settings-hub.mjs` (new)
- `tools/verify/`: assignments, attendance-passes, attendance, categories-weights, category-removal,
  classes-terms, contacts-import, copy-class, grading-mode, letter-grades, log-entries, modal,
  points-grade, roster-contacts, score-grid, signal-engine, support-details, sync-button, templates,
  touch-targets
- `tools/README.md` (call sites 1914 → 1923, plus a run paragraph)
- `design/mockups/proposed-settings.css`, `design/mockups/README.md`, `design/mockups/index.html`
- `TESTING.md`, `plans/work-orders/phase-1-shell-store-roster.md` (7 boxes ticked; status left 🤖 CLAIMED)
- A line-ending scar caught and reverted: a `sed -i` over `tools/verify/*.mjs` stripped the CRLFs from
  `calendar-opens-on-day.mjs` (668-line diff). I restored it with `git checkout`, since I had made no
  intended change there, and checked every other changed file for CR-count drift against HEAD: none.

## CHANGELOG draft (the teacher decides)
WO-1.71, owner-directed, from `design/mockups/settings-hub.html`. Shell cache v178 → v179.
- The header keeps what is used in class: Backup · Sync · Presentation · Year · About on top, and the
  class tabs, terms and one gear below. Roll Call!'s orange rule now runs under the header on every
  screen.
- The gear opens Settings: Roster and contacts (naming the class it will open on), Classes and terms,
  Message templates, Your details (now with a person icon), and Sound alerts as a switch. The + tab
  still adds a class in one tap.
- The sound control left the header, so a silenced device no longer shows it at a glance. An overdue
  pass is still announced and still tints its card.
