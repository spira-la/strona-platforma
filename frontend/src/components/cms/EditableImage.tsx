import { useCallback, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cmsClient } from '@/clients/cms.client';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSLanguage } from '@/types/cms.types';
import type { EditableImageProps } from '@/types/cms.types';

/**
 * EditableImage renders a CMS-managed image.
 *
 * Non-admin / edit-mode-off: renders a plain <img> — CMS URL when available,
 * fallbackSrc otherwise. Zero interactivity overhead in this path.
 *
 * Admin edit mode: wraps the image in a relative container and shows a
 * semi-transparent overlay on hover with two icon buttons:
 *   - Camera — opens a hidden file input, previews immediately, then uploads
 *   - Trash2  — deletes the CMS image and reverts to fallbackSrc
 *
 * The upload shows a gold spinner overlay while the API call is in flight.
 * On success the CMS context is updated optimistically so the UI reflects the
 * new URL without waiting for a page reload.
 */
export function EditableImage({
  section,
  fieldPath,
  fallbackSrc,
  alt,
  className,
  containerClassName,
}: EditableImageProps) {
  const { isEditMode, getFieldValue, updateField } = useCMS();
  const { i18n } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resolve the current image URL from CMS content.
  // When the resolved value equals the fieldPath sentinel there is no stored
  // URL yet — fall through to fallbackSrc.
  const resolvedValue = getFieldValue(section, fieldPath);
  const hasCmsImage = resolvedValue !== fieldPath && resolvedValue.trim() !== '';
  const displaySrc = previewSrc ?? (hasCmsImage ? resolvedValue : fallbackSrc);

  const currentLanguage = i18n.language as CMSLanguage;

  // -------------------------------------------------------------------------
  // Upload handler
  // -------------------------------------------------------------------------
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show a local object-URL preview immediately so the user sees the
      // chosen image before the upload completes.
      const objectUrl = URL.createObjectURL(file);
      setPreviewSrc(objectUrl);
      setIsUploading(true);

      try {
        const { url } = await cmsClient.uploadImage(
          section,
          fieldPath,
          currentLanguage,
          file,
        );
        await updateField(section, fieldPath, url);
        // Replace the temporary object-URL with the permanent CDN URL.
        setPreviewSrc(url);
      } catch {
        // Revert the optimistic preview on failure.
        setPreviewSrc(null);
      } finally {
        setIsUploading(false);
        // Reset input so the same file can be chosen again after a failure.
        if (fileInputRef.current) fileInputRef.current.value = '';
        URL.revokeObjectURL(objectUrl);
      }
    },
    [section, fieldPath, currentLanguage, updateField],
  );

  // -------------------------------------------------------------------------
  // Reset (delete) handler
  // -------------------------------------------------------------------------
  const handleReset = useCallback(async () => {
    try {
      await cmsClient.deleteImage(section, fieldPath, currentLanguage);
      await updateField(section, fieldPath, '');
      setPreviewSrc(null);
    } catch {
      // Fail silently — the existing image stays displayed.
    }
  }, [section, fieldPath, currentLanguage, updateField]);

  // -------------------------------------------------------------------------
  // Read-only mode — render bare <img>, no wrapper overhead
  // -------------------------------------------------------------------------
  if (!isEditMode) {
    return (
      <img
        src={displaySrc}
        alt={alt}
        className={className}
      />
    );
  }

  // -------------------------------------------------------------------------
  // Admin edit mode — hoverable container with overlay controls
  // -------------------------------------------------------------------------
  return (
    <div
      className={`group relative overflow-hidden ${containerClassName ?? ''}`}
    >
      <img
        src={displaySrc}
        alt={alt}
        className={`block w-full h-full object-cover ${className ?? ''}`}
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-[inherit]"
        aria-hidden="true"
      >
        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors disabled:cursor-not-allowed"
          title={`Upload image: ${section} → ${fieldPath}`}
          aria-label="Upload new image"
        >
          <Camera size={18} strokeWidth={2} />
        </button>

        {/* Reset button — only show when a CMS image exists */}
        {hasCmsImage && (
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isUploading}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors disabled:cursor-not-allowed"
            title="Revert to default image"
            aria-label="Reset to default image"
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Upload spinner overlay */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[inherit]">
          <span
            className="block h-8 w-8 rounded-full border-2 border-[#B8963E]/30 border-t-[#B8963E] animate-spin"
            role="status"
            aria-label="Uploading image"
          />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void handleFileChange(e)}
      />
    </div>
  );
}

export default EditableImage;
