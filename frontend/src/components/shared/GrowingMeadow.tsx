import { useInViewOnce } from '@/hooks/useInViewOnce';
import meadow from '@/assets/watercolor/meadow.webp';

/**
 * The client's painted wildflower meadow, growing up from the bottom edge
 * of a photo when it scrolls into view (client 2026-11-10: "od dołu
 * zdjęcia wyrastają kwiaty"). Asset: plan/brand/cut-meadow.cjs.
 *
 * The meadow is shown as vertical strips cut at the natural gaps between
 * plants (CUTS, printed by the script). Each strip grows on its own — it is
 * revealed from the bottom up while it stretches to full height — so the
 * plants come up one after another instead of as one block.
 *
 * Put it inside a `relative overflow-hidden` photo frame and position it
 * with `className` (it keeps the artwork's aspect ratio).
 */

/** Strip edges in % of the width (gaps between plants). */
const CUTS = [0, 10.4, 23.8, 30.3, 48.1, 55.8, 69, 80.6, 89.3, 100];

/** Start delay (s) per strip — a loose, natural-looking order. */
// (client 2026-11-10: grow half as slow again — durations and delays ×1.5)
const DELAYS = [0.7, 0.15, 1, 0.45, 0, 0.75, 0.3, 1.1, 0.5];

/** Tiny overlap so no hairline seam shows between strips. */
const SEAM = 0.15;

const EASE = 'cubic-bezier(0.22, 0.8, 0.3, 1)';

export function GrowingMeadow({ className = '' }: { className?: string }) {
  const { ref, inView: grown } = useInViewOnce<HTMLDivElement>(0.3);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ aspectRatio: '1200 / 846' }}
      className={`pointer-events-none absolute select-none ${className}`}
    >
      {DELAYS.map((delay, i) => {
        const left = Math.max(0, CUTS[i] - SEAM);
        const right = Math.max(0, 100 - CUTS[i + 1] - SEAM);
        return (
          <img
            key={CUTS[i]}
            src={meadow}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute inset-0 h-full w-full origin-bottom"
            style={{
              clipPath: `inset(${grown ? 0 : 100}% ${right}% 0 ${left}%)`,
              transform: grown ? 'scaleY(1)' : 'scaleY(0.3)',
              transition: `clip-path 3.3s ${EASE} ${delay}s, transform 3.6s ${EASE} ${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
