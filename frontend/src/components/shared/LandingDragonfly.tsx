import flapDragonflyLeft from '@/assets/watercolor/flap-dragonfly-left.webp';
import flapDragonflyRight from '@/assets/watercolor/flap-dragonfly-right.webp';
import flapDragonflyBody from '@/assets/watercolor/flap-dragonfly-body.webp';
import { useInViewOnce } from '@/hooks/useInViewOnce';

/**
 * The client's turquoise dragonfly flying down onto the wildflowers that
 * grow from the bottom of the "O mnie" photo (client 2026-11-10: "ważka
 * niech ląduje na tych kwiatach, co wyrastają z dołu zdjęcia").
 *
 * Position it with `className` at the landing spot (it keeps the art's
 * aspect ratio). One 20 s loop: it hovers above the photo's top-right
 * corner, flies down, lands, rests with still wings, takes off and flies
 * back. The wings beat only while it flies — the wing keyframes are
 * generated on the same 20 s clock as the path, so they stop exactly on
 * landing. Starts when the photo scrolls into view, after the meadow has
 * grown. Layers: plan/brand/split-flapping-butterflies.cjs (tilted=-14).
 */

const CYCLE_S = 20;
const START_DELAY_S = 3.2;
const TILT = -14;
const HINGE = 48.91;
const RATIO = 339 / 640;

/** Flight segments (in % of the cycle) during which the wings beat. */
const FLIGHT: [number, number][] = [
  [0, 42],
  [78, 100],
];
/** One wing stroke ≈ 0.25 s. */
const STROKE = (0.25 / CYCLE_S) * 100;

function wingKeyframes(name: string, folded: string): string {
  const stops: string[] = [];
  for (const [from, to] of FLIGHT) {
    let open = true;
    for (let t = from; t < to; t += STROKE) {
      stops.push(`${t.toFixed(2)}%{transform:${open ? 'scaleX(1)' : folded}}`);
      open = !open;
    }
    stops.push(`${to}%{transform:scaleX(1)}`);
  }
  return `@keyframes ${name}{${stops.join('')}}`;
}

const KEYFRAMES = [
  // path, in % of the dragonfly's own size, ending on the landing spot
  `@keyframes spirala-dragonfly-path{
    0%{transform:translate(170%,-330%) rotate(-30deg)}
    6%{transform:translate(150%,-300%) rotate(-22deg)}
    22%{transform:translate(70%,-170%) rotate(-12deg)}
    32%{transform:translate(15%,-55%) rotate(6deg)}
    38%{transform:translate(0,-8%) rotate(2deg)}
    42%,78%{transform:translate(0,0) rotate(0deg)}
    82%{transform:translate(-15%,-50%) rotate(-10deg)}
    92%{transform:translate(80%,-220%) rotate(-28deg)}
    100%{transform:translate(170%,-330%) rotate(-30deg)}
  }`,
  wingKeyframes('spirala-dragonfly-wing-l', 'scaleX(0.35) skewY(-5deg)'),
  wingKeyframes('spirala-dragonfly-wing-r', 'scaleX(0.35) skewY(5deg)'),
].join('');

const layerClass = 'absolute inset-0 h-full w-full select-none object-contain';

export function LandingDragonfly({ className = '' }: { className?: string }) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>(0.3);
  const timing = {
    animationDuration: `${CYCLE_S}s`,
    animationDelay: `${START_DELAY_S}s`,
    animationIterationCount: 'infinite',
    animationFillMode: 'both',
    animationTimingFunction: 'ease-in-out',
    animationPlayState: inView ? 'running' : 'paused',
  } as const;
  const wingOrigin = `${HINGE}% 50%`;

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 block select-none ${className}`}
      style={{
        aspectRatio: `1 / ${RATIO}`,
        animationName: 'spirala-dragonfly-path',
        ...timing,
      }}
    >
      <style>{KEYFRAMES}</style>
      <span
        className="absolute inset-0 block"
        style={{ transform: `rotate(${TILT}deg)` }}
      >
        <img
          src={flapDragonflyLeft}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className={layerClass}
          style={{
            transformOrigin: wingOrigin,
            animationName: 'spirala-dragonfly-wing-l',
            ...timing,
            animationTimingFunction: 'linear',
          }}
        />
        <img
          src={flapDragonflyRight}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className={layerClass}
          style={{
            transformOrigin: wingOrigin,
            animationName: 'spirala-dragonfly-wing-r',
            ...timing,
            animationTimingFunction: 'linear',
          }}
        />
        <img
          src={flapDragonflyBody}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className={layerClass}
        />
      </span>
    </span>
  );
}
