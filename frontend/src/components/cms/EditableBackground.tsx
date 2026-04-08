import { useCallback, useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { Camera, Trash2, Settings2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cmsClient } from '@/clients/cms.client';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSLanguage, CMSSectionKey } from '@/types/cms.types';

const FIT_OPTIONS = [
  { label: 'Cover', value: 'cover' },
  { label: 'Contain', value: 'contain' },
  { label: 'Fill', value: '100% 100%' },
] as const;

/** Parse "50% 30%" into { x: 50, y: 30 }, defaults to 50/50 */
function parsePosition(pos: string): { x: number; y: number } {
  const match = pos.match(/(\d+)%\s+(\d+)%/);
  if (match) return { x: Number(match[1]), y: Number(match[2]) };
  // Handle named positions
  const xMap: Record<string, number> = { left: 0, center: 50, right: 100 };
  const yMap: Record<string, number> = { top: 0, center: 50, bottom: 100 };
  const parts = pos.split(/\s+/);
  return {
    x: xMap[parts[0]] ?? 50,
    y: yMap[parts[1]] ?? 50,
  };
}

interface EditableBackgroundProps {
  section: CMSSectionKey;
  fieldPath: string;
  fallbackSrc: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  role?: string;
  'aria-label'?: string;
  'aria-hidden'?: boolean;
}

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
  const { t, i18n } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  // Position (stored as separate CMS field)
  const posField = `${fieldPath}Pos`;
  const posValue = getFieldValue(section, posField);
  const bgPosition = (posValue !== posField && posValue.trim() !== '') ? posValue : 'center center';

  // Size/fit (stored as separate CMS field)
  const fitField = `${fieldPath}Fit`;
  const fitValue = getFieldValue(section, fitField);
  const bgSize = (fitValue !== fitField && fitValue.trim() !== '') ? fitValue : 'cover';

  const currentLanguage = i18n.language as CMSLanguage;

  const bgStyle: CSSProperties = {
    backgroundImage: `url(${displaySrc})`,
    backgroundSize: bgSize,
    backgroundPosition: bgPosition,
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

  // View mode
  if (!isEditMode) {
    return (
      <div className={className} style={bgStyle} {...rest}>
        {children}
      </div>
    );
  }

  // Edit mode — controls inside the bg div so overflow-hidden doesn't clip them
  return (
    <div className={className} style={bgStyle} {...rest}>
      {children}

      {/* Admin controls — bottom-right */}
      <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5">
        {/* Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-black/70 text-white text-[11px] font-medium hover:bg-[#B8963E] transition-colors disabled:cursor-not-allowed backdrop-blur-sm shadow-lg border border-white/20"
        >
          <Camera size={12} />
          {t('cms.changeBackground')}
        </button>

        {/* Position & Fit toggle */}
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

        {/* Reset */}
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
          className="absolute bottom-12 right-3 z-40 bg-white rounded-xl shadow-2xl p-3 pb-2 flex flex-col gap-3 border border-[#E8E4DF]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-4">
          {/* Position sliders */}
          <div className="flex flex-col gap-3 min-w-[120px]">
            {/* Horizontal */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
                  {t('cms.horizontal')}
                </p>
                <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
                  {parsePosition(bgPosition).x}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={parsePosition(bgPosition).x}
                onChange={(e) => {
                  const x = Number(e.target.value);
                  const y = parsePosition(bgPosition).y;
                  void handlePositionChange(`${x}% ${y}%`);
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-[#B8963E] cursor-pointer"
                style={{ accentColor: '#B8963E' }}
              />
              <div className="flex justify-between text-[9px] text-[#AAAAAA] font-['Inter'] mt-0.5">
                <span>←</span>
                <span>→</span>
              </div>
            </div>
            {/* Vertical */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
                  {t('cms.vertical')}
                </p>
                <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
                  {parsePosition(bgPosition).y}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={parsePosition(bgPosition).y}
                onChange={(e) => {
                  const y = Number(e.target.value);
                  const x = parsePosition(bgPosition).x;
                  void handlePositionChange(`${x}% ${y}%`);
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 accent-[#B8963E] cursor-pointer"
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
                    bgSize === opt.value
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <span className="block h-8 w-8 rounded-full border-2 border-[#B8963E]/30 border-t-[#B8963E] animate-spin" />
        </div>
      )}
    </div>
  );
}

export default EditableBackground;
