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
  RainbowStroke,
  WatercolorAccent,
  WatercolorFriend,
} from '@/components/shared/Watercolor';
import heroArt from '@/assets/watercolor/hero-joy.webp';
import bouquetArt from '@/assets/watercolor/bouquet.webp';
import butterflyArt from '@/assets/watercolor/butterfly-pink.webp';
import dragonflyArt from '@/assets/watercolor/dragonfly-blue.webp';
import { eventsClient } from '@/clients/events.client';

// ---------------------------------------------------------------------------
// Home — "Życie w teraz" (2026-11 redesign)
//
// Light, pastel, five short sections. Rendered at "/" while the
// `classicHome` flag is off; the previous Home (pages/Home.tsx) is kept intact.
// CMS section `homeNow` is separate from `home`/`hero`, so text saved for the
// old page never leaks in. Copy is taken from the client's own text (her ebook
// "Świadomie żyć to znaczy jak?", 2026-11) — she can also edit it inline.
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
      {/* painted butterfly and bee fluttering at the sides of the title */}
      <WatercolorFriend
        kind="butterfly"
        fly="right"
        // phones: low, under the buttons, so it never covers the first line
        className="bottom-[3%] left-[4%] z-[5] w-[60px] md:bottom-auto md:top-[15%] md:w-[84px] lg:left-[6%] lg:top-[14%] lg:w-[110px]"
      />
      <WatercolorFriend
        kind="bee"
        fly="left"
        delay={2.5}
        className="bottom-[8%] right-[6%] z-[5] w-[60px] md:bottom-[10%] md:w-[84px] lg:bottom-[20%] lg:right-[10%] lg:w-[110px]"
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
          <EditableText
            section={S}
            fieldPath="hero.title"
            as="h1"
            className="font-['Cormorant_Garamond'] text-[46px] md:text-[76px] leading-[1.05] text-ink"
          >
            Życie dzieje się teraz
          </EditableText>
          <RainbowStroke className="mx-auto -mt-1 w-[240px] md:mt-1 md:w-[420px]" />
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
// 2. Skąd bierze się cierpienie — how a human works, subconscious memory
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
              Czemu tak jest?
            </EditableText>
            <EditableText
              section={S}
              fieldPath="human.title"
              as="h2"
              className={heading}
            >
              Dlaczego to wciąż powraca?
            </EditableText>
            <EditableText
              section={S}
              fieldPath="human.body1"
              as="p"
              className={body}
            >
              Każdy z nas czegoś pragnie, do czegoś dąży — i jak życie pokazuje,
              jednym się udaje, a innym nie bardzo. Choć wkładasz tyle wysiłku,
              cokolwiek zaczniesz, odbija się jak od bandy.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="human.body2"
              as="p"
              className={body}
            >
              Tak zostaliśmy zaprogramowani. Każda myśl zapisana w naszej
              podświadomości trzyma nas w błędnym kręgu — dopóki stare
              oprogramowanie decyduje o Twoim dziś.
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
            </div>
            <WatercolorFriend
              kind="bee"
              fly="left"
              delay={1.5}
              className="-right-2 bottom-[18%] w-[22%] md:-right-6"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Jak zarządzać sobą w teraz — three simple steps
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
    body: 'Zauważ, co myślisz, co mówisz i co robisz — wszystko, co nie jest spójne z tym, kim jesteś dziś.',
  },
  {
    key: 'step2',
    label: 'Drugi krok',
    pill: 'bg-spiral-gold-soft',
    dot: 'bg-spiral-gold',
    title: 'Zobacz źródło',
    body: 'Spójrz, skąd pochodzi myśl, która sabotuje Twoje działania. Zobacz ją na linii czasu, oddychaj i powiedz sobie: to przeszłość.',
  },
  {
    key: 'step3',
    label: 'Trzeci krok',
    pill: 'bg-spiral-teal-soft',
    dot: 'bg-spiral-teal',
    title: 'Wymaż',
    body: 'Weź gumkę i zmaż ten obraz — porażkę, oczekiwania, brak wiary. Nie identyfikujesz się z tym. Dziś myślisz inaczej.',
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
              Gotowa droga
            </EditableText>
            <EditableText
              section={S}
              fieldPath="steps.title"
              as="h2"
              className={heading}
            >
              Jak sprawić, by przeszłość przestała wpływać na Twoje dziś?
            </EditableText>
            <EditableText
              section={S}
              fieldPath="steps.subtitle"
              as="p"
              className={body}
            >
              Ta praca jest prosta — możesz ją wykonać w domowym zaciszu.
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
            Uważaj, co myślisz, co mówisz i co robisz — bo to niebawem stanie
            się Twoją rzeczywistością.
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
// 4b. Czym się zajmuję — the client's longer description of her work
// (2026-11-10). Cream section between the white quote and the white invite,
// so Home keeps alternating white / pastel yellow. Draft copy is taken from
// her ebook; every line is CMS-editable (homeNow.offer.*).
// ---------------------------------------------------------------------------

const OFFER_POINTS = [
  {
    key: 'point1',
    dot: 'bg-spiral-coral',
    title: 'Psychobiologia',
    body: 'Pokazuję, jak przeżycia i emocje zapisują się w nas i w ciele — tak, by przestać się bać i zacząć rozumieć siebie.',
  },
  {
    key: 'point2',
    dot: 'bg-spiral-gold',
    title: 'Dekodowanie przekonań i programów',
    body: 'Razem odnajdujemy stare oprogramowanie — przekonania, lęki, wzorce z rodu — które dziś sabotuje Twoje działania.',
  },
  {
    key: 'point3',
    dot: 'bg-spiral-teal',
    title: 'Życie w teraz',
    body: 'Uczysz się zarządzać sobą tu i teraz: zauważać, widzieć źródło i wymazywać to, co już nie jest Tobą.',
  },
] as const;

function OfferSection() {
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
      <div className="mx-auto grid max-w-[1120px] gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col gap-5">
            <EditableText
              section={S}
              fieldPath="offer.eyebrow"
              as="p"
              className={eyebrow}
            >
              Czym się zajmuję
            </EditableText>
            <EditableText
              section={S}
              fieldPath="offer.title"
              as="h2"
              className={heading}
            >
              Pomagam zobaczyć, co naprawdę kieruje Twoim życiem
            </EditableText>
            <RainbowStroke className="-mt-2 w-[200px] md:w-[280px]" />
            <EditableText
              section={S}
              fieldPath="offer.body1"
              as="p"
              className={body}
            >
              Od 2016 roku zajmuję się psychobiologią i dekodowaniem przekonań
              oraz programów zapisanych w naszej podświadomości — tego
              wszystkiego, co sprawia, że jesteśmy zalęknieni, wycofani,
              zagubieni albo dominujący i kontrolujący.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="offer.body2"
              as="p"
              className={body}
            >
              Razem szukamy źródła tego, co dziś powraca w Twoim życiu. Myśli i
              słowa, które nie mówią już o Tobie z dziś, są starym
              oprogramowaniem — a kiedy je zobaczysz, możesz je świadomie
              wymienić.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="offer.body3"
              as="p"
              className={body}
            >
              Wierzę, że jest w nas przestrzeń na świadome decyzje i zmiany. I
              tym zajmuję się niezmiennie od wielu lat — na sesjach
              indywidualnych, warsztatach i spotkaniach.
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
    <section className="relative isolate overflow-hidden bg-white px-6 py-20 md:px-12 lg:px-[120px] md:py-28">
      <WatercolorAccent
        tone="warm"
        className="-left-20 -top-24 w-[260px] opacity-20 md:w-[340px]"
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
              Gotowa? To startujemy.
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
              <img
                src={butterflyArt}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="pointer-events-none absolute right-4 top-4 w-[76px] select-none transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105 md:right-7 md:top-7 md:w-[132px]"
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

          {/* Talk — painted dragonfly, cool blot */}
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
              <img
                src={dragonflyArt}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="pointer-events-none absolute right-3 top-5 w-[80px] select-none transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105 md:right-6 md:top-8 md:w-[140px]"
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
        description="Życie dzieje się teraz. Zrozum, jak działa człowiek i pamięć podświadomości, i uwolnij się od cierpienia — Spirala, Aneta Mroczko."
      />
      <HeroSection />
      <HumanSection />
      <StepsSection />
      <QuoteSection />
      <OfferSection />
      <InviteSection />
    </main>
  );
}
