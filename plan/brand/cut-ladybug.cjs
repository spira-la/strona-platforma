// Walking ladybug (client 2026-11-10: "wstaw horyzontalnie poruszającą się
// biedronkę, niech idzie od plastra z góry do wyrazu »życiem«").
// Cuts the client's Canva SVG export (colour PNG + luminance-mask PNG) and
// turns it so the head points left (the art is painted head-up, ~15° to the
// right), the direction it walks in. Output: assets/watercolor/ladybug.webp
// Run from repo root: node plan/brand/cut-ladybug.cjs <svg>
const fs = require('fs');
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

(async () => {
  const svg = fs.readFileSync(process.argv[2], 'utf8');
  const [maskBuf, colourBuf] = [...svg.matchAll(/base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
    Buffer.from(m[1], 'base64'),
  );
  const mask = await sharp(maskBuf).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  const col = await sharp(colourBuf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = col.info;
  const rgba = Buffer.alloc(w * h * 4);
  for (let p = 0; p < w * h; p++) {
    col.data.copy(rgba, p * 4, p * 3, p * 3 + 3);
    rgba[p * 4 + 3] = mask.data[p] < 20 ? 0 : mask.data[p];
  }
  const turned = await sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .rotate(-105, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const out = path.resolve(__dirname, '../../frontend/src/assets/watercolor/ladybug.webp');
  const info = await sharp(turned)
    .trim({ threshold: 0 })
    .resize({ width: 240 })
    .webp({ quality: 86, alphaQuality: 90, effort: 6 })
    .toFile(out);
  console.log(JSON.stringify({ width: info.width, height: info.height, ratio: +(info.height / info.width).toFixed(4) }));
})();
