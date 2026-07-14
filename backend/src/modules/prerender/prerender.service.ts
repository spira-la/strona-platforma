/**
 * PrerenderService
 *
 * Returns complete semantic HTML documents for public pages.
 * Consumed by PrerenderController which is served to SEO crawlers
 * (Googlebot, bingbot, etc.) via nginx routing.
 *
 * The HTML is intentionally lightweight — its purpose is to give crawlers
 * indexable content, not to replicate the full React UI.
 */
import { Injectable } from '@nestjs/common';
import { escapeHtml } from '../../common/utils/og-html.util.js';
import { CmsService } from '../cms/cms.service.js';

const SITE_URL = 'https://spira-la.com';
const SITE_NAME = 'Spirala';
const OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const CURRENT_YEAR = new Date().getFullYear();

interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  /** Path relative to site root, e.g. "/" or "/o-mnie" */
  path: string;
  jsonLd: string;
  bodyContent: string;
  /** og:image / twitter:image — defaults to the site logo if omitted. */
  image?: string;
}

@Injectable()
export class PrerenderService {
  constructor(private readonly cms: CmsService) {}

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Crops Unsplash-hosted fallback images to a clean 1200x630 for link
   * previews (the on-page hero uses a different crop via CSS background
   * positioning, so we request our own here). CMS-uploaded images (R2) are
   * returned as-is — the admin is expected to upload something reasonable.
   */
  private toOgCrop(url: string): string {
    try {
      const u = new URL(url);
      if (u.hostname !== 'images.unsplash.com') return url;
      u.searchParams.set('w', '1200');
      u.searchParams.set('h', '630');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('q', '80');
      return u.toString();
    } catch {
      return url;
    }
  }

  /**
   * Resolves the real hero image for a page: whatever the admin uploaded
   * via the CMS for `section.heroBg`, or the page's hardcoded Unsplash
   * fallback if nothing was ever uploaded. This is what makes link
   * previews show the actual page photo instead of the site logo.
   */
  private async resolveHeroImage(
    section: string,
    fallback: string,
  ): Promise<string> {
    const cmsValue = await this.cms.getFieldValue(section, 'heroBg');
    return this.toOgCrop(cmsValue || fallback);
  }

  private buildHtml(meta: PageMeta): string {
    const safeTitle = escapeHtml(meta.title);
    const safeDescription = escapeHtml(meta.description);
    const safeCanonical = escapeHtml(meta.canonical);
    const safeImage = escapeHtml(meta.image || OG_IMAGE);
    const enUrl = escapeHtml(
      `${SITE_URL}/en${meta.path === '/' ? '' : meta.path}`,
    );
    const esUrl = escapeHtml(
      `${SITE_URL}/es${meta.path === '/' ? '' : meta.path}`,
    );

    return `<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${safeCanonical}" />

  <!-- hreflang -->
  <link rel="alternate" hreflang="pl" href="${safeCanonical}" />
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="es" href="${esUrl}" />
  <link rel="alternate" hreflang="x-default" href="${safeCanonical}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="pl_PL" />
  <meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${safeImage}" />

  <!-- Structured Data -->
  <script type="application/ld+json">${meta.jsonLd}</script>
</head>
<body>
  <header>
    <nav>
      <a href="${escapeHtml(SITE_URL)}/">Strona g&#322;&#243;wna</a> |
      <a href="${escapeHtml(SITE_URL)}/o-mnie">O mnie</a> |
      <a href="${escapeHtml(SITE_URL)}/jak-pracuje">Jak pracuj&#281;</a> |
      <a href="${escapeHtml(SITE_URL)}/uslugi">Us&#322;ugi</a> |
      <a href="${escapeHtml(SITE_URL)}/blog">Blog</a> |
      <a href="${escapeHtml(SITE_URL)}/kontakt">Kontakt</a>
    </nav>
  </header>
  <main>
    ${meta.bodyContent}
  </main>
  <footer>
    <p>&#169; ${CURRENT_YEAR} ${escapeHtml(SITE_NAME)} &#8212; Coaching mindsetu i wellbeing online. Wszystkie prawa zastrze&#380;one.</p>
    <p>
      <a href="${escapeHtml(SITE_URL)}/polityka-prywatnosci">Polityka prywatno&#347;ci</a> |
      <a href="${escapeHtml(SITE_URL)}/regulamin">Regulamin</a>
    </p>
  </footer>
  <noscript>
    <p>Ta strona wymaga JavaScript. Aby skontaktowa&#263; si&#281; bezpo&#347;rednio, napisz na:
      <a href="mailto:kontakt@spira-la.com">kontakt@spira-la.com</a>
    </p>
  </noscript>
</body>
</html>`;
  }

  // ---------------------------------------------------------------------------
  // Public page renderers
  // ---------------------------------------------------------------------------

  async renderHome(): Promise<string> {
    const image = await this.resolveHeroImage(
      'hero',
      'https://images.unsplash.com/photo-1744192876531-f00759ed9c57?q=80&w=2070&auto=format&fit=crop',
    );
    const jsonLd = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': ['ProfessionalService', 'HealthAndBeautyBusiness'],
        name: 'Spirala',
        description:
          'Profesjonalny coaching mindsetu i wellbeing online. Sesje indywidualne i pakiety z certyfikowaną coach Anetą.',
        url: SITE_URL,
        image: OG_IMAGE,
        priceRange: '$$',
        serviceType: [
          'Mindset Coaching',
          'Wellbeing Coaching',
          'Coaching Online',
        ],
        areaServed: { '@type': 'Country', name: 'PL' },
        availableLanguage: ['pl', 'en', 'es'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Aneta',
        jobTitle: 'Mindset & Wellbeing Coach',
        url: SITE_URL,
        image: OG_IMAGE,
        worksFor: { '@type': 'Organization', name: 'Spirala', url: SITE_URL },
        knowsAbout: [
          'coaching',
          'mindset',
          'wellbeing',
          'rozwój osobisty',
          'uważność',
        ],
      },
    ]);

    const bodyContent = `
    <h1>Odkryj swoją wewnętrzną siłę i rozpocznij drogę ku zmianie</h1>
    <p>
      Coaching mindsetu i wellbeing z Anetą to przestrzeń do odkrycia własnych zasobów,
      odbudowania energii i znalezienia jasnego kierunku życia. Pracuję online
      — indywidualnie, w Twoim własnym tempie.
    </p>
    <h2>Czym mogę Ci pomóc?</h2>
    <ul>
      <li>Sesja Indywidualna — jednorazowe spotkanie coachingowe online</li>
      <li>Pakiet Sesji — ciąg spotkania dla głębszej, trwałej zmiany</li>
      <li>Coaching Online — elastyczna współpraca dostosowana do Twojego rytmu</li>
    </ul>
    <p><a href="${escapeHtml(SITE_URL)}/kontakt">Zarezerwuj sesję</a></p>`;

    return this.buildHtml({
      title: 'Spirala — Mindset &amp; Wellbeing Coaching Online',
      description:
        'Coaching mindsetu i wellbeing online z Anetą — odkryj wewnętrzną siłę, odzyskaj energię i kierunek w życiu. Sesje indywidualne i pakiety. Zarezerwuj bezpłatną rozmowę wstępną.',
      canonical: `${SITE_URL}/`,
      path: '/',
      jsonLd,
      bodyContent,
      image,
    });
  }

  async renderAbout(): Promise<string> {
    const image = await this.resolveHeroImage(
      'about',
      'https://images.unsplash.com/photo-1669493032929-791a77069ee4?q=80&w=1920&auto=format&fit=crop',
    );
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Aneta',
      jobTitle: 'Mindset & Wellbeing Coach',
      url: `${SITE_URL}/o-mnie`,
      image: OG_IMAGE,
      worksFor: { '@type': 'Organization', name: 'Spirala', url: SITE_URL },
      knowsAbout: ['coaching', 'mindset', 'wellbeing', 'rozwój osobisty'],
    });

    const bodyContent = `
    <h1>O mnie — Aneta</h1>
    <p>
      Jestem coachą mindsetu i wellbeing. Pomagam osobom w przełomowych momentach życia
      odnaleźć klarowność, odzyskać energię i obrać własny kierunek. Wierzę,
      że każdy z nas ma w sobie siłę do zmiany — czasem potrzebujemy tylko komuś,
      kto pomóże ją odkryć.
    </p>
    <p>
      Moje podejście opiera się na uważności, szacunku do Twojego tempa oraz
      sprawdzonych metodach pracy z przekonaniami i zasobami wewnętrznymi.
      Sesje prowadzę włącznie online, co daje Ci pełną elastyczność.
    </p>`;

    return this.buildHtml({
      title: 'O mnie — Aneta | Spirala Coaching',
      description:
        'Poznaj Anetę — coach mindsetu i wellbeing online. Pomagam osobom w przełomowych momentach odnaleźć klarowność, energię i kierunek. Moja historia i podejście do coachingu.',
      canonical: `${SITE_URL}/o-mnie`,
      path: '/o-mnie',
      jsonLd,
      bodyContent,
      image,
    });
  }

  async renderServices(): Promise<string> {
    const image = await this.resolveHeroImage(
      'services',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1400&q=80',
    );
    const jsonLd = JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Sesja Indywidualna',
        description: 'Jednorazowe spotkanie coachingowe online z Anetą.',
        provider: { '@type': 'Person', name: 'Aneta' },
        serviceType: 'Mindset Coaching',
        areaServed: { '@type': 'Country', name: 'PL' },
        url: `${SITE_URL}/uslugi`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Pakiet Sesji',
        description:
          'Cykl spotkań coachingowych online dla głębszej, trwałej zmiany.',
        provider: { '@type': 'Person', name: 'Aneta' },
        serviceType: 'Wellbeing Coaching',
        areaServed: { '@type': 'Country', name: 'PL' },
        url: `${SITE_URL}/uslugi`,
      },
    ]);

    const bodyContent = `
    <h1>Usługi coachingowe</h1>
    <p>Wybierz formę współpracy, która najlepiej odpowiada Twoim potrzebom.</p>
    <h2>Sesja Indywidualna</h2>
    <p>
      Jednorazowe spotkanie coachingowe online. Idealne, jeśli chcesz przepracować
      konkretną kwestię, podjąć decyzję lub po prostu sprawdzić, jak wygląda
      współpraca ze mną.
    </p>
    <h2>Pakiet Sesji</h2>
    <p>
      Cykl spotkań coachingowych online. Dla osób, które chcą przeprowadzić głębszą
      zmianę — w myśleniu, nawykach lub kierunku życia.
    </p>
    <h2>Coaching Online</h2>
    <p>
      Elastyczna współpraca dostosowana do Twojego rytmu życia i celów.
      Wszystkie sesje odbywają się online, co daje Ci swobodę miejsca i czasu.
    </p>
    <p><a href="${escapeHtml(SITE_URL)}/kontakt">Zarezerwuj bezpłatną rozmowę wstępną</a></p>`;

    return this.buildHtml({
      title: 'Usługi coachingowe — Sesje i Pakiety Online | Spirala',
      description:
        'Sesje coachingowe i pakiety online z Anetą — coaching mindsetu, wellbeing i rozwój osobisty. Sprawdź ofertę i wybierz formę współpracy odpowiednią dla Ciebie.',
      canonical: `${SITE_URL}/uslugi`,
      path: '/uslugi',
      jsonLd,
      bodyContent,
      image,
    });
  }

  async renderHowIWork(): Promise<string> {
    const image = await this.resolveHeroImage(
      'howIWork',
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1400&q=80',
    );
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Jak pracuję — Spirala Coaching',
      description:
        'Jak przebiega coaching z Anetą? Poznaj moje podejście — od pierwszej rozmowy do trwałej zmiany.',
      url: `${SITE_URL}/jak-pracuje`,
      isPartOf: { '@type': 'WebSite', name: 'Spirala', url: SITE_URL },
    });

    const bodyContent = `
    <h1>Jak pracuję</h1>
    <p>
      Coaching z Anetą zaczyna się od bezpłatnej rozmowy wstępnej, podczas której
      poznajemy się i sprawdzamy, czy współpraca ma sens. Bez zobowiązań,
      bez presji.
    </p>
    <p>
      Każda sesja to przestrzeń na Twoje pytania, refleksje i odkrycia. Pracujemy
      w oparciu o Twoje zasoby i cele — nie wedle gotowego skryptu.
    </p>
    <p>
      Po serii spotkań widzisz konkretne zmiany: większą jasność myślenia,
      lepsze decyzje i odbudowaną energię do działania.
    </p>
    <p>Moje podejście opiera się na uważności, sile wewnętrznej i sprawdzonych metodach.</p>
    <p><a href="${escapeHtml(SITE_URL)}/kontakt">Umów bezpłatną rozmowę wstępną</a></p>`;

    return this.buildHtml({
      title: 'Jak pracuję — Moje podejście do coachingu | Spirala',
      description:
        'Jak przebiega coaching z Anetą? Poznaj moje podejście — od pierwszej rozmowy do trwałej zmiany. Praca oparta na uważności, sile wewnętrznej i sprawdzonych metodach.',
      canonical: `${SITE_URL}/jak-pracuje`,
      path: '/jak-pracuje',
      jsonLd,
      bodyContent,
      image,
    });
  }

  renderContact(): string {
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Kontakt — Spirala Coaching',
      url: `${SITE_URL}/kontakt`,
      isPartOf: { '@type': 'WebSite', name: 'Spirala', url: SITE_URL },
    });

    const bodyContent = `
    <h1>Kontakt</h1>
    <p>
      Chcesz porozmawiać o coachingu lub masz pytania co do oferty?
      Zarezerwuj bezpłatną rozmowę wstępną — bez zobowiązań, po prostu się poznajmy.
    </p>
    <p>
      Piszesz wolisz e-mail? Odezwij się na:
      <a href="mailto:kontakt@spira-la.com">kontakt@spira-la.com</a>
    </p>`;

    return this.buildHtml({
      title: 'Kontakt — Zarezerwuj Sesję | Spirala Coaching',
      description:
        'Skontaktuj się z Anetą — coach mindsetu i wellbeing. Zarezerwuj bezpłatną rozmowę wstępną lub napisz wiadomość. Sesje coachingowe online.',
      canonical: `${SITE_URL}/kontakt`,
      path: '/kontakt',
      jsonLd,
      bodyContent,
    });
  }

  async renderBlog(): Promise<string> {
    const image = await this.resolveHeroImage(
      'blog',
      'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2070&auto=format&fit=crop',
    );
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Blog o Mindsetcie i Wellbeing — Spirala',
      description:
        'Artykuły o mindsetcie, wellbeing i rozwoju osobistym autorstwa Anety.',
      url: `${SITE_URL}/blog`,
      author: { '@type': 'Person', name: 'Aneta' },
      isPartOf: { '@type': 'WebSite', name: 'Spirala', url: SITE_URL },
    });

    const bodyContent = `
    <h1>Blog o mindsetcie i wellbeing</h1>
    <p>
      Inspiracje, refleksje i praktyczne wskazówki na temat mindsetu, wellbeing
      i rozwoju osobistego. Piszę o tym, co naprawdę działa — z perspektywy
      praktyki coachingowej i własnych doświadczeń.
    </p>
    <p><a href="${escapeHtml(SITE_URL)}/blog">Czytaj artykuły</a></p>`;

    return this.buildHtml({
      title: 'Blog o Mindsetcie i Wellbeing | Spirala',
      description:
        'Artykuły o mindsetcie, wellbeing i rozwoju osobistym. Inspiracje, refleksje i praktyczne wskazówki Anety — coach online pomagającej odnaleźć wewnętrzną siłę.',
      canonical: `${SITE_URL}/blog`,
      path: '/blog',
      jsonLd,
      bodyContent,
      image,
    });
  }

  async renderMamaNastolatka(): Promise<string> {
    const image = await this.resolveHeroImage(
      'mamyNastolatkow',
      'https://images.unsplash.com/photo-1747600569107-faf7e569faf8?w=1400&q=80',
    );
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Mama nastolatka — Spirala Coaching',
      description:
        'Coaching dla mam nastolatków — odbuduj relację z dzieckiem, zanim oddalicie się na dobre.',
      url: `${SITE_URL}/mama-nastolatka`,
      isPartOf: { '@type': 'WebSite', name: 'Spirala', url: SITE_URL },
    });

    const bodyContent = `
    <h1>Twój nastolatek stał się obcą osobą we własnym domu?</h1>
    <p>Pomogę Ci odbudować relację, zanim oddalicie się na dobre.</p>
    <p>
      Coaching dla mam nastolatków — przestrzeń, w której zrozumiesz, co się
      dzieje w waszej relacji, i znajdziesz sposób na powrót do bliskości.
    </p>
    <p><a href="${escapeHtml(SITE_URL)}/kontakt">Zarezerwuj bezpłatną rozmowę wstępną</a></p>`;

    return this.buildHtml({
      title: 'Mama nastolatka — Spirala',
      description:
        'Twój nastolatek stał się obcą osobą we własnym domu? Pomogę Ci odbudować relację, zanim oddalicie się na dobre. Coaching dla mam nastolatków – Aneta Spirala.',
      canonical: `${SITE_URL}/mama-nastolatka`,
      path: '/mama-nastolatka',
      jsonLd,
      bodyContent,
      image,
    });
  }

  async renderKochanka(): Promise<string> {
    const image = await this.resolveHeroImage(
      'kochanka',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=80',
    );
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Dlaczego przyciągasz żonatych mężczyzn? — Spirala Coaching',
      description:
        'Pięciotygodniowy proces transformacji dla kobiet, które chcą porzucić rolę kochanki i wybrać relację opartą na szacunku i prawdzie.',
      url: `${SITE_URL}/matka-zona-kochanka`,
      isPartOf: { '@type': 'WebSite', name: 'Spirala', url: SITE_URL },
    });

    const bodyContent = `
    <h1>Dlaczego przyciągasz żonatych mężczyzn?</h1>
    <p>
      Pięciotygodniowy proces transformacji dla kobiet, które chcą porzucić
      rolę kochanki i wybrać relację opartą na szacunku i prawdzie.
    </p>
    <p><a href="${escapeHtml(SITE_URL)}/kontakt">Zarezerwuj bezpłatną rozmowę wstępną</a></p>`;

    return this.buildHtml({
      title: 'Dlaczego przyciągasz żonatych mężczyzn? — Spirala',
      description:
        'Pięciotygodniowy proces transformacji dla kobiet, które chcą porzucić rolę kochanki i wybrać relację opartą na szacunku i prawdzie. Sesje z Anetą, Spirala.',
      canonical: `${SITE_URL}/matka-zona-kochanka`,
      path: '/matka-zona-kochanka',
      jsonLd,
      bodyContent,
      image,
    });
  }

  async renderWebDesignOffer(): Promise<string> {
    const image = await this.resolveHeroImage(
      'webDesign',
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop',
    );
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Tworzenie stron internetowych',
      description:
        'Eleganckie, wydajne strony z panelem CMS dla coachów, terapeutów i specjalistów.',
      provider: { '@type': 'Person', name: 'Aneta' },
      url: `${SITE_URL}/tworzenie-stron`,
    });

    const bodyContent = `
    <h1>Strona, która opowiada Twoją historię</h1>
    <p>
      Projektuję i wdrażam elegancki, wydajny serwis dla coachów, terapeutów
      i specjalistów — z panelem CMS, wielojęzycznością i pełnym wsparciem
      technicznym.
    </p>
    <p><a href="${escapeHtml(SITE_URL)}/kontakt">Zapytaj o wycenę</a></p>`;

    return this.buildHtml({
      title: 'Tworzenie stron internetowych — Spirala',
      description:
        'Eleganckie, wydajne strony z panelem CMS dla coachów, terapeutów i specjalistów. Projekt, wdrożenie i wsparcie techniczne w jednej cenie.',
      canonical: `${SITE_URL}/tworzenie-stron`,
      path: '/tworzenie-stron',
      jsonLd,
      bodyContent,
      image,
    });
  }
}
