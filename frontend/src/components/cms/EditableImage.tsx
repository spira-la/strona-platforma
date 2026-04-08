import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Settings2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cmsClient } from '@/clients/cms.client';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSLanguage } from '@/types/cms.types';
import type { EditableImageProps } from '@/types/cms.types';

const FIT_OPTIONS = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' },
  { label: 'Fill', value: 'fill' },
] as const;

/** Parse "50% 30%" into { x: 50, y: 30 }, defaults to 50/50 */
function parsePosition(pos: string): { x: number; y: number } {
  const match = pos.match(/(\d+)%\s+(\d+)%/);
  if (match) return { x: Number(match[1]), y: Number(match[2]) };
  const xMap: Record<string, number> = { left: 0, center: 50, right: 100 };
  const yMap: Record<string, number> = { top: 0, center: 50, bottom: 100 };
  const parts = pos.split(/\s+/);
  return {
    x: xMap[parts[0]] ?? 50,
    y: yMap[parts[1]] ?? 50,
  };
}

export function EditableImage({
  section,
  fieldPath,
  fallbackSrc,
  alt,
  className,
  containerClassName,
}: EditableImageProps) {
  const { isEditMode, getFieldValue, updateField } = useCMS();
  const { t, i18n } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Flash "saved" indicator then auto-hide
  const flashSaved = useCallback(() => {
    setSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
  }, []);

  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

  // Image URL
  const resolvedValue = getFieldValue(section, fieldPath);
  const hasCmsImage = resolvedValue !== fieldPath && resolvedValue.trim() !== '';
  const displaySrc = previewSrc ?? (hasCmsImage ? resolvedValue : fallbackSrc);

  // Object position
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
      flashSaved();
    },
    [section, posField, updateField, flashSaved],
  );

  const handleFitChange = useCallback(
    async (fit: string) => {
      await updateField(section, fitField, fit);
      flashSaved();
    },
    [section, fitField, updateField, flashSaved],
  );

  const parsed = parsePosition(objectPosition);

  // Read-only
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

  // Admin edit mode — controls rendered as sibling to avoid overflow-hidden clipping
  return (
    <>
      <img
        src={displaySrc}
        alt={alt}
        className={`block w-full h-full ${className ?? ''}`}
        style={{ objectFit: objectFit as React.CSSProperties['objectFit'], objectPosition }}
      />

      {/* Admin controls — positioned relative to parent container */}
      <div className="absolute bottom-2 right-2 z-30 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/70 text-white text-[11px] font-medium hover:bg-[#B8963E] transition-colors disabled:cursor-not-allowed backdrop-blur-sm shadow-lg border border-white/20"
        >
          <Camera size={12} />
          {t('cms.changeImage')}
        </button>

        <button
          type="button"
          onClick={() => setShowControls(!showControls)}
          className={`flex items-center justify-center w-7 h-7 rounded-md text-white transition-colors backdrop-blur-sm shadow-lg border border-white/20 ${
            showControls ? 'bg-[#B8963E]' : 'bg-black/70 hover:bg-[#B8963E]'
          }`}
          title={t('cms.positionAndSize')}
        >
          <Settings2 size={12} />
        </button>

        {hasCmsImage && (
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isUploading}
            className="flex items-center justify-center w-7 h-7 rounded-md bg-black/70 text-white hover:bg-red-600 transition-colors disabled:cursor-not-allowed backdrop-blur-sm shadow-lg border border-white/20"
            title={t('cms.resetDefault')}
          >
            <Trash2 size={12} />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      {/* Position & Fit panel */}
      {showControls && (
        <div
          className="absolute bottom-12 right-2 z-40 bg-white rounded-xl shadow-2xl p-3 pb-2 flex flex-col gap-3 border border-[#E8E4DF]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
          {/* Position sliders */}
          <div className="flex flex-col gap-3 min-w-[120px]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
                  {t('cms.horizontal')}
                </p>
                <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
                  {parsed.x}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={parsed.x}
                onChange={(e) => {
                  const x = Number(e.target.value);
                  void handlePositionChange(`${x}% ${parsed.y}%`);
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
                style={{ accentColor: '#B8963E' }}
              />
              <div className="flex justify-between text-[9px] text-[#AAAAAA] font-['Inter'] mt-0.5">
                <span>←</span>
                <span>→</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
                  {t('cms.vertical')}
                </p>
                <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
                  {parsed.y}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={parsed.y}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  void handlePositionChange(`${parsed.x}% ${y}%`);
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
                style={{ accentColor: '#B8963E' }}
              />
              <div className="flex justify-between text-[9px] text-[#AAAAAA] font-['Inter'] mt-0.5">
                <span>↑</span>
                <span>↓</span>
              </div>
            </div>
          </div>

          {/* Fit options */}
          <div>
            <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5 text-center font-['Inter']">
              {t('cms.size')}
            </p>
            <div className="flex flex-col gap-0.5">
              {FIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => void handleFitChange(opt.value)}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors font-['Inter'] ${
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
          </div>

          {/* Footer inside panel */}
          <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8]">
            <span className={`flex items-center gap-1 text-[10px] font-medium font-['Inter'] transition-opacity duration-300 ${saved ? 'opacity-100 text-green-600' : 'opacity-0'}`}>
              <Check size={10} />
              {t('common.saved')}
            </span>
            <button
              type="button"
              onClick={() => setShowControls(false)}
              className="px-3 py-1 rounded-md text-[11px] font-medium text-white bg-[#B8963E] hover:bg-[#8A6F2E] transition-colors font-['Inter']"
            >
              {t('common.done')}
            </button>
          </div>
        </div>
      )}

      {/* Upload spinner */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-30">
          <span className="block h-8 w-8 rounded-full border-2 border-[#B8963E]/30 border-t-[#B8963E] animate-spin" />
        </div>
      )}
    </>
  );
}

export default EditableImage;
