# WO-5.15 — One contact, several audiences · implementer's result

**Route** Claude (Opus), work-order-implementer · **Date** 2026-09-20
**Brief** `.claude/dispatch/WO-5.15-brief.md` · **Work order** `plans/work-orders/phase-5-outreach.md` § WO-5.15

---

## 1. The decision, which is the first Deliverable

`writeContact({ audience })` recorded a scalar enum. A draft to two guardians and the counselor —
which WO-5.8's picker builds — has no single value for it.

**The answer is one field added and not one widened.** `audience` keeps its type, its meaning and
its three readers, and is still **the primary's** — the drawer the words were written for, what
every merge field resolved against, and what the message actually reads as. A ninth field,
**`audiences`**, records **every drawer the message reached, that one first, deduped**.

The ruling is written as a comment at the point the code makes it (`src/log.js`
`newContactEntry()`, and again above `audienceList()`), not only here.

Three alternatives, each refused for a stated reason:

- **Widening `audience` to an array.** It reaches all three readers at once, it makes `''` and `[]`
  two ways of saying the same thing, and it has **no answer at all for rows already in a teacher's
  document** — `src/log.js` holds no updater and no delete, so those are never rewritten.
- **A joined string, `"guardian,counselor"`.** It passes every `String()` coercion silently:
  `AUDIENCE_LABEL[…]` falls through to the raw string and prints it in a 10px pill;
  `AUDIENCE_TEXT[…]` falls through to `''` and drops the recipients from the sentence. A shape whose
  failure mode is a plausible-looking screen is the wrong shape.
- **Recording the recipients rather than the drawers.** Names and addresses in `log[]`, on a card a
  guardian may be sitting beside, to answer a question the drawers already answer.

Two riders that a later reader will otherwise get wrong, and both are in the code's own comments:

- **The list counts drawers and never people.** Both guardians are the `guardian` audience, so a
  draft to the two of them records `["guardian"]` and a draft to a guardian and the counselor
  records two. The dedupe lives in `src/outreach.js`'s new `audiencesOf(recipients)`, beside the
  `audienceOf()` it is built on, because recipient → audience is made in exactly one place (that
  file's own header rule).
- **Neither field is in the cooldown's key.** That is `studentId + ruleId`; both audience fields
  cross out of `src/log.js` for a *sentence* and nothing else, so a message to three people silences
  exactly the row a message to one would. This is the Traps line's under-fire posture held one field
  over from where WO-4.5 argued it.

Entries written by earlier builds have no `audiences` at all. `contactAudiences(entry)` reads them
back as `[audience]` — **in exactly one place**, which is the subject of the M2 note below.

## 2. Against the Acceptance list, one by one

### 1. “A contact written to several recipients records what the cooldown needs to silence the right rule and nothing else, and the history card says who it went to.” — met

**Verified by driving the real picker and the real handoff** in `tools/verify/contact-log.mjs`
(new block at the foot of § *the contact log*, after WO-5.9's, so it moves none of the
contact-counting claims above it). Ada gained a counselor with an address — a draft cannot reach two
drawers unless two recipients have one. The block taps `[data-outreach-to="counselor"]` (the door a
teacher has, not the model), presses the handoff, and asserts, from output I read:

- the model goes `["guardian"] → ["guardian","counselor"]`, `chosen ["guardian-0","counselor"]`,
  `primary "guardian-0"`;
- **one** entry appended, reading `audience: "guardian"` / `audiences: ["guardian","counselor"]`,
  nine keys in `docs/data-model.md`'s order;
- **what it silences**: her second concern rule goes quiet beside the one two contacts earlier had
  already taken off the list, she is drawn 0 times, and the hitless student (whose contact carries
  `ruleId: ''`) is still held by nothing. The cooldown records read
  `[{"rule":"grade-below","audience":"guardian","audiences":["guardian","counselor"]},{"rule":"missing-count","audience":"guardian","audiences":["guardian"]}]`;
- **the card says who it went to**: chips `[["Guardian","Counselor"],["Guardian"],["Guardian"],["Admin"]]`.

Mutation-proved: **M3** (the audience let into the cooldown's key) reddens 10 checks; **M1** (the
field written empty) reddens 5. Figures in § 4.

### 2. “The `kind` filter is untouched: no reader gains a kind, and there is still no exported reader that hands back all three.” — met

- `LOG_KINDS`, `OWN_KINDS` and `ALL_KINDS` are byte-identical (`git diff src/log.js` touches none of
  them). No reader gained a kind argument.
- The one new export in `src/log.js` is `contactAudiences(entry)`. It takes an **entry**, not a
  document; it reads no collection; it hands back strings out of a four-word enum. It is not a kind
  reader and cannot be used as one. `src/contact-history.js` already held whole entries via
  `visibleContactsFor()`, so it crosses no line that file was not already on.
- The standing structural check over `src/contact-history.js` is green on the delivered tree: no
  `update()`, no `push`, no `splice`, no `presentationMode()` test, no unfiltered `contactsFor()`
  export, imports `visibleContactsFor, contactAudiences`.
- The new suppressed-row sentence is asserted to contain no subject mark, no counselor name and no
  counselor address.
- `.push(` count in `src/log.js` is still exactly 2 (`verify/log-entries.mjs` pins it): `audienceList()`
  deliberately builds its list with `concat`/`filter` and no `push`, and says why at its own
  definition.

### 3. “`docs/data-model.md` records the field's shape under several recipients.” — met

Four places, in the same sitting as the code:

- the `log[]` literal (§ The document) now carries `"audiences": ["guardian", "counselor"]` with its
  own comment;
- a **new bullet** in § log stating both fields, the primary-first order, the drawers-not-people
  dedupe, the `[audience]` fallback for rows earlier builds wrote, the `''`/`[]` emptiness rule, and
  that neither field is ever part of the cooldown's key;
- § Outreach's “it writes exactly one thing” paragraph and its “what a row shows” sentence;
- the RECIPIENT-vs-AUDIENCE ruling, which now says the record files drawers and that no name and no
  address ever reaches `log[]`.

## 3. Commands, with results I read

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` | **`1441 checks · 1441 passed · 0 failed · 0 skipped`**, 45,511 lines, 31.6 lines per check, **498s**, exit 0 |
| `node tools/wo-sweep.mjs` | **`42 checks · 39 passed · 0 failed · 3 to review`**, exit 0. The three reviews are the standing ones (sensitive field names outside `src/backup.js`, due-date beside late/missing, and the two mockup banners) and are unchanged in kind by this row |
| `node tools/wo-gate.mjs --audit` | PASS — every dashboard row matches its own boxes |
| `node tools/wo-gate.mjs WO-5.15` | `PASS \| gates clear for WO-5.15` |
| `grep -rn MUTATION` over changed files | no hit this work order put there (run last; § 4) |

The harness ran **locally, not in a sandbox**; the figures above are from the run's own summary
lines, read after it exited. The code and harness files are byte-identical to the tree that green run
measured — `git diff -- src tools/verify sw.js` is empty against the index, and everything written
after it was prose (`TESTING.md`, `tools/README.md`, the work order's Acceptance notes).

## 4. The mutation round — three, and the second one is the finding

Run in the working tree against a **fully staged index**, each reverted with
`git checkout -- src/log.js` **before anything else was written**.

| # | Mutation | Result |
|---|---|---|
| M1 | `newContactEntry()`: `audiences: []` | `1440 checks · 1435 passed · 5 failed`, exit 1 — the record check, the multi-audience record, the chips, the cooldown record, the sentence |
| M2 | `contactAudiences()`: the `[audience]` fallback removed | **GREEN the first time** — `1440 · 1440 passed`, exit 0. After the repair: `1441 · 1438 passed · 3 failed`, exit 1 |
| M3 | `lastContactAbout()`: `&& contactAudiences(e).length === 1` — the audience let into the key | `1441 checks · 1431 passed · 10 failed`, exit 1 — this row's two and eight of WO-4.5's |

**M2 passed on a tree that had no assertion of the back-compat claim at all**, and two things hid it.
Every contact the harness can *drive* is written by this build and carries the field, so the only
rows that exercise the fallback are ones a fixture must **plant** — and the one planted row that did
(Ada's, in `cooldown-quiet.mjs`) was covered by the second thing: I had written an
`|| AUDIENCE_TEXT[row.audience]` behind the list in `cooldownWhy()`, a second opinion about the same
missing field one screen away from the function that owns it.

Both were repaired before the delivered tree: **the second fallback came out** (the fallback now
lives in exactly one place, and the removal is argued at the line), and **a contact in the
pre-WO-5.15 shape is planted** in the WO-5.15 block — eight fields, `audience: "admin"`, no
`audiences` key — where the history card reads it back. M2 then reddens three checks. Ada's planted
record in `cooldown-quiet.mjs` deliberately keeps the old shape, with a comment saying *do not add
the field to this record*; Ben's gained the list, so one expanded suppressed list now proves the
fallback and the list in one reading.

**`grep -rn MUTATION`** over every file I changed was the last command of the code work: no hit this
work order put there. The matches that exist are pre-existing prose about *earlier* mutation rounds —
`tools/README.md` (5 lines), `plans/work-orders/phase-5-outreach.md:1088` (WO-5.9's own note),
`tools/verify/keys-legend-guards.mjs`, `tools/verify/outreach.mjs` — plus one unrelated comment at
`src/shell.js:921`, and the new prose in `TESTING.md` § WO-5.15 describing this round.

## 5. What I could not verify

- **Nothing on this row needs an iPad, and no 👤 or 📆 line exists on it.** I ticked no such line.
- **The chips wrapping under a thumb is reasoned, not measured on hardware.** `.log-entry-top` is
  `flex-wrap: wrap` with `gap: 8px` and `.log-entry-kind` is `flex: 0 0 auto`, so several chips wrap
  by construction and the existing coarse-pointer block already sizes them. **This work order adds no
  control** — the chips are `<span>`s, as the single chip has always been — so it declares no 44px
  rule and adds no touch-target measurement. What a four-drawer row looks like on a 390px portrait
  card I have not seen with human eyes; the widest case the harness drew is two chips.
- The harness runs in headless Edge over CDP and has never seen a service worker. `CACHE` is bumped
  v124 → v125 (`src/*.js` files are in `SHELL`), but that the bump takes on a device is not something
  any run here can show.

## 6. Decisions the work order did not settle, and which way I went

1. **Whether reader 3 — `cooldownWhy()` — should name several audiences at all.** The work order says
   the sentence is “incomplete, not false,” which would have permitted leaving it. **I changed it**:
   that sentence's whole job is to let a teacher *check* a suppression, and half of who a message
   went to is exactly what invites the second message. It is built on the screen and never on the
   hit — `hit.explanation` is drafted into mail through `{{signals.list}}` — which is the brief's
   fourth constraint honoured rather than worked around. Cost: the cooldown record carries
   `audiences` beside `audience`, i.e. four more enum words crossing `src/log.js`'s firewall, with no
   name, no address, no subject, no body and no count of people. Argued at both ends.
2. **Nothing on the history row marks which chip was the primary.** The list is written primary
   first and the order is the whole of the claim. A second chip style would have the card reporting a
   To/Cc split it never reads back from anywhere, and everyone on that row received the message.
   Recorded as a ruling in `contactRow()`'s comment, with the note that reversing it wants a decision
   and not a modifier class.
3. **`audiences` is written on every contact, including single-recipient ones.** One shape per row
   (`src/calendar.js`'s `newEvent()` rule), so no reader has to ask which build wrote it. The
   alternative — write it only when there are several — makes absence ambiguous between “one drawer”
   and “an old build”, which is the one distinction the fallback depends on.
4. **Name collision avoided deliberately.** `src/outreach.js` exports `audiencesOf(recipients)` and
   `src/log.js` exports `contactAudiences(entry)`. Two different questions, two names, so a reader
   cannot import the wrong one and get a plausible answer.

## 7. Out of scope — temptations declined

- **A `lastContactAudiences()`-style reader, or letting the cooldown prefer a contact that reached
  more people.** Both would put the audience into the key. Refused on the Traps line.
- **Backfilling `audiences` onto existing entries on load.** That is an updater in `src/log.js`,
  which the file does not have and must not gain. The fallback reader is the whole answer.
- **`docs/FERPA.md` / `privacy.html`.** I read both for whether they needed the same-sitting change
  their own rule demands. They describe *what is in the log* in kind, not field by field, and
  `audiences` adds no new kind of data — it is the same four-word enum `audience` already was, with
  no name and no address. So I changed neither. **Flagging it for the verifier** as a judgement call
  rather than an omission.
- **Distinguishing the primary visually, and a `+2` style chip.** See § 6.2.
- **Widening `AUDIENCES`.** `src/outreach.js`'s header forbids it and nothing here needed it.

## 8. Files changed

Code and harness (byte-identical to the tree the green run measured):

- `c:\dev\planbook\src\log.js` — `audienceList()` (private, no `push`), `contactAudiences()`
  (new export), `audiences` on `newContactEntry()`, `lastContactAbout()` returns it; header prose
- `c:\dev\planbook\src\outreach.js` — new export `audiencesOf(recipients)`
- `c:\dev\planbook\src\outreach-view.js` — `audiences` on the model (base and live), handed to
  `writeContact()`; the two comment blocks that named WO-5.15 as unanswered now answer it
- `c:\dev\planbook\src\contact-history.js` — `contactRow()` draws one chip per drawer
- `c:\dev\planbook\src\signals.js` — `silencedBy()` carries `audiences`; header prose
- `c:\dev\planbook\src\signals-view.js` — `audienceSentence()`; `cooldownWhy()` names them all, with
  no second fallback
- `c:\dev\planbook\sw.js` — `CACHE` v124 → v125
- `c:\dev\planbook\tools\verify\contact-log.mjs` — Ada gains a counselor; nine-field key assertion;
  new WO-5.15 block (5 checks) including the planted pre-WO-5.15 record
- `c:\dev\planbook\tools\verify\cooldown-quiet.mjs` — Ben's planted contact gains `audiences`;
  Ada's deliberately does not; 1 new check

Documentation:

- `c:\dev\planbook\docs\data-model.md` — the field's shape under several recipients, four places
- `c:\dev\planbook\TESTING.md` — new § WO-5.15 with the mutation table and the Acceptance evidence
- `c:\dev\planbook\tools\README.md` — call-site count 1426 → 1432, executed 1435 → 1441, and the
  WO-5.15 entry in the count ledger
- `c:\dev\planbook\plans\work-orders\phase-5-outreach.md` — the three Acceptance boxes ticked with
  their evidence. **The Status line is untouched** (`🤖 CLAIMED — 2026-09-20`), as instructed;
  `--tick` is the orchestrator's to run.

Not written: `CHANGELOG.md` (the teacher's). No commit, no push.

## 9. Draft CHANGELOG entry, for the teacher to accept, reject or rewrite

> **One contact, several audiences.** A message you send to a guardian *and* the counselor is now
> logged as having gone to both. The contact card shows a chip for each of them, and when a signal
> is quiet because you already wrote about it, the row says who you wrote to — all of them, not just
> the person the message was addressed to. What gets quietened has not changed: that still depends
> on the student and the rule you wrote about, never on who was copied. Contacts logged by earlier
> versions read exactly as they always did.
