/* backup-restore.mjs — backup & restore, every year on the device, the compare and the nag
 *
 * WO-1.26 moved these lines out of tools/verify-shell.mjs. They are copied verbatim —
 * same text, same indentation, no re-wrapping — so that the split is a move and nothing else,
 * and so that a body written at the top level of a 32,000-line script still reads the way its
 * author left it. Nothing here launches a browser, a server or a document of its own: the entry
 * file owns all three and hands them over on `h`. `tools/README.md` § "Driving a browser over
 * CDP" says where a new check goes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
/* The harness's one answer to "what day is it", so the file-name stamp below moves with
   `--today` exactly as the page's own clock does. */
import { nodeNow, nodeNowMs } from './lib-dates.mjs';

export async function run(h) {
const { SCHEMA_NOW, udd, check, skip, send, evalJs, has, clickSel, KILL_ANIM, INSTALL_WALKER,
  waitForBoot, seam } = h;

/* ───────────────── backup & restore ─────────────────
 *
 * WO-1.5's acceptance lines, all of which are about what happens to a file and to storage and
 * none of which a person looking at the app can settle. They are driven through
 * window.planbook.backup for one specific reason: a script cannot hand a page a real File, so
 * no harness can put a file through the file input or the drop target. Everything AFTER the
 * read is the same code either way, and restoreFromText() is that seam. The real drop, the real
 * Files-app download, and a thumb on a 44px target stay owed to a human.
 *
 * The confirm dialog is driven by clicking its actual buttons rather than by calling
 * confirmRestore(), because "the confirm names what is being replaced" and "cancelling changes
 * nothing" are claims about controls a teacher touches.
 */

console.log('\n--- backup & restore ---');

/* Downloads land in the throwaway profile dir, which is deleted at the bottom of this file. A
   real <a download> click is the only mechanism that works in an installed PWA, so the check
   drives the real one — and without this it would leave a Planbook backup in whoever-ran-it's
   Downloads folder. */
let downloadsRedirected = false;
try {
  await send('Browser.setDownloadBehavior',
    { behavior: 'allow', downloadPath: path.join(udd, 'downloads') }, false);
  downloadsRedirected = true;
} catch { /* older build without the Browser domain; the file lands in Downloads instead */ }

/* The store section above ends by leaving the in-memory document permanently unwritable, on
   purpose. A reload clears it, and the backup checks need a document that can be saved. */
await send('Page.reload');
await new Promise(r => setTimeout(r, 600));
const backupBooted = await waitForBoot();
await evalJs(KILL_ANIM);
await evalJs(INSTALL_WALKER);

const backupSeam = await evalJs("!!(window.planbook && window.planbook.backup"
  + " && typeof window.planbook.backup.restoreFromText === 'function')");

if (!backupBooted || !backupSeam) {
  skip('backup & restore: round trip, refusals, the confirm, the nag, the boot-failure exit',
    backupBooted ? 'no window.planbook.backup seam on the page — it is kept deliberately for this file to read through, so its absence is a defect and not a stage of the build; see the window.planbook block at the foot of src/shell.js'
      : 'the app did not boot before this section');
} else {
  check('downloads were redirected into the throwaway profile (else this litters Downloads)',
    downloadsRedirected, downloadsRedirected ? path.join(udd, 'downloads') : 'Browser.setDownloadBehavior refused');

  /* Seeded with the two kinds of data the file has to carry: ordinary roster fields, and the
     support details CLAUDE.md calls the most sensitive data in the app. The backup is the ONE
     surface that is allowed to contain the second kind, and a check that it is still in there
     is the check that stops a later work order from "fixing" the file for safety. */
  const YEAR = await evalJs('window.planbook.store.getDoc().year');
  const built = await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){
      d.teacher.name = 'Backup Probe';
      /* DELIBERATELY NO terms ARRAY. This class is the legacy shape the section at the class-view
         checks depends on — "a class stored with no terms at all still renders". Giving it terms
         here was tried on 2026-08-08 to un-skip the WO-2.4 block and broke two checks: that one,
         and the one requiring every term id to match tm_ plus ten generated characters. The
         WO-2.4 block supplies its own term and takes it back out again; see the note there.
         NO BACKTICKS IN THIS COMMENT — it lives inside a template literal. */
      d.classes = [{ id:'c_b1', name:'Period 3 — Biology' }];
      d.students = [
        { id:'s_b1', first:'Ada', last:'Probe',
          supports:{ plan:'IEP', medical:'epi-pen in the nurse office', accommodations:[{ kind:'extended-time' }] } },
        { id:'s_b2', first:'Bo', last:'Probe', supports:{ plan:'none' } }];
    });
    await s.flush();
    var file = await window.planbook.backup.buildBackup();
    var doc = s.getDoc();
    return { name:file.name, text:file.text, rev:doc.rev, docId:doc.docId,
             whole: JSON.stringify(JSON.parse(file.text)) === JSON.stringify(doc) }; })()`);
  const TEXT = JSON.stringify(built.text);

  /* The date on the file is the LOCAL one, and this check has to derive it the same way
     src/backup.js does or it is testing a different fact. It compared against
     `toISOString().slice(0,10)` until WO-1.7 — that is UTC, so from 8pm EDT onward it demanded
     tomorrow's date and failed on a correct build. It passed at every other hour, which is how it
     survived three work orders. The app is right: a teacher in EDT downloading at 8pm expects
     today's date on her file, so `dateStamp()` builds it from getFullYear/getMonth/getDate and so
     does this. Stricter about the right value rather than looser about the wrong one. */
  const localStamp = (() => {
    const now = nodeNow();
    const pad = (n) => String(n).padStart(2, '0');
    return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  })();
  check('the backup file is the whole year document, and its name carries the year and the date',
    built.whole && built.name === 'Planbook ' + YEAR + ' backup ' + localStamp + '.json',
    built.name + ' · ' + built.text.length + ' bytes');
  check('and it still contains the support data — a backup that filtered it out is not a recovery path',
    /epi-pen in the nurse office/.test(built.text) && /"plan": "IEP"/.test(built.text),
    'medical and plan fields present in the file');

  const copy = await evalJs(`(function(){ var m = document.getElementById('backupModal');
    return m ? m.textContent.replace(/\\s+/g, ' ') : ''; })()`);
  check('the backup UI says in words what sensitive data the file contains',
    /accommodation/i.test(copy) && /medical/i.test(copy) && /IEP/.test(copy)
      && /504/.test(copy) && /behavior plan/i.test(copy),
    copy ? 'panel copy is ' + copy.length + ' characters and names accommodations, IEP/504, medical, behavior plans'
      : 'no #backupModal on the page');

  /* The nag, at four ages. A single "it appeared" sample cannot tell a working threshold from a
     strip that is always up. */
  const nag = await evalJs(`(async function(){ var b = window.planbook.backup, p = window.planbook;
    var y = window.planbook.store.getDoc().year;
    var el = document.getElementById('backupNag'), day = 24*60*60*1000;
    function state(){ return !el.classList.contains('hidden'); }
    /* The preference is a map of year → epoch ms, so every age below is set for the year that
       is actually open. Writing a bare number here is what the old shape did, and it is the
       shape the cross-year check further down exists to keep out. */
    function stamp(ms){ var m = {}; if (ms) { m[y] = ms; } p.setPref('lastBackupAt', m); }
    stamp(Date.now() - 2*day); b.refreshBackupNag();
    var atTwoDays = state();
    stamp(Date.now() - 8*day); b.refreshBackupNag();
    var atEightDays = state();
    var lead = (document.getElementById('backupNagLead')||{}).textContent;
    stamp(0); b.refreshBackupNag();
    var never = state();
    await b.downloadBackup();
    return { year:y, atTwoDays:atTwoDays, atEightDays:atEightDays, lead:lead, never:never,
             afterDownload: state(), pref: (p.getPref('lastBackupAt')||{})[y],
             status: document.getElementById('backupStatus').textContent }; })()`);
  check('the nag appears when the last backup is over 7 days old, and says how long ago',
    nag.atEightDays === true && /8 days ago/.test(nag.lead || ''),
    'at 8 days: shown=' + nag.atEightDays + ' lead=' + JSON.stringify(nag.lead));
  check('and it names the year it is talking about',
    new RegExp(nag.year).test(nag.lead || ''),
    'lead = ' + JSON.stringify(nag.lead));
  check('and it stays down at 2 days, and comes up when there has never been one',
    nag.atTwoDays === false && nag.never === true,
    'at 2 days shown=' + nag.atTwoDays + ', never-backed-up shown=' + nag.never);
  check('a successful download clears the nag and stamps the planbook_ preference for that year',
    nag.afterDownload === false && Math.abs(nodeNowMs() - nag.pref) < 120000,
    'planbook_lastBackupAt[' + nag.year + '] = ' + nag.pref + ', nag shown = ' + nag.afterDownload);

  /*
    The cross-year check, and the reason it exists rather than the reason it is thorough.

    Until 2026-08-04 the timestamp was one number for the whole browser, so downloading the open
    year marked every other year on the device as backed up too and the strip went quiet for a
    year that had never been written to a file. Nothing caught it: every check above samples one
    year, and one year is exactly the case where the bug is invisible. A second year, with
    something in it to lose, is the whole of the fixture.

    It runs against the year the store already has from the year-switching checks, so it creates
    nothing — and it puts the open year back afterwards, because everything below assumes it.
  */
  const otherYear = await evalJs(`(async function(){ var s = window.planbook.store,
      b = window.planbook.backup, was = s.getDoc().year;
    var years = (await s.listYears()).filter(function(y){ return y !== was; });
    if (!years.length) return { skipped:true };
    await s.openYear(years[0]);
    /* A year with nothing typed into it never nags, by design — so give it something first. */
    s.update(function(d){ d.students.push({ id:'s-cross', first:'Cross', last:'Year' }); });
    await s.flush();
    b.refreshBackupNag();
    var shown = !document.getElementById('backupNag').classList.contains('hidden');
    var lead = (document.getElementById('backupNagLead')||{}).textContent;
    await s.openYear(was);
    b.refreshBackupNag();
    return { skipped:false, other:years[0], was:was, shown:shown, lead:lead,
             backHome: s.getDoc().year }; })()`);
  if (otherYear.skipped) {
    skip('downloading one year does not silence the nag for another',
      'only one year exists on the device at this point in the run');
  } else {
    check('downloading one year does not silence the nag for another',
      otherYear.shown === true && new RegExp(otherYear.other).test(otherYear.lead || '')
        && otherYear.backHome === otherYear.was,
      otherYear.was + ' was just downloaded; with ' + otherYear.other
        + ' open the nag is shown=' + otherYear.shown + ' saying ' + JSON.stringify(otherYear.lead));

    /* And the panel says so out loud, because the nag only fires on the year that is open: a
       teacher who never switches to the other year is never told it is unbacked-up otherwise. */
    const otherLine = await evalJs(`(async function(){ var el, tries = 0;
      window.planbook.backup.openBackupPanel(document.querySelector('[data-backup-panel]'));
      /* The line is filled after the panel opens, on purpose (src/backup.js: a recovery screen
         does not wait on the store). Poll rather than sleep — a fixed wait here would assert a
         presence too early and a stale absence forever. */
      while (tries++ < 60) {
        el = document.getElementById('backupOtherYears');
        if (el && !el.classList.contains('hidden') && el.textContent) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { hidden: !el || el.classList.contains('hidden'),
               text: el ? el.textContent.replace(/\\s+/g,' ') : '' }; })()`);
    check('and the panel says the download covers only the open year, naming the one it does not',
      otherLine.hidden === false && new RegExp(otherYear.other).test(otherLine.text)
        && /year you have open/i.test(otherLine.text),
      otherLine.hidden ? 'the line stayed hidden' : JSON.stringify(otherLine.text));
  }

  /* ─────────── WO-1.11: every year on the device, in one tap ───────────
   *
   * Four claims, and the reason this is worth 200 lines rather than "the status said Saved": the
   * failure this work order is about is a button that reports three backups and delivers one. That
   * cannot be caught by asking the page how it went — the page is the thing under suspicion — so
   * the artifact is read back OFF DISK, out of the throwaway profile's download directory, parsed,
   * and matched against the years it claims to hold. The stamps are read out of localStorage, and
   * the nag is asked about every year in turn rather than about the one that happens to be open.
   *
   * THE MECHANISM UNDER TEST CHANGED ON 2026-08-05, and these checks changed with it. The first
   * build wrote one .json per year, 400ms apart. On the teacher's installed iPad PWA that produced
   * exactly one file and no status line at all: iOS answers a download with the native "Open in…"
   * sheet, which is a context switch the in-flight JS does not come back from, so the second
   * hand-off never happened. What is measured below is the replacement — ONE zip file, built by
   * hand in src/zip.js, holding one .json per year with the names the single-year button would
   * have given them. The intent of every check here is the one it had before (every year on the
   * device is really in there, with its own roster; only what was delivered is stamped; restore
   * still takes every piece of it); the mechanism is one file instead of N, so the evidence is
   * the archive's own bytes, parsed by a reader written above rather than by a library.
   *
   * WHAT THIS STILL CANNOT PROVE, and it is the whole of the 👤 acceptance line: this is
   * Edge/Chrome over CDP on a laptop. It never saw an installed PWA, a Files app, or iOS's save
   * sheet — which is precisely the thing that broke the last build. What the checks below settle
   * is that ONE tap produces ONE archive, that the archive is well-formed and complete, that only
   * the years inside it are stamped, and that everything inside it restores. Whether iPadOS takes
   * the single hand-off and unzips what it gets stays owed to a human.
   */
  const allSeam = await evalJs("typeof window.planbook.backup.downloadAllBackups === 'function'");
  const yearsOnDevice = await evalJs('window.planbook.store.listYears()');
  const DL_DIR = path.join(udd, 'downloads');
  /* Only complete files. Chrome writes `<name>.crdownload` and renames on completion, so the .zip
     filter is what keeps a half-written archive out of the count — and every archive is parsed
     below, which catches a partial that slipped through the filter anyway.

     It filters to .zip rather than .json as of 2026-08-05, when this control stopped writing one
     file per year (see the block comment below). That also takes the single-year button's own
     .json downloads out of the way: several are already sitting in this directory from the checks
     above, and they are not this control's business. */
  const listDownloads = async () => {
    try { return (await fs.readdir(DL_DIR)).filter(n => /\.zip$/i.test(n)); } catch { return []; }
  };
  /* Name → last-modified. A SECOND run writes the same file names as the first (same years, same
     date), and whether the browser uniquifies them or overwrites them is the browser's business,
     not this app's — so "which files did this run write" is answered by a new name OR a moved
     mtime. The first version of this check diffed names only, and it went red on a correct build
     the second time around: trap 5's shape, where the check is the broken part. */
  const statDownloads = async () => {
    const out = new Map();
    for (const n of await listDownloads()) {
      try { out.set(n, (await fs.stat(path.join(DL_DIR, n))).mtimeMs); } catch { /* gone again */ }
    }
    return out;
  };
  const writtenSince = async (had) => {
    const now = await statDownloads();
    return [...now].filter(([n, t]) => !had.has(n) || had.get(n) !== t).map(([n]) => n);
  };
  /* Poll for the files, never sleep for them (trap 5). Returns whatever arrived, so a short run is
     reported as a short run rather than hanging — and it keeps watching for half a second after the
     expected number turns up, because "it wrote a file for the year it said it had skipped" is one
     of the two failures these checks exist for, and a poll that stops at `want` cannot see it. */
  const newDownloads = async (had, want, ms = 20000) => {
    const until = Date.now() + ms;
    let got = [];
    while (Date.now() < until) {
      got = await writtenSince(had);
      if (got.length >= want) {
        await new Promise(r => setTimeout(r, 600));
        return writtenSince(had);
      }
      await new Promise(r => setTimeout(r, 150));
    }
    return got;
  };

  /* ───── a minimal ZIP reader, written to mirror src/zip.js ─────
     Node has no zip reader, and this repo will not take a dependency to get one (tools/README.md:
     "Node's standard library only"). So the archive is parsed here the way the app builds it —
     find the end-of-central-directory record, walk the central directory, seek to each local
     header, take the bytes, CRC them — and every field the writer sets is read back and CHECKED
     rather than assumed. That is what keeps this evidence about the file on the disk rather than
     about what the page said it wrote, which is the same reason the sequential version of these
     checks read its .json files off disk instead of asking the page how it went.

     Deliberately strict about things a lenient unzipper would forgive: the two copies of every
     size and CRC (local header and central directory) have to agree with each other, the entry
     has to be STORED, and the CRC has to match the bytes. A writer that got any of those wrong
     produces an archive that opens fine in one tool and fails in another, which on a recovery
     path is the worst possible failure — it would be discovered on the day everything else has
     already gone wrong. */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  const crc32 = (bytes) => {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const readZip = async (name) => {
    const out = { name, error: '', entries: [] };
    let buf;
    try { buf = await fs.readFile(path.join(DL_DIR, name)); }
    catch (e) { out.error = 'could not be read: ' + (e.message || e); return out; }
    out.bytes = buf.length;
    /* Scanned backwards, the way every real reader finds it: the record is last, and nothing may
       follow it. There is no archive comment here, so it is at length-22 — but a writer that
       accidentally appended anything is exactly the bug this scan would still catch. */
    let eocd = -1;
    for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65535; i--) {
      if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) { out.error = 'no end-of-central-directory record'; return out; }
    const count = buf.readUInt16LE(eocd + 10);
    const cdSize = buf.readUInt32LE(eocd + 12);
    const cdAt = buf.readUInt32LE(eocd + 16);
    out.claimed = count;
    if (cdAt + cdSize > buf.length) { out.error = 'the central directory runs past the end'; return out; }
    let at = cdAt;
    for (let i = 0; i < count; i++) {
      if (buf.readUInt32LE(at) !== 0x02014b50) {
        out.error = 'entry ' + i + ' has no central directory header'; return out;
      }
      const method = buf.readUInt16LE(at + 10);
      const crc = buf.readUInt32LE(at + 16);
      const csize = buf.readUInt32LE(at + 20);
      const usize = buf.readUInt32LE(at + 24);
      const nameLen = buf.readUInt16LE(at + 28);
      const extraLen = buf.readUInt16LE(at + 30);
      const commentLen = buf.readUInt16LE(at + 32);
      const localAt = buf.readUInt32LE(at + 42);
      const entryName = buf.toString('utf8', at + 46, at + 46 + nameLen);
      at += 46 + nameLen + extraLen + commentLen;
      if (localAt + 30 > buf.length || buf.readUInt32LE(localAt) !== 0x04034b50) {
        out.error = '“' + entryName + '” has no local file header where the directory says';
        return out;
      }
      const localNameLen = buf.readUInt16LE(localAt + 26);
      const localExtraLen = buf.readUInt16LE(localAt + 28);
      const localName = buf.toString('utf8', localAt + 30, localAt + 30 + localNameLen);
      const dataAt = localAt + 30 + localNameLen + localExtraLen;
      const bytes = buf.subarray(dataAt, dataAt + csize);
      out.entries.push({
        name: entryName,
        stored: method === 0 && csize === usize,
        agrees: localName === entryName && buf.readUInt32LE(localAt + 14) === crc
          && buf.readUInt32LE(localAt + 18) === csize && buf.readUInt32LE(localAt + 22) === usize,
        crcOk: bytes.length === usize && crc32(bytes) === crc,
        text: bytes.toString('utf8'),
      });
    }
    return out;
  };

  if (!allSeam || yearsOnDevice.length < 2 || !downloadsRedirected) {
    skip('one tap writes one zip file holding a readable backup of every year on the device',
      !allSeam ? 'no downloadAllBackups on the backup seam'
        : yearsOnDevice.length < 2 ? 'only one year on the device, so there is nothing to compare'
          : 'downloads were not redirected into the throwaway profile, so the archive cannot be read back');
  } else {
    /*
      Cleared to nothing first, so "each year written gets its OWN stamp" is measured from an empty
      map rather than from whatever the checks above left behind — and so the nag is up for every
      year that has anything to lose before the tap, which is what makes it being down afterwards
      mean something. A year with nothing typed into it never nags by design, so the fixture counts
      how many years could nag and the assertion below is about those.
    */
    const beforeAll = await evalJs(`(async function(){ var s = window.planbook.store, p = window.planbook,
        b = window.planbook.backup, was = s.getDoc().year, out = [];
      /* A deliberately INDEPENDENT restatement of hasSomethingToLose(), not a call through the seam:
         what it is for is deciding which years OUGHT to be nagging, and asking the app that would
         make the assertion below agree with itself. Corrected at WO-1.17, when the rule it restates
         gained score cells and the two pass collections — n() is right for the arrays and wrong for
         scores, which is an object keyed by assignment (docs/data-model.md), so that one is asked
         for its columns. It is a boolean either way: any column means somebody entered a grade.
         NO BACKTICKS IN THIS COMMENT — it lives inside a template literal. */
      function n(a){ return Array.isArray(a) ? a.length : 0; }
      function cols(o){ return o && typeof o === 'object' && !Array.isArray(o) ? Object.keys(o).length : 0; }
      p.setPref('lastBackupAt', {});
      var years = await s.listYears();
      for (var i = 0; i < years.length; i++) {
        await s.openYear(years[i]);
        b.refreshBackupNag();
        var d = s.getDoc();
        out.push({ year: years[i],
                   hasSomethingToLose: (n(d.classes) + n(d.students) + n(d.assignments)
                     + n(d.attendance) + n(d.log) + n(d.events) + n(d.templates)
                     + cols(d.scores) + n(d.openPasses) + n(d.passes)) > 0,
                   nagUp: !document.getElementById('backupNag').classList.contains('hidden') });
      }
      await s.openYear(was);
      b.refreshBackupNag();
      return { years: years, rows: out, backHome: s.getDoc().year,
               stamps: p.getPref('lastBackupAt') }; })()`);
    const couldNag = beforeAll.rows.filter(r => r.hasSomethingToLose);
    check('before the tap: no year is stamped, and every year holding anything is nagging',
      beforeAll.backHome === YEAR
        && JSON.stringify(beforeAll.stamps) === '{}'
        && couldNag.length >= 2 && couldNag.every(r => r.nagUp === true),
      beforeAll.rows.map(r => r.year + (r.hasSomethingToLose ? ' (has data)' : ' (empty)')
        + ' nag=' + r.nagUp).join(', '));

    /* The panel, and the control as a teacher meets it: polled for rather than sampled, because
       openBackupPanel() does not await the read of IndexedDB that reveals it. */
    const panelState = await evalJs(`(async function(){
      window.planbook.backup.openBackupPanel(document.querySelector('header [data-backup-panel]'));
      var btn, note;
      for (var i = 0; i < 80; i++) {
        btn = document.getElementById('backupDownloadAllBtn');
        note = document.getElementById('backupAllNote');
        if (btn && !btn.classList.contains('hidden') && note && !note.classList.contains('hidden')) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { hidden: !btn || btn.classList.contains('hidden'), label: btn ? btn.textContent : '',
               disabled: btn ? btn.disabled : null,
               noteHidden: !note || note.classList.contains('hidden'),
               note: note ? note.textContent.replace(/\\s+/g, ' ') : '',
               otherYears: (document.getElementById('backupOtherYears')||{}).textContent }; })()`);
    check('with several years on the device the control appears, and its label says how many it covers',
      panelState.hidden === false && panelState.disabled === false
        && panelState.label === 'Back up all ' + yearsOnDevice.length + ' years'
        && panelState.noteHidden === false
        && /one zip file/.test(panelState.note)
        && new RegExp('all ' + yearsOnDevice.length + ' school years').test(panelState.note)
        && /unzip it/i.test(panelState.note)
        && /restores by itself/.test(panelState.note),
      'label = ' + JSON.stringify(panelState.label) + ', note = ' + JSON.stringify(panelState.note));

    const dlBefore = await statDownloads();
    await clickSel('[data-backup-download-all]');
    /* Waited on, not slept through, and waited on POSITIVELY: the run puts "Reading 3 school
       years…" up first, so a fixed sleep would sample the gap while the years are being read and
       report a run that never finished, and "anything that is not Reading" would read the message
       left behind by the check above. The never-downloaded line is polled separately because
       refreshYearCoverage() re-reads IndexedDB and is deliberately not awaited by the run that
       triggers it. */
    const ran = await evalJs(`(async function(){ var el = document.getElementById('backupStatus');
      for (var i = 0; i < 200; i++) {
        if (el && !el.classList.contains('hidden') && /^(Saved|No file was written|Planbook could not)/.test(el.textContent)) break;
        await new Promise(function(r){ setTimeout(r, 100); });
      }
      var line = document.getElementById('backupOtherYears'), gone = false;
      for (var j = 0; j < 60; j++) {
        gone = line.classList.contains('hidden');
        if (gone) break;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { status: el.textContent, cls: el.className,
               stamps: window.planbook.getPref('lastBackupAt'),
               otherYearsHidden: gone,
               disabled: document.getElementById('backupDownloadAllBtn').disabled }; })()`);
    /* ONE file, and the wait is for one: `want` is 1 rather than the year count, which is the
       whole architectural change stated as a number. newDownloads() keeps watching for another
       half-second after it arrives, so a build that also fired a per-year download would be caught
       here rather than passing as "at least one". */
    const added = await newDownloads(dlBefore, 1);

    /* The archive itself, read off the disk the browser wrote it to and parsed here with the
       reader above. This is the only evidence in this file that does not come through the page. */
    const archive = added.length === 1 ? await readZip(added[0]) : null;
    const files = [];
    for (const e of (archive ? archive.entries : [])) {
      let doc = null, error = '';
      try { doc = JSON.parse(e.text); } catch (err) { error = String(err.message || err); }
      files.push({ name: e.name, doc, error, text: e.text,
                   stored: e.stored, crcOk: e.crcOk, agrees: e.agrees });
    }
    const parsed = files.filter(f => f.doc && typeof f.doc === 'object');
    const yearsInFiles = parsed.map(f => f.doc.year).sort();
    const wellFormed = parsed.filter(f => Array.isArray(f.doc.classes)
      && Array.isArray(f.doc.students) && f.doc.scores && typeof f.doc.scores === 'object'
      && f.doc.schemaVersion === SCHEMA_NOW
      && f.name === 'Planbook ' + f.doc.year + ' backup ' + localStamp + '.json');
    check('one tap writes one zip file, holding a readable backup of every year on the device',
      added.length === 1
        && !!archive && archive.error === ''
        && archive.entries.length === yearsOnDevice.length
        && archive.entries.every(e => e.stored && e.crcOk && e.agrees)
        && parsed.length === archive.entries.length
        && wellFormed.length === parsed.length
        && JSON.stringify(yearsInFiles) === JSON.stringify(yearsOnDevice.slice().sort()),
      added.length + ' file(s) landed for ' + yearsOnDevice.length + ' year(s) on the device: '
        + (added.join(', ') || 'nothing')
        + (archive ? ' (' + archive.bytes + ' bytes' + (archive.error ? ', BROKEN: ' + archive.error : '')
          + ') holding ' + files.map(f => f.name + (f.error ? ' — UNREADABLE (' + f.error + ')'
            : f.stored && f.crcOk && f.agrees ? '' : ' — HEADERS DISAGREE')).join(', ') : ''));
    /* The entry names are the deliverable's own promise, and they are asserted above rather than
       described: what a teacher gets out of the archive has to be indistinguishable from what the
       single-year button would have handed her, or "unzip it and each year restores on its own" is
       not true of the files she is actually looking at. */

    /* Two things a count of entries cannot tell apart from a working run. The open year's entry has
       to still carry the support data — the one surface allowed to hold it, and the thing a later
       work order might "fix" out of a backup for safety. And the years read STRAIGHT OFF THE DISK,
       without being opened, have to have arrived with their rosters in them: a build that zipped
       three copies of the open document would pass every other check here. */
    const seeded = parsed.find(f => f.doc.year === YEAR);
    const unopened = parsed.filter(f => f.doc.year !== YEAR);
    check('and the years it never opened are in there with their own rosters, support data included',
      !!seeded && /epi-pen in the nurse office/.test(JSON.stringify(seeded.doc))
        && unopened.length === yearsOnDevice.length - 1
        && unopened.every(f => f.doc.docId && f.doc.docId !== seeded.doc.docId)
        && unopened.some(f => f.doc.students.length >= 1),
      (seeded ? seeded.name + ' carries the medical field' : 'no entry for the open year ' + YEAR)
        + ' · ' + unopened.map(f => f.doc.year + ' (' + f.doc.students.length + ' students, docId '
          + String(f.doc.docId).slice(0, 12) + ')').join(', '));

    check('the status names the zip and what is in it, and says a page cannot know it arrived',
      / ok($|\s)/.test(' ' + ran.cls + ' ')
        && added.every(n => ran.status.indexOf(n.replace(/ \(\d+\)\.zip$/, '.zip')) >= 0)
        && files.every(f => ran.status.indexOf(f.name) >= 0)
        && /unzip it/i.test(ran.status)
        && /Check that it arrived/.test(ran.status)
        && /support details/.test(ran.status),
      JSON.stringify(ran.status.slice(0, 300)));

    /* Each year in the archive gets its OWN stamp — the deliverable, and the half of the Traps line
       that is about not stamping ahead of the hand-off. */
    const stamped = Object.keys(ran.stamps || {}).sort();
    check('each year written gets its own lastBackupAt stamp, and every stamp is fresh',
      JSON.stringify(stamped) === JSON.stringify(yearsOnDevice.slice().sort())
        && stamped.every(y => Math.abs(nodeNowMs() - Number(ran.stamps[y])) < 180000)
        && ran.disabled === false,
      'planbook_lastBackupAt = ' + JSON.stringify(ran.stamps));

    /* And the nag is down for EVERY year, not just the one on screen — asked year by year, the way
       the cross-year check above asks it, because the strip is a fact about the open document. */
    const afterAll = await evalJs(`(async function(){ var s = window.planbook.store,
        b = window.planbook.backup, was = s.getDoc().year, out = [];
      var years = await s.listYears();
      for (var i = 0; i < years.length; i++) {
        await s.openYear(years[i]);
        b.refreshBackupNag();
        out.push({ year: years[i],
                   nagUp: !document.getElementById('backupNag').classList.contains('hidden') });
      }
      await s.openYear(was);
      b.refreshBackupNag();
      return { rows: out, backHome: s.getDoc().year,
               otherYears: document.getElementById('backupOtherYears').classList.contains('hidden') }; })()`);
    check('the nag is down for every year afterwards, not only for the one on screen',
      afterAll.backHome === YEAR && afterAll.rows.every(r => r.nagUp === false)
        && afterAll.otherYears === true && ran.otherYearsHidden === true,
      afterAll.rows.map(r => r.year + ' nag=' + r.nagUp).join(', ')
        + '; the never-downloaded line is hidden = ' + afterAll.otherYears);

    /* Acceptance 4, driven rather than reasoned: every file this control produced is fed back
       through the real restore path and has to reach the confirm. Cancelled each time — the swap
       itself has its own checks above, and this one is about what restore will ACCEPT.

       The text now comes out of the archive rather than off the disk, which is the same claim with
       one more step in it: these are the bytes a teacher gets after tapping the zip in Files, and
       restore — which has not changed and has never seen a zip — has to take every one of them. */
    const roundTrip = [];
    for (const f of parsed) {
      const text = f.text;
      roundTrip.push(await evalJs(`(async function(){ var b = window.planbook.backup;
        var ok = await b.restoreFromText(${JSON.stringify(text)}, ${JSON.stringify(f.name)});
        var m = document.getElementById('restoreConfirmModal');
        var open = !m.classList.contains('hidden');
        var button = document.getElementById('restoreConfirmBtn').textContent;
        b.cancelRestore();
        return { year: ${JSON.stringify(f.doc.year)}, ok: ok, confirmOpen: open, button: button,
                 status: document.getElementById('backupStatus').textContent }; })()`));
    }
    check('restore accepts every file this produces — each one reaches the confirm by name',
      roundTrip.length === parsed.length && roundTrip.length === yearsOnDevice.length
        && roundTrip.every(r => r.ok === true && r.confirmOpen === true
          && r.button === 'Replace ' + r.year),
      roundTrip.map(r => r.year + ': accepted=' + r.ok + ' confirm="' + r.button + '"').join(' | '));

    /*
      THE TRAPS LINE, as a fixture. One year is made unreadable in storage exactly the way a
      newer build would leave it — schemaVersion 99, the same poison the boot-failure exit uses —
      its stamp is cleared, and the run is repeated. What must be true afterwards is the whole of
      "never stamp a year that did not get delivered": that year is not an entry in the archive, it
      has no stamp, the other years are stamped and ARE entries, and the panel says which one was
      left out and why. A check that only counted files could not tell this apart from a run that
      worked.

      The victim is a year that is NOT open, because the open year comes out of memory and poisoning
      its record would prove nothing. The record is put back byte for byte at the end — everything
      after this section reads these years.
    */
    const victim = yearsOnDevice.find(y => y !== YEAR);
    const original = await evalJs(`(async function(){ return new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(victim)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; }); })()`);
    await evalJs(`(async function(){ var p = window.planbook;
      var times = p.getPref('lastBackupAt') || {};
      delete times[${JSON.stringify(victim)}];
      p.setPref('lastBackupAt', times);
      return new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite'), s = t.objectStore('years');
          var q = s.get(${JSON.stringify(victim)});
          q.onsuccess = function(){ var d = q.result; d.schemaVersion = 99; s.put(d); };
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; }); })()`);

    const dlBefore2 = await statDownloads();
    /* The victim's entry in the archive the FIRST tap wrote, which is what makes the assertion
       below non-vacuous: "this year is not in the zip" measured against a control that never put it
       in one would pass on a build that zips nothing at all. It was in there a moment ago, under a
       name this names, and now it must not be. */
    const victimWasIn = files.filter(f => f.doc && f.doc.year === victim).map(f => f.name);
    await clickSel('[data-backup-download-all]');
    const cut = await evalJs(`(async function(){ var el = document.getElementById('backupStatus');
      for (var i = 0; i < 200; i++) {
        if (el && !el.classList.contains('hidden') && /^(Saved|No file was written|Planbook could not)/.test(el.textContent)) break;
        await new Promise(function(r){ setTimeout(r, 100); });
      }
      /* The line has to come BACK, and refreshYearCoverage() re-reads IndexedDB without the run
         waiting for it, so this is polled for the same way its disappearance was above. */
      var line = document.getElementById('backupOtherYears'), text = '';
      for (var j = 0; j < 60; j++) {
        if (!line.classList.contains('hidden') && line.textContent) { text = line.textContent; break; }
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { status: el.textContent, cls: el.className,
               stamps: window.planbook.getPref('lastBackupAt'), otherYears: text }; })()`);
    const added2 = await newDownloads(dlBefore2, 1, 12000);
    /*
      The second archive, parsed the same way as the first. A second tap in one sitting produces the
      same file NAME as the first (same date), so whether the browser uniquifies it or overwrites it
      is the browser's business — trap 9, and why newDownloads() answers "this run wrote it" with a
      new name OR a moved mtime rather than with a diff of names.

      This is a stronger fixture than the sequential version's was, and the reason is the
      architecture rather than the wording: there is no longer any way for a year to be "written but
      not delivered", so what the archive holds IS what the tap produced. The old check had to
      narrow itself to the victim's own file on disk and say nothing about the other two, because a
      browser is entitled to refuse a second burst of downloads from one page (trap 8: a check that
      needs the environment to cooperate twice goes red about the environment). One file per tap
      needs it to cooperate once, so the survivors can be asserted too.
    */
    const zip2 = added2.length === 1 ? await readZip(added2[0]) : null;
    const years2 = [];
    for (const e of (zip2 ? zip2.entries : [])) {
      try { years2.push(JSON.parse(e.text).year); }
      catch (err) { years2.push('UNREADABLE:' + e.name); }
    }
    check('a year Planbook cannot read is left out of the zip, is NOT stamped, and is named on screen',
      victimWasIn.length === 1
        && added2.length === 1 && !!zip2 && zip2.error === ''
        && zip2.entries.every(e => e.name !== victimWasIn[0])
        && years2.indexOf(victim) === -1
        && JSON.stringify(years2.slice().sort())
          === JSON.stringify(yearsOnDevice.filter(y => y !== victim).sort())
        && !(cut.stamps || {})[victim]
        && Object.keys(cut.stamps || {}).length === yearsOnDevice.length - 1
        && / error($|\s)/.test(' ' + cut.cls + ' ')
        && new RegExp('holding ' + (yearsOnDevice.length - 1) + ' of ' + yearsOnDevice.length).test(cut.status)
        && new RegExp(victim + ' is not in it').test(cut.status)
        && /newer version of Planbook/.test(cut.status)
        && /still marked\s+as never backed up/.test(cut.status),
      victim + ' was in the previous archive as ' + JSON.stringify(victimWasIn) + '; this tap wrote '
        + added2.length + ' file(s) holding ' + (years2.join(', ') || 'nothing')
        + (zip2 && zip2.error ? ' (BROKEN: ' + zip2.error + ')' : '')
        + '; stamps = ' + JSON.stringify(cut.stamps)
        + '; status = ' + JSON.stringify(cut.status.slice(0, 240)));
    check('and the panel goes back to naming that year as never downloaded',
      new RegExp(victim).test(cut.otherYears) && /Back up all/.test(cut.otherYears),
      cut.otherYears ? JSON.stringify(cut.otherYears) : 'the never-downloaded line stayed hidden');

    /* The record put back exactly as it was, and the stamp with it, so nothing below inherits a
       poisoned year or a nag this section turned on. */
    await evalJs(`(async function(){ var p = window.planbook;
      var times = p.getPref('lastBackupAt') || {};
      times[${JSON.stringify(victim)}] = Date.now();
      p.setPref('lastBackupAt', times);
      return new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite');
          t.objectStore('years').put(${JSON.stringify(original)});
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; }); })()`);
    const repaired = await evalJs(`(async function(){
      var d = await window.planbook.store.readStoredDocument(${JSON.stringify(victim)});
      return { schemaVersion: d && d.schemaVersion, rev: d && d.rev }; })()`);
    check('the poisoned year is put back as it was, so the sections below inherit nothing',
      repaired.schemaVersion === SCHEMA_NOW && repaired.rev === original.rev,
      victim + ' is schema ' + repaired.schemaVersion + ' at rev ' + repaired.rev
        + ' (was schema ' + original.schemaVersion + ' at rev ' + original.rev + ')');
    await evalJs("window.planbook.closeModal('backupModal');1");
  }

  /* Every refusal, and the two things each one has to be true of: it says what was wrong, and
     it did not touch storage. A file that parses as JSON and is a shopping list has to be
     refused by name rather than by a stack trace. */
  const beforeRefusals = await evalJs(`(async function(){ var d = window.planbook.store.getDoc();
    return { rev:d.rev, docId:d.docId, students:d.students.length }; })()`);
  const refusals = await evalJs(`(async function(){ var b = window.planbook.backup;
    var good = ${TEXT}, out = [];
    async function tryIt(label, text, name){
      var ok = await b.restoreFromText(text, name);
      var st = document.getElementById('backupStatus');
      out.push({ label:label, ok:ok, msg:st.textContent, cls:st.className,
        confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') });
    }
    await tryIt('empty', '   ', 'empty.json');
    await tryIt('not JSON', '{ "year": "2026-2027", ', 'truncated.json');
    await tryIt('a shopping list', JSON.stringify({ milk:2, eggs:12 }), 'shopping.json');
    var newer = JSON.parse(good); newer.schemaVersion = 99;
    await tryIt('a newer schemaVersion', JSON.stringify(newer), 'future.json');
    var partial = JSON.parse(good); delete partial.students; delete partial.scores;
    await tryIt('half a document', JSON.stringify(partial), 'partial.json');
    var wrongKind = JSON.parse(good); wrongKind.students = 'Ada, Bo';
    await tryIt('students as text', JSON.stringify(wrongKind), 'wrong.json');
    return out; })()`);
  const afterRefusals = await evalJs(`(async function(){ var d = window.planbook.store.getDoc();
    return { rev:d.rev, docId:d.docId, students:d.students.length }; })()`);

  const refusedProperly = refusals.filter(r => r.ok === false && !r.confirmOpen
    && / error$| error /.test(' ' + r.cls + ' ')
    && /Nothing on this device has been changed\./.test(r.msg));
  check('every malformed or non-Planbook file is refused, with a message, and never reaches the confirm',
    refusedProperly.length === refusals.length,
    refusals.map(r => r.label + ': ' + (refusedProperly.includes(r) ? 'refused' : 'NOT REFUSED — ' + JSON.stringify(r))).join(' | '));
  check('and each refusal says what was actually wrong with that file, not one generic message',
    /not valid JSON|could not be read as JSON/i.test(refusals[1].msg)
      && /no school year in it/i.test(refusals[2].msg)
      && /newer version of Planbook/i.test(refusals[3].msg)
      && /missing students, scores/i.test(refusals[4].msg)
      && /students holds text where Planbook expects a list/i.test(refusals[5].msg),
    refusals.map(r => r.label + ' → ' + r.msg.slice(0, 60)).join(' | '));
  check('a refused file changes nothing — no partial apply, not even a rev',
    afterRefusals.rev === beforeRefusals.rev && afterRefusals.docId === beforeRefusals.docId
      && afterRefusals.students === beforeRefusals.students,
    JSON.stringify(beforeRefusals) + ' -> ' + JSON.stringify(afterRefusals));

  /* The confirm, named and cancellable. The live document is moved on first, so the two sides
     of the comparison genuinely differ and a dialog that printed the same document twice would
     fail this. */
  const confirmShown = await evalJs(`(async function(){ var s = window.planbook.store;
    s.update(function(d){ d.students.push({ id:'s_b3', first:'Cy', last:'Probe' }); });
    await s.flush();
    await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json');
    var m = document.getElementById('restoreConfirmModal');
    return { open: !m.classList.contains('hidden'),
             lead: document.getElementById('restoreConfirmLead').textContent,
             compare: document.getElementById('restoreCompare').textContent.replace(/\\s+/g,' '),
             button: document.getElementById('restoreConfirmBtn').textContent,
             storedRev: s.getDoc().rev, storedStudents: s.getDoc().students.length }; })()`);
  check('the restore confirm names the outgoing document and the incoming one, with counts and dates',
    confirmShown.open
      && /On this device now/.test(confirmShown.compare)
      && /In the backup file/.test(confirmShown.compare)
      && /3 students/.test(confirmShown.compare) && /2 students/.test(confirmShown.compare)
      && (confirmShown.compare.match(/Last saved/g) || []).length === 2
      && (confirmShown.compare.match(new RegExp(YEAR, 'g')) || []).length === 2
      && confirmShown.button === 'Replace ' + YEAR,
    confirmShown.compare.slice(0, 220));

  await clickSel('[data-backup-cancel]');
  const cancelled = await evalJs(`(async function(){ var s = window.planbook.store;
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(s.getDoc().year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    return { confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden'),
             panelOpen: !document.getElementById('backupModal').classList.contains('hidden'),
             status: document.getElementById('backupStatus').textContent,
             memoryStudents: s.getDoc().students.length, storedStudents: stored.students.length,
             storedRev: stored.rev }; })()`);
  check('cancelling the confirm leaves the existing document untouched, in memory and on disk',
    !cancelled.confirmOpen && cancelled.memoryStudents === 3 && cancelled.storedStudents === 3
      && cancelled.storedRev === confirmShown.storedRev && /cancelled/i.test(cancelled.status),
    JSON.stringify(cancelled));

  /* Accepting it. The document that comes back has to be the file's content exactly — rev and
     updatedAt excepted, which src/store.js's restoreDocument() moves on purpose and explains
     at length. */
  const restored = await evalJs(`(async function(){
    await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json'); return 1; })()`);
  await clickSel('[data-backup-confirm]');
  await new Promise(r => setTimeout(r, 600));
  const applied = await evalJs(`(async function(){ var s = window.planbook.store;
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var file = JSON.parse(${TEXT});
    function content(d){ var c = Object.assign({}, d); delete c.rev; delete c.updatedAt;
      return JSON.stringify(c); }
    return { identical: content(stored) === content(file),
             storedRev: stored.rev, fileRev: file.rev, memoryRev: s.getDoc().rev,
             students: stored.students.length, docId: stored.docId,
             medical: !!(stored.students[0].supports && stored.students[0].supports.medical),
             label: (document.getElementById('yearButtonLabel')||{}).textContent,
             status: document.getElementById('backupStatus').textContent,
             confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') }; })()`);
  check('accepting the confirm restores the file byte-for-byte in content, support data included',
    restored === 1 && applied.identical && applied.students === 2 && applied.medical
      && applied.docId === built.docId && !applied.confirmOpen && applied.label === YEAR,
    JSON.stringify({ identical: applied.identical, students: applied.students, label: applied.label }));
  check('and the restored document continues this device\'s rev rather than reverting to the file\'s',
    applied.storedRev === cancelled.storedRev + 1 && applied.storedRev > applied.fileRev
      && applied.memoryRev === applied.storedRev,
    'file rev ' + applied.fileRev + ', device was at ' + cancelled.storedRev
      + ', restored document is rev ' + applied.storedRev);

  /* ─────────── WO-1.15: the compare can see what it is about to delete ───────────
   *
   * Eight checks, and the fixture is the whole argument. describe() used to count `classes` and
   * `students` and nothing else, so a term of marks and an empty test document drew an IDENTICAL
   * panel — which is precisely the pair of documents `plans/work-orders/gates.md` § "The iPad stays
   * in the rotation" exists to keep apart. So the fixture here is a stored document whose ROSTER
   * MATCHES THE FILE EXACTLY and whose record does not: same one class, same two students, and
   * three recorded meetings, three marks, two assignments and three scores that the file has none
   * of. A check written against a fixture whose rosters also differed would go green against the
   * build this work order replaces.
   *
   * THE RECORD IS PLANTED ON DISK RATHER THAN THROUGH s.update(), because the compare's outgoing
   * side is readStoredDocument() — a raw get, not the open document (src/backup.js) — so the disk
   * IS the surface under test. It is lifted out first and put back byte for byte at the end, the
   * same way the poisoned-year fixture above does it, and nothing between the plant and the put-back
   * writes: restoreFromText() and cancelRestore() only read.
   *
   * FIVE FILES GO THROUGH THE SAME REAL PATH, and the three that must NOT warn matter as much as
   * the two that must. The Traps line forbids treating every replace as dangerous — a red panel on
   * a year restored from its own backup is one a teacher learns to tap through before she meets the
   * one that can destroy a term — so an equal file, a richer file and a file for a year this device
   * does not hold are each asserted silent.
   */

  /* The record planted on the stored side, and it is chosen for its arithmetic: THREE recorded
     meetings (the fourth record carries an exception and is not one), THREE attendance marks (the
     `U` is not one — docs/data-model.md: it means nobody has looked at that student yet and never
     appears in a total), two assignments, and three score cells across two columns of an object
     `count()` would answer 0 for. Every one of those three numbers is wrong on a naive counter, and
     wrong in the direction that reports a full gradebook as nothing at stake. */
  const WO115_FULL = {
    attendance: [
      { classId: 'c_b1', date: '2026-09-08', marks: { s_b1: { code: 'A' }, s_b2: { code: 'T' } } },
      { classId: 'c_b1', date: '2026-09-09', marks: { s_b1: { code: 'E' }, s_b2: { code: 'U' } } },
      { classId: 'c_b1', date: '2026-09-10', marks: {} },
      { classId: 'c_b1', date: '2026-09-11', exception: 'dropped' },
    ],
    assignments: [
      { id: 'a_wo115a', classId: 'c_b1', name: 'Cells quiz', points: 20 },
      { id: 'a_wo115b', classId: 'c_b1', name: 'Cells test', points: 100 },
    ],
    scores: { a_wo115a: { s_b1: { v: 18 }, s_b2: { v: 15 } }, a_wo115b: { s_b1: { v: 88 } } },
  };
  /* One meeting, one mark, one assignment, one score — a file that holds SOME of the term rather
     than none of it, which is the only fixture that can tell a sentence naming the DIFFERENCE from
     one reprinting the count on this device. Against the record above the excesses are 2, 2, 1, 2. */
  const WO115_THIN = {
    attendance: [{ classId: 'c_b1', date: '2026-09-08', marks: { s_b1: { code: 'A' } } }],
    assignments: [WO115_FULL.assignments[0]],
    scores: { a_wo115a: { s_b1: { v: 18 } } },
  };
  /* The same record with one more meeting, one more mark and one more score in it: the file that is
     AHEAD of the device, which is what every restore after an eviction looks like. */
  const WO115_RICHER = {
    attendance: WO115_FULL.attendance.concat(
      [{ classId: 'c_b1', date: '2026-09-14', marks: { s_b1: { code: 'A' } } }]),
    assignments: WO115_FULL.assignments,
    scores: { a_wo115a: { s_b1: { v: 18 }, s_b2: { v: 15 } },
      a_wo115b: { s_b1: { v: 88 }, s_b2: { v: 79 } } },
  };
  /* A backup file with a record dropped into it, built from the one this run already produced — so
     it is a genuine Planbook backup of this year in every respect except what it holds. */
  const wo115File = (record, year) => {
    const d = JSON.parse(built.text);
    if (record) { d.attendance = record.attendance; d.assignments = record.assignments; d.scores = record.scores; }
    if (year) d.year = year;
    return JSON.stringify(d, null, 2);
  };
  /* One file through the real restore path, one reading of the confirm, cancelled. Nothing here
     confirms: the swap has its own checks above and a confirm would write the fixture to disk. */
  const wo115Confirm = async (text, name) => await evalJs(`(async function(){
    var b = window.planbook.backup;
    var ok = await b.restoreFromText(${JSON.stringify(text)}, ${JSON.stringify(name)});
    var m = document.getElementById('restoreConfirmModal');
    var loss = document.getElementById('restoreConfirmLoss');
    var sides = [], nodes = document.querySelectorAll('#restoreCompare .restore-side');
    for (var i = 0; i < nodes.length; i++) sides.push(nodes[i].textContent.replace(/\\s+/g,' '));
    var out = { ok: ok, open: !m.classList.contains('hidden'), sides: sides,
      lossHidden: !loss || loss.classList.contains('hidden'),
      loss: loss ? loss.textContent.replace(/\\s+/g,' ') : '(no #restoreConfirmLoss element)',
      note: document.getElementById('restoreConfirmNote').textContent.replace(/\\s+/g,' '),
      button: document.getElementById('restoreConfirmBtn').textContent,
      whole: m.textContent.replace(/\\s+/g,' ') };
    b.cancelRestore();
    return out; })()`);

  const wo115Plant = await evalJs(`(async function(){
    var year = ${JSON.stringify(YEAR)}, record = ${JSON.stringify(WO115_FULL)};
    var original = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(year);
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    if (!original) return { ok:false, why:'nothing is stored for ' + year + ' to build the fixture on' };
    /* The file with a record added to it, so the rosters are identical BY CONSTRUCTION rather than
       by two lists somebody kept in step. rev and updatedAt are the stored ones: a restore reads
       rev off this record (src/store.js), and the checks after this section are about that number. */
    var full = JSON.parse(${TEXT});
    full.rev = original.rev;
    full.updatedAt = original.updatedAt;
    full.attendance = record.attendance;
    full.assignments = record.assignments;
    full.scores = record.scores;
    await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var t = db.transaction('years','readwrite');
        t.objectStore('years').put(full);
        t.oncomplete = function(){ db.close(); res(1); };
        t.onerror = function(){ rej(t.error); }; }; });
    var back = await window.planbook.store.readStoredDocument(year);
    return { ok:true, original: original, mode: window.planbook.supports.presentationMode(),
             storedRoster: JSON.stringify({ classes:(back.classes||[]).map(function(c){ return c.id; }),
                                            students:(back.students||[]).map(function(s){ return s.id; }) }),
             storedRecord: JSON.stringify({ attendance: back.attendance, assignments: back.assignments,
                                            scores: back.scores }) }; })()`);

  const fileRoster = (() => { const d = JSON.parse(built.text);
    return JSON.stringify({ classes: d.classes.map(c => c.id), students: d.students.map(s => s.id) }); })();
  const fileRecord = (() => { const d = JSON.parse(built.text);
    return JSON.stringify({ attendance: d.attendance, assignments: d.assignments, scores: d.scores }); })();
  check('the WO-1.15 fixture is real: the roster matches on both sides and only the record differs',
    wo115Plant.ok === true && wo115Plant.storedRoster === fileRoster
      && wo115Plant.storedRecord !== fileRecord
      && JSON.parse(fileRecord).attendance.length === 0,
    wo115Plant.ok
      ? 'stored and file rosters are both ' + fileRoster + '; the file holds '
        + JSON.parse(fileRecord).attendance.length + ' attendance record(s) and the stored document '
        + JSON.parse(wo115Plant.storedRecord).attendance.length
      : 'the fixture was never planted: ' + wo115Plant.why);

  const wo115Zero = await wo115Confirm(built.text, 'Planbook ' + YEAR + ' backup 2026-05-04.json');
  const wo115Stored = wo115Zero.sides[0] || '';
  const wo115Incoming = wo115Zero.sides[1] || '';
  check('the compare counts the record on both sides — meetings, marks, assignments and scores',
    wo115Zero.open === true && wo115Zero.sides.length === 2
      && /3 recorded meetings · 3 attendance marks/.test(wo115Stored)
      && /2 assignments · 3 scores/.test(wo115Stored)
      && /0 recorded meetings · 0 attendance marks/.test(wo115Incoming)
      && /0 assignments · 0 scores/.test(wo115Incoming)
      /* The roster line is the same sentence on both sides, twice on the panel: the counts that
         differ are the record's, which is the whole claim. */
      && (wo115Zero.sides.join(' ').match(/1 class · 2 students/g) || []).length === 2,
    'on this device now: ' + JSON.stringify(wo115Stored.slice(0, 150))
      + ' | in the backup file: ' + JSON.stringify(wo115Incoming.slice(0, 150))
      + ' (the stored record holds 4 attendance records, one of them dropped, and 4 mark cells, one '
      + 'of them a U — so 3 meetings and 3 marks is the dropped record and the U both excluded, and '
      + '3 scores is an object count() would answer 0 for)');
  check('and the confirm says in words what would be lost, before the button is pressed',
    wo115Zero.lossHidden === false
      && new RegExp('The ' + YEAR + ' school year on this device holds more than the file does')
        .test(wo115Zero.loss)
      && /loses 3 recorded meetings, 3 attendance marks, 2 assignments and 3 scores, which this file does not have/
        .test(wo115Zero.loss)
      && /backup taken from this device/.test(wo115Zero.loss)
      && wo115Zero.button === 'Replace ' + YEAR,
    JSON.stringify(wo115Zero.loss.slice(0, 300)) + ' · button "' + wo115Zero.button + '"');

  const wo115Thin = await wo115Confirm(wo115File(WO115_THIN), 'Planbook ' + YEAR + ' backup thin.json');
  check('what it names is the DIFFERENCE, not the count on this device — the reader does not subtract',
    wo115Thin.lossHidden === false
      && /loses 2 recorded meetings, 2 attendance marks, 1 assignment and 2 scores, which this file does not have/
        .test(wo115Thin.loss)
      && /1 recorded meeting · 1 attendance mark/.test(wo115Thin.sides[1] || '')
      && /3 recorded meetings · 3 attendance marks/.test(wo115Thin.sides[0] || ''),
    'device 3/3/2/3 against a file holding 1/1/1/1 → '
      + JSON.stringify((wo115Thin.loss.match(/loses [^—]+/) || ['(no sentence)'])[0]));

  const wo115Same = await wo115Confirm(wo115File(WO115_FULL), 'Planbook ' + YEAR + ' backup same.json');
  const wo115More = await wo115Confirm(wo115File(WO115_RICHER), 'Planbook ' + YEAR + ' backup richer.json');
  check('a file holding as much as this device, or more, gets no warning at all (the Traps line)',
    wo115Same.open === true && wo115Same.lossHidden === true && wo115Same.loss === ''
      && wo115More.open === true && wo115More.lossHidden === true && wo115More.loss === ''
      /* Non-vacuous: both panels are still drawn, still name both sides, and the richer one really
         is richer on screen — a build that never warns fails the two checks above, and a build that
         drew no panel at all would fail here. */
      && /3 recorded meetings · 3 attendance marks/.test(wo115Same.sides[1] || '')
      && /4 recorded meetings · 4 attendance marks/.test(wo115More.sides[1] || '')
      && /4 scores/.test(wo115More.sides[1] || ''),
    'own backup (3/3/2/3 both sides): warning ' + (wo115Same.lossHidden ? 'absent' : 'SHOWN')
      + '; a file at 4/4/2/4 over a device at 3/3/2/3: warning '
      + (wo115More.lossHidden ? 'absent' : 'SHOWN'));

  /* A year the device does not hold, ASKED FOR rather than assumed: `2030-2031` — gates.md's own
     example of a label that cannot be mistaken for the term — is created by the year-picker section
     three hundred lines above, so the first version of this check reported "could not be asked" and
     went red. The label is derived from the years that are really there, and an empty answer stays a
     red check rather than a silent skip. */
  const wo115Other = await evalJs(`(async function(){ var years = await window.planbook.store.listYears();
    return { years: years, open: window.planbook.store.getDoc().year }; })()`);
  const WO115_OTHER = (() => {
    for (let y = 2030; y < 2100; y++) {
      const label = y + '-' + (y + 1);
      if (wo115Other.years.indexOf(label) === -1) return label;
    }
    return '';
  })();
  const wo115Add = WO115_OTHER
    ? await wo115Confirm(wo115File(WO115_THIN, WO115_OTHER), 'Planbook ' + WO115_OTHER + ' backup.json')
    : null;
  check('restoring a year this device does not hold is unaffected — no warning it does not deserve',
    !!wo115Add && wo115Add.open === true && wo115Add.lossHidden === true && wo115Add.loss === ''
      && new RegExp('Nothing for ' + WO115_OTHER + ' is stored here').test(wo115Add.sides[0] || '')
      && /1 recorded meeting · 1 attendance mark/.test(wo115Add.sides[1] || '')
      && wo115Add.button === 'Add ' + WO115_OTHER
      && new RegExp('The year you have open, ' + wo115Other.open + ', is not touched')
        .test(wo115Add.note || ''),
    wo115Add
      ? 'a ' + WO115_OTHER + ' file holding 1/1/1/1 over a device holding '
        + JSON.stringify(wo115Other.years) + ': button "' + wo115Add.button + '", warning '
        + (wo115Add.lossHidden ? 'absent' : 'SHOWN — a safe act must not acquire one')
      : 'every label from 2030-2031 to 2099-2100 is already on this device, so this could not be asked');

  /*
    Acceptance line 4, in both presentation modes, and the mode-OFF pass is the one that matters:
    with the toggle off, support data is visible everywhere else in the app, so a panel that leaked
    it would leak it there. The sentinels are asserted present in both documents being described
    FIRST — an absence check over a document with nothing on file proves nothing — and the whole
    dialog is searched, not only the two columns, because the loss sentence and the lead are on it
    too. This panel is projected in exactly the situation the mode exists for: a teacher restoring a
    backup with the room watching.
  */
  const wo115Modes = [];
  for (const mode of [false, true]) {
    await evalJs('window.planbook.supports.setPresentationMode(' + (mode ? 'true' : 'false') + ');1');
    const seen = await wo115Confirm(built.text, 'Planbook ' + YEAR + ' backup modes.json');
    wo115Modes.push({ mode: mode, length: seen.whole.length,
      hits: ['epi-pen in the nurse office', 'IEP', 'extended-time'].filter(s => seen.whole.includes(s)) });
  }
  await evalJs('window.planbook.supports.setPresentationMode('
    + (wo115Plant.mode ? 'true' : 'false') + ');1');
  check('no support detail reaches the restore panel, in either presentation mode',
    /epi-pen in the nurse office/.test(built.text) && /"plan": "IEP"/.test(built.text)
      && /extended-time/.test(wo115Plant.storedRecord + built.text)
      && wo115Modes.length === 2 && wo115Modes.every(m => m.hits.length === 0 && m.length > 200),
    wo115Modes.map(m => 'presentation ' + (m.mode ? 'on' : 'off') + ': ' + m.length
      + ' characters of dialog, sentinels found = ' + JSON.stringify(m.hits)).join(' | ')
      + ' (all three are in the file and in the stored document, asserted here)');

  /* The stored record put back exactly as it was lifted — every check after this section reads this
     year, and one of them compares the document on disk against the file byte for byte in content. */
  await evalJs(`(async function(){ return new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){ var db = open.result;
      var t = db.transaction('years','readwrite');
      t.objectStore('years').put(${JSON.stringify(wo115Plant.original || {})});
      t.oncomplete = function(){ db.close(); res(1); };
      t.onerror = function(){ rej(t.error); }; }; }); })()`);
  const wo115Back = await evalJs(`(async function(){
    var d = await window.planbook.store.readStoredDocument(${JSON.stringify(YEAR)});
    return { text: JSON.stringify(d), mode: window.planbook.supports.presentationMode(),
             confirmOpen: !document.getElementById('restoreConfirmModal').classList.contains('hidden') }; })()`);
  check('the WO-1.15 fixture is put back byte for byte, so the sections below inherit nothing',
    wo115Plant.ok === true && wo115Back.text === JSON.stringify(wo115Plant.original)
      && wo115Back.mode === wo115Plant.mode && wo115Back.confirmOpen === false,
    'the stored ' + YEAR + ' record is identical to the one lifted out ('
      + (wo115Back.text || '').length + ' characters), presentation mode is back to '
      + wo115Back.mode + ', and no confirm was left open');

  /* The two entry points a teacher actually uses, driven as closely as a script can get. A page
     cannot be handed a File by a script — but it can be handed a DataTransfer holding one,
     which is exactly what a drop and a file picker deliver, so everything from the event inward
     is the real path including the read. A REAL drag out of Finder, and the iPad's Files sheet,
     stay owed to a human. */
  const entry = await evalJs(`(async function(){ var text = ${TEXT};
    function dt(){ var d = new DataTransfer();
      d.items.add(new File([text], 'Planbook backup.json', { type:'application/json' }));
      return d; }
    var confirmEl = document.getElementById('restoreConfirmModal');
    function confirmOpen(){ return !confirmEl.classList.contains('hidden'); }
    var zone = document.getElementById('backupDrop');

    zone.dispatchEvent(new DragEvent('dragover', { bubbles:true, cancelable:true, dataTransfer: dt() }));
    var highlighted = zone.classList.contains('active');
    zone.dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer: dt() }));
    await new Promise(function(r){ setTimeout(r, 350); });
    var dropped = confirmOpen();
    window.planbook.backup.cancelRestore();

    var input = document.getElementById('backupFile');
    input.files = dt().files;
    input.dispatchEvent(new Event('change', { bubbles:true }));
    await new Promise(function(r){ setTimeout(r, 350); });
    var chosen = confirmOpen();
    window.planbook.backup.cancelRestore();

    /* A file dropped an inch wide of the target must do nothing — and must not navigate the
       browser to it, which would take the year document in memory with it. */
    var strayEvent = new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer: dt() });
    document.body.dispatchEvent(strayEvent);
    await new Promise(function(r){ setTimeout(r, 250); });
    return { highlighted:highlighted, dropped:dropped, chosen:chosen,
             stray: confirmOpen(), strayCancelled: strayEvent.defaultPrevented,
             inputCleared: input.value === '', dropStillActive: zone.classList.contains('active') }; })()`);
  check('a dropped backup file highlights the target and goes through the same confirm',
    entry.highlighted && entry.dropped && !entry.dropStillActive,
    JSON.stringify({ highlighted: entry.highlighted, reachedConfirm: entry.dropped }));
  check('choosing a file with the file input does too, and the input is cleared so the same file can be re-chosen',
    entry.chosen && entry.inputCleared, JSON.stringify({ reachedConfirm: entry.chosen, cleared: entry.inputCleared }));
  check('a file dropped anywhere else does nothing, and the browser is stopped from opening it',
    entry.stray === false && entry.strayCancelled === true,
    'confirm opened = ' + entry.stray + ', default prevented = ' + entry.strayCancelled);

  /* Download → wipe → restore, the acceptance line in full. The record is deleted out from
     under the app and the page reloaded, which is what a teacher's evicted iPad looks like from
     inside the browser: boot() finds a different year, or none. */
  await evalJs(`(async function(){ return new Promise(function(res, rej){
    var open = indexedDB.open('planbook');
    open.onerror = function(){ rej(open.error); };
    open.onsuccess = function(){ var db = open.result;
      var t = db.transaction('years','readwrite');
      t.objectStore('years').delete(${JSON.stringify(YEAR)});
      t.oncomplete = function(){ db.close(); res(1); };
      t.onerror = function(){ rej(t.error); }; }; }); })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  await waitForBoot();
  await evalJs(KILL_ANIM);
  const wiped = await evalJs(`(async function(){
    await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json');
    return { openYear: window.planbook.store.getDoc().year,
             lead: document.getElementById('restoreConfirmLead').textContent,
             note: document.getElementById('restoreConfirmNote').textContent,
             button: document.getElementById('restoreConfirmBtn').textContent }; })()`);
  check('with the year gone from storage, the confirm says nothing is being overwritten and names the switch',
    wiped.openYear !== YEAR
      && new RegExp('no ' + YEAR + ' school year on this device').test(wiped.lead || '')
      && new RegExp('The year you have open, ' + wiped.openYear + ', is not touched').test(wiped.note || '')
      && wiped.button === 'Add ' + YEAR,
    JSON.stringify(wiped));
  await clickSel('[data-backup-confirm]');
  await new Promise(r => setTimeout(r, 600));
  const back = await evalJs(`(async function(){ var s = window.planbook.store;
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var file = JSON.parse(${TEXT});
    function content(d){ var c = Object.assign({}, d); delete c.rev; delete c.updatedAt;
      return JSON.stringify(c); }
    return { identical: stored ? content(stored) === content(file) : false,
             rev: stored && stored.rev, fileRev: file.rev, open: s.getDoc().year,
             label: (document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
  check('download → wipe the year out of storage → restore gives the document back, identical in content',
    back.identical && back.open === YEAR && back.label === YEAR && back.rev === back.fileRev + 1,
    'restored ' + back.open + ' at rev ' + back.rev + ' from a file at rev ' + back.fileRev);

  /*
    ── A BACKUP WRITTEN BEFORE WO-2.10, RESTORED (WO-2.10 acceptance 14) ──

    The file on a teacher's disk today holds `"marks": { "s_1": "A" }` — bare strings, schema 1 —
    and there is no way to re-download it in the new shape, because the app that wrote it is gone.
    So the restore path is the only thing standing between her and a term of attendance that comes
    back half-converted, and it has to come out RIGHT rather than merely come out.

    It is driven end to end through the real path: the same restoreFromText() a drop and a file
    picker land in, the same confirm dialog, the same button. Nothing here calls the migration.
    The file is built from the one the run already produced, so it is a genuine Planbook backup in
    every respect except the two this check is about — its schemaVersion and the shape of its cells.

    FIVE THINGS ARE ASSERTED ON THE RECORD ON DISK, which is the only place the answer counts:
    every cell is an object, every code survived, no `at` was invented for a mark that never had
    one, the `at` that WAS in the file (a hand-written one, because a pre-WO-2.10 file cannot have
    any) is not disturbed, and the document is stamped at the current schema so the conversion
    cannot run a second time. The confirm is asked to have SAID so as well: "brought up to date
    from an older version" is what tells the teacher her file was older than her app.

    Nothing is put back afterwards, deliberately: the block below poisons this year's record and
    then restores the good file over it, so the next check's fixture is what cleans up.
  */
  const OLD_FILE = await evalJs(`(function(){
    var doc = JSON.parse(${TEXT});
    doc.schemaVersion = 1;
    doc.attendance = [
      { classId:'c_b1', date:'2026-09-08', marks:{ s_b1:'A', s_b2:'T' } },
      { classId:'c_b1', date:'2026-09-09', marks:{ s_b1:'', s_b2:'E' } },
      { classId:'c_b1', date:'2026-09-10', exception:'dropped' }
    ];
    return JSON.stringify(doc); })()`);
  await evalJs(`(async function(){
    await window.planbook.backup.restoreFromText(${JSON.stringify(OLD_FILE)},
      'Planbook ${YEAR} backup 2026-05-01.json'); return 1; })()`);
  const oldConfirm = await evalJs(`(function(){
    return { open: !document.getElementById('restoreConfirmModal').classList.contains('hidden'),
             compare: document.getElementById('restoreCompare').textContent.replace(/\\s+/g,' ') }; })()`);
  await clickSel('[data-backup-confirm]');
  await new Promise(r => setTimeout(r, 600));
  const converted = await evalJs(`(async function(){
    var stored = await new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ res(q.result); db.close(); };
        q.onerror = function(){ rej(q.error); }; }; });
    var cells = [];
    (stored.attendance || []).forEach(function(r){
      Object.keys(r.marks || {}).forEach(function(k){
        cells.push({ student:k, date:r.date, value:r.marks[k],
                     isObject: !!r.marks[k] && typeof r.marks[k] === 'object',
                     code: r.marks[k] && r.marks[k].code, at: r.marks[k] && r.marks[k].at }); });
    });
    return { schemaVersion: stored.schemaVersion, records: (stored.attendance || []).length,
             cells: cells, dropped: (stored.attendance || []).filter(function(r){ return r.exception; }).length }; })()`);
  check('restoring a backup written before WO-2.10 produces object cells, codes intact and no invented time',
    /* Two rungs now, and the confirm names both. A file this old climbs 1 → 2 (cells became
       objects) and then 2 → 3 (the two hall-pass collections), and the dialog says so in the words
       the teacher reads before agreeing to anything. */
    oldConfirm.open && /older version \(1→2, 2→3\)/.test(oldConfirm.compare)
      && converted.schemaVersion === SCHEMA_NOW && converted.records === 3 && converted.dropped === 1
      && converted.cells.length === 3
      && converted.cells.every(c => c.isObject && c.at === undefined)
      && converted.cells.map(c => c.date + ':' + c.student + '=' + c.code).sort().join(' ')
        === '2026-09-08:s_b1=A 2026-09-08:s_b2=T 2026-09-09:s_b2=E',
    'the file held bare strings at schema 1; on disk the cells are '
      + JSON.stringify(converted.cells.map(c => c.date + ' ' + c.student + ' ' + JSON.stringify(c.value)))
      + ' in ' + converted.records + ' record(s) at schema ' + converted.schemaVersion
      + '; the confirm said ' + (/older version/.test(oldConfirm.compare)
        ? JSON.stringify((oldConfirm.compare.match(/Brought up to date[^·]*/) || [''])[0].trim())
        : 'NOTHING about the file being older'));

  /* The boot-failure exit. WO-1.4 holds the loading screen up on a document written by a newer
     build, deliberately — and until WO-1.5 that screen had no way out at all. The document is
     poisoned in storage the way a newer build would have left it, and the whole recovery is
     driven from the screen the teacher would actually be looking at. */
  await evalJs(`(async function(){ window.planbook.setPref('openYear', ${JSON.stringify(YEAR)});
    return new Promise(function(res, rej){
      var open = indexedDB.open('planbook');
      open.onerror = function(){ rej(open.error); };
      open.onsuccess = function(){ var db = open.result;
        var t = db.transaction('years','readwrite'), s = t.objectStore('years');
        var q = s.get(${JSON.stringify(YEAR)});
        q.onsuccess = function(){ var d = q.result; d.schemaVersion = 99; s.put(d); };
        t.oncomplete = function(){ db.close(); res(1); };
        t.onerror = function(){ rej(t.error); }; }; }); })()`);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 600));
  /* Poll for the failure, rather than sleeping and hoping: boot is asynchronous, and a single
     early sample cannot tell "refused" from "still loading". */
  let refusedBoot = null;
  for (let i = 0; i < 40 && !refusedBoot; i++) {
    try {
      refusedBoot = await evalJs(`(function(){ var box = document.getElementById('loadingError');
        if (!box || box.classList.contains('hidden')) return null;
        return { stuck: !document.getElementById('loadingScreen').classList.contains('hidden'),
                 detail: document.getElementById('loadingErrorDetail').textContent,
                 exits: document.querySelectorAll('#loadingError [data-backup-panel]').length }; })()`);
    } catch { /* the document is still swapping under us */ }
    if (!refusedBoot) await new Promise(r => setTimeout(r, 150));
  }
  await evalJs(KILL_ANIM);
  check('a document from a newer schemaVersion still stops boot, and says why',
    !!refusedBoot && refusedBoot.stuck && /newer version of Planbook/.test(refusedBoot.detail || ''),
    refusedBoot ? refusedBoot.detail.slice(0, 110) : 'the loading error never appeared');
  if (!refusedBoot) {
    skip('the boot-failure screen offers a reachable way back in from a backup file',
      'boot did not fail, so there was no failure screen to escape from');
    skip('with one un-downloaded year and no year open, nothing names a control that is not there',
      'boot did not fail, so the state this check is about could not be built');
    skip('and that fixture puts every year back, so the sections below inherit nothing',
      'boot did not fail, so nothing was taken away to put back');
  } else {
    await clickSel('#loadingError [data-backup-panel]');
    const exit = await evalJs(`(function(){ var m = document.getElementById('backupModal');
      return { panelOpen: !!m && !m.classList.contains('hidden'),
               downloadDisabled: document.getElementById('backupDownloadBtn').disabled,
               downloadLabel: document.getElementById('backupDownloadBtn').textContent }; })()`);
    check('the boot-failure screen offers a reachable way back in from a backup file',
      refusedBoot.exits === 1 && exit.panelOpen && exit.downloadDisabled === true,
      'exits on the screen = ' + refusedBoot.exits + ', panel opened = ' + exit.panelOpen
        + ', download button says "' + exit.downloadLabel + '"');

    await evalJs(`(async function(){
      await window.planbook.backup.restoreFromText(${TEXT}, 'Planbook backup.json'); return 1; })()`);
    await clickSel('[data-backup-confirm]');
    await new Promise(r => setTimeout(r, 700));
    const recovered = await evalJs(`(async function(){ var s = window.planbook.store;
      var stored = await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var q = db.transaction('years','readonly').objectStore('years').get(${JSON.stringify(YEAR)});
          q.onsuccess = function(){ res(q.result); db.close(); };
          q.onerror = function(){ rej(q.error); }; }; });
      return { loadingHidden: document.getElementById('loadingScreen').classList.contains('hidden'),
               storedVersion: stored.schemaVersion, students: stored.students.length,
               open: s.getDoc().year,
               label: (document.getElementById('yearButtonLabel')||{}).textContent }; })()`);
    check('and restoring from there replaces the unreadable document and starts the app',
      recovered.loadingHidden && recovered.storedVersion === SCHEMA_NOW && recovered.students === 2
        && recovered.open === YEAR && recovered.label === YEAR,
      JSON.stringify(recovered));

    /*
      THE ONE STATE WO-1.11 GOT WRONG, built on purpose because nothing in this run reached it by
      accident. The never-downloaded line named "Back up all N years" — and the control it names is
      hidden by refreshBackupAllControl() whenever the device holds exactly one year, while the line
      hid itself only when no year was un-downloaded. Three conditions have to hold together for the
      two to disagree, and each one is already somewhere in this run on its own:

        · getDoc() is null   — only on the boot-failure screen, forty lines above, where by then
                               every year is stamped, so the line has nothing to say;
        · exactly one year   — only three hundred lines above the backup section, where a document
                               is open, so the line excludes it as "the year you have open";
        · that year unstamped.

      All three at once and the panel read: "… 2026-2027 is also on this device and has never been
      downloaded — “Back up all 1 year” writes it out too" — naming a button that is not on the
      screen, under a label the code above is written specifically never to show anybody.

      Built by taking the device down to one year rather than by reasoning about it: the other year
      records are lifted out whole, put aside in this process, and put back byte for byte below.
      Every stamp is cleared, the survivor is poisoned to schema 99 the same way the fixture above
      poisons it, and the panel is opened from the failure screen the teacher would be looking at.

      Asserted as a state that HOLDS rather than as one sample, per trap 5 and for the same reason as
      the one-year check three hundred lines above: refreshYearCoverage() re-reads IndexedDB without
      the panel waiting for it, so a single early sample cannot tell a correct silence from a refresh
      that has not landed. The strip may stay hidden or it may speak — what it may not do is name a
      control that is not on screen, so the assertion is on the words "Back up all" never appearing
      anywhere in the panel, which the markup's own fallback label ("Back up every year") leaves free
      to mean exactly that.
    */
    const solo = await evalJs(`(async function(){
      var p = window.planbook;
      var kept = ${JSON.stringify(YEAR)};
      var stamps = p.getPref('lastBackupAt');
      var records = await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var q = db.transaction('years','readonly').objectStore('years').getAll();
          q.onsuccess = function(){ res(q.result); db.close(); };
          q.onerror = function(){ rej(q.error); }; }; });
      await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite'), s = t.objectStore('years');
          records.forEach(function(d){ if (d.year !== kept) s.delete(d.year); });
          var q = s.get(kept);
          q.onsuccess = function(){ var d = q.result; d.schemaVersion = 99; s.put(d); };
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; });
      p.setPref('lastBackupAt', {});
      p.setPref('openYear', kept);
      return { records: records, stamps: stamps }; })()`);

    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    let soloRefused = null;
    for (let i = 0; i < 40 && !soloRefused; i++) {
      try {
        soloRefused = await evalJs(`(function(){ var box = document.getElementById('loadingError');
          return (!box || box.classList.contains('hidden')) ? null
            : { exits: document.querySelectorAll('#loadingError [data-backup-panel]').length }; })()`);
      } catch { /* the document is still swapping under us */ }
      if (!soloRefused) await new Promise(r => setTimeout(r, 150));
    }
    await evalJs(KILL_ANIM);
    if (soloRefused) await clickSel('#loadingError [data-backup-panel]');
    const named = soloRefused ? await evalJs(`(async function(){
      var p = window.planbook, s = p.store;
      var years = await s.listYears();
      var stamps = p.getPref('lastBackupAt') || {};
      var panel = document.getElementById('backupModal');
      var line = document.getElementById('backupOtherYears');
      var btn = document.getElementById('backupDownloadAllBtn');
      var note = document.getElementById('backupAllNote');
      var controlSeen = 0, lineSeen = 0, said = '', offence = '';
      for (var i = 0; i < 40; i++) {
        if (btn && !btn.classList.contains('hidden')) controlSeen++;
        if (note && !note.classList.contains('hidden')) controlSeen++;
        if (line && !line.classList.contains('hidden')) {
          lineSeen++;
          if (line.textContent) said = line.textContent;
        }
        var all = panel ? (panel.textContent.match(/Back up all[^”"]*/) || [])[0] : '';
        if (all && !offence) offence = all;
        await new Promise(function(r){ setTimeout(r, 25); });
      }
      return { years: years, docNull: !s.getDoc(), stamped: !!stamps[${JSON.stringify(YEAR)}],
               panelOpen: !!panel && !panel.classList.contains('hidden'),
               controlSeen: controlSeen, lineSeen: lineSeen, said: said, offence: offence }; })()`)
      : null;
    if (!named) {
      skip('with one un-downloaded year and no year open, nothing names a control that is not there',
        'the loading error never appeared on the one-year device, so the panel could not be opened '
          + 'from the screen this check is about');
    } else {
      check('with one un-downloaded year and no year open, nothing names a control that is not there',
        named.years.length === 1 && named.docNull === true && named.stamped === false
          && named.panelOpen === true && named.controlSeen === 0 && named.offence === '',
        'years on the device = ' + JSON.stringify(named.years) + ', nothing open = ' + named.docNull
          + ', stamped = ' + named.stamped + '; the multi-year control stayed hidden across 40 '
          + 'samples over 1s (' + named.controlSeen + ' sightings); the panel said "Back up all …" '
          + (named.offence ? 'in ' + JSON.stringify(named.offence) : 'nowhere') + '; the '
          + 'never-downloaded strip was ' + (named.lineSeen ? 'shown: ' + JSON.stringify(named.said)
            : 'hidden'));
    }

    /* Every year put back exactly as it was lifted, stamps and all, and the survivor un-poisoned by
       the same put — everything below this section reads these years. */
    await evalJs(`(async function(){
      var p = window.planbook;
      await new Promise(function(res, rej){
        var open = indexedDB.open('planbook');
        open.onerror = function(){ rej(open.error); };
        open.onsuccess = function(){ var db = open.result;
          var t = db.transaction('years','readwrite'), s = t.objectStore('years');
          ${JSON.stringify(solo.records)}.forEach(function(d){ s.put(d); });
          t.oncomplete = function(){ db.close(); res(1); };
          t.onerror = function(){ rej(t.error); }; }; });
      p.setPref('lastBackupAt', ${JSON.stringify(solo.stamps || {})});
      p.setPref('openYear', ${JSON.stringify(YEAR)});
      return 1; })()`);
    await send('Page.reload');
    await new Promise(r => setTimeout(r, 600));
    const soloBack = await waitForBoot();
    await evalJs(KILL_ANIM);
    await evalJs(INSTALL_WALKER);
    const restoredAll = await evalJs(`(async function(){ var s = window.planbook.store;
      var d = s.getDoc();
      return { years: await s.listYears(), open: d && d.year, schemaVersion: d && d.schemaVersion,
               stamps: window.planbook.getPref('lastBackupAt') }; })()`);
    check('and that fixture puts every year back, so the sections below inherit nothing',
      soloBack && restoredAll.years.length === solo.records.length && restoredAll.open === YEAR
        && restoredAll.schemaVersion === SCHEMA_NOW
        && JSON.stringify(restoredAll.stamps) === JSON.stringify(solo.stamps || {}),
      'booted = ' + soloBack + ', years = ' + JSON.stringify(restoredAll.years) + ' (took '
        + solo.records.length + ' away), open = ' + restoredAll.open + ' at schema '
        + restoredAll.schemaVersion + ', stamps back = '
        + (JSON.stringify(restoredAll.stamps) === JSON.stringify(solo.stamps || {})));
  }

  /* ─────────── WO-1.17: the nag can see a year whose only content is grades ───────────
   *
   * FOUR CHECKS AND A FIXTURE GUARD THAT NEVER FIRES ON A GREEN RUN, and the fixture is the whole
   * argument. hasSomethingToLose() (src/backup.js) used to enumerate seven collections and leave out
   * `scores`, `passes` and `openPasses`, so the one strip standing between a teacher and the iOS
   * eviction in CLAUDE.md stayed down on a document whose content lived only in those three. THE
   * DEFECT IS MASKED ON EVERY ORDINARY DOCUMENT: a score cell needs an assignment to hang on, so
   * `count(doc.assignments)` fires first and the strip appears anyway. A check written against a
   * document that has a class, or a roster, or an assignment in it goes green against the build this
   * work order replaces and proves nothing.
   *
   * So every fixture below is newYearDocument() with EXACTLY ONE collection filled and nothing else
   * touched — the omitted collection as the only content there is. All four were run against the
   * unfixed build before they were run against the fixed one, 2026-08-15: `scores only` and the two
   * pass samples are RED there (766 checks · 764 passed · 2 failed) and the brand-new sample is
   * green, which is what makes the two red ones evidence and the day-one one a rule that survived
   * the fix rather than a rule that was never tested.
   *
   * WHY A SCRATCH YEAR RATHER THAN THE OPEN ONE. The nag asks about the document in memory, so the
   * fixture has to BE the open document — and the years this run has built by now are the fixtures
   * every section below reads. A label no year on the device uses is planted straight into IndexedDB
   * (the idiom the poisoned-year and WO-1.15 blocks use), opened through the real openYear(), read,
   * and deleted again in a `finally` so that a throw part-way through cannot leave it behind.
   *
   * NO STAMP IS WRITTEN FOR IT, deliberately: with no `lastBackupAt` entry for the scratch year the
   * age half of refreshBackupNag()'s test is satisfied for every sample, so the strip is up if and
   * only if hasSomethingToLose() answers true. That is the only variable these four checks move.
   */
  const wo117 = await evalJs(`(async function(){
    var s = window.planbook.store, p = window.planbook, b = window.planbook.backup;
    var open = s.getDoc();
    var was = open ? open.year : '';
    var stamps = p.getPref('lastBackupAt') || {};
    var years = await s.listYears();
    /* Whatever the strip was doing before this fixture ran is what it has to be doing after it.
       Asserting it is DOWN afterwards would be asserting something about the sections above rather
       than about this one, which is a check that goes red about its neighbours. */
    var nagBefore = !document.getElementById('backupNag').classList.contains('hidden');
    var scratch = '';
    for (var y = 2040; y < 2100 && !scratch; y++) {
      var label = y + '-' + (y + 1);
      if (years.indexOf(label) === -1) scratch = label;
    }
    if (!was || !scratch || typeof s.newYearDocument !== 'function') {
      return { ok:false, why: !was ? 'no year is open at this point in the run, and the nag is a fact about the open year'
        : !scratch ? 'every label from 2040-2041 to 2099-2100 is already on this device'
          : 'no newYearDocument() on the store seam, so a document with exactly one collection filled cannot be built' }; }
    function write(doc){ return new Promise(function(res, rej){
      var req = indexedDB.open('planbook');
      req.onerror = function(){ rej(req.error); };
      req.onsuccess = function(){ var db = req.result;
        var t = db.transaction('years','readwrite');
        t.objectStore('years').put(doc);
        t.oncomplete = function(){ db.close(); res(1); };
        t.onerror = function(){ rej(t.error); }; }; }); }
    function forget(year){ return new Promise(function(res, rej){
      var req = indexedDB.open('planbook');
      req.onerror = function(){ rej(req.error); };
      req.onsuccess = function(){ var db = req.result;
        var t = db.transaction('years','readwrite');
        t.objectStore('years').delete(year);
        t.oncomplete = function(){ db.close(); res(1); };
        t.onerror = function(){ rej(t.error); }; }; }); }
    /* One sample: a brand-new document with one collection filled, planted, opened, and asked. What
       it reports back is what the document HOLDS as well as what the strip did — a check whose
       fixture turned out to be empty, or to have grown a class from somewhere, would otherwise pass
       for the wrong reason. */
    async function sample(name, fill){
      var doc = s.newYearDocument(scratch);
      fill(doc);
      await write(doc);
      await s.openYear(scratch);
      var times = p.getPref('lastBackupAt') || {};
      delete times[scratch];
      p.setPref('lastBackupAt', times);
      b.refreshBackupNag();
      var d = s.getDoc();
      return { name:name, year:d.year,
               up: !document.getElementById('backupNag').classList.contains('hidden'),
               lead: (document.getElementById('backupNagLead')||{}).textContent,
               holds: { classes:d.classes.length, students:d.students.length,
                        assignments:d.assignments.length, attendance:d.attendance.length,
                        log:d.log.length, events:d.events.length, templates:d.templates.length,
                        scoreColumns:Object.keys(d.scores).length,
                        scoreCells:Object.keys(d.scores).reduce(function(n, id){
                          return n + Object.keys(d.scores[id]).length; }, 0),
                        openPasses:d.openPasses.length, passes:d.passes.length },
               letterScale: d.letterScale.length }; }
    var out = [], threw = '';
    try {
      out.push(await sample('brand new', function(){}));
      out.push(await sample('scores only', function(d){
        d.scores = { a_wo117: { s_wo117a: { v:90 }, s_wo117b: { v:null, flag:'missing' } } }; }));
      out.push(await sample('one open pass', function(d){
        d.openPasses = [{ id:'p_wo117', studentId:'s_wo117a', classId:'c_wo117', type:'bathroom',
                          out:'2026-09-09T09:12:00-04:00' }]; }));
      out.push(await sample('one finished pass', function(d){
        d.passes = [{ id:'p_wo117b', studentId:'s_wo117a', classId:'c_wo117', type:'nurse',
                      out:'2026-09-09T09:12:00-04:00', back:'2026-09-09T09:20:00-04:00',
                      minutes:8, endedBy:'return' }]; }));
    } catch (e) {
      /* Reported rather than thrown on. A fixture that dies here would otherwise take the rest of
         the file with it — the WO-2.26 scar in tools/README.md is a clickSel() on a deleted door
         ending a run with no summary at all. It comes back as a FAIL below, with the message. */
      threw = String((e && e.message) || e);
    } finally {
      /* Runs whether or not the samples did, so a throw part-way through cannot leave a scratch
         year on the device for every section below to count. */
      try { await s.openYear(was); await forget(scratch); p.setPref('lastBackupAt', stamps); }
      catch (e2) { threw = threw || ('the fixture could not be cleaned up: ' + ((e2 && e2.message) || e2)); }
      b.refreshBackupNag();
    }
    var after = await s.listYears();
    return { ok: !threw, threw: threw, scratch:scratch, was:was, samples:out, yearsBefore:years,
             yearsAfter:after, openAfter: s.getDoc() && s.getDoc().year,
             stampsBefore: JSON.stringify(stamps),
             stampsAfter: JSON.stringify(p.getPref('lastBackupAt') || {}),
             nagBefore: nagBefore,
             nagAfter: !document.getElementById('backupNag').classList.contains('hidden') }; })()`);

  if (wo117.threw) {
    check('the WO-1.17 fixture plants a one-collection document, opens it and asks the nag', false,
      'the fixture threw and the checks it feeds never ran: ' + wo117.threw + ' — the scratch year '
        + wo117.scratch + ' was cleaned up in a finally, but nothing below this line was measured');
  } else if (!wo117.ok) {
    skip('the backup nag sees a document whose only content is scores, or a hall pass (WO-1.17)',
      wo117.why);
  } else {
    const wo117Sample = (name) => (wo117.samples || []).filter(s => s.name === name)[0]
      || { name: name + ' (never ran)', up: null, holds: {}, lead: '' };
    const wo117Only = (s, key) => Object.keys(s.holds).filter(k => k !== 'scoreCells' && s.holds[k] > 0)
      .join(', ') === key;
    const wo117New = wo117Sample('brand new');
    const wo117Scores = wo117Sample('scores only');
    const wo117Open = wo117Sample('one open pass');
    const wo117Closed = wo117Sample('one finished pass');
    const wo117Says = (s) => s.name + ': nag ' + (s.up ? 'UP' : 'down') + ' over '
      + JSON.stringify(s.holds);

    check('a document holding score cells and NO assignments raises the nag',
      wo117Scores.up === true && wo117Scores.holds.scoreCells === 2
        && wo117Scores.holds.assignments === 0 && wo117Only(wo117Scores, 'scoreColumns'),
      wo117Says(wo117Scores) + ' — two score cells in one column, with no assignment, no class and '
        + 'no roster to be seen by instead; lead = ' + JSON.stringify(wo117Scores.lead));
    check('a document whose only content is a hall pass — open or finished — raises the nag',
      wo117Open.up === true && wo117Only(wo117Open, 'openPasses')
        && wo117Closed.up === true && wo117Only(wo117Closed, 'passes'),
      wo117Says(wo117Open) + ' | ' + wo117Says(wo117Closed)
        + ' — the two collections are asked separately because they are two collections '
        + '(docs/data-model.md § "Hall passes are two collections")');
    check('a brand-new document still does NOT raise it — the day-one rule survives the fix',
      wo117New.up === false && wo117New.letterScale > 0
        && Object.keys(wo117New.holds).every(k => wo117New.holds[k] === 0),
      wo117Says(wo117New) + ' with a seeded letter scale of ' + wo117New.letterScale
        + ' bands in it — not empty, and still nothing a teacher typed. Non-vacuous against the '
        + 'sample above it: the same document with one score column in it nags ('
        + (wo117Scores.up ? 'it did' : 'IT DID NOT') + ')');
    check('and the scratch year is taken away again, so the sections below inherit nothing',
      wo117.samples.length === 4 && wo117.openAfter === wo117.was
        && JSON.stringify(wo117.yearsAfter) === JSON.stringify(wo117.yearsBefore)
        && wo117.stampsAfter === wo117.stampsBefore && wo117.nagAfter === wo117.nagBefore,
      wo117.scratch + ' was planted and deleted; years are back to '
        + JSON.stringify(wo117.yearsAfter) + ', ' + wo117.openAfter + ' is open again, the stamps '
        + 'are unchanged (' + (wo117.stampsAfter === wo117.stampsBefore) + ') and the strip is '
        + (wo117.nagAfter ? 'up' : 'down') + ', which is where this fixture found it');
  }
}
}
