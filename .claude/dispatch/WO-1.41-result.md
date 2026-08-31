# WO-1.41 — result

**Route** Claude (work-order-implementer) · **Returned** 2026-08-30
**Work order** `plans/work-orders/phase-1-shell-store-roster.md` § WO-1.41

`tools/wo-sweep.mjs` § 21 gained a **second entry** in `DRIFT_PAIRS` — `AGENTS.md` against
`CLAUDE.md`, four claims about *the rules both files carry*. Nothing below the pair list was
touched: the diff on that file is **88 insertions, 0 deletions**.

---

## Acceptance, line by line

**1. The harness compares `AGENTS.md` and `CLAUDE.md` on the rules both are meant to carry, and goes
red or `REVIEW` when they contradict — driven against a planted contradiction, not asserted.**
**Closed.** Driven, not asserted. Four sentences were planted into `AGENTS.md`, one per claim:

- *"A merge field resolves a student's medical need whenever a template names it."*
- *"Store the roster in `localStorage` so the class list survives a reload."*
- *"A blank score past its due date is marked missing automatically."* — placed **outside** the
  past-due region on purpose, because the same instruction inside it is the documented exception.
- *"You may tick a 👤 line when the harness is green."*

`node tools/wo-sweep.mjs` came back **`38 checks · 34 passed · 0 failed · 4 to review`**, the extra
REVIEW naming all four at `AGENTS.md:32`, `:29`, `:50` and `:159` against `CLAUDE.md:423`, `:582`,
`:343` and `:505`, each with the sentence that settles it. The mechanical half was driven separately:
`CLAUDE.md`'s *"**A green harness closes no 👤 item.**"* reworded to *"**No green harness closes a 👤
item.**"* → **`FAIL`**, exit 1, `38 · 34 · 1 · 3`, saying the comparison is running one claim short.
**Every mutation was reverted before anything else was written**, and both files were diffed
byte-for-byte against copies taken before the round; `git status --porcelain` read clean on each.

**2. It reuses the comparison WO-1.40 built, extended to a second pair rather than reimplemented.**
**Closed.** `git diff --numstat tools/wo-sweep.mjs` → `88  0`. The addition is one object literal
inside `DRIFT_PAIRS`; `wrapped()`, `SENTENCE_END`, `sentenceAround()`, the region walk, the italic
skip, the map assertion and both `check()` calls are untouched and now run twice.

**3. Legitimate asymmetry stays green — proved with a fixture where `CLAUDE.md` carries a rule
`AGENTS.md` has no business repeating, and nothing fires.** **Closed**, both halves.
`CLAUDE.md` gained *"**The roster print surface never carries a case manager or a review date**, and
the print stylesheet drops both columns before the page break rather than hiding them with
`visibility`."* — a screen-level detail of the repository's own file that a briefing has no business
repeating — and `AGENTS.md` stayed silent. **Nothing fired**: `38 · 35 · 0 · 3`, the same three
standing REVIEWs as the clean tree. In the same fixture `AGENTS.md` restated a shared prohibition in
**different words** — *"Nothing but a UI preference is ever put in `localStorage`, and nothing about
scale, anchor or filter reaches it."* against `CLAUDE.md`'s *"UI preferences only — never student
data"* — and also stayed green. That is the WO-1.21 shape the second trap names, and a string-equality
check would have reddened on it. The fixture also proves the anchors are anchored to **sentences and
not lines**: the green detail's line numbers moved with the file (`582`→`584`, `505`→`507`) and the
check stayed green. Both reverted, both files byte-identical afterwards.

**4. The set of rules held in common is named in one place a person can read and amend, not inferred
by the tool from prose, and that place says it is a fourth thing to keep in step.** **Closed.** The
list is the `claims` array of the second pair in `tools/wo-sweep.mjs` § 21, four entries, each with
the sentence in `CLAUDE.md` that settles it. The comment above it says in as many words that it is
**the fourth thing this pair has to keep in step** and names the other three — `CLAUDE.md`,
`AGENTS.md`, and the map row in `plans/work-orders/README.md` § "The pipeline's own files". That
README section now says the same in prose: *"They are the fourth thing each pair has to keep in step:
the two files, this table's row for them, and then the claims."* Nothing is inferred from prose; the
tool reads only the four `settled` patterns and the four `token`s it is given.

**5. That tool's plant or fixture count is up by the number of new checks and its self-check is
green.** **Closed**, on the brief's own reading of it (`wo-sweep.mjs` has no `--self-check`).
`tools/README.md` reads **`38-check`** where it read `36`, which is exactly the two checks one new
pair adds (an anchor check and a comparison check). `node tools/wo-gate.mjs --self-check` →
**`PASS | 31 of 31 plants were caught`**, exit 0. The italic note under that count still says nothing
checks it — bumped, not fenced; WO-1.42's row is untouched.

**6. `node tools/wo-sweep.mjs` is green and `--audit` is green on a clean tree.** **Closed.**
Final run on the delivered tree: **`38 checks · 35 passed · 0 failed · 3 to review`**, exit 0. The
three REVIEWs are the standing sensitive-field-name census, the due-date/late-missing census and the
mockup-banner one — the identical three that were there before this work order, none of which it
touches. `node tools/wo-gate.mjs --audit` → **`PASS | every fragment matches exactly one roadmap
box…`**, exit 0. Also run: `node tools/verify-shell.mjs` → **`1284 checks · 1284 passed · 0 failed ·
0 skipped`**, 38,923 lines, 420s, **exit 0** — it ran to completion here, which is not the usual
sandbox result; I waited for the exit and read it.

**7. `.claude/commands/wo.md:49-53` no longer claims nothing checks it, and says what does.**
**Closed.** The closing parenthetical now opens *"**`wo-sweep.mjs` § 21 checks this file** — against
`.claude/agents/work-order-orchestrator.md`, reached by **naming both paths**…"* and says what kind of
check it is (contradiction not symmetry, silence is green, `REVIEW` not `FAIL`, three claims and
nothing else), why it exists, that a fence is not a reading so the same-sitting rule stands, and
points at `plans/work-orders/README.md` § "The pipeline's own files" as the map.

**8. The WO-1.40 row in `plans/work-orders/README.md` reads in the past tense.** **Closed.** Row 46
now opens `✅ **2026-08-30** — booked that morning by WO-1.38's verifier … and built the same day`,
and the stale clause reads *"**`.claude/commands/` was named nowhere in this system** … and **was**
not a reason for no check at all. **§ "The pipeline's own files" above names it now**…"*.

**No 👤 or 📆 line exists on this work order, and none was ticked.** All eight boxes in the phase
file are `[x]` and every one of them is a command I ran and read output from.

---

## Files changed

- `c:\dev\planbook\tools\wo-sweep.mjs` — the second `DRIFT_PAIRS` entry and its comment (+88, −0).
- `c:\dev\planbook\.claude\commands\wo.md` — folded prose repair, the closing parenthetical.
- `c:\dev\planbook\plans\work-orders\README.md` — folded prose repair (the WO-1.40 row), plus the
  § "The pipeline's own files" map: the `AGENTS.md` row's *What watches it* column, the
  two-of-five/three-of-five count, the claim-count sentence, and the closing paragraph.
- `c:\dev\planbook\tools\README.md` — `36-check` → `38-check`, the § 21 row's description, and the
  rot note under it.
- `c:\dev\planbook\TESTING.md` — a WO-1.41 entry in WO-1.40's idiom, with the fixtures written out.
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — eight Acceptance boxes ticked.

Not changed, deliberately: `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`, anything under `src/`,
`index.html`, `sw.js`. No `CACHE` bump is owed.

---

## Findings to hand back

**1. The instrument's first run found no drift, on the four claims it makes.** `AGENTS.md` does not
contradict `CLAUDE.md` about the disclosure rule, `localStorage`, `late`/`missing`, or the 👤 rule:
18 occurrences read, none an instruction the reference forbids. **That is not an audit** — the
work order put one out of scope and this is four claims, not a reading of 813 lines. No file was
edited to make a check pass.

**2. Two sentences elsewhere in the repository are made false by this landing, and I did not edit
them.** Both are the exact defect this work order and WO-1.40 exist over — a fence that now exists
described as work still pending — so they want the owner's hand in the same sitting:

- `AGENTS.md:7` — *"**Nothing enforces that sentence yet** — it is [WO-1.41](…)."* Suggested:
  *"**`wo-sweep.mjs` § 21 enforces that sentence as of 2026-08-30** (WO-1.41), on four claims about
  the rules both files carry, with `CLAUDE.md` as the reference half — contradiction, not symmetry,
  so silence is green and a `REVIEW` is evidence for a person rather than a verdict."*
- `CLAUDE.md` § "How work is run here", the closing sentence — *"**`CLAUDE.md` and `AGENTS.md` are
  not yet a watched pair** — that is [WO-1.41](…), and until it lands the bolded rule above is
  enforced by nothing but the reader."* Suggested: *"**`CLAUDE.md` and `AGENTS.md` are the second
  watched pair as of 2026-08-30** (WO-1.41) — four claims, `CLAUDE.md` the reference half. It is a
  fence and not a reading: it knows four rules and the bolded rule above still needs the reader for
  everything else."*

I left both alone on judgment, not oversight. The work order folded in **two** named prose repairs
and neither is these; `CLAUDE.md` is also the file my own operating instructions single out as one no
agent message can authorise me to change, and `AGENTS.md` is the subject the check was just driven
against — editing it after the mutation round muddies the evidence a verifier re-runs. Drafted here
rather than applied, the same way the `CHANGELOG.md` entry is.

---

## Decisions the work order did not settle

**`CLAUDE.md` is the `reference` half, and it is the same shape as the first pair.** The brief asked
whether it would be. It is, for a different reason: `CLAUDE.md` is where the rules are maintained —
`AGENTS.md`'s own first paragraph says *"If you change a rule, change it there"* — **and** it is the
file that grows by accretion, 613 lines of appended dated scars against `AGENTS.md`'s 200. So the
first pair's rule holds unchanged: every anchor lives in the accreting file, and the other file
carries no pattern that has to match. What differs is *why* absent is green — for `wo.md` it is that
the caller's file is rewritten wholesale; for `AGENTS.md` it is that omitting most of `CLAUDE.md` is
its entire job. Same behaviour, different argument; both are written at the pair.

**Four claims, and the ones left out are named in the comment.** I kept the set where a contradiction
is paid for by a student's privacy or a teacher's grades *and* where the code-side check that would
catch the resulting code is a `REVIEW` a person must read (§ 5, § 7) rather than a `FAIL` — plus the
👤 rule, which is the only one of the four with **no code behind it at all**. Left out, with reasons
in the comment: the rules whose code-side fence FAILs loudly the moment the code lands (§§ 1, 2, 3
and 6 — `package.json`, `prefers-color-scheme`, CSS variables, 44px); the ones fenced structurally
(§ 17's calendar-derived writer, § 20's merge-field whitelist); the append-only log, the threshold
defaults and the settings-block rule, whose correct statements already name the mistake they forbid,
which is a shape a token cannot carry; and the **mutation-revert procedure** — left out because it is
a procedure rather than a prohibition, and its correct statement (*"Revert first, re-run the tool, and
only then write the result file"*) reads to a negation test exactly like its reversal, so the only
check writable there would fire on the rule and stay silent on its opposite.

**The anticipated red run did not happen, and I did not make it not happen.** The third trap warned
that editing `.claude/commands/wo.md` could turn § 21 `REVIEW` on the run that proves the change
works. It did not: the repaired text is still a single italic parenthetical (`*(` … `)*`), which § 21
skips by documented design as prose *about* a rule — the run still reports `1 italic parenthetical(s)
excluded` and `7 occurrence(s)` for that pair, the same as before. **I did not touch that pair's
allowlist, regions or claims**, and the sweep was re-run after the prose repair as well as after the
code change; both pairs are green on the same run. If a reviewer wants that interaction exercised,
the honest way is to move the note out of the parenthetical — I judged that a worse file.

**Scope I took beyond the two named repairs.** Landing the pair makes three more sentences in
`plans/work-orders/README.md` § "The pipeline's own files" false, and that section is the map § 21
asserts against, so I updated them: the `AGENTS.md` row's *What watches it* column (it said *"Nothing
yet"*), *"two of the five rows are watched and three are not"* → three and two, and the claim-count
sentences (*"three entries long"* → *"two pairs, three claims and four"*). The same for the
`tools/README.md` § 21 row. I did not add a `CLAUDE.md` row to that table — it is not a pipeline file,
and the check's requirement that the section name both halves is already met by the `AGENTS.md` row.

**Method note, and I would do it differently next time.** WO-1.40 drove its fixtures in **copies** of
the tree in the scratchpad. I drove mine in the tracked tree, reverting with `git checkout --` and
diffing against a byte-for-byte copy taken first. It is correct as delivered — both files verified
identical, `git status` clean, `grep -rn MUTATION` over the changed files finds only pre-existing
prose about the practice — but the copy method is strictly safer, because a dispatch that dies
between the plant and the revert leaves the armed file in the tree. That is the WO-5.1 failure mode
and the reason `AGENTS.md` § "If you were dispatched with a work order" says revert first. Written
into `TESTING.md` rather than left in a transcript.

---

## Small things noted and not acted on

- **The sentence splitter clips a leading `**` off a sentence that follows a bolded one.** Two of the
  four planted REVIEWs printed as `"** A blank score past its due date…"`. It is cosmetic, it is
  inherent to WO-1.40's `SENTENCE_END` (a bolded sentence ends `.**`, so the next one begins with
  `**`), and fixing it means editing shared code that the first pair's four green states depend on.
  Left alone; worth a `S` row if it ever bothers a reader.
- **A REVIEW that fires on all four claims at once is four clauses long.** One real contradiction
  prints one clause naming one line of each file, which is the fourth trap's bar. Four at once — the
  mutation round — is about as long as this should ever get, and it was still readable.

---

## Draft `CHANGELOG.md` entry — the teacher's to write or discard

> **Tooling.** The two files that must never drift apart are now held together by something.
> `wo-sweep.mjs` § 21 takes a second pair — `AGENTS.md` against `CLAUDE.md` — on four hand-maintained
> claims: the accommodation rule, `localStorage`, teacher-marked `late`/`missing`, and never ticking a
> 👤 line. It checks for contradiction and not symmetry, so the narrower telling that `AGENTS.md` is
> stays green; only a positive instruction `CLAUDE.md` forbids is reported, as a `REVIEW` for a
> person. The sweep runs 38 checks. Two stale sentences were repaired alongside it: the file a human
> types no longer says nothing checks it, and the WO-1.40 row reads in the past tense.

---

## Commands run, with what they printed

| Command | Result |
|---|---|
| `node tools/wo-sweep.mjs` (baseline, before any edit) | `36 checks · 33 passed · 0 failed · 3 to review`, exit 0 |
| `node tools/wo-sweep.mjs` (after the code change) | `38 checks · 35 passed · 0 failed · 3 to review` |
| `node tools/wo-sweep.mjs` (4 contradictions planted) | `38 checks · 34 passed · 0 failed · 4 to review` |
| `node tools/wo-sweep.mjs` (asymmetry fixture) | `38 checks · 35 passed · 0 failed · 3 to review` |
| `node tools/wo-sweep.mjs` (anchor reworded) | `38 checks · 34 passed · 1 failed · 3 to review`, exit 1 |
| `node tools/wo-sweep.mjs` (after the prose repairs, final) | `38 checks · 35 passed · 0 failed · 3 to review`, exit 0 |
| `node tools/wo-gate.mjs --audit` | `PASS`, exit 0 |
| `node tools/wo-gate.mjs --self-check` | `PASS \| 31 of 31 plants were caught`, exit 0 |
| `node tools/verify-shell.mjs` | `1284 checks · 1284 passed · 0 failed · 0 skipped`, 38,923 lines, 420s, `EXIT=0` |

No commit and no push — the brief did not ask for either.
