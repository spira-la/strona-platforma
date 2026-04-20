import type React from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useCMS } from '@/contexts/CMSContext';
import {
  EditableText,
  parseStyle,
  toCssStyle,
} from '@/components/cms/EditableText';
import type { CMSSectionKey } from '@/types/cms.types';

interface SplitTextProps {
  /** The text to split and animate */
  text: string;
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
  /** CMS section key for inline editing */
  cmsSection?: CMSSectionKey;
  /** CMS field path for inline editing */
  cmsField?: string;
}

/**
 * SplitText — animates text word-by-word or character-by-character.
 * Each piece slides up from behind a clip mask for a premium reveal effect.
 */
export function SplitText({
  text,
  className,
  splitBy = 'word',
  delay = 0,
  staggerInterval = 60,
  duration = 900,
  cmsSection,
  cmsField,
}: SplitTextProps) {
  const { isEditMode, getFieldValue } = useCMS();
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold: 0.2,
  });

  // CMS text value (used in both modes)
  let displayText = text;
  if (cmsSection && cmsField) {
    const cmsValue = getFieldValue(cmsSection, cmsField);
    if (cmsValue && cmsValue !== cmsField && cmsValue.trim() !== '') {
      displayText = cmsValue;
    }
  }

  // CMS style fields — split into container vs text styles so they layer
  // correctly with the Tailwind base classes on the container div.
  let containerStyle: React.CSSProperties | undefined;
  let wordStyle: React.CSSProperties | undefined;
  if (cmsSection && cmsField) {
    const full = toCssStyle(
      parseStyle((f) => getFieldValue(cmsSection, f), cmsField),
    );
    const { fontSize, fontWeight, fontStyle, color, whiteSpace, textAlign } =
      full;
    containerStyle = textAlign ? { textAlign } : undefined;
    const textOverrides = {
      fontSize,
      fontWeight,
      fontStyle,
      color,
      whiteSpace,
    };
    const hasTextOverrides = Object.values(textOverrides).some(Boolean);
    wordStyle = hasTextOverrides ? textOverrides : undefined;
  }

  // In CMS edit mode, render an EditableText instead of the animation
  if (isEditMode && cmsSection && cmsField) {
    return (
      <div className={className} style={containerStyle}>
        <EditableText
          section={cmsSection}
          fieldPath={cmsField}
          as="span"
          placeholder={text}
        />
      </div>
    );
  }

  const pieces = splitBy === 'word' ? displayText.split(' ') : [...displayText];
  const easing = 'cubic-bezier(0.19, 1, 0.22, 1)';

  return (
    <div
      ref={ref}
      className={className}
      style={containerStyle}
      aria-label={displayText}
    >
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          aria-hidden="true"
        >
          <span
            className="inline-block"
            style={{
              ...wordStyle,
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
    </div>
  );
}
