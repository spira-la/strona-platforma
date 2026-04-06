import { useCallback, useRef, useState } from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cmsClient } from '@/clients/cms.client';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSLanguage } from '@/types/cms.types';
import type { EditableImageProps } from '@/types/cms.types';

/**
 * 3×3 grid of object-position values the admin can pick from.
 * Each cell maps to a CSS object-position value.
 */
const POSITIONS = [
  { label: '↖', value: 'left top' },
  { label: '↑', value: 'center top' },
  { label: '↗', value: 'right top' },
  { label: '←', value: 'left center' },
  { label: '·', value: 'center center' },
  { label: '→', value: 'right center' },
  { label: '↙', value: 'left bottom' },
  { label: '↓', value: 'center bottom' },
  { label: '↘', value: 'right bottom' },
] as const;

const FIT_OPTIONS = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' },
  { label: 'Fill', value: 'fill' },
] as const;

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
  const [showControls, setShowControls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image URL
  const resolvedValue = getFieldValue(section, fieldPath);
  const hasCmsImage = resolvedValue !== fieldPath && resolvedValue.trim() !== '';
  const displaySrc = previewSrc ?? (hasCmsImage ? resolvedValue : fallbackSrc);

  // Object position (stored as separate CMS field)
  const posField = `${fieldPath}Pos`;
  const posValue = getFieldValue(section, posField);
  const objectPosition = (posValue !== posField && posValue.trim() !== '') ? posValue : 'center center';

  // Object fit
  const fitField = `${fieldPath}Fit`;
  const fitValue = getFieldValue(section, fitField);
  const objectFit = (fitValue !== fitField && fitValue.trim() !== '') ? fitValue : 'cover';

  const currentLanguage = i18n.language as CMSLanguage;

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
      await updateField(section, posField, '');
      await updateField(section, fitField, '');
      setPreviewSrc(null);
    } catch {
      // Fail silently
    }
  }, [section, fieldPath, posField, fitField, currentLanguage, updateField]);

  const handlePositionChange = useCallback(
    async (pos: string) => {
      await updateField(section, posField, pos);
    },
    [section, posField, updateField],
  );

  const handleFitChange = useCallback(
    async (fit: string) => {
      await updateField(section, fitField, fit);
    },
    [section, fitField, updateField],
  );

  // Read-only — bare <img>
  if (!isEditMode) {
    return (
      <img
        src={displaySrc}
        alt={alt}
        className={className}
        style={{ objectFit: objectFit as React.CSSProperties['objectFit'], objectPosition }}
      />
    );
  }

  // Admin edit mode
  return (
    <div className={`group relative overflow-hidden ${containerClassName ?? ''}`}>
      <img
        src={displaySrc}
        alt={alt}
        className={`block w-full h-full ${className ?? ''}`}
        style={{ objectFit: objectFit as React.CSSProperties['objectFit'], objectPosition }}
      />

      {/* Hover overlay — main actions */}
      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-[inherit]">
        {/* Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors disabled:cursor-not-allowed"
          title="Upload image"
        >
          <Camera size={18} />
        </button>

        {/* Position/Fit controls toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowControls(!showControls);
          }}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors text-xs font-bold"
          title="Adjust position & fit"
        >
          ⊞
        </button>

        {/* Reset */}
        {hasCmsImage && (
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isUploading}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors disabled:cursor-not-allowed"
            title="Reset to default"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Position & Fit controls panel */}
      {showControls && (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white rounded-xl shadow-xl p-3 flex items-start gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 3×3 position grid */}
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5 text-center">Position</p>
            <div className="grid grid-cols-3 gap-0.5">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  type="button"
                  onClick={() => void handlePositionChange(pos.value)}
                  className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                    objectPosition === pos.value
                      ? 'bg-[#B8963E] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={pos.value}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fit options */}
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5 text-center">Fit</p>
            <div className="flex flex-col gap-0.5">
              {FIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => void handleFitChange(opt.value)}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    objectFit === opt.value
                      ? 'bg-[#B8963E] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={() => setShowControls(false)}
            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] flex items-center justify-center hover:bg-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload spinner */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[inherit]">
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

export default EditableImage;
