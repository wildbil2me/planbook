# Gate work orders — the ship gates and the 1.0.0 call

Four work orders that produce no code. They exist because the failure mode they guard against is
*declaring done*: a phase that felt finished, a ship that was never rehearsed, a release called on
how complete it felt rather than on criteria.

Each is a checklist you run, not a thing you build.

---

## WO-G1 — Ship 1 go-live rehearsal

**Ship** 1 · **Status** ✅ DONE — 2026-08-08 · **Size** M · 🚩 · **Depends on** WO-1.1 … WO-2.4
**Target** ~2026-08-22, before students walk in ~2026-08-24

**Why it exists.** A three-week-old app will be holding a live term of attendance. The decision to
go live was made 2026-08-03 with the risk stated and accepted; **this work order is the thing that
makes it considered rather than reckless.** Two facts are load-bearing and both get verified here,
not assumed.

### Before the sitting

- [x] **1. Start `node tools/serve-https.mjs` and open `https://localhost:8443` on the laptop.**
      Loopback, so it resolves on any network including the school's — no certificate address to
      match, no DHCP to depend on. *(Owner, 2026-08-08.)*
- [x] **2. Confirm the laptop is on `planbook-shell-v32`.** Cache Storage holds `v32` **and only
      `v32`** — the "only" is the half that catches a failed `activate`, and a cache that layered
      instead of replacing is invisible from inside the app. *(Was `v31`; WO-2.5 bumped it. This
      number goes stale on every shell change and is read as an instruction — check it against
      `sw.js` when you get here, rather than trusting the line.)*
- [x] **3. Take a backup and put it off the laptop** — before the rehearsal, not as part of it. The
      backup drill below wipes storage on purpose. This is the copy that exists if it goes wrong.
      *(Owner, 2026-08-08.)*
- [x] **4. WO-2.5 has landed.** Without the keyboard path a class of 25 is marked by mouse, one
      click per student, while students walk in. That is the version of laptop-only that fails, so
      the rehearsal is not worth running until it is in. *(✅ DONE 2026-08-08, commit `3b36b3a`.)*

### The three things that must be right

From [`../ROADMAP.md`](../ROADMAP.md): the riskiest thing on day one is the attendance ledger itself
— not a schedule, since there isn't one. What must be right is narrow and testable.

- [x] **A mark lands and survives a reload.** On the laptop — the device of record — with the app
      closed and reopened between mark and check. *(Originally written as an iPad check, when the
      iPad was to be the device of record. Re-run on the iPad too as a compatibility pass, but the
      laptop is the one that gates the term.)* *(Owner, 2026-08-08.)*
- [x] **A dropped class is distinguishable from an untaken one** — on screen, and in the stored
      document. *(Owner, 2026-08-08. Both halves — on screen and in the document.)*
- [x] **The percentage matches a hand count.** Against a real class, over real recorded meetings.
      *(Owner, 2026-08-08, **against backfilled test data plus current entries, not a real class** —
      there is none yet; the term starts ~2026-08-24. That confirms **the arithmetic**: the app's
      number and a hand count agree over the meetings that exist. It does not confirm the thing the
      paragraph below asks for, which is that the number the teacher sees in the **live** year
      agrees with the number she can count herself. **Re-run this in week one against a real class**
      and note it here; until then this tick is about the formula, not about the term.)*

**Verify all three against a real class before trusting it with a term.**

**Two of them write, and one must not.** The first two put marks in the ledger, so run them in the
throwaway year described below, on a copy of a real roster. The third is read-only and has to be the
**live** year — a hand count means nothing against fabricated meetings, and the whole point is that
the number the teacher will actually see agrees with the number she can count herself. Compare
quarter against quarter, not against Roll Call!'s year badge, which disagrees with its own quarters
(`TESTING.md`, WO-2.4).

### The rehearsal

**Run all of it in a throwaway school year, then switch back and delete it.** `createYear()` and
`switchYear()` exist (`src/year-picker.js`); use them before the first mark below.

**This is not tidiness, and getting it wrong is not recoverable by editing.** In this data model a
simulated day *is* a real day — a class met if it has an attendance record without an exception, and
there is deliberately no schedule to disagree with it (`plans/rotating-schedule.md`). A rehearsal run
in the live year leaves five fabricated meetings in the ledger, in the denominator of every student's
percentage, and in the recorded-meetings count the home screen exists to answer. The term would then
open with a confident wrong number in exactly the week a confident number gets believed — and the
teacher has no way to tell it from a real one, because it *is* a real one. The rehearsal must not be
able to contaminate the ledger it is rehearsing.

- [x] Run a **full simulated school day** — **in the throwaway year** — five classes, one dropped,
      one marked late in the day, one deliberately left untaken, and one marked for yesterday. Then
      reload and confirm every state reads correctly. *(Owner, 2026-08-08.)*
- [x] **Afterwards: switch back to the live year and delete the rehearsal year.** Then confirm the
      live year's recorded-meeting counts and percentages are exactly what they were before the
      sitting — the rehearsal is only finished when it has left no trace. *(Owner, 2026-08-08.)*
- [x] **Backup drill, end to end.** Download the backup, wipe browser storage, restore, and confirm
      every mark, student, and class returns. Do this on the iPad, not only the laptop. *(Owner,
      2026-08-08. Storage cleared via DevTools → Application → Clear site data, which takes the
      service worker and precache with it — so the restore was also an unintended re-install test.)*
- [x] **Installed on the actual teaching iPad**, from Safari, launching without browser chrome.
      Record the iPadOS version in `TESTING.md`. *(Owner, 2026-08-08. **iPadOS 26.5.2**, recorded in
      `TESTING.md` § WO-2.5.)*
- [x] **Airplane mode test.** Full class marked with no network, then reconnect. Nothing lost.
      *(Owner, 2026-08-08.)*
- [x] **Roll Call! confirmed still deployed and working.** It is the fallback, and *a fallback
      you've decommissioned isn't one.* Do not decommission it. *(Owner, 2026-08-08.)*
- [x] The week-one plan is written down: which app is the record of truth, and what the trigger is
      for falling back. Decide the trigger now, not at 7:45am on a Tuesday. *(Owner, 2026-08-08.
      **Written down outside this repo** — worth copying in here before day one, because the one
      reader who will need it at 7:45 on a Tuesday is the one who cannot find it.)*
- [x] A backup is downloaded and stored off the device before day one. *(Owner, 2026-08-08. Taken
      before the drill below wiped storage, and it is the copy the restore was proved against.)*

### Where Ship 1 actually runs — decided 2026-08-08

**The laptop is the device of record for the term, at `https://localhost:8443`, served by
`tools/serve-https.mjs` from a `main` checkout.** No public host, no domain. Phase 8 owns the
distribution channel and a real URL, and neither is needed to mark attendance in August.

**How this decision was reached, because the first answer was wrong.** The plan was the iPad on the
LAN address, `https://192.168.50.142:8443`, with the laptop alongside it. Working through what that
meant on an ordinary Tuesday turned up the thing nobody had said out loud: **two devices are two
databases.** Browser storage is local to the device, so an iPad and a laptop hold separate
IndexedDB stores *even at the identical URL* — that is not a misconfiguration, it is what
local-first means, and it is the same property that keeps a vendor server away from student data.
`docs/sync.md` is the answer to it and always was, but sync is Phase 7 and 🔒 GATED on OAuth
verification. So for this term there is no automatic sync, and one device has to be the record.

**Why the laptop and not the iPad.** One device removes divergence entirely rather than managing it,
and `localhost` is loopback — it resolves on any network including the school's, needs no DHCP
reservation, and has no certificate address to match. Every fragility the LAN plan carried
disappears with it. The sequencing is also better: when Phase 7 lands, the iPad joins a record that
already exists instead of arriving with a competing one.

**What it costs, and the condition attached.** This inverts WO-2.5's stated model — *"attendance is
marked on the iPad while students arrive and reviewed on the laptop afterward"* — so the keyboard
path stops being a review affordance and becomes **the** way a live class is marked. WO-2.5 is
therefore pulled into Ship 1 and 🚩, and **this decision is not safe to act on until it lands**: a
class of 25 marked by mouse while students walk in is the version of laptop-only that fails.

**The iPad stays in the rotation as a verification device.** It keeps its LAN install and is checked
against every change, so it is trusted hardware on the day sync arrives rather than a device that
went dark for a term. Three rules keep that from becoming a second record:

- **Restore only ever flows laptop → iPad. Never the reverse.** This is the one that can destroy a
  term. Restore is a wholesale replace, not a merge (`restoreDocument()`, `docs/sync.md`), so an
  iPad backup pulled onto the laptop overwrites the real ledger with test data — silently, and
  reporting success.
- **The iPad's data lives in a year that cannot be mistaken for the term.** Labels are strictly
  `YYYY-YYYY` (`src/store.js:176`), so it cannot be named "TEST" — use something like **2030-2031**,
  which is unmistakable in the year picker.
- **Confirm the iPad's cache version before trusting any result from it.** An iPad on a stale build
  passes or fails for reasons about the build rather than about the change. This is not
  hypothetical: on 2026-08-08 the iPad sat on `v30` while `main` was two work orders ahead, and
  nothing in either tool could see it.

**Two consequences of the iPad being a test device.** The DHCP reservation demotes from load-bearing
to convenient — a moved lease now costs a test install, not a term. And iPad checks are an at-home
activity, since updating it needs the laptop's server running on that network; at school it runs
whatever build it last received.

### Ship gate

- [x] `TESTING.md` Phase 1 and Phase 2 sections fully passing. *(2026-08-08, second pass: **255 of
      255, zero open.** The six that held this line open were all in the struck-through
      `~~WO-2.1 — Attendance marking screen~~` section — checks written against commit `11f0780`,
      a one-class one-day screen that no longer exists. They were never run and must never be
      ticked, so they are now marked ⊘ superseded, each naming the live check that replaced it:
      five in § WO-2.1 — Attendance registry, and the portrait one in § WO-2.12, which removed the
      condition rather than passing the test — portrait draws a single day column, so no row can
      spill. See the ⊘ entry in the Legend for the rule. If any pointer is judged not to cover its
      original, that box comes back open and this line reopens with it.)* *(Earlier: checked
      2026-08-08 at 246 boxes and left open with the judgement recorded.)*
      ticked, 6 open. All six are under the struck-through `WO-2.1 — Attendance marking screen`
      heading, superseded 2026-08-06 and kept as a record; they were never run against the screen
      that shipped and ticking them would be false. Read as satisfied — but it is a judgement, so it
      is written here rather than left for the next reader to re-derive.)*
- [x] `CHANGELOG.md` current. *(2026-08-08. WO-1.13 and WO-2.13 were both absent — WO-1.13 since
      2026-08-06 — and the gap was invisible until this line was checked against the file instead of
      assumed.)*
- [x] `phase/1-*` and `phase/2-*` merged to `main`; `main` is what's deployed. *(2026-08-08.
      Fast-forward to `9d09f4c`, 32 commits, 0 behind; `phase/1-shell-store-roster` was already
      contained in `main`. Pushed. "Deployed" means the LAN server above, per the decision record.)*

**If any of the three things above fails, Ship 1 does not go live and Roll Call! carries the term.**
That is not a failure of the project; it is the reason the fallback exists.

---

## WO-G2 — Ship 2 gate: first grades

**Ship** 2 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** WO-2.5, WO-2.6, WO-3.1, WO-3.2, WO-3.3, WO-3.4, WO-3.5, WO-3.6, WO-3.7, WO-3.8, WO-3.9
**Target** ~2026-09-15, before the first grades are entered for real

*(That line was `Phase 3, WO-2.5 … WO-2.7` until 2026-08-09. It was rewritten for two reasons, both
found while writing the Ship 2 table. **The ellipsis was not a range to the tool** — `depsOf()` reads
`WO-` tokens, so it saw WO-2.5 and WO-2.7 and never WO-2.6, which sat in the middle of the range and
was therefore gating nothing. **And "Phase 3" is not a token at all**, so ten work orders this gate
genuinely waits on were invisible to it; they are written out. WO-2.7 came off the line the same day,
deferred — see its work order.)*

***WO-3.10 came off this line on 2026-08-10, and it is the correction that matters most of the three.***
*It was the OAuth verification paperwork, and the tooling reads `Depends on` as **must be ✅ DONE** —
so this gate could not pass until Google's review queue cleared. **Ship 2 is first grades and contains
no sync.** The intent was always "start the paperwork during Phase 3", which is a scheduling statement
and was written in the one field that turns it into a blocker. Worse, it blocked on something that
could not be started: WO-3.10 required a verified domain, which required a naming decision sitting in
Phase 8. Left alone, a gate named for grade arithmetic would have slipped on a queue nobody here
controls, for a feature it does not ship. The paperwork's real deadline is Phase 7, and WO-7.3 owns the
box it closes.*

**Why it exists.** Grade math wrong in September is discovered in November, by a guardian. The 1.0
criteria demand grade math "verified against hand-computed cases" — this is where that happens, on
the owner's real classes, before the numbers matter.

- [ ] Every case in `docs/grade-math-cases.md` (WO-3.4) verified by hand.
- [ ] A real class's weighted grade computed by hand and matched against the app, including at least
      one student with a `missing`, one with an `excused`, and one with an empty category.
- [ ] The letter scale matches what the owner actually uses, including the boundary case that
      rounding would have gotten wrong.
- [ ] Grades entered for one real assignment across all five classes in under 20 minutes.
- [ ] The printout order matches the SIS entry screen, confirmed against a real re-key.
- [ ] Backup drill re-run now that grades exist.
- [ ] `TESTING.md` Phase 3 section fully passing.
- [ ] WO-3.18 OAuth paperwork **submitted**, with the date recorded. *(This line said **WO-3.10**
      until 2026-08-11. After the 2026-08-10 split WO-3.10 is the client and the consent screen and
      submits nothing — so as written, the box named a work order that could never close it. **Read
      this before Ship 2 rather than at it:** WO-3.18 needs the domain WO-8.7 settles, so if that
      naming and hosting decision has not been made, this cannot be ticked. The answer is to make the
      decision or to move this line to a later gate deliberately — waving it through is the one
      option these trackers exist to prevent.)*
- [ ] **The `**Ship** —` work orders get a ship, or keep `—` on purpose.** Phases 5–8 and WO-G4 carry
      `—` because the delivery table in [`../ROADMAP.md`](../ROADMAP.md) stops at Ship 3 — outreach,
      calendar, sync and packaging are all *"Then | Nov →"*. By the time this gate runs, Ship 3 is
      the next thing in front of you and what follows it is no longer hypothetical, so this is the
      first honest moment to name it. *(Added 2026-08-09, when the field was written into thirty-three
      work orders that had never carried one. A `—` that nobody revisits becomes the same invisible
      blank it replaced, which is why this is a gate line and not a note.)*

---

## WO-G3 — Ship 3 gate: signals

**Ship** 3 · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** Phase 4
**Target** October 2026, once 4–6 weeks of real data exist

**Why it exists.** Signals tuned against thin data produce lists nobody trusts, and a teacher who
stops reading the list has lost the feature permanently — quietly, without anyone deciding to kill it.

- [ ] At least four weeks of real grades and attendance exist before the thresholds are tuned.
- [ ] **Every flag reproducible by hand** from the numbers it shows — walk all nine concern rules
      and all five praise rules against real students.
- [ ] **Two consecutive weekly runs produce visibly different lists.** If they don't, the cooldown
      or the delta ranking is wrong, and this is the test that catches it.
- [ ] The praise list ranks by delta: verify a case where an improving B− student outranks a steady A.
- [ ] The quiet-middle list names students the owner agrees they had lost track of. Ask them.
- [ ] Thresholds adjusted from defaults to what the owner actually wants, and the defaults in
      [`../../docs/data-model.md`](../../docs/data-model.md) updated if reality disagreed with them.
- [ ] `TESTING.md` Phase 4 section fully passing.

---

## WO-G4 — The 1.0.0 call

**Ship** — · **Status** ⬜ NOT STARTED · **Size** S · **Depends on** every work order
**Closes roadmap** → the *What 1.0.0 means* section, which is a heading and a set of criteria rather
than a box — there is nothing here for `--tick` to tick, and the quotation marks are off it on
purpose so the sweep does not read it as a fragment *(2026-08-08, WO-2.15)*

**Why it exists.** *This is an argument, not a scoreboard, and ticking every box is the trigger for
the call, not the call itself.* Write the argument down; each criterion gets a sentence of evidence,
not a checkmark.

| Criterion | Bar | Evidence |
|---|---|---|
| Data loss possible under normal use | **No.** Eviction warned about, backups nagged, restore proven, conflicts never silently resolved. **The only absolute blocker.** | |
| Advertised features all work | Every README feature run end-to-end against real data | |
| A stranger can install it unaided | Install → first attendance mark, no documentation, no warning screen | |
| Attendance ledger correct | Taken / dropped / not-taken never confused, past-date marking works, percentages match hand counts across a term of a randomly shifting rotation | |
| Grade math correct | Weighted categories, redistribution, late/missing/excused, letter scale verified against hand-computed cases — including all-excused categories, zero-point assignments, a term with one assignment | |
| Signals honest | Every flag reproducible by hand. Praise ranks by delta | |
| Sensitive data contained | Accommodations invisible in presentation mode, absent from every merge field, named in `FERPA.md` | |
| Known limitations documented | Written down before launch, not discovered by a user | |
| Manual checklist passing | `TESTING.md` fully checked, on desktop and a real iPad | |
| Distribution decided | Name and channel settled | |

**Explicitly not required for 1.0:** an automated test suite, SIS integration, translation of
outreach, multi-teacher or admin accounts, and any vendor-hosted backend.

- [ ] Every row above has evidence written in, not a checkmark.
- [ ] Planbook has survived **a full term** in the classroom.
- [ ] Only then: Roll Call! may be considered for decommissioning. Until this box, it stays deployed.
- [ ] `CHANGELOG.md` has a real `## [1.0.0]` entry, tagged on `main`.
