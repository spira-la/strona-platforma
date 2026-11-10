// Buzzing bee (client 2026-11-10: "pszczoła niech też rusza skrzydełkami").
// Takes the client's Canva SVG export of the bee (a colour PNG + a
// luminance-mask PNG) and splits it into two same-size layers:
//   flap-bee-body.webp   body, legs, antennae
//   flap-bee-wings.webp  the two pale-blue wings (picked by colour: bluish /
//                        whitish and light, unlike the yellow and black body)
// WatercolorFriend (FLAPPERS in components/shared/Watercolor.tsx) buzzes the
// wings layer around the printed hinge point (the wing roots).
// Run from repo root: node plan/brand/split-bee-wings.cjs <svg>
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

const OUT_DIR = path.resolve(__dirname, '../../frontend/src/assets/watercolor');
const OUT_W = 600;
const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

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
    col.data.copy(rgba, p * 4, p * 3, p * 3 + 3);
    rgba[p * 4 + 3] = mask.data[p] < 20 ? 0 : mask.data[p];
  }
  const trimmed = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 0 })
    .png()
    .toBuffer();
  const { data, info } = await sharp(trimmed).resize({ width: OUT_W }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  const body = Buffer.alloc(data.length);
  const wings = Buffer.alloc(data.length);
  let sx = 0, n = 0, maxY = 0;
  const wingRows = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!data[i + 3]) continue;
      const r = data[i], b = data[i + 2];
      // wings: pale blue / white paper, only in the upper half of the bee
      const isWing = y < H * 0.45 && lum(data, i) > 150 && b > r - 18;
      data.copy(isWing ? wings : body, i, i, i + 4);
      if (isWing) wingRows.push([x, y]);
    }
  // hinge: the wing roots = centre of the lowest 8% of wing pixels
  wingRows.sort((a, b) => b[1] - a[1]);
  const roots = wingRows.slice(0, Math.max(1, Math.round(wingRows.length * 0.08)));
  for (const [x, y] of roots) { sx += x; n++; maxY = Math.max(maxY, y); }
  const hingeX = sx / n;

  const save = (buf, suffix) =>
    sharp(buf, { raw: { width: W, height: H, channels: 4 } })
      .webp({ quality: 86, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_DIR, `flap-bee-${suffix}.webp`));
  await Promise.all([save(body, 'body'), save(wings, 'wings')]);
  console.log(
    JSON.stringify({
      width: W,
      height: H,
      ratio: +(H / W).toFixed(4),
      hingeX: +((hingeX / W) * 100).toFixed(1),
      hingeY: +((maxY / H) * 100).toFixed(1),
    }),
  );
})();
