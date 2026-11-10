import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Dog, Flower2, MapPin } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { GrowingMeadow } from '@/components/shared/GrowingMeadow';
import {
  LandingDragonfly,
  LandingYellowButterfly,
} from '@/components/shared/LandingFriend';
import { useInViewOnce } from '@/hooks/useInViewOnce';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import portraitPhoto from '@/assets/Ane1.jpg';
import profilePhoto from '@/assets/Ane3.jpg';
import joyPhoto from '@/assets/Ane4.jpg';
import bouquetArt from '@/assets/watercolor/bouquet.webp';
import blueBlot from '@/assets/watercolor/blot-blue.webp';
import aboutArt from '@/assets/watercolor/about-joy.webp';
import aboutWreath from '@/assets/watercolor/about-wreath.webp';
import lavenderArt from '@/assets/watercolor/lavender-heart.webp';
import ladybugArt from '@/assets/watercolor/ladybug.webp';
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
      className={`relative isolate overflow-hidden bg-surface ${sectionPad} py-16 md:py-24`}
    >
      {/* painted pastel blooms in the four corners (plan/brand/
          paint-watercolor.cjs "about"); editable like the Start / Kontakt
          hero art */}
      <EditableBackground
        section={S}
        fieldPath="intro.artBg"
        fallbackSrc={aboutArt}
        className="absolute inset-0 -z-10"
        aria-hidden={true}
      />
      <EditableOverlay
        section={S}
        fieldPath="intro.artBg"
        color="255,255,255"
        defaultTop={0}
        defaultBottom={0}
      />
      <div className="relative z-10 mx-auto grid max-w-[1120px] items-center gap-14 md:grid-cols-[1.1fr_1fr] lg:gap-20">
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
          <div className="relative isolate mx-auto w-full max-w-[340px] md:max-w-[400px]">
            {/* a wreath of watercolour blots in the logo spiral's colours
                around the portrait, turning very slowly like the spiral
                (client 2026-11-10: "równie kolorowe, inne, niech
                zaciekawia") */}
            <img
              src={aboutWreath}
              alt=""
              aria-hidden="true"
              decoding="async"
              draggable={false}
              className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[150%] max-w-none -translate-x-1/2 -translate-y-1/2 select-none animate-[spin_120s_linear_infinite] md:w-[160%]"
            />
            {/* arched portrait, like a window in the wreath */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-b-[32px] rounded-t-[999px] shadow-[0_24px_60px_-30px_rgba(122,90,166,0.55)] ring-[6px] ring-white/90">
              <EditableImage
                section={S}
                fieldPath="intro.photo"
                fallbackSrc={portraitPhoto}
                alt="Aneta Mroczko"
                className="h-full w-full object-cover"
              />
            </div>
            {/* the client's painted lavender heart on the portrait's corner,
                with the yellow butterfly flying in to land on the lavender
                (2026-11-10); both float together */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-12 -left-6 z-10 block w-[36%] select-none animate-float md:-bottom-14 md:-left-[26%] md:w-[42%]"
              style={{ animationDelay: '1s' }}
            >
              <img
                src={lavenderArt}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
                className="block h-auto w-full"
              />
              <LandingYellowButterfly className="bottom-[88%] left-[56%] w-[42%] -translate-x-1/2" />
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Moja droga — four steps of her story
// ---------------------------------------------------------------------------

// Moja droga as a painted path (client 2026-11-10: the four frames were
// "nudne" — make it "ciekawe i spójne"). Four stops on a dotted, hand-
// painted trail that draws itself as you scroll; the colours travel from
// cool blues (the hard years) to warm coral and gold (the light she found).
// Texts alternate left / right of the trail on wide screens; on phones the
// trail runs down the left edge. Same CMS fields as before (journey.*).

/** WatercolorNumber tone per stop (TONE_PAIRS): teal, blue, coral, gold. */
const STOP_TONES = [2, 5, 0, 1] as const;
/** Trail colour leaving each stop (bright spiral colours). */
const TRAIL = ['#22c3df', '#6f8ffa', '#ff5a48', '#ffd23f'] as const;
/** The client's painted friends beside each stop (wide screens). */
const STOP_FRIENDS = [
  'dragonflyBlue',
  'butterflyGreen',
  'butterfly',
  'butterflyYellow',
] as const;

const JOURNEY = [
  {
    key: 'earth',
    title: 'Ziemia i woda',
    body: 'Fascynował mnie świat i ziemia, więc skończyłam geologię. Ponad 13 lat pracowałam przy wydobyciu wody głębinowej — dostarczałam innym coś, bez czego nie da się żyć.',
  },
  // order per the client (2026-11-10): water & earth, then psychobiology,
  // then the Beskidy, and guidance last. Keys stay the same, so texts she
  // already saved move with their stop.
  {
    key: 'psychobiology',
    title: 'Psychobiologia',
    body: 'Największym przełomem było poznanie psychobiologii. Przestałam się bać chorób i śmierci. Od 2016 roku dekoduję przekonania i programy, które sprawiały, że byłam zlękniona i zagubiona.',
  },
  {
    key: 'mountains',
    title: 'Beskidy',
    body: 'Gdy formalności zaczęły mnie wypalać, „rzuciłam wszystko i pojechałam w Beskidy”. Wreszcie miałam czas i przestrzeń, by zaopiekować się sobą, odpuścić żal, złość i poczucie winy.',
  },
  {
    key: 'guidance',
    title: 'Prowadzenie',
    body: 'Dziś wiem, że jestem prowadzona. A jednocześnie jest w tym przestrzeń na świadome decyzje i zmiany — i tym zajmuję się niezmiennie od wielu lat.',
  },
] as const;

/**
 * One stop on the painted trail: watercolour number on the trail, the text
 * on one side, a painted friend on the other (alternating), and the dotted
 * trail segment down to the next stop, which draws itself when in view.
 */
function JourneyStop({
  index,
  last,
  title,
  body: text,
}: {
  index: number;
  last: boolean;
  title: ReactNode;
  body: ReactNode;
}) {
  const { ref, inView } = useInViewOnce<HTMLLIElement>(0.35);
  const left = index % 2 === 0;
  const from = TRAIL[index];
  const to = TRAIL[Math.min(index + 1, TRAIL.length - 1)];
  // the trail swings to the opposite side between stops
  const swing = left
    ? 'M24 0 C 46 30, 2 70, 24 100'
    : 'M24 0 C 2 30, 46 70, 24 100';

  return (
    <li
      ref={ref}
      className="relative grid grid-cols-[72px_1fr] gap-x-5 pb-14 last:pb-0 md:grid-cols-[1fr_112px_1fr] md:gap-x-8 md:pb-16"
    >
      {/* the stop: number on the trail + trail down to the next stop */}
      <div className="relative col-start-1 row-start-1 flex justify-center md:col-start-2">
        <WatercolorNumber
          n={index + 1}
          tone={STOP_TONES[index]}
          size={72}
          className="relative z-10"
        />
        {!last && (
          <svg
            aria-hidden="true"
            viewBox="0 0 48 100"
            preserveAspectRatio="none"
            className="absolute left-1/2 top-[78px] h-[calc(100%-22px)] w-[48px] -translate-x-1/2 md:h-[calc(100%-14px)] md:w-[60px]"
            style={{
              clipPath: inView ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
              transition: 'clip-path 1.8s cubic-bezier(0.22, 0.8, 0.3, 1) 0.3s',
            }}
          >
            <defs>
              <linearGradient id={`trail-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={from} />
                <stop offset="1" stopColor={to} />
              </linearGradient>
            </defs>
            <path
              d={swing}
              fill="none"
              stroke={`url(#trail-${index})`}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray="0.1 13"
              vectorEffect="non-scaling-stroke"
              opacity={0.85}
            />
          </svg>
        )}
      </div>

      {/* the text, alternating sides on wide screens */}
      <div
        className={`col-start-2 row-start-1 flex flex-col gap-2 pt-3 transition-all duration-700 ${
          left ? 'md:col-start-1 md:text-right' : 'md:col-start-3'
        } ${inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
      >
        {title}
        {text}
      </div>

      {/* a painted friend on the other side (wide screens only) */}
      <div
        aria-hidden="true"
        className={`relative hidden md:row-start-1 md:block ${left ? 'md:col-start-3' : 'md:col-start-1'}`}
      >
        <WatercolorFriend
          kind={STOP_FRIENDS[index]}
          float
          delay={index * 0.8}
          className={`top-2 w-[84px] opacity-90 ${left ? 'left-6' : 'right-6'}`}
        />
      </div>
    </li>
  );
}

function JourneySection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-white ${sectionPad} py-20 md:py-28`}
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
      {/* the bee instead of the green butterfly (client 2026-11-10) */}
      <WatercolorFriend
        kind="bee"
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

        <ol className="mx-auto max-w-[920px]">
          {JOURNEY.map(({ key, title, body: text }, i) => (
            <JourneyStop
              key={key}
              index={i}
              last={i === JOURNEY.length - 1}
              title={
                <EditableText
                  section={S}
                  fieldPath={`journey.${key}.title`}
                  as="h3"
                  className={cardTitle}
                >
                  {title}
                </EditableText>
              }
              body={
                <EditableText
                  section={S}
                  fieldPath={`journey.${key}.body`}
                  as="p"
                  className="font-['Lato'] text-[16px] leading-[1.75] text-ink-soft"
                >
                  {text}
                </EditableText>
              }
            />
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
      className={`relative isolate overflow-hidden bg-surface ${sectionPad} py-20 md:py-28`}
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
            {/* the turquoise dragonfly (2026-11-10: a third smaller) flies down
              from above the photo and
              lands on the yellow flower of the meadow (client 2026-11-10) */}
            <LandingDragonfly className="left-[27.3%] top-[55%] w-[17.3%]" />
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
      className={`relative isolate overflow-hidden bg-white ${sectionPad} py-20 md:py-28`}
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
      {/* the client's ladybug crossing the whole section along its top,
          edge to edge and back (2026-11-10: "zamiast motyla daj biedronkę,
          niech się porusza horyzontalnie… od brzegu do brzegu"); the
          full-width track is the container the walk is measured on */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-6 block md:top-8"
        style={{ containerType: 'inline-size' }}
      >
        <img
          src={ladybugArt}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="block h-auto w-[36px] select-none animate-cross md:w-[48px]"
          style={{ animationDelay: '0.5s' }}
        />
      </span>
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
              <div className="flex h-full items-start gap-4 rounded-[20px] bg-surface p-6 shadow-[0_6px_24px_-16px_rgba(63,48,68,0.25)]">
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
      <span className="absolute bottom-[2%] left-[2%] block aspect-square w-[96%] rounded-full bg-[radial-gradient(circle,rgba(255,251,239,0.95)_0%,rgba(255,251,239,0.8)_45%,transparent_70%)]" />
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
      className={`overflow-hidden bg-surface ${sectionPad} py-20 md:py-28`}
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
