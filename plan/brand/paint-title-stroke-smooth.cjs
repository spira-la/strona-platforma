// Smooth rainbow underline for titles, matching the smooth footer ribbon
// (client 2026-11-10: try it instead of the torn brush stroke).
// No glow / blur (client 2026-11-10: "bez poświaty, bluru").
// Same 1200x140 canvas as stroke-rainbow.webp so layouts don't shift.
// Run from repo root: node plan/brand/paint-title-stroke-smooth.cjs
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

const W = 1200;
const H = 140;
const stops = ['#ff5a48', '#ff8a4c', '#ffd23f', '#22c3df', '#6f8ffa'];
const grad = stops
  .map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(3)}" stop-color="${c}"/>`)
  .join('');

// one gentle wave, like the original stroke's path
const d = 'M50 82 C 250 54, 430 98, 620 74 S 980 52, 1150 70';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="rb" x1="0" x2="1">${grad}</linearGradient>
</defs>
<path d="${d}" fill="none" stroke="url(#rb)" stroke-width="13" stroke-linecap="round" opacity="0.85"/>
</svg>`;

sharp(Buffer.from(svg))
  .webp({ quality: 88, alphaQuality: 90 })
  .toFile(path.resolve(__dirname, '../../frontend/src/assets/watercolor/stroke-rainbow-smooth.webp'))
  .then(() => console.log('wrote stroke-rainbow-smooth.webp'));
