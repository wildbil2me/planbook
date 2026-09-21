# WO-G2 runbook — the first-grades gate

For working [WO-G2](work-orders/gates.md#wo-g2--ship-2-gate-first-grades) from the school laptop.
The gate has nine boxes. They sort into four kinds: work that needs a real grade-entry session,
desk work, one box that may already be done, and two decisions. **Nothing here gets ticked in the
gate itself from this page.** Fill in the blanks under **Record**, then bring the results back to a
session at home, where the boxes are ticked against what you wrote down.

*Written 2026-09-21. The gate unlocked 2026-09-07. Its target was ~2026-09-15 and has passed. That
does not block anything, but it is why nothing below should wait for a perfect week.*

**Never write a student's name on this page.** The repository is public. Use initials, or "student
A / B / C", and keep the mapping in your head or on paper.

---

## At a glance

| # | Box | Kind | Where |
|---|---|---|---|
| 1 | All 15 cases in `docs/grade-math-cases.md` verified by hand | Desk | Anywhere |
| 2 | A real class's grade hand-computed, with a `missing`, an `excused` and an empty category | Real grades | Laptop, any class |
| 3 | The letter scale is yours, boundary case included | Real grades | Laptop, Settings |
| 4 | One assignment across all five classes in under 20 minutes | **Entry session** | Laptop, stopwatch |
| 5 | The printout order matches the SIS entry screen | **Entry session** | Laptop + SIS |
| 6 | Backup drill, now that there are grades to lose | Real grades | Laptop, and the iPad |
| 7 | `TESTING.md` Phase 3 fully passing | Probably done | Home, by reading |
| 8 | WO-3.18 submitted, date recorded, or the line moved | Decision | Home |
| 9 | Phases 5–8 get a ship, or keep `—` on purpose | Decision | Home |

**Boxes 4 and 5 belong together:** one sitting, one assignment, a stopwatch and the SIS open in
another tab. Everything else can happen around them.

---

## Before the entry session: take a backup

Download a backup from the backup panel and move it off the laptop (a USB stick or your own Drive)
**before** doing anything else on this page. Box 6 wipes storage deliberately, and this copy is the
one that exists if something goes wrong.

- Backup taken, date/time: `__________`  Stored at: `__________`

---

## Box 4 — five classes in under 20 minutes

Pick **one** real assignment that all five classes have: the same task, or one assignment per class
from the same week. Enter it for real.

1. Start the stopwatch when you open the first class's grid, not when you sit down.
2. Enter every student's score in all five classes. Mark `missing`, `late` and `excused` as you
   normally would; the app never infers them from a due date.
3. Stop the stopwatch when the fifth class's last score is in.

**The bar is 20 minutes for all five.** If it takes longer, the useful record is *where* the time
went: the grid, the keyboard, looking up who was absent, or the SIS in the other window.

**Record**

| Class | Students | Time for this class | Anything that slowed you |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
| **Total** | | **`____` min** | |

- First real entry session, or a later one? `__________` *(The box was written for the first, on
  Sep 8. A later session is a weaker measurement because you are faster by now. It still counts, but
  say which it was.)*

---

## Box 5 — printout order against the SIS

Straight after box 4, while the scores are fresh:

1. Print (or open the print view of) the grades for one class. This is WO-3.9's printout.
2. Open the SIS grade-entry screen for the same class and assignment.
3. Re-key the scores from the printout into the SIS, **top to bottom, without skipping around.**

The question is whether the printout's order of students is the SIS's order, so the re-key is a
straight run down both lists. One out-of-place student is a failure worth recording, because that is
how a score lands on the wrong child.

**Record**

- Class re-keyed: `____`  Students: `____`
- Orders matched top to bottom? **yes / no**
- If no: where did they diverge? (By position, e.g. "rows 14–15 swapped". **No names.**)
  `______________________________`
- Likely cause (hyphenated surname, preferred name, a mid-year add, a dropped student still listed):
  `______________________________`

---

## Box 3 — the letter scale

The app ships with a conventional scale in `src/store.js`:

| A | A- | B+ | B | B- | C+ | C | C- | D+ | D | D- | F |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 93 | 90 | 87 | 83 | 80 | 77 | 73 | 70 | 67 | 63 | 60 | 0 |

**There is no separate rounding rule** (`docs/data-model.md` § Letter grades). If the school or the
SIS treats 89.5 as an A-, the band's minimum is **89.5**, not 90. That is the boundary case this box
is about: a student at 89.6 gets a B+ from the app and an A- from the SIS, and a guardian finds out
in November.

1. Find out what the SIS actually does at a boundary: does it round, truncate, or neither? The
   quickest test is a real student near a line, or the district's grading policy.
2. Compare every band above with the scale you actually use. Edit it in Settings if it differs.
3. Find one real student within half a point of a boundary and check the app's letter matches the
   SIS's letter.

**Record**

- SIS behaviour at a boundary: **rounds / truncates / neither / don't know** `__________`
- Bands that differ from the table above: `______________________________`
- Boundary student checked: percentage `____`, app letter `____`, SIS letter `____`, match? **y / n**

---

## Box 2 — one real class, computed by hand

Choose a class where, **this term**:

- at least one student has a score marked `missing`,
- at least one student has a score marked `excused`,
- at least one category has **no assignments yet** (so its weight redistributes).

These are marked by you, never inferred, so if no class has all three yet, this box waits for a
week that does. **Do not mark a real score just to close this box.**

For each of the three students:

1. Write each category's points earned over points possible. `missing` counts as **zero earned,
   full points possible**. `excused` counts as **neither**: it leaves the category entirely.
2. Turn each category into a percentage.
3. Drop the empty category, and scale the remaining weights up so they add to 100. For example,
   with weights 50/30/20 and the 20 empty: `50/80` and `30/80`.
4. Weighted sum → percentage → letter, from box 3's scale.
5. Compare with the app.

**Record** (no names)

| Student | Case it covers | Your % | App % | Your letter | App letter | Match |
|---|---|---|---|---|---|---|
| A | `missing` | | | | | |
| B | `excused` | | | | | |
| C | empty category | | | | | |

- Class used (period or course, not a name): `____`  Empty category: `____`
- Anything that disagreed, and by how much: `______________________________`

A disagreement is the most important thing this page can find. Write down the numbers exactly as
both sides showed them, and do not correct anything in the app.

---

## Box 6 — backup drill, with real grades

The same drill Ship 1 ran on 2026-08-08, re-run now that a wipe would cost grades as well as
attendance.

1. Download a **fresh** backup (not the one from the top of this page).
2. Note a few figures you can check afterwards: one class's grade for three students, one class's
   assignment count, one attendance percentage.
3. Wipe the site's storage. In Edge: DevTools → Application → **Clear site data**. This takes the
   service worker with it, which also makes it a reinstall test.
4. Reload, restore from the backup you just downloaded.
5. Check the figures from step 2, plus: every class, every student, every score, every `missing`
   and `excused` mark.
6. **Do it on the iPad too.** The Ship 1 drill required the iPad, and the iPad is where storage is
   actually at risk.

**Record**

| Device | Backup file (date/time) | Restored cleanly | Figures matched | Notes |
|---|---|---|---|---|
| Laptop | | | | |
| iPad | | | | |

---

## Box 1 — the fifteen hand-computed cases (desk work)

`docs/grade-math-cases.md` holds fifteen worked cases. The engine's harness already checks the app
against them. **This box asks a person to check the arithmetic in the document itself**, because a
wrong expected value is a test that passes against a wrong engine.

Each case uses its own small scale (A ≥ 90, B ≥ 80, C ≥ 70, F ≥ 0) unless it says otherwise, and
percentages are unrounded. Work each one on paper and tick it here.

| # | Case | Checked |
|---|---|---|
| 1 | Three weighted categories | ☐ |
| 2 | One assignment in the term | ☐ |
| 3 | Category with no assignments | ☐ |
| 4 | Every score in a category is excused | ☐ |
| 5 | Zero-point assignment adds extra credit | ☐ |
| 6 | Extra credit above 100 percent | ☐ |
| 7 | Category containing only zero-point assignments | ☐ |
| 8 | Weights cross from 95 to 100 | ☐ |
| 9 | Missing compared with excused | ☐ |
| 10 | Late is a record, not a penalty | ☐ |
| 11 | Blank cell compared with no key | ☐ |
| 12 | Every category empty | ☐ |
| 13 | An assignment filed under another class does not count | ☐ |
| 14 | An assignment filed under another term does not count | ☐ |
| 15 | A second and third student's cells do not count | ☐ |

The file is on GitHub at `docs/grade-math-cases.md` and reads fine in the browser. Note any case
where your answer and the document's disagree: `______________________________`

---

## Box 7 — `TESTING.md` Phase 3 (probably done already)

A count on 2026-09-21 found **232 ticked boxes and none open** in `TESTING.md` § Phase 3. The only
`- [ ]` a search turns up is inside a paragraph about a line deferred to WO-4.4, and WO-4.4 has been
✅ since 2026-08-24. This one is closed at home by reading the section properly, not at school.

---

## Box 8 — WO-3.18: submit it, or move the line

The gate's note says this box "cannot close from a desk" because the demo video waited on WO-7.2.
**That is out of date: WO-7.2 has been ✅ since 2026-09-07**, and WO-3.18 is ⬜ and buildable. The
filming procedure is `plans/wo-3-18-video-runbook.html`.

Two honest answers. Pick one:

- **Submit.** Film the video, finish the consent screen, submit, and write the date here:
  `__________`
- **Move the line to WO-7.3**, on purpose and in writing. WO-7.3 is where the verification promise
  is actually enforced, and this gate is named for grade arithmetic, not sync.

The one wrong answer is leaving it open without choosing.

- Decision: **submit / move** `__________`

---

## Box 9 — a ship for Phases 5–8

Phases 5–8 and WO-G4 carry `**Ship** —` because the delivery plan stopped at Ship 3 and called
everything after it "Then | Nov →". That is no longer true: outreach (Phase 5), the calendar (Phase
6) and sync (Phase 7) are partly built and in use. The box asks for a ship number for each, or a
deliberate `—`.

| Phase | What it is | Ship |
|---|---|---|
| 5 | Outreach | `____` |
| 6 | Calendar | `____` |
| 7 | Sync | `____` |
| 8 | Packaging | `____` |
| WO-G4 | The 1.0.0 call | `____` |

---

## Bringing it back

Take a photo of the filled-in page, or type the **Record** blocks into a message, and start a session
at home with "WO-G2 results". Every box is ticked there, against what you recorded. A box whose
record is blank stays open, and that is fine: the gate closes when all nine are true, not by a date.
