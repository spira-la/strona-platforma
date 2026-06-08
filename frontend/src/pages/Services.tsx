import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import { servicesClient, type Service } from '@/clients/services.client';

// ---------------------------------------------------------------------------
// Small reusable primitives (scoped to this file)
// ---------------------------------------------------------------------------

function SectionBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-block px-4 py-1 text-xs font-semibold uppercase tracking-widest rounded-full border border-[#D4B97A] text-[#B8944A] bg-[rgba(184,148,74,0.08)]"
      style={{ fontFamily: "'Lato', sans-serif" }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Service card
// ---------------------------------------------------------------------------

interface ServiceCardProps {
  titleField: string;
  titlePlaceholder: string;
  desc1Field: string;
  desc1Placeholder: string;
  desc2Field: string;
  desc2Placeholder: string;
  desc3Field: string;
  desc3Placeholder: string;
  ctaLabel: string;
  onCta: () => void;
  highlighted?: boolean;
  /** Real product from DB — price and session info always comes from here */
  service?: Service | null;
}

function ServiceCard({
  titleField,
  titlePlaceholder,
  desc1Field,
  desc1Placeholder,
  desc2Field,
  desc2Placeholder,
  desc3Field,
  desc3Placeholder,
  ctaLabel,
  onCta,
  highlighted = false,
  service,
}: ServiceCardProps) {
  const price = service
    ? new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency: service.currency ?? 'PLN',
        maximumFractionDigits: 0,
      }).format(service.priceCents / 100)
    : null;

  const sessionLabel = service
    ? service.sessionCount && service.sessionCount > 1
      ? `${service.sessionCount} sesji · ${service.durationMinutes} min/sesja`
      : `${service.durationMinutes} min`
    : null;

  return (
    <article
      className={`h-full flex flex-col rounded-2xl p-8 border transition-shadow hover:shadow-lg ${
        highlighted
          ? 'border-[#B8944A] bg-white shadow-[0_4px_24px_rgba(184,148,74,0.12)]'
          : 'border-[#E8E4DF] bg-white'
      }`}
    >
      <EditableText
        section="services"
        fieldPath={titleField}
        as="h3"
        placeholder={titlePlaceholder}
        className="text-2xl font-black uppercase tracking-tight text-[#2D2D2D] mb-4 [font-family:'Cormorant_Garamond',serif]"
      />

      <div className="flex flex-col gap-3 flex-1">
        <EditableText
          section="services"
          fieldPath={desc1Field}
          as="p"
          placeholder={desc1Placeholder}
          className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
        />
        <EditableText
          section="services"
          fieldPath={desc2Field}
          as="p"
          placeholder={desc2Placeholder}
          className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
        />
        <EditableText
          section="services"
          fieldPath={desc3Field}
          as="p"
          placeholder={desc3Placeholder}
          className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
        />
      </div>

      <div className="mt-6 pt-6 border-t border-[#F0EDE8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          {price ? (
            <p className="text-xl font-bold text-[#B8944A] [font-family:'Lato',sans-serif]">
              {price}
            </p>
          ) : null}
          {sessionLabel ? (
            <p className="text-xs text-[#8A8A8A] [font-family:'Lato',sans-serif]">
              {sessionLabel}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center justify-center px-7 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] whitespace-nowrap"
          style={{
            background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
            fontFamily: "'Lato', sans-serif",
          }}
        >
          {ctaLabel}
        </button>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// (BookingSection removed — booking happens on /rezerwacja)

export default function Services() {
  const navigate = useNavigate();
  const showPurchaseFlow = useFeatureFlag('purchaseFlow');

  const { data: services } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => servicesClient.getAll(),
    enabled: showPurchaseFlow,
  });
  const activeServices = (services ?? []).filter((s) => s.isActive);
  const singleService =
    activeServices.find((s) => (s.sessionCount ?? 1) === 1) ?? null;
  const packageService =
    activeServices.find((s) => (s.sessionCount ?? 1) > 1) ?? null;

  function goToBookingFlow(service: typeof singleService) {
    if (!showPurchaseFlow) {
      navigate('/kontakt');
      return;
    }
    navigate(service ? `/rezerwacja?service=${service.id}` : '/rezerwacja');
  }

  return (
    <main className="min-h-screen bg-white text-[#2D2D2D]">
      <SEO
        title="Usługi"
        description="Sesje coachingowe i pakiety online z Anetą — coaching mindsetu, wellbeing i rozwój osobisty. Sprawdź ofertę i wybierz formę współpracy odpowiednią dla Ciebie."
        canonical="/uslugi"
        pathname="/uslugi"
      />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden h-[500px] md:h-[620px]"
        aria-label="Naglowek strony Uslugi"
      >
        {/* Background image */}
        <EditableBackground
          section="services"
          fieldPath="heroBg"
          fallbackSrc="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section="services"
          fieldPath="heroBg"
          defaultTop={68}
          defaultBottom={68}
        />

        <ScrollReveal
          animation="fade"
          delay={200}
          className="relative z-10 max-w-[672px] mx-auto flex flex-col items-center gap-6"
        >
          <EditableText
            section="services"
            fieldPath="heroTitle"
            as="h1"
            placeholder="RAZEM MOZEMY WIECEJ"
            className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-tight text-white [font-family:'Cormorant_Garamond',serif]"
          />

          <EditableText
            section="services"
            fieldPath="heroDesc"
            as="p"
            placeholder="Oferuje indywidualne sesje coachingowe i terapeutyczne, ktore towarzysza Ci w odkrywaniu wlasnych zasobow i budowaniu autentycznego zycia. Razem wyjdziemy poza to, co znane."
            className="text-base sm:text-lg leading-relaxed max-w-[576px] text-white/80 [font-family:'Lato',sans-serif]"
          />
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SERVICE CARDS                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-[#F5F3EF]"
        aria-label="Oferta sesji"
      >
        <div className="max-w-[1024px] mx-auto">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center text-center gap-4 mb-12">
              <SectionBadge label="Oferta" />
              <EditableText
                section="services"
                fieldPath="offersTitle"
                as="h2"
                placeholder="CO OFERUJE"
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
              />
              <EditableText
                section="services"
                fieldPath="offersSubtitle"
                as="p"
                placeholder="Wybierz forme pracy, ktora najlepiej odpowiada Twoim potrzebom."
                className="text-sm sm:text-base leading-relaxed max-w-[576px] text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ScrollReveal animation="fade-up" delay={stagger(0)}>
              <ServiceCard
                titleField="card1Title"
                titlePlaceholder="SESJA 1 NA 1"
                desc1Field="card1Desc1"
                desc1Placeholder="Indywidualna sesja coachingowa lub terapeutyczna, w pelni dopasowana do Twoich potrzeb i aktualnej sytuacji zyciowej."
                desc2Field="card1Desc2"
                desc2Placeholder="Pracujemy z Twoimi celami, wartosciami, przekonaniami i wzorcami — w bezpiecznej i wspierajacej przestrzeni."
                desc3Field="card1Desc3"
                desc3Placeholder="Sesja trwa 60 minut. Mozliwosc pracy online lub stacjonarnie."
                ctaLabel="Wybieram"
                onCta={() => goToBookingFlow(singleService)}
                service={singleService}
              />
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <ServiceCard
                titleField="card2Title"
                titlePlaceholder="PAKIET 4 SESJE"
                desc1Field="card2Desc1"
                desc1Placeholder="Cztery sesje w cenie trzech — idealne dla osob, ktore chca glebszej, dluzszej pracy nad sob i osiagnieciem trwalej zmiany."
                desc2Field="card2Desc2"
                desc2Placeholder="Pakiet umozliwia systemowe podejscie do Twoich celow i zapewnia ciaglosc procesu — bez przerw i powrotow do punktu wyjscia."
                desc3Field="card2Desc3"
                desc3Placeholder="Waznosc pakietu: 3 miesiace od zakupu. Terminy ustalamy elastycznie."
                ctaLabel="Wybieram"
                onCta={() => goToBookingFlow(packageService)}
                service={packageService}
                highlighted
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 overflow-hidden"
        aria-label="Wezwanie do dzialania"
      >
        {/* Background */}
        <EditableBackground
          section="services"
          fieldPath="ctaBg"
          fallbackSrc="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section="services"
          fieldPath="ctaBg"
          defaultTop={72}
          defaultBottom={72}
        />

        <ScrollReveal
          animation="fade"
          duration={900}
          className="relative z-10 flex flex-col items-center gap-6 max-w-[576px]"
        >
          <EditableText
            section="services"
            fieldPath="ctaTitle"
            as="h2"
            placeholder="GOTOWA NA KOLEJNY KROK?"
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white [font-family:'Cormorant_Garamond',serif]"
          />
          <EditableText
            section="services"
            fieldPath="ctaDesc"
            as="p"
            placeholder="Nie musisz wiedziec wszystkiego. Wystarczy jeden krok w strone siebie — reszta przyjdzie sama."
            className="text-sm sm:text-base leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
          />

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              type="button"
              onClick={() => goToBookingFlow(singleService)}
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A]"
              style={{
                background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                fontFamily: "'Lato', sans-serif",
              }}
            >
              <EditableText
                section="services"
                fieldPath="ctaBtn1"
                as="span"
                placeholder="Zarezerwuj sesje"
              />
            </button>

            <EditableButtonLink
              section="services"
              fieldPath="ctaBtn2"
              defaultAction="internal:/kontakt"
              className="items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold border border-white/50 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
            >
              <EditableText
                section="services"
                fieldPath="ctaBtn2"
                as="span"
                placeholder="Napisz do mnie"
              />
            </EditableButtonLink>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
