/**
 * Classification of CMS fields for "Clean CMS" (reset to static defaults).
 *
 * The CMS stores everything for a section/language as nested JSON built from
 * dot-notation fieldPaths. A leaf is either TEXT (shown via EditableText and
 * overridden by the static fallback once removed) or MEDIA/CONFIG, which has
 * no static text fallback and must survive when `keepMedia` is true.
 *
 * A leaf is KEPT (media/config) when ANY of these holds:
 *  1. Its key ends with a sibling-suffix written by a non-text component:
 *       BgColor                       EditableBackgroundColor  (`${fp}BgColor`)
 *       OverlayTop|OverlayBottom|OverlayAngle   EditableOverlay
 *       Pos|Fit                       EditableImage / EditableBackground
 *       Action                        EditableButtonLink (`${fp}Action`, e.g. "calendly")
 *     NB: `BgColor` is checked before the text-style `Color` suffix, so a
 *     background colour is kept while a text colour (`${fp}Color`) is removed.
 *  2. Its string value is a bare URL: http(s)://, mailto:, tel: with no
 *     whitespace (image URLs on R2/CDN incl. `?v=` cache-bust, Calendly URL),
 *     or a site-relative path to an image file (`/x/y.webp|png|jpg|jpeg|avif|gif|svg`).
 *  3. Its key ends with `url` / `href` (case-insensitive), e.g. info.calendlyUrl,
 *     even when currently empty.
 *  4. Its value is not a string (number/boolean/array) - unknown, kept to be safe.
 *
 * Everything else is TEXT and removed, including EditableText style overrides
 * (`Bold`, `Italic`, `Align`, `Size`, `Color`, `MaxWidth`, `MaxHeight`,
 * `Multiline`), since they belong to the text.
 */

/**
 * Sections "Clean CMS" may touch: only the visual texts of public pages.
 * System/flow texts (auth, booking, confirmation, newsletter, 404), blog UI
 * texts, legal pages and the web-design ribbon are deliberately excluded.
 * Keep in sync with CLEANABLE_GROUPS in
 * frontend/src/components/admin/CleanCmsPanel.tsx.
 */
export const CLEANABLE_SECTIONS: readonly string[] = [
  // Current pages
  'homeNow',
  'aboutNow',
  'services',
  'howIWork',
  'events',
  'contact',
  'quiz',
  'kochanka',
  'motherWifeLover',
  'mamyNastolatkow',
  'youtube',
  // Shared layout
  'navbar',
  'footer',
  // Previous Start / O mnie (hidden behind classicHome / classicAbout)
  'hero',
  'home',
  'about',
  'roles',
  'cta',
  'testimonials',
];

const MEDIA_KEY_SUFFIXES = [
  'BgColor',
  'OverlayTop',
  'OverlayBottom',
  'OverlayAngle',
  'Pos',
  'Fit',
  'Action',
];

const BARE_URL_RE = /^(?:https?:\/\/|mailto:|tel:)\S+$/i;
const IMAGE_PATH_RE = /^\/\S+\.(?:webp|png|jpe?g|avif|gif|svg)(?:\?\S*)?$/i;
const URL_KEY_RE = /(?:url|href)$/i;

export function isMediaOrConfigLeaf(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return true;
  if (MEDIA_KEY_SUFFIXES.some((s) => key.endsWith(s))) return true;
  if (URL_KEY_RE.test(key)) return true;
  const v = value.trim();
  return BARE_URL_RE.test(v) || IMAGE_PATH_RE.test(v);
}

export interface PruneResult {
  /** The pruned object (empty objects removed). */
  value: Record<string, unknown>;
  removed: number;
  kept: number;
}

/**
 * Removes text leaves from a nested language object. With keepMedia=false
 * everything is removed. Does not mutate the input.
 */
export function pruneTextFields(
  obj: Record<string, unknown>,
  keepMedia: boolean,
): PruneResult {
  let removed = 0;
  let kept = 0;
  const out: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(obj)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      const child = pruneTextFields(val as Record<string, unknown>, keepMedia);
      removed += child.removed;
      kept += child.kept;
      if (Object.keys(child.value).length > 0) out[key] = child.value;
      continue;
    }
    if (keepMedia && isMediaOrConfigLeaf(key, val)) {
      out[key] = val;
      kept++;
    } else {
      removed++;
    }
  }

  return { value: out, removed, kept };
}
