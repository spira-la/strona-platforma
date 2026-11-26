import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { useContactInfo } from '@/components/shared/ContactChannels';

// ---------------------------------------------------------------------------
// /polityka-prywatnosci while the site collects no personal data
// (`legalDocuments` flag off, client 2026-11-26: no company / NIP yet).
//
// A short, honest note instead of the full policy (pages/PrivacyPolicy.tsx,
// kept intact for when forms, sign-ups, analytics or sales come back — then
// the full policy and regulamin must return too). New CMS fieldPaths
// (`note.*`) so the saved full-policy text never mixes in. Every line is
// CMS-editable.
// ---------------------------------------------------------------------------

const S = 'privacy' as const;

const POINTS = [
  {
    key: 'point1',
    text: 'Nie ma tu formularzy, zapisów, newslettera ani kont. Nie zostawiasz na stronie imienia, e-maila ani numeru telefonu.',
  },
  {
    key: 'point2',
    text: 'Nie używam plików cookies do statystyk ani reklam i nie korzystam z narzędzi śledzących (np. Google Analytics, Meta Pixel).',
  },
  {
    key: 'point3',
    text: 'Czcionki, teksty i obrazy wczytują się z serwera tej strony, nie od zewnętrznych firm. Przeglądarka zapamiętuje jedynie treść strony, żeby szybciej się otwierała.',
  },
  {
    key: 'point4',
    text: 'Serwer, na którym działa strona, jak każdy serwer zapisuje techniczne informacje o połączeniu (np. adres IP). Służą one wyłącznie bezpieczeństwu i działaniu strony.',
  },
  {
    key: 'point5',
    text: 'Przyciski e-mail, WhatsApp, telefon, Instagram i Facebook otwierają Twoją własną aplikację. Za działanie tych aplikacji odpowiadają ich dostawcy, na swoich zasadach.',
  },
] as const;

const h2 =
  "font-['Cormorant_Garamond'] text-[26px] md:text-[30px] leading-tight text-ink";
const p = "font-['Lato'] text-[16px] leading-[1.75] text-ink-soft";

export default function PrivacyNote() {
  const { phone, email } = useContactInfo();

  return (
    <main className="min-h-screen bg-surface">
      <SEO
        title="Polityka prywatności"
        description="Ta strona nie zbiera Twoich danych osobowych."
        canonical="/polityka-prywatnosci"
        noindex
      />

      <div className="mx-auto max-w-[760px] px-5 py-12 sm:px-6 md:px-8 md:py-20">
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-2 font-['Lato'] text-[13px] font-semibold text-brand transition-colors hover:text-brand-dark"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          <EditableText section={S} fieldPath="note.back">
            Wróć do strony głównej
          </EditableText>
        </Link>

        <div className="mb-10 flex flex-col gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-spiral-teal-soft text-spiral-teal">
            <ShieldCheck size={24} aria-hidden="true" />
          </span>
          <EditableText
            section={S}
            fieldPath="note.title"
            as="h1"
            className="font-['Cormorant_Garamond'] text-[40px] leading-[1.1] text-ink md:text-[52px]"
          >
            Polityka prywatności
          </EditableText>
          <EditableText
            section={S}
            fieldPath="note.lead"
            as="p"
            className="font-['Cormorant_Garamond'] text-[24px] italic leading-[1.35] text-brand-dark md:text-[28px]"
          >
            Ta strona nie zbiera Twoich danych osobowych.
          </EditableText>
          <EditableText
            section={S}
            fieldPath="note.updated"
            as="p"
            className="font-['Lato'] text-[13px] text-ink-muted"
          >
            Ostatnia aktualizacja: 26 listopada 2026
          </EditableText>
        </div>

        <section className="mb-10 flex flex-col gap-4 rounded-[24px] bg-white p-6 md:p-8">
          <EditableText
            section={S}
            fieldPath="note.howTitle"
            as="h2"
            className={h2}
          >
            Co to znaczy w praktyce
          </EditableText>
          <ul className="flex flex-col gap-3">
            {POINTS.map(({ key, text }) => (
              <li key={key} className="flex gap-3">
                <span
                  className="mt-[11px] h-2 w-2 flex-shrink-0 rounded-full bg-spiral-teal"
                  aria-hidden="true"
                />
                <EditableText
                  section={S}
                  fieldPath={`note.${key}`}
                  as="p"
                  className={p}
                >
                  {text}
                </EditableText>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10 flex flex-col gap-4 rounded-[24px] bg-white p-6 md:p-8">
          <EditableText
            section={S}
            fieldPath="note.contactTitle"
            as="h2"
            className={h2}
          >
            Gdy do mnie napiszesz lub zadzwonisz
          </EditableText>
          <EditableText
            section={S}
            fieldPath="note.contactBody1"
            as="p"
            className={p}
          >
            Twoje imię, adres e-mail lub numer telefonu i treść wiadomości
            wykorzystuję tylko po to, żeby Ci odpowiedzieć i umówić rozmowę albo
            spotkanie. Nie przekazuję ich nikomu i nie wysyłam reklam.
          </EditableText>
          <EditableText
            section={S}
            fieldPath="note.contactBody2"
            as="p"
            className={p}
          >
            W każdej chwili możesz poprosić o wgląd w swoje dane, ich
            poprawienie lub usunięcie. Wystarczy, że napiszesz. Masz też prawo
            złożyć skargę do Prezesa Urzędu Ochrony Danych Osobowych (UODO).
          </EditableText>
          <EditableText
            section={S}
            fieldPath="note.controller"
            as="p"
            className={p}
          >
            Administratorką tych danych jestem ja, Aneta Mroczko (Spirala).
          </EditableText>
          <div className="mt-2 flex flex-col gap-2 font-['Lato'] text-[15px] text-ink">
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 hover:text-brand"
            >
              <Mail size={16} aria-hidden="true" className="text-brand-dark" />
              {email}
            </a>
            <a
              href={`tel:${phone.replaceAll(/[^\d+]/g, '')}`}
              className="inline-flex items-center gap-2 hover:text-brand"
            >
              <Phone size={16} aria-hidden="true" className="text-brand-dark" />
              {phone}
            </a>
          </div>
        </section>

        <EditableText
          section={S}
          fieldPath="note.changes"
          as="p"
          className="font-['Lato'] text-[14px] leading-[1.7] text-ink-muted"
        >
          Jeśli strona zacznie zbierać dane (np. zapisy przez formularz),
          zaktualizuję tę informację, zanim to nastąpi.
        </EditableText>
      </div>
    </main>
  );
}
