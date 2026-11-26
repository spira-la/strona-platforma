// Wildflower meadow that grows up from the bottom of the large "O mnie"
// photo (client 2026-11-10: "od dołu zdjęcia wyrastają kwiaty").
// Input: the client's Canva SVG export (a colour PNG + a luminance-mask PNG,
// too big for librsvg, so the two embedded PNGs are combined by hand).
// Output: frontend/src/assets/watercolor/meadow.webp, plus the x-positions
// (in % of the width) of the natural gaps between plants, used by
// GrowingMeadow to split the meadow into strips that grow one after another.
// Run from repo root: node plan/brand/cut-meadow.cjs <svg>
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

const OUT = path.resolve(__dirname, '../../frontend/src/assets/watercolor/meadow.webp');
const OUT_W = 1200;
const STRIPS = 9;

(async () => {
  const svg = fs.readFileSync(process.argv[2], 'utf8');
  const [maskBuf, colourBuf] = [...svg.matchAll(/base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
    Buffer.from(m[1], 'base64'),
  );
  const opts = { limitInputPixels: false };
  const mask = await sharp(maskBuf, opts).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const col = await sharp(colourBuf, opts).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = col.info;
  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    rgba[p * 4] = col.data[p * 3];
    rgba[p * 4 + 1] = col.data[p * 3 + 1];
    rgba[p * 4 + 2] = col.data[p * 3 + 2];
    // drop the faint hairlines Canva left in the bottom corners
    const a = mask.data[p];
    rgba[p * 4 + 3] = a < 28 ? 0 : a;
  }
  const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 }, ...opts })
    .trim({ threshold: 0 })
    .png()
    .toBuffer();
  const { data, info } = await sharp(trimmed, opts)
    .resize({ width: OUT_W })
    .raw()
    .toBuffer({ resolveWithObject: true });
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 80, alphaQuality: 85, effort: 6 })
    .toFile(OUT);

  // column alpha mass → cut at the emptiest column near each even split
  const W = info.width;
  const H = info.height;
  const mass = new Float64Array(W);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) mass[x] += data[(y * W + x) * 4 + 3];
  const cuts = [];
  for (let k = 1; k < STRIPS; k++) {
    const centre = Math.round((k / STRIPS) * W);
    const span = Math.round(W / STRIPS / 3);
    let best = centre;
    for (let x = centre - span; x <= centre + span; x++) if (mass[x] < mass[best]) best = x;
    cuts.push(+((best / W) * 100).toFixed(1));
  }
  console.log(JSON.stringify({ width: W, height: H, ratio: +(H / W).toFixed(4), cuts }));
})();
