import { useEffect, useRef } from 'react';
import ladybug from '@/assets/watercolor/ladybug.webp';

/**
 * The client's ladybug crawling around the border of a card, corners
 * included (client 2026-11-10, Wydarzenia: "niech biedronka chodzi po linii
 * ramki, naokoło", quickly). Put it inside a `relative` card; it follows the
 * card's rounded rectangle (`radius` = the card's border radius, px) and
 * turns to face the way it walks.
 *
 * A CSS offset-path would do this too, but support for shapes on older
 * phones is patchy, so the position along the perimeter is computed here
 * each frame — only while the card is on screen.
 */

const RATIO = 175 / 240;

export function CrawlingLadybug({
  radius = 24,
  speed = 80,
  className = '',
}: {
  radius?: number;
  /** px per second along the border */
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const card = el?.parentElement;
    if (!el || !card) return;

    let w = card.offsetWidth;
    let h = card.offsetHeight;
    const resize = new ResizeObserver(() => {
      w = card.offsetWidth;
      h = card.offsetHeight;
    });
    resize.observe(card);

    // a point at distance s along the rounded rectangle, clockwise from the
    // top-left end of the top edge; returns x, y and heading (radians)
    const pointAt = (s: number): [number, number, number] => {
      const r = Math.min(radius, w / 2, h / 2);
      const top = w - 2 * r;
      const side = h - 2 * r;
      const arc = (Math.PI * r) / 2;
      const segs: [number, (t: number) => [number, number, number]][] = [
        [top, (t) => [r + t, 0, 0]],
        [arc, (t) => corner(w - r, r, -Math.PI / 2, t / r)],
        [side, (t) => [w, r + t, Math.PI / 2]],
        [arc, (t) => corner(w - r, h - r, 0, t / r)],
        [top, (t) => [w - r - t, h, Math.PI]],
        [arc, (t) => corner(r, h - r, Math.PI / 2, t / r)],
        [side, (t) => [0, h - r - t, -Math.PI / 2]],
        [arc, (t) => corner(r, r, Math.PI, t / r)],
      ];
      function corner(
        cx: number,
        cy: number,
        start: number,
        a: number,
      ): [number, number, number] {
        const ang = start + a;
        return [
          cx + Math.cos(ang) * r,
          cy + Math.sin(ang) * r,
          ang + Math.PI / 2,
        ];
      }
      let left = s;
      for (const [len, at] of segs) {
        if (left <= len) return at(left);
        left -= len;
      }
      return [r, 0, 0];
    };

    let raf = 0;
    let last = 0;
    let dist = 0;
    let visible = false;
    const step = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const r = Math.min(radius, w / 2, h / 2);
      const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
      dist = (dist + speed * dt) % perimeter;
      const [x, y, heading] = pointAt(dist);
      // the art faces left (π); turn it to the heading, plus a tiny waddle
      const waddle = Math.sin(now / 90) * 4;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${heading - Math.PI}rad) rotate(${waddle}deg)`;
      if (visible) raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      cancelAnimationFrame(raf);
      last = 0;
      if (visible) raf = requestAnimationFrame(step);
    });
    io.observe(card);
    // first paint: sit on the top edge
    step(0);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      resize.disconnect();
    };
  }, [radius, speed]);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute left-0 top-0 z-20 block select-none ${className}`}
      style={{ aspectRatio: `1 / ${RATIO}` }}
    >
      <img
        src={ladybug}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="block h-full w-full select-none object-contain"
      />
    </span>
  );
}
