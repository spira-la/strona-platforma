// Splits the client's two-dragonfly picture (already transparent) into two
// separate cut-outs. Run from repo root: node plan/brand/split-dragonflies.cjs
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);
const SRC = path.resolve(__dirname, 'client-art/dragonflies.webp');
const OUT = path.resolve(__dirname, '../../frontend/src/assets/watercolor');
(async () => {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  // keep(x, y) decides which pixels belong to each dragonfly
  const parts = [
    ['dragonfly-teal.webp', (x, y) => y < 1110 && !(y > 930 && x > 1000)],
    ['dragonfly-blue.webp', (x, y) => y > 930 && !(y < 1100 && x < 950)],
  ];
  for (const [name, keep] of parts) {
    const buf = Buffer.from(data);
    for (let y = 0; y < info.height; y++) for (let x = 0; x < W; x++) if (!keep(x, y)) buf[(y * W + x) * 4 + 3] = 0;
    const png = await sharp(buf, { raw: { width: W, height: info.height, channels: 4 } }).png().toBuffer();
    const trimmed = await sharp(png).trim({ threshold: 1 }).png().toBuffer();
    await sharp(trimmed).resize({ width: 420, height: 420, fit: 'inside' }).webp({ quality: 82, alphaQuality: 85 }).toFile(path.join(OUT, name));
    console.log('wrote', name);
  }
})();
