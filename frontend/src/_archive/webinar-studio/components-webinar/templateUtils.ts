/**
 * Template Translation Utilities
 *
 * Centralized utilities for translating webinar scene template names.
 * Following DRY principle - single source of truth for template translations.
 */

import type { TFunction } from 'i18next';

/**
 * Translation keys for scene template names
 * Maps backend template names to i18n keys in webinars.templates.*
 */
export const TEMPLATE_TRANSLATION_KEYS: Record<string, string> = {
  'Solo Speaker': 'webinars.templates.soloSpeaker',
  'Duo Interview': 'webinars.templates.duoInterview',
  'Speaker Focus': 'webinars.templates.speakerFocus',
  'Panel Discussion': 'webinars.templates.panelDiscussion',
  'Circle Bubbles': 'webinars.templates.circleBubbles',
  'Team Meeting': 'webinars.templates.teamMeeting',
};

/**
 * Get translated template name
 * Falls back to original name if no translation key exists
 *
 * @param name - Original template name from backend
 * @param t - i18next translation function
 * @returns Translated template name
 *
 * @example
 * const { t } = useTranslation();
 * const translatedName = getTranslatedTemplateName(template.name, t);
 */
export function getTranslatedTemplateName(name: string, t: TFunction): string {
  const key = TEMPLATE_TRANSLATION_KEYS[name];
  if (key) {
    return t(key, name);
  }
  return name;
}

/**
 * Get translated camera count string
 * Handles pluralization for different languages
 *
 * @param count - Number of cameras
 * @param t - i18next translation function
 * @returns Translated string like "2 cameras" or "2 cámaras"
 */
export function getTranslatedCameraCount(count: number, t: TFunction): string {
  return t('webinars.templates.camerasCount', '{{count}} cameras', { count });
}
