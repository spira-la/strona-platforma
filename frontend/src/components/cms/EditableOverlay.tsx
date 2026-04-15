import { useCallback, useEffect, useRef, useState } from 'react';
import { Droplet, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSSectionKey } from '@/types/cms.types';

interface EditableOverlayProps {
  section: CMSSectionKey;
  /**
   * Base field name shared with the image / background this overlay
   * sits on top of. Two sibling CMS fields are persisted:
   *   `{fieldPath}OverlayTop`    — opacity (0–100) at the top
   *   `{fieldPath}OverlayBottom` — opacity (0–100) at the bottom
   */
  fieldPath: string;
  /** Defaults when no CMS value is set. Matches the previous hard-coded hero gradient. */
  defaultTop?: number;
  defaultBottom?: number;
  /** RGB triplet for the overlay color (e.g. '0,0,0' or '20,16,10'). Default: pure black. */
  color?: string;
  /**
   * CSS gradient direction. `'to top'` makes `bottom` the 0% stop (darker at the
   * bottom). `'to bottom'` flips it. Diagonal strings like `'135deg'` also work
   * — in that case `top` is the ending stop and `bottom` is the starting stop.
   */
  direction?: string;
  className?: string;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function parseOpacity(value: string, fallback: number): number {
  if (!value || value.trim() === '') return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? clamp(n) : fallback;
}

export function EditableOverlay({
  section,
  fieldPath,
  defaultTop = 60,
  defaultBottom = 80,
  color = '0,0,0',
  direction = 'to top',
  className,
}: EditableOverlayProps) {
  const { isEditMode, getFieldValue, updateField } = useCMS();
  const { t } = useTranslation();

  const topField = `${fieldPath}OverlayTop`;
  const bottomField = `${fieldPath}OverlayBottom`;

  const topRaw = getFieldValue(section, topField);
  const bottomRaw = getFieldValue(section, bottomField);
  const top = parseOpacity(topRaw === topField ? '' : topRaw, defaultTop);
  const bottom = parseOpacity(
    bottomRaw === bottomField ? '' : bottomRaw,
    defaultBottom,
  );

  const [showControls, setShowControls] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

  const flashSaved = useCallback(() => {
    setSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
  }, []);

  const persist = useCallback(
    async (field: string, opacity: number) => {
      await updateField(section, field, String(opacity));
      flashSaved();
    },
    [section, updateField, flashSaved],
  );

  const gradient = `linear-gradient(${direction}, rgba(${color},${bottom / 100}) 0%, rgba(${color},${top / 100}) 100%)`;

  return (
    <>
      <div
        className={`absolute inset-0 ${className ?? ''}`}
        style={{ background: gradient }}
        aria-hidden="true"
      />

      {isEditMode && (
        <>
          <button
            type="button"
            onClick={() => setShowControls((s) => !s)}
            className={`absolute bottom-3 right-[172px] z-30 flex items-center justify-center w-7 h-7 rounded-md text-white transition-colors backdrop-blur-sm shadow-lg border border-white/20 ${
              showControls ? 'bg-[#B8963E]' : 'bg-black/70 hover:bg-[#B8963E]'
            }`}
            title={t('cms.overlay')}
            aria-label={t('cms.overlay')}
          >
            <Droplet size={12} />
          </button>

          {showControls && (
            <div
              className="absolute bottom-12 right-[172px] z-40 bg-white rounded-xl shadow-2xl p-3 pb-2 flex flex-col gap-3 border border-[#E8E4DF] min-w-[200px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
                      {t('cms.overlayTop')}
                    </p>
                    <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
                      {top}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={top}
                    onChange={(e) =>
                      void persist(topField, Number(e.target.value))
                    }
                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
                    style={{ accentColor: '#B8963E' }}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
                      {t('cms.overlayBottom')}
                    </p>
                    <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
                      {bottom}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={bottom}
                    onChange={(e) =>
                      void persist(bottomField, Number(e.target.value))
                    }
                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
                    style={{ accentColor: '#B8963E' }}
                  />
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
                  onClick={() => {
                    void persist(topField, defaultTop);
                    void persist(bottomField, defaultBottom);
                  }}
                  className="px-2 py-1 rounded-md text-[10px] font-medium text-[#6B6B6B] hover:text-[#B8963E] transition-colors font-['Inter']"
                >
                  {t('cms.resetDefault')}
                </button>
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
        </>
      )}
    </>
  );
}

export default EditableOverlay;
