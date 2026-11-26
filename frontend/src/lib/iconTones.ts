/**
 * Vivid icon colors taken from the rainbow spiral of the Spirala logo
 * (tokens `--color-spiral-*` in styles/spirala-theme.css).
 *
 * Lists of icons cycle through the tones in spiral order, so every card
 * gets its own color: `iconTone(i)` → classes for the circle + icon.
 * Full class strings are kept literal so Tailwind picks them up.
 */
export const ICON_TONES = [
  'bg-spiral-coral-soft text-spiral-coral',
  'bg-spiral-gold-soft text-spiral-gold',
  'bg-spiral-teal-soft text-spiral-teal',
  'bg-spiral-violet-soft text-spiral-violet',
  'bg-spiral-orange-soft text-spiral-orange',
  'bg-spiral-blue-soft text-spiral-blue',
] as const;

/** Icon color only (for icons on white or on a colored card). */
export const ICON_TONE_TEXT = [
  'text-spiral-coral',
  'text-spiral-gold',
  'text-spiral-teal',
  'text-spiral-violet',
  'text-spiral-orange',
  'text-spiral-blue',
] as const;

export function iconTone(index: number): string {
  return ICON_TONES[index % ICON_TONES.length];
}

export function iconToneText(index: number): string {
  return ICON_TONE_TEXT[index % ICON_TONE_TEXT.length];
}
