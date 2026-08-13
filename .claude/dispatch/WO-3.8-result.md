# WO-3.8 — Accommodation prompts at point of use · result

**Implementer** Claude (work-order-implementer, Opus) · **Date** 2026-08-13
**Brief** `.claude/dispatch/WO-3.8-brief.md` · **Work order** `plans/work-orders/phase-3-gradebook.md`

**Verification, both commands run to completion on the delivered tree and their output read:**

- `node tools/verify-shell.mjs` → **`710 checks · 710 passed · 0 failed · 0 skipped`**, 18,130 lines,
  25.5 lines per check, **226s**, exit 0. Sixteen of those are new, in one section at the foot of the
  file.
- `node tools/wo-sweep.mjs` → **`17 checks · 15 passed · 0 failed · 2 to review`**, exit 0. Both
  REVIEWs read and answered below.
- `node tools/wo-gate.mjs --audit` → `PASS | every fragment matches exactly one roadmap box, every
  **Owes** pointer lands on an open box, and every dashboard row matches its own boxes.` (Run because
  this work order re-homes an Acceptance line; it writes nothing.)

---

## Against the four Acceptance lines, one by one

### 1. Creating a test surfaces the counts; creating a homework assignment scoped elsewhere doesn't — **met, ticked**

Both halves on one fixture, driven through the real controls.

A new assignment is created with the real **+ New assignment**, which files it into the class's first
category (`Tests`). The prompt then reads, asserted as a string rather than as a regex over two
numbers because the copy is a deliverable:

> **3 students have extended time, 2 need a separate setting.**

That is `docs/data-model.md` § Accommodations rule 3's own worked example, word for word.

The same open editor is then switched to `Homework` with the real `<select>`, and **nothing is left**:
host `.hidden`, host `textContent === ''`, zero `[data-accommodation-names]` hooks on the page, and
the kind phrases absent from a page of 23,771 characters. The sixth student on that roster carries an
accommodation scoped to `labs, field work`, so this is a scope that does not match rather than a class
with nothing on file — which is the half a build passes by accident.

Switching back to `Tests` restates the same sentence, which is the "recomputed, not remembered" claim
the brief singles out. The prompt is painted from `paintEditorSupports()` in `src/assignments.js`,
called from `renderEditorFields()` and from `setAssignmentCategory()`, so it follows the picker.

*Evidence:* checks 2, 5 and 7 of the new section; the exact detail strings are quoted in
`TESTING.md` § WO-3.8.

### 2. The default view is counts, not names — **met, ticked**

On first paint the reveal is drawn and collapsed — `aria-expanded="false"`, labelled *"Show which
students"* — with zero name chips, and none of the five students named anywhere in a dialog of 1,094
characters. One tap puts five names on screen grouped under the kind they belong to, and the sixth
student (scoped elsewhere) is not among them. A category change puts the names back behind the tap.

### 3. In presentation mode nothing appears at all — not even the count — **met, ticked**

Absent from the DOM, not styled away. With the editor open on the category that was showing five
names a moment earlier: host empty, `.hidden`, computed `display: none`, zero reveal hooks, zero name
chips, and no kind phrase anywhere on a page of 24,104 characters.

Two further readings, because "nothing appears" is an absence and a build that draws nothing passes it
perfectly:

- **The reveal is not merely un-drawn.** Called straight through the `window.planbook` seam with the
  mode on, `toggleAccommodationNames()` writes nothing either — so the guard is in the module, not in
  the absence of a button.
- **Flipping back off brings the same sentence back to the same open dialog**, names still behind the
  tap. That is the negative control for every absence above.

And the reachable half: a flip made **with the editor shut** — which is the only way a teacher can
make one, since a modal scrim owns the viewport — leaves no summary sitting in the shut dialog's DOM.

### 4. Marking a student absent for the Nth time surfaces an attendance-related plan clause — **not met. Deferred to WO-4.4, box left `- [ ]`**

I read this line the way the brief asked rather than leaning on its parenthetical, and I reached the
same destination by a different road, which is worth stating plainly because it changes what WO-4.4 is
owed.

**The parenthetical's reason is wrong.** Attendance marking shipped at WO-2.1 and its counts at
WO-2.4. The behavior log is not what this line was waiting on.

**It is deferred anyway, for three things that do not exist:**

1. **There is no attendance clause to surface.** `supports` is `plan`, `caseManager`, `reviewDate`,
   `accommodations[] {kind, detail, appliesTo}`, `medical`, `behaviorPlan`. Nothing in it represents
   "this plan has an attendance clause". The only two candidates are both wrong: `appliesTo` is
   documented (`src/supports.js`, `docs/data-model.md`) as being about **grading categories**, and
   pattern-matching the free-text `behaviorPlan` for the word "attendance" would be this app guessing
   at a teacher's prose about a child — the exact class of inference this project refuses everywhere
   else.
2. **There is no N.** `src/store.js` seeds `signals: {}` with a comment saying so deliberately:
   *"Phase 4 owns their names."* The absence thresholds are tabulated in `docs/data-model.md` and are
   WO-4.1's to name.
3. **There is no surface named for it.** WO-3.8's four Deliverables are the summary, counts-by-default,
   `appliesTo`, and presentation-mode suppression. None mentions attendance. The screen this would
   land on is the registry — marked at the door with thirty students walking in, and the screen most
   likely to be projected — which is not a surface to add sensitive data to under a work order about
   the assignment editor.

So it is deferred, and shaping the clause is genuinely the target's work rather than a schedule
slip. Done per `plans/work-orders/README.md` § *"A re-homed Acceptance line stays `- [ ]`"*:

- WO-3.8's box stays `- [ ]`, with the reasoning in an italic note and a bare
  `→ WO-4.4 "surfaces an attendance-related plan clause if one exists"` pointer.
- `**Owes** WO-4.4` added to the WO-3.8 header, on the same line as **Depends on**.
- A **new** box added under WO-4.4 (none of its four fitted — they are all about logging entries),
  carrying the re-home note. `--audit` resolves the pointer to exactly that one open box:
  `ok WO-3.8 [ ] → WO-4.4`.

**Whether WO-4.4 is the right home is the one call here I am least sure of**, and I went with the
brief's instruction. The argument against: the missing pieces are a `supports` **shape** (WO-1.8's
territory, closed) and a **threshold** (WO-4.1's). The argument for, which I think wins: WO-4.4 is the
work order that gives plan and behavior data a trigger-shaped surface at all, and it already carries a
presentation-mode box, so the new line sits beside its own kind. If the owner would rather it sat on
WO-4.1, it is a two-line move and `--audit` will catch either end.

---

## The three judgment calls, and which way I went

### 1. What `appliesTo` matching means mechanically

**Word-set subset matching, in either direction, over crudely stemmed words** — in
`appliesToMatches()` in `src/supports.js`, beside `parseAppliesTo()`, with the reasoning written at
the point of departure.

- Empty `appliesTo` means everything (the data model's rule).
- Both sides fold to lower case, split on anything that is not a letter or a digit, and each word is
  stemmed: drop a trailing `s`, then a trailing `e` after a sibilant, then a doubled final consonant.
  `tests` and `test` land on `test`; `quizzes` and `quiz` land on `quiz`.
- A term matches when **its words are a subset of the category's, or the category's are a subset of
  its** — so `tests` covers `Unit Tests` and `unit tests` covers `Tests`.
- A scoped accommodation against an assignment filed under **no** category matches nothing; an empty
  `appliesTo` still does.

**Word sets rather than substrings**, because `art` is a substring of `Participation` and a prompt
that fired on that would teach a teacher to stop reading them. **It leans toward firing** for the
reason the brief gives, and one extra consequence of the lean is written down: a term that stems to no
words at all (`—`, `?`) is treated as *no scope* rather than as a scope nothing can satisfy.

It lives in `src/supports.js` because that file already owns both halves of `appliesTo` and because a
match rule copied into a screen can disagree with the next screen's silently. It returns a boolean
about **one** accommodation and never a count, a list or a sentence — that file's header forbids
anything summary-shaped, and the aggregation lives in the new module instead.

Thirteen cases are asserted directly against the function through the seam, including the two that
must answer **no**.

### 2. Where the names live

**Inline, inside the same box, under the counts, behind one control** — `Show which students` /
`Hide the names`, `aria-expanded`, 44px in the coarse block in the same pass.

- **They re-hide on every repaint**: a category change, a re-opened dialog, a presentation-mode flip.
  `paintAccommodationPrompt()` sets `namesShown = false` unconditionally and only
  `toggleAccommodationNames()` sets it true. That is `src/roster.js`'s rule
  (`refreshSupportSurfaces()` drops its reveal) applied here: a panel that sprang back open would be a
  disclosure without the deliberate tap.
- **They cannot be reached in presentation mode.** The button is not drawn, *and* the toggle refuses —
  and the harness proves it is the refusal doing the work by calling the function directly through the
  seam with the mode on.
- Inline rather than a second dialog: a dialog opened from inside a dialog is a thing to dismiss
  twice, and `src/past-due.js` decision 3 already settled the same shape one work order earlier.
- Each name is a bare chip with **nothing else on it** — no dot, no plan, no kind glyph. The kind is
  the row's heading and is said once; repeating it per name makes each chip a sentence about a child.

### 3. Whether line 4 is deferrable — answered above.

---

## Two decisions the work order did not settle, that I made and want on the record

**A new module rather than code in `src/assignments.js`.** `src/accommodation-prompt.js` is shaped
like `src/past-due.js` — a host attribute in the markup, painted by the screen that wears it. The
deciding reason is not tidiness: this is the only place outside `src/roster.js` that reads a student's
`supports` block, and keeping it to one small file makes `wo-sweep.mjs` § 5 a short read instead of a
hunt through a 1,300-line screen module. `src/assignments.js` has **no path** to `student.supports` and
says so in its header.

**One ungated `@media print` rule.** `src/assignments.css` § THE ACCOMMODATION PROMPT NEVER PRINTS
hides `.accommodation-prompt` under print media. The three gated print blocks already hide every child
of `<body>` but their own surface, so every print the app's own buttons produce is covered; what was
left is a Ctrl+P from the keyboard with this dialog open, where the app sets no gate and the page
prints as it stands. Everywhere else that is untidy; here it is a sheet of paper with a student's
accommodations counted on it. The rule is unconditional on purpose — it hides only itself and cannot
produce a blank sheet, so there is nothing to gate — and I added a paragraph to `src/scores.css`'s
print census naming it, so a reader counting blocks does not find four against a census saying three.
That census edit is the only line I changed in a file this work order does not own, and it exists
because a stale census is the failure that paragraph is there to prevent.

---

## What I could not verify

- **Every 👤 line in `TESTING.md` § WO-3.8 is left blank.** I have no iPad. Four of them:
  whether *"Show which students"* reads as a disclosure rather than a "more" link under a thumb;
  whether the box reads as a fact about students rather than as a warning (the WO-2.11 question
  again); whether a teacher who turns presentation mode on with this dialog open can **tell** the box
  has gone; and an offline launch with `src/accommodation-prompt.js` served from `planbook-shell-v52`.
- **The third of those is a real open question, not a formality.** There is deliberately no
  replacement sentence where the box was — any placeholder ("hidden in presentation mode") says that
  something is being hidden *about this class*, which is a smaller disclosure of the same kind. I
  chose silence. Whether silence reads as "nothing applies here" is a judgement to make in the room,
  and it is the one design decision in this build I would most like overruled if it reads wrong.
- **The prose of the summary is a machine's account of a legal obligation.** *"3 students have
  extended time, 2 need a separate setting"* is produced from a twelve-row phrase table
  (`KIND_CLAUSE`), so every kind reads as English rather than as a generated "2 students have separate
  setting". I wrote those twenty-four strings; nobody who teaches has read them.

## What I did not do, and why

- **No `CHANGELOG.md` entry.** A draft is at the foot of this file.
- **No roadmap tick.** `Phase 3 → "Accommodation prompts at point of use."` is still `[ ]`, and
  `--tick` is the verifier's to run after verification, per `plans/work-orders/README.md` step 5.
- **No status change.** WO-3.8 is still `🤖 CLAIMED`; `--release` and `--tick` own that line.
- **No commit, no push.** The brief did not ask.

## Proposed follow-ups (not taken — each is outside this work order)

1. **A `closeModal` hook that lets a dialog wipe sensitive DOM at the moment it closes.** This prompt
   clears on the next paint and on a presentation-mode flip, but not at the instant the teacher taps
   Done — the same posture `src/roster.js`'s student editor has held since WO-1.8, where a closed
   dialog keeps the last student's medical note in its DOM until the next open. The general fix
   improves both and touches `src/modal.js`, which this work order does not own.
2. **`shortDate()` is still the third copy of the same eight lines**, exactly as WO-3.6 reported. I did
   not add a fourth (this module needs no dates), but the follow-up is still open.
3. **`index.html`'s assignment-editor markup near `#assignmentFields`** is clean, but the two
   `.class-hint` paragraphs under it now sit below a box that can be taller than both. If the dialog
   gets long on a phone, the hints are the thing to fold — noted rather than acted on.
4. **`tools/README.md`'s call-site/executed-check gap paragraph was stale by one work order** — it read
   `676 − 677 = −1` after WO-3.6 had already moved it to `695 − 694 = 1`. I corrected it while updating
   the number to `713 − 710 = 3`, since the paragraph is about the number this work order changes.

## Files changed

| File | What |
|---|---|
| `c:\dev\planbook\src\accommodation-prompt.js` | **New.** The prompt: the counting, the words, the names behind the tap, the presentation-mode suppression. The only file outside `src/roster.js` that reads a student's `supports` block |
| `c:\dev\planbook\src\supports.js` | `appliesToMatches()` and its private `matchWords()` / `stem()` / `covers()`, beside `parseAppliesTo()`. Nothing else touched |
| `c:\dev\planbook\src\assignments.js` | Header decision 6; `paintEditorSupports()`; `refreshAccommodationPrompt()` for the shell chain; paint calls in `renderEditorFields()` and `setAssignmentCategory()`; one clause appended to that function's `announce()` |
| `c:\dev\planbook\src\assignments.css` | § THE ACCOMMODATION PROMPT, its coarse-block rules, and § THE ACCOMMODATION PROMPT NEVER PRINTS |
| `c:\dev\planbook\src\scores.css` | One paragraph in the print census, naming the fourth `@media print` block as not a fourth print surface |
| `c:\dev\planbook\src\shell.js` | Import; two hook-census lines; the `data-accommodation-names` route; `assignments.refreshAccommodationPrompt()` in `flipPresentationMode()`; `accommodationPrompt` on the `window.planbook` seam |
| `c:\dev\planbook\index.html` | The empty `[data-accommodation-prompt]` host in `#assignmentModal`, with its comment |
| `c:\dev\planbook\sw.js` | `./src/accommodation-prompt.js` in `SHELL`; `CACHE` → `planbook-shell-v52` |
| `c:\dev\planbook\tools\verify-shell.mjs` | One new section, 18 call sites / 16 executed checks, ahead of the print-gate block |
| `c:\dev\planbook\tools\README.md` | Call-site count 695 → 713 with its WO-3.8 clause; the gap paragraph corrected to `713 − 710 = 3` |
| `c:\dev\planbook\TESTING.md` | § WO-3.8: fifteen ticked lines, four 👤 lines left blank, the fixture notes, the harness-was-wrong finding, and the three-mutation table |
| `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` | Lines 1–3 ticked with their evidence; line 4 re-homed with a `→ WO-4.4` pointer; `**Owes** WO-4.4` on the header |
| `c:\dev\planbook\plans\work-orders\phase-4-signals.md` | One new Acceptance box under WO-4.4, carrying the re-homed line |

## Mutation evidence (all three reverted; tree verified clean by `git diff`)

| Mutation | Result |
|---|---|
| the module's `supportsVisible()` guard dropped from `groupsFor()` **and** `draw()` | **`710 · 708 · 2`.** The `setSensitiveText()` funnel held what it covers — sentence blanked, chips blanked, zero kind phrases and zero names — and **the box, its scope line and the reveal button survived** (`hidden = false`, `display = flex`, 1 reveal hook, *"They apply to work in “Tests”… Show which students"*). Which is acceptance line 3 failing exactly as written: a box saying something applies here is the count with the number taken out |
| `isRealRow()` dropped, so a blank accommodation row counts | **`710 · 709 · 1`**, and only on the class that has one: *"says `1 student needs breaks, 1 has an accommodation on file.`"* One student, counted twice, over a row a mis-tap wrote |
| `appliesToMatches()` tightened to exact equality — the tidy rule, and the one that under-fires | **`710 · 704 · 6`.** The sentence drops to *"2 students have extended time"*, the reveal lists four names, and the rule table names both directions that stopped working. The invisible failure the design leans against, made visible |

---

## Draft `CHANGELOG.md` entry — the teacher's to write, or not

> **Accommodations surface where the work is written down (WO-3.8).** Writing an assignment into a
> category somebody's accommodation applies to now says so in the dialog: *"3 students have extended
> time, 2 need a separate setting."* Counts by default; **Show which students** is one tap away and
> shuts again on its own. The scope is the teacher's own words on both sides — an accommodation marked
> *tests* fires on `Tests`, `Unit Tests` and `test`, and does not fire on homework; left blank, it
> means everything. **Presentation mode takes the whole box off the screen — the names, the sentence,
> and the count**, because *"3 students have extended time"* projected onto a wall beside a roster
> narrows to individuals. None of it prints, exports, or reaches a draft.
>
> The absence half is what was measured hardest: sixteen new checks, three mutations, and the one that
> matters is the mutation that leaves the funnel in place and takes the guard out — the numbers vanish
> and the box stays, which fails the acceptance line by itself.
