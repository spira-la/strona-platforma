import { Mail, MessageCircle, Phone } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { useCMS } from '@/contexts/CMSContext';
import type { CMSSectionKey } from '@/types/cms.types';

// ---------------------------------------------------------------------------
// ContactChannels — direct ways to reach the client (e-mail, WhatsApp, phone,
// Instagram, Facebook). Used where a form used to be while the site collects
// no personal data (feature flags `contactForm` / `eventSignUp`, 2026-11-26):
// each link opens the visitor's own app, so nothing is stored by the site.
//
// Phone and e-mail come from the Kontakt page's CMS fields (contact.info.*),
// so changing them there changes them everywhere. Button labels are
// CMS-editable under the section + fieldPrefix the caller passes.
// ---------------------------------------------------------------------------

export const INSTAGRAM_URL = 'https://www.instagram.com/anetamroczkospirala/';
export const FACEBOOK_URL = 'https://www.facebook.com/AnetaMroczko.Spirala';
const PHONE_FALLBACK = '+48 666 692 990';
const EMAIL_FALLBACK = 'contact@spira-la.com';

/** A CMS value, or the fallback while the field is still unset. */
function cmsOr(raw: string, fieldPath: string, fallback: string): string {
  if (!raw || raw === fieldPath || raw.trim() === '') return fallback;
  return raw.trim();
}

/** Her phone and e-mail as saved on the Kontakt page (with fallbacks). */
export function useContactInfo(): { phone: string; email: string } {
  const { getFieldValue } = useCMS();
  return {
    phone: cmsOr(
      getFieldValue('contact', 'info.phone'),
      'info.phone',
      PHONE_FALLBACK,
    ),
    email: cmsOr(
      getFieldValue('contact', 'info.email'),
      'info.email',
      EMAIL_FALLBACK,
    ),
  };
}

export function InstagramIcon({ size = 18 }: { size?: number }) {
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
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }: { size?: number }) {
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
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

const pill =
  "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-white px-4 py-2 font-['Lato'] text-[14px] font-semibold text-ink transition-colors hover:border-brand/50 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";
const block =
  "flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-line bg-white px-5 py-3 font-['Lato'] text-[16px] font-semibold text-ink transition-colors hover:border-brand/50 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

interface ContactChannelsProps {
  /** CMS section that holds the button labels */
  section: CMSSectionKey;
  /** fieldPath prefix for the labels, e.g. "channels" → channels.email */
  fieldPrefix: string;
  /** Text typed in for her: WhatsApp message and e-mail subject */
  message?: string;
  /** Also show Instagram and Facebook */
  social?: boolean;
  /** "pills" = a compact row; "blocks" = full-width stacked buttons */
  variant?: 'pills' | 'blocks';
}

export function ContactChannels({
  section,
  fieldPrefix,
  message,
  social = false,
  variant = 'pills',
}: ContactChannelsProps) {
  const { phone, email } = useContactInfo();
  const digits = phone.replaceAll(/\D/g, '');
  const text = message ? encodeURIComponent(message) : '';
  const mailHref = text ? `mailto:${email}?subject=${text}` : `mailto:${email}`;
  const waHref = text
    ? `https://wa.me/${digits}?text=${text}`
    : `https://wa.me/${digits}`;
  const cls = variant === 'blocks' ? block : pill;
  const icon = variant === 'blocks' ? 20 : 18;
  const iconWrap =
    variant === 'blocks'
      ? 'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full'
      : 'contents';

  return (
    <div
      className={
        variant === 'blocks' ? 'flex flex-col gap-3' : 'flex flex-wrap gap-2'
      }
    >
      <a href={mailHref} className={cls}>
        <span className={`${iconWrap} bg-spiral-coral-soft text-spiral-coral`}>
          <Mail size={icon} aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          <EditableText section={section} fieldPath={`${fieldPrefix}.email`}>
            E-mail
          </EditableText>
          {variant === 'blocks' && (
            <span className="text-[14px] font-normal text-ink-soft">
              {email}
            </span>
          )}
        </span>
      </a>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
      >
        <span className={`${iconWrap} bg-spiral-teal-soft text-spiral-teal`}>
          <MessageCircle size={icon} aria-hidden="true" />
        </span>
        <EditableText section={section} fieldPath={`${fieldPrefix}.whatsapp`}>
          WhatsApp
        </EditableText>
      </a>
      <a href={`tel:${phone.replaceAll(/[^\d+]/g, '')}`} className={cls}>
        <span className={`${iconWrap} bg-spiral-gold-soft text-spiral-gold`}>
          <Phone size={icon} aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          {variant === 'blocks' ? (
            <>
              <EditableText
                section={section}
                fieldPath={`${fieldPrefix}.phone`}
              >
                Zadzwoń
              </EditableText>
              <span className="text-[14px] font-normal text-ink-soft">
                {phone}
              </span>
            </>
          ) : (
            phone
          )}
        </span>
      </a>
      {social && (
        <>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
          >
            <span
              className={`${iconWrap} bg-spiral-violet-soft text-spiral-violet`}
            >
              <InstagramIcon size={icon} />
            </span>
            <EditableText
              section={section}
              fieldPath={`${fieldPrefix}.instagram`}
            >
              Instagram
            </EditableText>
          </a>
          <a
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cls}
          >
            <span
              className={`${iconWrap} bg-spiral-blue-soft text-spiral-blue`}
            >
              <FacebookIcon size={icon} />
            </span>
            <EditableText
              section={section}
              fieldPath={`${fieldPrefix}.facebook`}
            >
              Facebook
            </EditableText>
          </a>
        </>
      )}
    </div>
  );
}
