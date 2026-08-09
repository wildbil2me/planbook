# WO-3.1 — Categories & weights · implementation result

**Implementer** Claude (work-order-implementer), Opus tier
**Date** 2026-08-09
**Status left at** 🔨 IN PROGRESS — 2 of 4 Acceptance lines ticked, 2 left open on purpose
**Verification** `node tools/verify-shell.mjs` → **449 of 449, 0 failed, 0 skipped** ·
`node tools/wo-sweep.mjs` → **12 checks, 11 passed, 0 failed, 1 REVIEW** (the standing
"sensitive field names" REVIEW, unchanged at 172 mentions — `src/categories.js` adds none)

---

## 1. Against the Acceptance list, one by one

### 1. "Weights of 40/35/25 produce no warning; 40/35/20 warns and shows '95%'." — **`[x]` ticked**

**Verified, and driven through the real controls.** `tools/verify-shell.mjs` § *categories &
weights* opens the class manager, taps **Categories** on a manager row, removes the fourth starter
category through its own Remove button, types 40 / 35 / 25 into the three real weight fields
(setting `.value` and dispatching `input`, which is the path a keystroke takes through the delegated
listener), and asserts:

- no `.warn` class on `#categoryTotal`, no `⚠` in its text, `weightTotal()` = 100,
  `isProvisional()` = false, and no badge on the manager row behind the panel;
- then the third field is changed to 20 and the check asserts the banner carries the **substring
  `95%`** and the word *provisional*, `weightTotal()` = 95, `isProvisional()` = true, and the row
  badge reads exactly `weights 95%`.

The assertion is deliberately on the **number as a substring of the sentence the teacher reads**,
not on "the banner went amber" — a banner reading "these weights are invalid" satisfies every other
clause and is exactly what the deliverable forbids. Proved non-vacuous: mutating the copy to print
"these weights are invalid" instead of the total turns **three** checks red.

A third check goes with it — *"a wrong total blocks nothing"* — asserting the error line is empty
and all six fields are still enabled, because the work order's words are "don't block them, tell
them".

### 2. "The app still computes a grade while weights are wrong, and says the grade is provisional." — **left `[ ]`**

**Not met, and deliberately not attempted.** There is no grade anywhere in this app: no grade engine
(WO-3.4), no assignments UI (WO-3.3), no score grid (WO-3.5), and nothing in `src/` renders a
percentage. Building the arithmetic here would have landed it without `docs/grade-math-cases.md`,
which is the hand-computed document WO-3.4 says is deliberately its only test suite — that is the
boundary § 2b of the brief drew, and I stayed behind it.

**What I did build is the half of this line that is a property of the categories**, which the brief
identified as plainly in scope:

- `isProvisional(cls)` and `weightTotal(cls)` in `src/categories.js` — pure functions of a class
  object, no DOM, no store, no clock, exported for WO-3.4/WO-3.5 to consume. Both are read by the
  harness through `window.planbook.categories` rather than re-implemented in it, so a build where
  the banner does its own sum and the export is decorative would go red.
- The editor says it in words: *"Any grade in this class is provisional until they add up."*
- `docs/data-model.md` § Grade math now records that weights need not total 100 and that a reader
  must not assume they do (see § 5, "Decisions I made that the work order didn't settle").

**Follow-up proposed:** WO-3.5, when it renders a percentage, reads `isProvisional()` for the class
and labels the figure; the tick belongs to that work order's pass, against a real number on screen.
The reason is written into `plans/work-orders/phase-3-gradebook.md` directly under the Acceptance
list so a reader six months out does not have to reconstruct it.

### 3. "Two classes carry different category sets without interference." — **`[x]` ticked**

**Verified across the whole document, not just the two looked at.** After the class above has been
cut to three categories totalling 95, the check reads every class in the document and asserts that
the four untouched ones still hold four categories each at 100, with byte-identical name lists
against the read taken before the edits. The vacuous-pass guard is `others.length >= 4` — a check
that only asked "the edited class changed" would pass hardest on a document where nothing else
exists.

Two supporting checks: a class stored by an older build with **no `categories` key at all** (the one
the backup section restores) opens the editor, says so, and does not print a `0%` it cannot have;
and every category id in the document is `k_`-prefixed, unique, and never a name.

### 4. "Reweighting recomputes every displayed grade in that class immediately." — **left `[ ]`**

**Not met — there is no displayed grade to recompute.** Same boundary as line 2.

**What is verified is the half that has a consumer today**, and it is genuinely immediate rather
than on the next open:

- typing into a weight field redraws `#categoryTotal` on that keystroke (`renderTotal()` is called
  from `editCategoryField()`; the row itself is deliberately **not** re-rendered, or the caret would
  go with it);
- and `src/shell.js` chains `afterCategoryChange()` per keystroke so the **class-manager row behind
  the panel** re-renders with the same number;
- the same is asserted after a removal — 40.1 leaves with its category and both surfaces read 59.9%
  without anything being reopened.

Proved non-vacuous: dropping `afterCategoryChange()` from the typing chain turns **three** checks
red, with the banner right and the row a keystroke behind — which is a defect only a check reading
both surfaces can see.

**Follow-up proposed:** same as line 2 — WO-3.5's grid recomputes on the same signal and closes this
line in its own pass.

---

## 2. What I could not verify

Everything below needs a real iPad or human eyes. **None of it is ticked anywhere**, and it is
listed as `👤` in `TESTING.md` § WO-3.1:

- **The categories editor under a real thumb.** The harness measures every control in that panel at
  ≥44×44 under an emulated coarse pointer (`km` sweep), which is a measurement, not a press. The
  58px weight field and Remove-beside-a-one-glyph-arrow are the two shapes I would expect a sitting
  to find fault with.
- **Whether iPadOS offers a numeric keypad for `<input type="number">`** and whether its spinner is
  reachable with a thumb. `inputmode="decimal"` is set; I cannot observe the keyboard.
- **Legibility of the amber banner and the row badge on a projector**, which is an owner call about
  colour at distance.
- **Offline launch with `categories.js` served from the precache.** `sw.js` has the entry and
  `CACHE` is bumped to `v33`, and the harness's static precache check walks the module graph and
  confirms the file is in `SHELL` — but this harness drives a page, never an installed app, and has
  never seen a service worker.
- **The counted form of the removal warning read against real data.** "2 assignments and 3 scores"
  is exercised against a fixture written through the store, because nothing creates an assignment
  until WO-3.3. Same limit WO-1.6 recorded about its delete confirm.

I ticked no `👤` line.

---

## 3. Files changed

| File | What |
|---|---|
| `src/categories.js` | **New.** The seed, the weight arithmetic (`weightTotal`, `isBalanced`, `isProvisional`, `formatWeight`), the editor, the persistent total, and the removal confirm |
| `src/classes.js` | Seeds `starterCategories()` on a new class and **rewrites the comment that said it deliberately did not**; adds the **Categories** row button, the `class-row-warn` badge, and exports `refreshClassList()` for the chain |
| `index.html` | `#categoriesModal` and `#categoryRemoveModal` with their teacher-facing copy; the file-header line that listed categories as "deliberately still absent" replaced with what landed; one sentence added to the class-manager hint |
| `src/shell.css` | The `CATEGORIES & WEIGHTS` block, `.class-row-warn`, and **ten new selectors, every one of them named in `@media (pointer: coarse)` in the same pass** |
| `src/shell.js` | Six click hooks, one `input` hook, the `afterCategoryChange()` chain, the hook table in the file header, and `categories` on the `window.planbook` read seam |
| `sw.js` | `./src/categories.js` in `SHELL`; `CACHE` `v32` → `v33` |
| `tools/verify-shell.mjs` | New *categories & weights* section (19 checks), a coarse-pointer measurement of the panel plus a legibility/spill check (2), and one re-pointed check |
| `tools/README.md` | The check-count line: 428 → **449**, with the three checks worth knowing about |
| `TESTING.md` | New `### WO-3.1` subsection: 10 desk lines ticked, 5 `👤` lines left open, the mutation table, the touch note, and the carried-forward limit |
| `docs/data-model.md` | One paragraph in § Grade math: weights need not total 100, and what follows for the engine |
| `plans/work-orders/phase-3-gradebook.md` | Two Acceptance boxes ticked; a note under the list explaining the two left open and naming the follow-up |

Not touched, per the brief: `CHANGELOG.md` (draft below), `ROADMAP.md` (nothing to move — the phase
box stays open while the work order does), and `plans/` beyond the work order's own file.

`node tools/wo-gate.mjs --tick WO-3.1 --dry-run` agrees: *"2 of 4 Acceptance lines are still `[ ]`…
roadmap boxes left unticked and the dashboard left alone."* Status already read 🔨 IN PROGRESS, so
the real run would have written nothing and I did not make it.
`node tools/wo-gate.mjs --audit` is clean.

---

## 4. Mutations run, to prove the new checks are not vacuous

All five reverted; tabulated in `TESTING.md` § WO-3.1.

| Mutation | Result |
|---|---|
| `isBalanced()` compares `weightTotal(cls) === 100` instead of within `BALANCE_EPSILON` | **1 red** — the decimal case only |
| `newClass()` seeds `categories: []` again | **2 red**, then the section aborts with no rows to click |
| `removeCategory()` cascades unconditionally, never opening the confirm | **2 red** — the warning and the cancel |
| `afterCategoryChange()` dropped from `shell.js`'s typing chain | **3 red** |
| the warning prints "these weights are invalid" instead of the total | **3 red** |

**One of these caught a defect in my own check, which is worth recording.** The float-tolerance
check was first written with 12.5 + 87.5 — which sums to **exactly** 100 in binary — so it went
green against the strict-equality mutation and proved nothing. The set it uses now
(40.1 + 34.7 + 25.2 = 100.00000000000001) was found by search. The comment in `src/categories.js`
that had cited 12.5 + 87.5 as the motivating case was wrong for the same reason and has been
corrected.

---

## 5. Decisions the work order didn't settle, and which way I went

### 5a. Removal **warns and destroys**; it does not refuse — the brief's named judgment call

`src/classes.js`'s `removeTerm()` and `applyPreset()` **refuse** when a term still holds an
assignment: *"a grade that quietly stops counting is the worst failure this app has."* WO-3.1's
third deliverable says a removal **"warns about the assignments it takes with it."** I went with
warn-then-destroy, behind a confirm that counts, and wrote the argument at the point of departure
(`removeCategory()` in `src/categories.js`) rather than in a commit message.

The reason the refusal does not beat it here, in short: read what that refusal actually names — a
grade that stops counting **quietly**. Removing a term without cascading would leave assignments
pointing at a term id that no longer exists: still in `assignments`, still holding scores, still
looking like work, and counted by nothing. That is an orphan, and an orphan is silent. A category
removal that takes its assignments and their score columns leaves **no orphan at all** — the work is
gone, the count was on screen before the teacher agreed, and the grade changes for a reason she can
name. That is the third precedent in the same file: `openDeleteConfirm()`, which is allowed to
destroy precisely because it counts first. The term editor's refusal is untouched.

Two consequences I built to soften it: a category holding **nothing** is removed on the tap with no
dialog (there is nothing to warn about), and the confirm's own lead offers the non-destructive
alternative — *"if you only want it to stop counting, set its weight to 0"* — which is why `0` is a
first-class weight that is never silently deleted.

### 5b. Its own module, `src/categories.js`, rather than a third section of `src/classes.js`

`src/classes.js` keeps terms and says why: "which term is open" is only answerable after "which
class is open", and that resolution must live in one place. Categories ask no such question —
nothing selects a category, there is no `openCategoryId` — and that file's own header says what to
do when something under classes grows a screen: *"split then, and keep the resolution here."*
Categories arrive with a screen on day one.

**The import runs one way and cannot loop:** `classes.js` imports the seed and the arithmetic from
`categories.js`; `categories.js` imports nothing back, and `shell.js` resolves "the open class" and
hands an id down. `categories.js` carries its own four-line `findClass()` and `actionButton()` for
that reason, each with a comment saying so.

### 5c. The warning lives on **two** surfaces, not one

The deliverable says "visible, **persistent**". A banner only inside the editor is undismissable but
not persistent in the sense that matters — a teacher setting five classes up would have to open five
panels to find the one she left at 85%. So the class-manager row carries a badge reading
`weights 95%` (or `no categories`), in the warn palette, on active rows only: an archived class is
one she has put away, and complaining about its weights is complaining about a decision already
made. This is what needed `refreshClassList()` exported and `afterCategoryChange()` chained.

I considered and rejected putting it on the **home-screen class card**: that card's `signals` slot
is reserved for Phase 4 and `verify-shell.mjs` asserts it is empty of text *and* of elements. Taking
it would have been widening the work order into another phase's surface.

### 5d. A new category arrives at **0%**, not at "whatever makes the total work"

Any non-zero guess silently changes every other category's share of the grade the instant it is
added — the teacher asked for a category, not for a reweighting. 0 is the only number that leaves
the existing weights meaning what they meant a second ago. The banner goes amber at once and says
how far off the total now is, which is the prompt to type the real number. Asserted.

### 5e. Weights are stored **exactly as typed** — nothing clamps, rounds or repairs

Not a negative, not 140, not 33.33. The field is `min="0"` so the spinner will not offer one, and
the total tells the truth about the sum. The rule followed is `docs/data-model.md`'s own: *"a score
that silently isn't what you typed is the worst thing a gradebook can do."* A writer that quietly
stored something else would put the document and the field on screen into disagreement, which is the
failure rather than the protection. I considered clamping negatives and rejected it for that reason;
it is written down in the file header as decision 1.

### 5f. A tolerance of `0.005` on "does it total 100"

It is **not** a rounding rule and is far too small to be one — the smallest gap a teacher can type
into a two-decimal field is `0.01`, twice this, so it cannot mask a real gap. It exists only to stop
IEEE-754 calling a correct class wrong. `33.33 × 3 = 99.99` still warns, correctly. This is
unrelated to WO-3.2's "there is no rounding code anywhere": nothing here feeds a letter band and the
stored weight is untouched.

### 5g. The starter set

Tests 40 / Quizzes 25 / Homework 20 / Classwork 15. Four rather than three because a class arriving
usable beats a class arriving right, and **they total 100 on purpose**: a starter set that did not
add up would make the warning the default state and therefore the ignorable one. Roll Call! has no
counterpart to copy — it has no gradebook — so this is seed data chosen here, and it is data, not
policy: nothing reads these names back off a document.

### 5h. One doc block added to `docs/data-model.md`

I added a paragraph to § Grade math recording that weights need not total 100 and that a reader must
not assume they do, plus the two consequences for the grade engine. I was careful to frame both as
**falling out of the redistribution rule already there** rather than as new rules, because the
arithmetic is WO-3.4's. If the verifier reads that as legislating into WO-3.4's territory, the
paragraph is the thing to cut — but a WO-3.4 that assumes a normalised set would be a bug this work
order made possible and did not warn about.

---

## 6. Out-of-scope temptations I declined

- **The About modal's "This build" copy is stale** — it says "There is no gradebook and no
  attendance yet", which was already untrue before this work order (Phase 2 shipped). I did not
  rewrite it: it is not WO-3.1's text, and a half-rewrite of a paragraph that is wrong about two
  phases is worse than leaving one owner-visible edit to make deliberately. **Flagging it here
  because this project has a standing scar about documentation contradicting the code.**
- **A "Start from" preset row for categories**, by analogy with the term presets. The deliverable
  asks for *starter categories*, not a chooser; a second seed mechanism is a second thing to keep in
  step, and one editable set is what "trivially editable" needs.
- **A category-count on the manager row note** ("4 terms · 4 categories"). The badge that is there
  earns its place by being a warning; a count is furniture.
- **Moving an assignment between categories**, which is what would let the removal refuse instead of
  destroy. That is WO-3.3's, explicitly.
- **Any grade arithmetic at all.** Named again because it was the strongest pull in this work order:
  two Acceptance lines are sitting open and thirty lines of code would have closed them.

---

## 7. Draft `CHANGELOG.md` entry — for the teacher to accept, edit or bin

> ### Categories & weights
>
> Every class now carries its own list of grading categories — tests, quizzes, homework, whatever
> you actually put in the book — and what each one is worth. A new class starts with four that add
> up to 100%, and all of it is yours to rename, reweight, reorder or throw away.
>
> The weights are watched rather than policed. If they come to 95% instead of 100%, Planbook says
> so — in the panel and on the class list — and then gets out of the way, because half-finished is
> the normal state of a class in August. Nothing is blocked and nothing is refused; you are told the
> number, and told that any grade worked out from it is provisional until it adds up.
>
> Removing a category is the one thing here that destroys anything, so it counts what goes first —
> the assignments filed under it and their scores — and it offers you the other answer while it has
> your attention: set the weight to 0 and the category stops counting without losing the work.
