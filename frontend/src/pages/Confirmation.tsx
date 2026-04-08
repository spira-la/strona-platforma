import { Link } from 'react-router-dom';
import { Calendar, Heart, Leaf, CheckCircle, ArrowRight } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface NextStepCardProps {
  icon: React.ReactNode;
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function NextStepCard({
  icon,
  titleField,
  titlePlaceholder,
  descField,
  descPlaceholder,
}: NextStepCardProps) {
  return (
    <div className="flex flex-col items-center text-center gap-4 px-6 py-8 bg-white rounded-lg border border-[#E8E4DF] shadow-sm">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A]">
        {icon}
      </div>
      <EditableText
        section="confirmation"
        fieldPath={titleField}
        as="h3"
        className="font-['Cormorant_Garamond'] text-[18px] font-bold text-[#2D2D2D]"
        placeholder={titlePlaceholder}
      />
      <EditableText
        section="confirmation"
        fieldPath={descField}
        as="p"
        className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed"
        placeholder={descPlaceholder}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function ThankYouSection() {
  return (
    <section
      className="bg-[#FAF8F5] pt-16 pb-10 md:pt-24 md:pb-14"
      aria-label="Podziekowanie za zakup"
    >
      <ScrollReveal animation="fade" delay={200} className="max-w-[780px] mx-auto px-6 flex flex-col items-center text-center gap-5">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600">
          <CheckCircle size={32} aria-hidden="true" />
        </div>
        <EditableText
          section="confirmation"
          fieldPath="hero.title"
          as="h1"
          className="font-['Cormorant_Garamond'] text-[32px] md:text-[40px] font-bold text-[#2D2D2D] leading-snug"
          placeholder="Dziekujemy za zakup pakietu!"
        />
        <EditableText
          section="confirmation"
          fieldPath="hero.subtitle"
          as="p"
          className="font-['Lato'] text-[16px] text-[#6B6B6B] leading-[1.7] max-w-[560px]"
          placeholder="Twoja platnosc zostala potwierdzona. Za chwile otrzymasz e-mail z potwierdzeniem i dalszymi instrukcjami."
        />
      </ScrollReveal>
    </section>
  );
}

function OrderSummarySection() {
  return (
    <section className="bg-[#FAF8F5] py-8" aria-label="Podsumowanie zamowienia">
      <ScrollReveal animation="fade-up" delay={300}>
      <div className="max-w-[600px] mx-auto px-6">
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
          }}
        >
          <div className="px-8 py-7 flex flex-col gap-5">
            <EditableText
              section="confirmation"
              fieldPath="order.packageName"
              as="h2"
              className="font-['Cormorant_Garamond'] text-[24px] font-bold text-white"
              placeholder="Pakiet 8 Sesji"
            />
            <div className="flex flex-col gap-3">
              {[
                { labelField: 'order.label.sessions', labelDefault: 'Liczba sesji', valueField: 'order.value.sessions', valueDefault: '8' },
                { labelField: 'order.label.price', labelDefault: 'Cena', valueField: 'order.value.price', valueDefault: '960 zl' },
                { labelField: 'order.label.payment', labelDefault: 'Metoda platnosci', valueField: 'order.value.payment', valueDefault: 'Karta' },
              ].map(({ labelField, labelDefault, valueField, valueDefault }) => (
                <div key={labelField} className="flex items-center justify-between gap-4">
                  <EditableText
                    section="confirmation"
                    fieldPath={labelField}
                    as="span"
                    className="font-['Lato'] text-[14px] text-white/75"
                    placeholder={labelDefault}
                  />
                  <EditableText
                    section="confirmation"
                    fieldPath={valueField}
                    as="span"
                    className="font-['Lato'] text-[14px] font-semibold text-white"
                    placeholder={valueDefault}
                  />
                </div>
              ))}
            </div>
            <div className="border-t border-white/25 pt-4">
              <div className="flex items-center justify-between gap-4">
                <EditableText
                  section="confirmation"
                  fieldPath="order.label.orderNumber"
                  as="span"
                  className="font-['Lato'] text-[13px] text-white/60"
                  placeholder="Numer zamowienia"
                />
                <span className="font-['Lato'] text-[13px] text-white/60 font-mono">
                  #SPR-2026-0001
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </ScrollReveal>
    </section>
  );
}

function NextStepsSection() {
  return (
    <section className="bg-white py-14 md:py-20" aria-label="Kolejne kroki">
      <div className="max-w-[1000px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <EditableText
              section="confirmation"
              fieldPath="steps.title"
              as="h2"
              className="font-['Cormorant_Garamond'] text-[26px] md:text-[34px] font-bold text-[#2D2D2D]"
              placeholder="Co dalej?"
            />
            <div className="w-10 h-0.5 bg-[#B8944A] mt-1" aria-hidden="true" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal animation="fade-up" delay={stagger(0)}>
            <NextStepCard
              icon={<Calendar size={24} aria-hidden="true" />}
              titleField="steps.step1.title"
              titlePlaceholder="Potwierdz swoja rezerwacje"
              descField="steps.step1.desc"
              descPlaceholder="Sprawdz e-mail i kliknij link potwierdzajacy termin pierwszej sesji lub wybierz nowy termin w panelu."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(1)}>
            <NextStepCard
              icon={<Heart size={24} aria-hidden="true" />}
              titleField="steps.step2.title"
              titlePlaceholder="Przygotuj sie na sesje"
              descField="steps.step2.desc"
              descPlaceholder="Zastanow sie, co chcesz omowic. Nie ma zlych odpowiedzi — przyjdz taka/taki, jaka/jaki jestes teraz."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(2)}>
            <NextStepCard
              icon={<Leaf size={24} aria-hidden="true" />}
              titleField="steps.step3.title"
              titlePlaceholder="Zadbaj o siebie miedzy sesjami"
              descField="steps.step3.desc"
              descPlaceholder="Prowadz dziennik, obserwuj swoje reakcje. Zmiana dzieje sie rowniez miedzy spotkaniami."
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function MotivationalCTASection() {
  return (
    <section className="bg-[#FAF8F5] py-14 md:py-20" aria-label="Zacheta do dzialania">
      <ScrollReveal animation="fade">
      <div className="max-w-[680px] mx-auto px-6 flex flex-col items-center text-center gap-6">
        <EditableText
          section="confirmation"
          fieldPath="cta.title"
          as="h2"
          className="font-['Cormorant_Garamond'] text-[26px] md:text-[32px] font-bold text-[#2D2D2D] leading-snug"
          placeholder="Zaczyna sie Twoja piekna podroz do siebie"
        />
        <EditableText
          section="confirmation"
          fieldPath="cta.description"
          as="p"
          className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7]"
          placeholder="Dzieki za zaufanie. Jestesmy tu, by towarzyszyc Ci w kazdym kroku tej drogi. Razem odkryjemy, co jest w Tobie mozliwe."
        />
        <Link
          to="/o-mnie"
          className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8944A] hover:text-[#D4B97A] transition-colors group"
        >
          <EditableText
            section="confirmation"
            fieldPath="cta.link"
            as="span"
            placeholder="Poznaj moje podejscie"
          />
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
      </ScrollReveal>
    </section>
  );
}

function QuoteSection() {
  return (
    <section className="bg-white py-12 md:py-16" aria-label="Cytat">
      <ScrollReveal animation="fade" duration={900}>
      <div className="max-w-[600px] mx-auto px-6 flex flex-col items-center text-center gap-4">
        <div className="w-10 h-0.5 bg-[#B8944A]" aria-hidden="true" />
        <EditableText
          section="confirmation"
          fieldPath="quote.text"
          as="blockquote"
          className="font-['Cormorant_Garamond'] text-[20px] md:text-[22px] italic text-[#2D2D2D] leading-[1.6]"
          placeholder="Kazdy krok, z glebokosci siebie, jest krokiem ku wolnosci."
        />
        <EditableText
          section="confirmation"
          fieldPath="quote.author"
          as="cite"
          className="font-['Lato'] text-[13px] text-[#8A8A8A] not-italic"
          placeholder="Spirala"
        />
        <div className="w-10 h-0.5 bg-[#B8944A]" aria-hidden="true" />
      </div>
      </ScrollReveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Confirmation() {
  return (
    <main>
      <ThankYouSection />
      <OrderSummarySection />
      <NextStepsSection />
      <MotivationalCTASection />
      <QuoteSection />
    </main>
  );
}
