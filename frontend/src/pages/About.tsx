import { Heart, Leaf, Zap } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableImage } from '@/components/cms/EditableImage';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import ane2Photo from '@/assets/Ane2.jpg';

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

interface ValueCardProps {
  icon: React.ReactNode;
  section: 'about';
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function ValueCard({ icon, section, titleField, titlePlaceholder, descField, descPlaceholder }: ValueCardProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8 rounded-lg bg-[#FAF8F5] border border-[#F0EDE8]">
      <div className="flex items-center justify-center w-14 h-14 rounded-full mb-5 bg-[rgba(184,148,74,0.1)] text-[#B8944A]">
        {icon}
      </div>
      <EditableText
        section={section}
        fieldPath={titleField}
        as="h3"
        placeholder={titlePlaceholder}
        className="text-base font-bold uppercase tracking-wide mb-3 text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
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

interface QualificationCardProps {
  number: number;
  section: 'about';
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function QualificationCard({ number, section, titleField, titlePlaceholder, descField, descPlaceholder }: QualificationCardProps) {
  return (
    <div className="flex gap-5 p-6 rounded-lg bg-white border border-[#E8E4DF]">
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-[#B8944A] text-white [font-family:'Lato',sans-serif]">
        {number}
      </div>
      <div className="flex flex-col gap-1">
        <EditableText
          section={section}
          fieldPath={titleField}
          as="h4"
          placeholder={titlePlaceholder}
          className="text-sm font-bold uppercase tracking-wide text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
        />
        <EditableText
          section={section}
          fieldPath={descField}
          as="p"
          placeholder={descPlaceholder}
          className="text-sm leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
        />
      </div>
    </div>
  );
}

interface CertificationItemProps {
  section: 'about';
  labelField: string;
  labelPlaceholder: string;
  yearField: string;
  yearPlaceholder: string;
}

function CertificationItem({ section, labelField, labelPlaceholder, yearField, yearPlaceholder }: CertificationItemProps) {
  return (
    <li className="flex items-start gap-4 py-4 border-b border-[#F0EDE8]">
      <span className="flex-shrink-0 w-2 h-2 rounded-full mt-2 bg-[#B8944A]" aria-hidden="true" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1">
        <EditableText
          section={section}
          fieldPath={labelField}
          as="span"
          placeholder={labelPlaceholder}
          className="text-sm font-medium text-[#2D2D2D] [font-family:'Lato',sans-serif]"
        />
        <EditableText
          section={section}
          fieldPath={yearField}
          as="span"
          placeholder={yearPlaceholder}
          className="text-xs flex-shrink-0 text-[#8A8A8A] [font-family:'Lato',sans-serif]"
        />
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function About() {
  return (
    <main className="min-h-screen bg-white text-[#2D2D2D]">
      <SEO
        title="O mnie"
        description="Poznaj Anetę — psycholog kliniczny, coach i terapeuta somatyczny. Wieloletnie doświadczenie w pracy z ciałem i transformacji."
        canonical="/o-mnie"
      />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden h-[360px] md:h-[420px]"
        aria-label="Nagłówek strony O mnie"
      >
        {/* Background image */}
        <EditableBackground
          section="about"
          fieldPath="heroBg"
          fallbackSrc="https://images.unsplash.com/photo-1669493032929-791a77069ee4?q=80&w=1920&auto=format&fit=crop"
          className="absolute inset-0"
          aria-hidden={true}
        />
        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.67), rgba(0,0,0,0.27))',
          }}
          aria-hidden="true"
        />

        <ScrollReveal animation="fade" delay={200} duration={800} className="relative z-10 flex flex-col items-center gap-5 px-6 md:px-[120px]">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] [font-family:'Lato',sans-serif]" aria-label="Breadcrumb">
            <span className="text-white/50"><EditableText section="about" fieldPath="breadcrumbHome" as="span" placeholder="Strona główna" /></span>
            <span className="text-white/30">/</span>
            <span className="text-white/80"><EditableText section="about" fieldPath="breadcrumbCurrent" as="span" placeholder="O mnie" /></span>
          </nav>

          <EditableText
            section="about"
            fieldPath="heroTitle"
            as="h1"
            placeholder="POZNAJ MOJĄ HISTORIĘ"
            className="text-4xl sm:text-[48px] font-normal uppercase tracking-[-1px] leading-tight text-white [font-family:'Cormorant_Garamond',serif]"
          />

          <EditableText
            section="about"
            fieldPath="heroSubtitle"
            as="p"
            placeholder="Droga, która doprowadziła mnie do pracy z ludźmi, pełna odkryć, transformacji i głębokiego zrozumienia ludzkiej natury."
            className="text-base leading-relaxed max-w-[640px] text-[#C8D6E5] [font-family:'Lato',sans-serif]"
          />
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ABOUT — PHOTO + BIO                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-white"
        aria-label="Biografia"
      >
        <div className="max-w-[1024px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          {/* Photo */}
          <ScrollReveal animation="scale" className="flex-shrink-0 w-full lg:w-80 xl:w-96">
            <div
              className="relative rounded-[20px] overflow-hidden aspect-[4/5] w-full"
              style={{ boxShadow: '0 20px 60px rgba(184,148,74,0.15)' }}
            >
              <EditableImage
                section="about"
                fieldPath="profilePhoto"
                fallbackSrc={ane2Photo}
                alt="Aneta — psycholog kliniczny i coach"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 rounded-[20px] pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 2px rgba(184,148,74,0.3)' }}
                aria-hidden="true"
              />
            </div>
          </ScrollReveal>

          {/* Bio */}
          <ScrollReveal animation="fade-left" delay={150} className="flex flex-col gap-6 flex-1">
            <SectionBadge label="O mnie" />

            <EditableText
              section="about"
              fieldPath="bioHeading"
              as="h2"
              placeholder="CZEŚĆ, JESTEM ANETA"
              className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
            />

            <EditableText
              section="about"
              fieldPath="bioParagraph1"
              as="p"
              placeholder="Jestem psychologiem klinicznym z wieloletnim doświadczeniem w pracy z osobami poszukującymi głębszej zmiany. Ukończyłam psychologię kliniczną oraz liczne szkolenia z zakresu terapii somatycznej i psychobiologii stresu."
              className="text-sm sm:text-base leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
            />

            <EditableText
              section="about"
              fieldPath="bioParagraph2"
              as="p"
              placeholder="Specjalizuję się w pracy z ciałem — wierzę, że trwała zmiana zaczyna się od nawiązania głębokiego kontaktu z własnym organizmem. Łączę techniki terapii somatycznej z coachingiem transformacyjnym, by wspierać Cię w budowaniu autentycznego życia."
              className="text-sm sm:text-base leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
            />

            <EditableText
              section="about"
              fieldPath="bioParagraph3"
              as="p"
              placeholder="Pracuję z dorosłymi — indywidualnie — online i stacjonarnie. Moją misją jest towarzyszenie Ci w odkrywaniu własnych zasobów i potencjału."
              className="text-sm sm:text-base leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
            />

            <blockquote className="pl-5 border-l-2 border-[#B8944A] mt-2">
              <EditableText
                section="about"
                fieldPath="bioQuote"
                as="p"
                placeholder={'„Zmiana nie zaczyna się w głowie — zaczyna się w ciele i w odważnej decyzji, by siebie wysłuchać."'}
                className="text-base sm:text-lg italic leading-relaxed text-[#B8944A] [font-family:'Cormorant_Garamond',serif]"
              />
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* VALUES — JAK PATRZĘ NA CZŁOWIEKA                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-[#F5F3EF]"
        aria-label="Wartości"
      >
        <div className="max-w-[1024px] mx-auto">
          <ScrollReveal animation="fade-up" className="flex flex-col items-center text-center gap-4 mb-12">
            <SectionBadge label="Moje podejście" />
            <EditableText
              section="about"
              fieldPath="valuesHeading"
              as="h2"
              placeholder="JAK PATRZĘ NA CZŁOWIEKA"
              className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
            />
            <EditableText
              section="about"
              fieldPath="valuesSubtitle"
              as="p"
              placeholder="Moja praca opiera się na trzech filarach, które tworzą spójne i skuteczne podejście do zmiany."
              className="text-sm sm:text-base leading-relaxed max-w-[576px] text-[#6B6B6B] [font-family:'Lato',sans-serif]"
            />
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ScrollReveal animation="fade-up" delay={stagger(0)}>
              <ValueCard
                icon={<Zap size={24} />}
                section="about"
                titleField="value1Title"
                titlePlaceholder="PSYCHOBIOLOGIA"
                descField="value1Desc"
                descPlaceholder="Rozumiem, jak stres i trauma zapisują się w biologii ciała. Pracuję z układem nerwowym, by wspierać jego naturalne procesy regulacji."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <ValueCard
                icon={<Leaf size={24} />}
                section="about"
                titleField="value2Title"
                titlePlaceholder="PRACA Z CIAŁEM"
                descField="value2Desc"
                descPlaceholder="Ciało przechowuje nasze doświadczenia. Przez pracę somatyczną pomagam Ci nawiązać głębszy kontakt z własnymi potrzebami i emocjami."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(2)}>
              <ValueCard
                icon={<Heart size={24} />}
                section="about"
                titleField="value3Title"
                titlePlaceholder="COACHING TRANSFORMACYJNY"
                descField="value3Desc"
                descPlaceholder="Coaching, który idzie w głąb — nie tylko wyznaczamy cele, ale odkrywamy przekonania i wzorce, które dotąd Cię ograniczały."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* QUALIFICATIONS — CZYM SIĘ ZAJMUJĘ                                  */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-white"
        aria-label="Specjalizacje"
      >
        <div className="max-w-[1024px] mx-auto">
          <ScrollReveal animation="fade-up" className="flex flex-col items-center text-center gap-4 mb-12">
            <SectionBadge label="Specjalizacje" />
            <EditableText
              section="about"
              fieldPath="qualHeading"
              as="h2"
              placeholder="CZYM SIĘ ZAJMUJĘ"
              className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
            />
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <ScrollReveal animation="fade-up" delay={stagger(0)}>
              <QualificationCard
                number={1}
                section="about"
                titleField="qual1Title"
                titlePlaceholder="COACHING"
                descField="qual1Desc"
                descPlaceholder="Indywidualny coaching transformacyjny pomagający odkryć własny potencjał, wyznaczyć kierunek i pokonać wewnętrzne blokady."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <QualificationCard
                number={2}
                section="about"
                titleField="qual2Title"
                titlePlaceholder="TERAPIA SOMATYCZNA"
                descField="qual2Desc"
                descPlaceholder="Praca z ciałem jako narzędziem głębokiej zmiany — integracja doświadczeń emocjonalnych i somatycznych."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(2)}>
              <QualificationCard
                number={3}
                section="about"
                titleField="qual3Title"
                titlePlaceholder="KONSULTACJE PSYCHOBIOLOGICZNE"
                descField="qual3Desc"
                descPlaceholder="Analiza wpływu stresu i historii życia na zdrowie i funkcjonowanie układu nerwowego."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(3)}>
              <QualificationCard
                number={4}
                section="about"
                titleField="qual4Title"
                titlePlaceholder="PRACA Z CIAŁEM"
                descField="qual4Desc"
                descPlaceholder="Techniki oddechowe, uważność somatyczna i praca z napięciami — dla głębokiego relaksu i integracji."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CERTIFICATIONS                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-24 bg-[#FAF8F5]"
        aria-label="Wykształcenie i certyfikaty"
      >
        <div className="max-w-[768px] mx-auto">
          <ScrollReveal animation="fade-up" className="flex flex-col items-center text-center gap-4 mb-10">
            <SectionBadge label="Wykształcenie" />
            <EditableText
              section="about"
              fieldPath="certHeading"
              as="h2"
              placeholder="MOJE WYKSZTAŁCENIE I CERTYFIKATY"
              className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#2D2D2D] [font-family:'Cormorant_Garamond',serif]"
            />
          </ScrollReveal>

          <ul className="flex flex-col" aria-label="Lista certyfikatów i wykształcenia">
            <ScrollReveal animation="fade-up" delay={stagger(0)}>
              <CertificationItem
                section="about"
                labelField="cert1Label"
                labelPlaceholder="Magister Psychologii Klinicznej — Uniwersytet Warszawski"
                yearField="cert1Year"
                yearPlaceholder="2009"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <CertificationItem
                section="about"
                labelField="cert2Label"
                labelPlaceholder="Certyfikat Terapeuty Somatycznego — Instytut Somatic Experiencing"
                yearField="cert2Year"
                yearPlaceholder="2015"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(2)}>
              <CertificationItem
                section="about"
                labelField="cert3Label"
                labelPlaceholder="Szkolenie z Psychobiologii Stresu — Institute for Psychobiological Research"
                yearField="cert3Year"
                yearPlaceholder="2017"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(3)}>
              <CertificationItem
                section="about"
                labelField="cert4Label"
                labelPlaceholder="Certyfikowany Coach ICF (ACC) — International Coaching Federation"
                yearField="cert4Year"
                yearPlaceholder="2019"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(4)}>
              <CertificationItem
                section="about"
                labelField="cert5Label"
                labelPlaceholder="Kurs Mindfulness-Based Stress Reduction (MBSR) — Centre for Mindfulness"
                yearField="cert5Year"
                yearPlaceholder="2021"
              />
            </ScrollReveal>
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CTA                                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-20 sm:py-28 overflow-hidden"
        aria-label="Wezwanie do działania"
      >
        <EditableBackground
          section="about"
          fieldPath="ctaBg"
          fallbackSrc="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(30,25,20,0.72)' }}
          aria-hidden="true"
        />

        <ScrollReveal animation="fade" duration={900} className="relative z-10 flex flex-col items-center gap-6 max-w-[576px]">
          <EditableText
            section="about"
            fieldPath="ctaHeading"
            as="h2"
            placeholder="GOTOWA NA PIERWSZY KROK?"
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white [font-family:'Cormorant_Garamond',serif]"
          />
          <EditableText
            section="about"
            fieldPath="ctaText"
            as="p"
            placeholder="Zapraszam na bezpłatną rozmowę wstępną — by razem sprawdzić, czy moje podejście jest właśnie dla Ciebie."
            className="text-sm sm:text-base leading-relaxed text-white/80 [font-family:'Lato',sans-serif]"
          />
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <a
              href="/kontakt"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold bg-[#B8944A] text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
            >
              <EditableText
                section="about"
                fieldPath="ctaBtn1"
                as="span"
                placeholder="Umów bezpłatną rozmowę"
              />
            </a>
            <a
              href="/jak-pracuje"
              className="inline-flex items-center justify-center px-8 py-3 rounded-lg text-sm font-semibold border border-white/50 text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 [font-family:'Lato',sans-serif]"
            >
              <EditableText
                section="about"
                fieldPath="ctaBtn2"
                as="span"
                placeholder="Jak pracuję?"
              />
            </a>
          </div>
        </ScrollReveal>
      </section>
    </main>
  );
}
