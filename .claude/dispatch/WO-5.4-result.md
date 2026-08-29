# WO-5.4 — Contact log & history — verification

**Verifier, cold.** Read the work order fresh from `plans/work-orders/phase-5-outreach.md:402`, the
brief from `.claude/dispatch/WO-5.4-brief.md`, and the delivered tree. The implementer wrote no
result file — the dispatch died at the handoff back — so nothing below is taken from prose. Every
command in this file was run by me in this sitting.

## Verdict

**PASS** — all five Acceptance lines verified, nothing outstanding in the sweep, no item needing a
human.

The five lines are tickable. **Maintenance is owed in full** and is listed at the foot; the
implementer never reached its doc pass.

---

## Mechanical pass

    $ node tools/wo-sweep.mjs
    34 checks · 31 passed · 0 failed · 3 to review

Matches the pre-dispatch baseline. The three REVIEW lines, read:

- **sensitive field names outside `src/backup.js`** — 418 mentions across 38 files. The list gained
  exactly one file for this work order: `src/contact-history.js`. Its single hit is prose —
  `src/contact-history.js:41`, "src/supports.js's logKindVisible() rounds a `contact` toward
  hiding". A case-insensitive grep for medical / accommodat / behaviorPlan / caseManager /
  reviewDate / iep / 504 over that file returns nothing else. It emits no support field to a merge
  field, export, print surface or log line. Not a finding.
- **due-date and late/missing on the same line** — unchanged file set (`src/detail.js:460`,
  `src/grades-report.js:520`, `src/past-due.js` x3, +3). No WO-5.4 file is on it. Not a finding.
- **a mockup banner and the build disagree** — pre-existing (`proposed-phase6.css:126`,
  `proposed.css:51`). Untouched by this work order. Not a finding.

<!-- -->

    $ node tools/verify-shell.mjs
    1282 checks · 1282 passed · 0 failed · 0 skipped
    38,751 lines · 30.2 lines per check · 428s

**Zero skips**, which matters here: the whole WO-5.4 section sits behind an `if (!seam) skip(...)`,
so a missing `window.planbook` would have turned seventeen checks into one silent SKIP and left a
green run meaning nothing. It did not.

    $ node tools/wo-gate.mjs WO-5.4
    PASS | gates clear for WO-5.4

Two notes on it that are true and are not failures: WO-4.5 is IN PROGRESS with both open lines 📆,
so it is code-complete and does not gate; and the row still reads 🤖 CLAIMED with a brief, no result
and a dirty tree — the interrupted-draft shape, which is the situation I was given.

**`grep -rn MUTATION src/ tools/ index.html sw.js` — run by me.** Ten hits, every one pre-existing
prose already in HEAD (`src/shell.js:774`, `tools/README.md` x2,
`tools/verify/keys-legend-guards.mjs` x4, `tools/verify/outreach.mjs:786`,
`tools/verify/score-grid.mjs:1674`, `tools/wo-gate.mjs:1996`). **No live mutation survives in the
delivered tree.**

### The reverted mutation, re-derived rather than taken on trust

`src/outreach-view.js:1096` now reads `ruleId: hit ? hit.ruleId : '',`. That is the correct
expression, and here is the derivation, independent of anyone's account of it:

- `hitFor()` (`src/outreach-view.js:270`) returns `orderHits(...)[0] || null` — **it can return
  null**, so a bare `hit.ruleId` would throw and `hit && hit.ruleId` would write `undefined` where
  the record wants a string. The ternary is the shape the null demands.
- `hit.ruleId` is `src/signals.js`'s own vocabulary — `grade-below`, `missing-count`, `grade-rose`
  (`src/signals.js:202-268`). `lastContactAbout()` (`src/log.js:423-432`) matches on that string
  exactly and **returns null for an empty rule**, and the cooldown calls it as
  `lastContactAbout(doc, hit.studentId, hit.ruleId, through)` (`src/signals.js:1806`). So
  `ruleId: ''` would have made every contact the app writes silence nothing — Acceptance line 2 dead
  in silence, with the harness the only thing able to see it.
- The same call is what the draft *speaks* from: `hit: hitFor(tone === 'praise' ? 'praise' :
  'concern')` at `src/outreach-view.js:765`, handed to `resolveDraft()`. One call, one signal, so the
  message and the suppression cannot disagree about which rule they are about.

**The mutation was catchable and the checks bite.** `tools/verify/contact-log.mjs:290` asserts
`handoff.entry.ruleId === before.led`, where `before.led` is proved non-empty one check earlier
(`before.concern.length === 2`), and `:401` asserts `cooled.held.ruleId === before.led`. Both go red
on an empty string. I did **not** re-plant it: the tree holds 21 uncommitted paths and a
`git checkout` revert would have taken the work order with it.

---

## The five Acceptance lines

### 1. A contact appears in the student's history immediately after handoff. — VERIFIED

Verified on both surfaces, on the run above.

- Signal card, patched in place, card still open, no reload:
  `PASS | the contact is in the history IMMEDIATELY … :: [{"kind":"Guardian","subject":"Wo54SubjectLine — WO-5.4 Contact log","when":"Aug 29","why":"Missing assignments"}]`
- Student record, as the last card in the column:
  `PASS | … the cards down the column are ["Where the grade comes from","Missing work · 30 points at stake","Attendance · No recorded meetings","Hall passes · none","What you have written down","Who you have written to"]; the card drew 1 row(s) and 0 control(s)`
- The write itself: `PASS | pressing the handoff appends exactly ONE entry … keys ["id","studentId","at","kind","audience","subject","body","ruleId"], at "2026-08-29T14:12:33-04:00"`, rev 277 → 278.

The mechanism is `src/shell.js:2666` → `outreachView.recordHandoff()` → `afterContactLogged()`
(`src/shell.js:1405`), which calls `contactHistory.refreshContactSection()` and re-renders detail,
signals and home. `refreshContactSection()` (`src/contact-history.js:232`) replaces **only the
list** — correct, and for a reason I checked rather than accepted: the contact just written
suppresses the row the card was opened from, so a rebuild would empty the card at the exact moment
the feature worked.

### 2. The logged rule id is what WO-4.5's cooldown matches on, and suppression follows. — VERIFIED

`PASS | the cooldown reads the id that was logged, and suppression FOLLOWS from the handoff alone …
:: her row now holds ["grade-below","grade-rose"] and the cooldown is holding "missing-count";
1 suppressed, 1 row(s) drawn`

`PASS | and the suppressed row is COUNTED and says which contact silenced it ::
{"ruleId":"missing-count","on":"2026-08-29","audience":"guardian","until":"2026-09-12","days":0,"span":14}
:: the foot reads "1 you wrote about recently · show it"`

The contract is one string end to end: `hit.ruleId` (`src/signals.js`) → `newContactEntry()`
(`src/log.js:229`) → `lastContactAbout()` (`src/log.js:427`) → `src/signals.js:1806`. No mapping and
no second vocabulary, and `docs/data-model.md` now says so.

### 3. Log entries are never edited or deleted. — VERIFIED

Three independent readings, two of them structural:

- Driven: `PASS | a second handoff APPENDS: the first entry is still in the document byte for byte …
  :: the log went 1 → 2`, with the two JSON records printed identical in the output.
- Source, over `src/log.js`: `PASS | append-only is structural rather than promised: both writers …
  do exactly one thing to the document — two appends, one per writer, and no third`. This is
  `tools/verify/log-entries.mjs:388`, and it is an **equality** (`pushes === 2`), updated from
  `=== 1` rather than loosened to `<=`. I checked the operator, because that is the shape a check
  edited down to fit takes.
- By hand: `writeContact()` (`src/log.js:246`) holds one `push` inside one `update()` — no id lookup,
  no splice/pop/shift/delete, no `correctsId`. `newLogEntry()` is byte-unchanged; it appears in no
  hunk of the `src/log.js` diff.

### 4. The UI is honest about what "logged" means. — VERIFIED

`PASS | the UI is honest about what "logged" means, in both places it can be read (Acceptance line
4) :: "Newest first. Planbook records the moment you handed a message to your mail app — it cannot
tell whether you sent it from there, so this is what you wrote and when, not proof of delivery.
Entries are never edited or deleted."`

Four places carry it, and I read each in the file:

- `index.html:2680` — beside the button: "…It also means Planbook cannot tell whether you sent it.
  What it records on this student's page is that you handed this message over, when, to whom, and
  which signal it was about — not that it was delivered. Entries are never edited or deleted."
- `src/outreach-view.js:1099` — the status line at the moment of the act: "Handed to your mail app
  and logged on …'s record. Planbook cannot tell whether you send it from there — the log says what
  you wrote and when."
- `src/contact-history.js:112` — the card note, quoted above.
- `src/contact-history.js:214` — the signal card's one-line version.

And the title does the work too: `HISTORY_TITLE = 'Who you have written to'`
(`src/contact-history.js:90`) — *written to*, never *sent*.

### 5. Contact history is presentation-mode safe. — VERIFIED

`PASS | under a projector the contact history is ABSENT rather than redacted (Acceptance line 5) ::
the model handed over 0 of 2 contacts with the mode on and 2 with it off; the card drew 0 row(s);
containers showing a mark: []; marks left in <main> [] and in the student record []`

`PASS | and the empty sentence is the SAME SENTENCE either way …` — the two strings print identical
in the harness output, character for character.

The suppression is one rule in one place: `visibleContactsFor()` (`src/log.js:329`) filters through
`logKindVisible()`, which falls to `supportsVisible()` for `contact` (`src/supports.js:130`).
**`src/contact-history.js` contains no `presentationMode()` test**, asserted off the fetched source
(`PASS | the history surface is a READER … and no presentationMode() test either`), and wo-sweep § 5
still reports the rule "defined in src/supports.js, asked by 7 other file(s)" — the same seven as
before. There is no unfiltered `contactsFor()` exported for a later screen to reach past the rule
with.

Two further containments I checked myself rather than inferring: the card wears `.log-card`, and
`src/detail.css:359` reads `body[data-detail-print] .log-card { display: none !important; }` — so the
new card is behind the print gate by the same rule as WO-4.4's, and the harness's "52 print rule(s)
… 52 gated on data-detail-print, 0 ungated" covers it. `studentCsv()` names its columns and none of
them is a log entry.

---

## The fixture assumption

**What would have to be true of the fixture for a bug here to be invisible — and does the harness
break it?**

| The bug that hides | What would hide it | Does the fixture break it |
|---|---|---|
| Cooldown keyed on the **student** instead of student + rule | a student tripping exactly **one** rule — she leaves the list either way | **Yes.** Ada trips `missing-count` **and** `grade-below`, and the check asserts the other rule is still on the list with `rowsDrawn === 1`. This is WO-5.4's analogue of the backup nag's one-timestamp/one-year fixture, and it is the case the harness deliberately builds |
| Presentation mode suppressing nothing | a student with **no** contacts under the projector | **Yes.** `inDoc === 2`, `handed === 0`, `handedOff === 2` — two real contacts in the document while the model hands back none |
| An "N hidden" line leaking the count by wording | only one student measured | **Yes.** Ben exists for one sentence: his mode-**off** empty card is compared character for character with Ada's mode-**on** card |
| An overwrite masquerading as an append | a single handoff | **Yes.** Two handoffs, and the first entry is compared byte for byte |
| The harness itself preventing the navigation and calling it the app's restraint | a behavioural check only | **Yes.** The harness says so in as many words and reads both sources instead — no `preventDefault` in the hook block in `src/shell.js` and none anywhere in `src/outreach-view.js`, comments stripped first |
| A write that only *schedules*, read too early | an unflushed `rev` reading | **Yes.** Every reading sits behind `await store.flush()` — the WO-5.3 mutation-round defect, carried forward |
| The whole section silently not running | a missing `window.planbook` seam | **Yes, and confirmed:** 0 skipped on the run |

**The one hole I found, and it is a coverage gap rather than a defect.** The empty-`ruleId` path — a
draft opened from the student record about a student **nothing has fired for** — is never driven end
to end. Both contacts the harness makes the app write are for Ada, who has hits, so
`hit ? … : ''` is only ever exercised on the truthy branch. The *consequence* of an empty `ruleId`
is proved (`cooldown-quiet.mjs`: "a `contact` with no `ruleId` on it silences nothing"), but off a
**planted** record, not off a handoff. A regression in which `recordHandoff()` threw, or invented a
rule id, for a hitless draft would pass this suite. **Proposed follow-up, not a finding against this
work order** — no Acceptance line asks for it, and I have no Write to add it with.

Second, smaller: the immediate repaint of the **student-record** card after a handoff made from that
screen is a live path (`afterContactLogged()` guards on `currentView() === 'detail'`) that the
harness reaches but does not assert; it navigates to the record and re-reads instead. Also a
proposal.

---

## The two reserved decisions

Both were made deliberately and written down at their own point of departure, which is what the
brief asked for.

**1 — Where contact history goes.** A **second card** in a new `src/contact-history.js`, argued at
`src/contact-history.js:5-18` ("WHY THIS IS A SECOND CARD AND NOT A WIDER READER") and again at
`src/log.js:305-317`. The reason given is the right one: `studentLogCard()`'s footer promises "None
of this is printed, exported or put in a draft", and that sentence stops being true the moment a
message she actually sent appears under it.

**The constraint the brief attached to that choice holds.** `visibleEntriesFor()`'s existing callers
see **exactly** behaviour + note: `contact` is in neither `LOG_KINDS` nor `OWN_KINDS`, and
`tools/verify/log-entries.mjs` now reads WO-4.4's card through
`.log-card:not([data-contact-card])` — a selector change made because `.log-card` no longer
identifies one card, which is precisely the sort of thing that silently reads the wrong element. The
WO-4.4 checks still pass on their own fixture.

**2 — Which half of Deliverable 4.** **Honest copy**, not a *mark sent* control, written down at
`src/contact-history.js:102-114` and again in the markup at `index.html:2662-2669`. The cost is
stated rather than waved away: a *mark sent* control is either a second write to an existing entry
(which the append-only rule forbids outright) or a second entry for one message (which doubles what
the cooldown reads). Both would ask the teacher to believe the app learned something `mailto:`
cannot tell it. This is the cheaper half and the work order offers it explicitly.

---

## The eleven traps

| # | Trap | Holds |
|---|---|---|
| 1 | Where contact history goes — decided, not inherited | Yes — see above |
| 2 | Which half of Deliverable 4 — decided, cost stated | Yes — see above |
| 3 | `newLogEntry()` must not gain `ruleId` | Yes — byte-unchanged, in no hunk of the `src/log.js` diff. `newContactEntry()` is a second builder, argued at `src/log.js:180-208` |
| 4 | `ruleId` is `src/signals.js`'s own `hit.ruleId`, absence not filled | Yes — re-derived above; the empty-string posture is stated at `src/log.js:226-228` and `src/outreach-view.js:1078` |
| 5 | Real anchor, no `preventDefault`, must not fire on a refusing one | Yes — "the handoff hook in src/shell.js calls no preventDefault and assigns no location, and src/outreach-view.js contains neither anywhere", and "a BLOCKED draft writes nothing … ready false, href null, the log holds 2 entr(ies), rev 279 → 279". `recordHandoff()` asks `outreachModel()` rather than trusting the markup |
| 6 | The three `outreach.mjs` assertions go red — update, never relax | Yes — read conjunct by conjunct: `after.rev === before.rev && after.log === before.log && after.contacts === 0 && after.templates === before.templates` is **unchanged**; only the prose was re-scoped to say *drafting*. The change-of-mind check **gained** a conjunct's worth of wording. Nothing was weakened |
| 7 | `rev` advances 800 ms later; flush first | Yes — every reading in `contact-log.mjs` is behind `await window.planbook.store.flush()` |
| 8 | Do not add a `presentationMode()` test to a view | Yes — asserted off source; wo-sweep § 5 still counts seven askers |
| 9 | The cooldown is class-blind because the record is | Yes — `recordHandoff()` writes studentId, audience, subject, body, ruleId and no `classId`; `docs/data-model.md` records the ruling and says the class on the modal's own subtitle was deliberately not copied |
| 10 | Stale prose you now own | Yes — all of it in the diff: `src/merge-fields.js:130`, `src/outreach.js:58`, `src/outreach-view.js:22`, `src/shell.js:547`, the `src/log.js` header in three places, `docs/data-model.md` § log twice plus § the send flow. Each names WO-5.4 and says what changed |
| 11 | The `check()` call-site count | Yes — `tools/README.md:1053` reads **1267**, and wo-sweep PASSes: "1267 `check()` call site(s) across 66 harness file(s), matching tools/README.md:1053" |

## Boundaries

**Out of scope was honored.** Nothing clipboard-shaped (WO-5.7) and nothing multi-recipient (WO-5.8)
is in the diff — a grep for clipboard / navigator.clipboard / execCommand over the touched modules
and `index.html` returns nothing. `src/merge-fields.js` is in the diff but only its header comment;
wo-sweep § 20 reads the module at the same 221 lines of stripped code, sixteen fields, nine refusal
words. `tools/verify/grade-detail.mjs` and `tools/verify/log-entries.mjs` changed because the card
column grew — a necessary consequence, and in both cases the assertion was **strengthened**
(grade-detail now names all three tail cards, not only the newest).

**Every tick I found is true.** There are none: no Acceptance box on WO-5.4 is ticked, here or
anywhere the diff reaches. `git diff HEAD -- plans/` changes exactly one line — the status field,
`⬜ NOT STARTED` → `🤖 CLAIMED — 2026-08-29`, which `--start` wrote.

**The reasoning survived.** `src/log.js` remains the only writer of `log[]` and the only reader of
it; `src/contact-history.js` holds no writer; `newYearDocument()` gained nothing, so every backup
written by every earlier build still restores; append-only is a property of two functions rather
than a promise about them; and the "a note to self is the one thing a projector does not hide"
ruling is untouched — `logKindVisible()` was not edited.

## The static precondition I ruled out before reaching for a human

The obvious device question is whether the entry survives iOS handing the app over to Mail: the
write goes through `update()`, which only **schedules** a save on an 800 ms debounce
(`src/store.js:57`, `:444`), and a `mailto:` backgrounds the app immediately. **The gate is
present** — `src/store.js:549` and `:552` register `visibilitychange` and `pagehide`, both calling
`flush()`, and the comment there names iOS explicitly as the reason both are needed. There is no
missing flag, registration or manifest field, and nothing here fails on the hardware regardless of
how a test goes. So no line is handed to a human.

One thing worth the owner's eye on the iPad next time the app is open, as a **confidence check and
not an owed box** (no Acceptance line asks for it): tap *Open in my mail app* from a signal card,
return to Planbook, and confirm the contact is on the student's record. That exercises the
background-flush path on the one device that decides go-live. Everything checkable from here about
it is green.

---

## What is owed — the maintenance protocol, none of it done

The implementer never reached its doc pass. Nothing below has been touched by me; I have no Write
and no Edit, and in a phase file the acceptance criterion and its checkbox are the same line.

**Tickable on the evidence in this file — all five, no 👤, no 📆:**

1. `plans/work-orders/phase-5-outreach.md:416` — *A contact appears in the student's history
   immediately after handoff.*
2. `:417` — *The logged rule id is what WO-4.5's cooldown matches on, and suppression follows.*
3. `:418` — *Log entries are never edited or deleted.*
4. `:419` — *The UI is honest about what "logged" means given `mailto:` cannot confirm delivery.*
5. `:420` — *Contact history is presentation-mode safe — a projected history of behavior contacts is
   a disclosure.*

**And the rest of the protocol:**

- `plans/work-orders/phase-5-outreach.md:404` — status `🤖 CLAIMED — 2026-08-29` → `✅ DONE —
  2026-08-29`.
- `TESTING.md:7507` — still reads "WO-5.4 appends its acceptance lines here as it lands." The
  placeholder is untouched and the section is owed in full.
- `TESTING.md:7782` — "the `contact` entry in `log[]` is WO-5.4's, including the stale line in
  `src/merge-fields.js`'s own header that still says otherwise" — that stale line **was** fixed, so
  this sentence is now itself stale.
- `plans/work-orders/README.md:1697` — running-order row 23, which is written entirely as a
  gates-clear argument and a live reason to build. It is built.
- `plans/work-orders/README.md:361` — § Ship 3's phase table, Phase 5 row: reads "WO-5.4, WO-5.7 and
  WO-5.8 ⬜", and the count `8 | 5` moves to `8 | 6`.
- `plans/ROADMAP.md:540` — "Log the contact (append-only) and show contact history per student, from
  the roster and the signal card" → ticked.
- `plans/ROADMAP.md:87` — Phase 5 dashboard `8/9 89%` → `9/9`. Whether the phase status flips from
  🔨 to ✅ is a judgement for the owner: the roadmap checklist would be complete, but WO-5.7 and
  WO-5.8 are still ⬜ in the work-order file.
- `CHANGELOG.md` — **the owner's to write.** Not drafted here.
- `.claude/dispatch/WO-5.4-status.md` — deleted once this result file exists, per its own first line.

Two things to carry into the commit: `sw.js` is bumped to `planbook-shell-v107` with
`./src/contact-history.js` added to `SHELL` (wo-sweep PASSes the pairing), and the diff touches 21
paths, four of them untracked.

## What comes next

    $ node tools/wo-gate.mjs next
    skipped WO-4.3 — Praise signals                 🔨 IN PROGRESS
    skipped WO-4.5 — Cooldown & the quiet middle    🔨 IN PROGRESS
    next: WO-1.27 — a field name in prose is read as a field, and only half the parser knows the rule
    PASS | gates clear for WO-1.27

- **ID / title** WO-1.27 — *a field name in prose is read as a field, and only half the parser knows
  the rule*, `plans/work-orders/phase-1-shell-store-roster.md:2425`
- **size** M · **status** ⬜ NOT STARTED · **🚩** none — running-order row 12, whose `Suggested`
  column is `—`, so it carries no 🎒
- **dependencies** none. "order WO-1.5 before WO-1.27: satisfied". **Gates clear.**
- Its running-order cell reads "Whenever the tracker is quiet. Nothing depends on it and the tree is
  clean today — it is the plant that stops the next italic note doing it again." The tree is **not**
  clean today; land WO-5.4 first.

WO-5.4 **passed**, so nothing is blocked by it. WO-1.27 sits at row 12, ahead of WO-5.4's row 23, so
this answer does not change once WO-5.4 is ticked.

---

*Files inspected:* `plans/work-orders/phase-5-outreach.md` · `.claude/dispatch/WO-5.4-brief.md` ·
`.claude/dispatch/WO-5.4-status.md` · `src/contact-history.js` · `src/log.js` ·
`src/outreach-view.js` · `src/outreach.js` · `src/shell.js` · `src/detail.js` · `src/detail.css` ·
`src/signals-view.js` · `src/signals.js` · `src/supports.js` · `src/store.js` ·
`src/merge-fields.js` · `index.html` · `sw.js` · `tools/verify/contact-log.mjs` ·
`tools/verify/outreach.mjs` · `tools/verify/log-entries.mjs` · `tools/verify/cooldown-quiet.mjs` ·
`tools/verify/grade-detail.mjs` · `tools/verify-shell.mjs` · `tools/README.md` ·
`docs/data-model.md` · `TESTING.md` · `plans/work-orders/README.md` · `plans/ROADMAP.md` ·
`CLAUDE.md`
