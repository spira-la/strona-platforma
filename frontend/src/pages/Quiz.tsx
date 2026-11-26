import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { EditableText } from '@/components/cms/EditableText';
import { useCMS } from '@/contexts/CMSContext';
import {
  RainbowStroke,
  WatercolorAccent,
} from '@/components/shared/Watercolor';

// ---------------------------------------------------------------------------
// Quiz — "W której roli się zagubiłaś?" (Matka · Żona · Kochanka), 2026-11-25
//
// Moved onto the site from the standalone claude.ai artifact the client used
// on Instagram. Same 8 questions, same 4 results and the same scoring: each
// answer counts towards one role; the role with the most answers wins, and a
// tie means "Ja" (she lost herself). Every visible line is CMS-editable in
// section `quiz`, so she can fix wording and Seed + Translate gives EN / ES.
// ---------------------------------------------------------------------------

const S = 'quiz' as const;
const INSTAGRAM_URL = 'https://www.instagram.com/anetamroczkospirala/';
const FACEBOOK_URL = 'https://www.facebook.com/AnetaMroczko.Spirala';
// same fallbacks as the Kontakt page (pages/Contact.tsx)
const PHONE_FALLBACK = '+48 666 692 990';
const EMAIL_FALLBACK = 'contact@spira-la.com';

/** Question text and its four answers, in role order: Matka, Żona, Kochanka, Ja. */
const QUESTIONS = [
  {
    q: 'Kiedy ostatnio miałaś dość, chodziło o…',
    a: [
      'dziecko, które coraz bardziej się ode mnie oddala',
      'partnera, z którym tylko mijamy się w kuchni',
      'siebie, bo patrzę w lustro i nie poznaję kobiety, którą byłam',
      'wszystkich naraz, mam dość bycia dla każdego oprócz siebie',
    ],
  },
  {
    q: 'Wieczór, wszyscy w domu. Co robisz?',
    a: [
      'myślę o dzieciach: czy wszystko mają na jutro, co się z nimi dzieje',
      'siedzimy obok siebie, każde ze swoim telefonem',
      'zasypiam w dresie, a o bliskości nawet nie myślę',
      'jeszcze ogarniam pranie i jutrzejszy obiad, siadam, kiedy wszyscy już śpią',
    ],
  },
  {
    q: 'Ktoś pyta: „Co u Ciebie?”. Opowiadasz…',
    a: [
      'o dzieciach, ich szkole i problemach',
      'o tym, co u nas: dom, plany, sprawy męża',
      'mówię „wszystko dobrze” i szybko zmieniam temat',
      'nie wiem, co powiedzieć o sobie, moje życie to obowiązki',
    ],
  },
  {
    q: 'Co najbardziej Cię boli?',
    a: [
      'że mój nastolatek mówi, że go nie rozumiem',
      'że czuję się bardziej współlokatorką niż żoną',
      'że od dawna nie czuję się pożądana',
      'że już nie wiem, czego sama chcę',
    ],
  },
  {
    q: 'Kiedy ostatnio kupiłaś coś tylko dla siebie, żeby poczuć się pięknie?',
    a: [
      'nie pamiętam, wszystko idzie na dzieci',
      'kupuję, ale on i tak tego nie zauważa',
      'nie pamiętam, bo nie czuję się dobrze w swoim ciele',
      'kupuję, ale zawsze z poczuciem winy',
    ],
  },
  {
    q: 'Dostajesz wolny weekend tylko dla siebie. Co się dzieje?',
    a: [
      'i tak dzwonię do dzieci co dwie godziny',
      'czuję ulgę, że trochę odpocznę od domu i od niego',
      'nie wiem, co ze sobą zrobić, dawno nie robiłam niczego dla przyjemności',
      'i tak sprzątam, gotuję na zapas i nie umiem odpocząć',
    ],
  },
  {
    q: 'Zdanie, które najczęściej słyszysz w swojej głowie:',
    a: [
      '„Dobra matka powinna…”',
      '„W małżeństwie trzeba się dostosować”',
      '„Na to już za późno, to nie dla mnie”',
      '„Najpierw obowiązki, potem ja”',
    ],
  },
  {
    q: 'Czego najbardziej Ci brakuje?',
    a: [
      'spokoju, że moje dziecko sobie poradzi',
      'rozmowy i tego, żeby partner naprawdę mnie zauważył',
      'lekkości, flirtu i radości z bycia kobietą',
      'czasu tylko dla siebie i tego, żeby ktoś zadbał o mnie',
    ],
  },
] as const;

const RESULTS = [
  {
    key: 'mother',
    name: 'Matka',
    title: 'Zagubiłaś się w roli Matki',
    kw: 'MAMA',
    text: 'Twoje dzieci są Twoim całym światem i właśnie dlatego tak trudno Ci, kiedy dorastają i idą w swoją stronę. Gdzieś po drodze mama przykryła kobietę. Dobra wiadomość jest taka, że Twoje dziecko wcale nie potrzebuje mamy, która rezygnuje z siebie. Potrzebuje mamy, która żyje swoim życiem.',
    cta: '…a podpowiem Ci, od czego zacząć.',
    accent: 'border-t-spiral-teal',
    tag: 'bg-spiral-teal',
    ink: 'text-spiral-teal',
    box: 'border-spiral-teal',
  },
  {
    key: 'wife',
    name: 'Żona',
    title: 'Zagubiłaś się w roli Żony',
    kw: 'ŻONA',
    text: 'Dbasz o dom, o wspólne sprawy, o spokój. Tylko gdzie w tym wszystkim jesteś Ty? Kiedy w związku zaczynamy się dopasowywać, łatwo przestać być widzianą. To nie musi tak zostać.',
    cta: '…a pokażę Ci, jak wrócić do siebie w tej relacji.',
    accent: 'border-t-spiral-orange',
    tag: 'bg-spiral-orange',
    ink: 'text-spiral-orange',
    box: 'border-spiral-orange',
  },
  {
    key: 'lover',
    name: 'Kochanka',
    title: 'Zagubiłaś się w roli Kochanki',
    kw: 'KOCHANKA',
    text: 'Gdzieś między obowiązkami zgubiłaś kobietę, która lubi siebie, czuje swoje ciało i ma ochotę na życie. Ona nie zniknęła, tylko czeka, aż sobie o niej przypomnisz.',
    cta: '…a opowiem Ci o programie „Wzorzec Kochanki”.',
    accent: 'border-t-spiral-coral',
    tag: 'bg-spiral-coral',
    ink: 'text-spiral-coral',
    box: 'border-spiral-coral',
  },
  {
    key: 'me',
    name: 'Ja',
    title: 'Zagubiłaś siebie',
    kw: 'JA',
    text: 'Jesteś dla wszystkich, a dla siebie na samym końcu. Zanim zajmiesz się którąkolwiek rolą, warto wrócić do najważniejszej, czyli do siebie.',
    cta: '…a porozmawiamy, od której nitki zacząć.',
    accent: 'border-t-lavender',
    tag: 'bg-lavender',
    ink: 'text-lavender',
    box: 'border-lavender',
  },
] as const;

type Phase = 'start' | 'quiz' | 'result';

/** Most-chosen role wins; a tie at the top means "Ja" (index 3). */
function scoreAnswers(answers: number[]): number {
  const counts = [0, 0, 0, 0];
  answers.forEach((a) => {
    counts[a] += 1;
  });
  const max = Math.max(...counts);
  const top = counts.flatMap((c, k) => (c === max ? [k] : []));
  return top.length > 1 ? 3 : top[0];
}

const primaryBtn =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-action px-8 py-3 font-['Lato'] text-[15px] font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";
const ghostBtn =
  "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-action/25 bg-white px-7 py-3 font-['Lato'] text-[15px] font-semibold text-action transition-colors hover:border-action/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2";

// ---------------------------------------------------------------------------
// Start screen
// ---------------------------------------------------------------------------

function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <EditableText
        section={S}
        fieldPath="start.eyebrow"
        as="p"
        className="max-w-fit rounded-full bg-white/80 px-4 py-1.5 font-['Lato'] text-[13px] font-semibold uppercase tracking-[0.2em] text-brand-dark shadow-[0_2px_12px_-4px_rgba(63,48,68,0.18)]"
      >
        Matka, Żona i Kochanka
      </EditableText>
      <EditableText
        section={S}
        fieldPath="start.title"
        as="h1"
        className="text-balance font-['Cormorant_Garamond'] text-[40px] leading-[1.1] text-ink md:text-[56px]"
      >
        W której roli się zagubiłaś?
      </EditableText>
      <RainbowStroke className="-mt-2 w-[200px] md:w-[300px]" />
      <EditableText
        section={S}
        fieldPath="start.lead"
        as="p"
        className="max-w-[560px] font-['Lato'] text-[17px] leading-[1.75] text-ink-soft"
      >
        Matka. Żona. Kochanka. Każdego dnia jesteś każdą z nich, a czasem w
        którejś z tych ról po prostu znikasz. Odpowiedz szczerze na 8 pytań. Nie
        zastanawiaj się długo, wybierz to, co pierwsze przychodzi Ci do głowy.
      </EditableText>
      <button type="button" onClick={onStart} className={`${primaryBtn} mt-2`}>
        <EditableText section={S} fieldPath="start.button">
          Zaczynam
        </EditableText>
        <ArrowRight size={16} aria-hidden="true" />
      </button>
      <EditableText
        section={S}
        fieldPath="start.time"
        as="p"
        className="font-['Lato'] text-[14px] text-ink-muted"
      >
        Zajmie Ci to około 2 minut.
      </EditableText>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One question
// ---------------------------------------------------------------------------

function QuestionScreen({
  index,
  chosen,
  onAnswer,
  onBack,
}: {
  index: number;
  chosen: number | undefined;
  onAnswer: (k: number) => void;
  onBack: () => void;
}) {
  const { q, a } = QUESTIONS[index];
  const n = index + 1;
  return (
    <div className="flex flex-col">
      {/* rainbow progress in the spiral's colours */}
      <div
        className="h-2 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={QUESTIONS.length}
        aria-valuenow={index}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-spiral-violet),var(--color-spiral-coral),var(--color-brand),var(--color-spiral-gold),var(--color-spiral-teal))] transition-[width] duration-300"
          style={{ width: `${(index / QUESTIONS.length) * 100}%` }}
        />
      </div>
      <p className="mb-5 mt-2 font-['Lato'] text-[14px] text-ink-muted">
        {n} / {QUESTIONS.length}
      </p>
      <EditableText
        section={S}
        fieldPath={`q${n}.text`}
        as="h2"
        className="mb-6 text-balance font-['Cormorant_Garamond'] text-[28px] leading-[1.2] text-ink md:text-[36px]"
      >
        {q}
      </EditableText>
      <div className="grid gap-3">
        {a.map((text, k) => (
          <button
            key={k}
            type="button"
            onClick={() => onAnswer(k)}
            className={`min-h-[56px] w-full rounded-[18px] border-[1.5px] bg-white px-5 py-4 text-left font-['Lato'] text-[16px] leading-[1.45] text-ink transition-[border-color,transform,box-shadow] hover:-translate-y-px hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-spiral-teal focus-visible:ring-offset-2 ${
              chosen === k
                ? 'border-spiral-coral shadow-[inset_0_0_0_1.5px_var(--color-spiral-coral)]'
                : 'border-line'
            }`}
          >
            <EditableText section={S} fieldPath={`q${n}.a${k + 1}`}>
              {text}
            </EditableText>
          </button>
        ))}
      </div>
      {index > 0 && (
        <button
          type="button"
          onClick={onBack}
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 self-start font-['Lato'] text-[15px] font-semibold text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <EditableText section={S} fieldPath="quiz.back">
            Poprzednie pytanie
          </EditableText>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

function InstagramIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

/** A CMS value, or the fallback while the field is still unset. */
function cmsOr(raw: string, fieldPath: string, fallback: string): string {
  if (!raw || raw === fieldPath || raw.trim() === '') return fallback;
  return raw.trim();
}

const channelBtn =
  "inline-flex min-h-[44px] items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 font-['Lato'] text-[14px] font-semibold text-ink transition-colors hover:border-brand/50 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

/**
 * Every way to send her the keyword (client 2026-11-25: keep Instagram for
 * followers, add the phone, e-mail and Facebook). Phone and e-mail come from
 * the Kontakt page's CMS fields, so changing them there changes them here;
 * WhatsApp and e-mail open with the keyword already typed in.
 */
function ContactOptions({ result }: { result: (typeof RESULTS)[number] }) {
  const { getFieldValue } = useCMS();
  const phone = cmsOr(
    getFieldValue('contact', 'info.phone'),
    'info.phone',
    PHONE_FALLBACK,
  );
  const email = cmsOr(
    getFieldValue('contact', 'info.email'),
    'info.email',
    EMAIL_FALLBACK,
  );
  const keywordPath = `result.${result.key}.keyword`;
  const keyword = cmsOr(getFieldValue(S, keywordPath), keywordPath, result.kw);
  const digits = phone.replaceAll(/\D/g, '');
  const word = encodeURIComponent(keyword);

  return (
    <div className="mt-6 border-t border-line pt-5">
      <EditableText
        section={S}
        fieldPath="result.channelsLead"
        as="p"
        className="mb-3 font-['Lato'] text-[15px] font-semibold text-ink"
      >
        Wolisz inaczej? Wyślij to słowo tam, gdzie Ci wygodnie:
      </EditableText>
      <div className="flex flex-wrap gap-2">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={channelBtn}
        >
          <InstagramIcon />
          <EditableText section={S} fieldPath="result.channelInstagram">
            Instagram
          </EditableText>
        </a>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={channelBtn}
        >
          <FacebookIcon />
          <EditableText section={S} fieldPath="result.channelFacebook">
            Facebook
          </EditableText>
        </a>
        <a
          href={`https://wa.me/${digits}?text=${word}`}
          target="_blank"
          rel="noopener noreferrer"
          className={channelBtn}
        >
          <MessageCircle size={18} aria-hidden="true" />
          <EditableText section={S} fieldPath="result.channelWhatsapp">
            WhatsApp
          </EditableText>
        </a>
        <a
          href={`tel:${phone.replaceAll(/[^\d+]/g, '')}`}
          className={channelBtn}
        >
          <Phone size={18} aria-hidden="true" />
          {phone}
        </a>
        <a href={`mailto:${email}?subject=${word}`} className={channelBtn}>
          <Mail size={18} aria-hidden="true" />
          {email}
        </a>
      </div>
    </div>
  );
}

function KeywordBox({ result }: { result: (typeof RESULTS)[number] }) {
  const kwRef = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  // copy what is on screen, so a keyword she edits in the CMS is what's copied
  const copy = () => {
    const word = kwRef.current?.textContent?.trim() || result.kw;
    navigator.clipboard
      .writeText(word)
      .then(() => setCopied('ok'))
      .catch(() => setCopied('fail'));
  };
  return (
    <div
      className={`my-4 flex flex-wrap items-center gap-3 rounded-[14px] border-[1.5px] border-dashed px-4 py-3 ${result.box}`}
    >
      <span
        ref={kwRef}
        className={`font-['Lato'] text-[22px] font-bold tracking-[0.06em] ${result.ink}`}
      >
        <EditableText section={S} fieldPath={`result.${result.key}.keyword`}>
          {result.kw}
        </EditableText>
      </span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex min-h-[44px] items-center rounded-full border border-action/25 bg-white px-5 font-['Lato'] text-[14px] font-semibold text-action hover:border-action/50"
        aria-live="polite"
      >
        {copied === 'ok' && (
          <EditableText section={S} fieldPath="result.copied">
            Skopiowane ✓
          </EditableText>
        )}
        {copied === 'fail' && (
          <EditableText section={S} fieldPath="result.remember">
            Zapamiętaj to słowo
          </EditableText>
        )}
        {copied === 'idle' && (
          <EditableText section={S} fieldPath="result.copy">
            Skopiuj słowo
          </EditableText>
        )}
      </button>
    </div>
  );
}

function ResultScreen({
  resultIndex,
  onAgain,
}: {
  resultIndex: number;
  onAgain: () => void;
}) {
  const r = RESULTS[resultIndex];
  return (
    <div className="flex flex-col gap-6">
      <div
        className={`rounded-[24px] border-[1.5px] border-t-[6px] border-line bg-white p-6 shadow-[0_10px_34px_-22px_rgba(63,48,68,0.35)] md:p-9 ${r.accent}`}
      >
        <span
          className={`mb-4 inline-flex gap-1 rounded-full px-3.5 py-1 font-['Lato'] text-[14px] font-bold text-white ${r.tag}`}
        >
          <EditableText section={S} fieldPath="result.tag">
            Twój wynik:
          </EditableText>
          <EditableText section={S} fieldPath={`result.${r.key}.name`}>
            {r.name}
          </EditableText>
        </span>
        <EditableText
          section={S}
          fieldPath={`result.${r.key}.title`}
          as="h2"
          className={`mb-4 text-balance font-['Cormorant_Garamond'] text-[32px] leading-[1.15] md:text-[42px] ${r.ink}`}
        >
          {r.title}
        </EditableText>
        <EditableText
          section={S}
          fieldPath={`result.${r.key}.text`}
          as="p"
          className="font-['Lato'] text-[17px] leading-[1.75] text-ink-soft"
        >
          {r.text}
        </EditableText>
        <p className="mt-4 font-['Lato'] text-[17px] leading-[1.75] text-ink-soft">
          <EditableText section={S} fieldPath="result.dmLead">
            Napisz do mnie w wiadomości prywatnej na Instagramie
          </EditableText>{' '}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-ink underline decoration-brand/40 underline-offset-4 hover:decoration-brand"
          >
            <EditableText section={S} fieldPath="result.handle">
              @anetamroczkospirala
            </EditableText>
          </a>{' '}
          <EditableText section={S} fieldPath="result.dmWord">
            słowo:
          </EditableText>
        </p>
        <KeywordBox key={r.key} result={r} />
        <EditableText
          section={S}
          fieldPath={`result.${r.key}.cta`}
          as="p"
          className="font-['Lato'] text-[15px] text-ink-muted"
        >
          {r.cta}
        </EditableText>
        <ContactOptions result={r} />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryBtn}
        >
          <EditableText section={S} fieldPath="result.instagramButton">
            Napisz do mnie na Instagramie
          </EditableText>
        </a>
        <Link to="/" className={ghostBtn}>
          <EditableText section={S} fieldPath="result.siteButton">
            Poznaj Spiralę
          </EditableText>
        </Link>
        <button type="button" onClick={onAgain} className={ghostBtn}>
          <EditableText section={S} fieldPath="result.againButton">
            Wypełnij jeszcze raz
          </EditableText>
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>('start');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [resultIndex, setResultIndex] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const lock = useRef(false);

  const goTo = useCallback((next: Phase) => {
    setPhase(next);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const start = () => {
    setIndex(0);
    setAnswers([]);
    goTo('quiz');
  };

  // short pause so she sees her choice highlighted before the next question
  const answer = (k: number) => {
    if (lock.current) return;
    lock.current = true;
    const next = [...answers];
    next[index] = k;
    setAnswers(next);
    globalThis.setTimeout(() => {
      lock.current = false;
      if (index < QUESTIONS.length - 1) {
        setIndex(index + 1);
      } else {
        setResultIndex(scoreAnswers(next));
        goTo('result');
      }
    }, 220);
  };

  return (
    <main>
      <SEO
        title="W której roli się zagubiłaś? — quiz"
        description="Matka. Żona. Kochanka. Odpowiedz szczerze na 8 pytań i sprawdź, w której roli się zagubiłaś. Quiz Anety Mroczko, Spirala."
        canonical="/quiz"
        pathname="/quiz"
      />
      <section className="relative isolate min-h-[calc(100vh-72px)] overflow-hidden bg-surface px-6 pb-20 pt-12 md:px-12 md:pb-28 md:pt-16">
        <WatercolorAccent
          tone="warm"
          className="-right-24 -top-24 w-[300px] opacity-40 md:w-[420px]"
        />
        <WatercolorAccent
          tone="cool"
          className="-bottom-28 -left-24 w-[300px] opacity-35 md:w-[440px]"
        />
        <div
          ref={topRef}
          className="relative z-10 mx-auto max-w-[680px] scroll-mt-28"
        >
          {phase === 'start' && <StartScreen onStart={start} />}
          {phase === 'quiz' && (
            <QuestionScreen
              index={index}
              chosen={answers[index]}
              onAnswer={answer}
              onBack={() => setIndex((i) => Math.max(0, i - 1))}
            />
          )}
          {phase === 'result' && (
            <ResultScreen
              resultIndex={resultIndex}
              onAgain={() => goTo('start')}
            />
          )}
          <EditableText
            section={S}
            fieldPath="note"
            as="p"
            className="mt-12 border-t border-line pt-4 font-['Lato'] text-[13px] leading-[1.6] text-ink-muted"
          >
            Ten quiz to zaproszenie do zatrzymania się i przyjrzenia sobie. Nie
            jest testem psychologicznym ani diagnozą.
          </EditableText>
        </div>
      </section>
    </main>
  );
}
