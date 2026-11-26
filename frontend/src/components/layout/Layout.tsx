import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CMSEditToolbar } from '@/components/cms/CMSEditToolbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { featureFlags } from '@/config/features';

interface LayoutProps {
  children: ReactNode;
}

/** Pages with dark hero background (image + overlay) — navbar text is white. */
const DARK_HERO_PAGES = new Set([
  // '/' is dark only with the classic Home — see LIGHT_HERO_PAGES below
  ...(featureFlags.classicHome ? ['/'] : []),
  '/mama-nastolatka',
  '/matka-zona-kochanka',
  ...(featureFlags.classicAbout ? ['/o-mnie'] : []),
  '/jak-pracuje',
  '/uslugi',
  '/blog',
  ...(featureFlags.classicContact ? ['/kontakt'] : []),
  '/tworzenie-stron',
  '/wideo',
]);

/**
 * Pages with a light, full-bleed hero (pastel photo + white wash) — navbar is
 * transparent over the hero with dark text, and the page starts under it.
 */
const LIGHT_HERO_PAGES = new Set([
  ...(featureFlags.classicHome ? [] : ['/']),
  ...(featureFlags.classicContact ? [] : ['/kontakt']),
]);

export function Layout({ children }: LayoutProps) {
  useSmoothScroll();
  const { pathname } = useLocation();
  const hasDarkHero = DARK_HERO_PAGES.has(pathname);
  const hasHero = hasDarkHero || LIGHT_HERO_PAGES.has(pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent={hasHero} darkHero={hasDarkHero} />
      <main className={hasHero ? 'flex-1' : 'flex-1 pt-[72px]'}>
        {children}
      </main>
      <Footer />
      <CMSEditToolbar />
      <AuthModal />
    </div>
  );
}

export default Layout;
