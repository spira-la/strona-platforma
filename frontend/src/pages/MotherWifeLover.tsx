import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { EditableButtonLink } from '@/components/cms/EditableButtonLink';
import { EditableBackground } from '@/components/cms/EditableBackground';
import { EditableOverlay } from '@/components/cms/EditableOverlay';
import { EditableImage } from '@/components/cms/EditableImage';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

// -------------------------------------------------------------------------
// Section badge — reused from the mama-nastolatka page pattern
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

// -------------------------------------------------------------------------
// Page
// -------------------------------------------------------------------------

export default function MotherWifeLover() {
  return (
    <main className="min-h-screen bg-[#F9F6F0] text-[#2D2D2D]">
      <SEO
        title="Matka, żona, kochanka — rozpoznaj wzorzec | Spirala"
        description="Role kobiece, które odtwarzamy bez pytania. Praca z wzorcami rodowymi w relacjach — sesje z Anetą, Spirala."
        canonical="/matka-zona-kochanka"
        pathname="/matka-zona-kochanka"
      />

      {/* ---------------------------------------------------------------- */}
      {/* HERO — no CTA button (pure introduction per brief)               */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 overflow-hidden h-[480px] md:h-[560px]"
        aria-label="Matka, żona, kochanka — wzorce ról kobiecych"
      >
        <EditableBackground
          section="motherWifeLover"
          fieldPath="heroImg"
          fallbackSrc="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section="motherWifeLover"
          fieldPath="heroImg"
          color="30,18,6"
          defaultTop={60}
          defaultBottom={75}
        />

        <ScrollReveal
          animation="fade"
          delay={200}
          className="relative z-10 flex flex-col items-center gap-5 max-w-3xl"
        >
          <EditableText
            section="motherWifeLover"
            fieldPath="heroTitle"
            as="h1"
            placeholder="Matka, żona, kochanka"
            className="text-4xl sm:text-5xl font-normal leading-[1.2] tracking-[-0.5px] text-white max-w-[820px] [font-family:'Playfair_Display',serif]"
          />
          <EditableText
            section="motherWifeLover"
            fieldPath="heroSub"
            as="p"
            placeholder="Trzy role, w które wchodzi każda kobieta. Rzadko kto pyta, na ile są jej własne — a na ile odziedziczone."
            className="text-base sm:text-lg leading-relaxed text-white/75 max-w-[600px] [font-family:'Lato',sans-serif]"
          />
        </ScrollReveal>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 1 — Role, które gramy bez pytania                        */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-24 bg-[#F9F6F0]"
        aria-label="Role, które gramy bez pytania"
      >
        <div className="max-w-[700px] mx-auto flex flex-col gap-8">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col gap-4">
              <SectionBadge label="Role kobiece" />
              <EditableText
                section="motherWifeLover"
                fieldPath="s1Title"
                as="h2"
                placeholder="Role, które gramy bez pytania"
                className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <div className="flex flex-col gap-6">
              <EditableText
                section="motherWifeLover"
                fieldPath="s1P1"
                as="p"
                placeholder="Role, które pełnimy, nie zawsze wybieramy świadomie. Często nieświadomie realizujemy to, co kolektywnie nam podpowiada otoczenie, pokolenie, rodzina."
                className="text-base leading-[1.85] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s1P2"
                as="p"
                placeholder='Wychodzimy za mąż w „odpowiednim wieku", bo kiedyś najgorszą rzeczą było zostać starą panną. Czujemy presję, żeby być żoną. A jeśli związek — to pewnie kolejny krok to rodzina. Lecimy po schemacie, choć niejedna z nas nie ma na to stuprocentowej ochoty. Ale rodzina to świętość, więc spełniamy oczekiwania mamy, która marzy, by być babcią, albo wreszcie przynależeć do grupy, która ma tyle do powiedzenia o dzieciach.'
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s1P3"
                as="p"
                placeholder="A życie płynie i wykolejasz się na pierwszym zakręcie, bo nikt nas nie nauczył, jak być matką. Więc robisz to, co znasz: jesteś matką taką samą, jaka była dla Ciebie Twoja mama. I są obszary, których nie chciałaś powielać, a w emocjach — stało się. Poczucie winy wchodzi jak burza."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s1P4"
                as="p"
                placeholder="Pogodzenie roli żony i matki to osobny temat, z którym boryka się większość kobiet. Bo gdzie tu znaleźć czas na bycie sobą?"
                className="text-base leading-[1.85] italic text-[#6B6B6B] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 2 — Rola, o której się nie mówi                         */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-24 bg-[#EEE6D8]"
        aria-label="Rola, o której się nie mówi"
      >
        <div className="max-w-[700px] mx-auto flex flex-col gap-8">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col gap-4">
              <SectionBadge label="Temat tabu" />
              <EditableText
                section="motherWifeLover"
                fieldPath="s2Title"
                as="h2"
                placeholder="Rola, o której się nie mówi"
                className="text-3xl sm:text-4xl font-normal tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <div className="flex flex-col gap-6">
              <EditableText
                section="motherWifeLover"
                fieldPath="s2P1"
                as="p"
                placeholder="To jeszcze nie wszystko. Jest jedna rola, o której mówi się najmniej — rola kochanki. Temat tabu, zarezerwowany dla osądu, nie dla zrozumienia."
                className="text-base leading-[1.85] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s2P2"
                as="p"
                placeholder="Zdrady i bycie zdradzaną. Jeśli to Twoja historia, chcę, żebyś wiedziała jedno: to nie sprawia, że jesteś wyklęta. Ale jeśli ten wzorzec się powtarza, warto zapytać, skąd się bierze."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s2P3"
                as="p"
                placeholder="Nie znika z niczego. Często ma swój początek w historii rodziny, z której pochodzisz — w romansach, dramatach, zdradach, które kiedyś przyniosły wykluczenie, wstyd i odrzucenie temu, kto je przeżył."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              {/* NOTE: last sentence is ethically critical — do not remove per client brief */}
              <EditableText
                section="motherWifeLover"
                fieldPath="s2P4"
                as="p"
                placeholder="To nie jest wyjaśnienie, które zwalnia z wyboru. To jest mechanizm, który — kiedy go zobaczysz — przestaje rządzić Tobą po cichu."
                className="text-base leading-[1.85] font-medium text-[#2D2D2D] border-l-2 border-[#B8944A] pl-5 [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* MID-PAGE IMAGE — breathing space / transformation motif          */}
      {/* ---------------------------------------------------------------- */}
      <div
        className="w-full overflow-hidden"
        aria-hidden="true"
        role="presentation"
      >
        <EditableImage
          section="motherWifeLover"
          fieldPath="midImg"
          fallbackSrc="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1400&q=80"
          alt="Motyl wyłaniający się z cienia ku światłu — symbol przemiany"
          className="w-full h-[320px] sm:h-[420px] object-cover"
        />
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* SECTION 3 — To da się odczarować                                 */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="px-6 py-16 sm:py-24 bg-white"
        aria-label="To da się odczarować"
      >
        <div className="max-w-[700px] mx-auto flex flex-col gap-8">
          <ScrollReveal animation="fade-up">
            <div className="flex flex-col gap-4">
              <SectionBadge label="Przemiana" gold />
              <EditableText
                section="motherWifeLover"
                fieldPath="s3Title"
                as="h2"
                placeholder="To da się odczarować"
                className="text-3xl sm:text-4xl font-bold tracking-[-0.5px] text-[#2D2D2D] [font-family:'Playfair_Display',serif]"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <div className="flex flex-col gap-6">
              <EditableText
                section="motherWifeLover"
                fieldPath="s3P1"
                as="p"
                placeholder="Dobra wiadomość: to da się zmienić."
                className="text-xl leading-[1.7] font-medium text-[#B8944A] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s3P2"
                as="p"
                placeholder="Ja to zrobiłam. Jestem wolna od tych wzorców. Tworzę relacje pełne szacunku i miłości — nie czyniąc drugiemu tego, co mnie nie byłoby miłe."
                className="text-base leading-[1.85] text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s3P3"
                as="p"
                placeholder="Jeśli to Twoja historia i chcesz napisać ją na nowo. Uwolnić się od poczucia winy, od wstydu — jesteś we właściwym miejscu. Pracuję metodą pracy z rodem: oddawania tym, do których coś należy, i odzyskiwania tego, co Twoje."
                className="text-base leading-[1.85] text-[#5A5550] [font-family:'Lato',sans-serif]"
              />
              <EditableText
                section="motherWifeLover"
                fieldPath="s3P4"
                as="p"
                placeholder="Twoje życie może być wolne od wstydu i poczucia winy."
                className="text-base leading-[1.85] italic text-[#2D2D2D] [font-family:'Lato',sans-serif]"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* FINAL CTA                                                         */}
      {/* ---------------------------------------------------------------- */}
      <section
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden"
        style={{ minHeight: '400px' }}
        aria-label="Umów bezpłatną rozmowę"
      >
        <EditableBackground
          section="motherWifeLover"
          fieldPath="ctaBg"
          fallbackSrc="https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80"
          className="absolute inset-0"
          aria-hidden={true}
        />
        <EditableOverlay
          section="motherWifeLover"
          fieldPath="ctaBg"
          color="30,18,6"
          defaultTop={72}
          defaultBottom={80}
        />

        <ScrollReveal
          animation="fade"
          duration={900}
          className="relative z-10 flex flex-col items-center gap-6 max-w-[672px]"
        >
          <EditableText
            section="motherWifeLover"
            fieldPath="ctaTitle"
            as="h2"
            placeholder="To co, działamy?"
            className="text-3xl sm:text-4xl font-bold text-white [font-family:'Playfair_Display',serif]"
          />
          <EditableText
            section="motherWifeLover"
            fieldPath="ctaSub"
            as="p"
            placeholder="Napisz albo zadzwoń — zaplanujemy ścieżkę powrotu do prawdziwej Ciebie, bez uwikłań rodowych."
            className="text-base sm:text-lg leading-relaxed text-white/80 max-w-[580px] [font-family:'Lato',sans-serif]"
          />
          <EditableButtonLink
            section="motherWifeLover"
            fieldPath="ctaBtn"
            defaultAction="booking"
            className="mt-2 inline-flex items-center justify-center px-10 py-4 rounded-full bg-[#B8944A] text-white text-base font-bold transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A] [font-family:'Lato',sans-serif]"
          >
            <EditableText
              section="motherWifeLover"
              fieldPath="ctaBtn"
              as="span"
              placeholder="Umawiam bezpłatną rozmowę →"
            />
          </EditableButtonLink>
        </ScrollReveal>
      </section>
    </main>
  );
}
