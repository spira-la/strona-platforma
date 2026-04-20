import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCMS } from '@/contexts/CMSContext';
import type { EditableTextProps } from '@/types/cms.types';

// ---------------------------------------------------------------------------
// CMS Focus Lock — only one EditableText active at a time
// ---------------------------------------------------------------------------

interface CMSFocusContextValue {
  activeId: string | null;
  claim: (id: string) => void;
  release: (id: string) => void;
}

const CMSFocusContext = createContext<CMSFocusContextValue>({
  activeId: null,
  claim: () => {},
  release: () => {},
});

export function CMSFocusProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const claim = useCallback((id: string) => setActiveId(id), []);
  const release = useCallback(
    (id: string) => setActiveId((prev) => (prev === id ? null : prev)),
    [],
  );
  return (
    <CMSFocusContext.Provider value={{ activeId, claim, release }}>
      {children}
    </CMSFocusContext.Provider>
  );
}

function useCMSFocus() {
  return useContext(CMSFocusContext);
}

// ---------------------------------------------------------------------------
// Style helpers — sibling CMS fields of the form `{fieldPath}{Suffix}`
// ---------------------------------------------------------------------------

type Align = 'left' | 'center' | 'right' | 'justify';

interface TextStyleState {
  bold: boolean;
  italic: boolean;
  multiline: boolean;
  align: Align | '';
  size: number; // multiplier relative to the base CSS font-size (1 = inherit)
  color: string; // hex or empty string
  maxWidth: number; // 0 = no constraint, otherwise pixels
  maxHeight: number; // 0 = no constraint, otherwise pixels
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function parseStyle(
  read: (field: string) => string,
  fieldPath: string,
): TextStyleState {
  const raw = (suffix: string): string => {
    const v = read(`${fieldPath}${suffix}`);
    return v === `${fieldPath}${suffix}` ? '' : v;
  };
  const sizeRaw = raw('Size');
  const parsed = Number.parseFloat(sizeRaw);
  const mwRaw = Number.parseFloat(raw('MaxWidth'));
  const mhRaw = Number.parseFloat(raw('MaxHeight'));
  return {
    bold: raw('Bold') === '1',
    italic: raw('Italic') === '1',
    multiline: raw('Multiline') === '1',
    align: (raw('Align') as Align) || '',
    size: Number.isFinite(parsed) && parsed > 0 ? clamp(parsed, 0.5, 5) : 1,
    color: raw('Color'),
    maxWidth: Number.isFinite(mwRaw) && mwRaw > 0 ? mwRaw : 0,
    maxHeight: Number.isFinite(mhRaw) && mhRaw > 0 ? mhRaw : 0,
  };
}

export function toCssStyle(s: TextStyleState): React.CSSProperties {
  const style: React.CSSProperties = {};
  if (s.bold) style.fontWeight = 700;
  if (s.italic) style.fontStyle = 'italic';
  if (s.multiline) style.whiteSpace = 'pre-wrap';
  if (s.align) style.textAlign = s.align;
  if (s.size !== 1) style.fontSize = `${s.size}em`;
  if (s.color) style.color = s.color;
  if (s.maxWidth > 0) style.maxWidth = `${s.maxWidth}px`;
  if (s.maxHeight > 0) {
    style.maxHeight = `${s.maxHeight}px`;
    style.overflow = 'auto';
  }
  return style;
}

// ---------------------------------------------------------------------------
// Format popover — admin-only
// ---------------------------------------------------------------------------

interface FormatPopoverProps {
  style: TextStyleState;
  computedColor: string;
  onPatch: (patch: Partial<TextStyleState>) => void;
  onReset: () => void;
  onClose: () => void;
}

const FORMAT_LABELS: Record<string, Record<string, string>> = {
  size: { pl: 'Rozmiar', en: 'Size', es: 'Tamaño' },
  maxWidth: { pl: 'Maks. szerokość', en: 'Max width', es: 'Ancho máximo' },
  maxHeight: { pl: 'Maks. wysokość', en: 'Max height', es: 'Alto máximo' },
  color: { pl: 'Kolor', en: 'Color', es: 'Color' },
  multiline: { pl: 'Wieloliniowy', en: 'Multiline', es: 'Multilínea' },
  multilineOn: {
    pl: 'Entery aktywne',
    en: 'Line breaks on',
    es: 'Saltos activos',
  },
  multilineOff: {
    pl: 'Entery wyłączone',
    en: 'Line breaks off',
    es: 'Saltos inactivos',
  },
  bold: { pl: 'Pogrubienie', en: 'Bold', es: 'Negrita' },
  italic: { pl: 'Kursywa', en: 'Italic', es: 'Cursiva' },
  alignLeft: { pl: 'Do lewej', en: 'Align left', es: 'Alinear izquierda' },
  alignCenter: { pl: 'Wyśrodkuj', en: 'Align center', es: 'Centrar' },
  alignRight: { pl: 'Do prawej', en: 'Align right', es: 'Alinear derecha' },
  alignJustify: { pl: 'Wyjustuj', en: 'Justify', es: 'Justificar' },
  pickColor: { pl: 'Wybierz kolor', en: 'Pick color', es: 'Elegir color' },
  defaultColor: {
    pl: 'Domyślny kolor',
    en: 'Default color',
    es: 'Color por defecto',
  },
  reset: { pl: 'Resetuj', en: 'Reset', es: 'Restablecer' },
  done: { pl: 'Gotowe', en: 'Done', es: 'Listo' },
  auto: { pl: 'auto', en: 'auto', es: 'auto' },
};

function l(key: string, lang: string): string {
  return FORMAT_LABELS[key]?.[lang] ?? FORMAT_LABELS[key]?.['en'] ?? key;
}

function FormatPopover({
  style,
  computedColor,
  onPatch,
  onReset,
  onClose,
}: FormatPopoverProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) ?? 'pl';

  const alignOptions: {
    value: Align;
    Icon: React.ElementType;
    labelKey: string;
  }[] = [
    { value: 'left', Icon: AlignLeft, labelKey: 'alignLeft' },
    { value: 'center', Icon: AlignCenter, labelKey: 'alignCenter' },
    { value: 'right', Icon: AlignRight, labelKey: 'alignRight' },
    { value: 'justify', Icon: AlignJustify, labelKey: 'alignJustify' },
  ];

  return (
    <div
      className="w-[240px] max-h-[calc(100vh-16px)] overflow-y-auto bg-white rounded-xl shadow-2xl border border-[#E8E4DF] p-3 flex flex-col gap-2.5"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Inline toggles: B, I, align */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-pressed={style.bold}
          onClick={() => onPatch({ bold: !style.bold })}
          className={`w-7 h-7 flex items-center justify-center rounded text-[12px] font-bold transition-colors ${
            style.bold
              ? 'bg-[#B8963E] text-white'
              : 'bg-gray-100 text-[#6B6B6B] hover:bg-gray-200'
          }`}
          title={l('bold', lang)}
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          aria-pressed={style.italic}
          onClick={() => onPatch({ italic: !style.italic })}
          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
            style.italic
              ? 'bg-[#B8963E] text-white'
              : 'bg-gray-100 text-[#6B6B6B] hover:bg-gray-200'
          }`}
          title={l('italic', lang)}
        >
          <Italic size={13} />
        </button>
        <span className="mx-1 w-px h-5 bg-[#E8E4DF]" aria-hidden="true" />
        {alignOptions.map(({ value, Icon, labelKey }) => (
          <button
            key={value}
            type="button"
            aria-pressed={style.align === value}
            onClick={() =>
              onPatch({ align: style.align === value ? '' : value })
            }
            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
              style.align === value
                ? 'bg-[#B8963E] text-white'
                : 'bg-gray-100 text-[#6B6B6B] hover:bg-gray-200'
            }`}
            title={l(labelKey, lang)}
          >
            <Icon size={13} />
          </button>
        ))}
      </div>

      {/* Size slider */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
            {l('size', lang)}
          </p>
          <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
            {Math.round(style.size * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={50}
          max={500}
          step={5}
          value={Math.round(style.size * 100)}
          onChange={(e) => onPatch({ size: Number(e.target.value) / 100 })}
          className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
          style={{ accentColor: '#B8963E' }}
        />
      </div>

      {/* Max width */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
            {l('maxWidth', lang)}
          </p>
          <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
            {style.maxWidth > 0 ? `${style.maxWidth}px` : l('auto', lang)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1200}
          step={20}
          value={style.maxWidth}
          onChange={(e) => onPatch({ maxWidth: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
          style={{ accentColor: '#B8963E' }}
        />
      </div>

      {/* Max height */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
            {l('maxHeight', lang)}
          </p>
          <span className="text-[10px] text-[#8A8A8A] font-['Inter'] font-medium">
            {style.maxHeight > 0 ? `${style.maxHeight}px` : l('auto', lang)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={800}
          step={10}
          value={style.maxHeight}
          onChange={(e) => onPatch({ maxHeight: Number(e.target.value) })}
          className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer"
          style={{ accentColor: '#B8963E' }}
        />
      </div>

      {/* Color picker */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
          {l('color', lang)}
        </p>
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={style.color || computedColor || '#2D2D2D'}
            onChange={(e) => onPatch({ color: e.target.value })}
            className="w-7 h-7 rounded border border-[#E8E4DF] cursor-pointer bg-white p-0"
            title={l('pickColor', lang)}
          />
          {style.color && (
            <button
              type="button"
              onClick={() => onPatch({ color: '' })}
              className="px-1.5 py-0.5 text-[10px] text-[#6B6B6B] hover:text-[#B8963E]"
              title={l('defaultColor', lang)}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Multiline toggle */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider font-['Inter']">
          {l('multiline', lang)}
        </p>
        <button
          type="button"
          onClick={() => onPatch({ multiline: !style.multiline })}
          className={`relative w-9 h-5 rounded-full transition-colors ${
            style.multiline ? 'bg-[#B8963E]' : 'bg-[#E8E4DF]'
          }`}
          title={
            style.multiline ? l('multilineOn', lang) : l('multilineOff', lang)
          }
          aria-pressed={style.multiline}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              style.multiline ? 'translate-x-4' : ''
            }`}
          />
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1.5 border-t border-[#F0EDE8]">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1 text-[10px] font-medium text-[#6B6B6B] hover:text-[#B8963E] transition-colors"
        >
          <RotateCcw size={10} />
          {l('reset', lang)}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded-md text-[11px] font-medium text-white bg-[#B8963E] hover:bg-[#8A6F2E] transition-colors font-['Inter']"
        >
          {l('done', lang)}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditableText
// ---------------------------------------------------------------------------

export function EditableText({
  section,
  fieldPath,
  as: Tag = 'span',
  id,
  className,
  placeholder,
  children,
  richText: _richText = false,
  multiline: _multilineProp,
  render,
}: EditableTextProps) {
  const { isLoading, isEditMode, getFieldValue, updateField, content } =
    useCMS();

  const resolvedValue = getFieldValue(section, fieldPath);
  const hasContent = Object.keys(content).length > 0;

  // Derive a string from the children prop for use as fallback text.
  const childrenText =
    typeof children === 'string'
      ? children
      : React.Children.toArray(children)
          .map((c) => (typeof c === 'string' ? c : ''))
          .join('');

  const focusId = `${section}.${fieldPath}`;
  const { activeId, claim, release } = useCMSFocus();
  const isOtherActive = activeId !== null && activeId !== focusId;

  const [isEditing, setIsEditing] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLElement>(null);
  const [computedColor, setComputedColor] = useState('');

  // Keep the portal-rendered format button pinned to the text element
  // on scroll / resize / layout shifts. Always-on while in edit mode.
  useEffect(() => {
    if (!isEditMode) return;
    const update = () => {
      if (wrapperRef.current) {
        setRect(wrapperRef.current.getBoundingClientRect());
        // Detect actual rendered color from the inner Tag element (not the wrapper)
        const inner =
          wrapperRef.current.firstElementChild ?? wrapperRef.current;
        const raw = getComputedStyle(inner).color;
        const m = raw.match(/\d+/g);
        if (m && m.length >= 3) {
          const hex = `#${Number(m[0]).toString(16).padStart(2, '0')}${Number(m[1]).toString(16).padStart(2, '0')}${Number(m[2]).toString(16).padStart(2, '0')}`;
          setComputedColor(hex);
        }
      }
    };
    update();
    // Occasional re-check catches late layout changes (fonts loading,
    // lazy images, CMS content hydrating) without a ResizeObserver
    // on every element.
    const interval = globalThis.setInterval(update, 1000);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      globalThis.clearInterval(interval);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isEditMode]);

  // Auto-size textarea height and focus when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
      el.focus();
      el.select();
    }
  }, [isEditing]);

  // Sibling-field style
  const textStyle = parseStyle(
    (field) => getFieldValue(section, field),
    fieldPath,
  );

  const patchStyle = useCallback(
    (patch: Partial<TextStyleState>) => {
      const writes: Array<[string, string]> = [];
      if ('bold' in patch)
        writes.push([`${fieldPath}Bold`, patch.bold ? '1' : '']);
      if ('italic' in patch)
        writes.push([`${fieldPath}Italic`, patch.italic ? '1' : '']);
      if ('align' in patch)
        writes.push([`${fieldPath}Align`, patch.align ?? '']);
      if ('size' in patch && typeof patch.size === 'number')
        writes.push([
          `${fieldPath}Size`,
          patch.size === 1 ? '' : String(patch.size),
        ]);
      if ('color' in patch)
        writes.push([`${fieldPath}Color`, patch.color ?? '']);
      if ('maxWidth' in patch && typeof patch.maxWidth === 'number')
        writes.push([
          `${fieldPath}MaxWidth`,
          patch.maxWidth > 0 ? String(patch.maxWidth) : '',
        ]);
      if ('maxHeight' in patch && typeof patch.maxHeight === 'number')
        writes.push([
          `${fieldPath}MaxHeight`,
          patch.maxHeight > 0 ? String(patch.maxHeight) : '',
        ]);
      if ('multiline' in patch)
        writes.push([`${fieldPath}Multiline`, patch.multiline ? '1' : '']);

      void Promise.all(writes.map(([f, v]) => updateField(section, f, v)));
    },
    [fieldPath, section, updateField],
  );

  const resetStyle = useCallback(() => {
    void Promise.all([
      updateField(section, `${fieldPath}Bold`, ''),
      updateField(section, `${fieldPath}Italic`, ''),
      updateField(section, `${fieldPath}Align`, ''),
      updateField(section, `${fieldPath}Size`, ''),
      updateField(section, `${fieldPath}Color`, ''),
      updateField(section, `${fieldPath}MaxWidth`, ''),
      updateField(section, `${fieldPath}MaxHeight`, ''),
      updateField(section, `${fieldPath}Multiline`, ''),
    ]);
  }, [section, fieldPath, updateField]);

  // Claim/release focus lock
  useEffect(() => {
    if (isEditing || showFormat) {
      claim(focusId);
    } else {
      release(focusId);
    }
  }, [isEditing, showFormat, focusId, claim, release]);

  const startEditing = useCallback(() => {
    if (!isEditMode || isOtherActive) return;
    const hasNoValue =
      resolvedValue === fieldPath || resolvedValue.trim() === '';
    const prefill = hasNoValue
      ? (placeholder ?? childrenText ?? '')
      : resolvedValue;
    setDraftValue(prefill);
    setIsEditing(true);
  }, [
    isEditMode,
    isOtherActive,
    resolvedValue,
    fieldPath,
    placeholder,
    childrenText,
  ]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setDraftValue('');
  }, []);

  const saveEditing = useCallback(async () => {
    if (!isEditing) return;
    const trimmed = draftValue.trim();
    // Skip only if saving empty on a never-set field (nothing to persist)
    const isNoOp = trimmed === '' && resolvedValue === fieldPath;
    if (isNoOp) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await updateField(section, fieldPath, trimmed);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [isEditing, draftValue, resolvedValue, fieldPath, section, updateField]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        void saveEditing();
      }
    },
    [cancelEditing, saveEditing],
  );

  // During initial load with no cache and no fallback — return null to avoid layout shift.
  const hasFallback = !!(placeholder || children);
  if (isLoading && !hasContent && !hasFallback) {
    return null;
  }

  // Auto-add w-full for block tags inside flex parents
  const BLOCK_TAGS = new Set([
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'div',
    'blockquote',
    'li',
  ]);
  const needsFullWidth = BLOCK_TAGS.has(Tag as string);
  const hasExplicitWidth = className
    ? /(?:^|\s)w-(?:\[|full|screen|auto|\d)/.test(className)
    : false;
  const resolvedClassName =
    needsFullWidth && !hasExplicitWidth
      ? `w-full ${className ?? ''}`
      : className;

  const fallback = placeholder ?? (childrenText || undefined) ?? resolvedValue;
  const hasNoContent =
    resolvedValue === fieldPath || resolvedValue.trim() === '';
  const displayContent = hasNoContent ? fallback : resolvedValue;

  const inlineStyle = toCssStyle(textStyle);

  // Auto-detect newlines: always render them even if the Multiline flag
  // wasn't explicitly toggled in the format popover.
  if (displayContent.includes('\n') && !inlineStyle.whiteSpace) {
    inlineStyle.whiteSpace = 'pre-wrap';
  }

  // -------------------------------------------------------------------------
  // Edit mode — active textarea
  // -------------------------------------------------------------------------
  if (isEditMode && isEditing) {
    const EditWrap = needsFullWidth ? 'div' : 'span';
    return (
      <EditWrap
        className={`relative ${needsFullWidth ? 'block w-full' : 'inline-block'} ring-2 ring-[#B8963E]/30 rounded-md ${className ?? ''}`}
        onClick={(e) => e.preventDefault()}
      >
        <textarea
          ref={textareaRef}
          value={draftValue}
          onChange={(e) => {
            setDraftValue(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyDown}
          className="w-full resize-none overflow-hidden rounded border border-[#B8963E] bg-white px-2 py-1 font-sans text-sm text-[#2D2D2D] leading-normal shadow-sm outline-none focus:ring-2 focus:ring-[#B8963E]/50"
          rows={1}
          aria-label={`Edit ${section}.${fieldPath}`}
        />
        <span className="flex items-center justify-between mt-1">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setDraftValue('');
            }}
            className="rounded px-2 py-0.5 text-[11px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Clear to show default text"
          >
            Reset
          </button>
          <span className="flex items-center gap-2">
            {isSaving && (
              <span className="text-[10px] text-[#B8963E]">saving...</span>
            )}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                cancelEditing();
              }}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-[#6B6B6B] bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                void saveEditing();
              }}
              className="rounded px-2 py-0.5 text-[11px] font-medium text-white bg-[#B8963E] hover:bg-[#8A6F2E] transition-colors"
            >
              Save
            </button>
          </span>
        </span>
      </EditWrap>
    );
  }

  // -------------------------------------------------------------------------
  // Edit mode — hoverable with format button
  // -------------------------------------------------------------------------
  if (isEditMode) {
    // Floating UI rendered into document.body so it escapes any
    // `overflow: hidden` ancestor (chips, rounded pills, sections with
    // clipping). Positioned with `fixed` coordinates from the wrapper's
    // bounding rect.
    const portalTarget = typeof document === 'undefined' ? null : document.body;

    // Clamp floating UI within viewport bounds
    const vw = globalThis.window === undefined ? 1440 : window.innerWidth;
    const vh = globalThis.window === undefined ? 900 : window.innerHeight;

    const floatingUi =
      portalTarget && rect && !isOtherActive
        ? createPortal(
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFormat((v) => !v);
                }}
                className={`fixed z-[9999] w-6 h-6 flex items-center justify-center rounded-full shadow-lg border border-white/20 backdrop-blur-sm transition-colors ${
                  showFormat
                    ? 'bg-[#B8963E] text-white'
                    : 'bg-black/70 text-white hover:bg-[#B8963E]'
                }`}
                style={{
                  top: rect.top - 28 < 4 ? rect.bottom + 4 : rect.top - 28,
                  left: Math.min(rect.right - 24, vw - 32),
                }}
                title="Format text"
                aria-label="Format text"
              >
                <Type size={12} />
              </button>

              {showFormat && (
                <div
                  className="fixed z-[9999]"
                  style={{
                    top:
                      rect.bottom + 4 + 360 > vh
                        ? Math.max(4, rect.bottom - 360)
                        : rect.bottom + 4,
                    left: Math.max(8, Math.min(rect.left, vw - 252)),
                  }}
                >
                  <FormatPopover
                    style={textStyle}
                    computedColor={computedColor}
                    onPatch={patchStyle}
                    onReset={resetStyle}
                    onClose={() => setShowFormat(false)}
                  />
                </div>
              )}
            </>,
            portalTarget,
          )
        : null;

    return (
      <>
        {React.createElement(
          Tag,
          {
            ref: wrapperRef as React.RefObject<never>,
            id,
            style: inlineStyle,
            className: `relative rounded transition-[outline,box-shadow,opacity] outline outline-1 ${
              isOtherActive
                ? 'outline-transparent opacity-40 pointer-events-none'
                : 'outline-transparent cursor-pointer hover:outline-[#B8963E]/70 hover:shadow-[0_0_0_3px_rgba(184,150,62,0.12)]'
            } ${resolvedClassName ?? ''}`,
            onClick: (e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              startEditing();
            },
            title: `Edit: ${section} → ${fieldPath}`,
            role: 'button',
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                startEditing();
              }
            },
          },
          render ? render(displayContent) : displayContent,
        )}
        {floatingUi}
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Read-only mode
  // -------------------------------------------------------------------------
  if (render) {
    return React.createElement(
      Tag,
      { id, style: inlineStyle, className: resolvedClassName },
      render(displayContent),
    );
  }

  return React.createElement(
    Tag,
    { id, style: inlineStyle, className: resolvedClassName },
    displayContent,
  );
}

export default EditableText;
