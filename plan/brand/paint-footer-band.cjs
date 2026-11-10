// Full-width watercolor band in the logo spiral colours, used as the top edge
// of the footer so it never merges with the last section (client 2026-11).
// Run from repo root: node plan/brand/paint-footer-band.cjs
const path = require('path');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));
sharp.cache(false);

const W = 2400;
const H = 80;
const stops = ['#ff5a48', '#ff8a4c', '#ffd23f', '#22c3df', '#6f8ffa', '#b45cf0', '#ff7fa8', '#ff8a4c', '#ffd23f', '#22c3df', '#6f8ffa'];
const grad = stops
  .map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(3)}" stop-color="${c}"/>`)
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="rb" x1="0" x2="1">${grad}</linearGradient>
<filter id="wc" x="-2%" y="-60%" width="104%" height="220%" color-interpolation-filters="sRGB">
  <feTurbulence type="fractalNoise" baseFrequency="0.012 0.18" numOctaves="3" seed="11" result="warp"/>
  <feDisplacementMap in="SourceGraphic" in2="warp" scale="22" xChannelSelector="R" yChannelSelector="G" result="shape"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.05 0.3" numOctaves="2" seed="4" result="grain"/>
  <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.8 0 0 0 0.4" result="ga"/>
  <feComposite in="shape" in2="ga" operator="in"/>
  <feGaussianBlur stdDeviation="0.9"/>
</filter>
</defs>
<rect x="-20" y="26" width="${W + 40}" height="26" rx="13" fill="url(#rb)" opacity="0.7" filter="url(#wc)"/>
</svg>`;

sharp(Buffer.from(svg))
  .webp({ quality: 85, alphaQuality: 85 })
  .toFile(path.resolve(__dirname, '../../frontend/src/assets/watercolor/footer-band.webp'))
  .then(() => console.log('wrote footer-band.webp'));
