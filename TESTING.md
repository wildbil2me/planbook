# Planbook — manual test checklist

Run this before merging any phase branch. It is the regression gate.

**There is no automated test suite, and that is a decision rather than an omission.** The suite
carries no dependencies, no linter, and no test framework; `plans/ROADMAP.md` names an automated
suite as explicitly not required for 1.0, and names this checklist plus a headless demo pass as
the gate instead. The cost of that decision is real and lands here: if a check isn't written
down, it doesn't get run.

**Nothing in this file is ticked yet.** WO-1.1 created the file; no pass has been run and no
iPad has been near it. Per the maintenance protocol in `plans/ROADMAP.md`, written-but-unverified
stays `- [ ]`.

---

## How to use it

1. When a work order lands, copy its **Acceptance** lines into that phase's section below. They
   are written as checklist items already — copy them rather than paraphrasing, so what was
   promised and what was tested are the same sentence.
2. Run each item in **both** contexts in the Environment table unless the item says otherwise.
3. Tick only what you actually ran. Add a dated *(italic paren note)* whenever the result
   differed from what the check predicted — the note is the part that earns its keep later.
4. Then finish the maintenance protocol in `plans/ROADMAP.md`: tick the roadmap box, update the
   dashboard, add the `CHANGELOG.md` entry.

**Legend** — 👤 marks a check that needs a human on real hardware: an iPad in your hands, a
printer, a screen reader, ears. No headless run and no desktop device emulator closes one of
these, and marking one passed from a desktop is how a claim becomes a lie.

---

## Environment

Two run contexts. Everything ships to both, and the second is the one that decides go-live.

| Context | What | Notes |
|---|---|---|
| **Desktop** | Chrome or Edge on Windows, served from any local static server | A service worker will not register from `file://`, so even a local pass needs a server. This is the context for logic, keyboard paths, and grade math. |
| **iPad Safari** 👤 | **iPad Safari**, installed to the home screen via Share → Add to Home Screen | The install target that matters. Run here for anything touching layout, touch targets, offline behavior, storage persistence, or install. |

**Why iPad Safari is named explicitly and not "a tablet."** iOS Safari evicts IndexedDB after
about 7 days of non-use on sites that are *not* installed to the home screen; installed PWAs are
exempt. A teacher who bookmarks Planbook instead of installing it can lose a term of grades over
a school holiday. That hazard is specific to this browser, it is data loss rather than
inconvenience, and no emulator reproduces it — which is why the install path is a go-live blocker
and why every storage check below carries a 👤 iPad half.

Record the hardware for each pass. WO-1.3's acceptance requires the iPadOS version written down
here, so the slot exists before the work does.

| Field | Value |
|---|---|
| Desktop browser + version | _not yet recorded_ |
| Local server used | _not yet recorded_ |
| iPad model | _not yet recorded_ |
| **iPadOS version** | _not yet recorded_ |
| Installed to home screen? | _not yet recorded_ |
| Served from (URL) | _not yet recorded_ |
| Date of pass · who ran it | _not yet recorded_ |

---

## Standing checks — every pass, against whatever exists at the time

These are the standing obligations from `plans/work-orders/README.md`, restated as checks
because an obligation that isn't on a checklist is a hope. They never finish, so they are not
tied to a phase; run them over the screens that exist when you run the pass.

- [ ] No `package.json`, `package-lock.json`, or `node_modules/` anywhere. Anything scripted is
      `tools/*.mjs` under bare Node.
- [ ] No dark-mode rules: no `prefers-color-scheme`, no `[data-theme]`. Colors are inline, not
      CSS variables.
- [ ] Every control reachable on the iPad is at least 44px, and every new control from this
      phase appears in the `@media (pointer: coarse)` block. 👤
- [ ] Every `planbook_` key holds a UI preference and nothing else. No student data in
      `localStorage`.
- [ ] No merge field, log line, print surface, or export emits accommodation, medical, or plan
      data. The JSON backup is the only exception, and its own UI says so.
- [ ] Presentation mode, once it exists, suppresses every `supports` field on every screen built
      since the last pass — including any screen added by this phase.
- [ ] `late` and `missing` are teacher-marked, never inferred from a date. Blank is ungraded and
      changes no grade.
- [ ] Roll Call! is still deployed and still working. It is the fallback until Planbook has
      survived a full term.

---

## Phase 1 — Shell, store, roster

*Phase goal: the app installs, holds data, survives everything, and can hand that data back.*

**Ordering rule for this phase:** WO-1.5 (backup & restore) is verified before WO-1.6 and
everything after it. No feature that writes student data ships before the path that gets it back
out — so if WO-1.6's checks are green and WO-1.5's are not, the phase is not green.

### WO-1.1 — Repo skeleton & docs spine

- [x] `git log` shows a first commit on `main` and a phase branch cut from it.
      (`git log --oneline --all`, `git branch -a`.)
- [x] `TESTING.md` exists with an environment section naming iPad Safari explicitly.
- [x] `CHANGELOG.md` exists with `## [Unreleased]` and one real entry.
- [x] No dependency manifest of any kind exists in the repo. (`git ls-files` lists no
      `package.json`, no `package-lock.json`, no `node_modules/`.)

*Ticked 2026-08-04 against commit `0a77f38`. No 👤 items — every line here is a command, and all
four were run twice: once by `work-order-verifier`, once again by hand.*

*WO-1.2 through WO-1.10 append their own subsections here as they land, in work-order order.
Append; don't restructure.*

---

## Phase 2 — Attendance

*Phase goal: the owner stops opening Roll Call!. The marking flow runs while students walk in.*

Nothing here yet — WO-2.1 through WO-2.7 append their acceptance lines as they land.

When they do, three of them are the ones that decide whether a term of attendance is
trustworthy, and they need a real class rather than a test document: a mark lands and survives a
reload, a dropped class is distinguishable from a not-taken-yet one, and the percentage matches
a hand count. 👤

---

## Phase 3 — Gradebook

*Phase goal: grades entered once or twice a week, in minutes, for five classes.*

Nothing here yet — WO-3.1 through WO-3.10 append their acceptance lines as they land.

Grade math gets hand-computed cases, not spot checks: an all-excused category, a zero-point
assignment, a term with one assignment, and a document where one category has no assignments at
all (its weight redistributes).

---

## Phase 4 — Signals: concern **and** praise

*Phase goal: open the app and see who needs you today, in both directions.*

Nothing here yet — WO-4.1 through WO-4.5 append their acceptance lines as they land.

Every flag has to be reproducible by hand from the numbers it shows, and praise has to rank by
delta rather than by level — a praise list that surfaces the same four high achievers every week
is a failed feature that still passes a smoke test.

---

## Phase 5 — Outreach

*Phase goal: from "this student needs a conversation" to a sent message, without a mail scope.*

Nothing here yet — WO-5.1 through WO-5.4 append their acceptance lines as they land.

Two checks here are containment rather than function: no merge field resolves accommodation,
medical, or plan data, and an unresolved field never renders blank.

---

## Phase 6 — Calendar & the glance page

*Phase goal: open the app at 7:40am and know what the day asks of you.*

Nothing here yet — WO-6.1 through WO-6.4 append their acceptance lines as they land.

Derived events are computed at render, never stored: move an assignment's due date and the
calendar has to follow by itself.

---

## Phase 7 — Drive sync (opt-in) 🔒

*Phase goal: the same year on the laptop and the iPad, with one scope and no fear.*

Nothing here yet — WO-7.1 through WO-7.3 append their acceptance lines as they land. Gated on
Google OAuth verification.

Two checks matter more than the sync working: the app is fully functional signed-out, forever,
and the consent screen shows `drive.file` and nothing else. A conflict keeps both copies and
says where the loser went.

---

## Phase 8 — 1.0 packaging

*Phase goal: something a stranger can find, evaluate, install, and trust.*

Nothing here yet — WO-8.1 through WO-8.6 append their acceptance lines as they land.

This phase's first roadmap item is *this file, complete and fully passing* — which is the
argument for filling it in as the work lands rather than at the end. It also carries the
accessibility pass: screen reader, keyboard-only, contrast. Run it, don't assert it. Roll Call!'s
headless run found 66 unlabelled buttons in an area already ticked done. 👤

---

## Known limitations

Empty until there is an app to have limitations. They get written down here and in `README.md`
before launch, not discovered by a teacher in week one.
