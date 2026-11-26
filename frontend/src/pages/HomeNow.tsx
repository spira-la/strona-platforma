import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ChevronDown } from 'lucide-react';
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
// Home — "Spiralą w górę" (2026-11 redesign)
//
// Light, pastel. Rendered at "/" while the `classicHome` flag is off; the
// previous Home (pages/Home.tsx) is kept intact. CMS section `homeNow` is
// separate from `home`/`hero`, so text saved for the old page never leaks in.
//
// Copy: the client's text of 2026-11-26, every word, in her order
// (plan/teksty-klientki/start-tekst-2026-11-26.md). It follows the reader's
// path: hero · 1. niby wszystko jest (white) · 2. chcę zmiany (cream) ·
// 3. tak pracuję (white) + mountain-trail process (cream) · 4. boję się —
// questions and answers (white) · spotkania + porozmawiajmy (cream) · quiz.
// The earlier text (2026-11-17) is in start-nowy-tekst-2026-11-17.md and in
// git history.
// ---------------------------------------------------------------------------

const S = 'homeNow' as const;

// Backgrounds: watercolor paintings in the logo colors (client asked for
// joyful watercolor graphics instead of photos). Both are CMS images, so she
// can upload her own picture there.
const HERO_ART = heroArt;
const HUMAN_ART = bouquetArt;

const eyebrow =
  "font-['Lato'] text-[13px] uppercase tracking-[0.2em] text-brand-dark";
const heading =
  "text-balance font-['Cormorant_Garamond'] text-[36px] md:text-[48px] leading-[1.15] text-ink";
const body = "font-['Lato'] text-[17px] leading-[1.75] text-ink-soft";
const accentLine =
  "text-balance font-['Cormorant_Garamond'] text-[26px] italic leading-[1.3] text-ink md:text-[32px]";
const cardTitle =
  "font-['Cormorant_Garamond'] text-[24px] leading-tight text-ink md:text-[26px]";
const cardBody = "font-['Lato'] text-[16px] leading-[1.7] text-ink-soft";
const primaryBtn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-action px-9 py-4 font-['Lato'] text-[15px] font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const secondaryBtn =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-action/25 bg-white/70 px-9 py-4 font-['Lato'] text-[15px] font-semibold text-action transition-colors hover:bg-white hover:border-action/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const sectionPad = 'px-6 py-20 md:px-12 md:py-28 lg:px-[120px]';

// ---------------------------------------------------------------------------
// Hero — Spiralą w górę
// ---------------------------------------------------------------------------

/**
 * Hero title with the yellow butterfly landing on the word "górę". The title
 * stays CMS-editable; the landing spot is measured on the rendered text.
 */
function HeroTitle() {
  const { ref, spot } = useWordSpot<HTMLDivElement>('górę', 0.55, 0.4);
  return (
    <div ref={ref} className="relative">
      <EditableText
        section={S}
        fieldPath="hero.headline"
        as="h1"
        className="font-['Cormorant_Garamond'] text-[50px] md:text-[84px] leading-[1.05] text-ink"
      >
        Spiralą w górę
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
      className="relative flex min-h-[680px] md:min-h-[800px] items-center justify-center overflow-hidden"
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
            fieldPath="hero.kicker"
            as="p"
            // soft white pill so the line stays readable over the paint
            className={`${eyebrow} text-balance rounded-full bg-white/80 px-4 py-1.5 font-semibold shadow-[0_2px_12px_-4px_rgba(63,48,68,0.18)] backdrop-blur-sm`}
          >
            Dla kobiet, które mają dość kręcenia się w kółko
          </EditableText>
        </ScrollReveal>
        <ScrollReveal animation="blur" delay={150} duration={1000}>
          <HeroTitle />
          <RainbowStroke className="mx-auto -mt-1 w-[240px] md:mt-1 md:w-[420px]" />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={250} duration={900}>
          <EditableText
            section={S}
            fieldPath="hero.tagline"
            as="p"
            className="text-balance font-['Cormorant_Garamond'] text-[28px] italic leading-[1.25] text-ink md:text-[36px]"
          >
            Od teraz inaczej, bo tak wybierasz.
          </EditableText>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={400} duration={900}>
          {/* soft white card so the longer text stays readable over the paint */}
          <EditableText
            section={S}
            fieldPath="hero.text"
            as="p"
            className="max-w-[640px] rounded-[24px] bg-white/70 px-6 py-5 font-['Lato'] text-[16px] leading-[1.75] text-ink-soft shadow-[0_8px_30px_-18px_rgba(63,48,68,0.35)] backdrop-blur-sm md:text-[17px]"
          >
            Niby nic złego się nie dzieje, a Ty jesteś ciągle zmęczona. Nic nie
            cieszy. Życie stoi w miejscu i coraz częściej pytasz: po co mi to
            wszystko? Czasem chce Ci się płakać i nawet nie wiesz dlaczego.
            Jakbyś gdzieś po drodze zgubiła siebie. Pomagam kobietom zrozumieć,
            skąd ta pustka, odnaleźć siebie i wybrać inaczej. Po swojemu.
          </EditableText>
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={550} duration={900}>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
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
                <EditableText section={S} fieldPath="hero.ctaEvents">
                  Zobacz najbliższe spotkania
                </EditableText>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <EditableText
              section={S}
              fieldPath="hero.ctaNote"
              as="p"
              className="rounded-full bg-white/60 px-3 py-1 font-['Lato'] text-[14px] text-ink-soft backdrop-blur-sm"
            >
              Pierwsza rozmowa do niczego Cię nie zobowiązuje.
            </EditableText>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 1. Niby wszystko jest, a coś jest nie tak — her words, the sentences women
// say (as paper notes), and the "half of the way" closing. White.
// ---------------------------------------------------------------------------

const NOTES = [
  {
    key: 'note1',
    tone: 'bg-spiral-coral-soft -rotate-2',
    text: '„Nie wiem, czego chcę od życia.”',
  },
  {
    key: 'note2',
    tone: 'bg-spiral-gold-soft rotate-1',
    text: '„Ciągle jestem zmęczona, choć niby nic się nie dzieje.”',
  },
  {
    key: 'note3',
    tone: 'bg-spiral-blue-soft -rotate-1',
    text: '„Czy w związku z mężczyzną da się być naprawdę spełnioną? Czy ja mogę czuć się inaczej?”',
  },
  {
    key: 'note4',
    tone: 'bg-spiral-teal-soft rotate-2',
    text: '„Mówię do córki słowami mojej matki i sama się sobie dziwię.”',
  },
  {
    key: 'note5',
    tone: 'bg-lavender-soft -rotate-1',
    text: '„Wszystko robię dla innych. Dlaczego tak trudno mi zrobić coś dobrego dla siebie?”',
  },
] as const;

function EmptinessSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-white ${sectionPad}`}
    >
      <div className="mx-auto max-w-[1120px]">
        <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-20">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col gap-5">
              <EditableText
                section={S}
                fieldPath="stage1.title"
                as="h2"
                className={heading}
              >
                Niby wszystko jest. To czemu jest Ci tak ciężko?
              </EditableText>
              <RainbowStroke className="-mt-2 w-[200px] md:w-[260px]" />
              <EditableText
                section={S}
                fieldPath="stage1.body1"
                as="p"
                className={body}
              >
                Wstajesz rano i już jesteś zmęczona. Praca jest, dom jest,
                dzieci jakoś ogarnięte. Z zewnątrz wszystko gra.
              </EditableText>
              <EditableText
                section={S}
                fieldPath="stage1.body2"
                as="p"
                className={body}
              >
                A w środku pustka. I takie ciche pytanie, które wraca wieczorem:
                to już? Tak ma wyglądać moje życie?
              </EditableText>
              <EditableText
                section={S}
                fieldPath="stage1.body3"
                as="p"
                className={body}
              >
                Nie umiesz tego nazwać. Kiedy ktoś pyta, czego chcesz,
                odpowiadasz „nie wiem”. I to „nie wiem” jest chyba najszczersze,
                co możesz powiedzieć.
              </EditableText>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={200}>
            {/* Painted forget-me-not bouquet (the client's artwork) with the
                bee sitting on the top flowers. */}
            <div className="relative isolate mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center">
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
                <LandingBee className="bottom-[79%] left-[60%] w-[24%] -translate-x-1/2" />
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* what women say — paper notes */}
        <div className="mt-14 flex flex-wrap justify-center gap-5 md:mt-20 md:gap-6">
          {NOTES.map(({ key, tone, text }, i) => (
            <ScrollReveal
              key={key}
              animation="fade-up"
              delay={stagger(i, 100)}
              className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <figure
                className={`flex h-full items-center rounded-[6px] px-6 py-7 shadow-[0_10px_24px_-16px_rgba(63,48,68,0.45)] ${tone}`}
              >
                <EditableText
                  section={S}
                  fieldPath={`stage1.${key}`}
                  as="blockquote"
                  className="font-['Cormorant_Garamond'] text-[22px] italic leading-[1.35] text-ink md:text-[24px]"
                >
                  {text}
                </EditableText>
              </figure>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal animation="fade-up">
          <div className="mx-auto mt-14 flex max-w-[760px] flex-col gap-4 rounded-[28px] bg-surface p-7 text-center md:mt-20 md:p-10">
            <EditableText
              section={S}
              fieldPath="stage1.closing1"
              as="p"
              className={body}
            >
              Dobrze, że to zauważasz. Naprawdę. Wiele kobiet latami odsuwa to
              uczucie i udaje, że wszystko gra. Ty już wiesz, że coś jest nie
              tak, a to połowa drogi.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="stage1.closing2"
              as="p"
              className={`${accentLine} text-brand-dark`}
            >
              Teraz czas na drugą połowę. Nie musisz od razu wiedzieć, co dalej.
              Wystarczy, że dasz sobie trochę uwagi. Tyle, ile na co dzień
              dajesz innym.
            </EditableText>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Chcę zmiany — "Weź życie w swoje ręce". Cream. The ladybug walks from the
// orange blot (top-right) to the word "ręce".
// ---------------------------------------------------------------------------

/**
 * Title with the client's ladybug walking from the orange blot at the top of
 * the section to the word "ręce". The title stays CMS-editable; the stop is
 * measured on the rendered text.
 */
function ChangeTitle() {
  const { ref, spot } = useWordSpot<HTMLDivElement>('ręce', 0.5, 0.42);
  return (
    <div ref={ref} className="relative">
      <EditableText
        section={S}
        fieldPath="stage2.title"
        as="h2"
        className={heading}
      >
        Weź życie w swoje ręce
      </EditableText>
      {spot && <WalkingLadybug spot={spot} className="w-[34px] md:w-[44px]" />}
    </div>
  );
}

function ChangeSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-surface ${sectionPad}`}
    >
      <WatercolorAccent
        tone="warm"
        className="-right-24 -top-24 w-[300px] opacity-40 md:w-[400px]"
      />
      <WatercolorAccent
        tone="cool"
        className="-bottom-28 -left-24 w-[300px] opacity-30 md:w-[420px]"
      />
      <div className="mx-auto max-w-[1040px]">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto mb-12 flex max-w-[720px] flex-col items-center gap-4 text-center">
            <EditableText
              section={S}
              fieldPath="stage2.eyebrow"
              as="p"
              className={eyebrow}
            >
              To, co chcę Tobie dziś powiedzieć
            </EditableText>
            <ChangeTitle />
            <RainbowStroke className="-mt-1 w-[200px] md:w-[280px]" />
          </div>
        </ScrollReveal>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col gap-5">
              <EditableText
                section={S}
                fieldPath="stage2.body1"
                as="p"
                className={body}
              >
                Przychodzi taki moment, kiedy już wiesz, że chcesz inaczej.
                Czytasz, słuchasz podcastów, zapisujesz cytaty. W poniedziałek
                postanawiasz. W środę jesteś tam, gdzie byłaś.
              </EditableText>
              <EditableText
                section={S}
                fieldPath="stage2.accent"
                as="p"
                className={accentLine}
              >
                I wtedy przychodzi myśl: co jest ze mną nie tak?
              </EditableText>
              <EditableText
                section={S}
                fieldPath="stage2.body2"
                as="p"
                className={body}
              >
                Nic z Tobą nie jest nie tak. Po prostu na to, kim dziś jesteś,
                wpływa ogrom rzeczy. Twoje dzieciństwo. Środowisko, w którym
                dorastałaś. Ludzie, którymi się dziś otaczasz. I rodzina, z
                której pochodzisz. To wszystko zapisało się w Twojej
                podświadomości, a także w Twoim ciele.
              </EditableText>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fade-up" delay={150}>
            <div className="flex flex-col gap-5">
              <EditableText
                section={S}
                fieldPath="stage2.body3"
                as="p"
                className={body}
              >
                Dlatego jedno postanowienie w poniedziałek nie wystarczy. Zmiana
                potrzebuje pracy na kilku poziomach naraz. Ale przede wszystkim
                potrzebuje tego, żebyś zobaczyła, jak powstają Twoje kolejne
                dni. Że to Ty swoimi myślami i słowami zapraszasz swoją
                najbliższą przyszłość.
              </EditableText>
              <EditableText
                section={S}
                fieldPath="stage2.body4"
                as="p"
                className={body}
              >
                Nie musisz wiedzieć, od czego zacząć. Nie musisz rzucać pracy,
                zmieniać męża ani wyjeżdżać na Bali. Zaczynamy od tego, co jest
                teraz. Dzień za dniem robimy miejsce na spokój.
              </EditableText>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal animation="fade-up" delay={150}>
          <div className="mx-auto mt-12 flex max-w-[760px] flex-col items-center gap-4 rounded-[28px] bg-white p-7 text-center shadow-[0_10px_34px_-22px_rgba(63,48,68,0.35)] md:mt-16 md:p-10">
            <EditableText
              section={S}
              fieldPath="stage2.closing"
              as="p"
              className={body}
            >
              Ja pokażę Ci, co działa. Ty zrobisz swoją część. Bo nikt nie zrobi
              jej za Ciebie, ale też nie musisz robić jej sama.
            </EditableText>
            <EditableText
              section={S}
              fieldPath="stage2.ready"
              as="p"
              className="font-['Cormorant_Garamond'] text-[46px] italic leading-[1.05] text-brand-dark md:text-[60px]"
            >
              Gotowa?
            </EditableText>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Szukam metody — "Spiralą w górę. Tak pracuję": five areas as tiles, then
// the mountain trail (cream) with the four steps climbing up.
// ---------------------------------------------------------------------------

const AREAS = [
  {
    key: 'area1',
    dot: 'bg-spiral-coral',
    title: 'Przekonania',
    text: 'Zdania, które powtarzasz sobie od dziecka, często nie swoim głosem. „Nie wypada.” „Najpierw inni.” „Na miłość trzeba zasłużyć.”',
  },
  {
    key: 'area2',
    dot: 'bg-spiral-orange',
    title: 'Podświadomość i ciało',
    text: 'To, co dzieje się samo, zanim zdążysz pomyśleć. Ciało często wie wcześniej niż głowa.',
  },
  {
    key: 'area3',
    dot: 'bg-spiral-gold',
    title: 'Historia rodziny',
    text: 'Wzorce mamy i babci, które nosisz w sobie, choć nikt Ci ich wprost nie przekazał.',
  },
  {
    key: 'area4',
    dot: 'bg-spiral-teal',
    title: 'Sens',
    text: 'Duchowość po ludzku, bez kadzideł. Twoje wartości i kontakt z sobą.',
  },
  {
    key: 'area5',
    dot: 'bg-spiral-blue',
    title: 'Konkretne kroki',
    text: 'Rozmowa, która kończy się tym, co zrobisz jutro. Przy stole, online albo na szlaku w Beskidach.',
  },
] as const;

function MethodSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-white ${sectionPad}`}
    >
      <div className="mx-auto max-w-[1120px]">
        <ScrollReveal animation="fade-up">
          <div className="mx-auto mb-12 flex max-w-[720px] flex-col items-center gap-4 text-center">
            <EditableText
              section={S}
              fieldPath="method.eyebrow"
              as="p"
              className={eyebrow}
            >
              Jak mogę Cię wesprzeć
            </EditableText>
            <EditableText
              section={S}
              fieldPath="method.title"
              as="h2"
              className={heading}
            >
              Spiralą w górę. Tak pracuję
            </EditableText>
            <RainbowStroke className="-mt-1 w-[180px] md:w-[240px]" />
            <EditableText
              section={S}
              fieldPath="method.body"
              as="p"
              className={body}
            >
              Nie wybieram jednej szufladki. Ty też nie jesteś jedną szufladką.
              Masz myśli, ciało, historię swojej rodziny i to, w co wierzysz.
              Wszystko to ze sobą rozmawia, więc i ja patrzę na całość.
            </EditableText>
          </div>
        </ScrollReveal>

        <div className="flex flex-wrap justify-center gap-5">
          {AREAS.map(({ key, dot, title, text }, i) => (
            <ScrollReveal
              key={key}
              animation="fade-up"
              delay={stagger(i, 100)}
              className="w-full sm:w-[calc(50%-10px)] xl:w-[calc(33.333%-14px)]"
            >
              <div className="flex h-full flex-col gap-3 rounded-[24px] border border-line bg-white p-6 md:p-7">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-3 h-3 w-3 flex-shrink-0 rounded-full ${dot}`}
                    aria-hidden="true"
                  />
                  <EditableText
                    section={S}
                    fieldPath={`method.${key}Title`}
                    as="h3"
                    className={cardTitle}
                  >
                    {title}
                  </EditableText>
                </div>
                <EditableText
                  section={S}
                  fieldPath={`method.${key}Text`}
                  as="p"
                  className={cardBody}
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

const STEPS = [
  {
    key: 'step1',
    color: 'bg-spiral-coral',
    climb: 'xl:mt-24',
    title: 'Zatrzymujemy się.',
    text: 'Patrzymy, co się u Ciebie powtarza i kiedy.',
  },
  {
    key: 'step2',
    color: 'bg-spiral-gold',
    climb: 'xl:mt-16',
    title: 'Szukamy źródła.',
    text: 'Skąd to się wzięło i komu kiedyś służyło.',
  },
  {
    key: 'step3',
    color: 'bg-spiral-teal',
    climb: 'xl:mt-8',
    title: 'Odkładasz to, co nie Twoje.',
    text: 'Bez rozdrapywania ran i bez szukania winnych.',
  },
  {
    key: 'step4',
    color: 'bg-spiral-blue',
    climb: 'xl:mt-0',
    title: 'Wybierasz nowy sposób.',
    text: 'Nowy sposób reagowania, który wybierasz sama, a nie dostałaś w spadku.',
  },
] as const;

function TrailSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-surface ${sectionPad}`}
    >
      <WatercolorAccent
        tone="cool"
        className="-right-24 -top-24 w-[300px] opacity-35 md:w-[420px]"
      />
      <WatercolorAccent
        tone="warm"
        className="-bottom-28 -left-24 w-[300px] opacity-35 md:w-[400px]"
      />
      <div className="mx-auto max-w-[1120px]">
        <ScrollReveal animation="blur">
          <figure className="mx-auto mb-14 flex max-w-[820px] flex-col items-center gap-5 text-center">
            {/* rainbow butterfly — lightness and change */}
            <div className="relative h-[100px] w-[120px] md:h-[140px] md:w-[166px]">
              <WatercolorFriend
                kind="wings"
                flutter
                className="inset-0 w-full"
              />
            </div>
            <EditableText
              section={S}
              fieldPath="trail.lead"
              as="blockquote"
              className="text-balance font-['Cormorant_Garamond'] text-[30px] italic leading-[1.25] text-ink md:text-[42px]"
            >
              Szlak w górach nie idzie prosto na szczyt. Wije się zakosami.
            </EditableText>
            <RainbowStroke className="w-[160px] md:w-[220px]" />
            <EditableText
              section={S}
              fieldPath="trail.body"
              as="p"
              className={`${body} max-w-[640px]`}
            >
              Każdy zakręt wygląda podobnie do poprzedniego, a jednak za każdym
              razem jesteś wyżej. Tak właśnie wygląda zmiana.
            </EditableText>
          </figure>
        </ScrollReveal>

        {/* the four steps climb like switchbacks: step 1 lowest, 4 highest */}
        <ol className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:items-start">
          {STEPS.map(({ key, color, climb, title, text }, i) => (
            <li key={key} className={climb}>
              <ScrollReveal animation="fade-up" delay={stagger(i, 120)}>
                <div className="flex h-full flex-col gap-3 rounded-[24px] bg-white p-6 shadow-[0_10px_30px_-20px_rgba(63,48,68,0.35)]">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-['Lato'] text-[17px] font-bold text-white ${color}`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <EditableText
                    section={S}
                    fieldPath={`trail.${key}Title`}
                    as="h3"
                    className={cardTitle}
                  >
                    {title}
                  </EditableText>
                  <EditableText
                    section={S}
                    fieldPath={`trail.${key}Text`}
                    as="p"
                    className={cardBody}
                  >
                    {text}
                  </EditableText>
                </div>
              </ScrollReveal>
            </li>
          ))}
        </ol>

        <ScrollReveal animation="fade-up">
          <div className="mx-auto mt-14 flex max-w-[680px] flex-col items-center gap-6 text-center">
            <EditableText
              section={S}
              fieldPath="trail.closing"
              as="p"
              className={accentLine}
            >
              Podobne sytuacje jeszcze się zdarzą, bo takie jest życie. Ale Ty
              będziesz już w innym miejscu i zareagujesz inaczej.
            </EditableText>
            <EditableButtonLink
              section={S}
              fieldPath="trail.cta"
              defaultAction="internal:/kontakt"
              className={primaryBtn}
            >
              <EditableText section={S} fieldPath="trail.cta">
                Umów rozmowę
              </EditableText>
            </EditableButtonLink>
            <EditableText
              section={S}
              fieldPath="trail.disclaimer"
              as="p"
              className="max-w-[560px] font-['Lato'] text-[13px] leading-[1.6] text-ink-muted"
            >
              Nie stawiam diagnoz i nie zastępuję lekarza ani terapeuty. Moja
              praca może iść obok leczenia, nigdy zamiast niego.
            </EditableText>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Boję się, mam wątpliwości — her answers to the ten reasons to wait, as
// an expandable list. White.
// ---------------------------------------------------------------------------

const FEARS = [
  {
    key: 'fear1',
    q: '„Nie mam na to czasu.”',
    a: 'Wiem. Dlatego zaczynamy od jednej rozmowy, nie od wielkiego programu. A potem sama zdecydujesz, ile miejsca dasz sobie w swoim kalendarzu.',
  },
  {
    key: 'fear2',
    q: '„A jeśli wyjdą rzeczy, z którymi sobie nie poradzę?”',
    a: 'Rozwój osobisty nie musi boleć. Idziemy w Twoim tempie i nie otwieramy więcej, niż jesteś gotowa unieść. Ty decydujesz, o czym mówimy.',
  },
  {
    key: 'fear3',
    q: '„To jakieś czary? Ezoteryka?”',
    a: 'Nie. Rozmawiamy o Twoim życiu, Twoich myślach i Twojej rodzinie. Konkretnie i po ludzku.',
  },
  {
    key: 'fear4',
    q: '„Już próbowałam i nic.”',
    a: 'Może dlatego, że próbowałaś zmienić zachowanie, a nie to, co pod nim siedzi. Tu zaczynamy od źródła.',
  },
  {
    key: 'fear5',
    q: '„Ile to kosztuje?”',
    a: 'Na pierwszej rozmowie powiem Ci uczciwie, co jest możliwe i ile to kosztuje. Zanim cokolwiek zdecydujesz.',
  },
  {
    key: 'fear6',
    q: '„Nie chcę, żeby ktoś mnie naprawiał.”',
    a: 'I nie będę. Nie jesteś zepsuta. Taka, jaka jesteś, jesteś w porządku. Ja pokażę Ci tylko możliwości, a Ty wybierzesz, którędy chcesz iść dalej.',
  },
] as const;

function FearsSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-white ${sectionPad}`}
    >
      <WatercolorFriend
        kind="butterflyBlue"
        fly="left"
        delay={1}
        className="right-[4%] top-3 w-[56px] md:right-[8%] md:top-6 md:w-[88px]"
      />
      <div className="mx-auto max-w-[820px]">
        <ScrollReveal animation="fade-up">
          <div className="mb-10 flex flex-col items-center gap-4 text-center">
            <EditableText
              section={S}
              fieldPath="fears.eyebrow"
              as="p"
              className="font-['Lato'] text-[13px] font-semibold uppercase tracking-[0.2em] text-spiral-blue"
            >
              I jeszcze jedna ważna rzecz
            </EditableText>
            <EditableText
              section={S}
              fieldPath="fears.title"
              as="h2"
              className={heading}
            >
              Boisz się? To dobrze, że o tym mówimy
            </EditableText>
            <RainbowStroke className="-mt-1 w-[180px] md:w-[240px]" />
            <EditableText
              section={S}
              fieldPath="fears.body"
              as="p"
              className={body}
            >
              Zanim napiszesz, w głowie pojawi się dziesięć powodów, żeby
              jeszcze poczekać. Słyszę je od wielu kobiet. Więc od razu na nie
              odpowiem.
            </EditableText>
          </div>
        </ScrollReveal>

        <div className="flex flex-col gap-3">
          {FEARS.map(({ key, q, a }, i) => (
            <ScrollReveal key={key} animation="fade-up" delay={stagger(i, 80)}>
              <details className="group rounded-[20px] border border-line bg-surface/60 transition-colors open:bg-surface">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 md:px-7 [&::-webkit-details-marker]:hidden">
                  <EditableText
                    section={S}
                    fieldPath={`fears.${key}Q`}
                    as="span"
                    className="font-['Cormorant_Garamond'] text-[22px] italic leading-[1.3] text-ink md:text-[24px]"
                  >
                    {q}
                  </EditableText>
                  <ChevronDown
                    size={20}
                    className="flex-shrink-0 text-brand-dark transition-transform duration-300 group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <EditableText
                  section={S}
                  fieldPath={`fears.${key}A`}
                  as="p"
                  className={`${cardBody} px-6 pb-6 md:px-7`}
                >
                  {a}
                </EditableText>
              </details>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal animation="fade-up">
          <EditableText
            section={S}
            fieldPath="fears.closing"
            as="p"
            className={`${accentLine} mx-auto mt-12 max-w-[680px] text-center text-brand-dark`}
          >
            Nie musisz przestać się bać, żeby zacząć. Wystarczy, że zrobisz
            pierwszy krok razem ze strachem.
          </EditableText>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Spotkania + Porozmawiajmy — the two ways to start. Cream.
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

const TALK_POINTS = [
  {
    key: 'contactPoint1',
    dot: 'bg-spiral-teal',
    text: 'Odpowiadam osobiście, zwykle w ciągu doby',
  },
  {
    key: 'contactPoint2',
    dot: 'bg-spiral-blue',
    text: 'Bez zobowiązań, po prostu zacznijmy rozmowę',
  },
  {
    key: 'contactPoint3',
    dot: 'bg-spiral-violet',
    text: 'To, co napiszesz, zostaje między nami',
  },
] as const;

function EventsCard() {
  return (
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
      {/* the pink butterfly beating its wings and hovering */}
      <WatercolorFriend
        kind="butterfly"
        float
        className="right-5 top-5 w-[60px] transition-[rotate,scale] duration-500 group-hover:-rotate-6 group-hover:scale-105 md:right-8 md:top-8 md:w-[104px]"
      />
      <div className="flex min-h-[96px] flex-col gap-3 pr-16 md:min-h-[136px] md:pr-32">
        <span
          className={`${invitePill} bg-spiral-coral-soft text-spiral-coral`}
        >
          <EditableText section={S} fieldPath="invite.eventsEyebrow" as="span">
            Spotkajmy się
          </EditableText>
        </span>
        <EditableText
          section={S}
          fieldPath="invite.meetingsTitle"
          as="h3"
          className={inviteTitle}
        >
          Spotkania dla kobiet
        </EditableText>
      </div>
      <EditableText
        section={S}
        fieldPath="invite.meetingsBody1"
        as="p"
        className={body}
      >
        Kilka godzin tylko dla siebie. Mała grupa, herbata i rozmowa o tym, co
        naprawdę Cię zajmuje. Bez oceniania, bez ezoteryki i bez musu mówienia,
        jeśli wolisz posłuchać.
      </EditableText>
      <EditableText
        section={S}
        fieldPath="invite.meetingsBody2"
        as="p"
        className={body}
      >
        To dobry początek, jeśli chcesz mnie najpierw poznać, zanim zdecydujesz
        się na pracę indywidualną.
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
  );
}

function TalkCard() {
  return (
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
        <span className={`${invitePill} bg-spiral-blue-soft text-spiral-blue`}>
          <EditableText section={S} fieldPath="invite.contactEyebrow" as="span">
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
        fieldPath="invite.talkBody1"
        as="p"
        className={body}
      >
        Napisz kilka zdań o tym, co się u Ciebie dzieje. Nie musisz umieć tego
        ładnie nazwać. Wystarczy „coś jest nie tak”. Od tego też można zacząć.
      </EditableText>
      <EditableText
        section={S}
        fieldPath="invite.talkBody2"
        as="p"
        className={body}
      >
        Razem znajdziemy Twój pierwszy krok.
      </EditableText>
      <ul className="flex flex-col gap-2 font-['Lato'] text-[15px] text-ink-soft">
        {TALK_POINTS.map(({ key, dot, text }) => (
          <li key={key} className="flex items-center gap-2.5">
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${dot}`}
              aria-hidden="true"
            />
            <EditableText section={S} fieldPath={`invite.${key}`} as="span">
              {text}
            </EditableText>
          </li>
        ))}
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
  );
}

function InviteSection() {
  return (
    <section
      className={`relative isolate overflow-hidden bg-surface ${sectionPad}`}
    >
      <div className="mx-auto grid max-w-[1040px] grid-cols-1 gap-7 md:grid-cols-2">
        <ScrollReveal animation="fade-up">
          <EventsCard />
        </ScrollReveal>
        <ScrollReveal animation="fade-up" delay={stagger(1)}>
          <TalkCard />
        </ScrollReveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Quiz invitation — leads to /quiz ("W której roli się zagubiłaś?").
// Lavender band so it stands apart from the cream invite above.
// ---------------------------------------------------------------------------

function QuizTeaser() {
  return (
    <section className="relative isolate overflow-hidden bg-lavender-mist px-6 py-16 md:px-12 md:py-20 lg:px-[120px]">
      <WatercolorAccent
        tone="cool"
        className="-right-20 -top-24 w-[260px] opacity-30 md:w-[360px]"
      />
      <ScrollReveal animation="fade-up">
        <div className="mx-auto flex max-w-[720px] flex-col items-center gap-4 text-center">
          <EditableText
            section={S}
            fieldPath="quiz.eyebrow"
            as="p"
            className="font-['Lato'] text-[13px] font-semibold uppercase tracking-[0.2em] text-lavender"
          >
            Matka. Żona. Kochanka.
          </EditableText>
          <EditableText
            section={S}
            fieldPath="quiz.title"
            as="h2"
            className={heading}
          >
            W której roli się zagubiłaś?
          </EditableText>
          <EditableText
            section={S}
            fieldPath="quiz.body"
            as="p"
            className={body}
          >
            8 szczerych pytań, około 2 minut. Sprawdź, gdzie dziś jesteś Ty.
          </EditableText>
          <Link to="/quiz" className={`${primaryBtn} mt-2`}>
            <EditableText section={S} fieldPath="quiz.button">
              Rozwiąż quiz
            </EditableText>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </ScrollReveal>
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
        description="Techniki tkania życia po swojemu. Wybierasz, że od teraz zrobisz to inaczej."
      />
      <HeroSection />
      <EmptinessSection />
      <ChangeSection />
      <MethodSection />
      <TrailSection />
      <FearsSection />
      <InviteSection />
      <QuizTeaser />
    </main>
  );
}
