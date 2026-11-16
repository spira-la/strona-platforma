import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { EditableImage } from '@/components/cms/EditableImage';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';
import {
  LandingBee,
  LandingSunButterfly,
} from '@/components/shared/LandingFriend';
import { useWordSpot } from '@/hooks/useWordSpot';
import { WalkingLadybug } from '@/components/shared/WalkingLadybug';
import {
  RainbowStroke,
  WatercolorAccent,
  WatercolorFriend,
} from '@/components/shared/Watercolor';
import heroArt from '@/assets/watercolor/hero-joy.webp';
import bouquetArt from '@/assets/watercolor/bouquet.webp';
import { eventsClient } from '@/clients/events.client';

// ---------------------------------------------------------------------------
// Home — "Życie w teraz" (2026-11 redesign)
//
// Light, pastel, five short sections. Rendered at "/" while the
// `classicHome` flag is off; the previous Home (pages/Home.tsx) is kept intact.
// CMS section `homeNow` is separate from `home`/`hero`, so text saved for the
// old page never leaks in. Copy is taken from the client's own text (her ebook
// "Świadomie żyć to znaczy jak?", 2026-11; sections 2–7 rewritten 2026-11-16
// from her notes in plan/teksty-klientki/start-spokoj-notatki.md) — she can
// also edit it inline.
//
// Order alternates white / pastel yellow: hero paint · Spokój white ·
// Tajemnica cream · quote white · steps cream · offer white · invite cream.
// ---------------------------------------------------------------------------

const S = 'homeNow' as const;

// Backgrounds: watercolor paintings in the logo colors (2026-11, client asked
// for joyful watercolor graphics instead of photos). They use new CMS
// fieldPaths (`*.artBg`) so she can still upload her own picture there.
// Previous photos (Unsplash ids, for reference): hero sky
// 1505533542167-8c89838bb19e, quote chamomile 1666976628465-1e583a4f3148,
// "human" sunflowers 1627891374362-c6ca6c675cb3 (client: "nie dobrze to
// wygląda" — replaced by her painted forget-me-not bouquet).
const HERO_ART = heroArt;
const HUMAN_ART = bouquetArt;

const eyebrow =
  "font-['Lato'] text-[13px] uppercase tracking-[0.2em] text-brand-dark";
const heading =
  "font-['Cormorant_Garamond'] text-[36px] md:text-[48px] leading-[1.15] text-ink";
const body = "font-['Lato'] text-[17px] leading-[1.75] text-ink-soft";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-9 py-4 font-['Lato'] text-[15px] font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-action/25 bg-white/70 px-9 py-4 font-['Lato'] text-[15px] font-semibold text-action transition-colors hover:bg-white hover:border-action/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

// ---------------------------------------------------------------------------
// 1. Hero — Życie dzieje się teraz
// ---------------------------------------------------------------------------

/**
 * Hero title with the yellow butterfly landing on the word "teraz" (client
 * 2026-11-10: first on "Życie", then "niech wyląduje na wyrazie teraz"). The title stays
 * CMS-editable; the landing spot is measured on the rendered text.
 */
function HeroTitle() {
  const { ref, spot } = useWordSpot<HTMLDivElement>('teraz', 0.55, 0.4);
  return (
    <div ref={ref} className="relative">
      <EditableText
        section={S}
        fieldPath="hero.title"
        as="h1"
        className="font-['Cormorant_Garamond'] text-[46px] md:text-[76px] leading-[1.05] text-ink"
      >
        Życie dzieje się teraz
      </EditableText>
      {spot && (
        <LandingSunButterfly
          className="-translate-x-1/2 w-[52px] md:w-[76px]"
          style={{ left: spot.left, bottom: spot.bottom }}
        />
      )}
    </div>
  );
}

function HeroSection() {
  return (
    <section
      className="relative flex min-h-[640px] md:min-h-[760px] items-center justify-center overflow-hidden"
      aria-label="Sekcja główna"
    >
      <EditableBackground
        section={S}
        fieldPath="hero.artBg"
        fallbackSrc={HERO_ART}
        className="absolute inset-0"
        aria-hidden={true}
      />
      {/* Optional white wash — off by default (the painting keeps the middle
          light); she can raise it if she uploads a busy photo. */}
      <EditableOverlay
        section={S}
        fieldPath="hero.artBg"
        color="255,255,255"
        defaultTop={0}
        defaultBottom={0}
      />

      <div className="relative z-10 mx-auto flex max-w-[860px] flex-col items-center gap-6 px-6 pt-[120px] pb-20 text-center">
        <ScrollReveal animation="fade-up" duration={900}>
          <EditableText
            section={S}
            fieldPath="hero.eyebrow"
            as="p"
            // soft white pill so the line stays readable over the paint
            className={`${eyebrow} rounded-full bg-white/80 px-4 py-1.5 font-semibold shadow-[0_2px_12px_-4px_rgba(63,48,68,0.18)] backdrop-blur-sm`}
          >
            Świadomie żyć to znaczy jak?
          </EditableText>
        </ScrollReveal>
        <ScrollReveal animation="blur" delay={150} duration={1000}>
          <HeroTitle />
          <RainbowStroke className="mx-auto -mt-1 w-[240px] md:mt-1 md:w-[420px]" />
        </ScrollReveal>
        {/* the client's tagline (2026-11-10): the spiral-upward invitation
            as a handwritten-feeling italic lead, then her promise */}
        <ScrollReveal animation="fade-up" delay={250} duration={900}>
          <div className="flex max-w-[640px] flex-col items-center gap-3">
            <EditableText
              section={S}
              fieldPath="hero.lead"
              as="p"
              className="text-balance font-['Cormorant_Garamond'] text-[24px] italic leading-[1.3] text-ink md:text-[30px]"
            >
              Masz dość kręcenia się w kółko? Czas ruszyć spiralą w górę.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="hero.promise"
              as="p"
              className="text-balance font-['Lato'] text-[17px] font-semibold leading-[1.6] text-ink md:text-[19px]"
            >
              Pomagam uwolnić się od starych przekonań, które trzymają Cię w
              tych samych historiach.
            </EditableText>
          </div>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={350} duration={900}>
          <EditableText
            section={S}
            fieldPath="hero.subtitle"
            as="p"
            className="max-w-[620px] font-['Lato'] text-[17px] md:text-[19px] leading-[1.7] text-ink-soft"
          >
            To, co dziś dzieje się w Twoim życiu, jest efektem Twoich przeszłych
            myśli, słów i działań. Wiele zależy od Ciebie.
          </EditableText>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={550} duration={900}>
          <div className="mt-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <EditableButtonLink
              section={S}
              fieldPath="hero.ctaPrimary"
              defaultAction="internal:/kontakt"
              className={primaryBtn}
            >
              <EditableText section={S} fieldPath="hero.ctaPrimary">
                Umów rozmowę
              </EditableText>
            </EditableButtonLink>
            <Link to="/wydarzenia" className={secondaryBtn}>
              <EditableText section={S} fieldPath="hero.ctaSecondary">
                Zobacz wydarzenia
              </EditableText>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. A gdyby tak… czuć spokój — the reader's longing, the client's own calm
// ---------------------------------------------------------------------------

function HumanSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-6 py-20 md:px-12 lg:px-[120px] md:py-28">
      <div className="mx-auto grid max-w-[1120px] items-center gap-12 md:grid-cols-2 lg:gap-20">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col gap-5">
            <EditableText
              section={S}
              fieldPath="human.eyebrow"
              as="p"
              className={eyebrow}
            >
              A gdyby tak…
            </EditableText>
            <EditableText
              section={S}
              fieldPath="human.title"
              as="h2"
              className={heading}
            >
              Jak by to było — czuć spokój?
            </EditableText>
            <EditableText
              section={S}
              fieldPath="human.body1"
              as="p"
              className={body}
            >
              Reagować spokojnie na wszystko, co przynosi dzień. Nie dawać się
              złapać w pułapkę starych programów, które od lat podsuwają Ci te
              same lęki i te same reakcje.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="human.body2"
              as="p"
              className={body}
            >
              Wiem, jak cudownie to smakuje. Wyzwania wciąż mnie testują — ale
              dziś przyjmuję ich lekcje z pokorą, zamiast z nimi walczyć. I
              wiem, że Ty też tak możesz.
            </EditableText>
          </div>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={200}>
          {/* Painted forget-me-not bouquet on a soft blue blot (the client's
              artwork) — replaced the sunflower photo at her request. New
              fieldPath so a picture saved for the old photo never shows.
              No yellow blot behind it (client: "usuń żółte tło"). */}
          <div className="relative isolate mx-auto flex aspect-square w-full max-w-[460px] items-center justify-center">
            <WatercolorAccent
              tone="cool"
              className="bottom-[6%] left-[2%] w-[62%] opacity-30"
            />
            <div className="relative h-[88%] w-[88%]">
              <EditableImage
                section={S}
                fieldPath="human.illustration"
                fallbackSrc={HUMAN_ART}
                alt="Bukiet niezapominajek malowany akwarelą"
                className="h-full w-full object-contain"
              />
              {/* the bee flies in and sits on the top flowers of the
                  bouquet (client 2026-11-10: "pszczoła niech usiądzie na
                  niezapominajkach") */}
              <LandingBee className="bottom-[79%] left-[60%] w-[24%] -translate-x-1/2" />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2b. Cała tajemnica — what you think, say and do comes back to you;
// the abyss of comparisons; the boomerang question. Cream.
// ---------------------------------------------------------------------------

const COMPARISONS = [
  { key: 'pair1', text: 'zdrowi i chorzy' },
  { key: 'pair2', text: 'mądrzy i głupi' },
  { key: 'pair3', text: 'zaradni i nieporadni' },
  { key: 'pair4', text: 'szybcy i powolni' },
] as const;

function SecretSection() {
  return (
    <section className="relative isolate overflow-hidden bg-surface px-6 py-20 md:px-12 lg:px-[120px] md:py-28">
      <WatercolorAccent
        tone="warm"
        className="-right-24 -top-24 w-[300px] opacity-40 md:w-[400px]"
      />
      <WatercolorAccent
        tone="cool"
        className="-bottom-28 -left-24 w-[300px] opacity-35 md:w-[420px]"
      />
      <div className="mx-auto max-w-[1120px]">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto mb-12 flex max-w-[720px] flex-col items-center gap-4 text-center">
            <EditableText
              section={S}
              fieldPath="secret.eyebrow"
              as="p"
              className={eyebrow}
            >
              Cała tajemnica
            </EditableText>
            <EditableText
              section={S}
              fieldPath="secret.title"
              as="h2"
              className={`${heading} text-balance`}
            >
              Wszystko, o czym myślisz, wraca do Ciebie
            </EditableText>
            <RainbowStroke className="-mt-1 w-[200px] md:w-[280px]" />
          </div>
        </ScrollReveal>

        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col gap-5">
              <EditableText
                section={S}
                fieldPath="secret.body1"
                as="p"
                className={body}
              >
                Człowiek to wyjątkowa istota — ma zdolność stwarzania swojej
                rzeczywistości. Tak, dobrze czytasz. To, o czym myślisz, co
                mówisz i co robisz, wkrótce do Ciebie wraca.
              </EditableText>
              <EditableText
                section={S}
                fieldPath="secret.body2"
                as="p"
                className={body}
              >
                Każdą myślą, każdym słowem i czynem tworzysz swoje jutro — i to
                najbliższe, i to dalsze. I to naprawdę cała tajemnica. Aż trudno
                uwierzyć, że to takie proste, prawda?
              </EditableText>
            </div>
          </ScrollReveal>

          {/* the abyss of comparisons — a white card with the labels we
              keep being sorted into */}
          <ScrollReveal animation="fade-up" delay={200}>
            <div className="flex flex-col gap-5 rounded-[28px] bg-white p-7 shadow-[0_10px_34px_-22px_rgba(63,48,68,0.35)] md:p-9">
              <EditableText
                section={S}
                fieldPath="secret.compareEyebrow"
                as="p"
                className="font-['Lato'] text-[12px] font-semibold uppercase tracking-[0.18em] text-spiral-blue"
              >
                Otchłań porównań
              </EditableText>
              <EditableText
                section={S}
                fieldPath="secret.compareLead"
                as="p"
                className="font-['Lato'] text-[16px] leading-[1.7] text-ink-soft"
              >
                Wciąż słyszymy, że ludzie dzielą się na:
              </EditableText>
              <ul className="flex flex-wrap gap-2">
                {COMPARISONS.map(({ key, text }) => (
                  <li
                    key={key}
                    className="rounded-full bg-surface px-4 py-1.5 font-['Lato'] text-[14px] text-ink-muted"
                  >
                    <EditableText
                      section={S}
                      fieldPath={`secret.${key}`}
                      as="span"
                    >
                      {text}
                    </EditableText>
                  </li>
                ))}
              </ul>
              <EditableText
                section={S}
                fieldPath="secret.compareBody"
                as="p"
                className="font-['Lato'] text-[16px] leading-[1.7] text-ink-soft"
              >
                A Ty w tej otchłani porównań raz toniesz, raz wypływasz na
                powierzchnię. Po co tam kierujesz swoją uwagę? Od dziś już tego
                nie potrzebujesz.
              </EditableText>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal animation="fade-up" delay={150}>
          <EditableText
            section={S}
            fieldPath="secret.question"
            as="p"
            className="mx-auto mt-14 max-w-[760px] text-balance text-center font-['Cormorant_Garamond'] text-[26px] italic leading-[1.35] text-ink md:text-[32px]"
          >
            Zastanów się: o czym myślisz najczęściej? I czy te myśli nie wracają
            do Ciebie jak bumerang — w tym, czego dziś doświadczasz?
          </EditableText>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Jak zaprowadzić w sobie porządek — three simple steps
// ---------------------------------------------------------------------------

// Each step opens with a written label instead of a bare digit (client
// 2026-11-10: "napisz: pierwszy krok… drugi krok… trzeci krok… zamiast
// samych cyfr"), on a soft pill in its own spiral colour.
const STEPS = [
  {
    key: 'step1',
    label: 'Pierwszy krok',
    pill: 'bg-spiral-coral-soft',
    dot: 'bg-spiral-coral',
    title: 'Zauważ',
    body: 'Przyglądaj się temu, co myślisz, mówisz i robisz. Wyłapuj to, co Cię nie wspiera: dołujące przekonania, to, czego nie lubisz w swoim życiu, i oczekiwanie, że ktoś coś zrobi za Ciebie.',
  },
  {
    key: 'step2',
    label: 'Drugi krok',
    pill: 'bg-spiral-gold-soft',
    dot: 'bg-spiral-gold',
    title: 'Zatrzymaj się',
    body: 'Kiedy coś boli — smutek, złość, przykrość — nie uciekaj. Choroba, trudna relacja, kłopoty z pieniędzmi, brak sensu: spójrz temu w oczy i zapytaj, co to mówi o Tobie, o Twoich lękach i blokadach.',
  },
  {
    key: 'step3',
    label: 'Trzeci krok',
    pill: 'bg-spiral-teal-soft',
    dot: 'bg-spiral-teal',
    title: 'Zmień',
    body: 'Zobacz, jakie przekonanie to do Ciebie przyciągnęło — i wybierz inaczej. To, co zauważysz i nazwiesz, możesz zmienić. Proszę, zrób to dla siebie.',
  },
] as const;

function StepsSection() {
  return (
    <section className="relative isolate overflow-hidden bg-surface px-6 py-20 md:px-12 lg:px-[120px] md:py-28">
      <WatercolorFriend
        kind="butterflyBlue"
        fly="left"
        delay={1}
        className="right-[4%] top-3 w-[56px] md:right-[8%] md:top-4 md:w-[88px]"
      />
      <WatercolorAccent
        tone="warm"
        className="-left-24 -top-24 w-[300px] opacity-40 md:w-[400px]"
      />
      <WatercolorAccent
        tone="cool"
        className="-bottom-28 -right-24 w-[300px] opacity-35 md:w-[420px]"
      />
      <div className="mx-auto max-w-[1120px]">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto mb-14 flex max-w-[680px] flex-col gap-4 text-center">
            <EditableText
              section={S}
              fieldPath="steps.eyebrow"
              as="p"
              className={eyebrow}
            >
              Od chaosu do spokoju
            </EditableText>
            <EditableText
              section={S}
              fieldPath="steps.title"
              as="h2"
              className={heading}
            >
              Jak zaprowadzić w sobie porządek?
            </EditableText>
            <EditableText
              section={S}
              fieldPath="steps.subtitle"
              as="p"
              className={body}
            >
              Życie naturalnie dąży do równowagi, a nie do chaosu. Nawet jeśli
              dziś czujesz w sobie chaos, możesz to zmienić — krok po kroku.
            </EditableText>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ key, label, pill, dot, title, body: text }, i) => (
            <ScrollReveal key={key} animation="fade-up" delay={stagger(i)}>
              <div className="flex h-full flex-col gap-4 rounded-[24px] border border-line bg-white p-8">
                <span
                  className={`inline-flex items-center gap-2.5 self-start rounded-full px-4 py-2 ${pill}`}
                >
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`}
                    aria-hidden="true"
                  />
                  <EditableText
                    section={S}
                    fieldPath={`steps.${key}.label`}
                    as="span"
                    className="font-['Lato'] text-[13px] font-bold uppercase tracking-[0.16em] text-ink"
                  >
                    {label}
                  </EditableText>
                </span>
                <EditableText
                  section={S}
                  fieldPath={`steps.${key}.title`}
                  as="h3"
                  className="font-['Cormorant_Garamond'] text-[30px] leading-tight text-ink"
                >
                  {title}
                </EditableText>
                <EditableText
                  section={S}
                  fieldPath={`steps.${key}.body`}
                  as="p"
                  className={body}
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
// 4. Jutro, które wybierasz — quote band on a pastel sky
// ---------------------------------------------------------------------------

function QuoteSection() {
  // White section (client: alternate coloured / white backgrounds). The big
  // rainbow butterfly carries the colour. The former watercolor background
  // (assets/watercolor/quote-joy.webp, CMS field quote.artBg) is no longer
  // rendered here.
  return (
    <section
      className="relative overflow-hidden bg-white px-6 py-20 md:py-28"
      aria-label="Cytat"
    >
      <ScrollReveal animation="blur">
        <figure className="mx-auto flex max-w-[860px] flex-col items-center gap-6 text-center">
          {/* rainbow butterfly — lightness and change */}
          <div className="relative h-[118px] w-[140px] md:h-[170px] md:w-[200px]">
            <WatercolorFriend kind="wings" flutter className="inset-0 w-full" />
          </div>
          <EditableText
            section={S}
            fieldPath="quote.text"
            as="blockquote"
            className="font-['Cormorant_Garamond'] text-[32px] md:text-[46px] italic leading-[1.25] text-ink"
          >
            Kieruj uwagę tylko na to, czego chcesz więcej w swoim życiu.
          </EditableText>
          <RainbowStroke className="w-[160px] md:w-[220px]" />
          <EditableText
            section={S}
            fieldPath="quote.author"
            as="figcaption"
            className="font-['Lato'] text-[14px] uppercase tracking-[0.2em] text-brand-dark"
          >
            Aneta Mroczko
          </EditableText>
        </figure>
      </ScrollReveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4b. Jak pracujemy razem — how she works with a client (2026-11-16, from her
// notes: out of the victim role, no digging up every trauma, heal the source,
// train mindful thinking). White, between the cream steps and cream invite.
// Every line is CMS-editable (homeNow.offer.*).
// ---------------------------------------------------------------------------

const OFFER_POINTS = [
  {
    key: 'point1',
    dot: 'bg-spiral-coral',
    title: 'Porządki w tym, co boli',
    body: 'Bierzemy na warsztat Twoją obecną trudność, docieramy do jej źródła i uzdrawiamy je — tak, by przestała się powtarzać.',
  },
  {
    key: 'point2',
    dot: 'bg-spiral-gold',
    title: 'Trening uważnego myślenia',
    body: 'Uczysz się myśleć świadomie i panować nad własnym umysłem — żeby to on służył Tobie, a nie Ty jemu.',
  },
  {
    key: 'point3',
    dot: 'bg-spiral-teal',
    title: 'Nowa płyta zamiast starej',
    body: 'Zamiast bezmyślnie odtwarzać starą płytę, myślisz o tym, czego chcesz. A to wróci do Ciebie — jutro, za tydzień, za miesiąc.',
  },
] as const;

/**
 * Offer title with the client's ladybug walking from the orange blot at the
 * top of the section to the word "ręce" (client 2026-11-10, word updated with
 * the new title 2026-11-16). The title stays CMS-editable; the stop is
 * measured on the rendered text.
 */
function OfferTitle() {
  const { ref, spot } = useWordSpot<HTMLDivElement>('ręce', 0.5, 0.42);
  return (
    <div ref={ref} className="relative">
      <EditableText
        section={S}
        fieldPath="offer.title"
        as="h2"
        className={heading}
      >
        Bierzesz życie w swoje ręce
      </EditableText>
      {spot && <WalkingLadybug spot={spot} className="w-[34px] md:w-[44px]" />}
    </div>
  );
}

function OfferSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white px-6 py-20 md:px-12 lg:px-[120px] md:py-28">
      <WatercolorAccent
        tone="warm"
        className="-right-24 -top-24 w-[300px] opacity-30 md:w-[400px]"
      />
      <WatercolorAccent
        tone="cool"
        className="-bottom-28 -left-24 w-[300px] opacity-25 md:w-[420px]"
      />
      <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col gap-5">
            <EditableText
              section={S}
              fieldPath="offer.eyebrow"
              as="p"
              className={eyebrow}
            >
              Jak pracujemy razem
            </EditableText>
            <OfferTitle />
            <RainbowStroke className="-mt-2 w-[200px] md:w-[280px]" />
            <EditableText
              section={S}
              fieldPath="offer.body1"
              as="p"
              className={body}
            >
              Nikt Ci nic nie zrobił. To Twoje przekonania materializują się w
              codzienności — a skoro są Twoje, to Ty możesz je zmienić.
              Wychodzisz z roli ofiary, bo żadną ofiarą już nie jesteś.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="offer.body2"
              as="p"
              className={body}
            >
              Nie musimy wywlekać wszystkich traum z przeszłości. Zajmujemy się
              tym, co jest teraz na tapecie i Cię męczy. Każde cierpienie ma
              swój początek w przeszłości — razem go odnajdujemy i uzdrawiamy,
              żeby to, co tyle razy bolało, przestało wracać.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="offer.body3"
              as="p"
              className={body}
            >
              Czy to magia? Pewnie, że tak — ale Twoja. Tylko Ty możesz działać
              cuda dla siebie. Ja pokażę Ci krok po kroku, jak to robić.
            </EditableText>
          </div>
        </ScrollReveal>

        <ul className="flex flex-col gap-5 self-center">
          {OFFER_POINTS.map(({ key, dot, title, body: text }, i) => (
            <ScrollReveal key={key} animation="fade-up" delay={stagger(i)}>
              <li className="flex gap-4 rounded-[24px] bg-white p-6 shadow-[0_10px_34px_-22px_rgba(63,48,68,0.35)] md:p-7">
                <span
                  className={`mt-2 h-3 w-3 flex-shrink-0 rounded-full ${dot}`}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-2">
                  <EditableText
                    section={S}
                    fieldPath={`offer.${key}.title`}
                    as="h3"
                    className="font-['Cormorant_Garamond'] text-[24px] leading-tight text-ink md:text-[26px]"
                  >
                    {title}
                  </EditableText>
                  <EditableText
                    section={S}
                    fieldPath={`offer.${key}.body`}
                    as="p"
                    className="font-['Lato'] text-[16px] leading-[1.7] text-ink-soft"
                  >
                    {text}
                  </EditableText>
                </div>
              </li>
            </ScrollReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 5. Zaproszenie — events + contact
// ---------------------------------------------------------------------------

function NextEventTeaser() {
  const { i18n } = useTranslation();
  const { data } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsClient.getUpcoming(),
    staleTime: 5 * 60 * 1000,
  });
  const next = data?.[0];
  if (!next) return null;

  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(i18n.language, {
      timeZone: 'Europe/Warsaw',
      ...o,
    }).format(new Date(next.startsAt));

  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/80 p-3 pr-4 shadow-[0_4px_18px_-10px_rgba(63,48,68,0.35)] backdrop-blur-sm">
      <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-spiral-coral-soft">
        <span className="font-['Lato'] text-[20px] font-bold leading-none text-ink">
          {fmt({ day: 'numeric' })}
        </span>
        <span className="font-['Lato'] text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
          {fmt({ month: 'short' }).replace('.', '')}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-['Lato'] text-[12px] font-semibold uppercase tracking-[0.15em] text-ink-muted">
          <EditableText section={S} fieldPath="invite.nextEvent" as="span">
            Najbliższe spotkanie
          </EditableText>
        </p>
        <p className="truncate font-['Cormorant_Garamond'] text-[20px] leading-snug text-ink">
          {next.title}
        </p>
      </div>
    </div>
  );
}

const inviteCard =
  'group relative isolate flex h-full flex-col gap-5 overflow-hidden rounded-[32px] border p-7 shadow-[0_10px_40px_-20px_rgba(63,48,68,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_-20px_rgba(63,48,68,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:p-10';
const invitePill =
  "inline-flex items-center gap-1.5 self-start rounded-full px-3.5 py-1 font-['Lato'] text-[12px] font-semibold uppercase tracking-[0.18em]";
const inviteTitle =
  "font-['Cormorant_Garamond'] text-[30px] leading-[1.1] text-ink sm:text-[34px] md:text-[40px]";

function InviteSection() {
  return (
    <section className="relative isolate overflow-hidden bg-surface px-6 py-20 md:px-12 lg:px-[120px] md:py-28">
      <WatercolorAccent
        tone="warm"
        className="-left-20 -top-24 w-[260px] opacity-30 md:w-[340px]"
      />
      <div className="mx-auto max-w-[1040px]">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto mb-12 flex max-w-[640px] flex-col items-center gap-4 text-center">
            <EditableText
              section={S}
              fieldPath="invite.title"
              as="h2"
              className={heading}
            >
              Proste, prawda? To co, zaczynamy?
            </EditableText>
            <RainbowStroke className="-mt-1 w-[180px] md:w-[240px]" />
            <EditableText
              section={S}
              fieldPath="invite.subtitle"
              as="p"
              className={body}
            >
              Dołącz do najbliższego spotkania albo porozmawiajmy indywidualnie.
            </EditableText>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {/* Events — painted lavender heart, warm blot, next event teaser */}
          <ScrollReveal animation="fade-up">
            <Link
              to="/wydarzenia"
              className={`${inviteCard} border-spiral-coral-soft bg-[#fff8f5]`}
            >
              <WatercolorAccent
                tone="warm"
                className="-right-20 -top-20 w-[300px] opacity-45 transition-transform duration-700 group-hover:scale-110"
              />
              <WatercolorAccent
                tone="warm"
                className="-bottom-24 -left-24 w-[220px] opacity-15"
              />
              {/* the pink butterfly beating its wings and hovering (client
                  2026-11-10: "użyj owadów, niech też się ruszają, mogą być
                  trochę mniejsze") */}
              <WatercolorFriend
                kind="butterfly"
                float
                className="right-5 top-5 w-[60px] transition-[rotate,scale] duration-500 group-hover:-rotate-6 group-hover:scale-105 md:right-8 md:top-8 md:w-[104px]"
              />
              <div className="flex min-h-[96px] flex-col gap-3 pr-16 md:min-h-[136px] md:pr-32">
                <span
                  className={`${invitePill} bg-spiral-coral-soft text-spiral-coral`}
                >
                  <EditableText
                    section={S}
                    fieldPath="invite.eventsEyebrow"
                    as="span"
                  >
                    Spotkajmy się
                  </EditableText>
                </span>
                <EditableText
                  section={S}
                  fieldPath="invite.eventsTitle"
                  as="h3"
                  className={inviteTitle}
                >
                  Wydarzenia
                </EditableText>
              </div>
              <EditableText
                section={S}
                fieldPath="invite.eventsBody"
                as="p"
                className={body}
              >
                Warsztaty, spotkania i webinary o życiu w teraz.
              </EditableText>
              <NextEventTeaser />
              <span className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-action px-6 py-3 font-['Lato'] text-[15px] font-semibold text-white transition-colors group-hover:bg-action-hover">
                <EditableText section={S} fieldPath="invite.eventsCta">
                  Zobacz terminy
                </EditableText>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </ScrollReveal>

          {/* Talk — painted turquoise dragonfly (moving wings), cool blot */}
          <ScrollReveal animation="fade-up" delay={stagger(1)}>
            <Link
              to="/kontakt"
              className={`${inviteCard} border-spiral-blue-soft bg-[#f5f8ff]`}
            >
              <WatercolorAccent
                tone="cool"
                className="-right-20 -top-20 w-[300px] opacity-40 transition-transform duration-700 group-hover:scale-110"
              />
              <WatercolorAccent
                tone="cool"
                className="-bottom-24 -left-24 w-[220px] opacity-20"
              />
              {/* the turquoise dragonfly beating its wings and hovering */}
              <WatercolorFriend
                kind="dragonflyGreen"
                float
                delay={1.2}
                className="right-4 top-7 w-[70px] transition-[rotate,scale] duration-500 group-hover:rotate-6 group-hover:scale-105 md:right-7 md:top-10 md:w-[116px]"
              />
              <div className="flex min-h-[96px] flex-col gap-3 pr-16 md:min-h-[136px] md:pr-32">
                <span
                  className={`${invitePill} bg-spiral-blue-soft text-spiral-blue`}
                >
                  <EditableText
                    section={S}
                    fieldPath="invite.contactEyebrow"
                    as="span"
                  >
                    Tylko Ty i ja
                  </EditableText>
                </span>
                <EditableText
                  section={S}
                  fieldPath="invite.contactTitle"
                  as="h3"
                  className={inviteTitle}
                >
                  Porozmawiajmy
                </EditableText>
              </div>
              <EditableText
                section={S}
                fieldPath="invite.contactBody"
                as="p"
                className={body}
              >
                Napisz do mnie — razem znajdziemy Twój pierwszy krok.
              </EditableText>
              <ul className="flex flex-col gap-2 font-['Lato'] text-[15px] text-ink-soft">
                <li className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full bg-spiral-teal"
                    aria-hidden="true"
                  />
                  <EditableText
                    section={S}
                    fieldPath="invite.contactPoint1"
                    as="span"
                  >
                    Odpowiadam osobiście, zwykle w ciągu doby
                  </EditableText>
                </li>
                <li className="flex items-center gap-2.5">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full bg-spiral-blue"
                    aria-hidden="true"
                  />
                  <EditableText
                    section={S}
                    fieldPath="invite.contactPoint2"
                    as="span"
                  >
                    Bez zobowiązań — po prostu zacznijmy rozmowę
                  </EditableText>
                </li>
              </ul>
              <span className="mt-auto inline-flex items-center gap-2 self-start rounded-full border border-action/25 bg-white/80 px-6 py-3 font-['Lato'] text-[15px] font-semibold text-action transition-colors group-hover:border-action/50 group-hover:bg-white">
                <EditableText section={S} fieldPath="invite.contactButton">
                  Napisz do mnie
                </EditableText>
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page composition
// ---------------------------------------------------------------------------

export default function HomeNow() {
  return (
    <main>
      <SEO
        canonical="/"
        pathname="/"
        description="Jak by to było czuć spokój? To, o czym myślisz, co mówisz i co robisz, wraca do Ciebie. Wyjdź z roli ofiary i weź życie w swoje ręce — Spirala, Aneta Mroczko."
      />
      <HeroSection />
      <HumanSection />
      <SecretSection />
      <QuoteSection />
      <StepsSection />
      <OfferSection />
      <InviteSection />
    </main>
  );
}
