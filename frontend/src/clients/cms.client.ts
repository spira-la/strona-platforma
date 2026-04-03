import { api } from '@/clients/api';
import type { CMSContentResponse, CMSLanguage, CMSSectionKey, CMSUpdateResponse } from '@/types/cms.types';

export const cmsClient = {
  /**
   * Fetch the full CMS content object.
   */
  getContent(): Promise<CMSContentResponse> {
    return api.get<CMSContentResponse>('/cms/content');
  },

  /**
   * Update a single field value for a given section and language.
   */
  updateField(
    section: CMSSectionKey,
    language: CMSLanguage,
    fieldPath: string,
    value: string,
  ): Promise<CMSUpdateResponse> {
    return api.put<CMSUpdateResponse>('/cms/field', {
      section,
      language,
      fieldPath,
      value,
    });
  },

  /**
   * Replace all content for a section in a given language.
   */
  updateSection(
    section: CMSSectionKey,
    language: CMSLanguage,
    content: Record<string, unknown>,
  ): Promise<CMSUpdateResponse> {
    return api.put<CMSUpdateResponse>('/cms/section', {
      section,
      language,
      content,
    });
  },
};
