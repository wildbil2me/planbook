# WO-5.9 — The hitless draft is written but never driven · implementation result

**Status reported:** all four Acceptance lines verified. No 👤 and no 📆 lines exist on this work
order, and none was ticked. Both mutations were run for real, went red, and were **reverted by hand
immediately** — `git diff -- src/` is empty and `grep -rn MUTATION` over the delivered files is
quoted verbatim below.

---

## 1. Files changed (absolute paths)

| File | What changed |
|---|---|
| `c:\dev\planbook\tools\verify\contact-log.mjs` | The third fixture student (Cara), the two new checks, and four prose/wording updates that follow from a third student. **+188 changed lines, no app code.** |
| `c:\dev\planbook\tools\README.md` | Call-site count `1267 → 1269`; a new `**WO-5.9 moved it from 1267 to 1269**` entry and its mutation-round paragraph, in the established idiom. |
| `c:\dev\planbook\TESTING.md` | New § *WO-5.9 — The hitless draft is written but never driven*, inserted after § WO-5.6 and before `## Phase 6`. Four ticked Acceptance lines with their evidence. |
| `c:\dev\planbook\plans\work-orders\phase-5-outreach.md` | Four Acceptance boxes ticked with evidence; a *"All three held"* answer to the Traps section; a **Where this stands** paragraph. Status set to ✅ DONE — 2026-08-30 by `wo-gate.mjs --tick`. |
| `c:\dev\planbook\plans\work-orders\README.md` | Running-order row 44 rewritten from 🎒 to a ✅ entry; the Phase 5 dashboard cell's prose now names WO-5.9. *(The `9 | 7` count and the `156 | 128` totals row were written by `--tick`, not by hand — see § 6.)* |

**No file in `sw.js`'s `SHELL` was touched**, so no `CACHE` bump is owed: this work order changes no
app code, no markup and no stylesheet. `c:\dev\planbook\src\outreach-view.js` was mutated twice and
restored twice; it is byte-identical to `HEAD` and does not appear in `git status`.

**Not written, by rule:** `CHANGELOG.md` (a draft is in § 8 for the teacher to accept or rewrite).

---

## 2. Acceptance, line by line

### ☑ 1. A handoff for a student with no hit in either direction appends exactly one entry, and its `ruleId` is the empty string. — **VERIFIED**

Driven, not asked. The new block navigates home → class tab → the **register** segment → Cara's
row → `#detailActions [data-outreach-draft]` (a real DOM click through `src/shell.js`'s delegated
handler), then presses `#outreachOpen` behind the section's own one-shot capture listener.

Evidence, from the green run (`clean.txt:1400`):

```
the engine fired [] for her; 1 entr(y/ies) written, ruleId "" (string, own property = true),
the cooldown reader hands back null; the concern list went
{"rows":1,"drawn":1,"held":1,"hers":0,"hersHeld":0} → {"rows":1,"drawn":1,"held":1,"hers":0,"hersHeld":0},
rev 278 → 279
```

- **The premise is measured, not assumed**: `signals.evaluate(...)` filtered to her printed `[]`,
  and her row count in `signalsModel().all` is 0 on both sides. WO-1.33's lesson applied.
- **Empty, not undefined, not invented** is asserted as three separate facts: `hasOwnProperty` is
  true, `typeof === 'string'`, and `=== ''`.
- The draft opened `ready: true` on the `concern` tone, which is what `openOutreach()` gives a
  student with no hits, and `audience: 'guardian'`.

### ☑ 2. That contact suppresses nothing on a following signals pass — proved against a record the app wrote, not a planted one. — **VERIFIED**

Two assertions in the same check, and I want to be precise about which one carries the weight.

- **The list delta**: `signalsView.signalsModel()` is read either side of the press and is identical.
  `held > 0` is asserted alongside it so the claim is made about a list that *is* suppressing
  something at that moment (Ada's leading rule, off the two handoffs above) rather than about an
  empty model — the section's own anti-vacuity rule.
- **The reader**: `lastContactAbout(doc, CARA, entry.ruleId, todayISO())` hands back `null`. This is
  the conjunct that closes the loop, and it is asked **with the id the writer produced** rather than
  with a literal `''` this file chose — a probe for `''` could only re-prove what
  `cooldown-quiet.mjs` already proves against a planted record.

**Honest limit, stated rather than claimed away.** The *list delta* half is, on its own, insensitive
to an invented id: Cara has no hits, so nothing of hers can be suppressed whatever the id says. That
is exactly why the reader probe is in the same check, and mutation B (§ 4) confirms it — the delta
conjuncts stayed equal while the reader conjunct went red.

### ☑ 3. Both new claims are mutation-proved: restoring `hit.ruleId` without the guard, and inventing a rule id in the else branch, each turn a named check red. — **VERIFIED** (two real runs, § 4)

### ☑ 4. A handoff made from the student record shows in that screen's history immediately, without a reload. — **VERIFIED**

Evidence (`clean.txt:1401`):

```
[{"kind":"Guardian","subject":"Wo54SubjectLine — WO-5.4 Contact log","when":"Aug 30"}];
the record is open on "s_wo54cara", the draft is still up = true,
and the window still carries the mark set before the press = true
```

*"Without a reload"* is asserted rather than assumed: a property is set on `window` immediately
before the press and read back after it. A reload would drop it, and nothing else in this section
can tell a repaint from a reload — both leave one correct row on the card. The view is still
`detailView`, `openDetailStudentId()` is still Cara, and the empty sentence is gone.

---

## 3. Commands run, and what they printed

Every figure below is quoted from output I read after the process exited. Nothing here is a
prediction.

| Command | Result |
|---|---|
| `node tools/verify-shell.mjs` (before any edit) | `1282 checks · 1282 passed · 0 failed · 0 skipped`, 38,751 lines, 30.2 lines per check, 429s, **exit 0** |
| `node tools/wo-sweep.mjs` (before) | `34 checks · 31 passed · 0 failed · 3 to review` |
| `node --check tools/verify/contact-log.mjs` | `SYNTAX OK` — after one repair: backticks around `` `ruleId` `` inside a page-side comment **closed the template literal**. That is this file's own documented trap and it caught me once. |
| `node tools/verify-shell.mjs` (delivered tree) | `1284 checks · 1284 passed · 0 failed · 0 skipped`, 38,923 lines, 30.3 lines per check, 429s, **exit 0** |
| `node tools/wo-sweep.mjs` (delivered tree) | `34 checks · 31 passed · 0 failed · 3 to review` — the three reviews byte-identical to the before-run's |
| `node tools/wo-sweep.mjs \| grep call-site` | `1269 check() call site(s) across 66 harness file(s), matching tools/README.md:1053` |
| `node tools/wo-gate.mjs --tick WO-5.9` | `PASS | WO-5.9 ticked.` — status 🤖 CLAIMED → ✅ DONE — 2026-08-30 |
| `node tools/wo-gate.mjs --audit` | `PASS | every fragment matches exactly one roadmap box …` |
| `node tools/wo-gate.mjs next` | now answers **WO-1.38**, and reports WO-5.9's ride-along mark as *"spent"* |

The harness **did** run in this environment — three full runs plus two more for the mutations, all
of them read to completion. That is a green run and not a tick on anything needing hardware; no line
on this work order needs hardware.

---

## 4. The mutation round — both run, both red, both reverted

One line, `src/outreach-view.js:1097`, in two directions. The working tree was **staged first**, per
the standing note that a `git checkout` revert eats unstaged work in the same file; each revert was
made **by hand**, immediately after reading the red run, before any prose was written.

### A. The guard dropped — `ruleId: hit.ruleId, /* MUTATION */`

`1284 checks · 1282 passed · 2 failed`, **exit 1**. Both new checks red, named:

```
FAIL | a handoff for a student NO RULE HAS FIRED FOR appends exactly one entry, and its `ruleId`
       is the EMPTY STRING … :: the engine fired [] for her; 0 entr(y/ies) written, ruleId null
       (, own property = false), the cooldown reader hands back "there was no entry to ask about";
       … rev 278 → 278
FAIL | and it is on the STUDENT RECORD immediately, with no reload … :: []; the record is open on
       "s_wo54cara", the draft is still up = true, …
```

The evidence line's *silence* is the interesting half: `pressed.had` was still `true`, so the anchor
kept its `href` and the browser would still have followed the `mailto:`. The mail app opens, the
teacher writes and sends, `rev` never moves. That is the work order's first regression, reproduced.

### B. An id invented — `ruleId: hit ? hit.ruleId : 'manual', /* MUTATION */`

`1284 checks · 1283 passed · 1 failed`, **exit 1**. One check red, and **the conjunct that caught it
is not the string comparison**:

```
FAIL | a handoff for a student NO RULE HAS FIRED FOR … :: the engine fired [] for her;
       1 entr(y/ies) written, ruleId "manual" (string, own property = true),
       the cooldown reader hands back {"on":"2026-08-30","audience":"guardian"};
       the concern list went {…} → {…}, rev 279 → 280
```

`lastContactAbout()`, asked with the id the writer actually produced, hands back a live suppression
where a correct build hands back `null` — a contact that would silence a rule nobody wrote about,
caught on a record the app itself wrote. The second new check correctly did **not** fire here: the
repaint is right whatever the id says, and a mutation a check cannot express is not evidence about
it.

### The revert, verified

`git diff -- src/` prints nothing. `src/outreach-view.js` does not appear in `git status`.

---

## 5. `grep -rn MUTATION` — verbatim, run as the last act before this file

Over the delivered files:

```
$ grep -rn MUTATION tools/verify/contact-log.mjs tools/README.md TESTING.md \
      plans/work-orders/phase-5-outreach.md plans/work-orders/README.md
tools/README.md:1208:and `grep -rn MUTATION src/` was run after, not before, the revert.
tools/README.md:1245:`grep -rn MUTATION` was run over the tree after the second revert, not before it.
tools/README.md:1723:pre-WO-2.35 regexes could not see — `const WO235_MUTATION_KEYS = ['S']`, membership-tested below the
TESTING.md:3986:      run, not reasoned.** One run, one mutation per block. `const WO235_MUTATION_KEYS = ['S']`
TESTING.md:7993:mutation** in the delivered tree:* `ruleId: '', /* MUTATION */` *in* `recordHandoff()`*, sitting
TESTING.md:7998:-rn MUTATION` *found it in one command, which is the first move on a dead dispatch and has now paid
plans/work-orders/phase-5-outreach.md:902:      was reverted by hand the moment it went red, and* `grep -rn MUTATION` *was run over the tree
plans/work-orders/README.md:1698:| 23 | [WO-5.4](phase-5-outreach.md#wo-54--contact-log--history) Contact log & history | S | — | … Found by `grep -rn MUTATION`, reverted, and the check that carries that line was red at the moment of death and green after |
```

Over `src/`:

```
$ grep -rn MUTATION src/
src/shell.js:774:  A CLASS MUTATION ADDED LATER ADDS ITS LINE HERE. The cost of forgetting is a home screen showing
```

**Every hit is prose.** `tools/verify/contact-log.mjs` — the file this work order actually edits —
has none at all. The `src/shell.js` line is pre-existing English in a file I did not touch.

---

## 6. Decisions the work order did not settle, and which way I went

1. **Third student vs. "strictly after the empty-sentence check".** The Traps line offers both; I
   took the third student **and** placed the block last anyway, and said so at the point of
   departure. The reason for the belt is Ben's sentence; the reason for the braces is one the Traps
   line does not name — three checks above count contacts rather than name them (`entries === 2`,
   `inDoc === 2`), so a contact written earlier would move numbers belonging to other claims
   regardless of whose contact it is. Cara is `Ben + one guardian with an address`, because a draft
   with no addressable recipient never becomes `ready` and the handoff cannot be reached. Her id
   keeps the `s_wo54` prefix so the section's existing cleanup sweeps her without a second rule.
2. **How to prove "without a reload".** A property set on `window` immediately before the press and
   read back after it. Node identity is unusable (`renderDetail()` rebuilds the card) and "the view
   is still detailView" is true across a reload too.
3. **What to ask the reader.** `lastContactAbout()` is asked with the **entry's own** `ruleId`, not
   with `''`. This is what makes mutation B land on the reader rather than only on a string compare.
4. **Where the two checks live.** Inside § *"the contact log and the history over it (WO-5.4)"*,
   not a new section — a branch of a writer that section already drives, on a fixture it already
   installs. That is why the count moved by 2 rather than by a section's worth, and why no new
   `skip()` guard was added: the block stands on the section's existing `if (!seam)` guard.
5. **Tracker prose.** I rewrote running-order row 44 from 🎒 to ✅ and added one sentence to the
   Phase 5 dashboard cell. `--tick` moves counts, not prose, and a cell reading *"three of those
   rows are already ✅"* beside a count of 7 would be the tracker disagreeing with itself.
6. **A count the tool corrected, not me.** `--tick` rewrote the dashboard totals row `153 | 126` →
   `156 | 128`. That is +3 for one landing because the per-phase rows already summed to 156/127
   before this work order — Phase 1 had grown to 39 without the total following. I checked the
   arithmetic by hand (39+52+25+5+9+6+3+13+4 = 156; 31+51+24+3+7+4+1+6+1 = 128) and left the tool's
   numbers.

---

## 7. What I could not verify, and what I declined to do

**Nothing on this work order needs a human or a date.** It writes no app code, adds no control,
opens no stylesheet and changes no markup, so there is no 👤 reading a thumb could take and no 📆
line waiting on a term. I ticked four boxes and every one of them names output I read.

The standing caveat still applies and is not a gap in this work order: `verify-shell.mjs` drives a
page, not an installed PWA, and has never seen a service worker.

**Out of scope, declined, and worth someone's attention later:**

- **The praise-side twin of this branch is still undriven.** `hitFor()` is called with
  `tone === 'praise' ? 'praise' : 'concern'`, so a student with *only* a praise hit, drafted on the
  concern tone, also takes the false branch — a second reachable path with a different premise
  (hits exist, just not in this direction). WO-5.9's Deliverables say *"no rule has fired"*, so I
  built that and left this. It is an hour in the same file.
- **The invented-id danger's later half.** An invented id only silences something once a rule
  *starts* firing for that student. My check catches the invention through the reader instead of by
  waiting for a rule; a fixture that gave Cara a rule after her contact would prove the consequence
  as well as the cause, at the cost of a second fixture mutation mid-section.
- **`tools/README.md` still has no WO-5.4 entry for its own seventeen sites.** The count line was
  moved 1250 → 1267 and the explanatory paragraph was never written — that dispatch died. I recorded
  the fact in one clause inside my own entry (the precedent is WO-1.33's, which did the same for
  WO-5.1's 1179) but did **not** write WO-5.4's paragraph, because those are not my figures to
  reconstruct. Someone with that run's output should write it.
- **The three `TO REVIEW` items in `wo-sweep.mjs`** are unchanged and pre-existing; I did not touch
  them.

---

## 8. Draft `CHANGELOG.md` entry — for the teacher to accept, rewrite or discard

> **Verification** — The contact log's writer and the cooldown's reader had each been tested against
> a hand-made counterpart and never against each other. Writing home about a student nothing has
> flagged takes a branch of `recordHandoff()` no check had ever driven — the branch that records
> *"this message was about no particular signal"* — and two regressions passed the whole harness: one
> that opens the mail app and logs nothing at all, and one that quietly silences a signal nobody ever
> wrote about. Both are now caught. No change to the app.

---

*Written 2026-08-30 by the WO-5.9 implementer dispatch, as its last act. Both mutations reverted and
verified reverted before this file was opened.*
