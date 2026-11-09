// Spirala watercolor artwork generator (2026-11).
// SVG (feTurbulence + feDisplacementMap) rendered to WebP with sharp.
// Colors are sampled from the watercolor logo spiral.
//
// Run from the repo root (sharp lives in backend/node_modules):
//   node plan/brand/paint-watercolor.cjs frontend/src/assets/watercolor
// Each artwork uses a fixed random seed, so re-running gives the same image.
const path = require('path');
const fs = require('fs');
const sharp = require(path.resolve(__dirname, '../../backend/node_modules/sharp'));

const OUT = path.resolve(process.argv[2] || __dirname);
fs.mkdirSync(OUT, { recursive: true });

const C = {
  coral: '#ff5a48', orange: '#ff8a4c', peach: '#ffbf8a', gold: '#ffd23f',
  yellow: '#ffe066', teal: '#22c3df', blue: '#6f8ffa', violet: '#b45cf0',
  magenta: '#e27cff', rose: '#ff7fa8',
};
const PAPER = '#fffdf9';

let rnd = 1;
const R = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
const darker = (hex, f = 0.9) => '#' + [1, 3, 5]
  .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');

// One watercolor blot: warped outline, pigment granulation, darker pooled edge.
function blobDefs(id, color, seed, disp) {
  return `<filter id="f${id}" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.0055" numOctaves="4" seed="${seed}" result="warp"/>
<feDisplacementMap in="SourceGraphic" in2="warp" scale="${disp}" xChannelSelector="R" yChannelSelector="G" result="shape"/>
<feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="3" seed="${seed + 50}" result="grain"/>
<feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.75 0 0 0 0.42" result="grainA"/>
<feComposite in="shape" in2="grainA" operator="in" result="tex"/>
<feGaussianBlur in="tex" stdDeviation="2.2"/></filter>
<radialGradient id="g${id}"><stop offset="0" stop-color="${color}" stop-opacity="0.38"/><stop offset="0.7" stop-color="${color}" stop-opacity="0.62"/><stop offset="0.93" stop-color="${darker(color)}" stop-opacity="0.85"/><stop offset="1" stop-color="${darker(color, 0.84)}" stop-opacity="0.95"/></radialGradient>`;
}

function scene(W, H, blobs, { splats = [], paper = true } = {}) {
  let defs = '';
  let body = '';
  blobs.forEach(([col, cx, cy, rx, ry, op = 1], i) => {
    const rot = R() * 60 - 30;
    defs += blobDefs(i, C[col], Math.floor(R() * 900) + 1, Math.max(rx, ry) * 0.42);
    body += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot.toFixed(1)} ${cx} ${cy})" fill="url(#g${i})" filter="url(#f${i})" opacity="${op}" style="mix-blend-mode:multiply"/>`;
  });
  splats.forEach(([col, cx, cy, spread, n]) => {
    for (let j = 0; j < n; j++) {
      const a = R() * Math.PI * 2;
      const d = spread * (0.3 + R());
      const r = 2 + R() * R() * 13;
      body += `<circle cx="${(cx + Math.cos(a) * d).toFixed(0)}" cy="${(cy + Math.sin(a) * d).toFixed(0)}" r="${r.toFixed(1)}" fill="${C[col]}" opacity="${(0.35 + R() * 0.4).toFixed(2)}" filter="url(#sp)" style="mix-blend-mode:multiply"/>`;
    }
  });
  defs += `<filter id="sp" x="-80%" y="-80%" width="260%" height="260%"><feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="7" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="6" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="0.6"/></filter>`;
  defs += `<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3"/><feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.3  0 0 0 0.05 0"/></filter>`;
  const bg = paper ? `<rect width="${W}" height="${H}" fill="${PAPER}"/>` : '';
  const grain = paper ? `<rect width="${W}" height="${H}" filter="url(#paper)"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${bg}<g style="isolation:isolate">${body}</g>${grain}</svg>`;
}

async function out(name, svg, { alpha = false, q = 80 } = {}) {
  const img = sharp(Buffer.from(svg));
  await (alpha
    ? img.webp({ quality: q, alphaQuality: 90 })
    : img.flatten({ background: PAPER }).webp({ quality: q })
  ).toFile(path.join(OUT, name));
  console.log('wrote', name);
}

const ONLY = process.argv[3];
const job = (name) => !ONLY || ONLY === name;

(async () => {
  // HERO 1600x1400 — color bands top/bottom and on the sides, a light paper
  // band in the middle for the title (works for desktop and phone crops).
  if (job('hero')) {
    rnd = 11;
    await out('hero-joy.webp', scene(1600, 1400, [
      ['peach', 120, 430, 300, 210, 0.8], ['coral', 170, 170, 430, 290], ['orange', 500, 70, 380, 200],
      ['gold', 820, 40, 330, 120, 0.65], ['magenta', 1180, 60, 320, 170], ['violet', 1440, 170, 400, 260],
      ['blue', 1570, 450, 250, 220, 0.8], ['orange', 50, 1010, 220, 210, 0.75], ['gold', 230, 1240, 440, 260],
      ['yellow', 560, 1370, 400, 170], ['rose', 820, 1400, 300, 110, 0.6], ['blue', 1090, 1370, 380, 160],
      ['teal', 1370, 1240, 430, 280], ['violet', 1590, 1010, 220, 200, 0.75],
    ], { splats: [['coral', 520, 330, 140, 14], ['violet', 1130, 330, 150, 14], ['gold', 470, 1080, 150, 12], ['teal', 1120, 1090, 150, 14], ['orange', 820, 250, 200, 6], ['blue', 780, 1180, 220, 6]] }));
  }
  // QUOTE 1920x760 — colors left and right, light center.
  if (job('quote')) {
    rnd = 29;
    await out('quote-joy.webp', scene(1920, 760, [
      ['violet', 120, 160, 330, 240], ['magenta', 60, 520, 260, 230, 0.8], ['blue', 330, 680, 330, 170],
      ['rose', 380, 40, 260, 120, 0.6], ['gold', 1800, 150, 330, 240], ['orange', 1880, 540, 260, 230, 0.8],
      ['coral', 1560, 690, 330, 160], ['yellow', 1520, 40, 280, 120, 0.6],
    ], { splats: [['violet', 520, 300, 120, 10], ['orange', 1400, 420, 120, 10], ['teal', 600, 640, 100, 6], ['gold', 1330, 120, 100, 6]] }));
  }
  // CONTACT 1600x1000 — warm band on top, cool band at the bottom.
  if (job('contact')) {
    rnd = 47;
    await out('contact-joy.webp', scene(1600, 1000, [
      ['coral', 150, 110, 400, 240], ['orange', 520, 30, 380, 170], ['gold', 900, 20, 360, 130, 0.7],
      ['peach', 1250, 60, 360, 190], ['rose', 1520, 180, 300, 210], ['teal', 180, 950, 420, 200],
      ['blue', 600, 1000, 380, 140], ['violet', 1050, 990, 380, 150], ['magenta', 1450, 900, 380, 220],
    ], { splats: [['coral', 480, 250, 130, 12], ['rose', 1220, 280, 130, 10], ['teal', 420, 780, 120, 10], ['violet', 1180, 780, 130, 12]] }));
  }
  // ACCENTS 800x800, transparent — blots for section corners.
  if (job('accents')) {
    // accent-warm / accent-cool were replaced by the client's own blots
    // (blot-orange.webp / blot-blue.webp), so only the sun blot is painted.
    rnd = 89;
    await out('accent-sun.webp', scene(800, 800, [['yellow', 400, 400, 270, 230], ['gold', 360, 440, 200, 150, 0.55], ['peach', 470, 340, 150, 120, 0.45]], { paper: false, splats: [['gold', 600, 250, 170, 10]] }), { alpha: true });
  }
  // RAINBOW BRUSH STROKE 1200x140, transparent — spiral colors along a wave.
  if (job('stroke')) {
    const stroke = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="140" viewBox="0 0 1200 140"><defs>
<linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="${C.coral}"/><stop offset="0.2" stop-color="${C.orange}"/><stop offset="0.4" stop-color="${C.gold}"/><stop offset="0.6" stop-color="${C.teal}"/><stop offset="0.8" stop-color="${C.blue}"/><stop offset="1" stop-color="${C.violet}"/></linearGradient>
<filter id="br" x="-10%" y="-60%" width="120%" height="220%"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.09" numOctaves="3" seed="5" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="16" xChannelSelector="R" yChannelSelector="G" result="s"/>
<feTurbulence type="fractalNoise" baseFrequency="0.06 0.4" numOctaves="2" seed="8" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0 0 0 0.35" result="ga"/><feComposite in="s" in2="ga" operator="in"/><feGaussianBlur stdDeviation="0.8"/></filter></defs>
<path d="M40 86 C 240 40, 420 112, 620 74 S 980 46, 1160 70" fill="none" stroke="url(#rb)" stroke-width="30" stroke-linecap="round" opacity="0.85" filter="url(#br)"/></svg>`;
    await out('stroke-rainbow.webp', stroke, { alpha: true, q: 85 });
  }
})();
