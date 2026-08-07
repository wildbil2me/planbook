# WO-2.8 — Hall passes: issue, hold, return · implementation result

**Implementer** Claude (work-order-implementer, Opus) · **Built** 2026-08-06 · **Corrected**
2026-08-07 (correction round 1, resumed after a network outage killed the first attempt mid-flight)

**Verification on the tree as it now stands**

```
node tools/verify-shell.mjs   330 checks · 330 passed · 0 failed · 0 skipped   (was 314 at WO-2.10)
node tools/wo-sweep.mjs        11 checks ·  10 passed · 0 failed · 1 to review
```

`wo-sweep`'s one REVIEW line is the standing sensitive-field-name grep, unchanged by this work order
— still 172 mentions across the same file list as before it.

**Not committed.** The brief did not say to. `CHANGELOG.md` is untouched; a draft entry is at the
bottom for the teacher to accept, edit or discard.

---

## What this round was for

Two defects, both the verifier's. This file is rewritten rather than appended to, so it describes
the corrected tree; the pre-correction claims it used to make about F1 and about WO-2.1's
six-column line were wrong and are gone rather than annotated.

### F1 — the `D` coupling was date-gated on one half only · **fixed and mutation-proved**

`src/attendance.js:927`. The close half was gated to today; the reopen half was not, so unlocking a
past column (a first-class flow from WO-2.1) and tapping yesterday's `D` pushed a **finished** pass
back into `openPasses` with yesterday's `out` stamp — a Return button and a stale clock face beside
a student sitting in the room, one of the class's three slots eaten indefinitely, and the completed
dismissal **deleted** out of the append-only history by an edit made on a later day.

The fix is the one condition the verifier named:

```js
const priorPass = on === todayISO() ? passIdOf(r.marks[studentId]) : '';
```

There is exactly one call site for `passes.reopenPass()` in the app (`grep` confirms:
`src/attendance.js:928`) and it is now behind that gate, matching the close half at line 957.

**What now covers it.** Two new checks in `tools/verify-shell.mjs`, and the second one has teeth:

- *"the fixture for a day rolling over is real: that D cell, passId and all, now sits on the one
  record yesterday has"*
- *"but a D edited on a LATER day does not push its finished pass back into the corridor"*

The day is rolled over **by moving the cell, not the clock**: the dismissal is made today through
the grid exactly as the checks above it do, then that cell — `passId` and all — is lifted onto
yesterday's column with only its `at` re-dated, which is precisely the state midnight leaves it in.
Yesterday's column is then unlocked and tapped through the real ✏ and the real cell.

**Mutation proof.** Reverting the fix to `const priorPass = passIdOf(r.marks[studentId]);` turns
that check **red**, reporting the exact failure the verifier described by reading:

```
FAIL | but a D edited on a LATER day does not push its finished pass back into the corridor
  after the tap on 2026-08-06 the cell held null, 2 pass(es) open (["s_426q552y1d","s_4q6q146i0b"])
  and 1 logged ["return"]; the rewritten cell is {"code":"A"}
```

Two passes open where there should be one, and the dismissal gone from the log. Reverted; green.

### F2 — two ticked human-verified lines that the working tree made false · **annotated, no code**

`plans/work-orders/phase-2-attendance.md:84-85` and `TESTING.md:805-806` (WO-2.1 acceptance line 2,
*"six days of columns … in the orientation the owner actually holds it"*, closed by the owner
2026-08-06). Both are now qualified in place, in the shape `TESTING.md`'s WO-2.10 section used when
it changed the world under WO-2.1's twelve. **No tick pulled, no tick re-applied, and
`dayColumnCount()` is untouched** — the remedy is the owner's call, and I did not make it for her.

I annotated **a third line the verifier did not name**: `TESTING.md:852-853`, the 👤 sitting list's
duplicate of the same claim (*"Six columns and twenty-six names, in the orientation you actually
hold the iPad"*), also ticked. It is the same assertion in the same file and leaving it standing
unqualified would have been the same offence. Flagging it here in case that reads as scope creep.

**The three-option choice now reaches her.** `TESTING.md` § WO-2.8 has a new subsection, *"The day
columns in portrait — the owner's call, and it is open"*, carrying the budget arithmetic
(`viewport − 80px chrome − name column − 160px Passes`, 72px per day column) and this table:

| Name cap | Text before the ellipsis | 768px | 820px Air | 834px 11″ | 1024px 12.9″ | Landscape |
|---|---|---|---|---|---|---|
| **232px** — on disk | ~17 characters | **4** | 4 | 5 | 6 | 6 |
| **~165px** | ~9 characters | **5** | 5 | 5 | 6 | 6 |
| **~95px** | none — avatar and ⋯ only | **6** | 6 | 6 | 6 | 6 |

The five-column row is the option the verifier surfaced and the code comment does not offer; it is
in front of her now. I did **not** narrow it to a single recommendation, because the work order's
own remedy is "an annotation plus the owner's call." Two honest notes went with it: ~165px is below
the `200–256` band `src/attendance.css:526` blesses, so at five columns ordinary surnames start
truncating rather than only the 25-character test name; and the full name stays on the row tooltip
and in what VoiceOver reads at every one of the three.

The 👤 line in `TESTING.md` that used to ask a yes/no now asks for one of three, and says that
answering it is what re-closes WO-2.1's acceptance line 2.

---

## What I kept versus rewrote from the interrupted draft

The outage left an unverified draft on disk. Audited line by line:

| Draft artefact | Verdict |
|---|---|
| `src/attendance.js:927`, the one-condition gate | **Kept unchanged.** Correct, minimal, and it is the fix the verifier specified. Mutation-proved above rather than assumed. |
| `src/attendance.js:898-918`, the comment block on the coupling | **Kept.** It states the rule for both halves, names the failure mode in the mirror direction, and says what a past-dated edit does instead. It matches the file's density and I had nothing to add. |
| `verify-shell.mjs`, *"the fixture for a day rolling over is real…"* | **Rewrote the fixture; kept and extended the prose.** See below — the fixture was broken. |
| `verify-shell.mjs`, *"but a D edited on a LATER day…"* | **Rewrote.** It was the red line, and it was red for a good reason. |

**The bug in the draft's fixture, because it is the interesting part.** It moved the past-dated `D`
by *pushing a new attendance record* onto yesterday. But yesterday is a day this section's own class
was already taken on (the WO-2.1 week fixture takes `thisWeek[1]`), so the push created a
**duplicate `classId`+`date` pair** — and a duplicate is inert: `src/attendance.js:618-620` says in
so many words that *"the first is the one this app reads and the one every write below edits."* The
`D` cell was therefore parked in a record nothing could reach. The tap landed on the pre-existing
record where that student had no entry, read `P`, and walked `P → A → E` — which is exactly the
`{"code":"E"}` in the failure message.

That made the check **red for the wrong reason and vacuous for the right one**: every conjunct about
a pass not reopening was true of a cell nothing had touched, so the check would have gone green
against the *unfixed* app if the cell-code expectation had been relaxed. Weakening the assertion —
the obvious way to green — would have produced a check that could not fail. Rewritten instead:

- the cell moves onto **the record that column already has**, and `records === 1` is asserted, so the
  duplicate mistake cannot recur silently;
- the record's `marks` are captured before and **restored byte for byte** afterward (the draft
  deleted every record for that class+date on cleanup, which would have destroyed a real taken day
  the section had only borrowed);
- the check now opens with `!yGone[outB]` — **the tap landed** — because the two absences after it
  are worth nothing without it. That conjunct is the one the draft was missing, and it is what turns
  "nothing reopened" from a fact about the app into a fact about a cell nobody touched;
- the failure string prints what the cell held after the tap, so the next person to see it red does
  not have to work out which of the two stories they are looking at.

I also left a paragraph in the check's own comment naming the duplicate-record trap, since the next
person to write a past-dated fixture here will reach for the same `push`.

---

## The three fixture blind spots the verifier found by reading

**1. One date — the past-dated `D`.** Closed. That is F1 above, and the check is mutation-proved.

**2. One class — the per-class cap.** Closed, and I judged it in scope: the divergence from Roll
Call!'s global `MAX_ACTIVE_PASSES` is argued at `src/passes.js:81-91` and nothing asserted it. New
check, *"the cap is THIS class's cap: a room that is full leaves the class next door its own
three."* Asked of the screen (every row next door has all three buttons live and no reason line,
while this class is at three) **and** of the two predicates the divergence actually lives in
(`atCap()` and `openPassFor()`), driven through the seam. Nothing is issued in the second class on
purpose — a pass left open there would move the totals every check after it counts.

Mutation-proved twice, one red each, both reverted:

| Mutation | Result |
|---|---|
| `atCap()` counts every open pass instead of this class's | **1 red** — the class next door reads full, and its reason line names the wrong class |
| `openPassFor()` matches on student id without the class | **1 red** — a student out of one room reads as out of the next |

The second of those is the "a student out in two classes at once" half. It is asked of the model
rather than of the screen, and I want to be exact about why: **no student in the run's fixture is on
two rosters**, so there is no row anywhere that could render the failure. Manufacturing one mid-run
would have meant editing a roster that later checks count, and the predicate is where the filter
lives anyway.

**3. `reopenPass()` does not consult `atCap()`.** Behaviour **kept**, reasoning **documented** in
`src/passes.js`'s `reopenPass()` comment, which is what the brief asked for if I kept it. The
sequence is real — three out, one dismissed, a fourth sent, then the dismissal taken back leaves
four open. Refusing the reopen to hold the number at three would mean deleting a true record to
satisfy a limit, and would have the app assert that a child who is out of the room is not; that is
the same sin as the retraction running backwards. The number is allowed over, briefly and visibly
(four Return buttons, all nameable on screen), and comes back under the moment anyone taps Return,
because `openPass()` is still the only door in and it still refuses. **The one obligation this puts
downstream is written into the comment: WO-2.9's banner must count what it finds rather than assume
`MAX_OPEN_PASSES` is a ceiling.** The comment also says plainly that the harness cannot reach this
state, so the paragraph is the record of a choice and not a description of a check.

I did not add a check for it. Reaching four open passes needs a fifth and sixth student cycled
through the `D` in a section whose totals every later assertion depends on, to prove a state that is
correct by design. That is the trade I made; naming it here rather than leaving it implied.

---

## Against the Acceptance list, one by one

### 1. Force-quit and relaunch shows the student still out, with the original time out 👤 — **NOT ticked**

Cannot be ticked: I cannot force-quit an installed PWA from the app switcher. What is verified is
the desk half — the open pass is written into the year document, reaches IndexedDB on the ordinary
debounced save, and is read back **straight out of IndexedDB** (not out of `getDoc()`) after a full
`Page.reload`, with the `out` stamp compared character for character and the row's on-screen clock
face compared too.

The mutation that makes that check mean something: re-implementing open passes as a module variable,
exactly the way Roll Call!'s `activePasses` works, turns **five checks red**, this one reading *"the
record on disk is `[]`"*. Reverted.

A reload is not a force-quit. Blank, and first on the 👤 list in `TESTING.md`.

### 2. Return writes one log entry with the right minutes, and the buttons come back — **ticked**

Driven through the real Return button. *"The right minutes"* needs a manufactured gap and I want
that on the record: every pass this harness issues comes back in under a second, and `0` is what a
broken calculation and a correct one both produce — so the open pass's `out` is wound back seven
minutes through the store (the wind-back is asserted before it is used), and the entry has to carry
`minutes: 7`. Also asserted: exactly one entry, its full key set
(`back,classId,endedBy,id,minutes,out,studentId,type`), `endedBy: "return"`, `openPasses` down by
one, the row's three issue buttons back and enabled, and the reason line gone.

### 3. The fourth concurrent pass is refused with a reason on screen — **ticked**

Three passes issued through real buttons. All 23 remaining rows have all three buttons `disabled`
**and** `#attendancePassNote` is on screen reading *"3 students from Period 3 — Biology are out on a
pass — that is as many as this app will let go at once. Tap Return on one of them before sending
another."* The sentence is asserted, not just the disabled state, because a greyed control with no
sentence anywhere is the dead control the work order names.

Refusal is asserted at **both** writers — `attendance.issuePass()` (where a stale tap arrives) and
`passes.openPass()` (the guard on the document). Deleting the model's guard gives **1 red**.

New this round: the cap is also asserted to be **this class's**, per blind spot 2 above.

### 4. Marking `D` while out leaves no pass open, and undoing the `D` puts it back — **ticked**

This is the line the verifier failed, and it is now true in both directions.

*Same day.* Driven through the **cell**, four taps round the cycle, not through `setMark()` — the
coupling lives in the writer every tap goes through, and a check calling the writer directly would
not notice a grid that stopped reaching it. The cell is read after every tap and asserted to walk
`A+ E+ T+ D-` (code, `+` for still out): only the dismissal closes anything. The closed entry
carries `endedBy: "dismissed"` and the same `out`; the `D` cell is `{code, at, passId}` with
`passId` equal to that entry's id. The undo is one more tap: the pass is open again with the same
`out` and the same id, the log entry is **gone rather than doubled**, and the attendance record is
back to `{}`. Removing the `closePass` call gives **2 red** (`A+ E+ T+ D+`).

*A later day.* The two new checks above. Nothing reopens, nothing is retracted from `passes`, and
the rewritten cell carries a code and nothing else — no `passId`, and no `at`, because a device
clock says nothing about yesterday. Removing the gate gives **1 red**.

### 5. The log is keyed by student id, verified in the document — **ticked**

The student who owns the one logged pass is renamed to "Renamed Afterwards" through the store, the
page is **reloaded** on top of it, and the entry is re-read: same `id`, same `minutes`, same
`out`/`back`, still `studentId === <the id>`. The stronger half: the serialised `passes` +
`openPasses` contain **none of the 32 names in the document**, searched by name rather than by the
fields I happened to think of. The name is put back afterwards.

### 6. Issuing and returning a pass creates no attendance record and changes no mark — **ticked**

Asserted twice — after the issue and after the return — against a baseline captured before the
section: record count unchanged (11 → 11 → 11), the whole-document mark tally unchanged
(`{"T":2,"U":27}` both times), and the row that left the room still reading `P` on today. The
fixture is loud on purpose (the class is genuinely taken with real marks elsewhere), so the silence
beside it means something. Structurally: neither pass hook chains `afterAttendanceChange()`, and
`src/passes.js` cannot reach the attendance array.

### 7. Every pass control clears 44px on a coarse pointer 👤 — **NOT ticked**

The coarse sweep walks every `button, input, select, textarea` inside `#classView` and includes the
pass buttons; 148 controls measured, none under 44px. Two passes are deliberately left open at the
end of the attendance section so that **both** shapes of the column — three issue buttons, and a
Return beside its time — are on screen when that sweep runs, rather than only the empty case.

That is a measurement, not the line. Whether 🚽 and 🏥 can be hit apart at speed by a thumb needs
glass and I have none. Blank, with the reason in `TESTING.md`.

---

## The schema decision the brief left to me (unchanged from the first round)

**Passes do not extend `log`. They get two top-level collections: `openPasses` (state) and `passes`
(history).** Written at length in `src/passes.js`'s header and in `docs/data-model.md` § shape
decisions. The short version:

1. **`log` is the outreach record.** Phase 4's cooldown reads it, the concern rules count behavior
   entries in it, Phase 5's `{{behavior.recent}}` renders it into an email. A pass in there is one
   missing `kind` filter away from "🚽 8 min" going home to a guardian. Same posture as the
   accommodation rules: out of reach by construction, not by remembering.
2. **The fields do not overlap.** A log entry has `audience`/`subject`/`body`; a pass has
   `classId`/`type`/`out`/`back`/`minutes`. One array whose shape depends on its `kind` is the
   polymorphic-cell mistake `docs/data-model.md` already refuses twice, one level up.
3. **Volume.** Thousands of passes a year against a few hundred outreach entries.
4. **Phase 4 and WO-2.9 want passes by name.** A named array is a thing a rule opts into; a `kind`
   inside somebody else's array is a thing every rule has to opt out of.

Set aside: `docs/data-model.md` § log's append-only note cites Roll Call!'s hall passes, which reads
like an invitation to put them there. It is a note about *why the rule exists*, not about where the
data goes, and the new array inherits the rule verbatim.

**The one exception, named because a verifier will find it:** `reopenPass()` **removes** one entry
from `passes` — exactly the entry a dismissal wrote, by its own id, only while it says
`endedBy: "dismissed"`, and only because the dismissal has itself been taken back. Acceptance line 4
requires the undo, and Planbook has no save step for Roll Call!'s `preDismissPass` stash to survive
to. The alternative puts a trip in the history that never happened *and* double-counts the real one.

**Where the link lives:** on the `D` mark cell, as `passId` — one optional field present only on a
`D` that actually closed a pass, because the link must die at exactly the moment the `D` does. **And
it is live only on today's column, in both directions**, which is the F1 correction and is now
stated in `docs/data-model.md`'s mark-cell rule as well as in the code.

**The migration:** `SCHEMA_VERSION` 2 → 3, `MIGRATIONS[2]` one idempotent entry seeding both arrays.
Deleting its body gives **8 red**.

---

## Other decisions this work order did not settle

- **The cap is per class**, not global. Now asserted (blind spot 2).
- **The pass words hide under `(pointer: coarse)`.** Three 44px targets carrying "Bath", "Nurse" and
  "Quick" want ~200px; icon-only wants 148 inside a 160px column, and that 40px is a whole day
  column off the end of an iPad in portrait. The word stays on the accessible name and the tooltip;
  **Return** keeps its word, because there is one of it and it must not be guessed at. On a fine
  pointer both show. On the 👤 list — a taste call made under a width constraint.
- **The Passes column is about *now*, not about a date.** One column, not one per day; it does not
  move with the window and does not lock with a past column. That is what makes the `D` coupling
  today-only, and F1 was the half of that rule the code did not keep.
- **Nothing expires a stale pass.** A pass left open overnight is still open in the morning with its
  original time. Inventing a return time would be the same sin as inventing an `at`. On the 👤 list.
- **The reason line is only up at the cap.** A standing "2 students are out" line is WO-2.9's banner,
  which needs a presentation-mode rule of its own.
- **Convention set:** `src/passes.js` is a pure model — no DOM, no clock, no store. Every writer
  takes the live document and mutates it; `src/attendance.js` owns the `update()`, the clock and the
  announcements. That is what lets the `D` coupling run inside the *same* `update()` as the mark
  that caused it, and why there is no circular import.
- **The harness's attendance section pins its viewport** to 1280×900, because every claim in it is
  about a six-column grid and six columns used to be an accident of the browser's default window.

## Out of scope — temptations declined

- **The elapsed-time banner, overdue alerts, and the pass-history view.** WO-2.9. The data for all
  three is recorded, which was the point of the split. The banner will keep feeling missing.
- **Changing `dayColumnCount()` to get the sixth portrait column back.** The single largest
  temptation this round, and explicitly out: F2's remedy is an annotation and the owner's call. The
  five-column option is costed in `TESTING.md` and not implemented.
- **Presentation-mode handling for the pass column.** WO-2.9 owns it. I did check that nothing here
  puts a name anywhere a name was not already: the cell's `aria-label` names the student whose row
  it is.
- **A pass count on the home card.** Three lines, not asked for, and the banner's job in disguise.
- **A check that drives `reopenPass()` past the cap.** Reasoned about above; documented instead.

## Known gaps I am declaring rather than hiding

- **"Un-confirm everyone" and "Didn't meet" wipe `marks` wholesale**, so a `D` destroyed that way
  takes its `passId` with it and the pass stays logged as a dismissal that can no longer be undone.
  The pass *did* happen and the student *did* leave, so the record is honest; what is lost is the
  undo, on two paths whose stated purpose is discarding the day's marks. Commented at the coupling.
  No check covers it.
- **One flaky red seen once, in the first round.** `no support detail … reached localStorage, and
  every key present is ours` failed while listing only `planbook_` keys — a violation whose own
  evidence shows no violation. It has not recurred in the seven runs of this round. Recording it
  rather than leaving it in a transcript; it smells like `tools/README.md` trap 8's neighbourhood.
- **`src/passes.js` is untracked** (`?? src/passes.js`). It exists on disk and is in `sw.js`'s
  `SHELL` list; nothing is staged, because the brief did not ask for a commit.

## What I could not verify

Everything on the 👤 list in `TESTING.md` § WO-2.8, none of it ticked: the force-quit, the 44px thumb
test, whether three emoji read as three buttons at arm's length, **which of four / five / six day
columns portrait should draw**, whether a stale overnight pass reads as a reminder rather than a
bug, and what VoiceOver says on a Return button. All of them need a real iPad and the owner's eyes.

WO-2.1's acceptance line 2 is also, in effect, unverified again in portrait. It is annotated in both
places rather than pulled, for the reason stated under F2.

## Files changed this round

- `c:\dev\planbook\src\attendance.js` — the F1 gate at line 927 and its comment block (both from the
  interrupted draft, audited and kept).
- `c:\dev\planbook\src\passes.js` — the `atCap()` paragraph in `reopenPass()`'s comment (blind
  spot 3). Behaviour unchanged.
- `c:\dev\planbook\tools\verify-shell.mjs` — the past-dated `D` fixture rewritten and its two checks
  strengthened; the new per-class cap check.
- `c:\dev\planbook\docs\data-model.md` — the `passId` paragraph now states the today-only rule in
  both directions.
- `c:\dev\planbook\TESTING.md` — WO-2.1 acceptance line 2 and its 👤 duplicate qualified; § WO-2.8's
  desk-pass numbers, two new acceptance lines, the seven-row mutation table, the new *"The day
  columns in portrait"* subsection with the three-option table, and the rewritten 👤 line.
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — WO-2.1 acceptance line 2 qualified;
  WO-2.8's status line records the correction round; acceptance line 4 notes both halves are gated
  and measured.

Files changed in the first round and untouched by this one: `src/attendance.css`, `src/store.js`,
`src/shell.js`, `index.html`, `sw.js`.

**Deliberately not touched:** `CHANGELOG.md`, `dayColumnCount()`, and the roadmap's "Hall passes"
box — the maintenance protocol says do not tick a work order that is written but unverified, and
three 👤 lines are open (two of this work order's, one of WO-2.1's).

---

## Draft `CHANGELOG.md` entry — for the teacher to accept, edit or discard

> ### Hall passes
>
> The registry has a **Passes** column. 🚽 Bath · 🏥 Nurse · ⚡ Quick sends a student out in one tap
> and records the time; **Return** brings them back and writes down how long they were gone. Three
> students at a time **per class** — a pass you forgot to close in period 2 does not eat period 3's
> room — and when you are at that limit the buttons grey out and the screen says why.
>
> **An open pass is stored, not remembered.** Close the app, drop the iPad, come back after lunch —
> whoever is out is still out, with the time they left beside their name. Roll Call! forgets its
> open passes the moment it reloads; this one is the reason that could not be copied.
>
> A pass never changes anybody's attendance. A student at the bathroom was present. The one
> exception is a dismissal: marking someone **D** while they are out closes their pass, and taking
> the **D** back opens it again — **today only**. Editing a **D** on a past day leaves the finished
> pass exactly as it is, because yesterday's dismissal says nothing about who is in the corridor now.
>
> *One thing to know:* six days of columns and the new Passes column do not both fit an iPad held
> upright, so portrait now shows four days. Turn it sideways for the full week — or tell me and I
> will trade name-column width back for a fifth or sixth day.
