import {
  Calendar,
  Check,
  Clock,
  HeartCrack,
  MessageCircleOff,
  Scale,
  Users,
  X,
} from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { EditableImage } from '@/components/cms/EditableImage';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import ane1Photo from '@/assets/Ane1.jpg';

const SECTION = 'kochanka' as const;

// ---------------------------------------------------------------------------
// Shared primitives — pattern reused from mama-nastolatka / matka-zona-kochanka
// ---------------------------------------------------------------------------

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
  titleField: string;
  titlePlaceholder: string;
  descField: string;
  descPlaceholder: string;
}

function PainCard({
  icon,
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
        section={SECTION}
        fieldPath={titleField}
        as="h3"
        placeholder={titlePlaceholder}
        className="text-xl text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
      />
      <EditableText
        section={SECTION}
        fieldPath={descField}
        as="p"
        placeholder={descPlaceholder}
        className="text-sm leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
      />
    </div>
  );
}

interface ChecklistProps {
  items: { field: string; placeholder: string }[];
  variant: 'gold' | 'muted' | 'onDark';
}

function Checklist({ items, variant }: ChecklistProps) {
  const Icon = variant === 'muted' ? X : Check;
  const iconWrap =
    variant === 'onDark'
      ? 'bg-white/15 text-white'
      : variant === 'muted'
        ? 'bg-[rgba(184,148,74,0.1)] text-[#9B7A3A]'
        : 'bg-[#B8944A] text-white';
  const textColor = variant === 'onDark' ? 'text-white/85' : 'text-[#2D2D2D]';

  return (
    <ul className="flex flex-col gap-4">
      {items.map(({ field, placeholder }, i) => (
        <ScrollReveal key={field} animation="fade-up" delay={stagger(i % 6)}>
          <li className="flex items-start gap-3">
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5 ${iconWrap}`}
              aria-hidden="true"
            >
              <Icon size={14} />
            </span>
            <EditableText
              section={SECTION}
              fieldPath={field}
              as="span"
              placeholder={placeholder}
              className={`text-[15px] leading-relaxed [font-family:'Lato',sans-serif] ${textColor}`}
            />
          </li>
        </ScrollReveal>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function KochankaCoaching() {
  return (
    <main className="min-h-screen bg-[#F9F6F0] text-[#2D2D2D]">
      <SEO
        title="Dlaczego przyciągasz żonatych mężczyzn?"
        description="Pięciotygodniowy proces transformacji dla kobiet, które chcą porzucić rolę kochanki i wybrać relację opartą na szacunku i prawdzie. Sesje z Anetą, Spirala."
        canonical="/matka-zona-kochanka"
        pathname="/matka-zona-kochanka"
      />

      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden h-[560px] md:h-[640px]"
        aria-label="Dlaczego przyciągasz żonatych mężczyzn?"
      >
        <EditableBackground
          section={SECTION}
          fieldPath="heroBg"
          fallbackSrc="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section={SECTION}
          fieldPath="heroBg"
          color="25,19,9"
          defaultTop={58}
          defaultBottom={82}
        />

        <ScrollReveal
          animation="fade"
          delay={200}
          className="relative z-10 flex flex-col items-center gap-5 max-w-3xl"
        >
          <EditableText
            section={SECTION}
            fieldPath="heroTitle"
            as="h1"
            placeholder="Dlaczego przyciągasz żonatych mężczyzn?"
            className="text-4xl sm:text-5xl font-normal leading-[1.2] tracking-[-0.5px] text-white max-w-[820px] [font-family:'Playfair_Display',serif]"
          />
          <EditableText
            section={SECTION}
            fieldPath="heroSub"
            as="p"
            placeholder="Pięciotygodniowy proces transformacji dla kobiet, które chcą porzucić rolę kochanki i wybrać relację opartą na szacunku i prawdzie."
            className="text-base sm:text-lg leading-relaxed text-white/80 max-w-[620px] [font-family:'Lato',sans-serif]"
          />
          <EditableText
            section={SECTION}
            fieldPath="heroStat"
            as="p"
            placeholder="Statystycznie mężczyźni rzadko odchodzą od żony do kochanki. Zostają. Wybierają rodzinę."
            className="text-sm italic text-white/60 max-w-[560px] [font-family:'Lato',sans-serif]"
          />
          <EditableButtonLink
            section={SECTION}
            fieldPath="heroCTA"
            defaultAction="calendly"
            className="mt-2 inline-flex items-center justify-center px-8 py-4 rounded-lg bg-[#B8944A] text-white text-sm font-normal transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
          >
            <EditableText
              section={SECTION}
              fieldPath="heroCTA"
              as="span"
              placeholder="Umów bezpłatną rozmowę →"
            />
          </EditableButtonLink>
        </ScrollReveal>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* BÓL — pain points grid                                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-20 bg-white"
        aria-label="Ból, który znasz aż za dobrze"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col items-center gap-10">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center text-center gap-4 max-w-[700px]">
              <SectionBadge label="Rozpoznajesz to?" />
              <EditableText
                section={SECTION}
                fieldPath="painTitle"
                as="h2"
                placeholder="Ból, który znasz aż za dobrze"
                className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="painIntro"
                as="p"
                placeholder="Żyjesz w cieniu cudzego małżeństwa."
                className="text-base leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          <div className="w-full flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ScrollReveal animation="fade-up" delay={stagger(0)}>
                <PainCard
                  icon={<Users size={20} />}
                  titleField="pain1Title"
                  titlePlaceholder="Brak wspólnej przyszłości"
                  descField="pain1Desc"
                  descPlaceholder="Nie macie wspólnych znajomych. Nie planujecie razem przyszłości, bo niby jakiej — skoro on ma już swoją, z kimś innym."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(1)}>
                <PainCard
                  icon={<Calendar size={20} />}
                  titleField="pain2Title"
                  titlePlaceholder="Samotne święta"
                  descField="pain2Desc"
                  descPlaceholder="Znasz to uczucie, kiedy zbliżają się święta, wakacje, sylwester, a Ty znowu zostajesz sama, bo on „musi być z rodziną”."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(2)}>
                <PainCard
                  icon={<Clock size={20} />}
                  titleField="pain3Title"
                  titlePlaceholder="Zawsze opcja B"
                  descField="pain3Desc"
                  descPlaceholder="Znasz napięcie bycia zawsze opcją B — gotową, kiedy on może, dostosowującą się do jego kalendarza rodzinnego."
                />
              </ScrollReveal>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <ScrollReveal animation="fade-up" delay={stagger(0)}>
                <PainCard
                  icon={<MessageCircleOff size={20} />}
                  titleField="pain4Title"
                  titlePlaceholder="Puste obietnice"
                  descField="pain4Desc"
                  descPlaceholder="Słyszysz obietnice, które nigdy się nie ziszczają."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(1)}>
                <PainCard
                  icon={<Scale size={20} />}
                  titleField="pain5Title"
                  titlePlaceholder="Cicha rywalizacja"
                  descField="pain5Desc"
                  descPlaceholder="Rywalizujesz — czasem otwarcie, czasem tylko we własnej głowie — o to, by być „tą ważniejszą” kobietą w jego życiu, mimo że to nie Ty nosisz jego nazwisko."
                />
              </ScrollReveal>
              <ScrollReveal animation="fade-up" delay={stagger(2)}>
                <PainCard
                  icon={<HeartCrack size={20} />}
                  titleField="pain6Title"
                  titlePlaceholder="Emocjonalne rozdarcie"
                  descField="pain6Desc"
                  descPlaceholder="Czujesz to, czego nie mówisz nikomu głośno: że wciąż czekasz, aż w końcu zostaniesz wybrana. Że czujesz się niewystarczająca, gorsza, jakby ktoś inny zawsze miał pierwszeństwo."
                />
              </ScrollReveal>
            </div>
          </div>

          <ScrollReveal animation="fade-up">
            <EditableText
              section={SECTION}
              fieldPath="painClosing"
              as="p"
              placeholder="To nie jest przypadek. To wzorzec — i ma swoje źródło."
              className="text-lg font-medium italic text-[#B8944A] text-center max-w-[700px] [font-family:'Cormorant_Garamond',serif]"
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ZANIM PÓJDZIEMY DALEJ                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-20 bg-[#F5EFE6]"
        aria-label="Zanim pójdziemy dalej"
      >
        <div className="max-w-[700px] mx-auto flex flex-col gap-8">
          <ScrollReveal animation="fade-up">
            <EditableText
              section={SECTION}
              fieldPath="beforeTitle"
              as="h2"
              placeholder="Zanim pójdziemy dalej"
              className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="flex flex-col gap-6">
              <EditableText
                section={SECTION}
                fieldPath="beforeP1"
                as="p"
                placeholder="To, co teraz przeżywasz, da się zmienić. Wybór żonatego mężczyzny i wejście w rolę kochanki nie jest „pechem do facetów” — to wzorzec, który ma swoje źródło. Razem to źródło znajdziemy i zmienimy zapis, program, który jest w Tobie i który Tobą rządzi."
                className="text-base leading-[1.85] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="beforeP2"
                as="p"
                placeholder="Przeprowadzę Cię przez proces zmiany tego wzorca — konkretną, świadomą pracę, dzięki której rola kochanki przestanie być Twoim automatycznym wyborem."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="beforeP3"
                as="p"
                placeholder="Po tej transformacji zaczniesz wybierać mężczyzn wolnych. Takich, którzy chcą budować prawdziwą relację partnerską — bez ograniczeń, bez ukrywania się, bez czekania w kolejce."
                className="text-base leading-[1.85] italic text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PROCES — kroki A-E                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-20 bg-white"
        aria-label="Jak przebiega proces — krok po kroku"
      >
        <div className="max-w-[800px] mx-auto flex flex-col gap-12">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-center gap-4 text-center">
              <SectionBadge label="Proces" gold />
              <EditableText
                section={SECTION}
                fieldPath="processTitle"
                as="h2"
                placeholder="Jak przebiega proces — krok po kroku"
                className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          {/* Step A */}
          <ScrollReveal animation="fade-up" delay={stagger(0)}>
            <div className="flex flex-col gap-4 pt-8 border-t border-[#E8E3DB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#B8944A] text-white text-sm font-bold flex-shrink-0 [font-family:'Playfair_Display',serif]">
                  A
                </span>
                <EditableText
                  section={SECTION}
                  fieldPath="stepATitle"
                  as="h3"
                  placeholder="Twoja historia"
                  className="text-xl font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                />
              </div>
              <EditableText
                section={SECTION}
                fieldPath="stepAP1"
                as="p"
                placeholder="Zaczynamy od Ciebie. Opowiesz mi, czego brakuje w Twoim życiu, czego naprawdę chcesz i o jakiej relacji marzysz w głębi siebie. Podczas indywidualnych sesji poznaję Twoją historię i Twoje doświadczenia, by znaleźć dynamiki, które obecnie rządzą Twoim życiem. To punkt wyjścia do odnalezienia wzorców, które podświadomie odtwarzasz."
                className="text-[15px] leading-relaxed text-[#6B6B6B] pl-12 [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          {/* Step B */}
          <ScrollReveal animation="fade-up" delay={stagger(1)}>
            <div className="flex flex-col gap-4 pt-8 border-t border-[#E8E3DB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#B8944A] text-white text-sm font-bold flex-shrink-0 [font-family:'Playfair_Display',serif]">
                  B
                </span>
                <EditableText
                  section={SECTION}
                  fieldPath="stepBTitle"
                  as="h3"
                  placeholder="Praca ze wzorcami"
                  className="text-xl font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                />
              </div>
              <div className="flex flex-col gap-4 pl-12">
                <EditableText
                  section={SECTION}
                  fieldPath="stepBP1"
                  as="p"
                  placeholder="Wybór roli kochanki ma swój początek. Czasem sięga wzorców z dzieciństwa, czasem głębiej — bo ma korzenie w Twoim rodzie. Przyglądamy się temu uważnie, by znaleźć, skąd naprawdę biorą się Twoje decyzje. Tylko uświadomienie sobie źródła daje szansę, by przestać je odtwarzać."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepBP2"
                  as="p"
                  placeholder="To nie będzie samo uświadomienie — to konkretna praca z rodem, z rodzicami, przywrócenie porządku, który gdzieś się zagubił. Tutaj każdy staje na swoim miejscu: córka wraca do bycia dzieckiem, matka — do bycia żoną. Zostałaś nauczona w przeszłości schematu, który nie musi być identyczny, ale jest analogiczny emocjonalnie: rywalizacja, napięcie, nieobecność, czekanie na to, by zostać wybraną."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepBP3"
                  as="p"
                  placeholder="Tym wzorcem może być też odtwarzanie rodowej historii romansu, który sprawił wiele bólu, odrzucenia, a nawet wykluczenia. Sekrety rodzinne wracają jak bumerang w kolejnych pokoleniach — bo tam, gdzieś, wyrządzono komuś krzywdę, która domaga się zobaczenia. Może właśnie swoim zachowaniem odtwarzasz historię swoich przodków — i nieświadomie ona rządzi Twoimi wyborami podwójnego życia."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Step C */}
          <ScrollReveal animation="fade-up" delay={stagger(2)}>
            <div className="flex flex-col gap-4 pt-8 border-t border-[#E8E3DB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#B8944A] text-white text-sm font-bold flex-shrink-0 [font-family:'Playfair_Display',serif]">
                  C
                </span>
                <EditableText
                  section={SECTION}
                  fieldPath="stepCTitle"
                  as="h3"
                  placeholder="Praca z mindsetem"
                  className="text-xl font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                />
              </div>
              <div className="flex flex-col gap-4 pl-12">
                <EditableText
                  section={SECTION}
                  fieldPath="stepCP1"
                  as="p"
                  placeholder="Masz swój określony światopogląd — sposób myślenia, przez pryzmat którego wyświetla Ci się rzeczywistość. To on sprawia, że pewne zachowania są dla Ciebie dobre, właściwe, pożądane, a inne — nieakceptowane, destrukcyjne, których trzeba unikać. Ten całokształt zbudowany jest z tysięcy przekonań, które od narodzin wdrukowali w Ciebie rodzice, rodzina, nauczyciele i otoczenie, w którym się wychowałaś. One, jako „jedyna prawda”, sprawiają, że automatycznie reagujesz w określony sposób."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepCP2"
                  as="p"
                  placeholder="Tak powstają połączenia neuronalne w mózgu, który jest bardzo ekonomiczny — nie traci czasu na analizę. Gdy coś jest wielokrotnie powtarzane, mózg uznaje to za daną bazową, a przypisane do niej słowa-klucze i emocje zawsze będą Cię kierować na tę samą, już wytworzoną ścieżkę neuronalną. To ona odpowiada za Twoje automatyczne reakcje."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepCP3"
                  as="p"
                  placeholder="Przyjrzymy się przekonaniom, według których rola kochanki jest dla Ciebie „normalna”. Zrobimy pełną listę tych ograniczających i zamienimy je na wspierające. To tydzień, w którym przeprogramowujemy wszystko to, co sprawiło, że rola kochanki stała się dla Ciebie dopuszczalną normą — mimo że wywołuje poczucie braku spójności, które wyniszcza Cię od środka."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepCP4"
                  as="p"
                  placeholder="Na świecie są miliardy mężczyzn, przy boku których możesz być tą jedyną — szanowaną, kochaną, zaopiekowaną. I na tej ścieżce niebawem się znajdziesz."
                  className="text-[15px] leading-relaxed italic text-[#2D2D2D] [font-family:'Lato',sans-serif]"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Transformation image — breathing space */}
          <ScrollReveal animation="fade-up">
            <div className="rounded-[20px] overflow-hidden">
              <EditableImage
                section={SECTION}
                fieldPath="processImg"
                fallbackSrc="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1400&q=80"
                alt="Motyl wyłaniający się z cienia ku światłu — symbol przemiany"
                className="w-full h-[280px] sm:h-[360px] object-cover"
              />
            </div>
          </ScrollReveal>

          {/* Step D */}
          <ScrollReveal animation="fade-up" delay={stagger(0)}>
            <div className="flex flex-col gap-4 pt-8 border-t border-[#E8E3DB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#B8944A] text-white text-sm font-bold flex-shrink-0 [font-family:'Playfair_Display',serif]">
                  D
                </span>
                <EditableText
                  section={SECTION}
                  fieldPath="stepDTitle"
                  as="h3"
                  placeholder="Praca z emocjami"
                  className="text-xl font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                />
              </div>
              <div className="flex flex-col gap-4 pl-12">
                <EditableText
                  section={SECTION}
                  fieldPath="stepDP1"
                  as="p"
                  placeholder="Żeby to wszystko, co zrobiłyśmy do tej pory, było trwałe i skuteczne — czas na kolejny, bardzo ważny krok: uwolnienie emocji, które latami kumulowały się w Twoim ciele. To najczęściej smutek, żal, wstyd, poczucie winy, złość, niepewność, poczucie bycia niewystarczającą — emocje, które w roli kochanki towarzyszyły Ci niemal codziennie."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepDP2"
                  as="p"
                  placeholder="Rozpoznamy je, jedną po drugiej, i damy im ostatni raz uwagę — tym razem świadomie wybierając, że więcej nie chcesz ich doświadczać. Użyjemy do tego sprawdzonych praktyk i technik uwalniania emocji, które od lat z powodzeniem stosuję z moimi klientkami. Cały proces przejdziemy razem, a Ty nauczysz się, jak robić to później samodzielnie, gdy tylko zajdzie taka potrzeba."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Step E */}
          <ScrollReveal animation="fade-up" delay={stagger(1)}>
            <div className="flex flex-col gap-4 pt-8 border-t border-[#E8E3DB]">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-[#B8944A] text-white text-sm font-bold flex-shrink-0 [font-family:'Playfair_Display',serif]">
                  E
                </span>
                <EditableText
                  section={SECTION}
                  fieldPath="stepETitle"
                  as="h3"
                  placeholder="Manifestacja nowej relacji"
                  className="text-xl font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
                />
              </div>
              <div className="flex flex-col gap-4 pl-12">
                <EditableText
                  section={SECTION}
                  fieldPath="stepEP1"
                  as="p"
                  placeholder="Jesteś już gotowa, by głośno określić, jakiej relacji chcesz dzisiaj."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepEP2"
                  as="p"
                  placeholder="Jakiego mężczyznę u swojego boku widzisz? Jakie jakości chcesz zaprosić do swojego życia? Czego pragniesz doświadczać, co chcesz współtworzyć i jak chcesz się czuć, gdy ten wymarzony mężczyzna jest przy Tobie?"
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepEP3"
                  as="p"
                  placeholder="Od teraz jesteś tą pierwszą. Tą jedyną. Zaopiekowaną, kochaną i szanowaną."
                  className="text-[15px] leading-relaxed font-medium text-[#B8944A] [font-family:'Lato',sans-serif]"
                />
                <EditableText
                  section={SECTION}
                  fieldPath="stepEP4"
                  as="p"
                  placeholder="To jeden z przyjemniejszych etapów tego procesu — skupiamy się na tym, czego pragniesz. Zaczniemy od intencji, a poprzez techniki manifestacji zaczniesz świadomie kreować rzeczywistość, którą dziś wybierasz. Twoją. Nie mamy, nie babci. Twoją."
                  className="text-[15px] leading-relaxed text-[#6B6B6B] [font-family:'Lato',sans-serif]"
                />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" className="flex justify-center pt-4">
            <EditableButtonLink
              section={SECTION}
              fieldPath="processCTA"
              defaultAction="calendly"
              className="inline-flex items-center justify-center px-10 py-4 rounded-lg bg-[#B8944A] text-white text-sm font-normal transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
            >
              <EditableText
                section={SECTION}
                fieldPath="processCTA"
                as="span"
                placeholder="Chcę przejść ten proces →"
              />
            </EditableButtonLink>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* ŻYCIE PO DRUGIEJ STRONIE                                            */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-20 bg-[#F9F6F0]"
        aria-label="Życie, które Cię czeka po drugiej stronie"
      >
        <div className="max-w-[700px] mx-auto flex flex-col gap-8">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-start gap-4">
              <SectionBadge label="Po transformacji" />
              <EditableText
                section={SECTION}
                fieldPath="afterTitle"
                as="h2"
                placeholder="Życie, które Cię czeka po drugiej stronie"
                className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="flex flex-col gap-6">
              <EditableText
                section={SECTION}
                fieldPath="afterP1"
                as="p"
                placeholder="Ten proces to prosta droga do życia w prawdzie — pod warunkiem, że wiesz, jak to zrobić. A tym, by przeprowadzić Cię z punktu A (obecnej roli) do punktu B (wolności od życia w ukryciu), zajmę się ja."
                className="text-base leading-[1.85] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="afterP2"
                as="p"
                placeholder="Po tym procesie pozwalasz sobie na bycie tą jedyną dla swojego mężczyzny — takiego, z którym możesz pokazać się światu w mediach społecznościowych, planować wspólne święta, wakacje, spotkania z przyjaciółmi. Stajesz się kobietą, która pozwala sobie być kochaną, szanowaną i wybieraną — zawsze jako ta jedyna."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="afterP3"
                as="p"
                placeholder="Twoje życie staje się takie, o jakim marzyłaś, choć przez lata myślałaś, że nie jesteś tego warta. Czujesz się piękna, zaopiekowana, wystarczająca. Zakochujesz się w prawdzie i zapraszasz do swojego życia spokój i harmonię."
                className="text-base leading-[1.85] italic text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* SKĄD TO WSZYSTKO WIEM                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-20 bg-white"
        aria-label="Skąd to wszystko wiem"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-start gap-3">
              <SectionBadge label="Dlaczego warto" gold />
              <EditableText
                section={SECTION}
                fieldPath="credTitle"
                as="h2"
                placeholder="Skąd to wszystko wiem"
                className="text-3xl sm:text-4xl font-bold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <ScrollReveal animation="fade-up">
              <div className="rounded-[20px] overflow-hidden">
                <EditableImage
                  section={SECTION}
                  fieldPath="credPhoto"
                  fallbackSrc={ane1Photo}
                  alt="Aneta — terapeutka i coach"
                  className="w-full h-[420px] lg:h-[480px] object-cover object-top"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal
              animation="fade-up"
              delay={100}
              className="flex flex-col gap-6"
            >
              <EditableText
                section={SECTION}
                fieldPath="credP1"
                as="p"
                placeholder="W ostatnich 6 latach poprowadziłam wiele warsztatów o kobiecości. Temat kochanki powracał nieśmiało, ale z rosnącą intensywnością — nie tylko w roli „tej drugiej”, ale też żon, które zdradzają. Skala tego zjawiska mnie zaskoczyła. Jeszcze bardziej zaskoczyło mnie to, jak wielkim tabu wciąż jest szczera rozmowa na ten temat."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="credP2"
                as="p"
                placeholder="Jest jakaś społeczna „tolerancja” dla zdrady mężczyzny, a kobietom przypisana jest rola „tej świętej”. Gdy kobieta z tej „świętości” rezygnuje, wkracza na ścieżkę oceny, ostracyzmu, wykluczenia. I najokrutniejsze w tym bywają inne kobiety."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="credP3"
                as="p"
                placeholder="Kobiety wstydzą się tego, co robią, nie rozumiejąc do końca, dlaczego właściwie tak postępują. Czują ogromną winę. Tkwią w takich relacjach latami. A wystarczy zadać sobie kilka pytań:"
                className="text-base leading-[1.85] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
            </ScrollReveal>
          </div>

          <ScrollReveal
            animation="fade-up"
            className="flex flex-col divide-y divide-[#E8E3DB] max-w-[900px]"
          >
            <div className="pb-7">
              <ul className="flex flex-col gap-3">
                {[
                  {
                    field: 'credQ1',
                    placeholder: 'Dlaczego przyciągam żonatych mężczyzn?',
                  },
                  {
                    field: 'credQ2',
                    placeholder: 'Dlaczego zdradzam swojego partnera?',
                  },
                  {
                    field: 'credQ3',
                    placeholder: 'Dlaczego wybieram podwójne życie?',
                  },
                  { field: 'credQ4', placeholder: 'Dlaczego wybieram sekrety?' },
                ].map(({ field, placeholder }) => (
                  <li key={field} className="flex items-start gap-3">
                    <span
                      className="text-[#B8944A] text-lg leading-none mt-0.5 [font-family:'Cormorant_Garamond',serif]"
                      aria-hidden="true"
                    >
                      —
                    </span>
                    <EditableText
                      section={SECTION}
                      fieldPath={field}
                      as="span"
                      placeholder={placeholder}
                      className="text-base italic text-[#2D2D2D] [font-family:'Lato',sans-serif]"
                    />
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-7 flex flex-col gap-6">
              <EditableText
                section={SECTION}
                fieldPath="credP4"
                as="p"
                placeholder="Bo przecież robimy to z jakiegoś powodu — na pewno nie z nudów."
                className="text-base leading-[1.85] italic text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="credP5"
                as="p"
                placeholder="Przy mnie kobiety czują się bezpiecznie, bo ich nie oceniam. Wiem, że to, w czym obecnie tkwią, ma swój początek poza nimi — one to tylko odtwarzają, i to często nieświadomie."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="credP6"
                as="p"
                placeholder="Jeśli zdradzasz swojego partnera i nie chcesz tego robić, ale jakaś siła sprawia, że nie potrafisz przestać — dobrze trafiłaś. Wiem, jak skutecznie pracować ze wzorcami, programami i uwikłaniami. Nauczę Cię, jak pracować z przekonaniami i jak uwalniać stare emocje z ciała."
                className="text-base leading-[1.85] font-medium text-[#2D2D2D] border-l-2 border-[#B8944A] pl-5 [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* JAK WYGLĄDA WSPÓŁPRACA                                              */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-20 bg-[#F5EFE6]"
        aria-label="Jak wygląda współpraca"
      >
        <div className="max-w-[1000px] mx-auto flex flex-col gap-10">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col items-start gap-4">
              <SectionBadge label="Współpraca" />
              <EditableText
                section={SECTION}
                fieldPath="collabTitle"
                as="h2"
                placeholder="Jak wygląda współpraca"
                className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <div className="flex flex-col gap-5 max-w-[700px]">
              <EditableText
                section={SECTION}
                fieldPath="collabP1"
                as="p"
                placeholder='Proces „Dlaczego przyciągasz żonatych mężczyzn?” to 5 tygodni intensywnej pracy.'
                className="text-lg font-medium text-[#B8944A] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="collabP2"
                as="p"
                placeholder="Co tydzień spotykamy się na indywidualnej sesji 1 na 1, pracując nad kolejnym obszarem. Pracujemy zdalnie, minimum 4 godziny tygodniowo, a pomiędzy sesjami masz moje wsparcie na WhatsApp — bo przemyślenia i refleksje przychodzą właśnie wtedy, między spotkaniami. Dodatkowo otrzymujesz ode mnie materiały i ćwiczenia do wykonania między sesjami."
                className="text-base leading-[1.85] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section={SECTION}
                fieldPath="collabP3"
                as="p"
                placeholder="Zaczynasz patrzeć na swoje dotychczasowe życie jak obserwatorka — bez oceniania siebie, a ze zrozumieniem i miłością do tego, że to był po prostu program albo uwikłanie, które nieświadomie Tobą rządziło. Program, który właśnie w tym procesie dekodujesz, żegnasz i definitywnie zamykasz — jako stary rozdział swojego życia."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200}>
            <div className="flex flex-col gap-6 p-8 sm:p-10 rounded-2xl bg-white">
              <EditableText
                section={SECTION}
                fieldPath="gainsTitle"
                as="h3"
                placeholder="Co zyskujesz, decydując się na transformację ze mną:"
                className="text-xl font-semibold text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4">
                <Checklist
                  variant="gold"
                  items={[
                    {
                      field: 'gain1',
                      placeholder: 'Poznajesz źródło swojej roli bycia kochanką.',
                    },
                    {
                      field: 'gain2',
                      placeholder:
                        'Trwale zmieniasz wzorzec kobiety, która ma romans, na kobietę, która nie musi już zdradzać ani być tą drugą.',
                    },
                    {
                      field: 'gain3',
                      placeholder:
                        'Uwalniasz emocje z ciała i poznajesz techniki, które możesz później wykorzystywać samodzielnie.',
                    },
                    {
                      field: 'gain4',
                      placeholder:
                        'Definiujesz nowy rozdział swojego życia jako jedyna kobieta swojego partnera.',
                    },
                  ]}
                />
                <Checklist
                  variant="gold"
                  items={[
                    {
                      field: 'gain5',
                      placeholder:
                        'Przeprogramowujesz stare wzorce i zmieniasz przekonania, by zmiana mogła zaistnieć trwale.',
                    },
                    {
                      field: 'gain6',
                      placeholder:
                        'Zyskujesz pewność siebie i definitywnie porzucasz stare życie.',
                    },
                    {
                      field: 'gain7',
                      placeholder:
                        'Uczysz się kreacji i manifestacji, by zaprosić zmiany do swojego życia.',
                    },
                    {
                      field: 'gain8',
                      placeholder:
                        'Przechodzisz pełny proces: od rozpoznania, przez uwolnienie, przeprogramowanie wzorców, dynamik i uwikłań, po uwolnienie starych emocji z ciała i stworzenie nowej rzeczywistości — takiej, do której masz odwagę stanąć jako kobieta zawsze wystarczająca.',
                    },
                  ]}
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* NIE DLA CIEBIE JEŚLI                                                */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="px-6 py-16 sm:py-20 bg-[#EEE6D8]"
        aria-label="Ten program nie jest dla Ciebie, jeśli"
      >
        <div className="max-w-[700px] mx-auto flex flex-col gap-8">
          <ScrollReveal animation="fade-up">
            <EditableText
              section={SECTION}
              fieldPath="notForTitle"
              as="h2"
              placeholder="Ten program nie jest dla Ciebie, jeśli:"
              className="text-2xl sm:text-3xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
            />
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={100}>
            <Checklist
              variant="muted"
              items={[
                { field: 'notFor1', placeholder: 'Bycie kochanką to Twój żywioł.' },
                {
                  field: 'notFor2',
                  placeholder:
                    'Uwielbiasz ten dreszczyk emocji i nie masz zamiaru z niego zrezygnować.',
                },
                {
                  field: 'notFor3',
                  placeholder: 'To Twój styl życia i całkowicie Ci odpowiada.',
                },
                {
                  field: 'notFor4',
                  placeholder: 'Nie potrzebujesz relacji opartej na partnerstwie.',
                },
                {
                  field: 'notFor5',
                  placeholder:
                    'Nie lubisz się wiązać na stałe i taki układ jest dla Ciebie idealny.',
                },
              ]}
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FINAL CTA — Twój pierwszy ruch                                      */}
      {/* ------------------------------------------------------------------ */}
      <section
        className="relative flex flex-col items-center text-center px-6 py-20 sm:py-24 overflow-hidden"
        aria-label="Twój pierwszy ruch"
      >
        <EditableBackground
          section={SECTION}
          fieldPath="ctaBg"
          fallbackSrc="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section={SECTION}
          fieldPath="ctaBg"
          color="30,21,6"
          defaultTop={75}
          defaultBottom={85}
        />

        <ScrollReveal
          animation="fade"
          duration={900}
          className="relative z-10 flex flex-col items-center gap-6 max-w-[680px]"
        >
          <EditableText
            section={SECTION}
            fieldPath="finalTitle"
            as="h2"
            placeholder="Twój pierwszy ruch"
            className="text-3xl sm:text-4xl font-bold text-white [font-family:'Playfair_Display',serif]"
          />
          <div className="flex flex-col gap-4">
            <EditableText
              section={SECTION}
              fieldPath="finalP1"
              as="p"
              placeholder="Życie w nieprawdzie to duży ciężar. Masz dość tego napięcia, stresu i niepewności?"
              className="text-base sm:text-lg leading-relaxed text-white/85 [font-family:'Lato',sans-serif]"
            />
            <EditableText
              section={SECTION}
              fieldPath="finalP2"
              as="p"
              placeholder="Zapraszam Cię na bezpłatną rozmowę, byśmy mogły się poznać i sprawdzić, czy ten program jest dokładnie dla Ciebie. Wystarczy jeden telefon, by się dowiedzieć."
              className="text-base leading-relaxed text-white/70 [font-family:'Lato',sans-serif]"
            />
            <EditableText
              section={SECTION}
              fieldPath="finalP3"
              as="p"
              placeholder="To Twoja historia, która Cię męczy? Czekam na Twój pierwszy ruch, o resztę zadbam ja i poprowadzę Cię przez ten proces krok po kroku."
              className="text-base leading-relaxed text-white/70 [font-family:'Lato',sans-serif]"
            />
          </div>

          <div className="w-full text-left bg-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
            <EditableText
              section={SECTION}
              fieldPath="finalListTitle"
              as="p"
              placeholder='Wybierając udział w programie „Dlaczego przyciągasz żonatych mężczyzn?”:'
              className="text-sm font-semibold uppercase tracking-wide text-[#E8CE8A] mb-4 [font-family:'Lato',sans-serif]"
            />
            <Checklist
              variant="onDark"
              items={[
                {
                  field: 'finalList1',
                  placeholder: 'Trwale uwalniasz się od wyboru bycia kochanką.',
                },
                {
                  field: 'finalList2',
                  placeholder:
                    'Wybierasz życie w prawdzie i spokoju u boku mężczyzny, który jest tylko dla Ciebie.',
                },
                {
                  field: 'finalList3',
                  placeholder:
                    'Porzucasz ciężar życia w niepewności, oczekiwaniu i ukryciu.',
                },
                {
                  field: 'finalList4',
                  placeholder:
                    'Nie musisz już uważać, co mówisz, gdzie jesteś i co możesz.',
                },
                {
                  field: 'finalList5',
                  placeholder: 'Wybierasz siebie i budujesz poczucie własnej wartości.',
                },
                {
                  field: 'finalList6',
                  placeholder:
                    'Rezygnujesz z poświęcania się i wmawiania sobie, że „to wystarczy”.',
                },
                {
                  field: 'finalList7',
                  placeholder:
                    'Wybierasz spójność jako najlepszy wskaźnik tego, co w Tobie i co na zewnątrz.',
                },
                {
                  field: 'finalList8',
                  placeholder: 'Zapraszasz do życia spokój i harmonię.',
                },
                {
                  field: 'finalList9',
                  placeholder: 'Rezygnujesz z walki i rywalizacji.',
                },
              ]}
            />
          </div>

          <EditableText
            section={SECTION}
            fieldPath="finalQuestion"
            as="p"
            placeholder="Gotowa na ten pierwszy ruch?"
            className="text-xl italic text-white [font-family:'Cormorant_Garamond',serif]"
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <EditableButtonLink
              section={SECTION}
              fieldPath="finalCTA"
              defaultAction="calendly"
              className="inline-flex items-center justify-center px-10 py-4 rounded-full bg-[#B8944A] text-white text-base font-bold transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
            >
              <EditableText
                section={SECTION}
                fieldPath="finalCTA"
                as="span"
                placeholder="Umów bezpłatną rozmowę →"
              />
            </EditableButtonLink>
          </div>

          <EditableText
            section={SECTION}
            fieldPath="finalDisclaimer"
            as="p"
            placeholder="Możesz pracować ze mną z każdego zakątka świata, pracujemy całkowicie zdalnie, a cały proces objęty jest klauzulą poufności."
            className="text-xs italic text-white/50 max-w-[480px] [font-family:'Lato',sans-serif]"
          />
        </ScrollReveal>
      </section>
    </main>
  );
}
