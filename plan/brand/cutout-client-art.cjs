// Removes the cream paper background from the client's watercolor art
// (color-to-alpha against the corner color), trims and exports WebP.
// Run from repo root: node plan/brand/cutout-client-art.cjs
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
const SRC = path.resolve(__dirname, 'client-art');
const OUT = path.resolve(__dirname, '../../frontend/src/assets/watercolor');
const FILES = [
  ['forget-me-not-bouquet.webp', 'bouquet.webp', 640],
  ['blot-orange.webp', 'blot-orange.webp', 640],
  ['bee.webp', 'bee.webp', 360],
  ['butterfly-pink.webp', 'butterfly-pink.webp', 360],
  ['butterfly-rainbow.webp', 'butterfly-rainbow.webp', 420],
  ['blot-blue.webp', 'blot-blue.webp', 640],
];
(async () => {
  for (const [src, out, size] of FILES) {
    const { data, info } = await sharp(path.join(SRC, src)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const bg = [0, 1, 2].map((k) => data[k + 3 * (5 * W + 5)]);
    const o = Buffer.alloc(W * H * 4);
    for (let i = 0; i < W * H; i++) {
      let a = 0;
      for (let k = 0; k < 3; k++) {
        const d = data[i * 3 + k] - bg[k];
        const ak = d > 0 ? d / (255 - bg[k] || 1) : -d / bg[k];
        if (ak > a) a = ak;
      }
      a = a < 0.035 ? 0 : Math.min(1, (a - 0.035) / 0.965);
      for (let k = 0; k < 3; k++) o[i * 4 + k] = a > 0 ? Math.max(0, Math.min(255, Math.round((data[i * 3 + k] - bg[k]) / a + bg[k]))) : 0;
      o[i * 4 + 3] = Math.round(a * 255);
    }
    const png = await sharp(o, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).png().toBuffer();
    await sharp(trimmed).resize({ width: size, height: size, fit: 'inside' }).webp({ quality: 80, alphaQuality: 85 }).toFile(path.join(OUT, out));
    console.log('wrote', out);
  }
})();
