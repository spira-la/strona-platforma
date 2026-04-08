import { useCallback, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cmsClient } from '@/clients/cms.client';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSLanguage, CMSSectionKey } from '@/types/cms.types';

interface EditableBackgroundProps {
  /** CMS section key (e.g. 'about', 'services') */
  section: CMSSectionKey;
  /** CMS field path for the background image URL */
  fieldPath: string;
  /** Fallback URL when no CMS image is set */
  fallbackSrc: string;
  /** Extra CSS classes on the wrapper div */
  className?: string;
  /** Extra inline styles (merged with background styles) */
  style?: CSSProperties;
  /** Content rendered on top of the background */
  children?: ReactNode;
  /** HTML role for the section */
  role?: string;
  /** Aria label */
  'aria-label'?: string;
  /** Aria hidden */
  'aria-hidden'?: boolean;
}

/**
 * A CMS-editable background div. In view mode it's a plain `<div>` with
 * `backgroundImage`. In edit mode the admin gets upload / reset controls.
 * Falls back to `fallbackSrc` when no CMS image is saved.
 */
export function EditableBackground({
  section,
  fieldPath,
  fallbackSrc,
  className,
  style,
  children,
  ...rest
}: EditableBackgroundProps) {
  const { isEditMode, getFieldValue, updateField } = useCMS();
  const { i18n } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resolvedValue = getFieldValue(section, fieldPath);
  const hasCmsImage = resolvedValue !== fieldPath && resolvedValue.trim() !== '';
  const displaySrc = previewSrc ?? (hasCmsImage ? resolvedValue : fallbackSrc);

  const currentLanguage = i18n.language as CMSLanguage;

  const bgStyle: CSSProperties = {
    backgroundImage: `url(${displaySrc})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    ...style,
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);
      setIsUploading(true);

      try {
        const { url } = await cmsClient.uploadImage(section, fieldPath, currentLanguage, file);
        await updateField(section, fieldPath, url);
        setPreviewSrc(url);
      } catch {
        setPreviewSrc(null);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        URL.revokeObjectURL(objectUrl);
      }
    },
    [section, fieldPath, currentLanguage, updateField],
  );

  const handleReset = useCallback(async () => {
    try {
      await cmsClient.deleteImage(section, fieldPath, currentLanguage);
      await updateField(section, fieldPath, '');
      setPreviewSrc(null);
    } catch {
      // Fail silently
    }
  }, [section, fieldPath, currentLanguage, updateField]);

  // View mode — plain div with background
  if (!isEditMode) {
    return (
      <div className={className} style={bgStyle} {...rest}>
        {children}
      </div>
    );
  }

  // Edit mode — div with background + admin controls
  return (
    <div className={`group/bg relative ${className ?? ''}`} style={bgStyle} {...rest}>
      {children}

      {/* Admin controls — bottom-right corner */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 opacity-0 group-hover/bg:opacity-100 transition-opacity duration-200">
        {/* Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black/60 text-white text-[12px] font-medium hover:bg-black/80 transition-colors disabled:cursor-not-allowed backdrop-blur-sm"
          title="Zmień tło"
        >
          <Camera size={14} />
          Zmień tło
        </button>

        {/* Reset */}
        {hasCmsImage && (
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isUploading}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-black/60 text-white hover:bg-red-600/80 transition-colors disabled:cursor-not-allowed backdrop-blur-sm"
            title="Przywróć domyślne"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Upload spinner */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <span className="block h-8 w-8 rounded-full border-2 border-[#B8963E]/30 border-t-[#B8963E] animate-spin" />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void handleFileChange(e)}
      />
    </div>
  );
}

export default EditableBackground;
