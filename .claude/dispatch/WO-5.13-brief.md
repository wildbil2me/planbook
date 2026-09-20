# WO-5.13 — Every template, whatever the recipient · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-5-outreach.md`
**Report to** `.claude/dispatch/WO-5.13-result.md` — as your last act, and return it in-band too.

**Routing decision.** Claude, at **Opus** — Phase 5 outreach is Claude-only by `ROUTING.md`
§ "Later phases, at a glance", and this row additionally reverses an Acceptance line that was
verified and mutation-proved, across four documents plus two harness files, which is prose and
judgment rather than mechanics. Runner-up set aside: the *code* change is four deleted arguments and
reads Codex-shaped on the five bullets, but the documentary reversal is the larger half of this work
order and is exactly what the Codex column excludes.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-5.13 — Every template, whatever the recipient

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-20 · **Size** S · **Depends on** WO-5.3

**Why it exists.** The owner, 2026-08-29: *"all templates should be available regardless of
recipient."* That is the half of [WO-5.8](#wo-58--several-recipients-and-one-of-them-is-primary)'s
ask which needs no picker, and **it has to land first**: multi-select cannot keep a filter that
needs one audience, because a message to both guardians and the counselor has no single audience to
filter on. Cut out of WO-5.8 on 2026-09-20 — see the block under that row's header.

**⚠ THIS REVERSES A VERIFIED ACCEPTANCE LINE, and it is the owner's call rather than a correction.**
*(This block stood under WO-5.8 until the cut of 2026-09-20 and came here with the work.)*
WO-5.3's seventh line — proved, mutation-tested, and inherited from WO-5.2's first — reads templates
through `templatesFor(doc, tone, audience)` **with both arguments, never audience alone**, so that a
guardian's concern template is not offered for a praise draft. **The tone half is untouched and must
stay.** The audience half is what is being reversed. Whoever builds this amends those lines where
they stand rather than leaving two documents disagreeing.

**What changes, and what deliberately does not.** `templatesFor(doc, tone, audience)`
(`src/templates.js:159-167`) **keeps its signature** — `''` already means "all of that dimension",
so the send flow simply stops passing the third argument. **Four call sites**, all in
`src/outreach-view.js`: `:463` (the send-time read), `:1118` (at open), `:1232` (`applyTone`),
`:1263` (`applyRecipient`). The fifth, `src/templates-view.js:302`, already passes `''`.

`model.audience` (`src/outreach-view.js:451`, `:563`) **stays**: it still feeds the note under the
picker and `writeContact()`. Only the filter goes. **`AUDIENCES` is not widened and `audienceOf()`
is not removed** — `tools/wo-sweep.mjs` § 24 pins seven exports of `src/outreach.js` by name,
`audienceOf` among them, and drops a vacuity guard if one goes missing.

**Deliverables**
- The audience argument dropped at the four send-flow call sites; the tone argument untouched.
- Two sentences reworded rather than deleted, because both go stale the moment the filter does: the
  "no template for this pair" reason (`src/outreach-view.js:484`) and the note under the picker,
  *"N templates written for a guardian in the concern tone"* (`:655`).
- The reversal recorded in every document that asserts the both-arguments rule, in the same sitting:
  **WO-5.2's first Acceptance line** (`phase-5-outreach.md:183-187`, ✅ ticked), **WO-5.3's seventh**
  (`:314-316` and `:325`, ✅ ticked and mutation-proved), both prose twins in `TESTING.md`
  (§ WO-5.2 and § WO-5.3), and `docs/data-model.md:725`.

**Acceptance**
- [ ] Every saved template is offered whatever the recipient is; a concern template is still never
      offered for a praise draft. *(Moved here from WO-5.8 at the cut of 2026-09-20, reworded from
      "whatever the recipients are" because multi-select does not exist yet and this row does not
      wait for it.)*
- [ ] WO-5.2's first Acceptance line, WO-5.3's seventh, both `TESTING.md` twins and
      `docs/data-model.md` all record the reversal, amended in place rather than left disagreeing.
      *(Moved here from WO-5.8 at the cut, and widened: the line named WO-5.3 and `TESTING.md`
      only, but WO-5.3's own text says it inherited the rule from WO-5.2, and the data model states
      it a third time.)*

**Traps** — `tools/verify/templates.mjs:420` asserts the audience filter and **will go red on work
being done**. Rewrite it to assert the tone half and the *absence* of the audience half rather than
deleting it; a claim deleted because it went red is a claim nobody replaces. Harness prose at
`tools/verify/outreach.mjs:391-417` says the same thing in words and needs the same treatment.

Second: `CLAUDE.md:206` mentions `templatesFor` and is **not** about this filter — it is the WO-6.6
class-tab ruling that templates are global. Leave it alone.

Third: if the count of `check(` lines moves, `tools/README.md`'s call-site count moves with it and
`wo-sweep.mjs` § 11 compares against the sentence there. Update it in the same sitting — the WO-3.26
scar, where a green tree turned the sweep red on work being done.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `docs/data-model.md`
  - `src/outreach-view.js`
  - `src/outreach.js`
  - `src/templates-view.js`
  - `src/templates.js`
  - `tools/README.md`
  - `tools/verify/outreach.mjs`
  - `tools/verify/templates.mjs`
  - `tools/wo-sweep.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

Four things worth stating before you start, none of them guessable from the files:

1. **This work order is half documentary, and that half is not cleanup.** Two ✅-ticked Acceptance
   lines (WO-5.2's first, WO-5.3's seventh), two `TESTING.md` twins and `docs/data-model.md:725`
   each assert the rule being reversed. **Amend them in place — never delete a ticked line and
   never untick one.** A line left saying the old thing is this row's second Acceptance failure,
   and the whole reason the cut put it here rather than in WO-5.8.
2. **The tone half is untouched.** `templatesFor(doc, tone, audience)` keeps its signature; `''`
   already means "all of that dimension". A concern template must still never be offered for a
   praise draft — if your change can't tell those two halves apart, it has gone too far.
3. **Two harness claims will go red on work being done** (`tools/verify/templates.mjs:420`,
   prose at `tools/verify/outreach.mjs:391-417`). Rewrite them to assert the tone half *and the
   absence of the audience half*. A red claim deleted is a claim nobody replaces. If your `check(`
   count moves, `tools/README.md`'s call-site sentence moves in the same sitting — `wo-sweep.mjs`
   § 11 compares against it, and a stale number there is the WO-3.26 scar.
4. **If you mutate to prove a claim non-vacuous, revert the mutation before you write anything
   else** — not after the doc pass. Four dead dispatches here have shipped live mutations under
   already-ticked boxes; `AGENTS.md` states the rule.

Both Acceptance lines are closeable at the desk: no 👤, no 📆. Run `node tools/wo-sweep.mjs` and
`node tools/verify-shell.mjs`; if the browser harness cannot run in your sandbox, say so as an
environment report and never as a result.

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
  exceptions: **never tick a 👤 or 📆 line** — one needs a real iPad you do not have, the other a date
  that has not arrived — and leave the `CHANGELOG.md` entry to the teacher, who decides what a change
  means. Anything you do tick must be
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

## 5. Done means these 2 lines, reported against one by one

1. Every saved template is offered whatever the recipient is; a concern template is still never offered for a praise draft. *(Moved here from WO-5.8 at the cut of 2026-09-20, reworded from "whatever the recipients are" because multi-select does not exist yet and this row does not wait for it.)*
2. WO-5.2's first Acceptance line, WO-5.3's seventh, both `TESTING.md` twins and `docs/data-model.md` all record the reversal, amended in place rather than left disagreeing. *(Moved here from WO-5.8 at the cut, and widened: the line named WO-5.3 and `TESTING.md` only, but WO-5.3's own text says it inherited the rule from WO-5.2, and the data model states it a third time.)*

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

