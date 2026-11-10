import type { CSSProperties } from 'react';
import flapDragonflyLeft from '@/assets/watercolor/flap-dragonfly-left.webp';
import flapDragonflyRight from '@/assets/watercolor/flap-dragonfly-right.webp';
import flapDragonflyBody from '@/assets/watercolor/flap-dragonfly-body.webp';
import flapGreenWings from '@/assets/watercolor/flap-green-wings.webp';
import flapGreenBody from '@/assets/watercolor/flap-green-body.webp';
import flapBeeWings from '@/assets/watercolor/flap-bee-wings.webp';
import flapBeeBody from '@/assets/watercolor/flap-bee-body.webp';
import flapSunWings from '@/assets/watercolor/flap-sun-wings.webp';
import flapSunBody from '@/assets/watercolor/flap-sun-body.webp';
import { useInViewOnce } from '@/hooks/useInViewOnce';

/**
 * Painted friends that fly in and land on something (client 2026-11-10):
 * - LandingDragonfly — the turquoise dragonfly lands on the wildflowers
 *   growing from the bottom of the "O mnie" photo ("ważka niech ląduje na
 *   tych kwiatach"); wings still while it sits.
 * - LandingButterfly — the green butterfly lands on the top edge of the
 *   contact form ("motyl niech wyląduje na ramce formularza"); while it sits
 *   it slowly opens and closes its wings, like a resting butterfly.
 * - LandingSunButterfly — the yellow butterfly lands on the word "Życie" in
 *   the Start hero title ("motyl niech usiądzie na wyrazie życie").
 * - LandingBee — the bee lands on the end of the word "Porozmawiajmy" in
 *   the contact hero ("niech pszczoła usiądzie na wyrazie porozmawiajmy na
 *   jego końcu"); buzzing wings in flight, still while it sits.
 *
 * One 20 s loop each: hover above and to the right, fly down, land, rest,
 * take off, fly back. The wing keyframes are generated on the same clock as
 * the path, so the wing rhythm changes exactly on landing / take-off. Starts
 * when the spot scrolls into view, after `startDelay` (0.5 s; the dragonfly
 * 1.5 s, so the meadow has grown before it lands).
 *
 * Position it with `className` at the landing spot: the box keeps the art's
 * aspect ratio and its BOTTOM edge is where the feet touch down (`feet`
 * shifts the art down so the feet, not the box, rest on that line).
 * Layers: plan/brand/split-flapping-butterflies.cjs (dragonfly, tilted=-14)
 * and plan/brand/split-side-butterflies.cjs (green butterfly).
 */

const CYCLE_S = 20;
/**
 * Flight segments (in % of the cycle); the rest is sitting. The approach is
 * quick — landed after ~3.4 s (client 2026-11-10: "niech szybciej się
 * pojawiają") — then a long rest, take-off and a slower trip back.
 */
const FLIGHT: [number, number][] = [
  [0, 17],
  [75, 100],
];
const SITTING: [number, number] = [17, 75];

const PATH = `@keyframes spirala-lander-path{
  0%{transform:translate(170%,-330%) rotate(-30deg)}
  2%{transform:translate(150%,-300%) rotate(-22deg)}
  8%{transform:translate(70%,-170%) rotate(-12deg)}
  12%{transform:translate(15%,-55%) rotate(6deg)}
  15%{transform:translate(0,-8%) rotate(2deg)}
  17%,75%{transform:translate(0,0) rotate(0deg)}
  80%{transform:translate(-15%,-50%) rotate(-10deg)}
  91%{transform:translate(80%,-220%) rotate(-28deg)}
  100%{transform:translate(170%,-330%) rotate(-30deg)}
}`;

interface WingRhythm {
  open: string;
  folded: string;
  /** Seconds per stroke in flight. */
  stroke: number;
  /** Seconds per stroke while sitting; none = wings stay still. */
  restStroke?: number;
  /** Fold while sitting (defaults to `folded`). */
  restFolded?: string;
}

function strokes(
  [from, to]: [number, number],
  strokeS: number,
  open: string,
  folded: string,
): string[] {
  const step = (strokeS / CYCLE_S) * 100;
  const stops: string[] = [];
  let isOpen = true;
  for (let t = from; t < to - step / 2; t += step) {
    stops.push(`${t.toFixed(2)}%{transform:${isOpen ? open : folded}}`);
    isOpen = !isOpen;
  }
  stops.push(`${to}%{transform:${open}}`);
  return stops;
}

function wingKeyframes(name: string, r: WingRhythm): string {
  const stops = FLIGHT.flatMap((seg) =>
    strokes(seg, r.stroke, r.open, r.folded),
  );
  if (r.restStroke) {
    stops.push(
      ...strokes(SITTING, r.restStroke, r.open, r.restFolded ?? r.folded),
    );
  }
  return `@keyframes ${name}{${stops.join('')}}`;
}

interface WingLayer {
  src: string;
  keyframes: string;
  origin: string;
}

interface LanderConfig {
  wings: WingLayer[];
  body: string;
  ratio: number;
  tilt: number;
  /** How far (in % of the box height) to sink the art so the feet land. */
  feet: number;
  startDelay: number;
}

const DRAGONFLY: LanderConfig = {
  wings: [
    {
      src: flapDragonflyLeft,
      keyframes: 'spirala-dragonfly-wing-l',
      origin: '48.91% 50%',
    },
    {
      src: flapDragonflyRight,
      keyframes: 'spirala-dragonfly-wing-r',
      origin: '48.91% 50%',
    },
  ],
  body: flapDragonflyBody,
  ratio: 339 / 640,
  tilt: -14,
  feet: 0,
  // waits a little for the meadow to grow before landing on it
  startDelay: 1.5,
};

const BUTTERFLY: LanderConfig = {
  wings: [
    {
      src: flapGreenWings,
      keyframes: 'spirala-green-wings',
      origin: '25% 71%',
    },
  ],
  body: flapGreenBody,
  ratio: 686 / 600,
  tilt: 0,
  // the legs end ~82% down the art
  feet: 18,
  startDelay: 0.5,
};

// the client's yellow side-view butterfly (2026-11-10, replaced the pink one
// on "Życie"); split with `split-side-butterflies.cjs <svg> sun 172 flop
// 0,40,50,88` — its orange wing edges are as dark as the body, hence the
// body region
const SUN_BUTTERFLY: LanderConfig = {
  wings: [
    {
      src: flapSunWings,
      keyframes: 'spirala-sun-wings',
      origin: '26% 73%',
    },
  ],
  body: flapSunBody,
  ratio: 719 / 600,
  tilt: 0,
  // it sits on its thorax line (~88% down); the wing tips hang a little
  // over the letters
  feet: 12,
  startDelay: 0.5,
};

const BEE: LanderConfig = {
  wings: [
    {
      src: flapBeeWings,
      keyframes: 'spirala-bee-wings',
      // wing roots measured on the art
      origin: '55% 38%',
    },
  ],
  body: flapBeeBody,
  ratio: 565 / 600,
  tilt: 0,
  // the legs hang to the very bottom of the art; sink a touch so they
  // rest on the letter instead of hovering
  feet: 4,
  startDelay: 0.5,
};

const KEYFRAMES = [
  PATH,
  wingKeyframes('spirala-dragonfly-wing-l', {
    open: 'scaleX(1)',
    folded: 'scaleX(0.35) skewY(-5deg)',
    stroke: 0.25,
  }),
  wingKeyframes('spirala-dragonfly-wing-r', {
    open: 'scaleX(1)',
    folded: 'scaleX(0.35) skewY(5deg)',
    stroke: 0.25,
  }),
  wingKeyframes('spirala-green-wings', {
    open: 'scale(1) skewX(0deg)',
    folded: 'scale(0.96,0.42) skewX(-10deg)',
    stroke: 0.3,
    restStroke: 1.5,
    restFolded: 'scale(0.98,0.7) skewX(-5deg)',
  }),
  wingKeyframes('spirala-sun-wings', {
    open: 'scale(1) skewX(0deg)',
    folded: 'scale(0.96,0.42) skewX(-10deg)',
    stroke: 0.3,
    restStroke: 1.6,
    restFolded: 'scale(0.98,0.7) skewX(-5deg)',
  }),
  // bee: a fast buzz in flight, wings still while it sits
  wingKeyframes('spirala-bee-wings', {
    open: 'rotate(4deg) scaleY(1)',
    folded: 'rotate(-16deg) scaleY(0.7)',
    stroke: 0.08,
  }),
].join('');

const layerClass = 'absolute inset-0 h-full w-full select-none object-contain';

interface LandingProps {
  className?: string;
  /** Extra inline position (e.g. a measured landing spot). */
  style?: CSSProperties;
}

function Lander({
  config,
  className = '',
  style,
}: LandingProps & { config: LanderConfig }) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>(0.3);
  const timing = {
    animationDuration: `${CYCLE_S}s`,
    animationDelay: `${config.startDelay}s`,
    animationIterationCount: 'infinite',
    animationFillMode: 'both',
    animationPlayState: inView ? 'running' : 'paused',
  } as const;

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 block select-none ${className}`}
      style={{ aspectRatio: `1 / ${config.ratio}`, ...style }}
    >
      <style>{KEYFRAMES}</style>
      <span
        className="absolute inset-0 block"
        style={{ transform: `translateY(${config.feet}%)` }}
      >
        <span
          className="absolute inset-0 block"
          style={{
            animationName: 'spirala-lander-path',
            animationTimingFunction: 'ease-in-out',
            ...timing,
          }}
        >
          <span
            className="absolute inset-0 block"
            style={{ transform: `rotate(${config.tilt}deg)` }}
          >
            {config.wings.map((w) => (
              <img
                key={w.src}
                src={w.src}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className={layerClass}
                style={{
                  transformOrigin: w.origin,
                  animationName: w.keyframes,
                  animationTimingFunction: 'ease-in-out',
                  ...timing,
                }}
              />
            ))}
            <img
              src={config.body}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              className={layerClass}
            />
          </span>
        </span>
      </span>
    </span>
  );
}

export function LandingDragonfly(props: LandingProps) {
  return <Lander config={DRAGONFLY} {...props} />;
}

export function LandingButterfly(props: LandingProps) {
  return <Lander config={BUTTERFLY} {...props} />;
}

export function LandingSunButterfly(props: LandingProps) {
  return <Lander config={SUN_BUTTERFLY} {...props} />;
}

export function LandingBee(props: LandingProps) {
  return <Lander config={BEE} {...props} />;
}
