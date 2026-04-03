import { useScrollReveal } from '@/hooks/useScrollReveal';

interface SplitTextProps {
  /** The text to split and animate */
  text: string;
  /** HTML tag for the container. Default: 'h2' */
  as?: keyof React.JSX.IntrinsicElements;
  /** CSS class on the container */
  className?: string;
  /** Split by 'word' or 'char'. Default: 'word' */
  splitBy?: 'word' | 'char';
  /** Base delay before first item in ms. Default: 0 */
  delay?: number;
  /** Delay between each item in ms. Default: 60 */
  staggerInterval?: number;
  /** Duration per item in ms. Default: 900 */
  duration?: number;
}

/**
 * SplitText — animates text word-by-word or character-by-character.
 * Each piece slides up from behind a clip mask for a premium reveal effect.
 */
export function SplitText({
  text,
  as: Tag = 'h2',
  className,
  splitBy = 'word',
  delay = 0,
  staggerInterval = 60,
  duration = 900,
}: SplitTextProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  const pieces = splitBy === 'word' ? text.split(' ') : text.split('');
  const easing = 'cubic-bezier(0.19, 1, 0.22, 1)';

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          aria-hidden="true"
        >
          <span
            className="inline-block"
            style={{
              transform: isVisible ? 'translateY(0)' : 'translateY(110%)',
              opacity: isVisible ? 1 : 0,
              transition: `transform ${duration}ms ${easing} ${delay + i * staggerInterval}ms, opacity ${duration * 0.5}ms ${easing} ${delay + i * staggerInterval}ms`,
              willChange: 'transform, opacity',
            }}
          >
            {piece}
            {splitBy === 'word' && i < pieces.length - 1 ? '\u00A0' : ''}
          </span>
        </span>
      ))}
    </Tag>
  );
}
