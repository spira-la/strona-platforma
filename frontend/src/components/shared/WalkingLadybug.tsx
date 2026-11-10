import { useLayoutEffect, useState } from 'react';
import ladybug from '@/assets/watercolor/ladybug.webp';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import type { WordSpot } from '@/hooks/useWordSpot';

/**
 * The client's painted ladybug walking horizontally from the orange blot at
 * the top of the section to a word of the title, resting on it, then
 * walking back (client 2026-11-10: "wstaw horyzontalnie poruszającą się
 * biedronkę, niech idzie od plastra z góry do wyrazu »życiem«").
 *
 * `spot` is where it stops — measured on the word with useWordSpot, in px
 * inside the same `relative` wrapper. The start is measured on the section's
 * orange blot (`blotSelector`), so the walk always begins on the blot,
 * whatever the screen width. Asset: plan/brand/cut-ladybug.cjs (head left).
 */

const CYCLE_S = 18;
const RATIO = 175 / 240;

const KEYFRAMES = `
@keyframes spirala-ladybug-walk{
  0%,6%{transform:translateX(var(--walk)) scaleX(1)}
  46%,62%{transform:translateX(0) scaleX(1)}
  65%{transform:translateX(0) scaleX(-1)}
  95%{transform:translateX(var(--walk)) scaleX(-1)}
  98%,100%{transform:translateX(var(--walk)) scaleX(1)}
}
@keyframes spirala-ladybug-step{
  0%{transform:rotate(-4deg) translateY(0)}
  50%{transform:rotate(0deg) translateY(-1px)}
  100%{transform:rotate(4deg) translateY(0)}
}`;

export function WalkingLadybug({
  spot,
  blotSelector = 'img[src*="blot-orange"]',
  className = '',
}: {
  spot: WordSpot;
  blotSelector?: string;
  className?: string;
}) {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>(0.3);
  const [walk, setWalk] = useState(240);

  useLayoutEffect(() => {
    const el = ref.current;
    const wrap = el?.offsetParent;
    const section = el?.closest('section');
    const blot = section?.querySelector(blotSelector);
    if (!el || !wrap || !section || !blot) return;
    const measure = () => {
      const w = wrap.getBoundingClientRect();
      const b = blot.getBoundingClientRect();
      const s = section.getBoundingClientRect();
      // start inside the visible part of the blot
      const startX = Math.min(b.left + b.width * 0.5, s.right - 40) - w.left;
      setWalk(Math.max(120, Math.round(startX - spot.left)));
    };
    measure();
    globalThis.addEventListener('resize', measure);
    return () => globalThis.removeEventListener('resize', measure);
  }, [spot, blotSelector, ref]);

  const timing = {
    animationDelay: '0.5s',
    animationIterationCount: 'infinite',
    animationFillMode: 'both',
    animationPlayState: inView ? 'running' : 'paused',
  } as const;

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 block -translate-x-1/2 select-none ${className}`}
      style={{
        left: spot.left,
        bottom: spot.bottom,
        aspectRatio: `1 / ${RATIO}`,
        // custom property read by the walk keyframes
        ['--walk' as string]: `${walk}px`,
        animationName: 'spirala-ladybug-walk',
        animationDuration: `${CYCLE_S}s`,
        animationTimingFunction: 'ease-in-out',
        ...timing,
      }}
    >
      <style>{KEYFRAMES}</style>
      <img
        src={ladybug}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-full w-full select-none object-contain"
        style={{
          animationName: 'spirala-ladybug-step',
          animationDuration: '0.32s',
          animationDirection: 'alternate',
          animationTimingFunction: 'ease-in-out',
          ...timing,
        }}
      />
    </span>
  );
}
