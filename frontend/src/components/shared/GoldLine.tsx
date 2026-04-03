import { useScrollReveal } from '@/hooks/useScrollReveal';

interface GoldLineProps {
  /** Width in px. Default: 48 */
  width?: number;
  /** Height in px. Default: 2 */
  height?: number;
  /** Duration in ms. Default: 1200 */
  duration?: number;
  /** Delay in ms. Default: 0 */
  delay?: number;
  className?: string;
}

/**
 * GoldLine — a decorative gold line that "draws" itself from left to right
 * when it enters the viewport.
 */
export function GoldLine({
  width = 48,
  height = 2,
  duration = 1200,
  delay = 0,
  className = '',
}: GoldLineProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.5 });

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, #D4B97A, #B8944A)',
          borderRadius: height,
          transform: isVisible ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left center',
          transition: `transform ${duration}ms cubic-bezier(0.19, 1, 0.22, 1) ${delay}ms`,
          willChange: 'transform',
        }}
      />
    </div>
  );
}
