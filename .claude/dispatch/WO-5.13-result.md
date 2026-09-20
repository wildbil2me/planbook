# WO-5.13 — Every template, whatever the recipient · implementation result

**Implementer** Claude (Opus), 2026-09-20 · **Status handed back** 🤖 CLAIMED (unchanged — I ran
neither `--start`, `--release` nor `--tick`; the two Acceptance boxes are hand-ticked in the phase
file, which `AGENTS.md` § "If you were dispatched with a work order" allows).

**Both tools green on the delivered tree.**

- `node tools/verify-shell.mjs` → `1422 checks · 1422 passed · 0 failed · 0 skipped`, `EXIT=0`.
  A before-run on the untouched tree at the top of the sitting printed the same line
  (`1422 checks · 1422 passed · 0 failed · 0 skipped`, exit 0), which is what I expected: three
  claims were **rewritten**, none added or deleted.
- `node tools/wo-sweep.mjs` → `42 checks · 39 passed · 0 failed · 3 to review`. The three
  to-review items are the standing ones (sensitive field names outside `src/backup.js`, due-date
  and late/missing on one line, the two mockup banners) and are unchanged by this work.
  **It failed once before I bumped `CACHE`** — *"src/outreach-view.js, src/templates.js changed
  since planbook-shell-v121"* — so `sw.js` is v121 → **v122**.
- `node tools/wo-gate.mjs --audit` → PASS. `node tools/wo-gate.mjs WO-5.13` → `PASS | gates clear`.

---

## Acceptance, line by line

### 1. `[x]` Every saved template is offered whatever the recipient is; a concern template is still never offered for a praise draft.

**Ticked.** Evidence, in the order it was taken:

- **The code.** All four send-flow call sites in `src/outreach-view.js` now read
  `templates.templatesFor(doc, tone, '')` — `outreachModel()` (the send-time read),
  `openOutreach()`, `applyTone()` and `applyRecipient()`. `src/templates.js` did not move:
  `templatesFor()` keeps its signature and still filters on both arguments when it is asked to.
- **The picker on screen**, which is where I actually closed this. `tools/verify/outreach.mjs`,
  rewritten check: with the draft **still addressed to guardian 1** (`to: "guardian-0"`,
  `audience: "guardian"`), tapping *Concern* draws **two** rows —
  `["WO-5.3 concern to a guardian", "WO-5.3 to the counselor"]` — where the three praise templates
  were, and no praise template survives the tap. The counselor's template being offered for a
  guardian's draft is the first half of the line; the absence of any praise template is the second.
  Green in the delivered run, quoted from its own evidence string.
- **The numbers beside it.** The same check's first half: the collection still answers
  praise/guardian 3, concern/guardian 1, concern/counselor 1, praise/counselor **0** (WO-5.2's
  numbers, untouched), and the send flow's own read answers concern/any-audience **2**,
  praise/any-audience **3**, with **0** records shared across the two tones.
- **Mutation-proved, both halves, in scratch copies of the tree** (`tools/README.md`'s WO-5.12
  method — an exact string replacement that aborts unless the target occurs exactly once, applied
  to a copy under the scratchpad, so no delivered file ever carried a mutation):

  | # | Mutation | Predicted | Result |
  |---|---|---|---|
  | M1 | `outreachModel()`: `templatesFor(doc, tone, '')` → `templatesFor(doc, tone, audience)` — the filter put back | picker check red; silent-rebuild check red | **2 red**, exactly those two: `1422 checks · 1420 passed · 2 failed`, exit 1. The picker drew `["WO-5.3 concern to a guardian"]` |
  | M2 | `outreachModel()`: `templatesFor(doc, tone, '')` → `templatesFor(doc, '', '')` — the tone half dropped too | picker check red on its praise half | **1 red**: `1422 checks · 1421 passed · 1 failed`, exit 1. The picker drew all five templates after a *Concern* tap |

  Nothing else in either run moved. `grep -rn MUTATION` over the working tree returns only
  pre-existing prose about earlier mutation rounds, and `git diff -U0 -- src/ tools/ sw.js` adds no
  line containing the word.

### 2. `[x]` WO-5.2's first Acceptance line, WO-5.3's seventh, both `TESTING.md` twins and `docs/data-model.md` all record the reversal, amended in place rather than left disagreeing.

**Ticked.** Five documents, **no box unticked and no ticked line deleted**:

- `plans/work-orders/phase-5-outreach.md` **WO-5.2's first Acceptance line** — `[x]` kept, original
  sentence kept, a third note added saying which half was reversed, that the collection claim is
  untouched and still measured, and that the tone half stands.
- `plans/work-orders/phase-5-outreach.md` **WO-5.3's seventh** — `[x]` kept. The line's own text
  names the rule ("with both arguments, never audience alone"), so it carries a dated marker on the
  line itself — ***Half-reversed on 2026-09-20 by WO-5.13*** — pointing at a third note that gives
  the reversal in full, including the behaviour change on the recipient chip and where the evidence
  now lives. The 2026-08-28 sentences are left standing as the record of what that box closed on.
- `TESTING.md` § WO-5.2's twin and § WO-5.3's twin — the same treatment, each with the numbers the
  harness reads today.
- `docs/data-model.md` § "Where a template is written" — the sentence calling `templatesFor()`
  "the question the send flow asks" rewritten, plus a paragraph on what changed and what did not.
- **One the line does not name:** `plans/ROADMAP.md`'s Phase 5 line for WO-5.2 stated the rule a
  fourth time ("filters on both … so the send flow cannot offer the wrong one"). Amended in the
  same sitting, one sentence.
- **Two code comments** that asserted the old rule went with them: `src/templates.js`'s module
  header ("which templates are there for this tone **and this audience**") and the block over
  `templatesFor()` itself. A comment left asserting the reversed rule is the same disagreement one
  file further in.

Also written: **`TESTING.md` § WO-5.13**, a new section on the Phase 5 list after § WO-5.12, with
both Acceptance boxes ticked, the tool figures, the three rewritten harness claims, the two
sentences on screen (and the third — see below), and the mutation table.

---

## Nothing I could not close

Neither Acceptance line carries 👤 or 📆, and I did not tick anything that needed hardware. **No
iPad reading was taken** and none is owed by this work order's own lines — but two things here are
strings on a small screen, and if the owner is on hardware for another reason they are worth a
glance: the note under the template picker now reads *"3 templates in the concern tone — all of
them, whoever this is going to."* (longer than the sentence it replaced, on a 390px modal), and the
rebuild confirm's lead lost four words. Neither is a box in this work order and I have not written
one.

---

## Decisions the work order did not settle

1. **`templatesFor(doc, tone, '')` rather than `templatesFor(doc, tone)`.** The work order says the
   flow "simply stops passing the third argument", which reads like a two-argument call; `''` is
   what `src/templates-view.js:302` has always passed and what the function's own prose documents as
   "every audience of that dimension". I passed `''` explicitly at all four sites: it is
   self-documenting at the call and matches the one call site that was already correct. An omitted
   argument would behave identically (`String(undefined || '')`).
2. **A third sentence was reworded, and the work order named only two.** The recipient rebuild
   confirm said *"Writing to Guardian 1 instead rebuilds this draft **from a template written for
   them**."* That is false the moment the filter goes — it is the same template now, re-resolved for
   somebody else — so the clause came off and the warning is otherwise untouched. It is the same
   class of staleness as the two the Deliverables name ("both go stale the moment the filter does"),
   which is why I treated it as inside the work rather than as scope growth. The dialog still quotes
   the chip's position and never the person; `verify/outreach.mjs`'s "panel names nobody" check
   still reads `/Guardian 1/` off the lead and is green.
3. **The audience left the picker note entirely** rather than being named beside a list it no longer
   describes. The work order says `model.audience` "still feeds the note under the picker"; after
   the rewording it does not, and it still feeds `writeContact()` via `recordHandoff()`, which is
   the load-bearing half of that sentence. Naming a recipient on a line that counts an unfiltered
   list would read as a filter that is not there.
4. **`applyRecipient()` keeps its `templatesFor()` call and its guard**, rather than dropping both
   now that the list cannot change on a recipient switch. The guard is the one line that answers a
   selection that has genuinely stopped being on offer — nothing saved in that tone, or a template
   deleted on the other screen while the modal is open — and the work order asked for four call
   sites with the argument dropped, not three call sites and a deletion.
5. **`applyTone()` lost its `const model = outreachModel()`** line: with the audience gone the model
   was being built only to be asked for `model.audience`. Noted because it is a deleted line the
   work order did not ask for.

---

## One correction to the work order's Traps line

> `tools/verify/templates.mjs:420` asserts the audience filter and **will go red on work being
> done**.

**It did not, and it could not.** That check calls `templatesFor()` **directly** in `evalJs` rather
than through the view, so it measures the collection — which this work order deliberately does not
touch — and it stayed green through the delivered run and through **both** mutations. What actually
went red is the picker check one file over, in `verify/outreach.mjs`. I followed the Traps line's
*intent* rather than its prediction:

- `verify/templates.mjs` § Acceptance line 1: **no assertion changed**. Its prose claimed it was
  asking "the question WO-5.3 will ask from the signal card", which is no longer true; it now says
  it is asking the collection, that the numbers survived WO-5.13 unchanged, and that the send
  flow's own read is measured in `verify/outreach.mjs`. A stale sentence over a green check is
  exactly the shape this repo's § 21 prose fences exist for.
- `verify/outreach.mjs:391-417`: rewritten as the Traps line asks — the tone half **and the absence
  of the audience half** — as two claims about two different things (the collection, then the send
  flow), with the picker check beside them as the one that can tell the two builds apart. Nothing
  deleted.
- A **third** harness claim went red on work being done and the work order did not predict it: the
  silent-rebuild check (`Acceptance line 3`) asserted "three different templates, three different
  bodies", where the third step is a recipient switch that used to swap the template. It now asserts
  the third step's template **equals** the second's — survival, which is a positive statement of the
  new rule — with two bodies across the three steps and the third rebuild witnessed by its status
  line. Rewritten, not deleted.
- **`tools/README.md`'s call-site count did not move**: no `check(` call site was added or removed,
  and the sweep confirms `1413 call site(s) … matching tools/README.md:1213`. Trap 3 costs nothing
  here, which I verified rather than assumed.

---

## Temptations declined

- **Widening `AUDIENCES` or removing `audienceOf()`** — the work order forbids both and
  `wo-sweep.mjs` § 24 pins the export. Untouched.
- **`CLAUDE.md:206`** — left alone, as the Traps line says: it is the WO-6.6 class-tab ruling that
  templates are global, not this filter.
- **Anything of WO-5.8** — no multi-select, no primary recipient, no change to
  `recipientsFor()`/`recipientByKey()`.
- **Deleting the now-nearly-unreachable guard in `applyRecipient()`** — see decision 4.
- **A new harness check for the four call sites** (a grep-style structural claim that no send-flow
  call passes a third argument). The picker check covers the behaviour, and adding a call site would
  have moved `tools/README.md`'s figure for no new information. If a later hand wants belt and
  braces, that is the shape it would take — I did not build it, per "do not write a second harness".

---

## Files changed

- `c:\dev\planbook\src\outreach-view.js` — four call sites, two on-screen sentences (plus the
  confirm lead), five comment blocks.
- `c:\dev\planbook\src\templates.js` — two comments only; **no code change**.
- `c:\dev\planbook\sw.js` — `CACHE` `planbook-shell-v121` → `planbook-shell-v122`.
- `c:\dev\planbook\tools\verify\outreach.mjs` — three claims rewritten (the pairs check, the picker
  check, the silent-rebuild check), no call site added or removed.
- `c:\dev\planbook\tools\verify\templates.mjs` — prose only; **no assertion changed**.
- `c:\dev\planbook\plans\work-orders\phase-5-outreach.md` — WO-5.2's first and WO-5.3's seventh
  amended in place; WO-5.13's two Acceptance boxes ticked with their evidence.
- `c:\dev\planbook\TESTING.md` — both twins amended; new § WO-5.13.
- `c:\dev\planbook\docs\data-model.md` — § "Where a template is written".
- `c:\dev\planbook\plans\ROADMAP.md` — one Phase 5 line.

Not committed, not pushed — the brief did not say to.

---

## Draft `CHANGELOG.md` entry — for the teacher to write or discard

> **Every template, whatever the recipient.** The draft window used to show only the templates
> written for whoever the message was going to, so a good note about missing work had to be written
> again for the counselor. Now every template you have saved in that tone is on the list, and the
> one you picked stays picked when you change who it goes to — it is just re-addressed. Concern and
> praise are still kept apart: a concern template is never offered for a praise draft.
