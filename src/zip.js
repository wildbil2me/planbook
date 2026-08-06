/*
  A ZIP file, written by hand out of raw bytes.

  WHY THIS FILE EXISTS, and it is a hardware failure rather than a preference. WO-1.11 shipped
  "Back up all N years" as a loop: one <a download> per year, 400ms apart, through the same
  mechanism the one-year button had already been proven with on an iPad. On 2026-08-05 the teacher
  ran it on the installed home-screen PWA and got exactly one file. iOS answers a download in an
  installed PWA with the native "Open in…" sheet, which is a full context switch away from the
  page; coming back does not resume the JS that was in flight, so the loop's second iteration —
  and the status line after the loop — never ran. No gap fixes that, because the interruption
  happens the instant the page goes away, not when a timer expires. One download event per tap is
  all an installed PWA gets, so N files have to arrive inside ONE download event.

  That is the whole of this module: turn N named strings into one archive, so the existing
  <a download> hand-off in src/backup.js (which works, on that exact hardware, for one file) can
  carry all of them. Restore never sees a zip — the teacher unzips it in Files with a tap and each
  year is the same loose .json the one-year button writes, byte for byte. Nothing in the recovery
  path learned a new shape, which is the property the original decision was made to protect.

  STORED, NOT DEFLATED, decided rather than defaulted. The browser will compress for us —
  CompressionStream('deflate-raw') is ZIP method 8's exact payload and is available everywhere
  this app runs (Safari 16.4+) — and a year of pretty-printed JSON would shrink by roughly 10×.
  It is still not what this writes, for three reasons in order of weight:

    1. This is the recovery path. A STORED entry's "compressed" bytes ARE the file's bytes, so
       the only thing between the teacher's data and her disk is a header and a checksum. Every
       failure mode of a compressor — a mis-sized stream, a flush that never landed, a browser
       bug on a 40 MB input — is a failure mode of the backup, and it would show up as an archive
       that unzips to something subtly wrong on the day everything else has already gone wrong.
    2. STORED is verifiable by a reader written in an afternoon, which is what tools/
       verify-shell.mjs does: Node has no zip reader and this repo will not add one, so the
       checks parse these bytes back with a matching hand-written reader and CRC every entry.
       Evidence beats compression.
    3. Size is not the teacher's problem here. Five years is tens of megabytes on a disk or in
       iCloud Drive, once a week, and she is not mailing it anywhere.

  The door is deliberately left open: `method` is a field in both headers below, and adding
  method 8 is "compress the bytes, keep the CRC and the uncompressed size, write the compressed
  length" — no other part of this file changes. It would have to become async, which is the other
  reason not to do it today: the hand-off above is the one thing that has been proven to survive
  an installed PWA, and moving more work in front of it is how it stops being proven.

  What is deliberately NOT here: zip64, encryption, directory entries, comments, data descriptors
  (bit 3), and reading. Sizes are checked against the 32-bit fields rather than assumed to fit.
*/

const LOCAL_SIG = 0x04034b50;   /* PK\3\4 */
const CENTRAL_SIG = 0x02014b50; /* PK\1\2 */
const EOCD_SIG = 0x06054b50;    /* PK\5\6 */

const LOCAL_HEADER_BYTES = 30;
const CENTRAL_HEADER_BYTES = 46;
const EOCD_BYTES = 22;

/* 2.0 is what a STORED entry needs and the oldest thing every unzipper agrees on. Claiming more
   would tell a reader to refuse a file it can in fact read. */
const VERSION = 20;
/* Bit 11: the file names below are UTF-8. They are ASCII today (a year and a date), so this
   changes nothing that can be observed — it is set because the alternative is a lie that becomes
   true the first time a name carries a character above 127. */
const FLAG_UTF8 = 0x0800;
const METHOD_STORED = 0;

/* The 32-bit size fields. An entry or an archive past this needs zip64, which this does not
   write — so it throws instead, because a truncated size field produces an archive that looks
   fine and unpacks to garbage. A school year is 3-6 MB (docs/data-model.md), so this is a guard
   against a future that has not happened, not a limit anybody will meet. */
const MAX_32 = 0xffffffff;

/* CRC-32 (IEEE 802.3, polynomial 0xEDB88320 reflected), table-built on first use. Every zip
   entry carries one, and it is the only thing in the format that can tell a reader the bytes
   arrived intact — which for a backup is the point rather than a formality. */
let crcTable = null;
function table() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

export function crc32(bytes) {
  const t = table();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* MS-DOS date and time, which is what the format carries — two 16-bit fields, two-second
   resolution, no time zone. Built from LOCAL time for the same reason dateStamp() in
   src/backup.js is: the stamp a teacher compares against her own memory of Friday afternoon is
   the one her clock showed. Anything before 1980 cannot be represented; a device whose clock is
   that wrong gets 1980 rather than a wrapped year. */
function dosStamp(now) {
  const year = Math.max(1980, now.getFullYear());
  return {
    time: (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate(),
  };
}

/* A cursor over one pre-sized buffer. The whole archive is measured before a byte is written, so
   there is no growing, no concatenating, and no chance of the central directory's recorded
   offsets disagreeing with where the bytes actually went — those offsets are the part of the
   format a reader trusts absolutely. */
function writer(size) {
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  let at = 0;
  return {
    u16(n) { view.setUint16(at, n & 0xffff, true); at += 2; },
    u32(n) { view.setUint32(at, n >>> 0, true); at += 4; },
    raw(b) { bytes.set(b, at); at += b.length; },
    at() { return at; },
    done() {
      if (at !== size) {
        throw new Error('zip: wrote ' + at + ' bytes into a ' + size + '-byte archive');
      }
      return bytes;
    },
  };
}

/*
  entries: [{ name, text }] — one file each, in the order given, which is the order they list in.

  Returns a Uint8Array. The caller wraps it in a Blob; this module never touches the DOM, so the
  whole of it can be driven from a harness without a download landing anywhere.

  Duplicate names throw rather than being written. A zip is allowed to hold two entries with one
  name and every unzipper resolves that differently — one of them silently. Here it could only
  ever mean two school years produced the same file name, which is a bug in the caller worth
  stopping on rather than a collision a teacher discovers in the Files app.
*/
export function zipStored(entries, now) {
  if (!Array.isArray(entries) || !entries.length) {
    throw new Error('zip: there are no files to put in the archive.');
  }
  const encoder = new TextEncoder();
  const stamp = dosStamp(now instanceof Date ? now : new Date());
  const seen = new Set();

  const parts = entries.map((entry) => {
    const name = String(entry.name || '');
    if (!name) throw new Error('zip: a file in the archive has no name.');
    if (seen.has(name)) throw new Error('zip: two files in the archive are called “' + name + '”.');
    seen.add(name);
    const nameBytes = encoder.encode(name);
    const data = entry.bytes instanceof Uint8Array ? entry.bytes : encoder.encode(String(entry.text));
    if (data.length > MAX_32) {
      throw new Error('zip: “' + name + '” is too large for a zip file this writer can produce.');
    }
    return { nameBytes, data, crc: crc32(data) };
  });

  let total = EOCD_BYTES;
  parts.forEach((p) => {
    total += LOCAL_HEADER_BYTES + p.nameBytes.length + p.data.length;
    total += CENTRAL_HEADER_BYTES + p.nameBytes.length;
  });
  if (total > MAX_32) {
    throw new Error('zip: the archive would be larger than a zip file this writer can produce.');
  }

  const w = writer(total);

  /* Local file header + the bytes themselves, one block per entry. The offset each header starts
     at is kept for the central directory below — that is the only cross-reference in the format,
     and it is why nothing may be written out of order after this point. */
  parts.forEach((p) => {
    p.offset = w.at();
    w.u32(LOCAL_SIG);
    w.u16(VERSION);
    w.u16(FLAG_UTF8);
    w.u16(METHOD_STORED);
    w.u16(stamp.time);
    w.u16(stamp.date);
    w.u32(p.crc);
    w.u32(p.data.length);   /* compressed size — the same number, because STORED */
    w.u32(p.data.length);   /* uncompressed size */
    w.u16(p.nameBytes.length);
    w.u16(0);               /* no extra field */
    w.raw(p.nameBytes);
    w.raw(p.data);
  });

  /* The central directory: the index every unzipper actually reads. It repeats each local
     header's fields — a reader is entitled to believe either copy, so they have to agree — and
     adds where that header sits. */
  const centralAt = w.at();
  parts.forEach((p) => {
    w.u32(CENTRAL_SIG);
    w.u16(VERSION);         /* version made by: 2.0, MS-DOS, no external attributes claimed */
    w.u16(VERSION);         /* version needed to extract */
    w.u16(FLAG_UTF8);
    w.u16(METHOD_STORED);
    w.u16(stamp.time);
    w.u16(stamp.date);
    w.u32(p.crc);
    w.u32(p.data.length);
    w.u32(p.data.length);
    w.u16(p.nameBytes.length);
    w.u16(0);               /* extra field length */
    w.u16(0);               /* file comment length */
    w.u16(0);               /* disk number start */
    w.u16(0);               /* internal file attributes: not marked as text */
    w.u32(0);               /* external file attributes: no unix mode, no DOS read-only */
    w.u32(p.offset);
    w.raw(p.nameBytes);
  });
  const centralBytes = w.at() - centralAt;

  /* End of central directory. A reader finds this by scanning backwards from the last byte, which
     is why nothing may follow it. One disk, no archive comment. */
  w.u32(EOCD_SIG);
  w.u16(0);                 /* this disk */
  w.u16(0);                 /* the disk the central directory starts on */
  w.u16(parts.length);      /* entries on this disk */
  w.u16(parts.length);      /* entries in total */
  w.u32(centralBytes);
  w.u32(centralAt);
  w.u16(0);                 /* no archive comment */

  return w.done();
}
