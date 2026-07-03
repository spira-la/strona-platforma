import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Calendar } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { EditableBackgroundColor } from '@/components/cms/EditableBackgroundColor';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { EditableImage } from '@/components/cms/EditableImage';
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
  eyebrowField?: string;
  eyebrowPlaceholder?: string;
  titleField: string;
  titlePlaceholder: string;
  desc1Field: string;
  desc1Placeholder: string;
  desc2Field: string;
  desc2Placeholder: string;
  desc3Field: string;
  desc3Placeholder: string;
  desc4Field?: string;
  desc4Placeholder?: string;
  desc5Field?: string;
  desc5Placeholder?: string;
  forWhomField?: string;
  forWhomPlaceholder?: string;
  priceField: string;
  pricePlaceholder: string;
  ctaLabel: string;
  onCta: () => void;
  highlighted?: boolean;
}

function ServiceCard({
  eyebrowField,
  eyebrowPlaceholder,
  titleField,
  titlePlaceholder,
  desc1Field,
  desc1Placeholder,
  desc2Field,
  desc2Placeholder,
  desc3Field,
  desc3Placeholder,
  desc4Field,
  desc4Placeholder,
  desc5Field,
  desc5Placeholder,
  forWhomField,
  forWhomPlaceholder,
  priceField,
  pricePlaceholder,
  ctaLabel,
  onCta,
  highlighted = false,
}: ServiceCardProps) {
  return (
    <article
      className={`h-full flex flex-col rounded-2xl p-8 border transition-shadow hover:shadow-lg ${
        highlighted
          ? 'border-[#B8944A] bg-white shadow-[0_4px_24px_rgba(184,148,74,0.12)]'
          : 'border-[#E8E4DF] bg-white'
      }`}
    >
      {eyebrowField && (
        <EditableText
          section="services"
          fieldPath={eyebrowField}
          as="p"
          placeholder={eyebrowPlaceholder}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8944A] mb-2 [font-family:'Lato',sans-serif]"
        />
      )}

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
        {desc4Field && (
          <EditableText
            section="services"
            fieldPath={desc4Field}
            as="p"
            placeholder={desc4Placeholder}
            className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
          />
        )}
        {desc5Field && (
          <EditableText
            section="services"
            fieldPath={desc5Field}
            as="p"
            placeholder={desc5Placeholder}
            className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
          />
        )}

        {forWhomField && (
          <div className="mt-2 border-l-2 border-[#D4B97A] pl-4">
            <p className="text-[13px] font-bold uppercase tracking-wide text-[#2D2D2D] mb-1 [font-family:'Lato',sans-serif]">
              Dla kogo?
            </p>
            <EditableText
              section="services"
              fieldPath={forWhomField}
              as="p"
              placeholder={forWhomPlaceholder}
              className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
            />
          </div>
        )}
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
function BookingTransition({
  children,
  show,
}: {
  children: React.ReactNode;
  show: boolean;
}) {
  return (
    <div
      aria-hidden={!show}
      className="transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] overflow-hidden"
      style={{
        opacity: show ? 1 : 0,
        transform: show
          ? 'translateY(0) scale(1)'
          : 'translateY(16px) scale(0.98)',
        filter: show ? 'none' : 'blur(4px)',
        pointerEvents: show ? 'auto' : 'none',
        // Collapse the element out of the flow when hidden so sibling
        // blocks do not get pushed down by an invisible placeholder.
        maxHeight: show ? undefined : 0,
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
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
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
        <BookingTransition
          show={step === 'confirmed' && !!selectedDate && !!selectedTime}
        >
          <div className="max-w-[448px] mx-auto text-center p-10 rounded-lg bg-white border border-[#E8E4DF] shadow-sm">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(184,148,74,0.1)] text-[#B8944A] mx-auto mb-5">
              <Calendar size={28} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-[#2D2D2D] mb-3 [font-family:'Cormorant_Garamond',serif]">
              Termin wybrany
            </h3>
            <p className="text-sm text-[#6B6B6B] mb-6 [font-family:'Lato',sans-serif]">
              Twoja sesja zostala wstepnie zarezerwowana. Otrzymasz
              potwierdzenie na adres e-mail.
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
                  transform:
                    step === 'time' && selectedDate
                      ? 'scale(0.95)'
                      : 'scale(1)',
                  pointerEvents:
                    step === 'time' && selectedDate ? 'none' : 'auto',
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
                  transform:
                    step === 'time' && selectedDate
                      ? 'translateY(0) scale(1)'
                      : 'translateY(20px) scale(0.97)',
                  filter:
                    step === 'time' && selectedDate ? 'none' : 'blur(6px)',
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
  const navigate = useNavigate();
  const showPurchaseFlow = useFeatureFlag('purchaseFlow');

  function goToBookingFlow() {
    navigate(showPurchaseFlow ? '/rezerwacja' : '/kontakt');
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
                eyebrowField="card1Eyebrow"
                eyebrowPlaceholder="sesja rozpoznania"
                titleField="card1Title"
                titlePlaceholder="Odsłona"
                desc1Field="card1Desc1"
                desc1Placeholder="Jest coś, co Cię uwiera. Nie musisz jeszcze wiedzieć, jak to nazwać ani skąd dokładnie się wzięło. Wystarczy, że czujesz — to już czas, żeby się temu przyjrzeć."
                desc2Field="card1Desc2"
                desc2Placeholder="Odsłona to godzina tylko dla Ciebie. Przestrzeń, w której to, co niewidoczne, zaczyna nabierać kształtu. Nie przychodzisz z gotowym tematem ani precyzyjną diagnozą — przychodzisz z tym, co aktualnie najbardziej ciąży, nie daje spokoju, wraca w tych samych momentach. Ja umiem to rozpoznać, nawet jeśli Ty jeszcze nie potrafisz tego nazwać."
                desc3Field="card1Desc3"
                desc3Placeholder="Razem odkryjemy, co naprawdę stoi za tą trudnością. Nie pod powierzchnią pierwszego wrażenia, ale głębiej — tam, gdzie mieszkają przekonania, blokady i wzorce, które działają po cichu, w tle Twojego życia. Bo to, co uwiera dzisiaj, ma zwykle korzenie znacznie starsze niż sama sytuacja."
                desc4Field="card1Desc4"
                desc4Placeholder="Nie dostaniesz ode mnie ogólnej rady, którą mogłabyś przeczytać wszędzie. Dostaniesz odpowiedź, która jest Twoja — bo to Ty ją niesiesz w sobie, tylko potrzebujesz kogoś, kto pomoże Ci ją odsłonić."
                forWhomField="card1ForWhom"
                forWhomPlaceholder='Dla Ciebie, jeśli masz jedno konkretne "uwiera" i chcesz w końcu zobaczyć, co się za nim kryje.'
                priceField="card1Price"
                pricePlaceholder="150 zl - sesja"
                ctaLabel="Wybieram"
                onCta={goToBookingFlow}
              />
            </ScrollReveal>

            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <ServiceCard
                eyebrowField="card2Eyebrow"
                eyebrowPlaceholder="pełny cykl zmiany"
                titleField="card2Title"
                titlePlaceholder="Spirala przemiany"
                desc1Field="card2Desc1"
                desc1Placeholder="Jest taki moment, kiedy już wiesz, że czas przestać czekać. Że ta zmiana, o której myślisz od miesięcy, nie przyjdzie sama. Wtedy zaczyna się Spirala Przemiany."
                desc2Field="card2Desc2"
                desc2Placeholder="To sześć spotkań rozłożonych na trzy miesiące — każde po godzinie, każde kolejny krok w głąb. Bo prawdziwa praca nie mieści się w jednej rozmowie. Potrzebuje czasu i odwagi, żeby naprawdę na siebie spojrzeć — nie po to, żeby wrócić do dawna, ale żeby dojść do miejsca, w którym jeszcze nie byłaś."
                desc3Field="card2Desc3"
                desc3Placeholder="Między sesjami nie zostajesz sama. Towarzyszę Ci na WhatsApp, dostajesz konkretne ćwiczenia dopasowane do tego, co właśnie się w Tobie dzieje. Bo ciało pamięta wszystko, a umysł jest plastyczny — zmiana, która przychodzi z prawdziwego zrozumienia siebie, po prostu zostaje."
                desc4Field="card2Desc4"
                desc4Placeholder="Sięgamy tam, gdzie wzorce się zaczęły — do relacji z rodzicami, dzieciństwa, a czasem jeszcze wcześniej, do samych początków Twojego życia. Nazywamy to, co dotąd nie miało imienia. I rozplątujemy, krok po kroku, to, co przez lata było splątane."
                desc5Field="card2Desc5"
                desc5Placeholder="W pakiecie oszczędzasz na cenie — a zyskujesz coś ważniejszego: ciągłość. Terminy ustalamy elastycznie, wszystko dzieje się w Twoim tempie."
                forWhomField="card2ForWhom"
                forWhomPlaceholder="Dla tych, którzy wiedzą już, że chcą konkretnej zmiany — i chcą zrobić to porządnie, zaangażować się w pełni."
                priceField="card2Price"
                pricePlaceholder="1 200 zl - pakiet"
                ctaLabel="Wybieram pakiet"
                onCta={goToBookingFlow}
                highlighted
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* KOMPAS WEWNETRZNY — coaching w drodze                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative overflow-hidden px-6 py-16 sm:py-24"
        aria-label="Kompas wewnetrzny"
      >
        <EditableBackgroundColor
          section="services"
          fieldPath="compassBg"
          defaultColor="#1F2A1D"
        />
        <div className="relative z-10 max-w-[1024px] mx-auto">
          <ScrollReveal animation="fade-up">
            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-12 items-center">
              {/* Text column */}
              <div className="order-2 lg:order-1 flex flex-col gap-4">
                <span
                  className="inline-block self-start px-4 py-1 text-xs font-semibold uppercase tracking-widest rounded-full border border-[#D4B97A] text-[#D4B97A] bg-[rgba(212,185,122,0.1)]"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <EditableText
                    section="services"
                    fieldPath="compassBadge"
                    placeholder="super spersonalizowana oferta"
                  />
                </span>

                <EditableText
                  section="services"
                  fieldPath="compassTitle"
                  as="h3"
                  placeholder="Kompas wewnętrzny"
                  className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white [font-family:'Cormorant_Garamond',serif]"
                />

                <EditableText
                  section="services"
                  fieldPath="compassSubtitle"
                  as="p"
                  placeholder="transformacja na beskidzkim szlaku"
                  className="text-base sm:text-lg italic text-[#D4B97A] [font-family:'Lato',sans-serif]"
                />

                <div className="flex flex-col gap-3 mt-2">
                  <EditableText
                    section="services"
                    fieldPath="compassP1"
                    as="p"
                    placeholder="Jesteś kobietą, która czuje więcej w lesie niż w czterech ścianach gabinetu. Górski grzbiet, szum drzew, ścieżka, która się nie kończy — to Twój żywioł. Jeśli poznawanie siebie idzie Ci lepiej w ruchu niż w bezruchu, ta oferta jest stworzona dla Ciebie. Dosłownie — bo zaplanuję ją od zera, dopasowaną do Twojego tempa, Twoich preferencji i miejsca, które wybierzesz."
                    className="text-[15px] leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
                  />
                  <EditableText
                    section="services"
                    fieldPath="compassP2"
                    as="p"
                    placeholder="Masz ochotę iść grzbietem przez Pieniny? Bardzo proszę. Wolisz dziksze, mniej uczęszczane ścieżki Beskidu Niskiego? To miód na moje serce. Gorce, Babia Góra, bieszczadzkie połoniny — wybór jest ogromny, a każda z tych gór niesie inną energię."
                    className="text-[15px] leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
                  />
                  <EditableText
                    section="services"
                    fieldPath="compassP3"
                    as="p"
                    placeholder="Na tej wyprawie idziesz Ty — ze swoimi wyzwaniami, bolączkami, sprawami, w których utknęłaś i po prostu potrzebujesz kogoś obok. Kogoś, kto spojrzy z innej perspektywy. Kto Cię przez to przeprowadzi. Kogoś z doświadczeniem, wiedzą i intuicją, kto zaprowadzi Cię tam, gdzie sama dotrzeć nie umiałaś."
                    className="text-[15px] leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
                  />
                  <EditableText
                    section="services"
                    fieldPath="compassP4"
                    as="p"
                    placeholder="Coaching w drodze to jednodniowy wypad w góry lesiste."
                    className="text-[15px] leading-relaxed font-bold text-white [font-family:'Lato',sans-serif]"
                  />
                  <EditableText
                    section="services"
                    fieldPath="compassP5"
                    as="p"
                    placeholder="W Tatry Cię nie zabiorę — mam lęk wysokości, a poza tym ostra wspinaczka nie sprzyja rozmowom ramię w ramię. Ale to żadna strata. Beskidy dają nam tyle możliwości, że starczy na lata."
                    className="text-[15px] leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
                  />
                  <EditableText
                    section="services"
                    fieldPath="compassP6"
                    as="p"
                    placeholder="Skąd pomysł, by połączyć pracę z pasją?"
                    className="text-[15px] leading-relaxed font-bold text-white [font-family:'Lato',sans-serif]"
                  />
                  <EditableText
                    section="services"
                    fieldPath="compassP7"
                    as="p"
                    placeholder="Bo w górach jest wszystko, co kocham. Po śmierci rodziców to właśnie tam koiłam zranione serce i przeżywałam swoją samotność — przemierzając szlaki od schroniska do schroniska. W ten sposób przełamałam wiele lęków i zbudowałam w sobie poczucie bezpieczeństwa. Przez trzy lata mieszkałam w Beskidzie Niskim i nigdy — ani wcześniej, ani później — nie byłam tak połączona z naturą. A natura to najlepsze lekarstwo na wszystko. Myśli stają się klarowniejsze, problemy — mniejsze i możliwe do rozwiązania. Natura przypomina, że to tylko problem w Twojej głowie. I dodam jeszcze jedno: wyzwania, które stanęły na Twojej drodze, są do rozwiązania — teraz, przez Ciebie. Ty znajdziesz najlepsze rozwiązanie dla tego, z czym się dziś zmagasz. A ja z przyjemnością Ci w tym potowarzyszę — będę wspierać Cię w zmianie perspektywy, w innym spojrzeniu na to, co się dzieje. Wtedy rozwiązania przychodzą same. I jak się później okazuje — są prostsze, niż mogło się wydawać."
                    className="text-[15px] leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
                  />
                  <EditableText
                    section="services"
                    fieldPath="compassP8"
                    as="p"
                    placeholder="Poczułaś to? Tu decyzja nie zapada w głowie. To trzeba poczuć. A ja już jestem — i przebieram nogami, żeby stworzyć piękny plan na nasze wspólne wyjście w Karpaty."
                    className="text-[15px] leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
                  />
                </div>

                <button
                  type="button"
                  onClick={goToBookingFlow}
                  className="inline-flex items-center justify-center self-start mt-4 px-7 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A]"
                  style={{
                    background:
                      'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                    fontFamily: "'Lato', sans-serif",
                  }}
                >
                  <EditableText
                    section="services"
                    fieldPath="compassCtaLabel"
                    as="span"
                    placeholder="Zaplanuj wyprawę"
                  />
                </button>
              </div>

              {/* Image column */}
              <div className="order-1 lg:order-2 h-64 lg:h-full min-h-[320px] overflow-hidden rounded-lg">
                <EditableImage
                  section="services"
                  fieldPath="compassImage"
                  fallbackSrc="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1000&q=80"
                  alt="Szlak w górach leśnych"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BOOKING SECTION — hidden until purchaseFlow flag is enabled         */}
      {/* ------------------------------------------------------------------ */}
      {showPurchaseFlow && (
        <ScrollReveal animation="fade-up">
          <BookingSection />
        </ScrollReveal>
      )}

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
              onClick={goToBookingFlow}
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
