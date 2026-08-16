# WO-1.20 — the retired phase-branch rule is still live in ROADMAP.md and TESTING.md · result

**Route** Claude Opus (work-order-implementer) · **Date** 2026-08-16 · **Tree** `main`, nothing
committed and nothing pushed — the brief did not ask for it.

**Status written** `✅ DONE — 2026-08-16`, by `wo-gate.mjs --tick WO-1.20` after all four Acceptance
lines were closed. Dashboard moved with it: Phase 1 `18 → 19`, overall `73 → 74` (68% → 69%).

---

## The decision the work order refused to pre-decide: the per-phase `Branch:` headers

**I removed all eight**, and wrote the reasoning in `plans/work-orders/README.md` § *How to use one*
step 3 — the step that already carried WO-1.19's half of the same decision, so both halves now sit
in one place. A one-line pointer to it is left in `phase-1-shell-store-roster.md`'s own header,
where the first of the eight stood.

Two arguments decided it, and the second is the one that actually settled it.

1. **No single tense fitted, so "tense, not deletion" had nothing to offer here.** Phases 1–3 named
   a branch that existed and was deleted on 2026-08-15 — that could have gone into the past tense.
   Phases 4–8 named a branch that was **never cut**, so there is no past tense available: writing
   "work landed on `phase/5-outreach`" would be a new false sentence, not a preserved true one.
   Eight headers in two voices read worse than none, and the history the Traps protect is not in
   these headers anyway — it is in `CHANGELOG.md`, in WO-1.19's decision record, and in
   `README.md`'s note on where WO-1.13 landed, all of which I left untouched.

2. **The answer is now identical for every phase, and copying it eight times would guarantee this
   work order a successor.** WO-1.20 exists precisely because WO-1.19 fixed the two files it knew
   about and the rule turned out to be written in six. Writing "work lands on `main`" into eight
   more headers recreates that failure mode with a larger `n`: when Ship 3 settles branching — which
   WO-1.19 deliberately left open and which is this work order's Out of scope — someone would have
   eight headers to find. With the answer in step 3 only, that is one line.

**The cost, stated plainly.** A reader who opens, say, `phase-6-calendar-glance.md` cold in October
to start Phase 6 now finds no answer to "where does this work go?" in that file; they have to reach
`README.md` one level up, which is the file `CLAUDE.md` points at and which every dispatched agent
reads. I judged that acceptable — but it is a real trade and the alternative (a one-line pointer in
each of the eight) is defensible. If the owner prefers the eight pointers, it is a five-minute
change and step 3's note explains why it was not done that way.

I did **not** re-argue revive-versus-retire anywhere. Every new sentence points at WO-1.19 and the
owner's 2026-08-15 call as settled, and both the `ROADMAP.md` and `README.md` notes carry forward
CLAUDE.md's caveat verbatim in substance — this settles the current sprint and **not branching in
general**.

---

## Against the Acceptance list, one at a time

### 1. `grep -rn "phase branch\|phase/<n>" plans/ROADMAP.md TESTING.md` returns nothing that states or assumes the retired convention — ✅ ticked

I ran the grep verbatim. **It is not empty, and the Acceptance line does not require it to be** — it
grades on "states or assumes." Four hits survive and I have read each; all four are past tense:

```
plans/ROADMAP.md:520:  state always exists. *(Phase branches `phase/<n>-<slug>` were the rule here until 2026-08-15,
TESTING.md:4:gate. *(This said "run this before merging any phase branch" until 2026-08-16, and named an event
TESTING.md:5:that can no longer occur: phase branches were retired the day before — WO-1.19, the owner's call —
TESTING.md:8:of setting a third rule. Ticked boxes below that mention a phase branch are history and stay as
TESTING.md:205:- [x] `git log` shows a first commit on `main` and a phase branch cut from it.
```

- `ROADMAP.md:520` and `TESTING.md:4–8` are **the retirement notes themselves**, which name the old
  wording in order to record that it went. That is the same move `CLAUDE.md`'s Git bullet makes —
  line 180 there contains the words "cannot sit on one phase branch" — and the brief told me to
  match that voice.
- `TESTING.md:205` is WO-1.1's **ticked** check on what `git log` showed in August 2026. History,
  exempt, and left exactly as written. `TESTING.md:8` exists partly to tell a reader that.

**Both live rules are gone.** `ROADMAP.md:516`'s gate no longer says "before merging any phase
branch," and `ROADMAP.md:519`'s standing rule no longer prescribes `phase/<n>-<slug>`.

*If the verifier reads this line as requiring literally zero grep output, it fails — I want that
said here rather than discovered. I read it as written and kept the historical record, because
deleting the record is what the Traps forbid.*

### 2. No file in the repository instructs a reader to work on, merge, or wait on a phase branch — ✅ ticked

I swept the whole tree rather than the two files: `grep -i "branch"` across everything tracked, plus
a targeted pass on `phase/[0-9]`, `phase/<n>` and `^Branch:`. Sorted into the three piles the brief
asked for.

**Pile A — live rules or instructions. Three found, three fixed:**

| Where | Was | Now |
|---|---|---|
| `plans/ROADMAP.md:516` | "Run `TESTING.md` before merging any phase branch" | "Run a work order's own `TESTING.md` lines when it lands, and the whole sheet before a ship" |
| `TESTING.md:3` | "Run this before merging any phase branch." | same two cadences, plus a dated note on why it changed |
| `plans/work-orders/phase-8-packaging.md:346` | "nothing deploys while the work is sitting on a phase branch" | "**every push to `main` is a production deploy** — there is no branch to stage on" |
| `plans/ROADMAP.md:519` | "phase branches `phase/<n>-<slug>`… Delete once merged." | "One integration branch, `main`. Work lands on it directly and it is what deploys" + pointer to WO-1.19 |
| eight `Branch:` headers | `Branch: phase/<n>-<slug>.` | removed — see the decision section above |

The `phase-8-packaging.md` one is worth flagging: the old sentence was **reassurance** ("nothing
deploys") and the true sentence today is a **warning** ("every push deploys"). The meaning inverted,
so I rewrote it rather than striking it, and noted the inversion in place. It sits inside a `[x]`
step, but the work order names that file as a Deliverable, so I treated it as in scope despite the
tick.

**Pile B — historical record. Left alone, or already past tense before I arrived:**
`plans/work-orders/gates.md:171–172` (WO-G1's ticked lines), `phase-1-shell-store-roster.md:25`
(WO-1.1's Deliverable) and `:36` (its ticked Acceptance), `TESTING.md:205`,
`plans/work-orders/README.md:194` ("The work landed on `phase/2-attendance`…" — WO-1.19 already put
that in the past tense and it is the model I followed).

**Pile C — decision records. Not touched at all:** `CHANGELOG.md` (out of scope, and the Traps name
it), WO-1.19's entire body in `phase-1-shell-store-roster.md:1201–1320`, and `CLAUDE.md`'s Git
bullet, which is already correct.

**One judgment call inside pile B, which I want on the record.** `.claude/dispatch/` holds closed
briefs and results that *do* speak in the imperative — `WO-1.2-brief.md:5` reads *"**Branch**
`phase/1-shell-store-roster` — work on the phase branch, not a branch per work order."* Read
literally, that is a file instructing a reader to work on a phase branch. **I left every dispatch
file untouched.** They are dated records of what a work order was told in August, the Acceptance
line exempts "closed work orders," and editing one to agree with a later decision is exactly the
offence the Traps name for `CHANGELOG.md`. If the verifier's reading of "no file in the repository"
includes closed dispatch briefs, this line is not met and I would rather say so than paper over it.

### 3. The per-phase `Branch:` headers were decided deliberately, and the reasoning is written down wherever they ended up — ✅ ticked

`grep -rn "^Branch:" plans/` now returns nothing; all eight are gone. The reasoning is at
`plans/work-orders/README.md` step 3 (both arguments, the date, and the WO number), with the pointer
at `plans/work-orders/phase-1-shell-store-roster.md:5–8`. The full weighing, including the cost I
accepted, is in the decision section at the top of this report.

### 4. `node tools/wo-gate.mjs --audit` passes — ✅ ticked

Run after the last edit. Exit 0:

```
PASS | every fragment matches exactly one roadmap box, every **Owes** pointer lands on an open box,
and every dashboard row matches its own boxes.
```

All nine phase rows and the overall row `42/82` reconcile. I also ran it *before* applying `--tick`,
so the tick was taken against a green audit rather than predicted.

---

## The two harness runs, from output I read

**`node tools/wo-sweep.mjs` — green, exit 0.**

```
20 checks · 18 passed · 0 failed · 2 to review
```

The two REVIEW items ("sensitive field names outside `src/backup.js`", "due-date and late/missing on
the same line") are **byte-identical to the baseline I took before touching anything** — same file
lists, same 297 count. This work order changed no `src/` file, so neither moved.

**`node tools/verify-shell.mjs` — it ran here, and it passed. Exit code 0.**

```
================ SUMMARY ================
795 checks · 795 passed · 0 failed · 0 skipped
21,302 lines · 26.8 lines per check · 255s
```

It took 255 seconds; I backgrounded it, waited for the exit notification, and read the summary out
of the log before writing this. Contrary to the standing note that the harness cannot run in a
sandboxed agent, this run completed — but it measures nothing of mine either way: WO-1.20 touched no
app code, no stylesheet and no `sw.js`, so this is evidence that I broke nothing, not evidence that I
built something. `wo-sweep`'s "every SHELL file change is paired with a CACHE bump" check confirms
the same from the other side: *"planbook-shell-v71 was set at 9437699; no SHELL file has changed
since."*

**No 👤 line is ticked and none is involved.** This work order has no device-facing surface, so it
owes nothing to an iPad. I added no `TESTING.md` section for WO-1.20 — following WO-1.19's
precedent, which added none either: a process work order with no roadmap box has nothing a human can
run on hardware, and a checklist entry that cannot be executed is the kind of dead line this pair of
work orders exists to remove. Flagging it because `README.md` step 4 says to move Acceptance lines
into `TESTING.md` as a general rule.

---

## Files changed (11)

- `c:\dev\planbook\TESTING.md` — regression-gate first sentence
- `c:\dev\planbook\plans\ROADMAP.md` — § Cross-cutting rules, both bullets
- `c:\dev\planbook\plans\work-orders\README.md` — step 3 reasoning; dashboard row (by `--tick`)
- `c:\dev\planbook\plans\work-orders\phase-1-shell-store-roster.md` — header, WO-1.20 status + four Acceptance ticks
- `c:\dev\planbook\plans\work-orders\phase-2-attendance.md` — header
- `c:\dev\planbook\plans\work-orders\phase-3-gradebook.md` — header
- `c:\dev\planbook\plans\work-orders\phase-4-signals.md` — header
- `c:\dev\planbook\plans\work-orders\phase-5-outreach.md` — header
- `c:\dev\planbook\plans\work-orders\phase-6-calendar-glance.md` — header
- `c:\dev\planbook\plans\work-orders\phase-7-sync.md` — header
- `c:\dev\planbook\plans\work-orders\phase-8-packaging.md` — header + the Cloudflare Pages note

`git diff --stat`: **11 files, 75 insertions, 37 deletions.** No whole-file rewrite, no line-ending
churn — the six pure header removals show `1 +/1 -` each, which is the tell that nothing else moved.

---

## Decisions the work order did not settle, and which way I went

1. **What replaces "before merging any phase branch" as the `TESTING.md` gate.** The Deliverable says
   only that it must "name something that can happen." My first draft said **"before every deploy"**
   and I threw it out: with `main` as the Pages production branch, every push deploys, so that rule
   demands a full 200-check manual sheet several times a week. Nobody would follow it — which is the
   exact defect WO-1.19 and WO-1.20 exist to remove, re-created in the act of removing it. What I
   wrote instead names the two cadences the documents **already** describe between them —
   `TESTING.md` § *How to use it* step 1 ("when a work order lands, copy its Acceptance lines… and
   run them") and the 1.0 gate row in `ROADMAP.md` ("`TESTING.md` fully checked, on desktop and a
   real iPad"). So the sentence now agrees with two existing rules rather than inventing a third.
   Both `ROADMAP.md:516` and `TESTING.md:3` say it the same way.

2. **Whether to edit `plans/work-orders/phase-8-packaging.md` at all**, given the step is `[x]` and
   therefore arguably history. I edited it: the work order names the file in its Deliverables, and
   the sentence is not a record of a past state but standing guidance about a live Cloudflare
   project. Kept the old wording inline so the change is legible.

3. **Whether closed dispatch briefs count.** Left alone — reasoning under Acceptance line 2.

## Temptations declined, noted rather than acted on

- **`plans/work-orders/README.md:164`** — the file index still reads
  `phase-1-shell-store-roster.md | WO-1.1 … WO-1.19`, but that file now holds WO-1.20 and WO-1.21
  (both booked 2026-08-15). It is a one-token fix in a file I already had open. **I did not make
  it**: it is not in the Deliverables, it is not the phase-branch rule, and it predates this
  dispatch. Worth booking as a line in whatever tracker-hygiene work order comes next — WO-1.21 is
  already about the tracker being wrong about itself and would be a natural home.
- **`git commit`** — not run. The brief did not ask.
- **Ship 3's branching shape** — explicitly Out of scope and the owner's call. Both new notes point
  forward to it without proposing anything.

## Draft `CHANGELOG.md` entry — for the teacher to accept, reword or discard

> **Changed** — Finished retiring phase branches. WO-1.19 rewrote the two files it knew about;
> the rule turned out to be written in six. `plans/ROADMAP.md` § Cross-cutting rules no longer
> prescribes `phase/<n>-<slug>`, and the `TESTING.md` gate — in both copies — now names a work order
> landing and a ship instead of a merge that cannot happen. The Cloudflare Pages note in
> `phase-8-packaging.md` said nothing deploys from a phase branch; with `main` as the production
> branch that reassurance had become its opposite, and it now says so. The `Branch:` header on all
> eight phase files is gone, with the reasoning in `plans/work-orders/README.md` § How to use one —
> one copy, because eight would guarantee a third round of this. Nothing about the 2026-08-15
> decision was reopened, and no historical note describing work that did land on a phase branch was
> touched.
