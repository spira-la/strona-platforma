import { useId } from 'react';

/**
 * Watercolor step number — a clear, bold numeral on a watercolor blot,
 * in the rainbow tones of the Spirala logo spiral.
 *
 * The blot flows from one spiral color into the next, bleeds at the edges
 * (SVG turbulence displacement) and has a couple of loose paint drops. The
 * numeral is a rounded playful sans in a deep shade of the blot color, so it
 * stays easy to read (≥3:1 on the wash; client asked for readable digits).
 *
 * Font: the client asked for "Pixie Ring" (commercial, Creative Fabrica — not
 * on Google Fonts). It is first in the stack: add its licensed woff2 with an
 * @font-face rule and it takes over; until then the similar free Fredoka
 * (loaded in index.html) is used.
 * Purely decorative: the step order is already given by the card order.
 */

// Gradient pairs in spiral order — index 0 matches iconTone(0) (coral) etc.
const TONE_PAIRS = [
  ['coral', 'orange'],
  ['gold', 'orange'],
  ['teal', 'blue'],
  ['violet', 'blue'],
  ['orange', 'gold'],
  ['blue', 'violet'],
] as const;

// Bright, sunny wash colors (sampled from the logo spiral) — the wash is
// painted with these so it stays luminous instead of muddy; the numeral
// itself uses the deeper spiral tones for contrast.
const WASH: Record<(typeof TONE_PAIRS)[number][number], string> = {
  coral: '#ff6a55',
  orange: '#ff9a52',
  gold: '#ffc93c',
  teal: '#2cc6e2',
  blue: '#7f9afe',
  violet: '#c77dff',
};

// Deep shade of each tone for the numeral itself.
const DEEP: Record<(typeof TONE_PAIRS)[number][number], string> = {
  coral: '#b3261a',
  orange: '#a8400c',
  gold: '#7a4f00',
  teal: '#03607a',
  blue: '#2a4a94',
  violet: '#72228a',
};

interface WatercolorNumberProps {
  /** Number to paint (1, 2, 3 …). */
  n: number;
  /** Tone index; defaults to n - 1 so it matches iconTone(i). */
  tone?: number;
  /** Rendered size in px. */
  size?: number;
  className?: string;
}

export function WatercolorNumber({
  n,
  tone = n - 1,
  size = 88,
  className = '',
}: WatercolorNumberProps) {
  const uid = useId().replaceAll(':', '');
  const [a, b] = TONE_PAIRS[tone % TONE_PAIRS.length];
  const washA = WASH[a];
  const washB = WASH[b];
  const seed = tone * 7 + 3;

  return (
    <span
      className={`relative inline-block shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        overflow="visible"
        focusable="false"
      >
        <defs>
          {/* Bleeding paper edge for the wash and drops */}
          <filter
            id={`bleed-${uid}`}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.045"
              numOctaves="3"
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="13"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          {/* Wash: light in the middle, pigment pooling at the edge */}
          <radialGradient id={`wash-${uid}`} cx="46%" cy="42%" r="58%">
            <stop offset="0%" style={{ stopColor: washB, stopOpacity: 0.22 }} />
            <stop
              offset="72%"
              style={{ stopColor: washA, stopOpacity: 0.42 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: washA, stopOpacity: 0.68 }}
            />
          </radialGradient>
        </defs>

        <circle
          cx="50"
          cy="53"
          r="37"
          fill={`url(#wash-${uid})`}
          filter={`url(#bleed-${uid})`}
        />
        {/* loose paint drops */}
        <circle
          cx="86"
          cy="22"
          r="6"
          style={{ fill: washB, opacity: 0.55 }}
          filter={`url(#bleed-${uid})`}
        />
        <circle
          cx="15"
          cy="86"
          r="3.5"
          style={{ fill: washA, opacity: 0.6 }}
          filter={`url(#bleed-${uid})`}
        />
        <text
          x="50"
          y="53"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Pixie Ring', 'Fredoka', 'Lato', system-ui, sans-serif"
          fontWeight={600}
          fontSize="54"
          style={{ fill: DEEP[a] }}
        >
          {n}
        </text>
      </svg>
    </span>
  );
}

export default WatercolorNumber;
