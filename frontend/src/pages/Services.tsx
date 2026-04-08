import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { BookingCalendar } from '@/components/booking/BookingCalendar';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';

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
  priceField: string;
  pricePlaceholder: string;
  ctaLabel: string;
  onCta: () => void;
  highlighted?: boolean;
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
  priceField,
  pricePlaceholder,
  ctaLabel,
  onCta,
  highlighted = false,
}: ServiceCardProps) {
  return (
    <article
      className={`flex flex-col rounded-2xl p-8 border transition-shadow hover:shadow-lg ${
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
        className="text-2xl font-black uppercase tracking-tight text-[#2D2D2D] mb-4 [font-family:'Playfair_Display',serif]"
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
        <EditableText
          section="services"
          fieldPath={priceField}
          as="p"
          placeholder={pricePlaceholder}
          className="text-xl font-bold text-[#B8944A] [font-family:'Lato',sans-serif]"
        />

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
// Booking section
// ---------------------------------------------------------------------------

type BookingStep = 'date' | 'time' | 'confirmed';

/** Animated wrapper for booking step transitions */
function BookingTransition({ children, show }: { children: React.ReactNode; show: boolean }) {
  return (
    <div
      className="transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.98)',
        filter: show ? 'none' : 'blur(4px)',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}

function BookingSection() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<BookingStep>('date');

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep('time');
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time);
  }

  function handleConfirm() {
    setStep('confirmed');
  }

  function handleReset() {
    setSelectedDate(null);
    setSelectedTime(null);
    setStep('date');
  }

  return (
    <section
      id="rezerwacja"
      className="px-6 py-16 sm:py-24 bg-[#FAF8F5]"
      aria-label="Wybierz termin sesji"
    >
      <div className="max-w-[1024px] mx-auto">
        {/* Heading */}
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <SectionBadge label="Rezerwacja" />
          <EditableText
            section="booking"
            fieldPath="sectionTitle"
            as="h2"
            placeholder="WYBIERZ TERMIN"
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
          />
          <EditableText
            section="booking"
            fieldPath="sectionDesc"
            as="p"
            placeholder="Wybierz date i godzine, ktora Ci odpowiada. Sesja trwa 60 minut."
            className="text-sm sm:text-base leading-relaxed max-w-[576px] text-[#6B6B6B] [font-family:'Lato',sans-serif]"
          />
        </div>

        {/* Confirmed state */}
        <BookingTransition show={step === 'confirmed' && !!selectedDate && !!selectedTime}>
          <div className="max-w-[448px] mx-auto text-center p-10 rounded-lg bg-white border border-[#E8E4DF] shadow-sm">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(184,148,74,0.1)] text-[#B8944A] mx-auto mb-5">
              <Calendar size={28} />
            </div>
            <h3
              className="text-xl font-black uppercase tracking-tight text-[#2D2D2D] mb-3 [font-family:'Playfair_Display',serif]"
            >
              Termin wybrany
            </h3>
            <p
              className="text-sm text-[#6B6B6B] mb-6 [font-family:'Lato',sans-serif]"
            >
              Twoja sesja zostala wstepnie zarezerwowana. Otrzymasz potwierdzenie na adres e-mail.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center px-7 py-2.5 rounded-lg text-sm font-semibold border border-[#B8944A] text-[#B8944A] transition-colors hover:bg-[rgba(184,148,74,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A]"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Zarezerwuj inny termin
            </button>
          </div>
        </BookingTransition>

        {/* Calendar + time picker side by side */}
        <BookingTransition show={step !== 'confirmed'}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Always show calendar */}
            <BookingCalendar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            {/* Time picker — shown after date is picked */}
            <div className="relative">
              {/* Placeholder — fades out when time picker appears */}
              <div
                className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-[#D4B97A] bg-[rgba(184,148,74,0.04)] p-10 text-center transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{
                  opacity: step === 'time' && selectedDate ? 0 : 1,
                  transform: step === 'time' && selectedDate ? 'scale(0.95)' : 'scale(1)',
                  pointerEvents: step === 'time' && selectedDate ? 'none' : 'auto',
                }}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(184,148,74,0.1)] text-[#B8944A]">
                    <Calendar size={22} />
                  </div>
                  <p
                    className="text-sm text-[#8A8A8A] max-w-[200px]"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Najpierw wybierz date z kalendarza
                  </p>
                </div>
              </div>

              {/* Time picker — fades in */}
              <div
                className="transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]"
                style={{
                  opacity: step === 'time' && selectedDate ? 1 : 0,
                  transform: step === 'time' && selectedDate ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
                  filter: step === 'time' && selectedDate ? 'none' : 'blur(6px)',
                }}
              >
                {selectedDate && (
                  <TimeSlotPicker
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onSelectTime={handleSelectTime}
                    onConfirm={handleConfirm}
                    duration={60}
                  />
                )}
              </div>
            </div>
          </div>
        </BookingTransition>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Services() {
  function scrollToBooking() {
    const el = document.getElementById('rezerwacja');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#2D2D2D]">

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 sm:py-32 overflow-hidden"
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
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(25, 20, 15, 0.68)' }}
          aria-hidden="true"
        />

        <ScrollReveal animation="fade" delay={200} className="relative z-10 max-w-[672px] mx-auto flex flex-col items-center gap-6">
          <SectionBadge label="Uslugi" />

          <EditableText
            section="services"
            fieldPath="heroTitle"
            as="h1"
            placeholder="RAZEM MOZEMY WIECEJ"
            className="text-4xl sm:text-5xl font-black uppercase tracking-tight leading-tight text-white [font-family:'Playfair_Display',serif]"
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
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
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
                priceField="card1Price"
                pricePlaceholder="150 zl - sesja"
                ctaLabel="Wybieram"
                onCta={scrollToBooking}
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
                priceField="card2Price"
                pricePlaceholder="1 200 zl - pakiet"
                ctaLabel="Wybieram"
                onCta={scrollToBooking}
                highlighted
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BOOKING SECTION                                                      */}
      {/* ------------------------------------------------------------------ */}
      <ScrollReveal animation="fade-up">
        <BookingSection />
      </ScrollReveal>

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
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(25, 20, 15, 0.72)' }}
          aria-hidden="true"
        />

        <ScrollReveal animation="fade" duration={900} className="relative z-10 flex flex-col items-center gap-6 max-w-[576px]">
          <EditableText
            section="services"
            fieldPath="ctaTitle"
            as="h2"
            placeholder="GOTOWA NA KOLEJNY KROK?"
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white [font-family:'Playfair_Display',serif]"
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
              onClick={scrollToBooking}
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

            <a
              href="/kontakt"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold border border-white/50 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <EditableText
                section="services"
                fieldPath="ctaBtn2"
                as="span"
                placeholder="Napisz do mnie"
              />
            </a>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
