import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SEO } from '@/components/shared/SEO';
import { ArrowRight, ShieldCheck, Lock, Heart } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import { SplitText } from '@/components/shared/SplitText';
import { GoldLine } from '@/components/shared/GoldLine';
import { blogsClient, type BlogPost } from '@/clients/blogs.client';
import ane1Photo from '@/assets/Ane1.jpg';

const BLOG_DEFAULT_COVER =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop';

function formatBlogDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

interface SectionBadgeProps {
  children: React.ReactNode;
}

function SectionBadge({ children }: SectionBadgeProps) {
  return (
    <span className="inline-block font-['Lato'] text-[12px] font-semibold tracking-[0.08em] uppercase text-[#B8944A] bg-[#B8944A]/[0.125] rounded-full px-4 py-1.5">
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 1. Hero Section
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center h-[500px] md:h-[620px] overflow-hidden"
      aria-label="Sekcja główna"
    >
      {/* Background image */}
      <EditableBackground
        section="hero"
        fieldPath="heroBg"
        fallbackSrc="https://images.unsplash.com/photo-1744192876531-f00759ed9c57?q=80&w=2070&auto=format&fit=crop"
        className="absolute inset-0"
        aria-hidden={true}
      />

      {/* Dark gradient overlay — CMS-editable (top/bottom opacity) */}
      <EditableOverlay
        section="hero"
        fieldPath="heroBg"
        defaultTop={60}
        defaultBottom={80}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-16 md:py-0 max-w-[900px] mx-auto gap-6">
        <SplitText
          text="Odkryj swoją wewnętrzną siłę i rozpocznij drogę ku zmianie"
          className="font-['Cormorant_Garamond'] text-[2rem] md:text-[3rem] font-bold text-white leading-[1.2] tracking-[-0.5px] md:tracking-[-1px] max-w-[800px]"
          delay={100}
          staggerInterval={50}
          duration={800}
          cmsSection="hero"
          cmsField="title"
        />

        <ScrollReveal animation="blur" delay={400} duration={900}>
          <EditableText
            section="hero"
            fieldPath="subtitle"
            as="p"
            className="font-['Lato'] text-[15px] md:text-[18px] text-white/80 leading-[1.6] max-w-[650px]"
            placeholder="Terapia i coaching, które pomogą Ci odnaleźć równowagę, zrozumieć siebie i żyć w harmonii z naturą."
          />
        </ScrollReveal>

        <ScrollReveal animation="fade-up" delay={700} duration={800}>
          <Link
            to="/uslugi"
            className="mt-2 inline-flex items-center gap-2 font-['Lato'] text-[15px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] active:bg-[#7A6028] transition-colors duration-200 rounded-full px-10 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
            aria-label="Zarezerwuj wizytę"
          >
            <EditableText
              section="hero"
              fieldPath="ctaLabel"
              placeholder="Zarezerwuj wizytę"
            />
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. About Preview Section
// ---------------------------------------------------------------------------

function AboutSection() {
  return (
    <section
      className="bg-white py-16 md:py-20 px-6 md:px-[120px]"
      aria-labelledby="about-heading"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-[60px]">
        {/* Image */}
        <ScrollReveal
          animation="clip-left"
          delay={300}
          className="flex-shrink-0 w-full md:w-[480px]"
        >
          <EditableImage
            section="about"
            fieldPath="photo"
            fallbackSrc={ane1Photo}
            alt="Aneta — terapeutka i coach"
            className="object-cover rounded-[20px]"
            containerClassName="w-full md:w-[480px] h-[360px] md:h-[520px] rounded-[20px]"
          />
        </ScrollReveal>

        {/* Text */}
        <ScrollReveal
          animation="clip-right"
          delay={500}
          className="flex flex-col items-start gap-5 flex-1"
        >
          <SectionBadge>
            <EditableText
              section="about"
              fieldPath="badge"
              placeholder="O mnie"
            />
          </SectionBadge>

          <EditableText
            section="about"
            fieldPath="heading"
            as="h2"
            id="about-heading"
            className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.25rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px]"
            placeholder="CZEŚĆ. JESTEM ANETA"
          />

          <EditableText
            section="about"
            fieldPath="paragraph1"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7]"
            placeholder="Jestem terapeutką i coachem z wieloletnim doświadczeniem. Pomagam osobom przejść przez trudne momenty życia, odnaleźć wewnętrzną siłę i zbudować głębszą relację ze sobą. Moja praca opiera się na szacunku, empatii i głębokim zrozumieniu ludzkiej natury."
          />

          <EditableText
            section="about"
            fieldPath="paragraph2"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7]"
            placeholder="Wierzę, że każdy człowiek nosi w sobie ogromny potencjał. Moją rolą jest towarzyszenie w jego odkrywaniu — krok po kroku, w bezpiecznej przestrzeni, w rytmie natury."
          />

          <EditableText
            section="about"
            fieldPath="quote"
            as="blockquote"
            className="font-['Cormorant_Garamond'] text-[18px] italic text-[#B8944A] leading-[1.5] border-l-2 border-[#B8944A] pl-4"
            placeholder='"Prawdziwa zmiana zaczyna się od odwagi spotkania z samą sobą."'
          />

          <Link
            to="/o-mnie"
            className="mt-1 inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] active:bg-[#7A6028] transition-colors duration-200 rounded-full px-8 py-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
          >
            <EditableText
              section="about"
              fieldPath="ctaLabel"
              placeholder="Czytam dalej"
            />
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. How I Work Section
// ---------------------------------------------------------------------------

interface WorkStepProps {
  number: number;
  fieldBase: string;
  defaultTitle: string;
  defaultDescription: string;
}

function WorkStepCard({
  number,
  fieldBase,
  defaultTitle,
  defaultDescription,
}: WorkStepProps) {
  return (
    <article className="border border-[#E8E4DF] rounded-[12px] p-8 flex flex-col gap-4">
      <div
        className="w-10 h-10 rounded-full bg-[#B8944A] flex items-center justify-center text-white font-['Lato'] text-[15px] font-bold flex-shrink-0"
        aria-label={`Krok ${number}`}
      >
        {number}
      </div>

      <EditableText
        section="howIWork"
        fieldPath={`${fieldBase}Title`}
        as="h3"
        className="font-['Cormorant_Garamond'] text-[18px] font-bold text-[#2D2D2D]"
        placeholder={defaultTitle}
      />

      <EditableText
        section="howIWork"
        fieldPath={`${fieldBase}Description`}
        as="p"
        className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-[1.6]"
        placeholder={defaultDescription}
      />
    </article>
  );
}

const WORK_STEPS: WorkStepProps[] = [
  {
    number: 1,
    fieldBase: 'step1',
    defaultTitle: 'BEZPIECZNA PRZESTRZEŃ',
    defaultDescription:
      'Tworzymy miejsce, w którym możesz być w pełni sobą — bez oceniania, bez presji. Zaufanie i poczucie bezpieczeństwa to fundament naszej pracy.',
  },
  {
    number: 2,
    fieldBase: 'step2',
    defaultTitle: 'ODKRYWANIE WZORCÓW',
    defaultDescription:
      'Razem przyglądamy się powtarzającym się schematom w Twoim życiu. Rozumienie korzeni trudności to pierwszy krok ku zmianie.',
  },
  {
    number: 3,
    fieldBase: 'step3',
    defaultTitle: 'GŁĘBOKA PRACA',
    defaultDescription:
      'Sięgamy do głębszych warstw — emocji, przekonań, potrzeb. Pracujemy z tym, co naprawdę ważne, w tempie, które jest dla Ciebie odpowiednie.',
  },
  {
    number: 4,
    fieldBase: 'step4',
    defaultTitle: 'INTEGRACJA I WZROST',
    defaultDescription:
      'Nowe rozumienie zamienia się w realne zmiany. Wychodzisz z sesjami nie tylko z wglądami, ale z konkretnymi narzędziami do codziennego życia.',
  },
];

function HowIWorkSection() {
  return (
    <section
      className="bg-[#F5F3EF] py-16 md:py-20 px-6 md:px-[120px]"
      aria-labelledby="how-i-work-heading"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-10">
        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          className="flex flex-col items-center gap-4 text-center"
        >
          <SectionBadge>
            <EditableText
              section="howIWork"
              fieldPath="badge"
              placeholder="Proces"
            />
          </SectionBadge>

          <EditableText
            section="howIWork"
            fieldPath="heading"
            as="h2"
            id="how-i-work-heading"
            className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.25rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px]"
            placeholder="JAK PRACUJĘ"
          />

          <EditableText
            section="howIWork"
            fieldPath="description"
            as="p"
            className="font-['Lato'] text-[16px] text-[#6B6B6B] leading-[1.7] max-w-[640px]"
            placeholder="Moja metoda pracy łączy różne podejścia terapeutyczne, dostosowane do Twoich indywidualnych potrzeb. Każda sesja to unikalny proces odkrywania."
          />

          <EditableText
            section="howIWork"
            fieldPath="subdescription"
            as="p"
            className="font-['Lato'] text-[14px] text-[#8A8A8A] leading-[1.7] max-w-[800px]"
            placeholder="Niezależnie od tego, z czym przychodzisz — trudem w relacjach, poczuciem braku sensu, lękiem, czy pragnieniem głębszej zmiany — razem znajdziemy drogę, która jest właśnie Twoja."
          />

          <GoldLine width={48} height={2} delay={200} />
        </ScrollReveal>

        {/* Steps grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5">
          {WORK_STEPS.map((step, i) => (
            <ScrollReveal
              key={step.number}
              animation="clip-up"
              delay={stagger(i)}
            >
              <WorkStepCard {...step} />
            </ScrollReveal>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/jak-pracuje"
          className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] active:bg-[#7A6028] transition-colors duration-200 rounded-full px-8 py-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
        >
          <EditableText
            section="howIWork"
            fieldPath="ctaLabel"
            placeholder="Czytam dalej"
          />
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Services Preview Section
// ---------------------------------------------------------------------------

interface ServiceCardProps {
  fieldBase: string;
  imageUrl: string;
  imageAlt: string;
  imageField: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultPrice: string;
  defaultCta: string;
  href: string;
}

function ServiceCard({
  fieldBase,
  imageUrl,
  imageAlt,
  imageField,
  defaultTitle,
  defaultDescription,
  defaultPrice,
  defaultCta,
  href,
}: ServiceCardProps) {
  return (
    <article className="flex flex-col border border-[#E8E4DF] rounded-[12px] overflow-hidden">
      <EditableImage
        section="home"
        fieldPath={imageField}
        fallbackSrc={imageUrl}
        alt={imageAlt}
        className="w-full h-[240px] object-cover"
      />
      <div className="flex flex-col gap-3 p-8 flex-1">
        <EditableText
          section="services"
          fieldPath={`${fieldBase}Title`}
          as="h3"
          className="font-['Cormorant_Garamond'] text-[22px] font-bold text-[#2D2D2D] leading-[1.2]"
          placeholder={defaultTitle}
        />
        <EditableText
          section="services"
          fieldPath={`${fieldBase}Description`}
          as="p"
          className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-[1.7] flex-1"
          placeholder={defaultDescription}
        />
        <EditableText
          section="services"
          fieldPath={`${fieldBase}Price`}
          as="p"
          className="font-['Cormorant_Garamond'] text-[24px] font-bold text-[#B8944A]"
          placeholder={defaultPrice}
        />
        <Link
          to={href}
          className="mt-1 inline-flex items-center gap-2 font-['Lato'] text-[13px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] active:bg-[#7A6028] transition-colors duration-200 rounded-full px-6 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2 self-start"
        >
          <EditableText
            section="services"
            fieldPath={`${fieldBase}Cta`}
            placeholder={defaultCta}
          />
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function ServicesSection() {
  return (
    <section
      className="bg-white py-16 md:py-20 px-6 md:px-[120px]"
      aria-labelledby="services-heading"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-10">
        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          className="flex flex-col items-center gap-4 text-center"
        >
          <SectionBadge>
            <EditableText
              section="services"
              fieldPath="badge"
              placeholder="Usługi"
            />
          </SectionBadge>

          <EditableText
            section="services"
            fieldPath="heading"
            as="h2"
            id="services-heading"
            className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.25rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px]"
            placeholder="WYBIERZ SWOJĄ ŚCIEŻKĘ"
          />

          <EditableText
            section="services"
            fieldPath="description"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[640px]"
            placeholder="Oferuję dwie formy współpracy — dopasowane do Twoich potrzeb i tempa zmiany. Każda sesja jest przestrzenią tylko dla Ciebie."
          />
        </ScrollReveal>

        {/* Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
          <ScrollReveal animation="blur" delay={stagger(0)}>
            <ServiceCard
              fieldBase="card1"
              imageUrl="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1000&auto=format&fit=crop"
              imageAlt="Sesja indywidualna — leśna ścieżka"
              imageField="serviceCard1Img"
              defaultTitle="Sesja indywidualna"
              defaultDescription="Jednorazowa sesja terapeutyczna lub coachingowa trwająca 60 minut. Idealna na start lub przy konkretnej potrzebie w danym momencie życia."
              defaultPrice="250 zł / sesja"
              defaultCta="Rezerwuję sesję"
              href="/uslugi"
            />
          </ScrollReveal>
          <ScrollReveal animation="blur" delay={stagger(1)}>
            <ServiceCard
              fieldBase="card2"
              imageUrl="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop"
              imageAlt="Pakiet sesji — łąka o świcie"
              imageField="serviceCard2Img"
              defaultTitle="Pakiet sesji"
              defaultDescription="Cykl 5 sesji z rabatową ceną — dla osób gotowych na głębszą, ciągłą pracę. Regularność sprzyja trwałej zmianie i budowaniu wewnętrznej stabilności."
              defaultPrice="1 100 zł / 5 sesji"
              defaultCta="Wybieram pakiet"
              href="/uslugi"
            />
          </ScrollReveal>
        </div>

        {/* Bottom CTA block */}
        <div className="mt-4 flex flex-col items-center gap-4 text-center">
          <SplitText
            text="Chcesz mnie poznać?"
            className="font-['Cormorant_Garamond'] text-[26px] md:text-[28px] italic text-[#2D2D2D]"
            delay={0}
            staggerInterval={80}
            duration={900}
            cmsSection="services"
            cmsField="meetTitle"
          />
          <EditableText
            section="services"
            fieldPath="bottomCtaDescription"
            as="p"
            className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-[1.7] max-w-[480px]"
            placeholder="Oferuję bezpłatną 20-minutową rozmowę wstępną. To dobry moment, aby sprawdzić, czy moje podejście jest tym, czego szukasz."
          />
          <Link
            to="/kontakt"
            className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] active:bg-[#7A6028] transition-colors duration-200 rounded-full px-8 py-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
          >
            <EditableText
              section="services"
              fieldPath="bottomCtaLabel"
              placeholder="Piszę do Ciebie"
            />
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Testimonials Section
// ---------------------------------------------------------------------------

interface TestimonialProps {
  fieldBase: string;
  defaultQuote: string;
  defaultAuthor: string;
  defaultRole: string;
  avatarInitial: string;
}

function TestimonialCard({
  fieldBase,
  defaultQuote,
  defaultAuthor,
  defaultRole,
  avatarInitial,
}: TestimonialProps) {
  return (
    <article className="flex flex-col gap-4 bg-[#FAF8F5] rounded-[8px] p-7">
      {/* Decorative quote mark */}
      <span
        className="font-['Cormorant_Garamond'] text-[48px] text-[#B8944A] leading-none select-none"
        aria-hidden="true"
      >
        "
      </span>

      <EditableText
        section="testimonials"
        fieldPath={`${fieldBase}Quote`}
        as="p"
        className="font-['Lato'] text-[15px] text-[#2D2D2D] leading-[1.6] flex-1"
        placeholder={defaultQuote}
      />

      {/* Author */}
      <div className="flex items-center gap-3 mt-2">
        <div
          className="w-10 h-10 rounded-full bg-[#B8944A]/20 flex items-center justify-center text-[#B8944A] font-['Lato'] text-[14px] font-bold flex-shrink-0"
          aria-hidden="true"
        >
          {avatarInitial}
        </div>
        <div className="flex flex-col">
          <EditableText
            section="testimonials"
            fieldPath={`${fieldBase}Author`}
            as="span"
            className="font-['Lato'] text-[14px] font-semibold text-[#2D2D2D]"
            placeholder={defaultAuthor}
          />
          <EditableText
            section="testimonials"
            fieldPath={`${fieldBase}Role`}
            as="span"
            className="font-['Lato'] text-[12px] text-[#8A8A8A]"
            placeholder={defaultRole}
          />
        </div>
      </div>
    </article>
  );
}

const TESTIMONIALS: TestimonialProps[] = [
  {
    fieldBase: 'testimonial1',
    defaultQuote:
      'Praca z Anetą zmieniła moje życie. Po raz pierwszy naprawdę poczułam, że jestem słyszana i rozumiana. Każda sesja to głęboka podróż w siebie.',
    defaultAuthor: 'Marta K.',
    defaultRole: 'Klientka, terapia indywidualna',
    avatarInitial: 'M',
  },
  {
    fieldBase: 'testimonial2',
    defaultQuote:
      'Dzięki coachingowi z Anetą odkryłam wzorce, które przez lata blokowały mój rozwój. Teraz działam świadomie i z pełną energią.',
    defaultAuthor: 'Karolina W.',
    defaultRole: 'Klientka, coaching transformacyjny',
    avatarInitial: 'K',
  },
  {
    fieldBase: 'testimonial3',
    defaultQuote:
      'Aneta potrafi stworzyć przestrzeń, w której można dotknąć nawet najtrudniejszych tematów. Wychodzę z każdej sesji z nowym światłem.',
    defaultAuthor: 'Joanna P.',
    defaultRole: 'Klientka, pakiet sesji',
    avatarInitial: 'J',
  },
];

function TestimonialsSection() {
  return (
    <section
      className="bg-[#F5F3EF] py-16 md:py-20 px-6 md:px-[120px]"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-10">
        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          className="flex flex-col items-center gap-4 text-center"
        >
          <SectionBadge>
            <EditableText
              section="testimonials"
              fieldPath="badge"
              placeholder="Opinie klientek"
            />
          </SectionBadge>

          <EditableText
            section="testimonials"
            fieldPath="heading"
            as="h2"
            id="testimonials-heading"
            className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.25rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px] text-center"
            placeholder="CO MÓWIĄ OSOBY, Z KTÓRYMI PRACUJĘ"
          />

          <EditableText
            section="testimonials"
            fieldPath="description"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[640px] text-center"
            placeholder="Każda historia jest wyjątkowa — ale łączy je jedno: odwaga, by zajrzeć w głąb siebie."
          />
        </ScrollReveal>

        {/* Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <ScrollReveal
              key={t.fieldBase}
              animation="clip-up"
              delay={stagger(i, 200)}
            >
              <TestimonialCard {...t} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 6. Blog Preview Section
// ---------------------------------------------------------------------------

interface FeaturedBlogCardProps {
  post: BlogPost;
  locale: string;
}

function FeaturedBlogCard({ post, locale }: FeaturedBlogCardProps) {
  const category = post.categories?.[0]?.name;
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col md:flex-row border border-[#E8E4DF] rounded-[12px] overflow-hidden hover:shadow-md transition-shadow duration-300"
    >
      <img
        src={post.coverImageUrl ?? BLOG_DEFAULT_COVER}
        alt={post.title}
        className="w-full md:w-[500px] h-[260px] md:h-[320px] object-cover flex-shrink-0 transition-transform duration-500 group-hover:scale-[1.02]"
        loading="lazy"
      />
      <div className="flex flex-col gap-3 p-8 justify-center flex-1">
        {category && (
          <span className="font-['Lato'] text-[11px] font-bold uppercase tracking-[0.1em] text-[#B8944A]">
            {category}
          </span>
        )}
        <h3 className="font-['Cormorant_Garamond'] text-[22px] md:text-[26px] font-bold text-[#2D2D2D] leading-[1.25]">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-[1.7]">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <time className="font-['Lato'] text-[12px] text-[#8A8A8A]">
            {formatBlogDate(post.publishedAt ?? post.createdAt, locale)}
          </time>
          <span className="inline-flex items-center gap-1.5 font-['Lato'] text-[13px] font-semibold text-[#B8944A] group-hover:text-[#8A6F2E] transition-colors duration-200">
            <EditableText
              section="blog"
              fieldPath="readMoreFeatured"
              placeholder="Czytaj więcej"
            />
            <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

interface SmallBlogCardProps {
  post: BlogPost;
  locale: string;
}

function SmallBlogCard({ post, locale }: SmallBlogCardProps) {
  const category = post.categories?.[0]?.name;
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex flex-col border border-[#E8E4DF] rounded-[12px] overflow-hidden hover:shadow-md transition-shadow duration-300 h-full"
    >
      <div className="w-full h-[180px] overflow-hidden">
        <img
          src={post.coverImageUrl ?? BLOG_DEFAULT_COVER}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-2.5 p-5 flex-1">
        {category && (
          <span className="font-['Lato'] text-[11px] font-bold uppercase tracking-[0.1em] text-[#B8944A]">
            {category}
          </span>
        )}
        <h3 className="font-['Cormorant_Garamond'] text-[17px] font-bold text-[#2D2D2D] leading-[1.3]">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="font-['Lato'] text-[13px] text-[#6B6B6B] leading-[1.6] flex-1 line-clamp-3">
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between mt-1">
          <time className="font-['Lato'] text-[11px] text-[#8A8A8A]">
            {formatBlogDate(post.publishedAt ?? post.createdAt, locale)}
          </time>
          <span className="inline-flex items-center gap-1 font-['Lato'] text-[12px] font-semibold text-[#B8944A] group-hover:text-[#8A6F2E] transition-colors duration-200">
            <EditableText
              section="blog"
              fieldPath="readMore"
              placeholder="Czytaj"
            />
            <ArrowRight size={12} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function BlogCardSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <div className="flex flex-col md:flex-row border border-[#E8E4DF] rounded-[12px] overflow-hidden animate-pulse">
        <div className="w-full md:w-[500px] h-[260px] md:h-[320px] bg-[#F0EDE8]" />
        <div className="flex flex-col gap-3 p-8 justify-center flex-1">
          <div className="h-3 w-20 bg-[#F0EDE8] rounded" />
          <div className="h-6 w-3/4 bg-[#F0EDE8] rounded" />
          <div className="h-3 w-full bg-[#F0EDE8] rounded" />
          <div className="h-3 w-5/6 bg-[#F0EDE8] rounded" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col border border-[#E8E4DF] rounded-[12px] overflow-hidden h-full animate-pulse">
      <div className="w-full h-[180px] bg-[#F0EDE8]" />
      <div className="flex flex-col gap-2.5 p-5 flex-1">
        <div className="h-3 w-16 bg-[#F0EDE8] rounded" />
        <div className="h-4 w-full bg-[#F0EDE8] rounded" />
        <div className="h-3 w-5/6 bg-[#F0EDE8] rounded" />
      </div>
    </div>
  );
}

function BlogSection() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const locale =
    currentLang === 'pl' ? 'pl-PL' : currentLang === 'es' ? 'es-ES' : 'en-US';

  const { data, isLoading } = useQuery({
    queryKey: ['blogs', 'home-preview', currentLang],
    queryFn: () => blogsClient.getPublished(currentLang),
    staleTime: 60_000,
  });

  const posts = data ?? [];
  const [featured, ...rest] = posts;
  const smaller = rest.slice(0, 3);

  // Hide the entire section when we know there are no posts at all.
  if (!isLoading && posts.length === 0) {
    return null;
  }

  return (
    <section
      className="bg-white py-16 md:py-20 px-6 md:px-[120px]"
      aria-labelledby="blog-heading"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        {/* Header */}
        <ScrollReveal
          animation="fade-up"
          className="flex flex-col items-center gap-4 text-center"
        >
          <SectionBadge>
            <EditableText section="blog" fieldPath="badge" placeholder="Blog" />
          </SectionBadge>

          <EditableText
            section="blog"
            fieldPath="heading"
            as="h2"
            id="blog-heading"
            className="font-['Cormorant_Garamond'] text-[2rem] md:text-[2.25rem] font-bold text-[#2D2D2D] leading-[1.15] tracking-[-0.5px]"
            placeholder="INSPIRACJE I REFLEKSJE"
          />

          <EditableText
            section="blog"
            fieldPath="description"
            as="p"
            className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7] max-w-[640px]"
            placeholder="Dzielę się tu refleksjami o codziennym życiu, emocjach i wewnętrznym wzroście. Zapraszam do lektury."
          />
        </ScrollReveal>

        {/* Featured post */}
        {isLoading ? (
          <BlogCardSkeleton featured />
        ) : featured ? (
          <ScrollReveal animation="clip-left" className="w-full">
            <FeaturedBlogCard post={featured} locale={locale} />
          </ScrollReveal>
        ) : null}

        {/* Smaller cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        ) : smaller.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {smaller.map((post, i) => (
              <ScrollReveal
                key={post.id}
                animation="fade-up"
                delay={stagger(i)}
              >
                <SmallBlogCard post={post} locale={locale} />
              </ScrollReveal>
            ))}
          </div>
        ) : null}

        {/* View all link */}
        <div className="flex justify-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8944A] border border-[#B8944A] hover:bg-[#B8944A] hover:text-white active:bg-[#8A6F2E] active:border-[#8A6F2E] transition-colors duration-200 rounded-full px-8 py-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
          >
            <EditableText
              section="blog"
              fieldPath="viewAllLabel"
              placeholder="Wszystkie artykuły"
            />
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 7. CTA Section
// ---------------------------------------------------------------------------

function CtaSection() {
  return (
    <section
      className="relative flex flex-col items-center justify-center py-20 md:py-28 px-6 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background */}
      <EditableBackground
        section="cta"
        fieldPath="ctaBg"
        fallbackSrc="https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?q=80&w=2070&auto=format&fit=crop"
        className="absolute inset-0"
        aria-hidden={true}
      />
      <EditableOverlay
        section="cta"
        fieldPath="ctaBg"
        defaultTop={65}
        defaultBottom={82}
      />

      {/* Content */}
      <div
        id="cta-heading"
        className="relative z-10 flex flex-col items-center text-center gap-6 max-w-[700px]"
      >
        {/* Gold decorative line */}
        <GoldLine width={60} height={3} delay={100} />

        <SplitText
          text="GOTOWA NA ZMIANĘ?"
          className="font-['Cormorant_Garamond'] text-[2.25rem] md:text-[2.75rem] font-bold text-white leading-[1.15] tracking-[-0.5px]"
          delay={300}
          staggerInterval={80}
          duration={1000}
          cmsSection="cta"
          cmsField="title"
        />

        <ScrollReveal animation="blur" delay={600} duration={1000}>
          <EditableText
            section="cta"
            fieldPath="subtitle"
            as="p"
            className="font-['Lato'] text-[16px] md:text-[17px] text-[#C8D6E5] leading-[1.6] max-w-[640px]"
            placeholder="Pierwszy krok to najważniejszy. Skontaktuj się ze mną i razem znajdziemy odpowiednią dla Ciebie ścieżkę pracy."
          />
        </ScrollReveal>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <ScrollReveal animation="fade-up" delay={stagger(0, 150) + 700}>
            <Link
              to="/uslugi"
              className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#8A6F2E] active:bg-[#7A6028] transition-colors duration-200 rounded-lg px-8 py-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
            >
              <EditableText
                section="cta"
                fieldPath="primaryCtaLabel"
                placeholder="Wybieram termin"
              />
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={stagger(1, 150) + 700}>
            <Link
              to="/kontakt"
              className="inline-flex items-center gap-2 font-['Lato'] text-[14px] font-semibold text-[#B8944A] border-2 border-[#B8944A] hover:bg-[#B8944A] hover:text-white active:bg-[#8A6F2E] active:border-[#8A6F2E] transition-colors duration-200 rounded-lg px-8 py-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
            >
              <EditableText
                section="cta"
                fieldPath="secondaryCtaLabel"
                placeholder="Napisz do mnie"
              />
            </Link>
          </ScrollReveal>
        </div>

        {/* Trust indicators */}
        <ScrollReveal animation="fade" delay={1200} duration={1000}>
          <div className="flex flex-col sm:flex-row items-center gap-5 mt-4">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={16}
                className="text-[#C8D6E5]"
                aria-hidden="true"
              />
              <EditableText
                section="cta"
                fieldPath="trust1"
                as="span"
                className="font-['Lato'] text-[12px] text-[#C8D6E5]"
                placeholder="Pełna poufność"
              />
            </div>
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-[#C8D6E5]" aria-hidden="true" />
              <EditableText
                section="cta"
                fieldPath="trust2"
                as="span"
                className="font-['Lato'] text-[12px] text-[#C8D6E5]"
                placeholder="Bezpieczna przestrzeń"
              />
            </div>
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[#C8D6E5]" aria-hidden="true" />
              <EditableText
                section="cta"
                fieldPath="trust3"
                as="span"
                className="font-['Lato'] text-[12px] text-[#C8D6E5]"
                placeholder="Indywidualne podejście"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 8. Newsletter Bridge
// ---------------------------------------------------------------------------

function NewsletterBridge() {
  return (
    <div
      className="bg-[#F5F3EF] h-20 flex items-center justify-center px-6"
      aria-hidden="true"
    />
  );
}

// ---------------------------------------------------------------------------
// Page composition
// ---------------------------------------------------------------------------

export default function Home() {
  return (
    <main>
      <SEO canonical="/" />
      <HeroSection />
      <AboutSection />
      <HowIWorkSection />
      <ServicesSection />
      <TestimonialsSection />
      <BlogSection />
      <CtaSection />
      <NewsletterBridge />
    </main>
  );
}
