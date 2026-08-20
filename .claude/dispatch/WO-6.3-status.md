# WO-6.3 — Month & week views — dispatch status

- 2026-08-19 — gates checked, PASS. WO-6.2 ✅ DONE, tree clean, no prior dispatch files.
- 2026-08-19 — route: **Claude, Opus tier**. Deciding signal: sensitive surface — IEP/504 review
  dates drawn on a month cell, suppressed entirely in presentation mode, plus a print gate that must
  not emit `supports` data. Runner-up set aside: the mechanics read Codex-shaped (size M, print-gate
  pattern already exists), but the Traps are pure judgment (the schedule model this grid will make
  look necessary) and the 44px departure is a written-down owner-facing call. No Codex probe run.
- 2026-08-19 — claimed: 🤖 CLAIMED — 2026-08-19.
- 2026-08-19 — brief written: `.claude/dispatch/WO-6.3-brief.md`, 206 lines, 0 markers left.
- 2026-08-19 — implementer spawned at Opus, awaiting return. Expect 20-40 min. A flat status file,
  an absent result file and an unchanged `git status` are the normal shape of the first 20+ minutes;
  they are not evidence the run died. Do not spawn a second implementer on this claim.
- 2026-08-19 — implementer returned. Result file written. Reports both harnesses green on the
  delivered tree (verify-shell 1029/1029, wo-sweep 25 checks 23 pass 2 standing review). Two new
  files (`src/calendar-view.js`, `src/calendar-view.css`), sw.js CACHE v86 -> v87. Claims 5 of 8
  acceptance lines ticked; 3 left blank as 👤. Flags a needed 44px departure (28px month chip) as
  the owner's ruling, and a tap-through gap on recorded days.
- 2026-08-19 — verifier dispatched at Opus, awaiting verdict.
- 2026-08-19 — **the verifier dispatch died before any verdict**: the orchestrator hit an API session
  limit ("resets 11:50pm") immediately after logging the implementer's return. No verifier ran; the
  line above records a spawn, not a result. Recovered in the owner's own session from the working
  tree, per `plans/dispatch-retro.md`: all implementer writes are present (13 modified, 2 new —
  `src/calendar-view.js`, `src/calendar-view.css`), nothing was committed, and both harnesses were
  **re-run locally rather than read off the result file** — `wo-sweep` 25 checks / 23 pass / 0 fail /
  2 standing review, `verify-shell` 1029/1029 in 345s. The implementer's harness claims hold on the
  delivered tree. Its *acceptance* claims remain unverified — that is what the verifier is for.
- 2026-08-19 — verifier re-dispatched alone, fresh, at Opus. No re-implementation: the tree stands.
- 2026-08-19 — verifier returned **FAIL**, and not on the feature: all eight acceptance lines stand
  (5 ✅ / 3 🙋), no code change asked for, both harnesses green on its own runs. The ❌ was a tracker
  regression this dispatch introduced — `wo-gate.mjs --audit` went PASS → FAIL because WO-6.2's two
  re-homed lines were ticked back but their now-stale `→ WO-6.3` pointer markers were left under them,
  which the tool treats as a failure by design (`tools/wo-gate.mjs:347`). Proved new rather than
  inherited: the verifier ran the same command against `HEAD` in a throwaway worktree and got PASS.
- 2026-08-19 — fixed in the owner's session: deleted the three stale pointer lines (190–191, 208) from
  `plans/work-orders/phase-6-calendar-glance.md`. The third pointer, on the still-open review-date box,
  **stays**, and so does WO-6.2's `**Owes** WO-6.3` field. Re-ran all three: `--audit` **PASS** exit 0
  (49/81 rows, every dashboard row matching its own boxes), `wo-sweep` 23/0/2, `verify-shell`
  1029/1029. Nothing committed; WO-6.3 stays 🔨 IN PROGRESS on four 👤 readings.
- 2026-08-19 — 👤 pass on the owner's iPad: **all four readings green.** The 28px month chip is ruled
  IN. Ticked: WO-6.3's three 👤 boxes, WO-6.2's last re-homed box (the review-date line, held open on
  purpose until this reading), and TESTING.md's three. Dropped WO-6.2's `**Owes**` field — its debt is
  now fully paid. WO-6.3 → ✅ DONE. ROADMAP Phase 6 4/8 → 6/8, overall 49/81 → 51/81; README dashboard
  Phase 6 2 → 3 done. CHANGELOG entry written in the house's prose voice, not the draft's bullet form.
- 2026-08-19 — final state: `--audit` **PASS** (Phase 6 row 6/8 matching boxes 6/8, overall 51/81),
  `wo-sweep` 23/0/2. `verify-shell`'s inputs are byte-identical to the 1029/1029 run above — every
  edit since was markdown outside `SHELL`, so no re-run and no `CACHE` bump. Uncommitted, awaiting the
  owner.
- 2026-08-19 — maintenance protocol completed, all five steps. Step 5 was the one with work in it: the
  44px convention is stated flat in **both** briefing files and now has exactly one exception, so
  `CLAUDE.md` § Conventions and `AGENTS.md`'s 44px rule were amended in the same sitting, both fenced
  as *not a precedent you may cite*. Two `CLAUDE.md` bullets that read as prospective were made true:
  the fourth-state bullet now records that the grid exists and never rendered the wall of amber, and
  the computed-at-render bullet names the fourth calendar module plus the two things in it that look
  like omissions — no `presentationMode()` test (the suppression is the model's, and a check here
  would be the second opinion) and the class-filter ruling the view had to make.
- 2026-08-19 — **WO-6.5 booked** — *A tapped day opens on that day*, Size S, depends on WO-6.3, Ship —,
  ⬜ NOT STARTED, six acceptance lines. Phase file 4 → 5 work orders, README § The files and the phase
  dashboard updated with it. `next` still returns WO-3.18, so it did not jump the running order.
- 2026-08-19 — final: `--audit` PASS · `--self-check` PASS 18/18 · `wo-sweep` 23/0/2 · `verify-shell`
  1029/1029 (app code byte-identical since that run; everything after was markdown outside `SHELL`).
  18 files changed, 1816 insertions, 62 deletions, 2 new source files. Uncommitted.
