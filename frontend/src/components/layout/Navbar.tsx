import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  X,
  Globe,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { EditableText } from '@/components/cms/EditableText';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useAuthStore } from '@/stores/auth.store';
import spiralaIcon from '@/assets/spirala-icon.png';

interface NavLink {
  href: string;
  labelKey: string;
  fieldPath: string;
  editable: string;
}

const NAV_LINKS: NavLink[] = [
  {
    href: '/o-mnie',
    labelKey: 'common.about',
    fieldPath: 'link1',
    editable: 'O Mnie',
  },
  {
    href: '/jak-pracuje',
    labelKey: 'common.howIWork',
    fieldPath: 'link2',
    editable: 'Jak Pracuję',
  },
  {
    href: '/uslugi',
    labelKey: 'common.services',
    fieldPath: 'link3',
    editable: 'Usługi',
  },
  {
    href: '/blog',
    labelKey: 'common.blog',
    fieldPath: 'link4',
    editable: 'Blog',
  },
];

const LANGUAGES = [
  { code: 'pl', label: 'PL' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

interface NavbarProps {
  transparent?: boolean;
  /** When true, navbar text is white over dark hero images. When false + transparent, text stays dark. */
  darkHero?: boolean;
}

export function Navbar({ transparent = false, darkHero = false }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const { isAdmin, isCoach } = useRoles();
  const { openLogin } = useAuthStore();

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close drawer on route change — calling setState here is intentional:
  // we are synchronising UI overlay state with the router (an external system).

  useEffect(() => {
    setDrawerOpen(false);
    setLangOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!langOpen && !userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        langOpen &&
        langRef.current &&
        !langRef.current.contains(e.target as Node)
      ) {
        setLangOpen(false);
      }
      if (
        userMenuOpen &&
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen, userMenuOpen]);

  const userInitial =
    user?.user_metadata?.full_name?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    'U';
  const userName = user?.user_metadata?.full_name ?? user?.email ?? '';

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
  };

  const isActive = (href: string) => location.pathname === href;
  const isTransparentMode = transparent && !scrolled;
  const useWhiteText = isTransparentMode && darkHero;

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleLangChange = (code: string) => {
    void i18n.changeLanguage(code);
    setLangOpen(false);
  };

  return (
    <>
      {/* Main navbar */}
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          transparent && !scrolled
            ? 'bg-transparent'
            : scrolled
              ? 'bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.08)]'
              : 'bg-white border-b border-[#F0EDE8]',
        ].join(' ')}
        role="banner"
      >
        <nav
          className="mx-auto flex items-center justify-between px-4 md:px-[80px] h-[72px]"
          aria-label="Nawigacja główna"
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded"
            aria-label="Spirala — strona główna"
          >
            <img
              src={spiralaIcon}
              alt=""
              className="h-9 w-auto"
              aria-hidden="true"
            />
            <span
              className={`font-['Cormorant_Garamond'] text-[22px] font-bold tracking-[-0.5px] ${useWhiteText ? 'text-white hover:text-white/80' : 'text-[#B8944A] hover:text-[#8A6F2E]'}`}
            >
              Spirala
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-8" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={[
                    "font-['Lato'] text-[14px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded",
                    useWhiteText
                      ? isActive(link.href)
                        ? 'text-white font-medium'
                        : 'text-white/70 hover:text-white'
                      : isActive(link.href)
                        ? 'text-[#B8944A] font-medium'
                        : 'text-[#8A8A8A] hover:text-[#2D2D2D]',
                  ].join(' ')}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  <EditableText section="navbar" fieldPath={link.fieldPath}>
                    {t(link.labelKey)}
                  </EditableText>
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop right side: language switcher + CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className={`flex items-center gap-1 font-['Lato'] text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded px-1 ${useWhiteText ? 'text-white/70 hover:text-white' : 'text-[#8A8A8A] hover:text-[#2D2D2D]'}`}
                aria-haspopup="listbox"
                aria-expanded={langOpen}
                aria-label="Zmień język"
              >
                <Globe size={14} aria-hidden="true" />
                <span>{currentLang.label}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {langOpen && (
                <ul
                  role="listbox"
                  aria-label="Wybierz język"
                  className="absolute right-0 top-full mt-2 w-[72px] bg-white border border-[#F0EDE8] rounded-lg shadow-lg py-1 z-10"
                >
                  {LANGUAGES.map((lang) => (
                    <li
                      key={lang.code}
                      role="option"
                      aria-selected={lang.code === i18n.language}
                    >
                      <button
                        type="button"
                        onClick={() => handleLangChange(lang.code)}
                        className={[
                          "w-full text-left px-3 py-1.5 font-['Lato'] text-[13px] transition-colors duration-150 hover:bg-[#FAF8F5]",
                          lang.code === i18n.language
                            ? 'text-[#B8944A] font-medium'
                            : 'text-[#6B6B6B]',
                        ].join(' ')}
                      >
                        {lang.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Auth / CTA */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded-full"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Menu użytkownika"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-['Lato'] text-[13px] font-bold ${useWhiteText ? 'bg-white/20 text-white' : 'bg-[#B8944A]/15 text-[#B8944A]'}`}
                  >
                    {userInitial}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''} ${useWhiteText ? 'text-white/70' : 'text-[#8A8A8A]'}`}
                    aria-hidden="true"
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-[200px] bg-white border border-[#F0EDE8] rounded-lg shadow-lg py-2 z-10"
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-[#F0EDE8]">
                      <p className="font-['Lato'] text-[13px] font-medium text-[#2D2D2D] truncate">
                        {userName}
                      </p>
                      <p className="font-['Lato'] text-[11px] text-[#8A8A8A] truncate">
                        {user?.email}
                      </p>
                    </div>
                    {isCoach && (
                      <Link
                        to="/coach"
                        className="w-full flex items-center gap-2 px-3 py-2 font-['Lato'] text-[13px] text-[#B8944A] hover:bg-[#FAF8F5] hover:text-[#8A6F2E] transition-colors"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={14} aria-hidden="true" />
                        <EditableText section="navbar" fieldPath="coachPanel">
                          Panel coach
                        </EditableText>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="w-full flex items-center gap-2 px-3 py-2 font-['Lato'] text-[13px] text-[#B8944A] hover:bg-[#FAF8F5] hover:text-[#8A6F2E] transition-colors"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={14} aria-hidden="true" />
                        <EditableText section="navbar" fieldPath="adminPanel">
                          Panel admin
                        </EditableText>
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 font-['Lato'] text-[13px] text-[#6B6B6B] hover:bg-[#FAF8F5] hover:text-[#2D2D2D] transition-colors"
                      role="menuitem"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      <EditableText section="navbar" fieldPath="logout">
                        Wyloguj się
                      </EditableText>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={openLogin}
                className="font-['Lato'] text-[13px] font-medium text-white bg-[#B8944A] hover:bg-[#8A6F2E] active:bg-[#7A6028] transition-colors duration-200 rounded-full px-6 py-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
              >
                <User
                  size={14}
                  className="inline mr-1.5 -mt-0.5"
                  aria-hidden="true"
                />
                <EditableText section="navbar" fieldPath="login">
                  Zaloguj się
                </EditableText>
              </button>
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            type="button"
            className={`md:hidden flex items-center justify-center w-10 h-10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded ${useWhiteText ? 'text-white hover:text-white/80' : 'text-[#2D2D2D] hover:text-[#B8944A]'}`}
            onClick={() => setDrawerOpen((v) => !v)}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            aria-label={drawerOpen ? 'Zamknij menu' : 'Otwórz menu'}
          >
            {drawerOpen ? (
              <X size={22} aria-hidden="true" />
            ) : (
              <Menu size={22} aria-hidden="true" />
            )}
          </button>
        </nav>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-label="Menu nawigacyjne"
        aria-modal="true"
        className={[
          'fixed top-[72px] left-0 right-0 z-40 bg-white border-b border-[#F0EDE8] shadow-lg md:hidden',
          'transition-all duration-300 ease-in-out overflow-hidden',
          drawerOpen
            ? 'max-h-[500px] opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <ul className="flex flex-col px-4 pt-4 pb-6 gap-1" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                to={link.href}
                className={[
                  "block py-3 px-2 font-['Lato'] text-[15px] border-b border-[#F0EDE8] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] rounded",
                  isActive(link.href)
                    ? 'text-[#B8944A] font-medium'
                    : 'text-[#2D2D2D] hover:text-[#B8944A]',
                ].join(' ')}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                <EditableText section="navbar" fieldPath={link.fieldPath}>
                  {t(link.labelKey)}
                </EditableText>
              </Link>
            </li>
          ))}

          {/* Language row */}
          <li className="flex items-center gap-2 pt-4 pb-2 px-2">
            <Globe size={14} className="text-[#8A8A8A]" aria-hidden="true" />
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLangChange(lang.code)}
                className={[
                  "font-['Lato'] text-[13px] px-2 py-1 rounded transition-colors duration-150",
                  lang.code === i18n.language
                    ? 'text-[#B8944A] font-semibold'
                    : 'text-[#8A8A8A] hover:text-[#2D2D2D]',
                ].join(' ')}
                aria-pressed={lang.code === i18n.language}
              >
                {lang.label}
              </button>
            ))}
          </li>

          {/* Mobile Auth / CTA */}
          <li className="pt-2">
            {isAuthenticated ? (
              <div className="flex flex-col gap-2 px-2 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-[#B8944A]/15 text-[#B8944A] flex items-center justify-center font-['Lato'] text-[13px] font-bold">
                      {userInitial}
                    </span>
                    <span className="font-['Lato'] text-[14px] text-[#2D2D2D] truncate max-w-[180px]">
                      {userName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1 font-['Lato'] text-[13px] text-[#8A8A8A] hover:text-[#2D2D2D] transition-colors"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    <EditableText section="navbar" fieldPath="logoutShort">
                      Wyloguj
                    </EditableText>
                  </button>
                </div>
                {isCoach && (
                  <Link
                    to="/coach"
                    className="flex items-center gap-2 font-['Lato'] text-[13px] font-semibold text-[#B8944A] hover:text-[#8A6F2E] transition-colors px-1 py-1"
                  >
                    <LayoutDashboard size={14} aria-hidden="true" />
                    <EditableText section="navbar" fieldPath="coachPanel">
                      Panel coach
                    </EditableText>
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 font-['Lato'] text-[13px] font-semibold text-[#B8944A] hover:text-[#8A6F2E] transition-colors px-1 py-1"
                  >
                    <LayoutDashboard size={14} aria-hidden="true" />
                    <EditableText section="navbar" fieldPath="adminPanel">
                      Panel admin
                    </EditableText>
                  </Link>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  openLogin();
                }}
                className="flex items-center justify-center w-full font-['Lato'] text-[14px] font-medium text-white bg-[#B8944A] hover:bg-[#8A6F2E] transition-colors duration-200 rounded-full px-6 py-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] focus-visible:ring-offset-2"
              >
                <User size={14} className="mr-1.5" aria-hidden="true" />
                <EditableText section="navbar" fieldPath="login">
                  Zaloguj się
                </EditableText>
              </button>
            )}
          </li>
        </ul>
      </div>
    </>
  );
}

export default Navbar;
