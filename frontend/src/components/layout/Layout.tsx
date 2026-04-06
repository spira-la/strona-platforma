import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { CMSEditToolbar } from '@/components/cms/CMSEditToolbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

interface LayoutProps {
  children: ReactNode;
}

/** Pages with dark hero background (image + overlay) — navbar text is white. */
const DARK_HERO_PAGES = ['/', '/o-mnie', '/jak-pracuje', '/uslugi', '/blog', '/kontakt'];
/** Pages with light hero background (cream/white) — navbar text stays dark but bg transparent. */
const LIGHT_HERO_PAGES: string[] = [];

export function Layout({ children }: LayoutProps) {
  useSmoothScroll();
  const { pathname } = useLocation();
  const hasDarkHero = DARK_HERO_PAGES.includes(pathname);
  const hasLightHero = LIGHT_HERO_PAGES.includes(pathname);
  const hasHero = hasDarkHero || hasLightHero;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar transparent={hasHero} darkHero={hasDarkHero} />
      <main className={hasHero ? 'flex-1' : 'flex-1 pt-[72px]'}>{children}</main>
      <Footer />
      <CMSEditToolbar />
      <AuthModal />
    </div>
  );
}

export default Layout;
