// Full-width band for the top edge of the footer, so it never merges with
// the last section (client 2026-11).
// v4 (2026-11-10): a watercolor BRUSH STROKE like the title underlines
// (client: "dolna linia nad stopką też pociągnięta pędzlem"), same filter
// as stroke-rainbow.webp; colours coral → gold → turquoise → blue with no
// violet / pink (client: avoid a full-spectrum rainbow look).
// Run from repo root: node plan/brand/paint-footer-band.cjs
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

const W = 2400;
const H = 60;
const stops = ['#ff5a48', '#ff8a4c', '#ffd23f', '#22c3df', '#6f8ffa', '#22c3df', '#ffd23f', '#ff8a4c', '#ff5a48'];
const grad = stops
  .map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(3)}" stop-color="${c}"/>`)
  .join('');

// gentle long wave, painted with the same brush filter as the title strokes
const d = 'M-20 32 C 400 22, 800 40, 1200 30 S 2000 22, 2420 32';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="rb" x1="0" x2="1">${grad}</linearGradient>
<filter id="br" x="-2%" y="-80%" width="104%" height="260%">
  <feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="3" seed="5" result="w"/>
  <feDisplacementMap in="SourceGraphic" in2="w" scale="12" xChannelSelector="R" yChannelSelector="G" result="s"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.06 0.4" numOctaves="2" seed="8" result="g"/>
  <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 0.35" result="ga"/>
  <feComposite in="s" in2="ga" operator="in"/>
  <feGaussianBlur stdDeviation="0.8"/>
</filter>
</defs>
<path d="${d}" fill="none" stroke="url(#rb)" stroke-width="16" stroke-linecap="round" opacity="0.85" filter="url(#br)"/>
</svg>`;

sharp(Buffer.from(svg))
  .webp({ quality: 88, alphaQuality: 90 })
  .toFile(path.resolve(__dirname, '../../frontend/src/assets/watercolor/footer-band.webp'))
  .then(() => console.log('wrote footer-band.webp'));
