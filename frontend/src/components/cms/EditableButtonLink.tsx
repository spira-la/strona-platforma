import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Link2,
  MessageCircle,
  House,
  ExternalLink,
  Mail,
  Phone,
  Info,
  RotateCcw,
} from 'lucide-react';

function FacebookIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
import { useCMS } from '@/contexts/CMSContext';
import type { CMSSectionKey } from '@/types/cms.types';

// ---------------------------------------------------------------------------
// Action model
// ---------------------------------------------------------------------------

export type ButtonActionType =
  | 'whatsapp'
  | 'internal'
  | 'facebook'
  | 'instagram'
  | 'email'
  | 'tel'
  | 'external';

export interface ButtonAction {
  type: ButtonActionType;
  value: string;
}

const ACTION_FIELD_SUFFIX = 'Action';

const VALID_TYPES = new Set<ButtonActionType>([
  'whatsapp',
  'internal',
  'facebook',
  'instagram',
  'email',
  'tel',
  'external',
]);

function serialize(action: ButtonAction): string {
  return action.value ? `${action.type}:${action.value}` : action.type;
}

function parse(raw: string): ButtonAction | null {
  if (!raw || raw.trim() === '') return null;
  const idx = raw.indexOf(':');
  if (idx === -1) {
    const type = raw.trim() as ButtonActionType;
    return VALID_TYPES.has(type) ? { type, value: '' } : null;
  }
  const type = raw.slice(0, idx).trim() as ButtonActionType;
  const value = raw.slice(idx + 1).trim();
  return VALID_TYPES.has(type) ? { type, value } : null;
}

function resolveHref(
  action: ButtonAction,
  phone: string,
): { href: string; target: string; rel: string } {
  switch (action.type) {
    case 'whatsapp': {
      const digits = (action.value || phone).replaceAll(/\D/g, '');
      return {
        href: `https://wa.me/${digits}`,
        target: '_blank',
        rel: 'noopener noreferrer',
      };
    }
    case 'internal': {
      return { href: action.value || '/', target: '_self', rel: '' };
    }
    case 'email': {
      return { href: `mailto:${action.value}`, target: '_self', rel: '' };
    }
    case 'tel': {
      const cleaned = (action.value || phone).replaceAll(/[^\d+]/g, '');
      return { href: `tel:${cleaned}`, target: '_self', rel: '' };
    }
    case 'facebook':
    case 'instagram':
    case 'external': {
      return {
        href: action.value || '#',
        target: '_blank',
        rel: 'noopener noreferrer',
      };
    }
    default: {
      return { href: '#', target: '_self', rel: '' };
    }
  }
}

// ---------------------------------------------------------------------------
// Type options config
// ---------------------------------------------------------------------------

interface TypeOption {
  type: ButtonActionType;
  label: string;
  Icon: React.ElementType;
  needsValue: boolean;
  inputType: 'none' | 'pages' | 'url' | 'email' | 'tel';
  inputLabel: string;
  inputPlaceholder: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    Icon: MessageCircle,
    needsValue: false,
    inputType: 'none',
    inputLabel: '',
    inputPlaceholder: '',
  },
  {
    type: 'internal',
    label: 'Strona wewnętrzna',
    Icon: House,
    needsValue: true,
    inputType: 'pages',
    inputLabel: 'Strona docelowa',
    inputPlaceholder: '',
  },
  {
    type: 'external',
    label: 'Zewnętrzny link',
    Icon: ExternalLink,
    needsValue: true,
    inputType: 'url',
    inputLabel: 'Adres URL',
    inputPlaceholder: 'https://...',
  },
  {
    type: 'email',
    label: 'E-mail',
    Icon: Mail,
    needsValue: true,
    inputType: 'email',
    inputLabel: 'Adres e-mail',
    inputPlaceholder: 'kontakt@example.com',
  },
  {
    type: 'tel',
    label: 'Telefon',
    Icon: Phone,
    needsValue: false,
    inputType: 'none',
    inputLabel: '',
    inputPlaceholder: '',
  },
  {
    type: 'facebook',
    label: 'Facebook',
    Icon: FacebookIcon,
    needsValue: true,
    inputType: 'url',
    inputLabel: 'Link do Facebook',
    inputPlaceholder: 'https://facebook.com/...',
  },
  {
    type: 'instagram',
    label: 'Instagram',
    Icon: InstagramIcon,
    needsValue: true,
    inputType: 'url',
    inputLabel: 'Link do Instagram',
    inputPlaceholder: 'https://instagram.com/...',
  },
];

const INTERNAL_PAGES = [
  { href: '/', label: 'Strona główna' },
  { href: '/o-mnie', label: 'O mnie' },
  { href: '/jak-pracuje', label: 'Jak pracuję' },
  { href: '/uslugi', label: 'Usługi' },
  { href: '/blog', label: 'Blog' },
  { href: '/kontakt', label: 'Kontakt' },
  { href: '/tworzenie-stron', label: 'Tworzenie stron' },
  { href: '/wideo', label: 'Wideo' },
];

// ---------------------------------------------------------------------------
// Flat option list — one key per selectable destination
// ---------------------------------------------------------------------------

interface FlatOption {
  key: string;
  label: string;
  action: ButtonAction;
  needsInput: boolean;
  inputLabel: string;
  inputPlaceholder: string;
  inputKind: 'url' | 'email' | 'tel' | 'none';
  Icon: React.ElementType;
}

const FLAT_OPTIONS: FlatOption[] = [
  // ── Social / messaging ──────────────────────────────────────────────────
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    action: { type: 'whatsapp', value: '' },
    needsInput: false,
    inputLabel: '',
    inputPlaceholder: '',
    inputKind: 'none',
    Icon: MessageCircle,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    action: { type: 'facebook', value: '' },
    needsInput: true,
    inputLabel: 'Link do strony Facebook',
    inputPlaceholder: 'https://facebook.com/twoja-strona',
    inputKind: 'url',
    Icon: FacebookIcon,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    action: { type: 'instagram', value: '' },
    needsInput: true,
    inputLabel: 'Link do profilu Instagram',
    inputPlaceholder: 'https://instagram.com/twoj-profil',
    inputKind: 'url',
    Icon: InstagramIcon,
  },
  // ── Internal pages ───────────────────────────────────────────────────────
  ...INTERNAL_PAGES.map((p) => ({
    key: p.href,
    label: p.label,
    action: { type: 'internal' as ButtonActionType, value: p.href },
    needsInput: false,
    inputLabel: '',
    inputPlaceholder: '',
    inputKind: 'none' as const,
    Icon: House,
  })),
  // ── Other ────────────────────────────────────────────────────────────────
  {
    key: 'external',
    label: 'Inny adres URL',
    action: { type: 'external', value: '' },
    needsInput: true,
    inputLabel: 'Adres URL',
    inputPlaceholder: 'https://...',
    inputKind: 'url',
    Icon: ExternalLink,
  },
  {
    key: 'email',
    label: 'E-mail',
    action: { type: 'email', value: '' },
    needsInput: true,
    inputLabel: 'Adres e-mail',
    inputPlaceholder: 'kontakt@example.com',
    inputKind: 'email',
    Icon: Mail,
  },
  {
    key: 'tel',
    label: 'Połączenie telefoniczne',
    action: { type: 'tel', value: '' },
    needsInput: false,
    inputLabel: '',
    inputPlaceholder: '',
    inputKind: 'none',
    Icon: Phone,
  },
];

/** Derive the flat select key from a saved ButtonAction. */
function actionToKey(action: ButtonAction): string {
  if (action.type === 'internal') return action.value || '/';
  return action.type;
}

// ---------------------------------------------------------------------------
// ActionPicker — single selector
// ---------------------------------------------------------------------------

interface ActionPickerProps {
  current: ButtonAction;
  phone: string;
  isModified: boolean;
  onSave: (action: ButtonAction) => void;
  onReset: () => void;
  onClose: () => void;
}

function ActionPicker({
  current,
  phone,
  isModified,
  onSave,
  onReset,
  onClose,
}: ActionPickerProps) {
  const [key, setKey] = useState<string>(actionToKey(current));
  const [inputValue, setInputValue] = useState<string>(
    current.type === 'internal' ? '' : current.value,
  );

  const opt = FLAT_OPTIONS.find((o) => o.key === key) ?? FLAT_OPTIONS[0];

  function handleKeyChange(newKey: string) {
    setKey(newKey);
    // Reset input when switching to a key that doesn't need one
    const newOpt = FLAT_OPTIONS.find((o) => o.key === newKey);
    if (!newOpt?.needsInput) setInputValue('');
  }

  function handleSave() {
    const action: ButtonAction = {
      ...opt.action,
      value: opt.needsInput ? inputValue.trim() : '',
    };
    onSave(action);
  }

  const OptionIcon = opt.Icon;
  const isPhoneAuto =
    opt.action.type === 'whatsapp' || opt.action.type === 'tel';

  return (
    <div
      className="w-[300px] bg-white rounded-xl shadow-2xl border border-[#E8E4DF] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#F0EDE8]">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#B8944A] font-['Lato']">
          Akcja przycisku
        </p>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Single destination selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide font-['Lato']">
            Gdzie ma prowadzić ten przycisk?
          </label>
          <div className="relative">
            <OptionIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B8944A] pointer-events-none"
            />
            <select
              value={key}
              onChange={(e) => handleKeyChange(e.target.value)}
              className="w-full appearance-none pl-9 pr-8 py-2.5 rounded-lg border border-[#E0DBD5] text-[13px] text-[#2D2D2D] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent cursor-pointer font-['Lato']"
            >
              <optgroup label="Wiadomości">
                {FLAT_OPTIONS.filter((o) =>
                  ['whatsapp', 'facebook', 'instagram'].includes(o.key),
                ).map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Strony serwisu">
                {FLAT_OPTIONS.filter((o) => o.action.type === 'internal').map(
                  (o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ),
                )}
              </optgroup>
              <optgroup label="Inne">
                {FLAT_OPTIONS.filter((o) =>
                  ['external', 'email', 'tel'].includes(o.key),
                ).map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            </select>
            <svg
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A9390] pointer-events-none"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Phone auto-info */}
        {isPhoneAuto && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[#FAF8F5] rounded-lg border border-[#F0EDE8]">
            <Info size={13} className="text-[#B8944A] mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-[#6B6B6B] leading-relaxed font-['Lato']">
              Numer:{' '}
              <strong className="text-[#2D2D2D]">
                {phone || '+48 000 000 000'}
              </strong>
              <br />
              <span className="text-[11px] text-[#9A9390]">
                Zmień w: Kontakt → Telefon
              </span>
            </p>
          </div>
        )}

        {/* URL / email input — only when needed */}
        {opt.needsInput && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-medium text-[#6B6B6B] uppercase tracking-wide font-['Lato']">
              {opt.inputLabel}
            </label>
            <input
              type={opt.inputKind === 'email' ? 'email' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={opt.inputPlaceholder}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E0DBD5] text-[13px] text-[#2D2D2D] placeholder-[#C0B8B0] bg-white focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent font-['Lato']"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 px-4 py-2 rounded-lg text-[13px] font-semibold bg-[#B8944A] text-white hover:bg-[#8A6F2E] transition-colors font-['Lato']"
        >
          Gotowe
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-[13px] font-medium border border-[#E0DBD5] text-[#4A4A4A] hover:bg-[#FAF8F5] transition-colors font-['Lato']"
        >
          Anuluj
        </button>
        {isModified && (
          <button
            type="button"
            onClick={onReset}
            title="Resetuj"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-[#E0DBD5] text-[#9A9390] hover:text-[#B8944A] hover:border-[#B8944A] transition-colors flex-shrink-0"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditableButtonLink
// ---------------------------------------------------------------------------

export interface EditableButtonLinkProps {
  section: CMSSectionKey;
  fieldPath: string;
  defaultAction?: string;
  className?: string;
  children?: React.ReactNode;
}

export function EditableButtonLink({
  section,
  fieldPath,
  defaultAction = 'whatsapp',
  className,
  children,
}: EditableButtonLinkProps) {
  const { isEditMode, getFieldValue, updateField } = useCMS();

  const actionFieldPath = `${fieldPath}${ACTION_FIELD_SUFFIX}`;
  const rawCms = getFieldValue(section, actionFieldPath);
  const neverSet = rawCms === actionFieldPath || rawCms.trim() === '';
  const effectiveRaw = neverSet ? defaultAction : rawCms;

  const phone = getFieldValue('contact', 'info.phone');
  const action: ButtonAction = parse(effectiveRaw) ?? {
    type: 'whatsapp',
    value: '',
  };
  const { href, target, rel } = resolveHref(action, phone);

  const [showPicker, setShowPicker] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapperRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isEditMode) return;
    const update = () => {
      if (wrapperRef.current)
        setRect(wrapperRef.current.getBoundingClientRect());
    };
    update();
    const interval = globalThis.setInterval(update, 1000);
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      globalThis.clearInterval(interval);
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isEditMode]);

  useEffect(() => {
    if (!showPicker) return;
    function onDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setShowPicker(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showPicker]);

  const handleSave = useCallback(
    async (newAction: ButtonAction) => {
      await updateField(section, actionFieldPath, serialize(newAction));
      setShowPicker(false);
    },
    [section, actionFieldPath, updateField],
  );

  const handleReset = useCallback(async () => {
    await updateField(section, actionFieldPath, '');
    setShowPicker(false);
  }, [section, actionFieldPath, updateField]);

  // ---- View mode ----
  if (!isEditMode) {
    if (action.type === 'internal') {
      return (
        <Link to={action.value || '/'} className={className}>
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target={target || undefined}
        rel={rel || undefined}
        className={className}
      >
        {children}
      </a>
    );
  }

  // ---- Edit mode ----
  const portalTarget = typeof document === 'undefined' ? null : document.body;
  const vw = globalThis.window === undefined ? 1440 : window.innerWidth;
  const vh = globalThis.window === undefined ? 900 : window.innerHeight;

  const opt = TYPE_OPTIONS.find((o) => o.type === action.type);
  const BadgeIcon = opt?.Icon ?? Link2;

  return (
    <a
      ref={wrapperRef}
      href={href}
      target={target || undefined}
      rel={rel || undefined}
      className={`relative inline-flex ${className ?? ''}`}
      onClick={(e) => e.preventDefault()}
    >
      {children}

      {/* Badge button — top-left corner */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowPicker((v) => !v);
        }}
        className={`absolute -top-2.5 -left-2.5 z-[9998] flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full text-[10px] font-semibold shadow-lg border border-white/20 backdrop-blur-sm transition-colors font-['Lato'] ${
          showPicker
            ? 'bg-[#B8963E] text-white'
            : 'bg-black/75 text-white hover:bg-[#B8963E]'
        }`}
        title="Edytuj akcję przycisku"
        aria-label="Edytuj akcję przycisku"
      >
        <Link2 size={10} />
        <BadgeIcon size={10} />
        <span>{opt?.label ?? action.type}</span>
      </button>

      {/* Picker via portal */}
      {showPicker &&
        portalTarget &&
        rect &&
        createPortal(
          <div
            className="fixed z-[9999]"
            style={{
              top:
                rect.bottom + 8 + 320 > vh
                  ? Math.max(4, rect.top - 320)
                  : rect.bottom + 8,
              left: Math.max(8, Math.min(rect.left, vw - 316)),
            }}
          >
            <ActionPicker
              current={action}
              phone={phone}
              isModified={!neverSet}
              onSave={handleSave}
              onReset={handleReset}
              onClose={() => setShowPicker(false)}
            />
          </div>,
          portalTarget,
        )}
    </a>
  );
}

export default EditableButtonLink;
