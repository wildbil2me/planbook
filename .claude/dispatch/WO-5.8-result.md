# WO-5.8 — Several recipients, and one of them is primary · implementation result

**Route** Claude Opus (work-order-implementer) · **Date** 2026-09-20
**Status written** left at `🤖 CLAIMED — 2026-09-20`. All five Acceptance boxes are ticked and
`--tick --dry-run` reports *all 5 Acceptance lines are ticked — nothing holds WO-5.8 open*, but the
status line is the pipeline's (`AGENTS.md`: the row reads `🤖 CLAIMED` while I work and
`🔍 AWAITING VERDICT` after I return, written by the orchestrator's `--handoff`). I did not run
`--tick`; its dry run would move `plans/work-orders/README.md` from `14 | 11` to `14 | 12` and the
overall bar from `152` to `153`.

---

## What was built

**Two chip rows, not one control answering two questions.**

- Row one, `#outreachRecipients` — the row WO-5.3 built — is now a genuine multi-select.
  `.toggle-btn` with `aria-pressed` moving with the class, which is what that component already
  means on the roster's *which classes is this student in* row and on the day-off class picker.
- Row two, `#outreachPrimaryRow` — new — asks *which of them it is written to*, is drawn from the
  selection, and **is not drawn at all until two people are on the message**.
- `recipientKey` (one string) became `recipientKeys` (a list) and `primaryKey` (a pointer into it).

`src/outreach.js` **was not opened at all**. WO-5.14's own ruling says a reader who reverses the Cc
decision "changes two lines in the view and touches no encoder" — those two lines are `toList` and
`ccList` in `outreachModel()`, and that is the whole of the model-side change.

---

## The five Acceptance lines, one by one

### 1. Two guardians and a counselor, exactly one primary, primary changeable without losing the selection — **met**

**How.** Guardian 3 and the counselor tapped onto a draft already written to Guardian 1, through the
real chips and `src/shell.js`'s one delegated listener. The model reads `chosen 3`, exactly one row
carrying `primary`, and row two appears holding
`guardian-0|Guardian 1|on · guardian-2|Guardian 3|off · counselor|Counselor|off`. Promoting Guardian
3 from row two: still three chosen, the demoted primary now in `copies`, row two `off · on · off`.
The last check in the WO-5.8 block restores the flow and proves the other half of *exactly one
primary at all times* — the primary's own row-one chip is tapped and **refused**.

**Evidence.** `tools/verify/outreach.mjs`, checks *"two guardians and a counselor go on ONE draft…"*,
*"promoting Guardian 3 in the second row…"* and *"and the block leaves the flow as it found it…"*.
Mutation M4 (the primary pointer ignored) reddens six checks.

**A note on M4 that is worth the verifier's time.** It does **not** redden the first check in the
block, and that is correct rather than a gap: with one recipient on the message `picked[0]` *is* the
primary, so the opening state is indistinguishable. Everything M4 breaks breaks at the moment a
second person joins — the shape of a defect that would ship green under a single-recipient fixture.

**Design decision I made here.** The selection and the primary are **two variables**, not a list
whose head is the primary. A head-of-list arrangement makes promoting somebody a reorder, and the
order of the list is read by the Cc header, the clipboard block and the `mailto:` — so switching who
a message is addressed to would silently shuffle the order the others arrive in. Argued at the
declaration in `src/outreach-view.js`.

### 2. `{{guardian.name}}` and every merge field resolve against the primary, and the draft says who — **met**

**How.** `buildDraft()` already handed `resolveDraft()` the chosen recipient's own `guardian` record;
it now reads `model.recipient`, which is the primary. Asserted as a **pair**: the body reads
`Dear Wo53Guardian Three,` **and** the first guardian's name is gone from it altogether — because a
resolver that appended rather than replaced would pass a search for the first alone.

*The draft says who that is* in three places, all asserted: the line under row one
(`Wo53Guardian Three · wo53guardian3@… · copied to Wo53Guardian One, Wo53Counselor`), the line under
row two (`Addressed to Wo53Guardian Three, and every merge field in the draft fills in for that
one…`), and the block strip's ready sentence.

**Evidence.** Check *"promoting Guardian 3 in the second row re-resolves every merge field against
HER…"*. M4 red, M2 red on the same check for its `cc` conjunct.

### 3. Every chosen recipient reaches the compose URL, in WO-5.14's header, copy-to-self unchanged — **met**

**How.** `toList = [to]` (the primary alone); `ccList = copies.map(r => r.email).concat(the
copy-to-self)`. Picker order, teacher's own copy last — it is the one addressee who is not being told
anything.

**Evidence.** `to = wo53guardian1@example.invalid`,
`cc = wo53guardian3@…,wo53counselor@…,wo53teacher@…` read off the real `href`, literal commas, and
the clipboard block's `To:` and `Cc:` lines saying the same in the same order. Copy-to-self: WO-5.3's
own toggle check and WO-5.7's `COPY_WANT` character-for-character block are unchanged and green. M2
red.

**One thing I got wrong first and fixed.** My initial check asserted no `%2C` anywhere in the URL,
copying WO-5.14's module-level fixture. That fixture's body has no comma; a real draft opens
`Dear Wo53Guardian One,` and `encodeURIComponent` turns that comma into `%2C` by construction. The
check now reads the **address parts only**, which is what RFC 6068 § 2 is about, and says so at the
line. It went red on the first run and is green now.

### 4. A recipient with no address cannot be chosen, and says why — **met, and this is the decision the work order asked for**

**I chose: genuinely unchoosable, refused at the door.** The harness check was **rewritten, not
re-asserted**, exactly as the brief required.

**Why.** Under one selection, choosing her was a *question* — *what about Guardian 2?* — and the dead
draft was the answer, in place of a draft that could not have existed anyway. Under a selection the
same tap means something else: *also send this to her*, over a message to Guardian 1 and the
counselor that is finished and ready. Blocking there kills a working message to answer a request the
app can simply decline, and buries the reason in a strip of things to fix rather than putting it
where the thumb is. **The third answer — take the tap and drop her from the URL — is the forbidden
one**: a teacher who believes a message went to both parents and finds it went to one is the silent
failure this app refuses everywhere it can see one.

**What did not move.** She is still drawn, still in her own position, still saying what is missing —
*an absence and a bug look identical* is untouched — and the app still never opens a mail window with
an empty To field. The refusal is `aria-disabled` plus a `src/shell.css` dimming, and the chip stays
a **live** button: the `disabled` attribute would swallow the click, and a tap that does nothing at
all is the dead button `openOutreach()` already refuses to open on. The tap lands,
`toggleOutreachRecipient()` declines it, and the status line and `announce()` say why —
`copyRefused()`'s pair, one function along.

**Evidence.** The chip reads `guardian-1|Guardian 2|off|refused`, the tap lands, one recipient is
still on the message, and the status line says *"There is no email address on file for Wo53Guardian
Two, so Guardian 2 cannot go on this message. Add one on the roster and the chip comes to life."* It
is driven over an **edited** draft — the check before it typed a sentence in place of a merge field —
and the body is byte-identical afterwards, which is the claim a refusal that rebuilt on its way out
would fail. M1 red here and on two downstream checks its leaked selection breaks.

**The half of this that nearly went missing, and the verifier should check I did not fool myself.**
`outreachModel()` still builds a `reasons` entry of `kind: 'recipient'`, and the **only** thing in the
harness that reached it was the tap I have now refused. Turning that into a no-op would have deleted a
check's subject without deleting the check. The reason is not dead — a student with nobody addressable
opens on somebody with no address — so a new check at the foot of the section opens Cal's draft and
reads the block: every chip `refused`, the draft open on one of them anyway, no `href`,
`kind: 'recipient'` on the list. It has to blank `teacher.adminEmail` first, or Cal's *Admin* row has
an address and the draft is ready and the check asserts nothing. That is a write to the **fixture**,
after the last `rev` reading in the section, and the cleanup restores the whole `teacher` block
anyway.

**Two honest limits on that last check.** It opens the flow through `openOutreach()` rather than
through a door — Cal has no signal so the card cannot reach her, and the record door would cost a
four-hop navigation away from the modal every check above it left open; both doors are separately
driven and asserted in the same section. And it is a fixture write inside a section whose theme is
"this flow writes nothing", placed after every `rev` assertion for that reason.

### 5. Changing the recipients obeys WO-5.6's confirm rather than a second rule of its own — **met**

**How.** The gesture split in two, and only one half rebuilds. Writing the draft to somebody else
rebuilds both boxes and asks — `setOutreachRecipient()`, unchanged in name, wiring and
`kind: 'recipient'` proposal, now reached from row two. Putting somebody on or off the Cc rebuilds
nothing and asks nothing. **That is not a second rule**: it is `toggleOutreachCopy()`'s posture,
which has put an address on the same header since WO-5.3 without ever raising a dialog, and it is
provable — `draftEdited()` compares both boxes against the snapshot and neither box moves.

**Evidence.** Asserted as a **pair** over one edited draft, so it cannot pass vacuously: the row-one
tap goes straight through and leaves both boxes byte-identical, the row-two tap asks, and cancelling
leaves the primary, the selection and the teacher's own sentence exactly where they were. The panel
quotes `Guardian 1` and names no student, guardian or address — checked against the six planted
secrets, both guardian names, the counselor's name and both addresses.

**M3 is the mutation worth reading, and it is the narrowest of the four.** Making a membership tap
call `buildDraft()` reddens **exactly one check and nothing else** — because a rebuilt draft produces
the same subject and the same body for the same primary. Every check comparing the draft to itself
stays green, the URL stays right, the log stays right, and the only thing lost is whatever the teacher
had typed. That is a defect a fixture without a typed sentence in it cannot see at all, and it is
precisely the loss WO-5.6 exists to prevent.

---

## Traps

**"The accommodation fence does not move: the picker still reads `students[].counselor` and never
`supports.caseManager`, and `AUDIENCES` is not widened."** Held, and it cost nothing because
`src/outreach.js` was never opened. `AUDIENCES` is untouched; three guardian rows still fold onto the
one `guardian` audience, which is the mapping that makes widening unnecessary, and I wrote that down
at the six-row picker check. The section's six-secret leak check is green over a modal now drawing
two chip rows and two extra lines of type.

---

## Decisions the work order did not settle

1. **The gesture shape: two rows, not one multi-state chip.** A chip meaning *add* on the first tap,
   *write to this one* on the second and *take off* on the third is one control answering three
   questions, and the third tap is the one that destroys something. I traced every single-row scheme
   and each of them leaves at least one state unreachable (you can never remove a non-primary) or
   makes removal the third tap. Two rows, one question each.
2. **Row two is drawn only when two or more are chosen.** With one there is a single answer and the
   line under row one already names her, so a lone chip would be a control that cannot do anything.
   The **wrapper** is toggled rather than the heading and the row separately — a heading left standing
   over an empty row is `src/classes.js`'s own recorded defect about the class tabs.
3. **Row one refuses to take the primary off.** This holds *exactly one primary at all times* without
   a rule about a message with nobody on it, and it keeps row one free of confirms — taking the
   primary off is the one membership tap that would have had to rebuild.
4. **`recipients[].active` was renamed to `chosen`, and `primary` added beside it.** Two names for
   near-things would be worse; `.active` and `aria-pressed` on a chip now mean *in the set*, which is
   what they mean everywhere else in this app. Nothing in `src/` read that field but
   `paintRecipients()`; the harness reads the chip's **class**, not the field.
5. **`.toggle-btn[aria-disabled='true']` went on the shared component in `src/shell.css`, not scoped
   to the modal.** *A toggle you cannot turn on* is a general state and nothing else in the app sets
   `aria-disabled` on a `.toggle-btn` today, so it governs exactly one place and is available. Colours
   inline, no opacity, dashed edge and a grey word; it changes no dimension, so the 44px floor in the
   coarse block still reaches it — and that is measured rather than read.
6. **The fixture gained a third guardian rather than a third student.** *Two guardians and a
   counselor* is the Acceptance line word for word and the fixture's second guardian must keep her
   missing address. A third addressed guardian costs three count assertions; a third student costs a
   roster row on every screen the section walks past, or a bypassed door. It also puts the refused
   chip **between** two choosable ones, which is a better shape for the refusal than at the end of
   the row.
7. **`writeContact({ audience })` left standing.** It records `audienceOf(primary)`. That is WO-5.15
   and not mine; I noted it at the point of departure in **both** `outreachModel()` and
   `recordHandoff()` rather than widening the work order. Incomplete rather than false — the message
   is addressed to the primary.
8. **One file outside the work order was amended**, and I flag it for the verifier rather than
   burying it. `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.37 (unbuilt) names WO-5.8 and
   says *"A recipient with no address… The route WO-5.8 leaves standing"* — an instruction my change
   made wrong. The route is not closed, only re-reached, so I amended that one bullet to say how, and
   pointed it at the fixture that now drives it. This is the `wo.md` scar (WO-1.40): a pipeline
   document giving a future reader an instruction the new shape made wrong, with nothing able to
   notice. Revert it if you judge it out of scope; nothing depends on it.

---

## Commands, and what they printed

Every figure below is quoted from output I read after the process exited.

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` (delivered tree) | `1435 checks · 1435 passed · 0 failed · 0 skipped`, 45,265 lines, 31.5 lines per check, **496s**, `EXIT=0` |
| `node tools/wo-sweep.mjs` | `42 checks · 39 passed · 0 failed · 3 to review` — the three to-review are the same three as before the work (sensitive field names outside `src/backup.js`, due-date beside late/missing, the two mockup banners) |
| `node tools/wo-gate.mjs WO-5.8` | `PASS | gates clear for WO-5.8` |
| `node tools/wo-gate.mjs --audit` | `PASS` — every fragment, pointer, lock and dashboard row |
| `node tools/wo-gate.mjs --tick WO-5.8 --dry-run` | `NOTE | all 5 Acceptance lines are ticked — nothing holds WO-5.8 open` (nothing written) |

**The harness ran three times and the first run was RED.** I am naming it because the defect is
invisible to a syntax check and I want it on the record rather than smoothed over. It died at
`ReferenceError: data is not defined`, 49 checks into a section of 63, 14 checks lost and named as
lost (WO-1.44's containment working exactly as designed). The cause was a **pair** of backticks
inside an `evalJs()` template literal, in a comment I wrote. `tools/README.md` warns about backticks
there three times and every warning says *one would close it* — true, and the easy case, because one
is a parse error. **Two closes and reopens the literal**: the file parses, `node --check` is happy,
and the text between them runs as an expression. A running-parity scan over the file found it in one
pass and found nothing else. Recorded in `tools/README.md` beside the count. The same run also
reddened the `%2C` check described under Acceptance line 3.

**The third run exists because I edited `src/` after the second went green** — a `removeAttribute()`
on a freshly created element, a no-op I tidied out. The figures above are the third run's, because a
run quoted about a tree should be a run of that tree. `tools/README.md` says so at the number.

### The mutation round — four, in four scratch copies, never in the working tree

Each copy was made by an exact-once string replacement that aborts unless the target occurs exactly
once; all four are in `src/outreach-view.js`. **The working tree was never mutated**, so there was
never an armed window and never anything to revert.

| # | Mutation | Result |
|---|---|---|
| M1 | the `!row.has` refusal taken out | `1435 · 1432 passed · 3 failed` — the addressless check, plus two downstream where the leaked selection breaks WO-5.10's fixture |
| M2 | `ccList` back to the copy-to-self alone | `1435 · 1433 passed · 2 failed` — the URL check and the promotion check's `cc` conjunct |
| M3 | a membership tap calls `buildDraft()` | `1435 · 1434 passed · 1 failed` — exactly the Acceptance-5 check |
| M4 | `chosen = picked[0]`, the primary pointer ignored | `1435 · 1429 passed · 6 failed` — promotion, the Acceptance-5 pair, WO-5.10's status line, WO-5.6's silent-rebuild and round-trip checks, and *the panel names nobody* |

`grep -rn MUTATION` over the delivered tree: the only word `MUTATION` I added anywhere is two prose
sentences in `TESTING.md` describing this round. `src/outreach-view.js`, `index.html` and `sw.js`
are clean; the pre-existing hits are `src/shell.js:921` (prose about a class mutation),
`tools/verify/outreach.mjs:1572`, `tools/verify/keys-legend-guards.mjs` and `tools/README.md`.

---

## What I could not verify

- **Anything needing a real iPad or human eyes.** This work order carries **no 👤 and no 📆 line**, so
  nothing is formally owed — but three things were settled by measurement and not by looking:
  - **The dashed, greyed refused chip has never been seen by anyone.** The harness asserts the
    attribute and the 44px floor; whether it reads as *unavailable* rather than as *broken* is a
    human judgement, and it is the first `aria-disabled` `.toggle-btn` in the app.
  - **Two chip rows on a 390px portrait iPad.** Measured: ten chips across the two rows, none under
    44px on either axis, no sideways scroll. That is geometry under emulated coarse pointer, not a
    thumb, and it is a taller panel than the one WO-5.3 shipped.
  - **The refusal sentences.** Both are read off the status line by the harness; nobody has read them
    on a device at the moment of a mis-tap.
- **`verify-shell.mjs` did run in this sandbox** — three times, ~500s each. Per `CLAUDE.md` that is a
  green run and not a tick, and the sentence above still governs.

## Left undone, deliberately

- **`CHANGELOG.md`** — the teacher's. A draft is below.
- **The status line and `--tick`** — the pipeline's, per `AGENTS.md`.
- **`writeContact({ audience })`** — WO-5.15's row, noted at two points of departure.
- **Temptations declined, so they are not lost:** a `bcc` field (nothing needs one and WO-5.14 ruled
  it out); re-opening the Cc ruling; a *select all guardians* convenience on row one; a second
  ordering control for the Cc list; and the obvious-looking move of folding the second row into row
  one as a third chip state.

---

## Files changed

- `C:\dev\planbook\src\outreach-view.js` — the state, the model, `paintRecipients()`,
  `paintPrimary()` (new), the block strip's ready sentence, the projector branch,
  `toggleOutreachRecipient()` and `refuseRecipient()` (new), `setOutreachRecipient()`,
  `applyRecipient()`, `openOutreach()`, `resetOutreach()`
- `C:\dev\planbook\index.html` — the second chip row and its heading, and the note on row one
- `C:\dev\planbook\src\shell.js` — the `[data-outreach-primary]` route, `[data-outreach-to]`
  re-pointed at the toggle, and the hook documentation block
- `C:\dev\planbook\src\shell.css` — `.toggle-btn[aria-disabled='true']` and its hover
- `C:\dev\planbook\sw.js` — `CACHE` `planbook-shell-v123` → `v124` (`index.html` is in `SHELL`)
- `C:\dev\planbook\tools\verify\outreach.mjs` — seven new checks, six rewritten, the fixture's third
  guardian, `DRAWN` extended
- `C:\dev\planbook\tools\README.md` — the call-site count 1419 → 1426, the WO-5.8 entry, and the
  paired-backtick defect
- `C:\dev\planbook\TESTING.md` — § WO-5.8
- `C:\dev\planbook\plans\work-orders\phase-5-outreach.md` — five boxes ticked, the Traps line
  answered, and the decision recorded under the block that asked for it
- `C:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — § WO-1.37's first route bullet
  (see decision 8)

---

## Draft CHANGELOG entry — the teacher's to accept, reword or bin

> **One message, several people.** A draft can now go to both guardians and the counselor at once.
> Tap everyone it should reach; one of them is who it is *written to* — the salutation names her and
> every merge field fills in for her — and the rest are copied. The second row only appears when
> there is somebody to choose between. Somebody with no email address on the roster can no longer be
> put on a message at all: the chip says so when you tap it, instead of the draft going dead.
