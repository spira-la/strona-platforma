import { api } from '@/clients/api';
import { supabase } from '@/config/supabase';
import type { CMSContentResponse, CMSLanguage, CMSSectionKey, CMSUpdateResponse } from '@/types/cms.types';

interface CMSImageUploadResponse {
  url: string;
  thumbnailUrl: string;
  version: number;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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

  /**
   * Upload an image for a CMS field.
   * Uses raw fetch with FormData — Content-Type must NOT be set manually so the
   * browser can attach the correct multipart boundary.
   */
  async uploadImage(
    section: string,
    fieldPath: string,
    language: string,
    file: File,
  ): Promise<CMSImageUploadResponse> {
    const authHeader = await getAuthHeader();

    const form = new FormData();
    form.append('file', file);
    form.append('section', section);
    form.append('fieldPath', fieldPath);
    form.append('language', language);

    const response = await fetch('/api/cms/image', {
      method: 'POST',
      headers: authHeader,
      body: form,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = (await response.json()) as { message?: string };
        if (errorBody.message) message = errorBody.message;
      } catch {
        // Non-JSON error body — use default message
      }
      throw new Error(message);
    }

    return response.json() as Promise<CMSImageUploadResponse>;
  },

  /**
   * Delete a CMS image field, reverting it to the component's fallback.
   */
  async deleteImage(
    section: string,
    fieldPath: string,
    language: string,
  ): Promise<void> {
    return api.delete<void>(
      `/cms/image?section=${encodeURIComponent(section)}&fieldPath=${encodeURIComponent(fieldPath)}&language=${encodeURIComponent(language)}`,
    );
  },
};
