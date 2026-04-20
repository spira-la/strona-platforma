import { Link } from 'react-router-dom';
import {
  Phone,
  Code,
  Globe,
  LayoutDashboard,
  Languages,
  Zap,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function SectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-block font-['Lato'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#B8944A] bg-[#B8944A]/[0.1] rounded-full px-4 py-1.5">
      {label}
    </span>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function FeatureCard({
  icon,
  titleField,
  titlePlaceholder,
  descField,
  descPlaceholder,
}: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-3 p-6 rounded-xl bg-white border border-[#E8E4DF] shadow-sm">
      <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-[#B8944A]/[0.1] text-[#B8944A]">
        {icon}
      </div>
      <EditableText
        section="webDesign"
        fieldPath={titleField}
        as="h3"
        className="font-['Cormorant_Garamond'] text-[18px] font-bold text-[#2D2D2D]"
        placeholder={titlePlaceholder}
      />
      <EditableText
        section="webDesign"
        fieldPath={descField}
        as="p"
        className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed"
        placeholder={descPlaceholder}
      />
    </div>
  );
}

interface StepCardProps {
  icon: React.ReactNode;
  number: string;
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function StepCard({
  icon,
  number,
  titleField,
  titlePlaceholder,
  descField,
  descPlaceholder,
}: StepCardProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8 rounded-xl bg-white border border-[#E8E4DF] shadow-sm relative">
      <span className="absolute -top-3 left-6 font-['Lato'] text-[11px] font-bold text-[#B8944A] bg-white border border-[#E8E4DF] rounded-full px-2.5 py-0.5">
        {number}
      </span>
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A] mb-5">
        {icon}
      </div>
      <EditableText
        section="webDesign"
        fieldPath={titleField}
        as="h3"
        className="font-['Cormorant_Garamond'] text-[17px] font-bold text-[#2D2D2D] mb-3"
        placeholder={titlePlaceholder}
      />
      <EditableText
        section="webDesign"
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

function HeroSection() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden min-h-[500px] md:h-[620px]"
      aria-label="Tworzenie stron internetowych"
    >
      <EditableBackground
        section="webDesign"
        fieldPath="heroBg"
        fallbackSrc="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop"
        className="absolute inset-0"
        aria-hidden={true}
      />
      <EditableOverlay
        section="webDesign"
        fieldPath="heroBg"
        defaultTop={50}
        defaultBottom={75}
      />

      <ScrollReveal
        animation="fade"
        delay={150}
        className="relative z-10 flex flex-col items-center gap-6 max-w-[720px]"
      >
        <SectionBadge label="Web design" />
        <EditableText
          section="webDesign"
          fieldPath="heroTitle"
          as="h1"
          className="font-['Cormorant_Garamond'] text-[2.25rem] md:text-[3rem] font-bold text-white leading-[1.15] tracking-[-0.5px]"
          placeholder="Strona, która opowiada Twoją historię"
        />
        <EditableText
          section="webDesign"
          fieldPath="heroSubtitle"
          as="p"
          className="font-['Lato'] text-[15px] md:text-[17px] text-white/85 leading-[1.7] max-w-[560px]"
          placeholder="Projektuję i wdrażam elegancki, wydajny serwis dla coachów, terapeutów i specjalistów — z panelem CMS, wielojęzycznością i pełnym wsparciem technicznym."
        />
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <a
            href="#kontakt"
            className="inline-flex items-center justify-center px-7 py-3 rounded-lg font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] transition-colors"
          >
            <EditableText
              section="webDesign"
              fieldPath="heroCta"
              as="span"
              placeholder="Porozmawiajmy o projekcie"
            />
          </a>
          <a
            href="#proces"
            className="inline-flex items-center justify-center px-7 py-3 rounded-lg font-['Lato'] text-[14px] font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/30 transition-colors"
          >
            <EditableText
              section="webDesign"
              fieldPath="heroCtaSecondary"
              as="span"
              placeholder="Jak to działa"
            />
          </a>
        </div>
      </ScrollReveal>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section
      className="bg-[#FAF8F5] py-16 md:py-24"
      aria-label="Co zawiera strona"
    >
      <div className="max-w-[1100px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <SectionBadge label="Co otrzymasz" />
            <EditableText
              section="webDesign"
              fieldPath="features.title"
              as="h2"
              className="font-['Cormorant_Garamond'] text-[28px] md:text-[36px] font-bold text-[#2D2D2D]"
              placeholder="Wszystko, czego potrzebujesz, żeby działać w sieci"
            />
            <div className="w-10 h-0.5 bg-[#B8944A] mt-1" aria-hidden="true" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          <ScrollReveal animation="fade-up" delay={stagger(0)}>
            <FeatureCard
              icon={<LayoutDashboard size={20} aria-hidden="true" />}
              titleField="features.cms.title"
              titlePlaceholder="Panel CMS"
              descField="features.cms.desc"
              descPlaceholder="Edytujesz każdy tekst, obraz i gradient wprost ze strony — bez wchodzenia w kod i bez czekania na programistę."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(1)}>
            <FeatureCard
              icon={<Languages size={20} aria-hidden="true" />}
              titleField="features.multilang.title"
              titlePlaceholder="Wielojęzyczność"
              descField="features.multilang.desc"
              descPlaceholder="Gotowa obsługa języków (PL, EN, ES) z przełącznikiem w menu. Dodasz kolejne w kilka minut."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(2)}>
            <FeatureCard
              icon={<Zap size={20} aria-hidden="true" />}
              titleField="features.perf.title"
              titlePlaceholder="Błyskawiczna wydajność"
              descField="features.perf.desc"
              descPlaceholder="Obrazy serwowane z globalnej sieci CDN, optymalizacja WebP i cache — strona wczytuje się w mgnieniu oka."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(3)}>
            <FeatureCard
              icon={<Search size={20} aria-hidden="true" />}
              titleField="features.seo.title"
              titlePlaceholder="SEO od pierwszego dnia"
              descField="features.seo.desc"
              descPlaceholder="Struktura przyjazna Google, meta tagi, sitemap, Open Graph — Twoja strona jest widoczna w wyszukiwarkach."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(4)}>
            <FeatureCard
              icon={<ShieldCheck size={20} aria-hidden="true" />}
              titleField="features.security.title"
              titlePlaceholder="Bezpieczeństwo"
              descField="features.security.desc"
              descPlaceholder="HTTPS, ochrona przed atakami (Cloudflare), szyfrowane logowanie i regularne aktualizacje — śpij spokojnie."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(5)}>
            <FeatureCard
              icon={<Sparkles size={20} aria-hidden="true" />}
              titleField="features.booking.title"
              titlePlaceholder="Rezerwacje i płatności"
              descField="features.booking.desc"
              descPlaceholder="Kalendarz wizyt, integracja ze Stripe (karta, BLIK) i automatyczne potwierdzenia — wszystko wbudowane."
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function ProcessSection() {
  return (
    <section
      id="proces"
      className="bg-white py-16 md:py-24"
      aria-label="Proces tworzenia strony"
    >
      <div className="max-w-[1100px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <SectionBadge label="Proces" />
            <EditableText
              section="webDesign"
              fieldPath="process.title"
              as="h2"
              className="font-['Cormorant_Garamond'] text-[28px] md:text-[36px] font-bold text-[#2D2D2D]"
              placeholder="Jak wygląda tworzenie Twojej strony?"
            />
            <div className="w-10 h-0.5 bg-[#B8944A] mt-1" aria-hidden="true" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <ScrollReveal animation="fade-up" delay={stagger(0)}>
            <StepCard
              icon={<Phone size={24} aria-hidden="true" />}
              number="01"
              titleField="process.step1.title"
              titlePlaceholder="Pierwsza rozmowa"
              descField="process.step1.desc"
              descPlaceholder="Bezpłatna konsultacja — poznajesz moje podejście, opowiadasz o swoich potrzebach i razem ustalamy zakres projektu."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(1)}>
            <StepCard
              icon={<Code size={24} aria-hidden="true" />}
              number="02"
              titleField="process.step2.title"
              titlePlaceholder="Projekt i wdrożenie"
              descField="process.step2.desc"
              descPlaceholder="Tworzę projekt graficzny i wdrażam stronę. Przez cały czas będziemy w kontakcie, a Ty zatwierdzasz każdy etap."
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={stagger(2)}>
            <StepCard
              icon={<Globe size={24} aria-hidden="true" />}
              number="03"
              titleField="process.step3.title"
              titlePlaceholder="Twoja gotowa strona"
              descField="process.step3.desc"
              descPlaceholder="Przekazuję stronę z panelem CMS, szkoleniem i pełnym wsparciem technicznym. Jesteś gotowa/y działać."
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section
      className="relative overflow-hidden py-14 md:py-20"
      aria-label="Cennik"
      style={{
        background:
          'linear-gradient(135deg, #B8944A 0%, #D4B97A 60%, #B8944A 100%)',
      }}
    >
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        <ScrollReveal
          animation="fade"
          delay={200}
          className="flex-1 flex flex-col gap-5 text-center md:text-left"
        >
          <span className="inline-block self-center md:self-start font-['Lato'] text-[11px] font-bold tracking-[0.1em] uppercase text-[#B8944A] bg-white rounded-full px-4 py-1.5">
            Oferta
          </span>
          <EditableText
            section="webDesign"
            fieldPath="pricing.title"
            as="h2"
            className="font-['Cormorant_Garamond'] text-[28px] md:text-[36px] font-bold text-white leading-snug"
            placeholder="Przejrzysta cena, pełny pakiet"
          />
          <EditableText
            section="webDesign"
            fieldPath="pricing.description"
            as="p"
            className="font-['Lato'] text-[15px] text-white/85 leading-[1.7] max-w-[520px]"
            placeholder="Projekt, wdrożenie, CMS, hosting na pierwszy rok i szkolenie — wszystko w jednej cenie. Bez ukrytych opłat."
          />
          <div className="flex items-baseline gap-3">
            <EditableText
              section="webDesign"
              fieldPath="pricing.price"
              as="span"
              className="font-['Cormorant_Garamond'] text-[48px] font-bold text-white"
              placeholder="2 000 zł"
            />
            <EditableText
              section="webDesign"
              fieldPath="pricing.priceNote"
              as="span"
              className="font-['Lato'] text-[15px] text-white/70"
              placeholder="jednorazowo"
            />
          </div>
          <a
            href="#kontakt"
            className="inline-block self-center md:self-start font-['Lato'] text-[14px] font-semibold text-[#B8944A] bg-white hover:bg-[#FAF8F5] rounded-lg px-6 py-3 transition-colors"
          >
            <EditableText
              section="webDesign"
              fieldPath="pricing.cta"
              as="span"
              placeholder="Zapytaj o szczegóły"
            />
          </a>
        </ScrollReveal>

        <div className="md:w-[380px] flex-shrink-0">
          <ul className="flex flex-col gap-2 bg-white/10 border border-white/30 backdrop-blur-sm rounded-lg p-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="flex items-start gap-3 font-['Lato'] text-[14px] text-white/90"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white/30 flex items-center justify-center font-bold text-[11px]">
                  ✓
                </span>
                <EditableText
                  section="webDesign"
                  fieldPath={`pricing.bullet${i}`}
                  as="span"
                  placeholder={
                    i === 1
                      ? 'Indywidualny projekt graficzny'
                      : i === 2
                        ? 'Panel CMS do edycji treści'
                        : i === 3
                          ? 'Wielojęzyczność (PL / EN / ES)'
                          : i === 4
                            ? 'Optymalizacja SEO i wydajność'
                            : 'Wsparcie techniczne przez pierwszy rok'
                  }
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section
      id="kontakt"
      className="bg-[#FAF8F5] py-16 md:py-24"
      aria-label="Porozmawiajmy"
    >
      <div className="max-w-[720px] mx-auto px-6 text-center flex flex-col items-center gap-6">
        <SectionBadge label="Kontakt" />
        <EditableText
          section="webDesign"
          fieldPath="cta.title"
          as="h2"
          className="font-['Cormorant_Garamond'] text-[28px] md:text-[36px] font-bold text-[#2D2D2D]"
          placeholder="Masz pomysł? Zacznijmy od rozmowy"
        />
        <EditableText
          section="webDesign"
          fieldPath="cta.description"
          as="p"
          className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[560px]"
          placeholder="Napisz krótko, co chcesz osiągnąć. Odpowiem w ciągu 24 godzin i umówimy darmową konsultację."
        />
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-1">
          <Link
            to="/kontakt"
            className="inline-flex items-center justify-center px-7 py-3 rounded-lg font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] transition-colors"
          >
            <EditableText
              section="webDesign"
              fieldPath="cta.primary"
              as="span"
              placeholder="Wypełnij formularz kontaktowy"
            />
          </Link>
          <a
            href="mailto:contact@spira-la.com"
            className="inline-flex items-center justify-center px-7 py-3 rounded-lg font-['Lato'] text-[14px] font-semibold text-[#B8944A] border border-[#B8944A] hover:bg-[#B8944A]/[0.06] transition-colors"
          >
            <EditableText
              section="webDesign"
              fieldPath="cta.secondary"
              as="span"
              placeholder="Napisz e-mail"
            />
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WebDesignOffer() {
  return (
    <>
      <SEO
        title="Tworzenie stron internetowych — Spirala"
        description="Eleganckie, wydajne strony z panelem CMS dla coachów, terapeutów i specjalistów. Projekt, wdrożenie i wsparcie techniczne w jednej cenie."
      />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProcessSection />
        <PricingSection />
        <CtaSection />
      </main>
    </>
  );
}
