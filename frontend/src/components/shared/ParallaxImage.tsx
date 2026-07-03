import { useEffect, useRef, useState } from 'react';

interface ParallaxImageProps {
  src: string;
  alt: string;
  /** How much the image moves relative to scroll. Default: 0.15 (subtle) */
  speed?: number;
  className?: string;
  /** Extra scale to allow parallax movement without gaps. Default: 1.15 */
  scale?: number;
}

/**
 * ParallaxImage — image that moves at a different speed than scroll.
 * Uses requestAnimationFrame for butter-smooth movement.
 */
export function ParallaxImage({
  src,
  alt,
  speed = 0.15,
  className = '',
  scale = 1.15,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const windowH = window.innerHeight;

        // Only calculate when in or near viewport
        if (rect.bottom > -200 && rect.top < windowH + 200) {
          // 0 when element is at bottom of viewport, 1 when at top
          const progress = (windowH - rect.top) / (windowH + rect.height);
          // Center the movement: -0.5 to 0.5 range
          const centered = progress - 0.5;
          setOffset(centered * speed * rect.height);
        }

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
        style={{
          transform: `translateY(${offset}px) scale(${scale})`,
          willChange: 'transform',
          transition: 'transform 0.1s linear',
        }}
      />
    </div>
  );
}
