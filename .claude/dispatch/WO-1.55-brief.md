# WO-1.55 — the date-field checks type into a field that takes no keystrokes · implementation brief

**Route** Claude (work-order-implementer)
**Work order** `plans/work-orders/phase-1-shell-store-roster.md`
**Report to** `.claude/dispatch/WO-1.55-result.md` — as your last act, and return it in-band too.

**Routing.** Claude **Opus**, on its own merits: this is a diagnosis whose cause is unnamed, so the number of whole-harness runs it needs is open-ended (~4.4 min each) and no Codex `--budget` can be stated; its Trap is a judgment one (do not weaken a check to make it green); and it writes `TESTING.md` prose. Runner-up set aside: "harness-only, mechanically checkable" reads Codex-shaped, but only once the cause is known.

---

## 1. The work order, verbatim

Every section of it, including **Why it exists** and **Traps**. These are not background: they
record decisions already made and already argued. An implementation that undoes one has failed
the work order however clean the code looks.

## WO-1.55 — the date-field checks type into a field that takes no keystrokes

**Ship** — · **Status** 🤖 CLAIMED — 2026-09-27 · **Size** S · **Depends on** WO-1.48 — the date field whose checks these are
**Closes roadmap** *(no box. A harness defect: the app was read working by the owner the same day.)*

**Booked 2026-09-27**, owner-directed, from WO-7.11's verdict. Three checks in
`tools/verify/date-zero-key.mjs` — WO-1.47's zero-first month, the full `09032026`, and `10032026` —
have failed on every whole-harness run since the evening of 2026-09-26: WO-7.11's implementer at
~22:40 EDT, the same on a worktree of unmodified `8ef1b81` at ~22:15, the verifier's run, and a run
at 05:49 EDT on 2026-09-27. They were green in WO-7.10's `1543 · 1543` run earlier on the 26th.

**What the failures show.** The editor opens, the field holds its seeded `2026-11-20`, and
`document.activeElement` is the field — and **no keystroke changes it**: after `0`, after `9`, and
after both eight-digit sequences, field and document both still read `2026-11-20`. That is not the
WO-1.47 defect (which emptied the field and took focus to `BODY`); it reads as keystrokes not
arriving at all.

**The app is not at fault, as far as a reading can say.** The owner typed `10032026` into an
assignment's due date on the laptop on 2026-09-27 and it read Oct 3, 2026. No file under `src/` that
draws the field has changed since `a78abf9` (2026-09-06). **The implementer's clock theory is out**:
the 05:49 run had local and UTC on the same date and failed identically. Edge on the machine is
154.0.4258.37, last updated 2026-09-24 per WO-7.11's implementer — before the green run, so a browser
update is not proven either.

**Deliverables**
- **Find why `Input.dispatchKeyEvent` stopped reaching the field**, and name it in `TESTING.md`
  § WO-1.55 with the run that shows it. Candidates, none proven: a section earlier in the run now
  leaving focus, a modal or an overlay in a state that eats key events (WO-7.10 and WO-7.11 both
  changed what the About modal and the Drive section draw at launch); the caret landing on a segment
  other than the one the check assumes; a Chromium change.
- **Fix the harness, not the app.** If the cause turns out to be in `src/`, stop and report it — that
  is a different work order, and the owner's reading says it would be surprising.
- **Keep the checks as strong as they are.** They exist to catch WO-1.47's defect coming back.

**Acceptance**
- [ ] The cause is named in `TESTING.md` § WO-1.55, with the evidence.
- [ ] The three `date-zero-key` checks are green on the whole harness, real clock.
- [ ] Mutation-proved: putting WO-1.47's defect back (the rebuild on `change`) turns them red again.
      **The mutation is reverted before anything else is written** (`AGENTS.md`).
- [ ] No other check in the harness changes state.

**Traps** — **Do not weaken a check to make it green**: a check that stops typing, or asserts only
that the field is present, proves nothing about the defect it guards. **Do not assume the most recent
commit caused it** — `8ef1b81`, which touched no code, fails the same way; WO-1.44's scar is that the
app was innocent throughout and the first instinct was to look for the commit that broke it.

---

## 2. Read these first, before writing anything

- `CLAUDE.md` — the architecture and the reasoning that must not be undone.
- Referenced by this work order:
  - `tools/verify/date-zero-key.mjs`
- `tools/README.md` § "Driving a browser over CDP" — four traps that all present as app defects
  rather than harness bugs, and that two agents have each rediscovered from scratch.

- `tools/verify-shell.mjs` — section order (line ~323) and `runSection()`; find what runs **immediately before** `date-zero-key` and what state it hands on.
- `tools/verify/date-clear.mjs` and `tools/verify/date-format.mjs` — sibling date-field sections; if they still type successfully, the difference between them and `date-zero-key` is your best lead.
- The `src/` file that draws the date field (WO-1.47 / WO-1.48 in `plans/work-orders/phase-1-shell-store-roster.md` name it) — **read only**.
- `plans/work-orders/phase-7-sync.md` § WO-7.12 — a *separate*, booked harness race in `drive-sync.mjs`. Do not fix it here.

**Orchestrator notes — the traps you would not guess:**

- **Baseline first.** Run the whole harness once, before touching anything, and keep the full pass/fail list. Acceptance line 4 ("no other check changes state") is measured against that baseline, not against an assumed all-green one. WO-7.12's `drive-sync` check is known to flake ~1 run in 7 — if it moves, say so and name it as that flake rather than claiming or hiding it.
- **Bisect by section, not by commit.** The Traps rule out commit-hunting. The cheapest discriminator is running `date-zero-key` alone, or with only the sections before it removed from the run, and seeing whether keys land. If it passes in isolation, the cause is state handed on by an earlier section (focus, an open modal/overlay, a dialog, Drive library window, `Emulation`/`Input` state such as touch emulation left on).
- **CDP key events go to the focused *frame/target*, not to `document.activeElement`.** `activeElement` reading the field does not prove the page has focus — a popup/window opened by an earlier section (Google sign-in, WO-7.10/7.11) or lost page focus (`Page.bringToFront`, `Emulation.setFocusEmulationEnabled`) produces exactly "field focused, no key arrives". Check this candidate early.
- **The fix must keep the checks typing real keys** via `Input.dispatchKeyEvent` and asserting the field's and the document's values. Setting `.value` from `Runtime.evaluate`, or asserting presence, is the weakening the Traps forbid. A fix that makes an earlier section hand the page on clean (or makes this section establish its own precondition and assert it) is the right shape.
- **If the cause is in `src/`, stop and report** — do not fix the app here.
- **Mutation protocol:** grep `MUTATION` marker on the mutated line, run, revert, `git diff` the file clean, *then* write anything else. If you are killed mid-mutation the next reader runs `grep -rn MUTATION` first.
- If you change `check()` call counts, the recorded count in `tools/README.md` must match or `wo-sweep.mjs` goes red.
- Harness runs are long and quiet: use `run_in_background` with a log file and read the log's own summary/`EXIT=` line; `grep -c` exiting 1 on zero matches is not a failed run.

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

## 5. Done means these 4 lines, reported against one by one

1. The cause is named in `TESTING.md` § WO-1.55, with the evidence.
2. The three `date-zero-key` checks are green on the whole harness, real clock.
3. Mutation-proved: putting WO-1.47's defect back (the rebuild on `change`) turns them red again. **The mutation is reverted before anything else is written** (`AGENTS.md`).
4. No other check in the harness changes state.

Report honestly rather than favorably. A separate verifier reads your work cold against this
list and sees none of your reasoning — claiming a line you did not meet costs a correction
round, not a pass. Anything needing a real iPad or human eyes: say so, do not assume it.

