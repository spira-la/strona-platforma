import {
  Brain,
  DoorClosed,
  Eye,
  Heart,
  HeartCrack,
  House,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { EditableImage } from '@/components/cms/EditableImage';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';

// -------------------------------------------------------------------------
// Shared primitives
// -------------------------------------------------------------------------

function SectionBadge({
  label,
  gold = false,
}: {
  label: string;
  gold?: boolean;
}) {
  return gold ? (
    <span
      className="inline-block px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-full bg-[#B8944A] text-white"
      style={{ fontFamily: "'Lato', sans-serif" }}
    >
      {label}
    </span>
  ) : (
    <span
      className="inline-block px-4 py-1 text-xs font-semibold uppercase tracking-widest rounded-full border border-[#D4B97A] text-[#B8944A] bg-[rgba(184,148,74,0.08)]"
      style={{ fontFamily: "'Lato', sans-serif" }}
    >
      {label}
    </span>
  );
}

interface PainCardProps {
  icon: React.ReactNode;
  section: 'mamyNastolatkow';
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function PainCard({
  icon,
  section,
  titleField,
  titlePlaceholder,
  descField,
  descPlaceholder,
}: PainCardProps) {
  return (
    <div className="flex flex-col gap-4 p-8 rounded-xl bg-[#F9F6F0] border border-[#F0EDE8] h-full">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[rgba(184,148,74,0.1)] text-[#B8944A] flex-shrink-0"
        aria-hidden="true"
      >
        {icon}
      </div>
      <EditableText
        section={section}
        fieldPath={titleField}
        as="h3"
        placeholder={titlePlaceholder}
        className="text-xl text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
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

interface InsightCardProps {
  icon: React.ReactNode;
  section: 'mamyNastolatkow';
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function InsightCard({
  icon,
  section,
  titleField,
  titlePlaceholder,
  descField,
  descPlaceholder,
}: InsightCardProps) {
  return (
    <div className="flex gap-4 p-6 rounded-xl bg-white">
      <div
        className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[rgba(184,148,74,0.1)] text-[#B8944A] flex-shrink-0"
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="flex flex-col gap-1.5">
        <EditableText
          section={section}
          fieldPath={titleField}
          as="h4"
          placeholder={titlePlaceholder}
          className="text-base text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
        />
        <EditableText
          section={section}
          fieldPath={descField}
          as="p"
          placeholder={descPlaceholder}
          className="text-xs leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
        />
      </div>
    </div>
  );
}

interface ReasonCardProps {
  icon: React.ReactNode;
  section: 'mamyNastolatkow';
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function ReasonCard({
  icon,
  section,
  titleField,
  titlePlaceholder,
  descField,
  descPlaceholder,
}: ReasonCardProps) {
  return (
    <div className="flex flex-col gap-4 p-8 rounded-xl bg-white h-full">
      <div
        className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#B8944A] text-white flex-shrink-0"
        aria-hidden="true"
      >
        {icon}
      </div>
      <EditableText
        section={section}
        fieldPath={titleField}
        as="h3"
        placeholder={titlePlaceholder}
        className="text-xl font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
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

interface TestimonialCardProps {
  section: 'mamyNastolatkow';
  quoteField: string;
  quotePlaceholder: string;
  nameField: string;
  namePlaceholder: string;
  roleField: string;
  rolePlaceholder: string;
  initial: string;
}

function TestimonialCard({
  section,
  quoteField,
  quotePlaceholder,
  nameField,
  namePlaceholder,
  roleField,
  rolePlaceholder,
  initial,
}: TestimonialCardProps) {
  return (
    <div className="flex flex-col gap-5 p-8 rounded-xl bg-white">
      <span
        className="text-[#B8944A] leading-none text-6xl font-bold [font-family:'Playfair_Display',serif]"
        aria-hidden="true"
      >
        "
      </span>
      <EditableText
        section={section}
        fieldPath={quoteField}
        as="p"
        placeholder={quotePlaceholder}
        className="text-sm leading-relaxed text-[#6B6B6B] flex-1 [font-family:'Lato',sans-serif]"
      />
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-[#B8944A] text-white text-sm font-bold flex-shrink-0 [font-family:'Playfair_Display',serif]">
          {initial}
        </div>
        <div className="flex flex-col gap-0.5">
          <EditableText
            section={section}
            fieldPath={nameField}
            as="span"
            placeholder={namePlaceholder}
            className="text-sm font-bold text-[#2D2D2D] [font-family:'Lato',sans-serif]"
          />
          <EditableText
            section={section}
            fieldPath={roleField}
            as="span"
            placeholder={rolePlaceholder}
            className="text-xs text-[#9B9590] [font-family:'Lato',sans-serif]"
          />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Page
// -------------------------------------------------------------------------

export default function MamyNastolatkowCoaching() {
  return (
    <main className="min-h-screen bg-[#F9F6F0] text-[#2D2D2D]">
      <SEO
        title="Mama nastolatka"
        description="Twój nastolatek stał się obcą osobą we własnym domu? Pomogę Ci odbudować relację, zanim oddalicie się na dobre. Coaching dla mam nastolatków – Aneta Spirala."
        canonical="/mama-nastolatka"
        pathname="/mama-nastolatka"
      />

      {/* ---------------------------------------------------------------- */}
      {/* HERO                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden h-[500px] md:h-[620px]"
        aria-label="Coaching dla mam nastolatków"
      >
        <EditableBackground
          section="mamyNastolatkow"
          fieldPath="heroBg"
          fallbackSrc="https://images.unsplash.com/photo-1747600569107-faf7e569faf8?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section="mamyNastolatkow"
          fieldPath="heroBg"
          color="25,19,9"
          defaultTop={55}
          defaultBottom={80}
        />

        <ScrollReveal
          animation="fade"
          delay={200}
          className="relative z-10 flex flex-col items-center gap-5 max-w-4xl"
        >
          <EditableText
            section="mamyNastolatkow"
            fieldPath="heroQuote"
            as="h1"
            placeholder="Twój nastolatek stał się obcą osobą we własnym domu?"
            className="text-4xl sm:text-5xl font-normal leading-[1.2] tracking-[-0.5px] text-white max-w-[900px] [font-family:'Playfair_Display',serif]"
          />

          <EditableText
            section="mamyNastolatkow"
            fieldPath="heroSub"
            as="p"
            placeholder="Pomogę Ci odbudować relację, zanim oddalicie się na dobre."
            className="text-base sm:text-lg leading-relaxed text-white/70 max-w-[600px] [font-family:'Lato',sans-serif]"
          />

          <EditableButtonLink
            section="mamyNastolatkow"
            fieldPath="heroCTA"
            defaultAction="booking"
            className="mt-2 inline-flex items-center justify-center px-8 py-4 rounded-lg bg-[#B8944A] text-white text-sm font-normal transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
          >
            <EditableText
              section="mamyNastolatkow"
              fieldPath="heroCTA"
              as="span"
              placeholder="Umów bezpłatną rozmowę"
            />
          </EditableButtonLink>
        </ScrollReveal>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* DLA KOGO — pain points grid                                      */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-20 bg-white"
        aria-label="Dla kogo jest ten coaching"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-10">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center text-center gap-4 max-w-[700px]">
              <SectionBadge label="Dla kogo" />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="dkTitle"
                as="h2"
                placeholder="CZY TO BRZMI ZNAJOMO?"
                className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="dkSub"
                as="p"
                placeholder="Jeśli rozpoznajesz się w tych sytuacjach — nie jesteś sama. I nie musisz przez to przechodzić bez wsparcia."
                className="text-base leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          <div className="w-full flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ScrollReveal animation="fade-up" delay={stagger(0)}>
                <PainCard
                  icon={<DoorClosed size={20} />}
                  section="mamyNastolatkow"
                  titleField="pain1Title"
                  titlePlaceholder="Zamknięte drzwi"
                  descField="pain1Desc"
                  descPlaceholder="Twój nastolatek zamyka się w pokoju, nie chce rozmawiać, a każda próba kontaktu kończy się kłótnią lub milczeniem."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(1)}>
                <PainCard
                  icon={<HeartCrack size={20} />}
                  section="mamyNastolatkow"
                  titleField="pain2Title"
                  titlePlaceholder="Poczucie odrzucenia"
                  descField="pain2Desc"
                  descPlaceholder="Czujesz, że Twoje dziecko Cię nie potrzebuje, a może nawet nie lubi. Boli to bardziej, niż ktokolwiek może zrozumieć."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(2)}>
                <PainCard
                  icon={<ShieldAlert size={20} />}
                  section="mamyNastolatkow"
                  titleField="pain3Title"
                  titlePlaceholder="Ciągłe konflikty"
                  descField="pain3Desc"
                  descPlaceholder="Dom zamienił się w pole bitwy. Drobne sprawy eskalują do krzyków, a Ty nie wiesz, jak to zatrzymać."
                />
              </ScrollReveal>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ScrollReveal animation="fade-up" delay={stagger(0)}>
                <PainCard
                  icon={<Brain size={20} />}
                  section="mamyNastolatkow"
                  titleField="pain4Title"
                  titlePlaceholder="Wyczerpanie emocjonalne"
                  descField="pain4Desc"
                  descPlaceholder="Próbujesz wszystkiego — rozmów, kar, ustępstw — ale nic nie działa. Czujesz się bezradna i winna jednocześnie."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(1)}>
                <PainCard
                  icon={<Users size={20} />}
                  section="mamyNastolatkow"
                  titleField="pain5Title"
                  titlePlaceholder="Samotność w rodzicielstwie"
                  descField="pain5Desc"
                  descPlaceholder="Nikt w Twoim otoczeniu nie rozumie, przez co przechodzisz. Inni rodzice wydają się mieć wszystko pod kontrolą."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(2)}>
                <PainCard
                  icon={<Sparkles size={20} />}
                  section="mamyNastolatkow"
                  titleField="pain6Title"
                  titlePlaceholder="Tęsknota za bliskością"
                  descField="pain6Desc"
                  descPlaceholder="Pamiętasz, jak było kiedyś — ciepło, zaufanie, wspólne chwile. Chcesz to odzyskać, ale nie wiesz jak."
                />
              </ScrollReveal>
            </div>
          </div>

          <ScrollReveal animation="fade-up">
            <EditableText
              section="mamyNastolatkow"
              fieldPath="dkClosing"
              as="p"
              placeholder="Jeśli choć jeden z tych punktów trafia w Twoje doświadczenie — coaching może być pierwszym krokiem do odbudowania tego, co wydaje się stracone."
              className="text-base leading-relaxed italic text-[#6B6B6B] text-center max-w-[700px] [font-family:'Lato',sans-serif]"
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* PERSPECTIVE SHIFT — dlaczego mama, nie dziecko                   */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-20 bg-[#F5EFE6]"
        aria-label="Dlaczego warto zacząć od siebie"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-12">
          <ScrollReveal animation="fade-up">
            <EditableText
              section="mamyNastolatkow"
              fieldPath="perspectiveTitle"
              as="h2"
              placeholder="Nie musisz przez to przechodzić sama"
              className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] text-center [font-family:'Playfair_Display',serif]"
            />
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-start">
            {/* Left: text paragraphs */}
            <ScrollReveal animation="fade-up" className="flex flex-col gap-6">
              <EditableText
                section="mamyNastolatkow"
                fieldPath="perspP1"
                as="p"
                placeholder={
                  'Kiedy nastolatek się zmienia, naturalnym odruchem jest szukanie pomocy dla niego. Psycholog, terapeuta, ktoś, kto „naprawi” dziecko. Ale prawda jest inna — i trudniejsza do przyjęcia.'
                }
                className="text-base leading-[1.8] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="perspP2"
                as="p"
                placeholder={
                  'Nastolatek nie buntuje się bez powodu. Jego zachowanie — milczenie, agresja, wycofanie — to komunikat. Mówi: „Nie czuję się tu bezpiecznie. Nie czuję, że mnie rozumiecie. Nie wiem, czy mogę wam zaufać."'
                }
                className="text-base leading-[1.8] italic text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="perspP3"
                as="p"
                placeholder="Często to nie dziecko potrzebuje naprawy — to atmosfera w domu, nieświadome wzorce reagowania, odziedziczone przekonania o wychowaniu i dyscyplinie. Wzorce, które powtarzamy za własnymi rodzicami, nie zdając sobie z tego sprawy."
                className="text-base leading-[1.8] text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="perspP4"
                as="p"
                placeholder="Kiedy mama zaczyna pracować nad sobą — nad swoimi reakcjami, lękami, potrzebą kontroli — coś się zmienia w całym systemie rodzinnym. Dziecko to czuje. Nie musisz go do niczego zmuszać. Wystarczy, że Ty się zmienisz, a ono podąży."
                className="text-base leading-[1.8] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
            </ScrollReveal>

            {/* Right: insight cards */}
            <ScrollReveal
              animation="fade-up"
              delay={100}
              className="flex flex-col gap-4"
            >
              <InsightCard
                icon={<TriangleAlert size={20} />}
                section="mamyNastolatkow"
                titleField="insight1Title"
                titlePlaceholder="Stereotyp"
                descField="insight1Desc"
                descPlaceholder="Problem z dzieckiem? Idź do psychologa. Ale to nie dziecko jest problemem — to cały system rodzinny potrzebuje uwagi."
              />
              <InsightCard
                icon={<Eye size={20} />}
                section="mamyNastolatkow"
                titleField="insight2Title"
                titlePlaceholder="Twoje wzorce"
                descField="insight2Desc"
                descPlaceholder="Sposób, w jaki reagujesz na bunt nastolatka, często pochodzi z Twojego dzieciństwa. Rozpoznanie tych wzorców to pierwszy krok."
              />
              <InsightCard
                icon={<House size={20} />}
                section="mamyNastolatkow"
                titleField="insight3Title"
                titlePlaceholder="Atmosfera w domu"
                descField="insight3Desc"
                descPlaceholder="Dziecko nie czuje się bezpiecznie nie dlatego, że jest złe — ale dlatego, że dom przestał być miejscem zaufania i akceptacji."
              />
              <InsightCard
                icon={<RefreshCw size={20} />}
                section="mamyNastolatkow"
                titleField="insight4Title"
                titlePlaceholder="Zmiana zaczyna się od Ciebie"
                descField="insight4Desc"
                descPlaceholder="Nie musisz zmieniać nastolatka. Kiedy Ty zmienisz swoje reakcje, lęki i potrzebę kontroli — cały system się przeorganizuje."
              />
            </ScrollReveal>
          </div>

          {/* Closing quote */}
          <ScrollReveal
            animation="fade-up"
            className="flex flex-col items-center gap-5 w-full sm:px-20"
          >
            <div className="w-12 h-0.5 bg-[#B8944A]" aria-hidden="true" />
            <EditableText
              section="mamyNastolatkow"
              fieldPath="perspClosing"
              as="p"
              placeholder="To nie jest porażka rodzicielska. To moment, w którym możesz wybrać inną drogę — świadomą, odważną, pełną miłości. Pracując nad sobą, dajesz swojemu dziecku najcenniejszy prezent: mamę, która rozumie siebie."
              className="text-base sm:text-[17px] leading-[1.7] text-[#2D2D2D] text-center max-w-[700px] [font-family:'Lato',sans-serif]"
            />
          </ScrollReveal>

          <ScrollReveal animation="fade-up">
            <EditableButtonLink
              section="mamyNastolatkow"
              fieldPath="perspCTA"
              defaultAction="booking"
              className="inline-flex items-center justify-center px-10 py-4 rounded-lg bg-[#B8944A] text-white text-sm font-normal transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
            >
              <EditableText
                section="mamyNastolatkow"
                fieldPath="perspCTA"
                as="span"
                placeholder="Porozmawiajmy →"
              />
            </EditableButtonLink>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* DLACZEGO WARTO — story + reasons                                 */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-20 bg-[#F9F6F0]"
        aria-label="Dlaczego warto"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col gap-3">
              <SectionBadge label="DLACZEGO WARTO" gold />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="storyTitle"
                as="h2"
                placeholder="Moja historia jako mamy"
                className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          {/* Story top: image + first paragraph side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <ScrollReveal animation="fade-up">
              <div className="rounded-2xl overflow-hidden">
                <EditableImage
                  section="mamyNastolatkow"
                  fieldPath="storyPhoto"
                  fallbackSrc="https://images.unsplash.com/photo-1610673893015-f0db3ea33fd6?w=700&q=80"
                  alt="Aneta – coaching dla mam nastolatków"
                  className="w-full h-[420px] lg:h-[520px] object-cover object-top"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={100}>
              <EditableText
                section="mamyNastolatkow"
                fieldPath="storyP1"
                as="p"
                placeholder="Wiem, jak to jest – stać przed zamkniętymi drzwiami pokoju i czuć, że tracisz kontakt z osobą, którą kochasz najbardziej na świecie."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
            </ScrollReveal>
          </div>

          {/* Story bottom: full-width text */}
          <ScrollReveal
            animation="fade-up"
            className="flex flex-col divide-y divide-[#E8E3DB]"
          >
            <div className="pb-7">
              <EditableText
                section="mamyNastolatkow"
                fieldPath="storyP2"
                as="p"
                placeholder="Przeszłam tę drogę sama. Moja relacja z córką przeszła przez najtrudniejszy okres i wyszła z niego silniejsza. To doświadczenie zmieniło nie tylko nasze życie, ale i moje podejście do pracy z innymi mamami."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
            </div>
            <div className="pt-7">
              <EditableText
                section="mamyNastolatkow"
                fieldPath="storyP3"
                as="p"
                placeholder="Dziś pomagam mamom nastolatków odbudować bliskość – bo wiem, że nawet najtrudniejsza relacja może się zmienić, gdy zaczynamy od siebie."
                className="text-base leading-[1.85] text-[#5A5550] italic [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          {/* Reason cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ScrollReveal animation="fade-up" delay={stagger(0)}>
              <ReasonCard
                icon={<Heart size={24} />}
                section="mamyNastolatkow"
                titleField="reason1Title"
                titlePlaceholder="Osobiste doświadczenie"
                descField="reason1Desc"
                descPlaceholder="Wiem, przez co przechodzisz, bo sama to przeżyłam. Moje metody są oparte na prawdziwym doświadczeniu."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <ReasonCard
                icon={<Target size={24} />}
                section="mamyNastolatkow"
                titleField="reason2Title"
                titlePlaceholder="Sprawdzone narzędzia"
                descField="reason2Desc"
                descPlaceholder="Korzystam z metod, które działają – popartych praktyką i wiedzą z zakresu psychologii relacji."
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(2)}>
              <ReasonCard
                icon={<Shield size={24} />}
                section="mamyNastolatkow"
                titleField="reason3Title"
                titlePlaceholder="Bezpieczna przestrzeń"
                descField="reason3Desc"
                descPlaceholder="Tworzę miejsce, w którym możesz być sobą – bez oceniania, z pełnym wsparciem."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* JAK TO WYGLĄDA W PRAKTYCE — numbered steps                      */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-20 bg-white"
        aria-label="Jak to wygląda w praktyce"
      >
        <div className="max-w-[800px] mx-auto flex flex-col gap-10">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center gap-4 text-center">
              <SectionBadge label="JAK ZACZĄĆ" gold />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="practiceHeading"
                as="h2"
                placeholder="Jak to wygląda w praktyce"
                className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <div className="flex flex-col">
            {(
              [
                {
                  n: 1,
                  titleField: 'practiceStep1Title',
                  titlePlaceholder: 'Piszesz do mnie',
                  descField: 'practiceStep1Desc',
                  descPlaceholder:
                    'Przez WhatsApp lub formularz. Bez przygotowania, bez wiedzy co powiedzieć. Wystarczy, że czujesz, że coś jest nie tak.',
                },
                {
                  n: 2,
                  titleField: 'practiceStep2Title',
                  titlePlaceholder: 'Rozmawiamy — bezpłatnie, 20 minut',
                  descField: 'practiceStep2Desc',
                  descPlaceholder:
                    'Opowiadasz mi, co się dzieje. Ja słucham bez oceniania. Razem sprawdzamy, czy i jak mogę Ci pomóc.',
                },
                {
                  n: 3,
                  titleField: 'practiceStep3Title',
                  titlePlaceholder: 'Zaczynamy pracę — we własnym tempie',
                  descField: 'practiceStep3Desc',
                  descPlaceholder:
                    'Sesja 1 na 1 albo pakiet — decydujemy razem. Wszystko dzieje się w Twoim tempie, bez pośpiechu.',
                },
              ] as const
            ).map(
              (
                { n, titleField, titlePlaceholder, descField, descPlaceholder },
                i,
                arr,
              ) => (
                <ScrollReveal key={n} animation="fade-up" delay={stagger(i)}>
                  <div className="flex gap-8 py-8 border-t border-[#E8E3DB] items-start">
                    {/* Large decorative number */}
                    <span
                      className="text-[72px] leading-none font-bold text-[#B8944A]/20 select-none flex-shrink-0 w-16 text-right [font-family:'Playfair_Display',serif]"
                      aria-hidden="true"
                    >
                      {n}
                    </span>

                    {/* Content */}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#B8944A] text-white text-[11px] font-bold flex-shrink-0 [font-family:'Lato',sans-serif]">
                          {n}
                        </span>
                        <EditableText
                          section="mamyNastolatkow"
                          fieldPath={titleField}
                          as="h3"
                          placeholder={titlePlaceholder}
                          className="text-lg font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                        />
                      </div>
                      <EditableText
                        section="mamyNastolatkow"
                        fieldPath={descField}
                        as="p"
                        placeholder={descPlaceholder}
                        className="text-[15px] leading-relaxed text-[#6B6B6B] pl-9 [font-family:'Lato',sans-serif]"
                      />
                    </div>
                  </div>
                  {i === arr.length - 1 && (
                    <div className="border-t border-[#E8E3DB]" />
                  )}
                </ScrollReveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* TESTIMONIALS                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-20 bg-[#F9F6F0]"
        aria-label="Opinie mam"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-12">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center gap-4">
              <SectionBadge label="OPINIE MAM" gold />
              <EditableText
                section="mamyNastolatkow"
                fieldPath="testimonialsTitle"
                as="h2"
                placeholder="Co mówią mamy, z którymi pracowałam"
                className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] text-center [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            <ScrollReveal animation="fade-up" delay={stagger(0)}>
              <TestimonialCard
                section="mamyNastolatkow"
                quoteField="testimonial1Text"
                quotePlaceholder="Kiedy przyszłam do Anety, byłam w rozpaczy. Moja 15-letnia córka nie chciała ze mną rozmawiać. Po kilku sesjach zaczęłam rozumieć, co się naprawdę dzieje. Dziś nasza relacja jest lepsza niż kiedykolwiek."
                nameField="testimonial1Name"
                namePlaceholder="Joanna S."
                roleField="testimonial1Role"
                rolePlaceholder="mama 15-latki"
                initial="J"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(1)}>
              <TestimonialCard
                section="mamyNastolatkow"
                quoteField="testimonial2Text"
                quotePlaceholder="Nie wiedziałam, że tyle moich reakcji na zachowanie syna wynikało z moich własnych wzorców. Aneta pomogła mi to zobaczyć i zmienić. Syn to wyczuł i sam zaczął się otwierać."
                nameField="testimonial2Name"
                namePlaceholder="Beata K."
                roleField="testimonial2Role"
                rolePlaceholder="mama 17-latka"
                initial="B"
              />
            </ScrollReveal>
            <ScrollReveal animation="fade-up" delay={stagger(2)}>
              <TestimonialCard
                section="mamyNastolatkow"
                quoteField="testimonial3Text"
                quotePlaceholder="Myślałam, że to nastolatek jest problemem. Okazało się, że zmiana musi zacząć się ode mnie. Aneta przeprowadziła mnie przez ten proces z ogromną uważnością."
                nameField="testimonial3Name"
                namePlaceholder="Marta W."
                roleField="testimonial3Role"
                rolePlaceholder="mama 14-latki"
                initial="M"
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FINAL CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden"
        style={{ minHeight: '400px' }}
        aria-label="Umów się na rozmowę"
      >
        <EditableBackground
          section="mamyNastolatkow"
          fieldPath="ctaBg"
          fallbackSrc="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section="mamyNastolatkow"
          fieldPath="ctaBg"
          color="30,21,6"
          defaultTop={72}
          defaultBottom={78}
        />

        <ScrollReveal
          animation="fade"
          duration={900}
          className="relative z-10 flex flex-col items-center gap-6 max-w-[672px]"
        >
          <EditableText
            section="mamyNastolatkow"
            fieldPath="ctaTitle"
            as="h2"
            placeholder="Gotowa na zmianę w Waszej relacji?"
            className="text-3xl sm:text-4xl font-bold text-white [font-family:'Playfair_Display',serif]"
          />
          <EditableText
            section="mamyNastolatkow"
            fieldPath="ctaSubtitle"
            as="p"
            placeholder="Pierwsza rozmowa jest bezpłatna. Porozmawiajmy o tym, co możemy razem osiągnąć."
            className="text-base sm:text-lg leading-relaxed text-white/80 max-w-[600px] [font-family:'Lato',sans-serif]"
          />
          <EditableButtonLink
            section="mamyNastolatkow"
            fieldPath="ctaBtn"
            defaultAction="booking"
            className="mt-2 inline-flex items-center justify-center px-10 py-4 rounded-full bg-[#B8944A] text-white text-base font-bold transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
          >
            <EditableText
              section="mamyNastolatkow"
              fieldPath="ctaBtn"
              as="span"
              placeholder="Umów bezpłatną rozmowę"
            />
          </EditableButtonLink>
        </ScrollReveal>
      </section>
    </main>
  );
}
