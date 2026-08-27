# WO-1.28 — a dependency waiting on the calendar blocks work that is ready to build · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.28-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, **Opus** tier. The deciding signal is that this **establishes a
convention** — it invents a mark every later phase file will copy, and documents it in prose in
`plans/work-orders/README.md` and `plans/verification-tooling.md`. Set aside: `wo-gate.mjs` is a
dependency-free Node script with `--self-check` plants for acceptance, which reads Codex-shaped —
but four paragraphs of this work order argue *which mechanism this is not*, and the tidy
implementation it forbids (a `**Soft depends on**` header field) is exactly the one a code-first
model reaches for.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.28 — a dependency waiting on the calendar blocks work that is ready to build

**Ship** — · **Status** 🤖 CLAIMED — 2026-08-26 · **Size** M · **Depends on** — · **Blocks** WO-4.5 today, and
WO-6.4 in three weeks when WO-4.5 does the same thing to it
**Closes roadmap** Phase 1 → *(no box. Tooling, not app — `wo-gate.mjs` is not a promise the roadmap
makes, the way WO-2.14, WO-2.15, WO-1.26 and WO-1.27 are not. Booked 2026-08-25, owner-directed,
found when WO-4.5's gate refused a dependency that has shipped every line of code it owes.)*

**Why it exists.** `node tools/wo-gate.mjs WO-4.5` reports
`FAIL | dependency WO-4.3 is 🔨 IN PROGRESS, not ✅ DONE`. WO-4.3's code landed 2026-08-24 and its
👤 sitting was green on the 25th. **One box is open and no build can close it** — *"Running the praise
list two weeks apart on real data surfaces a materially different set of students"* — which needs a
fortnight of a term that starts Sep 2.

WO-4.5 needs exactly one thing from WO-4.3: its praise rules, so the quiet middle can exclude anyone
*praised*. Those exist. **The gate reads status where the question is substance**, and refuses a work
order that is ready to build.

**§ Ship 3 already knew this and said so in prose.** *"Rows 4 and 5 are rowed twice on purpose —
built before the term, closed after it,"* and it rows WO-4.5 for Sep 12–13, deliberately while
WO-4.3 is still open on its Sep 16 box. **The running order anticipated the case and the tool cannot
express it** — the same shape as WO-1.27, where a rule the README states is enforced in half the
parser.

***The mechanism this is NOT, and the argument has to be made or it will be re-derived.***
`wo-gate.mjs:476` states the existing answer at its own point of decision: *"a dependency that landed
with lines owed elsewhere is ✅ DONE plus `**Owes**`, so it stops gating its dependents while still
saying what it owes."* That is WO-3.11's mechanism and it is the right one **for the case it was
built for**. It does not fit here, for one narrow reason: **`**Owes**` means another work order will
do this work.** § "Header fields" requires each pointer to land on exactly one open box under a named
target, and `--audit` resolves every one. WO-4.3's box is not work anyone else does — it is the same
work, waiting on the calendar. **Re-homing it to WO-G3 would be inventing a debtor to satisfy a
parser**, and it would put the box under the one work order that must not be able to open without it.

**The mechanism is a mark on the box, not a field in the header.** A line no build can close carries
a mark, exactly as 👤 marks a line no headless browser can close. *Code-complete* is then **derived
from the boxes** rather than asserted by a hand. That is the whole design decision: a header field —
`**Soft depends on**`, or any spelling of it — is an assertion that drifts from the boxes it
describes, and § "Header fields" already records three fields invented by a hand and absorbed in
silence. A derived answer cannot drift, because there is nothing to drift from.

**The rule, in one sentence.** A dependency that is 🔨 IN PROGRESS and whose every **open** Acceptance
line is marked reports as *code-complete* with a NOTE naming the outstanding lines, instead of
refusing.

**Traps** — each of these is a way the mark eats something it must not.

- **A gate work order never accepts a marked dependency.** WO-G3 exists precisely to check what the
  mark defers; if WO-G3 could open on one, the mark has eaten the gate. **This is the load-bearing
  rule of the work order** and the one its acceptance proves twice, in both directions, on the same
  tree in the same run.
- **The mark must never let `--tick` close the line.** It changes *dependency gating* and nothing
  else. 👤 already has this shape — a marked line stays `- [ ]` on a green harness — and the two must
  behave identically at tick time or the mark becomes a way to close a box by describing it.
- **Only 🔨 qualifies, never ⬜, and never 🤖 CLAIMED.** A not-started dependency has no code, so the
  mark means nothing on it; a claimed one is in flight and its tree is moving under the dependent.
- **Mark the line, not the work order.** One unmarked open box and the dependency blocks again. That
  is what stops the mark waving through genuinely part-built work, and it is why this cannot be a
  status word — a status is about the work order and the question is about each line.
- **It chains, and every hop must be said out loud.** WO-4.5 will itself be 🔨-with-a-marked-box from
  ~Sep 13 to ~Sep 23, and WO-6.4 depends on WO-4.5. The report must name the whole chain rather than
  reporting the near hop as clean — a two-hop defer that reads like a one-hop pass is worse than the
  refusal it replaced.
- **`notComing()` still wins.** 🚫 STRUCK and ⏳ DEFERRED are dead ends and are not deferrals; WO-1.21's
  distinction between *a wait* and *a dead end* survives untouched.

**Deliverables**

- **A mark for an Acceptance line no build can close**, defined once beside 👤 and documented in
  `plans/work-orders/README.md` § "Header fields" — or in a section of its own if that table is the
  wrong home, since this marks a box and that table describes the header block. Pick one and say why
  in the work order's result.
- **`gate()`'s dependency walk learns the rule above**, reporting code-complete-with-a-NOTE where it
  now returns `FAIL`, and refusing as it does today the moment any open box is unmarked, the
  dependent is a gate work order, or the dependency is ⬜ / 🤖 / 🚫 / ⏳.
- **The chain is reported**, not just the near hop: when a marked dependency itself depends on
  another, the NOTE names each and what each is waiting for.
- **Phase 4's Acceptance lines are marked.** *(The second half, and without it the rule has nothing to
  read.)* **Phase 4 carries no 👤 anywhere** — WO-1.25 swept Phase 6 for exactly this and Phase 4
  never had the same pass. WO-4.3's real-data line and WO-4.5's *"Two consecutive weekly runs on real
  data"* need the new mark; the lines wanting the owner's own judgement need 👤. Sweep the phase, do
  not mark only the two that unblock today's dispatch.
- **New `--self-check` plants** for the rule and for every trap above, and the closing summary names
  what they cover. The count has stood at 18 and neither this class nor WO-1.27's is in it.
- **A note in `plans/verification-tooling.md`** — the running order stated this case in prose on
  2026-08-19 and the tool refused it on 2026-08-25. A rule that lives in a table and not in the
  script is the shape worth recording, and it is the second one found in two days.

**Acceptance**
- [ ] `node tools/wo-gate.mjs WO-4.5` reports code-complete against WO-4.3 with a NOTE naming the
      outstanding line, and does **not** FAIL. Output quoted.
- [ ] `node tools/wo-gate.mjs WO-G3` **still refuses** WO-4.3, on the same tree in the same run,
      because a gate work order does not accept a marked dependency. Output quoted beside the line
      above — **the two together are the proof the mark did not eat the gate.**
- [ ] `--tick` refuses to close a marked line on a green harness, exactly as it refuses a 👤 line, and
      a plant fails if that regresses.
- [ ] A dependency with one marked and one unmarked open box still FAILs.
- [ ] A ⬜, 🤖 CLAIMED, 🚫 STRUCK or ⏳ DEFERRED dependency is unaffected however its boxes are marked.
- [ ] A two-hop defer names both hops in the NOTE.
- [ ] `--self-check` passes with more plants than today, all new ones named in its summary.
- [ ] `--audit` passes, and every work order's parsed fields are unchanged across all 140 — dump
      before and after and diff.
- [ ] Phase 4's Acceptance lines carry the right marks, and no line naming real data, a fortnight, or
      the owner's own judgement is unmarked.

**Not in scope, and each is a decision rather than an omission.**
- **`**Owes**` is not touched, extended, or reinterpreted.** It answers a different question and
  WO-3.11's scar stays exactly as it is.
- **No new **Status** word.** The question is per-line; a status is per-work-order. Adding a fifth
  status would also mean teaching `--start`, `--release` and `--tick` to write it.
- **WO-4.5 is not built here.** This work order unblocks it and stops. A tooling change graded by
  whether the work it unblocks came out well is a tooling change nobody can verify.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `plans/verification-tooling.md`
  - `plans/work-orders/README.md`
  - `tools/wo-gate.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

**Four pointers, and the first two are traps you cannot recover from later.**

- **Capture the `--audit` field dump BEFORE your first edit.** Acceptance line 8 wants all 140 work
  orders' parsed fields diffed before and after. There is no way back to "before" once you have
  written to `wo-gate.mjs` or the phase files except `git stash`.
- **`tools/README.md` records the `--self-check` plant count, and a stale count turns
  `wo-sweep.mjs` red.** You are adding plants, so that number moves. This is the one sweep line
  that goes red on work being *done* rather than wrong — it cost WO-3.26 its whole last mile.
- **WO-1.27 is the nearest precedent** — same file, two days ago, same shape: a rule the README
  states, enforced in half the parser, answered with a NOTE rather than a refusal.
- **Quote real command output**; every Acceptance line here says so. No scratch files in `tools/`.

---

## 3. Constraints — non-negotiable, and each one has already cost someone a day

Codex does not read `CLAUDE.md`. It reads [`../../AGENTS.md`](../../AGENTS.md), which points back at
it — but the pointer is not enough for the constraints that matter. The orchestrator inlines these
into every brief, verbatim:

- No dependencies, no framework, no bundler, no linter, no test framework. No `package.json`.
- Colors inline, not CSS variables. No dark mode anywhere — no `prefers-color-scheme`, no
  `[data-theme]`.
- Every new control gets a 44px minimum in the `@media (pointer: coarse)` block.
- `localStorage` prefix `planbook_`, UI preferences only — never student data.
- No merge field, log line, print surface, or export emits accommodation, medical, or plan data.
- `late` and `missing` are teacher-marked, never inferred from a date. Blank means ungraded.
- Empty categories redistribute their weight.
- Taken · dropped · not-taken-yet are three states. Everything counts recorded meetings, never
  calendar days.
- Stay inside the work order's **Out of scope** line.
- You may tick the boxes your own run closed, and update `plans/` and `TESTING.md` as you go. Two
  exceptions: **never tick a 👤 line** — it needs a real iPad and you do not have one — and leave the
  `CHANGELOG.md` entry to the teacher, who decides what a change means. Anything you do tick must be
  something you actually checked; a tick you cannot point at evidence for is worse than a blank box.

---

## 4. Verification

```
node tools/verify-shell.mjs      # measures what a stylesheet review gets wrong
node tools/wo-sweep.mjs          # the eight standing greps
```

Both must be green before you report. **Do not write a second harness** — if this work order
needs a check `verify-shell.mjs` cannot make, say so in your report as a proposed follow-up.
Add checks for what you build; a fixture that cannot express the failure is not evidence.

---

## 5. Done means these 9 lines, reported against one by one

1. `node tools/wo-gate.mjs WO-4.5` reports code-complete against WO-4.3 with a NOTE naming the outstanding line, and does **not** FAIL. Output quoted.
2. `node tools/wo-gate.mjs WO-G3` **still refuses** WO-4.3, on the same tree in the same run, because a gate work order does not accept a marked dependency. Output quoted beside the line above — **the two together are the proof the mark did not eat the gate.**
3. `--tick` refuses to close a marked line on a green harness, exactly as it refuses a 👤 line, and a plant fails if that regresses.
4. A dependency with one marked and one unmarked open box still FAILs.
5. A ⬜, 🤖 CLAIMED, 🚫 STRUCK or ⏳ DEFERRED dependency is unaffected however its boxes are marked.
6. A two-hop defer names both hops in the NOTE.
7. `--self-check` passes with more plants than today, all new ones named in its summary.
8. `--audit` passes, and every work order's parsed fields are unchanged across all 140 — dump before and after and diff.
9. Phase 4's Acceptance lines carry the right marks, and no line naming real data, a fortnight, or the owner's own judgement is unmarked.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

