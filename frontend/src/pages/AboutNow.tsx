import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Dog, Flower2, MapPin } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { GrowingMeadow } from '@/components/shared/GrowingMeadow';
import { LandingDragonfly } from '@/components/shared/LandingDragonfly';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import portraitPhoto from '@/assets/Ane1.jpg';
import profilePhoto from '@/assets/Ane3.jpg';
import joyPhoto from '@/assets/Ane4.jpg';
import bouquetArt from '@/assets/watercolor/bouquet.webp';
import blueBlot from '@/assets/watercolor/blot-blue.webp';
import { WatercolorNumber } from '@/components/shared/WatercolorNumber';
import {
  RainbowStroke,
  WatercolorAccent,
  WatercolorFriend,
} from '@/components/shared/Watercolor';

// ---------------------------------------------------------------------------
// O mnie — 2026-11 redesign
//
// Light, personal page built from the client's own text (chapter "O mnie" of
// her ebook, see plan/teksty-klientki/swiadomie-zyc-ebook.md). Rendered at
// /o-mnie while the `classicAbout` flag is off; pages/About.tsx is kept intact.
// CMS section `aboutNow` is separate from `about`, so old saved text never
// leaks in.
// ---------------------------------------------------------------------------

const S = 'aboutNow' as const;

const eyebrow =
  "font-['Lato'] text-[13px] uppercase tracking-[0.2em] text-brand-dark";
const heading =
  "font-['Cormorant_Garamond'] text-[36px] md:text-[48px] leading-[1.15] text-ink";
const body = "font-['Lato'] text-[17px] leading-[1.75] text-ink-soft";
const cardTitle =
  "font-['Cormorant_Garamond'] text-[26px] leading-tight text-ink";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-9 py-4 font-['Lato'] text-[15px] font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-action/25 bg-white px-9 py-4 font-['Lato'] text-[15px] font-semibold text-action transition-colors hover:bg-sky-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const sectionPad = 'px-6 md:px-12 lg:px-[120px]';

// ---------------------------------------------------------------------------
// 1. Intro — portrait + who I am
// ---------------------------------------------------------------------------

// Lavender hero (client 2026-11-10: the blue blots looked murky — "użyj
// lawendy i tego serca, zaprojektuj ładne hero z tymi fioletowymi
// grafikami"). Clean lilac light instead of multiplied blots, a lavender
// card behind the portrait and her painted lavender heart on its corner.
function IntroSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-gradient-to-b from-lavender-mist via-white to-white ${sectionPad} py-16 md:py-24`}
    >
      {/* soft lilac light, crisp gradients (no multiply → never muddy) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,var(--color-lavender-soft)_0%,transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-48 -right-40 -z-10 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,var(--color-lavender-soft)_0%,transparent_66%)]"
      />
      <div className="mx-auto grid max-w-[1120px] items-center gap-14 md:grid-cols-[1.1fr_1fr] lg:gap-20">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col gap-5">
            <EditableText
              section={S}
              fieldPath="intro.eyebrow"
              as="p"
              className="max-w-fit self-start rounded-full bg-white/80 px-4 py-1.5 font-['Lato'] text-[13px] font-semibold uppercase tracking-[0.2em] text-lavender shadow-[0_6px_20px_-12px_rgba(122,90,166,0.6)]"
            >
              O mnie
            </EditableText>
            <EditableText
              section={S}
              fieldPath="intro.title"
              as="h1"
              className="font-['Cormorant_Garamond'] text-[22px] md:text-[32px] leading-[1.15] text-ink"
            >
              Nazywam się Aneta Mroczko
            </EditableText>
            <RainbowStroke className="-mt-3 w-[150px] md:w-[220px]" />
            <EditableText
              section={S}
              fieldPath="intro.body1"
              as="p"
              className={body}
            >
              Jestem coachką z 13-letnim doświadczeniem. Ale nie chodzi o moje
              tytuły, kursy, studia i szkolenia.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="intro.body2"
              as="p"
              className={body}
            >
              Chodzi o moje bycie sobą i o moje doświadczenie — i tym właśnie
              się z Tobą dzielę.
            </EditableText>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <EditableButtonLink
                section={S}
                fieldPath="intro.cta"
                defaultAction="internal:/kontakt"
                className={primaryBtn}
              >
                <EditableText section={S} fieldPath="intro.cta">
                  Umów rozmowę
                </EditableText>
              </EditableButtonLink>
            </div>
          </div>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={200}>
          <div className="relative isolate mx-auto w-full max-w-[400px] md:max-w-[440px]">
            {/* lavender card peeking out behind the portrait */}
            <div
              aria-hidden="true"
              className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rotate-[4deg] rounded-[36px] bg-lavender-soft md:translate-x-6 md:translate-y-6"
            />
            <WatercolorFriend
              kind="butterflyYellow"
              fly="right"
              className="-left-4 top-8 z-10 w-[68px] md:-left-12 md:w-[90px]"
            />
            <div className="relative aspect-[3/4] overflow-hidden rounded-[32px] shadow-[0_24px_60px_-30px_rgba(122,90,166,0.55)]">
              <EditableImage
                section={S}
                fieldPath="intro.photo"
                fallbackSrc={portraitPhoto}
                alt="Aneta Mroczko"
                className="h-full w-full object-cover"
              />
            </div>
            {/* the client's painted lavender heart on the portrait's corner */}
            <WatercolorFriend
              kind="lavender"
              float
              delay={1}
              className="-bottom-12 -left-6 z-10 w-[36%] md:-bottom-14 md:-left-[26%] md:w-[42%]"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Moja droga — four steps of her story
// ---------------------------------------------------------------------------

/** Watercolor number tones in blues (see WatercolorNumber TONE_PAIRS). */
const BLUE_TONES = [2, 5, 2, 5] as const;

const JOURNEY = [
  {
    key: 'earth',
    title: 'Ziemia i woda',
    body: 'Fascynował mnie świat i ziemia, więc skończyłam geologię. Ponad 13 lat pracowałam przy wydobyciu wody głębinowej — dostarczałam innym coś, bez czego nie da się żyć.',
  },
  {
    key: 'mountains',
    title: 'Beskidy',
    body: 'Gdy formalności zaczęły mnie wypalać, „rzuciłam wszystko i pojechałam w Beskidy”. Wreszcie miałam czas i przestrzeń, by zaopiekować się sobą, odpuścić żal, złość i poczucie winy.',
  },
  {
    key: 'psychobiology',
    title: 'Psychobiologia',
    body: 'Największym przełomem było poznanie psychobiologii. Przestałam się bać chorób i śmierci. Od 2016 roku dekoduję przekonania i programy, które sprawiały, że byłam zlękniona i zagubiona.',
  },
  {
    key: 'guidance',
    title: 'Prowadzenie',
    body: 'Dziś wiem, że jestem prowadzona. A jednocześnie jest w tym przestrzeń na świadome decyzje i zmiany — i tym zajmuję się niezmiennie od wielu lat.',
  },
] as const;

function JourneySection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-surface ${sectionPad} py-20 md:py-28`}
    >
      {/* same watercolor blots as the cream sections on Start */}
      <WatercolorAccent
        tone="warm"
        className="-left-24 -top-24 w-[300px] opacity-40 md:w-[400px]"
      />
      <WatercolorAccent
        tone="cool"
        className="-bottom-28 -right-24 w-[300px] opacity-35 md:w-[420px]"
      />
      <WatercolorFriend
        kind="butterflyGreen"
        fly="left"
        delay={1}
        className="right-[4%] top-3 w-[56px] md:right-[8%] md:top-4 md:w-[88px]"
      />
      <div className="mx-auto max-w-[1120px]">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto mb-14 flex max-w-[640px] flex-col gap-4 text-center">
            <EditableText
              section={S}
              fieldPath="journey.eyebrow"
              as="p"
              className={eyebrow}
            >
              Moja droga
            </EditableText>
            <EditableText
              section={S}
              fieldPath="journey.title"
              as="h2"
              className={heading}
            >
              Cierpienie było częścią mojej drogi
            </EditableText>
            <EditableText
              section={S}
              fieldPath="journey.subtitle"
              as="p"
              className={body}
            >
              Próbowałam technik i metod, jednej po drugiej. Czy działały? Na
              chwilę tak. A ja szłam dalej i testowałam wszystko na sobie.
            </EditableText>
          </div>
        </ScrollReveal>

        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map(({ key, title, body: text }, i) => (
            <ScrollReveal key={key} animation="fade-up" delay={stagger(i)}>
              <li className="flex h-full flex-col gap-4 rounded-[24px] border border-spiral-blue-soft bg-white p-7">
                <WatercolorNumber
                  n={i + 1}
                  tone={BLUE_TONES[i % BLUE_TONES.length]}
                  size={60}
                  className="-ml-1 -mt-1"
                />
                <EditableText
                  section={S}
                  fieldPath={`journey.${key}.title`}
                  as="h3"
                  className={cardTitle}
                >
                  {title}
                </EditableText>
                <EditableText
                  section={S}
                  fieldPath={`journey.${key}.body`}
                  as="p"
                  className="font-['Lato'] text-[16px] leading-[1.7] text-ink-soft"
                >
                  {text}
                </EditableText>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Quote — accepting myself
// ---------------------------------------------------------------------------

function QuoteSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-white ${sectionPad} py-20 md:py-28`}
    >
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <ScrollReveal animation="fade-up">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px]">
              <EditableImage
                section={S}
                fieldPath="quote.photo"
                fallbackSrc={profilePhoto}
                alt="Aneta Mroczko"
                className="h-full w-full object-cover object-right"
              />
              {/* the client's wildflowers growing up from the bottom of the
                photo (2026-11-10); their roots sit below the frame, and the meadow is
                mirrored so its tall blue delphinium grows beside the face,
                not over it */}
              <GrowingMeadow className="inset-x-0 -bottom-[32%] w-full -scale-x-100" />
            </div>
            {/* the turquoise dragonfly flies down from above the photo and
              lands on the yellow flower of the meadow (client 2026-11-10) */}
            <LandingDragonfly className="left-[23%] top-[52%] w-[26%]" />
          </div>
        </ScrollReveal>
        <ScrollReveal animation="blur" delay={200}>
          <figure className="flex flex-col gap-6">
            <EditableText
              section={S}
              fieldPath="quote.text"
              as="blockquote"
              className="font-['Cormorant_Garamond'] text-[30px] md:text-[36px] lg:text-[40px] italic leading-[1.3] text-ink"
            >
              Przestałam się porównywać i oceniać na tle innych. Uznałam, że
              taka, jaka jestem, jestem wartością — i lubię siebie.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="quote.body"
              as="p"
              className={body}
            >
              Lubię siebie w procesie poznawania swoich darów i jakości, a także
              ograniczeń — i pracuję z nimi na bieżąco.
            </EditableText>
          </figure>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Tak przyziemnie — personal facts
// ---------------------------------------------------------------------------

const FACTS = [
  {
    key: 'daughter',
    Icon: HeartHandshake,
    body: 'Jestem mamą dorosłej, wyjątkowej kobiety, która była i jest dla mnie najlepszym nauczycielem.',
  },
  {
    key: 'dogs',
    Icon: Dog,
    body: 'Kocham psy. Uczę się od nich kochać tak, jak tylko one potrafią — bez warunków.',
  },
  {
    key: 'partner',
    Icon: Flower2,
    body: 'Jestem w relacji partnerskiej, w której czuję się pełnią — kwitnącym nenufarem.',
  },
  {
    key: 'places',
    Icon: MapPin,
    body: 'Raz mieszkam tu, raz tam. Wciąż szukam miejsca dla siebie, a może raczej próbuję je sobie „wyśpiewać”.',
  },
] as const;

function FactsSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-surface ${sectionPad} py-20 md:py-28`}
    >
      {/* mirrored blots (Start style) so the two cream sections differ */}
      <WatercolorAccent
        tone="warm"
        className="-right-24 -top-24 w-[300px] opacity-40 md:w-[400px]"
      />
      <WatercolorAccent
        tone="cool"
        className="-bottom-28 -left-24 w-[300px] opacity-35 md:w-[420px]"
      />
      <WatercolorFriend
        kind="butterflyBlue"
        fly="right"
        delay={2.5}
        className="left-[4%] top-3 w-[56px] md:left-[8%] md:top-4 md:w-[88px]"
      />
      <div className="mx-auto max-w-[1000px]">
        <ScrollReveal animation="fade-up">
          <EditableText
            section={S}
            fieldPath="facts.title"
            as="h2"
            className={`${heading} mb-12 text-center`}
          >
            A tak przyziemnie…
          </EditableText>
        </ScrollReveal>
        <div className="grid gap-5 sm:grid-cols-2">
          {FACTS.map(({ key, Icon, body: text }, i) => (
            <ScrollReveal key={key} animation="fade-up" delay={stagger(i, 100)}>
              <div className="flex h-full items-start gap-4 rounded-[20px] bg-white p-6 shadow-[0_6px_24px_-16px_rgba(63,48,68,0.25)]">
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-spiral-blue-soft ${i % 2 === 0 ? 'text-spiral-blue' : 'text-spiral-teal'}`}
                >
                  <Icon size={20} aria-hidden="true" />
                </span>
                <EditableText
                  section={S}
                  fieldPath={`facts.${key}`}
                  as="p"
                  className="font-['Lato'] text-[16px] leading-[1.7] text-ink-soft"
                >
                  {text}
                </EditableText>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Closing — who I really am + invitation
// ---------------------------------------------------------------------------

/**
 * The client's painted forget-me-nots creeping onto the side of the closing
 * photo when it scrolls into view, then swaying gently (client 2026-11-10:
 * "niech nachodzą na zdjęcie, ale może z boku"). Most of the bouquet stays
 * just outside the photo's left edge, so the flowers don't get lost on it.
 */
function CreepingForgetMeNots() {
  const { ref, inView } = useInViewOnce<HTMLSpanElement>(0.35);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute -bottom-[6%] -left-[10%] z-10 block w-[52%] select-none sm:-left-[27%] sm:w-[62%]"
      style={{
        transformOrigin: 'bottom left',
        transform: inView ? 'none' : 'translateX(-38%) rotate(-16deg)',
        opacity: inView ? 1 : 0,
        transition:
          'transform 2.2s cubic-bezier(0.22, 0.8, 0.3, 1) 0.3s, opacity 1.2s ease-out 0.3s',
      }}
    >
      {/* soft blue blot under the flowers, as on Start, so they stand out
          on the photo (client 2026-11-10: "daj im pod spód niebieskie tło") */}
      {/* white base first, so the blot reads as the same pale blue as on
          Start's white background instead of a dark blue patch */}
      <span className="absolute bottom-[2%] left-[2%] block aspect-square w-[96%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.8)_45%,transparent_70%)]" />
      <img
        src={blueBlot}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute bottom-[8%] left-[10%] block h-auto w-[80%] opacity-35"
      />
      <img
        src={bouquetArt}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="relative block h-auto w-full origin-bottom-left animate-sway"
      />
    </span>
  );
}

function ClosingSection() {
  return (
    <section
      className={`overflow-hidden bg-white ${sectionPad} py-20 md:py-28`}
    >
      <div className="mx-auto grid max-w-[1000px] items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        <ScrollReveal animation="fade-up">
          <div className="relative mx-auto w-full max-w-[360px]">
            <div className="aspect-[3/4] w-full overflow-hidden rounded-[32px]">
              <EditableImage
                section={S}
                fieldPath="closing.photo"
                fallbackSrc={joyPhoto}
                alt="Aneta Mroczko"
                className="h-full w-full object-cover object-[50%_60%]"
              />
            </div>
            <CreepingForgetMeNots />
          </div>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={200}>
          <div className="flex flex-col gap-5">
            <EditableText
              section={S}
              fieldPath="closing.title"
              as="h2"
              className={heading}
            >
              Dziś przypominam sobie, kim naprawdę jestem
            </EditableText>
            <EditableText
              section={S}
              fieldPath="closing.body"
              as="p"
              className={body}
            >
              Pozwalam sobie na siebie — bez całej tej reżyserii z zewnątrz, co
              trzeba, co wypada i co należy. Jeśli i Ty chcesz przestać utykać w
              miejscu, porozmawiajmy.
            </EditableText>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <EditableButtonLink
                section={S}
                fieldPath="closing.cta"
                defaultAction="internal:/kontakt"
                className={primaryBtn}
              >
                <EditableText section={S} fieldPath="closing.cta">
                  Umów rozmowę
                </EditableText>
              </EditableButtonLink>
              <Link to="/wydarzenia" className={secondaryBtn}>
                <EditableText section={S} fieldPath="closing.ctaEvents">
                  Zobacz wydarzenia
                </EditableText>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page composition
// ---------------------------------------------------------------------------

export default function AboutNow() {
  return (
    <main>
      <SEO
        title="O mnie"
        description="Aneta Mroczko — coachka z 13-letnim doświadczeniem. Geologia, Beskidy, psychobiologia i droga do świadomego życia w teraz."
        canonical="/o-mnie"
        pathname="/o-mnie"
      />
      <IntroSection />
      <JourneySection />
      <QuoteSection />
      <FactsSection />
      <ClosingSection />
    </main>
  );
}
