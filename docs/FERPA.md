# Planbook and Student-Data Privacy — a guide for administrators

**In one sentence:** Planbook never sends student data anywhere — there is no vendor server to send
it to, no account to create, and every record stays in the browser on the teacher's own device.

**What it is:** Planbook is a teacher's own gradebook, attendance ledger and outreach assistant —
**not** your school's official record. The authoritative record remains your student information
system; Planbook does not connect to it, does not read from it and does not replace it.

**Last updated 20 August 2026.** The teacher-facing version of the same facts is the
[privacy policy](https://planbook.hwgteach.com/privacy), and the two are kept in step by hand: this
document is written for a district review, that one for a teacher and for Google's OAuth
verification. Neither restates the other's argument, and where they state the same fact — what
leaves the device — they state it in the same words on purpose.

---

## What data the app handles

Entered by the teacher, for the teacher's own classes:

- Student names, and any nickname or note the teacher types
- Class lists, terms, grading categories and weights
- Attendance — present, tardy, absent, excused, dismissed — and hall-pass logs
- Assignments, scores, and teacher-marked flags: late, missing, excused
- Guardian, counselor and case-manager names, email addresses and phone numbers, where the teacher
  enters them
- A record of the outreach the teacher has sent — the document keeps a place for it, and the
  feature that writes to it is not in the released app yet
- **Accommodation and plan information: IEP and 504 status, accommodations, plan review dates,
  medical needs, and behavior plans.** This is the most sensitive data in the app and it has its
  own section below.

No date of birth, no government identifier, and no student ID beyond whatever a teacher chooses to
type into a name or a note field. No photographs. No location data. No device identifiers.

## Where it lives, and who can see it

```
   Teacher's device                          Teacher's own Google Drive
   ┌────────────────────────┐                ┌──────────────────────────┐
   │ Planbook, in a browser │  ─ optional ─▶ │ one file, app-created,   │
   │ IndexedDB on the disk  │    sync, off   │ owned by the teacher     │
   └────────────────────────┘    by default  └──────────────────────────┘
```

- One document per school year, held in the browser's own storage (IndexedDB) on the device the
  teacher typed it on. It is not a shared database and there is no copy of it anywhere else.
- Anyone who can unlock that device and open that browser profile can read it. That is the honest
  boundary, and it is the same boundary a paper gradebook has: the lock on the drawer.
- The app is installed to the home screen and works with the network off. Nothing about it requires
  connectivity, an account, or a sign-in.

## What the vendor receives: nothing

**There is no vendor server, no vendor database, no account, no login, no analytics and no
tracking of any kind.** Planbook is a static web page and the files it is made of. It has no
backend, which is a stronger statement than a promise not to use one: there is no endpoint in the
code for student data to be sent to, and the repository is public, so that can be checked rather
than believed.

**You can verify it yourself in two minutes.** Open the browser's developer tools, Network tab, and
use the app: once the page and its own files have loaded, mark attendance, enter grades, open a
student — and nothing goes out. No request carries anything the teacher typed, because there is
nowhere for it to go.

The one third party in the picture is the **static web host** that serves the app's own files
(HTML, JavaScript, stylesheets and icons). Like any web server it logs requests for those files —
an IP address and a file path — which is the ordinary record of a browser fetching a web page. It
never receives student data, because student data is never part of a request.

## What leaves the device, when, and to where

<!-- THE DATA-FLOW STATEMENT. privacy.html carries this same statement, deliberately: WO-8.12
     exists because two documents that describe what leaves the device in two different sets of
     words are two documents that will eventually disagree in public. Change it here and change it
     there in the same sitting. Phase 7 rewrites both the day sync comes out from behind its
     flag. -->

**Nothing leaves it on its own.** Loading the page fetches Planbook's own files from the website,
the way any web page does, and the browser checks those same files for updates. Beyond that,
Planbook makes no network requests at all: no analytics, no usage tracking, no error reporting, no
advertising, and no third-party code of any kind.

Student information moves only when the teacher moves it, and there are three ways to do that. Each
is a deliberate act, and it is visible as it happens:

1. **Saving a backup file** — a school year, or every year, written to a file wherever the
   teacher's browser saves downloads. It is a file on the teacher's disk and it is not sent
   anywhere.
2. **Turning on Google Drive sync** — optional, off unless switched on, uploading the year's file
   to the *teacher's own* Google Drive so that a laptop and an iPad show the same gradebook. *Not
   in the released app yet.*
3. **Sending a message the teacher drafted** — Planbook hands a drafted email to the teacher's own
   mail application, where the teacher reads it, edits it and sends it. Planbook never sends mail
   itself, and the sent copy lands in the teacher's own sent folder. *Not in the released app yet.*

There is no fourth destination.

**The Google permission, when sync is turned on, is one:**
`https://www.googleapis.com/auth/drive.file` — access to files this app itself created, and nothing
else in the teacher's Drive. Not the teacher's other documents, not their spreadsheets, not their
mail. The reasoning is in the privacy policy linked above and, for an engineer, in
[`sync.md`](sync.md).

## Accommodation, medical and behavior-plan information

This is the section that matters most, and it is the one this document has that most tools' do not.

Planbook **deliberately** holds IEP and 504 status, individual accommodations, case-manager
contacts, plan review dates, medical needs such as an allergy or a seizure protocol, and behavior
plans. The reason is the teacher's legal obligation to implement them: an accommodation the teacher
cannot see at the moment of use is an accommodation that gets missed, and a list nobody opens
protects nobody. So the app surfaces them where the work is: creating a test tells the teacher how
many of that class's students have extended time or need a separate setting, without naming one of
them on a screen that might be facing the room.

Holding that data raises the stakes, so three rules are built into the app rather than promised in
a document:

1. **Never visible by default on a screen that might be projected.** Teachers put gradebooks and
   attendance on a classroom wall. IEP status on that wall is a disclosure to thirty students. A
   list shows a small dot beside the name and nothing else; the details open only on a deliberate
   tap.
2. **A presentation mode that suppresses every sensitive field at once**, app-wide, for exactly
   that moment.
3. **No drafted message can ever contain it.** The outreach feature is not in the released app yet;
   when it ships, its merge fields will refuse accommodation, medical and plan data by
   construction, rather than merely omitting it from the standard templates. A template system
   makes an IEP disclosure a one-keystroke mistake unless it is impossible.

## Backups, and what is in one

**A Planbook backup file contains IEP and 504 plan details, accommodations, case managers, plan
review dates, medical needs and behavior plans, in plain readable text**, along with the roster,
attendance, grades and contacts. It is not redacted and it is not encrypted.

That is the correct posture rather than an oversight, and it is the same posture a paper folder
has: a backup that filtered out the support details would not bring the teacher's gradebook back,
and a restore that silently dropped a student's accommodations would be worse than no restore. The
teacher is the custodian of the file exactly as they are the custodian of a folder of the same
information.

Two things make that a decision rather than a trap:

- **The app says so on the screen where a backup is saved**, in as many words, naming
  accommodations, IEP and 504 plans, case managers, review dates, medical needs and behavior plans
  — and saying the file is plain text that anyone who opens it can read.
- **Backups are the app's answer to data loss, and they are nagged for.** iOS deletes the stored
  data of a website that has not been used for about seven days unless the app has been installed
  to the home screen, so the downloadable file is not a nicety; it is what stands between a holiday
  and a term of lost grades.

**Practical guidance for a district:** treat a Planbook backup the way you would treat a printed
class folder or an exported spreadsheet of the same records. Keep it on the teacher's own storage,
not in email, and not on a shared drive that the rest of a department can browse.

## How this maps to FERPA

FERPA governs how a school discloses education records to outside parties. The relevant **technical
fact** is that there is no outside party: student data never leaves the teacher's device except by
the three deliberate acts listed above. The first writes a file to the teacher's own disk, and the
two that involve another company at all — Drive and email — use accounts the teacher, and often the
district, already controls. No vendor, server or database receives it.

Because of that, adopting Planbook introduces **no new third party** for your team to evaluate, and
no data-processing relationship comes into being. Whether that means no additional data-privacy
agreement is required, and how a teacher-held record of this kind fits your obligations, is a
determination for your district's own privacy review. This guide's job is to give that review the
technical facts it needs, not to reach the conclusion on your behalf.

> *This document describes how the software works. It is not legal advice and it does not make a
> compliance determination on any district's behalf. Confirm any tool against your own policies
> before adopting it.*

## Practical safeguards, and one honest caveat

- **The caveat first: nothing here is encrypted.** Browser storage is ordinary storage and a backup
  file is plain text. Planbook does not claim otherwise, because a claim that cannot be verified
  next to facts that can is worth less than nothing. What protects the data is the device: a screen
  lock, no shared logins, and a browser profile that belongs to one teacher.
- **Install it to the home screen.** An installed app keeps its data; a bookmarked website can have
  its storage evicted by the operating system after about a week of disuse. This is a data-safety
  step, not a convenience one.
- **Save backups, and keep them where you would keep a paper folder.** Not in email, not on a
  shared drive.
- **Presentation mode before you project.** One control, app-wide, and it is what makes it safe to
  put an attendance screen on a wall.
- **Sync is optional, and the app is fully functional signed out — permanently.** A teacher whose
  district blocks third-party apps loses nothing but the convenience of two devices holding the
  same file.
- **The source is public.** Every claim in this document is a claim about code at
  [github.com/wildbil2me/planbook](https://github.com/wildbil2me/planbook), where it can be read.
  It is released under the
  [Apache License 2.0](https://github.com/wildbil2me/planbook/blob/main/LICENSE.md), so a district
  that wants to keep its own copy of the code a teacher is using may take one.

---

*Questions about Planbook, including this document, go to the contact named on the
[privacy policy](https://planbook.hwgteach.com/privacy) — kept in one place so there is one address
to change.*
