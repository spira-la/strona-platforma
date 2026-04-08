import { ChevronDown, Compass, Layers, MessageCircle, Shield } from 'lucide-react';
import { useState } from 'react';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import ane3Photo from '@/assets/Ane3.jpg';

// ---------------------------------------------------------------------------
// Small reusable primitives
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

interface PrincipleCardProps {
  icon: React.ReactNode;
  section: 'howIWork';
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function PrincipleCard({ icon, section, titleField, titlePlaceholder, descField, descPlaceholder }: PrincipleCardProps) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-lg bg-[#FAF8F5] border border-[#F0EDE8]">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-[rgba(184,148,74,0.1)] text-[#B8944A]"
        aria-hidden="true"
      >
        {icon}
      </div>
      <EditableText
        section={section}
        fieldPath={titleField}
        as="h3"
        placeholder={titlePlaceholder}
        className="text-base font-bold uppercase tracking-wide text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
      />
      <EditableText
        section={section}
        fieldPath={descField}
        as="p"
        placeholder={descPlaceholder}
        className="text-sm leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
      />
    </div>
  );
}

interface ProcessStepProps {
  number: number;
  isLast: boolean;
  section: 'howIWork';
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function ProcessStep({ number, isLast, section, titleField, titlePlaceholder, descField, descPlaceholder }: ProcessStepProps) {
  return (
    <li className="flex gap-5">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold z-10 bg-[#B8944A] text-white [font-family:'Lato',sans-serif]">
          {number}
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 mt-1 bg-[#E8E4DF]"
            style={{ minHeight: '40px' }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className={`flex flex-col gap-2 ${isLast ? 'pb-0' : 'pb-10'}`}>
        <EditableText
          section={section}
          fieldPath={titleField}
          as="h3"
          placeholder={titlePlaceholder}
          className="text-base font-bold uppercase tracking-wide pt-1.5 text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
        />
        <EditableText
          section={section}
          fieldPath={descField}
          as="p"
          placeholder={descPlaceholder}
          className="text-sm leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
        />
      </div>
    </li>
  );
}

interface FaqItemProps {
  section: 'howIWork';
  questionField: string;
  questionPlaceholder: string;
  answerField: string;
  answerPlaceholder: string;
}

function FaqItem({ section, questionField, questionPlaceholder, answerField, answerPlaceholder }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <li className="rounded-xl overflow-hidden border border-[#E8E4DF]">
      <button
        type="button"
        className={`w-full flex items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-[#FAF8F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A]/50 ${open ? 'bg-[#FAF8F5]' : 'bg-white'}`}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <EditableText
          section={section}
          fieldPath={questionField}
          as="span"
          placeholder={questionPlaceholder}
          className="text-sm font-semibold text-[#2D2D2D] [font-family:'Lato',sans-serif]"
        />
        <ChevronDown
          size={18}
          aria-hidden="true"
          className="flex-shrink-0 text-[#B8944A] transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="px-6 py-4 bg-[#FAF8F5]">
          <EditableText
            section={section}
            fieldPath={answerField}
            as="p"
            placeholder={answerPlaceholder}
            className="text-sm leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
          />
        </div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HowIWork() {
  return (
    <main className="min-h-screen bg-white text-[#2D2D2D]">

      {/* ------------------------------------------------------------------ */}
      {/* HERO — nature image with overlay title                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-32 sm:py-40 overflow-hidden"
        aria-label="Nagłówek strony Jak pracuję"
      >
        <EditableBackground
          section="howIWork"
          fieldPath="heroBg"
          fallbackSrc="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(20,16,10,0.65) 0%, rgba(30,22,8,0.75) 100%)' }}
          aria-hidden="true"
        />

        <ScrollReveal animation="fade" delay={200} className="relative z-10 flex flex-col items-center gap-6 max-w-[672px]">
          <SectionBadge label="Metoda pracy" />

          <EditableText
            section="howIWork"
            fieldPath="heroTitle"
            as="h1"
            placeholder="JAK PRACUJĘ"
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight text-white [font-family:'Playfair_Display',serif]"
          />

          <EditableText
            section="howIWork"
            fieldPath="heroSubtitle"
            as="p"
            placeholder="Moje podejście łączy naukę o ciele i umyśle z praktycznymi narzędziami coachingowymi — tak, by zmiana była trwała i autentyczna."
            className="text-base sm:text-lg leading-relaxed max-w-[576px] text-white/80 [font-family:'Lato',sans-serif]"
          />
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* METHODOLOGY — 2 cards with nature images                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-[#FAF8F5]"
        aria-label="Metodologia"
      >
        <div className="max-w-[1024px] mx-auto">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center text-center gap-4 mb-12">
              <SectionBadge label="Podejście" />
              <EditableText
                section="howIWork"
                fieldPath="methodHeading"
                as="h2"
                placeholder="MOJA METODOLOGIA"
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
              <EditableText
                section="howIWork"
                fieldPath="methodSubtitle"
                as="p"
                placeholder="Łączę podejście somatyczne z psychobiologią i coachingiem transformacyjnym — by dotrzeć do źródeł wzorców, które kierują Twoim życiem."
                className="text-sm sm:text-base leading-relaxed max-w-[576px] text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Card 1 */}
            <ScrollReveal animation="fade-up" delay={stagger(0)} className="rounded-lg overflow-hidden flex flex-col border border-[#E8E4DF] bg-white">
              <div className="relative h-52 overflow-hidden">
                <img
                  src={ane3Photo}
                  alt="Praca z ciałem i układem nerwowym"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(20,16,10,0.45) 0%, transparent 60%)' }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col gap-3 p-6">
                <EditableText
                  section="howIWork"
                  fieldPath="method1Title"
                  as="h3"
                  placeholder="PODEJŚCIE SOMATYCZNE"
                  className="text-base font-bold uppercase tracking-wide text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                />
                <EditableText
                  section="howIWork"
                  fieldPath="method1Desc"
                  as="p"
                  placeholder="Pracuję z sygnałami płynącymi z ciała jako kluczem do rozumienia emocji i wzorców zachowań. Układ nerwowy jest pierwszym miejscem, gdzie zapisuje się każde przeżycie — i pierwszym miejscem prawdziwej zmiany."
                  className="text-sm leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
              </div>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal animation="fade-up" delay={stagger(1)} className="rounded-lg overflow-hidden flex flex-col border border-[#E8E4DF] bg-white">
              <div className="relative h-52 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80"
                  alt="Coaching transformacyjny"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(20,16,10,0.45) 0%, transparent 60%)' }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex flex-col gap-3 p-6">
                <EditableText
                  section="howIWork"
                  fieldPath="method2Title"
                  as="h3"
                  placeholder="COACHING TRANSFORMACYJNY"
                  className="text-base font-bold uppercase tracking-wide text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                />
                <EditableText
                  section="howIWork"
                  fieldPath="method2Desc"
                  as="p"
                  placeholder="Zamiast dawać gotowe odpowiedzi, towarzyszę Ci w odkrywaniu własnych. Razem badamy przekonania, wartości i ograniczające wzorce — i budujemy nowy sposób bycia w świecie."
                  className="text-sm leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PROCESS STEPS — timeline                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-white"
        aria-label="Przebieg procesu"
      >
        <div className="max-w-[768px] mx-auto">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center text-center gap-4 mb-12">
              <SectionBadge label="Jak wygląda współpraca" />
              <EditableText
                section="howIWork"
                fieldPath="processHeading"
                as="h2"
                placeholder="TWOJA DROGA — OD PIERWSZEGO KONTAKTU DO TRANSFORMACJI"
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <ol className="flex flex-col" aria-label="Kroki procesu">
              <ProcessStep
                number={1}
                isLast={false}
                section="howIWork"
                titleField="step1Title"
                titlePlaceholder="BEZPŁATNA ROZMOWA WSTĘPNA"
                descField="step1Desc"
                descPlaceholder="Zaczynamy od 20-minutowej rozmowy online, by sprawdzić, czy moje podejście odpowiada Twoim potrzebom. Nie ma żadnych zobowiązań — to przestrzeń na Twoje pytania."
              />
              <ProcessStep
                number={2}
                isLast={false}
                section="howIWork"
                titleField="step2Title"
                titlePlaceholder="PIERWSZA SESJA DIAGNOSTYCZNA"
                descField="step2Desc"
                descPlaceholder="Pogłębiona sesja, podczas której wspólnie eksplorujemy Twoją sytuację, historię i cele. Buduję wstępny obraz tego, z czym przychodziszy i co chcesz zmienić."
              />
              <ProcessStep
                number={3}
                isLast={false}
                section="howIWork"
                titleField="step3Title"
                titlePlaceholder="REGULARNA PRACA — CYKL SESJI"
                descField="step3Desc"
                descPlaceholder="Typowy cykl to 8–12 sesji, raz na 1–2 tygodnie. Każda sesja to 60–90 minut pracy z ciałem, umysłem i emocjami. Dostosowuję tempo i metody do Twoich potrzeb."
              />
              <ProcessStep
                number={4}
                isLast={true}
                section="howIWork"
                titleField="step4Title"
                titlePlaceholder="INTEGRACJA I ZAMKNIĘCIE CYKLU"
                descField="step4Desc"
                descPlaceholder="Kończymy cykl sesją podsumowującą — konsolidujemy zmiany, planujemy dalszą drogę. Wiele osób decyduje się na kontynuację lub powrót w ważnych momentach życia."
              />
            </ol>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PRINCIPLES — grid of value cards                                    */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-[#F5F3EF]"
        aria-label="Zasady pracy"
      >
        <div className="max-w-[1024px] mx-auto">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center text-center gap-4 mb-12">
              <SectionBadge label="Zasady" />
              <EditableText
                section="howIWork"
                fieldPath="principlesHeading"
                as="h2"
                placeholder="CO JEST DLA MNIE WAŻNE W PRACY"
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <ScrollReveal animation="fade-up" delay={stagger(0)}>
              <PrincipleCard
                icon={<Shield size={22} />}
                section="howIWork"
                titleField="principle1Title"
                titlePlaceholder="BEZPIECZEŃSTWO"
                descField="principle1Desc"
                descPlaceholder="Tworzę przestrzeń, w której możesz być sobą bez oceny i presji — fundament każdej prawdziwej zmiany."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <PrincipleCard
                icon={<Compass size={22} />}
                section="howIWork"
                titleField="principle2Title"
                titlePlaceholder="TWOJE TEMPO"
                descField="principle2Desc"
                descPlaceholder="Nie ma tu jednego uniwersalnego planu. Podążam za Tobą, dostosowując metody i intensywność do aktualnych potrzeb."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(2)}>
              <PrincipleCard
                icon={<Layers size={22} />}
                section="howIWork"
                titleField="principle3Title"
                titlePlaceholder="CAŁOŚCIOWE SPOJRZENIE"
                descField="principle3Desc"
                descPlaceholder="Widzę Cię jako całość — ciało, emocje, przekonania, historia. Praca na jednym poziomie pociąga za sobą zmiany na pozostałych."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(3)}>
              <PrincipleCard
                icon={<MessageCircle size={22} />}
                section="howIWork"
                titleField="principle4Title"
                titlePlaceholder="DIALOG I PARTNERSTWO"
                descField="principle4Desc"
                descPlaceholder="Jestem towarzyszem procesu, nie ekspertem od Twojego życia. Razem szukamy odpowiedzi, które masz w sobie."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FAQ — czego spodziewać się na sesji                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-white"
        aria-label="Pytania i odpowiedzi"
      >
        <div className="max-w-[768px] mx-auto">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center text-center gap-4 mb-10">
              <SectionBadge label="FAQ" />
              <EditableText
                section="howIWork"
                fieldPath="faqHeading"
                as="h2"
                placeholder="CZEGO SPODZIEWAĆ SIĘ NA SESJI?"
                className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
              <EditableText
                section="howIWork"
                fieldPath="faqSubtitle"
                as="p"
                placeholder="Kilka pytań, które najczęściej pojawiają się przed pierwszą sesją."
                className="text-sm sm:text-base leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <ul className="flex flex-col gap-3" aria-label="Lista pytań i odpowiedzi">
            <FaqItem
              section="howIWork"
              questionField="faq1Q"
              questionPlaceholder="Jak wygląda typowa sesja?"
              answerField="faq1A"
              answerPlaceholder="Zaczynamy od check-in — kilku minut na to, by sprawdzić, co dzieje się w ciele i w głowie. Następnie pracujemy z tym, co aktualnie jest dla Ciebie najważniejsze. Sesja trwa 60–90 minut i odbywa się online lub stacjonarnie."
            />
            <FaqItem
              section="howIWork"
              questionField="faq2Q"
              questionPlaceholder="Czy coaching to to samo co terapia?"
              answerField="faq2A"
              answerPlaceholder="Nie — choć się uzupełniają. Terapia skupia się na leczeniu i przepracowaniu przeszłości, coaching na budowaniu pożądanej przyszłości. W mojej pracy łączę oba podejścia, dostosowując je do potrzeb klienta."
            />
            <FaqItem
              section="howIWork"
              questionField="faq3Q"
              questionPlaceholder="Jak szybko można spodziewać się efektów?"
              answerField="faq3A"
              answerPlaceholder="Pierwsze zmiany wiele osób odczuwa już po kilku sesjach — w postaci większej jasności, spokoju lub nowego spojrzenia na sytuację. Głębsza transformacja wymaga czasu i regularnej pracy."
            />
            <FaqItem
              section="howIWork"
              questionField="faq4Q"
              questionPlaceholder="Czy sesje są poufne?"
              answerField="faq4A"
              answerPlaceholder="Tak, absolutnie. Przestrzegam zasad etyki zawodowej i pełnej poufności. Nic, co zostanie powiedziane na sesji, nie opuszcza tej przestrzeni bez Twojej wyraźnej zgody."
            />
            <FaqItem
              section="howIWork"
              questionField="faq5Q"
              questionPlaceholder="Czy mogę pracować z Tobą online?"
              answerField="faq5A"
              answerPlaceholder="Tak — oferuję sesje zarówno online (Google Meet / Zoom), jak i stacjonarnie. Efektywność pracy online jest równie wysoka jak stacjonarnie."
            />
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 overflow-hidden"
        aria-label="Wezwanie do rezerwacji"
      >
        <EditableBackground
          section="howIWork"
          fieldPath="ctaBg"
          fallbackSrc="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(20,14,4,0.78) 0%, rgba(40,28,8,0.72) 100%)' }}
          aria-hidden="true"
        />

        <ScrollReveal animation="fade" duration={900} className="relative z-10 flex flex-col items-center gap-6 max-w-[576px]">
          <EditableText
            section="howIWork"
            fieldPath="ctaHeading"
            as="h2"
            placeholder="ZAREZERWUJ SWOJĄ PIERWSZĄ WIZYTĘ"
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white [font-family:'Playfair_Display',serif]"
          />
          <EditableText
            section="howIWork"
            fieldPath="ctaText"
            as="p"
            placeholder="Zrób pierwszy krok. Bezpłatna rozmowa wstępna nie zobowiązuje — to tylko 20 minut, by sprawdzić, czy jesteśmy dobrym dopasowaniem."
            className="text-sm sm:text-base leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
          />
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <a
              href="/kontakt"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold bg-[#B8944A] text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
            >
              <EditableText
                section="howIWork"
                fieldPath="ctaBtn1"
                as="span"
                placeholder="Umów bezpłatną rozmowę"
              />
            </a>
            <a
              href="/o-mnie"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold border border-white/50 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 [font-family:'Lato',sans-serif]"
            >
              <EditableText
                section="howIWork"
                fieldPath="ctaBtn2"
                as="span"
                placeholder="Poznaj moją historię"
              />
            </a>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
