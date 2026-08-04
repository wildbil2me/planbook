/* make-icons.mjs — draw Planbook's home-screen icons and write them out as real PNGs.
 *
 * Run:  node tools/make-icons.mjs
 * Out:  icons/icon-{152,167,180,192,512}.png, overwritten in place.
 *
 * WHY THIS EXISTS. WO-1.3 needs PNG icons in the sizes iOS uses, and the suite has no icon
 * pipeline, no dependency it is allowed to add, and no build step. Three ways out were on the
 * table:
 *
 *   - SVG icons only. iOS does not accept an SVG for `apple-touch-icon`; Safari falls back to
 *     a screenshot of the page, so the home-screen icon becomes a picture of a loading spinner.
 *   - Data-URI PNGs inside the manifest. Chrome accepts them; Safari's apple-touch-icon does
 *     not, which is the one that matters here.
 *   - Draw the pixels. Node ships `zlib`, a PNG is a header plus one deflated block of scan
 *     lines, and the mark is four rectangles. That is this file.
 *
 * The PNGs are committed. Nothing at runtime and nothing in a deploy runs this script — it is
 * optional, by the rule in tools/README.md, and exists so the icons are re-derivable source
 * rather than binaries that arrived from somewhere nobody can name. Change the drawing, re-run
 * it, commit the output.
 *
 * THE DESIGN CONSTRAINTS, both of which are easy to get wrong and invisible until a device
 * shows you:
 *
 *   - Full bleed, no transparency, no pre-rounded corners. iOS applies its own rounded-rect
 *     mask to `apple-touch-icon`; an icon that rounds its own corners gets rounded twice and
 *     shows dark wedges. Android's `maskable` purpose clips to a circle and shows the
 *     background behind any transparency.
 *   - The mark sits inside the middle 68% of the canvas. Android's maskable safe zone is the
 *     central 80%; the furthest corner of the drawing is 0.34 of the canvas from the center,
 *     against the 0.4 the safe zone allows. That is what lets one file serve `any maskable`
 *     instead of shipping a second padded variant.
 *
 * Colors are the style guide's, written literally, same convention as the stylesheet.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'icons');

/* 152 and 167 are the older iPad and iPad Pro apple-touch-icon sizes, 180 is the current one
   iOS actually reaches for first, 192 and 512 are what the manifest wants. */
const SIZES = [152, 167, 180, 192, 512];

/* Supersampling factor. 4×4 samples per pixel is enough antialiasing for straight edges and a
   3% corner radius, and 512² × 16 samples still runs in well under a second. */
const SS = 4;

/* ── the drawing, in normalized 0..1 coordinates over the square ── */

/* The header gradient: linear-gradient(135deg, #0d2137 0%, #1a3c5e 60%, #2a2a6e 100%).
   A 135deg CSS gradient runs corner to corner, so the position along it is (u+v)/2. */
const G0 = [0x0d, 0x21, 0x37];
const G1 = [0x1a, 0x3c, 0x5e];
const G2 = [0x2a, 0x2a, 0x6e];

const PAGE = [0xff, 0xff, 0xff];   /* panel white */
const SPINE = [0x27, 0xae, 0x60];  /* the positive green — the same one the spinner uses */
const RULE = [0xa0, 0xaa, 0xb8];   /* disabled/empty gray, from the palette */

function mix(a, b, k) {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

function background(u, v) {
  const t = (u + v) / 2;
  return t < 0.6 ? mix(G0, G1, t / 0.6) : mix(G1, G2, (t - 0.6) / 0.4);
}

/* Rounded rectangle by signed distance: the offset outside the rect shrunk by r, compared to
   r. Falls out correctly for points outside the rect entirely, so no bounds test is needed. */
function inRoundRect(u, v, x0, y0, x1, y1, r) {
  const qx = Math.max(x0 + r - u, 0, u - (x1 - r));
  const qy = Math.max(y0 + r - v, 0, v - (y1 - r));
  return qx * qx + qy * qy <= r * r;
}

/* A notebook: white page, green binding down the left edge, three rule lines. Not the 📓
   emoji — nothing in bare Node can rasterize a font — but the same object, and it reads at
   152px on a home screen, which is the only size that matters. */
function sample(u, v) {
  if (inRoundRect(u, v, 0.300, 0.240, 0.720, 0.760, 0.035)) {
    if (u < 0.378) return SPINE;
    for (const cy of [0.365, 0.470, 0.575]) {
      if (inRoundRect(u, v, 0.440, cy - 0.016, 0.655, cy + 0.016, 0.016)) return RULE;
    }
    return PAGE;
  }
  return background(u, v);
}

/* ── PNG encoding ── */

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  /* One filter byte (0 = None) plus three bytes per pixel, per scan line. Truecolor, 8-bit,
     no alpha channel at all — which is also how the "no transparency" rule above is enforced
     rather than merely intended. */
  const stride = 1 + size * 3;
  const raw = Buffer.alloc(stride * size);
  const step = 1 / (size * SS);

  for (let y = 0; y < size; y++) {
    let o = y * stride + 1;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sample((x * SS + sx + 0.5) * step, (y * SS + sy + 0.5) * step);
          r += c[0]; g += c[1]; b += c[2];
        }
      }
      const n = SS * SS;
      raw[o++] = Math.round(r / n);
      raw[o++] = Math.round(g / n);
      raw[o++] = Math.round(b / n);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;    /* bit depth */
  ihdr[9] = 2;    /* color type 2 = truecolor RGB */
  ihdr[10] = 0;   /* compression: deflate */
  ihdr[11] = 0;   /* filter method */
  ihdr[12] = 0;   /* no interlace */

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ── run ── */

await fs.mkdir(OUT, { recursive: true });
for (const size of SIZES) {
  const file = path.join(OUT, 'icon-' + size + '.png');
  const buf = png(size);
  await fs.writeFile(file, buf);
  console.log('wrote ' + path.relative(ROOT, file) + '  (' + size + 'x' + size + ', ' + buf.length + ' bytes)');
}
console.log('\nIcons are committed to the repo. Nothing serves the app from this script.');
