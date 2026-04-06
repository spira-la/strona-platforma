import type React from 'react';

export type CMSLanguage = 'pl' | 'en' | 'es';

export type CMSSectionKey =
  | 'navbar'
  | 'hero'
  | 'about'
  | 'howIWork'
  | 'services'
  | 'blog'
  | 'contact'
  | 'footer'
  | 'confirmation'
  | 'booking'
  | 'newsletter'
  | 'cta'
  | 'testimonials';

export interface CMSContentResponse {
  success: boolean;
  content: Record<string, Record<CMSLanguage, Record<string, unknown>>>;
  version: number;
  updatedAt: string;
  updatedBy?: string;
}

export interface CMSUpdateResponse {
  success: boolean;
  message: string;
  updatedAt: string;
  version: number;
}

export interface EditableTextProps {
  section: CMSSectionKey;
  fieldPath: string;
  as?: keyof React.JSX.IntrinsicElements;
  id?: string;
  className?: string;
  /**
   * Fallback text displayed when no CMS content exists for this field.
   * Also accepts React children as an alternative — rendered as a string
   * via React.Children.toArray().join('').
   */
  placeholder?: string;
  children?: React.ReactNode;
  richText?: boolean;
  render?: (content: string) => React.ReactNode;
}

export interface EditableImageProps {
  section: CMSSectionKey;
  fieldPath: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export interface CMSContextValue {
  content: Record<string, Record<CMSLanguage, Record<string, unknown>>>;
  isLoading: boolean;
  error: Error | null;
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  getFieldValue: (section: CMSSectionKey, fieldPath: string) => string;
  updateField: (section: CMSSectionKey, fieldPath: string, value: string) => Promise<void>;
}
