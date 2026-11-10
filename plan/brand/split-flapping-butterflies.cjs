// Wing-flapping butterflies (client 2026-11-10: "spróbuj tego motyla tak
// animować, by ruszał skrzydłami" — yellow butterfly and the rainbow fairy
// wings). Takes the client's Canva SVG exports (an embedded colour PNG plus a
// luminance mask PNG), cuts the butterfly out and splits it along the body
// into three same-size layers:
//   <name>-left.webp   wings left of the body
//   <name>-right.webp  wings right of the body
//   <name>-body.webp   body (+ antennae), drawn on top, never moves
// The component (WatercolorFriend + FLAPPERS in components/shared/Watercolor.tsx)
// squashes the two wing layers towards the body line (animate-flap-*).
//
// The yellow butterfly is painted in a 3/4 view with a tilted body, so it is
// first rotated until the body is vertical; the component rotates it back by
// the printed `tilt`.
//
// Usage (from repo root):
//   node plan/brand/split-flapping-butterflies.cjs <svg> <name> [tilted[=degrees]]
// The yellow butterfly: `tilted=26` (body lean measured by eye; the automatic
// estimate below is skewed by the wide abdomen); the turquoise dragonfly:
// `tilted=-14`.
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

const [svgPath, name, tiltedArg] = process.argv.slice(2);
const tilted = Boolean(tiltedArg?.startsWith('tilted'));
const tiltOverride = tiltedArg?.includes('=') ? Number(tiltedArg.split('=')[1]) : null;
const OUT_DIR = path.resolve(__dirname, '../../frontend/src/assets/watercolor');
const OUT_W = 640;

const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

async function main() {
  const svg = fs.readFileSync(svgPath, 'utf8');
  // Combine the two embedded PNGs by hand (first = luminance mask, second =
  // colour) — works for big exports librsvg refuses, and ignores any text
  // Canva adds around the art.
  const [maskBuf, colourBuf] = [...svg.matchAll(/base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
    Buffer.from(m[1], 'base64'),
  );
  const opts = { limitInputPixels: false };
  const mask = await sharp(maskBuf, opts).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const colour = await sharp(colourBuf, opts).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const cw = colour.info.width;
  const ch = colour.info.height;
  const cut = Buffer.alloc(cw * ch * 4);
  for (let p = 0; p < cw * ch; p++) {
    colour.data.copy(cut, p * 4, p * 3, p * 3 + 3);
    cut[p * 4 + 3] = mask.data[p] < 20 ? 0 : mask.data[p];
  }
  const col = { data: cut, w: cw, h: ch };

  let img = sharp(col.data, { raw: { width: col.w, height: col.h, channels: 4 } });
  let tilt = 0;
  if (tilted) {
    // body axis = principal axis of the dark brown body pixels
    const pts = [];
    for (let y = 0; y < col.h; y += 2)
      for (let x = 0; x < col.w; x += 2) {
        const i = (y * col.w + x) * 4;
        if (col.data[i + 3] > 200 && lum(col.data, i) < 120) pts.push([x, y]);
      }
    const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    let sxx = 0, syy = 0, sxy = 0;
    for (const [x, y] of pts) {
      sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my);
    }
    const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy); // axis angle from +x
    // degrees the body leans away from vertical (clockwise = positive)
    tilt = 90 + (ang * 180) / Math.PI;
    if (tilt > 90) tilt -= 180;
    if (tiltOverride !== null) tilt = tiltOverride;
    console.log('body pixels', pts.length, 'axis', ((ang * 180) / Math.PI).toFixed(1), 'tilt', tilt.toFixed(1));
    img = img.rotate(-tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  // trim + resize to the output width
  const trimmed = await img.png().toBuffer();
  const t = await sharp(trimmed).trim({ threshold: 1 }).resize({ width: OUT_W }).raw().toBuffer({ resolveWithObject: true });
  const { data } = t;
  const W = t.info.width;
  const H = t.info.height;

  // body column: for tilted art, the dark body; for symmetric wings, the
  // alpha-weighted centre
  let cx = 0, bodyTop = 0, bodyBottom = H, bodyHalf = 0;
  const dark = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] > 200 && lum(data, i) < (tilted ? 120 : 150)) dark.push([x, y]);
    }
  if (tilted) {
    const xs = dark.map((p) => p[0]).sort((a, b) => a - b);
    const ys = dark.map((p) => p[1]).sort((a, b) => a - b);
    cx = xs[Math.floor(xs.length / 2)];
    bodyHalf = Math.max(6, (xs[Math.floor(xs.length * 0.95)] - xs[Math.floor(xs.length * 0.05)]) / 2 + 4);
    bodyTop = ys[Math.floor(ys.length * 0.01)];
    bodyBottom = ys[Math.floor(ys.length * 0.99)];
  } else {
    let sa = 0, sx = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const a = data[(y * W + x) * 4 + 3];
        sa += a; sx += a * x;
      }
    cx = Math.round(sx / sa);
    bodyHalf = 7;
    // body = the gold joint where the four wings meet (rows where the
    // centre column is opaque)
    const rows = [];
    for (let y = 0; y < H; y++) if (data[(y * W + cx) * 4 + 3] > 120) rows.push(y);
    bodyTop = rows[0] - 4;
    bodyBottom = rows.at(-1) + 4;
  }
  console.log({ W, H, cx, bodyHalf, bodyTop, bodyBottom });

  const left = Buffer.alloc(data.length);
  const right = Buffer.alloc(data.length);
  const body = Buffer.alloc(data.length);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      // body strip: for the yellow butterfly only the brown body pixels, so
      // the pale wing paint next to it still folds with the wings
      const inStrip = Math.abs(x - cx) <= bodyHalf && y >= bodyTop && y <= bodyBottom;
      const inBody = inStrip && (!tilted || lum(data, i) < 200);
      // antennae: thin isolated strokes above the head — the opaque run
      // through this pixel is short (wings give long runs)
      let antenna = false;
      if (tilted && y < bodyTop + H * 0.12 && y > bodyTop - H * 0.25 && data[i + 3] > 30 && Math.abs(x - cx) < W * 0.12) {
        let run = 1;
        for (let k = x - 1; k >= 0 && data[(y * W + k) * 4 + 3] > 30; k--) run++;
        for (let k = x + 1; k < W && data[(y * W + k) * 4 + 3] > 30; k++) run++;
        antenna = run < 14;
      }
      const target = inBody || antenna ? body : x < cx ? left : right;
      data.copy(target, i, i, i + 4);
      // 1px overlap at the hinge so no seam shows while folding
      if (!inBody && !antenna && Math.abs(x - cx) <= 1) data.copy(x < cx ? right : left, i, i, i + 4);
    }

  const save = (buf, suffix) =>
    sharp(buf, { raw: { width: W, height: H, channels: 4 } })
      .webp({ quality: 86, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_DIR, `${name}-${suffix}.webp`));
  await Promise.all([save(left, 'left'), save(right, 'right'), save(body, 'body')]);
  console.log(
    JSON.stringify({ name, width: W, height: H, hingeX: +((cx / W) * 100).toFixed(2), tilt: +tilt.toFixed(1) }),
  );
}

main();
