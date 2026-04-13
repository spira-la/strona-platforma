import { type ReactNode, type CSSProperties } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

type Animation =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'fade'
  | 'scale'
  | 'blur'
  | 'clip-up'
  | 'clip-left'
  | 'clip-right';

interface ScrollRevealProps {
  children: ReactNode;
  /** Animation type. Default: 'fade-up' */
  animation?: Animation;
  /** Delay in ms. Default: 0 */
  delay?: number;
  /** Duration in ms. Default: 1200 */
  duration?: number;
  /** Distance for slide animations in px. Default: 20 */
  distance?: number;
  /** Extra className on the wrapper */
  className?: string;
  /** Intersection Observer threshold. Default: 0.12 */
  threshold?: number;
}

const getHiddenStyles = (
  animation: Animation,
  distance: number,
): CSSProperties => {
  const base: CSSProperties = {
    opacity: 0,
    willChange: 'opacity, transform, clip-path',
  };

  switch (animation) {
    case 'fade-up': {
      return { ...base, transform: `translateY(${distance}px)` };
    }
    case 'fade-down': {
      return { ...base, transform: `translateY(-${distance}px)` };
    }
    case 'fade-left': {
      return { ...base, transform: `translateX(${distance}px)` };
    }
    case 'fade-right': {
      return { ...base, transform: `translateX(-${distance}px)` };
    }
    case 'fade': {
      return base;
    }
    case 'scale': {
      return { ...base, transform: 'scale(0.97)' };
    }
    case 'blur': {
      return {
        ...base,
        filter: 'blur(10px)',
        transform: `translateY(${distance / 2}px)`,
      };
    }
    case 'clip-up': {
      return { ...base, opacity: 1, clipPath: 'inset(100% 0 0 0)' };
    }
    case 'clip-left': {
      return { ...base, opacity: 1, clipPath: 'inset(0 100% 0 0)' };
    }
    case 'clip-right': {
      return { ...base, opacity: 1, clipPath: 'inset(0 0 0 100%)' };
    }
  }
};

const getVisibleStyles = (animation: Animation): CSSProperties => {
  if (animation.startsWith('clip')) {
    return { opacity: 1, clipPath: 'inset(0 0 0 0)' };
  }
  if (animation === 'blur') {
    return { opacity: 1, filter: 'none', transform: 'none' };
  }
  return { opacity: 1, transform: 'none' };
};

// Elegant easing — slow start, very gentle deceleration
const EASING = 'cubic-bezier(0.19, 1, 0.22, 1)';

export function ScrollReveal({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 1200,
  distance = 20,
  className,
  threshold = 0.12,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold });

  const props = animation.startsWith('clip')
    ? 'clip-path'
    : 'opacity, transform, filter';
  const transition = props
    .split(', ')
    .map((p) => `${p} ${duration}ms ${EASING} ${delay}ms`)
    .join(', ');

  // Clip animations also need opacity transition for non-clip properties
  const fullTransition = animation.startsWith('clip')
    ? `clip-path ${duration}ms ${EASING} ${delay}ms, opacity ${duration * 0.3}ms ${EASING} ${delay}ms`
    : transition;

  const style: CSSProperties = {
    transition: fullTransition,
    ...(isVisible
      ? getVisibleStyles(animation)
      : getHiddenStyles(animation, distance)),
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

/**
 * Stagger helper — 150ms between each item for a slow, elegant cascade.
 */
export function stagger(index: number, interval = 150): number {
  return index * interval;
}
