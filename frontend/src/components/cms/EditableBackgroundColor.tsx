import { useCallback, useEffect, useRef, useState } from 'react';
import { Paintbrush, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSSectionKey } from '@/types/cms.types';

interface EditableBackgroundColorProps {
  section: CMSSectionKey;
  /**
   * Base field name for the section this solid background sits behind.
   * Persisted as the sibling CMS field `{fieldPath}BgColor`.
   */
  fieldPath: string;
  /** Hex fallback used when no CMS value is set, e.g. "#1F2A1D". */
  defaultColor: string;
  className?: string;
}

/** Accepts #RGB, #RRGGBB or #RRGGBBAA (case-insensitive). */
const HEX_COLOR_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function isValidHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim());
}

export function EditableBackgroundColor({
  section,
  fieldPath,
  defaultColor,
  className,
}: EditableBackgroundColorProps) {
  const { isEditMode, getFieldValue, updateField } = useCMS();
  const { t } = useTranslation();

  const colorField = `${fieldPath}BgColor`;

  const colorRaw = getFieldValue(section, colorField);
  // getFieldValue echoes back the fieldPath itself when the field was
  // never saved — guard against that before validating/using the value.
  const savedColor = colorRaw === colorField ? '' : colorRaw.trim();
  const color =
    savedColor && isValidHexColor(savedColor) ? savedColor : defaultColor;

  const [showControls, setShowControls] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

  const flashSaved = useCallback(() => {
    setSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
  }, []);

  const handleChange = useCallback(
    async (value: string) => {
      await updateField(section, colorField, value);
      flashSaved();
    },
    [section, colorField, updateField, flashSaved],
  );

  const handleReset = useCallback(async () => {
    await updateField(section, colorField, '');
    flashSaved();
  }, [section, colorField, updateField, flashSaved]);

  return (
    <>
      <div
        className={`absolute inset-0 ${className ?? ''}`}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />

      {isEditMode && (
        <>
          <button
            type="button"
            onClick={() => setShowControls((s) => !s)}
            className={`absolute bottom-3 right-3 z-30 flex items-center justify-center w-7 h-7 rounded-md text-white transition-colors backdrop-blur-sm shadow-lg border border-white/20 ${
              showControls ? 'bg-[#B8963E]' : 'bg-black/70 hover:bg-[#B8963E]'
            }`}
            title={t('cms.backgroundColor', { defaultValue: 'Kolor tła' })}
            aria-label={t('cms.backgroundColor', { defaultValue: 'Kolor tła' })}
          >
            <Paintbrush size={12} />
          </button>

          {showControls && (
            <div
              className="absolute bottom-12 right-3 z-40 bg-white rounded-xl shadow-2xl p-3 flex flex-col gap-3 border border-[#E8E4DF] min-w-[180px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
                  {t('cms.backgroundColor', { defaultValue: 'Kolor tła' })}
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={isValidHexColor(color) ? color : defaultColor}
                    onChange={(e) => void handleChange(e.target.value)}
                    className="w-7 h-7 rounded border border-[#E8E4DF] cursor-pointer bg-white p-0"
                    title={t('cms.pickColor', {
                      defaultValue: 'Wybierz kolor',
                    })}
                  />
                  <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium uppercase">
                    {color}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8]">
                <span
                  className={`flex items-center gap-1 text-[10px] font-medium font-['Inter'] transition-opacity duration-300 ${saved ? 'opacity-100 text-green-600' : 'opacity-0'}`}
                >
                  <Check size={10} />
                  {t('common.saved')}
                </span>
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  className="px-2 py-1 rounded-md text-[10px] font-medium text-[#6B6B6B] hover:text-[#B8963E] transition-colors font-['Inter']"
                >
                  ✕ {t('cms.resetDefault')}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default EditableBackgroundColor;
