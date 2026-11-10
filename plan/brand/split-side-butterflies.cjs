// Wing-beating butterflies painted from the side (client 2026-11-10: "te
// motylki też niech ruszają skrzydłami" — the pink and the green one).
// Takes the client's Canva SVG export (a colour PNG + a luminance-mask PNG)
// and splits it into two same-size layers:
//   flap-<name>-body.webp   the dark body, legs and antennae (picked by
//                           brightness — the wings are pale)
//   flap-<name>-wings.webp  both wings, which WatercolorFriend (FLAPPERS in
//                           components/shared/Watercolor.tsx) beats around
//                           the wing roots
// `flop` mirrors the art so it faces left like the other friends (the fly-*
// animations assume left-facing art).
// Usage (from repo root):
//   node plan/brand/split-side-butterflies.cjs <svg> <name> <bodyLum> [flop]
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

const [svgPath, name, bodyLumArg, flopArg] = process.argv.slice(2);
const BODY_LUM = Number(bodyLumArg);
const OUT_DIR = path.resolve(__dirname, '../../frontend/src/assets/watercolor');
const OUT_W = 600;
const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

(async () => {
  const svg = fs.readFileSync(svgPath, 'utf8');
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
  let img = sharp(rgba, { raw: { width: w, height: h, channels: 4 }, ...opts }).trim({ threshold: 0 });
  const trimmed = await img.png().toBuffer();
  img = sharp(trimmed, opts).resize({ width: OUT_W });
  if (flopArg === 'flop') img = img.flop();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;

  const body = Buffer.alloc(data.length);
  const wings = Buffer.alloc(data.length);
  // dark pixels = body; then grow that mask by a few px so the soft,
  // lighter edge of the body (and antennae) stays with the body instead of
  // leaving a faint outline on the moving wings
  const dark = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) if (data[p * 4 + 3] > 150 && lum(data, p * 4) < BODY_LUM) dark[p] = 1;
  const R = 3;
  const bodyMask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!dark[y * W + x]) continue;
      for (let dy = -R; dy <= R; dy++)
        for (let dx = -R; dx <= R; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && yy < H && xx >= 0 && xx < W && dx * dx + dy * dy <= R * R) bodyMask[yy * W + xx] = 1;
        }
    }
  let bx = 0, by = 0, bn = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!data[i + 3]) continue;
      const isBody = bodyMask[y * W + x] === 1;
      data.copy(isBody ? body : wings, i, i, i + 4);
      if (isBody && data[i + 3] > 200) { bx += x; by += y; bn++; }
    }
  const save = (buf, suffix) =>
    sharp(buf, { raw: { width: W, height: H, channels: 4 } })
      .webp({ quality: 86, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_DIR, `flap-${name}-${suffix}.webp`));
  await Promise.all([save(body, 'body'), save(wings, 'wings')]);
  console.log(
    JSON.stringify({
      name,
      width: W,
      height: H,
      ratio: +(H / W).toFixed(4),
      bodyCentre: [+((bx / bn / W) * 100).toFixed(1), +((by / bn / H) * 100).toFixed(1)],
    }),
  );
})();
