import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  MonitorPlay,
  Ticket,
  Users,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import lavenderHeart from '@/assets/watercolor/lavender-heart.webp';
import bouquetArt from '@/assets/watercolor/bouquet.webp';
import wingsArt from '@/assets/watercolor/butterfly-rainbow.webp';
import butterflyYellowArt from '@/assets/watercolor/butterfly-yellow.webp';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import {
  RainbowStroke,
  WatercolorAccent,
  WatercolorFriend,
} from '@/components/shared/Watercolor';
import {
  eventsClient,
  type PublicEvent,
  type RegistrationErrorCode,
} from '@/clients/events.client';

// ---------------------------------------------------------------------------
// /wydarzenia — Events (2026-11 redesign)
//
// The coach adds events herself in the admin panel (/admin/events). Visitors
// see upcoming published events and sign up with a short e-mail form — no
// payment. Event content (title, description, place, price) is what she
// types in the admin; every other visible text is CMS-editable (`events`).
// ---------------------------------------------------------------------------

const S = 'events' as const;
const TIME_ZONE = 'Europe/Warsaw';

/** Watercolor art shown when an event has no picture (cycles per card). */
const FALLBACK_ART = [lavenderHeart, wingsArt, bouquetArt, butterflyYellowArt];
const FALLBACK_BG = [
  'bg-spiral-violet-soft',
  'bg-spiral-gold-soft',
  'bg-spiral-blue-soft',
  'bg-spiral-teal-soft',
];

const btnPrimary =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-7 py-3 font-['Lato'] text-[15px] font-semibold text-white transition-colors hover:bg-action-hover disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 font-['Lato'] text-[15px] text-ink placeholder:text-ink-muted/70 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";
const labelClass =
  "mb-1.5 block font-['Lato'] text-[13px] font-semibold text-ink";

// ---------------------------------------------------------------------------
// Date helpers (always shown in Polish time — events take place in Poland)
// ---------------------------------------------------------------------------

function dateParts(iso: string, lang: string) {
  const d = new Date(iso);
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(lang, { timeZone: TIME_ZONE, ...o }).format(d);
  return {
    day: fmt({ day: 'numeric' }),
    month: fmt({ month: 'short' }).replace('.', ''),
    full: fmt({
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    time: fmt({ hour: '2-digit', minute: '2-digit' }),
  };
}

function whenLabel(e: PublicEvent, lang: string): string {
  const start = dateParts(e.startsAt, lang);
  if (!e.endsAt) return `${start.full}, ${start.time}`;
  const end = dateParts(e.endsAt, lang);
  return start.full === end.full
    ? `${start.full}, ${start.time}–${end.time}`
    : `${start.full}, ${start.time} – ${end.full}, ${end.time}`;
}

// ---------------------------------------------------------------------------
// Sign-up form
// ---------------------------------------------------------------------------

type FormErrors = Partial<Record<'fullName' | 'email', true>>;

/** Light check — the backend validates the address properly. */
function looksLikeEmail(v: string): boolean {
  const at = v.indexOf('@');
  return (
    at > 0 &&
    v.lastIndexOf('.') > at + 1 &&
    !v.endsWith('.') &&
    !v.includes(' ')
  );
}

function SignUpForm({
  event,
  onDone,
}: {
  event: PublicEvent;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<
    RegistrationErrorCode | 'GENERIC' | null
  >(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: FormErrors = {};
    if (fullName.trim().length < 2) next.fullName = true;
    if (!looksLikeEmail(email.trim())) next.email = true;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    setServerError(null);
    try {
      await eventsClient.register(event.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
      });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      onDone();
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      setServerError(
        (
          [
            'EVENT_FULL',
            'ALREADY_REGISTERED',
            'REGISTRATION_CLOSED',
            'EVENT_NOT_FOUND',
          ] as string[]
        ).includes(code)
          ? (code as RegistrationErrorCode)
          : 'GENERIC',
      );
    } finally {
      setSending(false);
    }
  };

  const id = (name: string) => `ev-${event.id}-${name}`;

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      noValidate
      className="mt-6 flex flex-col gap-4 rounded-[20px] bg-surface p-5 md:p-6"
      aria-label={event.title}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id('name')} className={labelClass}>
            <EditableText section={S} fieldPath="form.nameLabel" as="span">
              Imię i nazwisko
            </EditableText>
            <span className="ml-0.5 text-brand" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={id('name')}
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? id('name-err') : undefined}
          />
          {errors.fullName && (
            <p
              id={id('name-err')}
              role="alert"
              className="mt-1 font-['Lato'] text-[13px] text-red-600"
            >
              <EditableText section={S} fieldPath="form.nameError" as="span">
                Wpisz swoje imię i nazwisko
              </EditableText>
            </p>
          )}
        </div>
        <div>
          <label htmlFor={id('email')} className={labelClass}>
            <EditableText section={S} fieldPath="form.emailLabel" as="span">
              E-mail
            </EditableText>
            <span className="ml-0.5 text-brand" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id={id('email')}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? id('email-err') : undefined}
          />
          {errors.email && (
            <p
              id={id('email-err')}
              role="alert"
              className="mt-1 font-['Lato'] text-[13px] text-red-600"
            >
              <EditableText section={S} fieldPath="form.emailError" as="span">
                Wpisz poprawny adres e-mail
              </EditableText>
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={id('phone')} className={labelClass}>
          <EditableText section={S} fieldPath="form.phoneLabel" as="span">
            Telefon
          </EditableText>
          <span className="ml-1.5 font-['Lato'] text-[12px] font-normal text-ink-muted">
            <EditableText section={S} fieldPath="form.optional" as="span">
              (opcjonalnie)
            </EditableText>
          </span>
        </label>
        <input
          id={id('phone')}
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={id('message')} className={labelClass}>
          <EditableText section={S} fieldPath="form.messageLabel" as="span">
            Chcesz mi coś przekazać?
          </EditableText>
          <span className="ml-1.5 font-['Lato'] text-[12px] font-normal text-ink-muted">
            <EditableText section={S} fieldPath="form.optional" as="span">
              (opcjonalnie)
            </EditableText>
          </span>
        </label>
        <textarea
          id={id('message')}
          rows={3}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      </div>

      {serverError && (
        <p
          role="alert"
          className="rounded-xl bg-spiral-coral-soft px-4 py-3 font-['Lato'] text-[14px] text-ink"
        >
          {serverError === 'EVENT_FULL' && (
            <EditableText section={S} fieldPath="form.errorFull" as="span">
              Niestety, wszystkie miejsca są już zajęte. Napisz do mnie — dam Ci
              znać, gdy pojawi się kolejny termin.
            </EditableText>
          )}
          {serverError === 'ALREADY_REGISTERED' && (
            <EditableText section={S} fieldPath="form.errorDuplicate" as="span">
              Ten adres e-mail jest już zapisany na to wydarzenie.
            </EditableText>
          )}
          {(serverError === 'REGISTRATION_CLOSED' ||
            serverError === 'EVENT_NOT_FOUND') && (
            <EditableText section={S} fieldPath="form.errorClosed" as="span">
              Zapisy na to wydarzenie są już zamknięte.
            </EditableText>
          )}
          {serverError === 'GENERIC' && (
            <EditableText section={S} fieldPath="form.errorGeneric" as="span">
              Coś poszło nie tak. Spróbuj jeszcze raz albo napisz do mnie
              bezpośrednio.
            </EditableText>
          )}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-['Lato'] text-[12px] leading-relaxed text-ink-muted">
          <EditableText section={S} fieldPath="form.privacy" as="span">
            Twoje dane służą tylko do kontaktu w sprawie tego wydarzenia.
          </EditableText>
        </p>
        <button type="submit" disabled={sending} className={btnPrimary}>
          {sending && <Loader2 size={16} className="animate-spin" />}
          <EditableText section={S} fieldPath="form.submit" as="span">
            Zapisuję się
          </EditableText>
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Event card
// ---------------------------------------------------------------------------

function EventCard({ event, index }: { event: PublicEvent; index: number }) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const start = dateParts(event.startsAt, i18n.language);
  const full = event.spotsLeft === 0;
  const canSignUp = event.registrationOpen && !full;
  const longText = (event.description?.length ?? 0) > 320;

  return (
    <article className="overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_6px_30px_-12px_rgba(63,48,68,0.18)]">
      <div className="grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Picture */}
        <div
          className={`relative min-h-[200px] ${event.imageUrl ? '' : FALLBACK_BG[index % FALLBACK_BG.length]}`}
        >
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img
              src={FALLBACK_ART[index % FALLBACK_ART.length]}
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 m-auto h-[70%] w-[70%] object-contain"
            />
          )}
          {/* date badge */}
          <div className="absolute left-4 top-4 flex flex-col items-center rounded-2xl bg-white/95 px-4 py-2 text-center shadow-sm">
            <span className="font-['Lato'] text-[30px] font-bold leading-none text-ink">
              {start.day}
            </span>
            <span className="font-['Lato'] text-[12px] font-semibold uppercase tracking-[0.15em] text-brand-dark">
              {start.month}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 p-6 md:p-8">
          <h2 className="font-['Cormorant_Garamond'] text-[28px] leading-tight text-ink md:text-[32px]">
            {event.title}
          </h2>

          <ul className="flex flex-col gap-2 font-['Lato'] text-[15px] text-ink-soft">
            <li className="flex items-start gap-2.5">
              <CalendarDays
                size={18}
                className="mt-0.5 flex-shrink-0 text-spiral-coral"
                aria-hidden="true"
              />
              <span className="first-letter:uppercase">
                {whenLabel(event, i18n.language)}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              {event.isOnline ? (
                <MonitorPlay
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-spiral-teal"
                  aria-hidden="true"
                />
              ) : (
                <MapPin
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-spiral-teal"
                  aria-hidden="true"
                />
              )}
              <span>
                {event.isOnline && (
                  <EditableText section={S} fieldPath="card.online" as="span">
                    Online
                  </EditableText>
                )}
                {event.isOnline && event.location && ' · '}
                {event.location}
              </span>
            </li>
            {event.priceLabel && (
              <li className="flex items-start gap-2.5">
                <Ticket
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-spiral-gold"
                  aria-hidden="true"
                />
                <span>{event.priceLabel}</span>
              </li>
            )}
            {event.spotsLeft !== null && (
              <li className="flex items-start gap-2.5">
                <Users
                  size={18}
                  className="mt-0.5 flex-shrink-0 text-spiral-violet"
                  aria-hidden="true"
                />
                {full ? (
                  <EditableText section={S} fieldPath="card.full" as="span">
                    Brak wolnych miejsc
                  </EditableText>
                ) : (
                  <span>
                    <EditableText
                      section={S}
                      fieldPath="card.spotsLeft"
                      as="span"
                    >
                      Wolne miejsca:
                    </EditableText>{' '}
                    <strong className="text-ink">{event.spotsLeft}</strong>
                  </span>
                )}
              </li>
            )}
          </ul>

          {event.description && (
            <div>
              <p
                className={`whitespace-pre-line font-['Lato'] text-[16px] leading-[1.75] text-ink-soft ${longText && !expanded ? 'line-clamp-5' : ''}`}
              >
                {event.description}
              </p>
              {longText && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  className="mt-1 inline-flex items-center gap-1 font-['Lato'] text-[14px] font-semibold text-brand-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
                >
                  {expanded ? (
                    <EditableText
                      section={S}
                      fieldPath="card.readLess"
                      as="span"
                    >
                      Zwiń
                    </EditableText>
                  ) : (
                    <EditableText
                      section={S}
                      fieldPath="card.readMore"
                      as="span"
                    >
                      Czytaj więcej
                    </EditableText>
                  )}
                  <ChevronDown
                    size={15}
                    className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          )}

          {/* Sign-up */}
          <div className="mt-auto pt-2">
            {done ? (
              <div
                role="status"
                className="flex items-start gap-3 rounded-[20px] bg-spiral-teal-soft p-5"
              >
                <CheckCircle2
                  size={22}
                  className="mt-0.5 flex-shrink-0 text-spiral-teal"
                  aria-hidden="true"
                />
                <div className="font-['Lato'] text-[15px] leading-relaxed text-ink">
                  <p className="font-semibold">
                    <EditableText
                      section={S}
                      fieldPath="form.successTitle"
                      as="span"
                    >
                      Dziękuję, jesteś zapisana/y!
                    </EditableText>
                  </p>
                  <p className="text-ink-soft">
                    <EditableText
                      section={S}
                      fieldPath="form.successBody"
                      as="span"
                    >
                      Potwierdzenie wysłałam na Twój e-mail. Do zobaczenia!
                    </EditableText>
                  </p>
                </div>
              </div>
            ) : canSignUp ? (
              open ? (
                <SignUpForm event={event} onDone={() => setDone(true)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className={btnPrimary}
                >
                  <EditableText section={S} fieldPath="card.signUp" as="span">
                    Zapisz się
                  </EditableText>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )
            ) : (
              <p className="inline-flex rounded-full bg-surface px-5 py-2.5 font-['Lato'] text-[14px] font-semibold text-ink-muted">
                {full ? (
                  <EditableText section={S} fieldPath="card.full" as="span">
                    Brak wolnych miejsc
                  </EditableText>
                ) : (
                  <EditableText section={S} fieldPath="card.closed" as="span">
                    Zapisy zamknięte
                  </EditableText>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="mx-auto max-w-[640px] rounded-[24px] border border-line bg-surface p-10 text-center md:p-12">
      {/* the client's painted lavender heart instead of an icon */}
      <img
        src={lavenderHeart}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="mx-auto mb-5 h-auto w-[110px] md:w-[130px]"
      />
      <h2 className="mb-3 font-['Cormorant_Garamond'] text-[30px] leading-tight text-ink">
        <EditableText section={S} fieldPath="empty.title">
          Nowe wydarzenia już wkrótce
        </EditableText>
      </h2>
      <p className="mb-8 font-['Lato'] text-[16px] leading-relaxed text-ink-soft">
        <EditableText section={S} fieldPath="empty.body">
          Pracuję nad nowymi terminami. Napisz do mnie, a dam Ci znać, gdy tylko
          pojawi się najbliższe spotkanie.
        </EditableText>
      </p>
      <Link to="/kontakt" className={btnPrimary}>
        <EditableText section={S} fieldPath="empty.cta">
          Napisz do mnie
        </EditableText>
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default function Events() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsClient.getUpcoming(),
  });
  const events = data ?? [];

  return (
    <main className="bg-white">
      <SEO
        title="Wydarzenia"
        description="Warsztaty, spotkania i webinary z Anetą — o życiu w teraz, podświadomości i uwalnianiu się od cierpienia."
        canonical="/wydarzenia"
        pathname="/wydarzenia"
      />

      {/* Intro */}
      <section className="relative isolate overflow-hidden bg-surface px-6 pb-16 pt-[140px] md:px-12 md:pb-20 md:pt-[170px] lg:px-[120px]">
        <WatercolorAccent
          tone="warm"
          className="-left-24 top-10 w-[260px] opacity-45 md:w-[400px]"
        />
        <WatercolorAccent
          tone="cool"
          className="-right-24 top-24 w-[240px] opacity-40 md:w-[380px]"
        />
        <WatercolorFriend
          kind="wings"
          float
          className="right-[8%] top-[110px] w-[64px] md:right-[16%] md:top-[150px] md:w-[96px]"
        />
        <WatercolorFriend
          kind="bee"
          fly="right"
          delay={2}
          className="bottom-6 left-[7%] w-[56px] md:left-[15%] md:w-[84px]"
        />
        <div className="mx-auto max-w-[760px] text-center">
          <ScrollReveal>
            <p className="mb-4 font-['Lato'] text-[13px] uppercase tracking-[0.2em] text-brand-dark">
              <EditableText section={S} fieldPath="hero.eyebrow">
                Spotkajmy się
              </EditableText>
            </p>
            <h1 className="mb-6 font-['Cormorant_Garamond'] text-[44px] leading-[1.1] text-ink md:text-[60px]">
              <EditableText section={S} fieldPath="hero.title">
                Wydarzenia
              </EditableText>
            </h1>
            <RainbowStroke className="mx-auto -mt-3 mb-6 w-[220px] md:w-[320px]" />
            <p className="font-['Lato'] text-[17px] leading-relaxed text-ink-soft">
              <EditableText section={S} fieldPath="hero.subtitle">
                Warsztaty, spotkania i webinary, na których razem odkrywamy, jak
                działa człowiek i jak żyć w teraz — lżej, spokojniej, po
                swojemu.
              </EditableText>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* List */}
      <section className="bg-white px-6 py-16 md:px-12 md:py-20 lg:px-[120px]">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-8">
          {isLoading && (
            <div className="flex justify-center py-16" aria-busy="true">
              <Loader2 size={28} className="animate-spin text-ink-muted" />
            </div>
          )}
          {!isLoading && (isError || events.length === 0) && (
            <ScrollReveal>
              <EmptyState />
            </ScrollReveal>
          )}
          {events.map((event, i) => (
            <ScrollReveal key={event.id} animation="fade-up" delay={stagger(i)}>
              <EventCard event={event} index={i} />
            </ScrollReveal>
          ))}
        </div>
      </section>
    </main>
  );
}
