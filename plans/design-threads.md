# Design threads — what is being talked through and drawn before anything is built

**Started 2026-10-13**, the owner's call, the day `plans/first-run.md` became the first thread to be
run this way on purpose. Read this to see what design conversations are open, what each is waiting
on, and where it went once it was decided.

## What a thread is, and why it is not a work order

A **design thread** is a conversation about how part of the app should look or behave, worked out by
talking and drawing **before** anything is booked. It is not a work order and does not go through the
pipeline — no `wo-gate`, no `--start`, no dispatch, no `TESTING.md` section. The pipeline's ceremony
exists to make *building and verifying* trustworthy; a thread's risk is a different one — deciding the
wrong thing, or deciding the right thing and losing the record of why. A commit that moves a thread
names the thread (`Draw first-run …`, `Rule first-run's …`), not a `WO-` id.

**A thread is one design note, `plans/<topic>.md`**, and that note is its single home until it is
booked: the direction reached, the owner's rulings with their dates, the open questions, and the ideas
set aside. Its second line is a status line in this vocabulary:

| Status | Means | Waiting on |
|---|---|---|
| **talking** | Direction being worked out in conversation; nothing drawn | the conversation |
| **drawn** | A drawing exists under `design/mockups/` per [`PROTOCOL.md`](../design/mockups/PROTOCOL.md) | the owner's reading and answers |
| **ruled** | The owner has answered the questions that decide what gets built | booking |
| **booked** | Cut into M/S work orders, each linking back here | the pipeline |
| **built** | Every work order it produced is ✅ | nothing — kept as the record |
| **set aside** | Decided against, or parked; the note says which and why | a reason to reopen |

**Questions live in three places at most, and only one is the list.** The drawing marks each guess in
amber where it is drawn (PROTOCOL rule 10) — that is where a reader is looking. The **design note**
holds the collected list and every answer. The mockups README's section for the drawing points at the
note rather than copying the list. At booking, each question that a work order depends on becomes that
work order's starting point — a *Ruled* block, or an *Open* line if it is genuinely the implementer's to
settle — and the thread's status becomes **booked**.

**An idea set aside inside a thread** stays in its note while the thread is open. If it outlives the
thread — still wanted after the thread is booked — it moves to [`future-features.md`](future-features.md)
with a pointer back.

## Open threads

| Thread | Status | Waiting on | Drawing | Became |
|---|---|---|---|---|
| [First run — a landing page, then two ways in](first-run.md) | **drawn** 2026-10-13 | The owner's answers to the drawing's ten questions | [`first-run-flow.html`](../design/mockups/first-run-flow.html) | — (WO-8.6 points at it; likely re-cut into M/S rows) |
| [Closing a quarter — record what went to the SIS](closing-a-quarter.md) | **drawn** 2026-10-23 | The owner's reading, and the drawing's seven questions. A soft clock: ~two weeks after Q1 ends, 2026-10-31 | [`closing-a-quarter.html`](../design/mockups/closing-a-quarter.html) | — |

## Before this file — design notes that were already settled

These were written as decision records before threads had a name. They are listed so the set is
complete, not re-statused.

| Note | Settled | What it decided |
|---|---|---|
| [Gradebook surfaces](gradebook-surfaces.md) | 2026-08-09 | Which gradebook screens are views and which stay modals; drawn in the first mockup round |
| [Rotating schedule](rotating-schedule.md) | 2026-08-03 | There is no schedule model, and why the next session will want one anyway |
| [Verification tooling](verification-tooling.md) | 2026-08-04 | One script and never a test framework |
