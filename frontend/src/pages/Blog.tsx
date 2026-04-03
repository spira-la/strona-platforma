import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Mail } from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { ScrollReveal, stagger } from '@/components/shared/ScrollReveal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlogCardData {
  id: number;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  imageUrl: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Static data — will be replaced by CMS/API data in future iterations
// ---------------------------------------------------------------------------

const BLOG_POSTS: BlogCardData[] = [
  {
    id: 1,
    category: 'Relacje',
    title: 'Jak budowac zdrowe granice w relacjach',
    excerpt:
      'Granice to nie mury — to wyraz szacunku do siebie i do drugiego czlowieka. Dowiedz sie, jak je wyznaczac z miloscia.',
    date: '12 marca 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
    slug: '/blog/zdrowe-granice',
  },
  {
    id: 2,
    category: 'Rozwoj osobisty',
    title: 'Praktyki uwaznosci na trudne dni',
    excerpt:
      'Kiedy rzeczywistosc przytlacza, drobne rytualy uwaznosciowe moga stac sie kotwica. Kilka sprawdzonych praktyk.',
    date: '5 marca 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800&auto=format&fit=crop',
    slug: '/blog/praktyki-uwaznosci',
  },
  {
    id: 3,
    category: 'Emocje',
    title: 'Zlosc jako informacja, nie wrog',
    excerpt:
      'Zlosc bywa potepiana, ale kryje w sobie wazny przekaz. Naucz sie jej suchac zamiast ja tlumic.',
    date: '25 lutego 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?q=80&w=800&auto=format&fit=crop',
    slug: '/blog/zlosc-jako-informacja',
  },
  {
    id: 4,
    category: 'Trauma',
    title: 'Cialo pamięta — somatyczne podejscie do uzdrawiania',
    excerpt:
      'Trauma zapisuje sie nie tylko w umysle, ale i w ciele. Jak praca z sensacjami cielesnymi moze wspierac zdrowienie.',
    date: '18 lutego 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=800&auto=format&fit=crop',
    slug: '/blog/cialo-pamieta',
  },
  {
    id: 5,
    category: 'Coaching',
    title: 'Cel czy wartosci — co naprawde prowadzi do zmiany',
    excerpt:
      'Wiele osob stawia sobie cele, ale za mala uwage poswięca wartosciom. To one sa kompasem trwalej transformacji.',
    date: '10 lutego 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1443890923422-7819ed4101c0?q=80&w=800&auto=format&fit=crop',
    slug: '/blog/cel-czy-wartosci',
  },
  {
    id: 6,
    category: 'Samopoznanie',
    title: 'Dziennik wdzieznosci — dlaczego dziala',
    excerpt:
      'Neurobiologia potwierdzila to, co intuicja czuje od dawna: regularna praktyka wdzieznosci zmienia mozg.',
    date: '3 lutego 2026',
    imageUrl:
      'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=800&auto=format&fit=crop',
    slug: '/blog/dziennik-wdziecznosci',
  },
];

const FEATURED_POST = {
  title: 'Jak uwolnic sie od blokad przekazywanych przez pokolenia',
  excerpt:
    'Wzorce z dziecinstwa, przekonania przejęte od rodzicow, nieświadome reakcje — to wszystko moze nas ograniczac. Ale mozna sie od nich uwolnic. Dowiedz sie jak.',
  date: '20 marca 2026',
  imageUrl:
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=900&auto=format&fit=crop',
  slug: '/blog/blokady-miedzypokoleniowe',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BlogCardProps {
  post: BlogCardData;
}

function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-[#F0EDE8] hover:shadow-md transition-shadow duration-300">
      <div className="relative overflow-hidden h-48">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col flex-1 p-5 gap-3">
        <span className="inline-block self-start font-['Lato'] text-[11px] font-semibold tracking-[0.08em] uppercase text-[#B8944A] bg-[#B8944A]/[0.1] rounded-full px-3 py-1">
          {post.category}
        </span>
        <h3 className="font-['Playfair_Display'] text-[17px] font-bold text-[#2D2D2D] leading-snug">
          {post.title}
        </h3>
        <p className="font-['Lato'] text-[14px] text-[#6B6B6B] leading-relaxed flex-1">
          {post.excerpt}
        </p>
        <div className="flex items-center justify-between pt-2 border-t border-[#F0EDE8]">
          <span className="flex items-center gap-1.5 font-['Lato'] text-[13px] text-[#8A8A8A]">
            <Calendar size={13} aria-hidden="true" />
            {post.date}
          </span>
          <Link
            to={post.slug}
            className="flex items-center gap-1 font-['Lato'] text-[13px] font-semibold text-[#B8944A] hover:text-[#D4B97A] transition-colors"
            aria-label={`Czytaj wiecej: ${post.title}`}
          >
            Czytaj
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center min-h-[380px] md:min-h-[440px] overflow-hidden"
      aria-label="Naglowek bloga"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 100%)',
        }}
        aria-hidden="true"
      />
      <ScrollReveal animation="fade" delay={200} className="relative z-10 flex flex-col items-center text-center px-6 py-16 max-w-[780px] mx-auto gap-5">
        <EditableText
          section="blog"
          fieldPath="hero.title"
          as="h1"
          className="font-['Playfair_Display'] text-[2rem] md:text-[44px] font-bold italic text-white leading-[1.2]"
          placeholder="Refleksje, narzedzia, inspiracje"
        />
        <EditableText
          section="blog"
          fieldPath="hero.subtitle"
          as="p"
          className="font-['Lato'] text-[16px] text-white/80 leading-[1.7] max-w-[580px]"
          placeholder="Artykuly o psychologii, coachingu i osobistym rozwoju pisane z mysla o Tobie."
        />
      </ScrollReveal>
    </section>
  );
}

function FeaturedPostSection() {
  return (
    <section className="bg-white py-14 md:py-20" aria-label="Wyrozniony artykul">
      <div className="max-w-[1100px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
        <div className="flex flex-col md:flex-row gap-0 rounded-lg overflow-hidden border border-[#E8E4DF] shadow-sm">
          {/* Image */}
          <div className="md:w-[45%] relative overflow-hidden min-h-[280px]">
            <img
              src={FEATURED_POST.imageUrl}
              alt={FEATURED_POST.title}
              className="w-full h-full object-cover absolute inset-0"
            />
          </div>
          {/* Content */}
          <div className="md:w-[55%] flex flex-col justify-center gap-5 p-8 md:p-12 bg-[#FAF8F5]">
            <span className="inline-block self-start font-['Lato'] text-[11px] font-bold tracking-[0.1em] uppercase text-white bg-[#B8944A] rounded-full px-4 py-1.5">
              <EditableText
                section="blog"
                fieldPath="featured.badge"
                as="span"
                placeholder="Najnowszy wpis"
              />
            </span>
            <EditableText
              section="blog"
              fieldPath="featured.title"
              as="h2"
              className="font-['Playfair_Display'] text-[24px] md:text-[28px] font-bold text-[#2D2D2D] leading-snug"
              placeholder={FEATURED_POST.title}
            />
            <EditableText
              section="blog"
              fieldPath="featured.excerpt"
              as="p"
              className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7]"
              placeholder={FEATURED_POST.excerpt}
            />
            <div className="flex items-center gap-2">
              <span className="font-['Lato'] text-[13px] text-[#8A8A8A] flex items-center gap-1.5">
                <Calendar size={13} aria-hidden="true" />
                {FEATURED_POST.date}
              </span>
            </div>
            <Link
              to={FEATURED_POST.slug}
              className="inline-flex items-center gap-2 self-start font-['Lato'] text-[14px] font-semibold text-[#B8944A] hover:text-[#D4B97A] transition-colors group"
            >
              <EditableText
                section="blog"
                fieldPath="featured.cta"
                as="span"
                placeholder="Czytaj wiecej"
              />
              <ArrowRight
                size={15}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function ArticleGridSection() {
  return (
    <section className="bg-[#FAF8F5] py-14 md:py-20" aria-label="Artykuly i refleksje">
      <div className="max-w-[1100px] mx-auto px-6">
        <ScrollReveal animation="fade-up">
          <div className="flex flex-col items-center text-center gap-3 mb-12">
            <span className="inline-block font-['Lato'] text-[11px] font-semibold tracking-[0.1em] uppercase text-[#B8944A] bg-[#B8944A]/[0.1] rounded-full px-4 py-1.5">
              Artykuly
            </span>
            <EditableText
              section="blog"
              fieldPath="grid.title"
              as="h2"
              className="font-['Playfair_Display'] text-[28px] md:text-[36px] font-bold text-[#2D2D2D]"
              placeholder="Artykuly i refleksje"
            />
            <div className="w-10 h-0.5 bg-[#B8944A] mt-1" aria-hidden="true" />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post, i) => (
            <ScrollReveal key={post.id} animation="fade-up" delay={stagger(i)}>
              <BlogCard post={post} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    // Newsletter subscription — wired to API in future iteration
    setSubmitted(true);
  }

  return (
    <section className="bg-white py-14 md:py-20" aria-label="Zapis do newslettera">
      <ScrollReveal animation="fade-up">
      <div className="max-w-[680px] mx-auto px-6 flex flex-col items-center text-center gap-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#B8944A]/[0.1] text-[#B8944A]">
          <Mail size={24} aria-hidden="true" />
        </div>
        <EditableText
          section="blog"
          fieldPath="newsletter.title"
          as="h2"
          className="font-['Playfair_Display'] text-[26px] md:text-[32px] font-bold text-[#2D2D2D]"
          placeholder="Refleksje prosto do Twojej skrzynki"
        />
        <EditableText
          section="blog"
          fieldPath="newsletter.description"
          as="p"
          className="font-['Lato'] text-[15px] text-[#6B6B6B] leading-[1.7]"
          placeholder="Co tydzien nowy artykul, praktyczne narzedzia i refleksje, ktore wspieraja Twoja droge. Bez spamu, tylko tresc z glebią."
        />

        {submitted ? (
          <div className="w-full max-w-[480px] rounded-lg bg-[#B8944A]/[0.1] border border-[#B8944A]/30 px-6 py-4">
            <p className="font-['Lato'] text-[15px] font-semibold text-[#B8944A]">
              Dziekujemy za zapis! Sprawdz swoja skrzynke.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 w-full max-w-[480px]"
            noValidate
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Adres e-mail
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Twoj adres e-mail"
              required
              className="flex-1 font-['Lato'] text-[14px] text-[#2D2D2D] placeholder:text-[#8A8A8A] bg-[#FAF8F5] border border-[#E8E4DF] rounded-lg px-4 py-3 outline-none focus:border-[#B8944A] focus:ring-2 focus:ring-[#B8944A]/20 transition"
            />
            <button
              type="submit"
              className="font-['Lato'] text-[14px] font-semibold text-white bg-[#B8944A] hover:bg-[#D4B97A] rounded-lg px-6 py-3 transition-colors whitespace-nowrap"
            >
              Zapisz sie
            </button>
          </form>
        )}
      </div>
      </ScrollReveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Blog() {
  return (
    <main>
      <HeroSection />
      <FeaturedPostSection />
      <ArticleGridSection />
      <NewsletterSection />
    </main>
  );
}
