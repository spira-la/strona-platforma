import { useCMS } from '@/contexts/CMSContext';
import type { CMSSectionKey } from '@/types/cms.types';

/**
 * Convenience hook that returns the resolved CMS field value for the current
 * i18n language, falling back to Polish ('pl') and then to the fieldPath itself.
 */
export function useCMSField(section: CMSSectionKey, fieldPath: string): string {
  const { getFieldValue } = useCMS();
  return getFieldValue(section, fieldPath);
}
