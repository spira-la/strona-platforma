import { Link } from 'react-router-dom';
import { ArrowRight, HeartHandshake, Dog, Flower2, MapPin } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableImage } from '@/components/cms/EditableImage';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import portraitPhoto from '@/assets/Ane1.jpg';
import profilePhoto from '@/assets/Ane3.jpg';
import joyPhoto from '@/assets/Ane4.jpg';
import { iconToneText } from '@/lib/iconTones';
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
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-action/25 bg-white px-9 py-4 font-['Lato'] text-[15px] font-semibold text-action transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const sectionPad = 'px-6 md:px-12 lg:px-[120px]';

// ---------------------------------------------------------------------------
// 1. Intro — portrait + who I am
// ---------------------------------------------------------------------------

function IntroSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-surface ${sectionPad} py-16 md:py-24`}
    >
      <WatercolorAccent
        tone="cool"
        className="-left-28 -top-28 w-[280px] opacity-35 md:w-[380px]"
      />
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 md:grid-cols-[1.1fr_1fr] lg:gap-20">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col gap-5">
            <EditableText
              section={S}
              fieldPath="intro.eyebrow"
              as="p"
              className={eyebrow}
            >
              O mnie
            </EditableText>
            <EditableText
              section={S}
              fieldPath="intro.title"
              as="h1"
              className="font-['Cormorant_Garamond'] text-[44px] md:text-[64px] leading-[1.08] text-ink"
            >
              Nazywam się Aneta Mroczko
            </EditableText>
            <RainbowStroke className="-mt-2 w-[220px] md:w-[320px]" />
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
          <div className="relative isolate mx-auto w-full max-w-[440px]">
            {/* watercolor blots around the portrait instead of a flat frame */}
            <WatercolorAccent
              tone="cool"
              className="-right-20 -top-20 w-[260px] opacity-40 md:w-[320px]"
            />
            <WatercolorAccent
              tone="warm"
              className="-bottom-20 -left-20 w-[240px] opacity-60 md:w-[300px]"
            />
            <WatercolorFriend
              kind="butterfly"
              fly="right"
              className="-left-6 top-8 z-10 w-[72px] md:-left-12 md:w-[96px]"
            />
            <div className="relative aspect-[3/4] overflow-hidden rounded-[32px]">
              <EditableImage
                section={S}
                fieldPath="intro.photo"
                fallbackSrc={portraitPhoto}
                alt="Aneta Mroczko"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Moja droga — four steps of her story
// ---------------------------------------------------------------------------

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
      className={`relative isolate overflow-hidden bg-white ${sectionPad} py-20 md:py-28`}
    >
      <WatercolorFriend
        kind="dragonfly"
        float
        delay={1}
        className="right-[4%] top-4 w-[72px] md:right-[8%] md:top-12 md:w-[130px]"
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
              <li className="flex h-full flex-col gap-4 rounded-[24px] border border-line bg-surface p-7">
                <WatercolorNumber n={i + 1} size={84} className="-ml-2 -mt-2" />
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
    <section className={`bg-surface-alt ${sectionPad} py-20 md:py-28`}>
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <ScrollReveal animation="fade-up">
          <div className="aspect-[4/3] overflow-hidden rounded-[32px]">
            <EditableImage
              section={S}
              fieldPath="quote.photo"
              fallbackSrc={profilePhoto}
              alt="Aneta Mroczko"
              className="h-full w-full object-cover object-right"
            />
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
      <WatercolorFriend
        kind="dragonflyBlue"
        float
        delay={2.5}
        className="left-[4%] top-4 w-[68px] md:left-[8%] md:top-12 md:w-[120px]"
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
              <div className="flex h-full items-start gap-4 rounded-[20px] bg-sky-soft p-6">
                <span
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white ${iconToneText(i + 2)}`}
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

function ClosingSection() {
  return (
    <section className={`bg-surface ${sectionPad} py-20 md:py-28`}>
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
            {/* painted lavender heart tucked at the corner of the photo */}
            <WatercolorFriend
              kind="lavender"
              className="-bottom-10 -right-8 z-10 w-[120px] md:-right-14 md:w-[150px]"
            />
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
