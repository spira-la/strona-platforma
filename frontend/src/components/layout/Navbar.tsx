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
import { EditableText, useCMSFocus } from '@/components/cms/EditableText';
import { useAuth } from '@/contexts/AuthContext';
import { useRoles } from '@/hooks/useRoles';
import { useAuthStore } from '@/stores/auth.store';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import spiralaLogo from '@/assets/spirala-logo.png';

// ---------------------------------------------------------------------------
// Nav structure types
// ---------------------------------------------------------------------------

interface NavLink {
  type: 'link';
  href: string;
  labelKey: string;
  fieldPath: string;
  editable: string;
}

interface NavGroupItem {
  href: string;
  labelKey: string;
  fieldPath: string;
  editable: string;
}

interface NavGroup {
  type: 'group';
  id: string;
  labelKey: string;
  fieldPath: string;
  editable: string;
  items: NavGroupItem[];
}

type NavEntry = NavLink | NavGroup;

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const DIRECT_NAV_LINKS: NavLink[] = [
  {
    type: 'link',
    href: '/o-mnie',
    labelKey: 'common.about',
    fieldPath: 'link1',
    editable: 'O Mnie',
  },
  {
    type: 'link',
    href: '/jak-pracuje',
    labelKey: 'common.howIWork',
    fieldPath: 'link2',
    editable: 'Jak Pracuję',
  },
  {
    type: 'link',
    href: '/uslugi',
    labelKey: 'common.services',
    fieldPath: 'link3',
    editable: 'Usługi',
  },
];

// Simple menu used when the `extendedNav` flag is off. New fieldPaths
// (navHome, navEvents, navContact) so labels saved in the CMS for the old
// link2/link3 slots don't leak into the new tabs.
const SIMPLE_NAV_LINKS: NavLink[] = [
  {
    type: 'link',
    href: '/',
    labelKey: 'common.start',
    fieldPath: 'navHome',
    editable: 'Start',
  },
  {
    type: 'link',
    href: '/o-mnie',
    labelKey: 'common.about',
    fieldPath: 'link1',
    editable: 'O Mnie',
  },
  {
    type: 'link',
    href: '/wydarzenia',
    labelKey: 'common.events',
    fieldPath: 'navEvents',
    editable: 'Wydarzenia',
  },
  {
    type: 'link',
    href: '/kontakt',
    labelKey: 'common.contact',
    fieldPath: 'navContact',
    editable: 'Kontakt',
  },
];

const SPEC_GROUP: NavGroup = {
  type: 'group',
  id: 'specializations',
  labelKey: 'common.specializations',
  fieldPath: 'groupSpecjalizacje',
  editable: 'Specjalizacje',
  items: [
    {
      href: '/mama-nastolatka',
      labelKey: 'common.mamyNastolatkow',
      fieldPath: 'linkMamyNastolatkow',
      editable: 'Mama nastolatka',
    },
    {
      href: '/matka-zona-kochanka',
      labelKey: 'common.motherWifeLover',
      fieldPath: 'linkMotherWifeLover',
      editable: 'Matka, żona, kochanka',
    },
  ],
};

const YOUTUBE_ITEM: NavGroupItem = {
  href: '/wideo',
  labelKey: 'common.video',
  fieldPath: 'link5',
  editable: 'Wideo',
};

const LANGUAGES = [
  { code: 'pl', label: 'PL' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NavbarProps {
  transparent?: boolean;
  /** When true, navbar text is white over dark hero images. */
  darkHero?: boolean;
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar({ transparent = false, darkHero = false }: NavbarProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const { isAdmin, isCoach } = useRoles();
  const { openLogin } = useAuthStore();
  const showYouTube = useFeatureFlag('youtubeNavLink');
  const showBlog = useFeatureFlag('blog');
  const showExtendedNav = useFeatureFlag('extendedNav');
  const { activeId } = useCMSFocus();

  const contentGroup: NavGroup = {
    type: 'group',
    id: 'content',
    labelKey: 'common.content',
    fieldPath: 'groupTresci',
    editable: 'Treści',
    items: [
      ...(showBlog
        ? [
            {
              href: '/blog',
              labelKey: 'common.blog',
              fieldPath: 'link4',
              editable: 'Blog',
            },
          ]
        : []),
      ...(showYouTube ? [YOUTUBE_ITEM] : []),
    ],
  };

  const NAV_ENTRIES: NavEntry[] = showExtendedNav
    ? [
        ...DIRECT_NAV_LINKS,
        SPEC_GROUP,
        ...(contentGroup.items.length > 0 ? [contentGroup] : []),
      ]
    : SIMPLE_NAV_LINKS;

  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  // Which desktop dropdown group is open (by id)
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  // Which mobile accordion group is expanded (by id)
  const [mobileOpenGroup, setMobileOpenGroup] = useState<string | null>(null);

  // Close all overlays on route change
  const [trackedPathname, setTrackedPathname] = useState(location.pathname);
  if (trackedPathname !== location.pathname) {
    setTrackedPathname(location.pathname);
    if (drawerOpen) setDrawerOpen(false);
    if (langOpen) setLangOpen(false);
    if (userMenuOpen) setUserMenuOpen(false);
    if (openGroup) setOpenGroup(null);
    if (mobileOpenGroup) setMobileOpenGroup(null);
  }

  const langRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!langOpen && !userMenuOpen && !openGroup) return;
    const handler = (e: MouseEvent) => {
      if (activeId) return;
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
      if (openGroup) {
        const ref = groupRefs.current.get(openGroup);
        if (ref && !ref.contains(e.target as Node)) {
          setOpenGroup(null);
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen, userMenuOpen, openGroup, activeId]);

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
  const isGroupActive = (group: NavGroup) =>
    group.items.some((item) => isActive(item.href));
  const isTransparentMode = transparent && !scrolled;
  const useWhiteText = isTransparentMode && darkHero;

  const currentLang =
    LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleLangChange = (code: string) => {
    void i18n.changeLanguage(code);
    setLangOpen(false);
  };

  const toggleGroup = (id: string) => {
    setOpenGroup((prev) => (prev === id ? null : id));
  };

  const toggleMobileGroup = (id: string) => {
    setMobileOpenGroup((prev) => (prev === id ? null : id));
  };

  // Shared text colour helpers
  const linkClass = (active: boolean) =>
    [
      "font-['Lato'] text-[14px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded",
      useWhiteText
        ? active
          ? 'text-white font-medium'
          : 'text-white/70 hover:text-white'
        : active
          ? 'text-brand font-medium'
          : 'text-ink-muted hover:text-ink',
    ].join(' ');

  return (
    <>
      {/* Main navbar */}
      <header
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          transparent && !scrolled
            ? darkHero
              ? 'bg-transparent'
              : // light hero (watercolor painting): soft frosted strip so the
                // dark menu text stays readable over the colorful paint
                'bg-white/70 backdrop-blur-md'
            : scrolled
              ? 'bg-white shadow-[0_1px_12px_0_rgba(0,0,0,0.08)]'
              : 'bg-white border-b border-line-soft',
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
            className="flex items-center transition-opacity duration-200 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            aria-label="Spirala — strona główna"
          >
            {/* Watercolor wordmark + spiral (2026-11 logo). The image already
                contains the name, so no separate text label. */}
            <img
              src={spiralaLogo}
              alt=""
              width={126}
              height={44}
              className="h-10 md:h-11 w-auto"
              aria-hidden="true"
            />
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-6" role="list">
            {NAV_ENTRIES.map((entry) => {
              if (entry.type === 'link') {
                return (
                  <li key={entry.href}>
                    <Link
                      to={entry.href}
                      className={linkClass(isActive(entry.href))}
                      aria-current={isActive(entry.href) ? 'page' : undefined}
                    >
                      <EditableText
                        section="navbar"
                        fieldPath={entry.fieldPath}
                      >
                        {t(entry.labelKey)}
                      </EditableText>
                    </Link>
                  </li>
                );
              }

              // NavGroup — dropdown
              const active = isGroupActive(entry);
              const isOpen = openGroup === entry.id;
              return (
                <li key={entry.id} className="relative">
                  <div
                    ref={(el) => {
                      if (el) groupRefs.current.set(entry.id, el);
                      else groupRefs.current.delete(entry.id);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(entry.id)}
                      className={[
                        'flex items-center gap-1',
                        linkClass(active),
                      ].join(' ')}
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                    >
                      <EditableText
                        section="navbar"
                        fieldPath={entry.fieldPath}
                      >
                        {t(entry.labelKey)}
                      </EditableText>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-20"
                        role="menu"
                        aria-label={t(entry.labelKey)}
                      >
                        <ul className="w-[220px] bg-white border border-line-soft rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.10)] py-2">
                          {entry.items.map((item) => (
                            <li key={item.href} role="none">
                              <Link
                                to={item.href}
                                role="menuitem"
                                className={[
                                  "block px-4 py-2.5 font-['Lato'] text-[13px] transition-colors duration-150 hover:bg-surface focus-visible:outline-none focus-visible:bg-surface",
                                  isActive(item.href)
                                    ? 'text-brand font-medium'
                                    : 'text-ink hover:text-brand',
                                ].join(' ')}
                                aria-current={
                                  isActive(item.href) ? 'page' : undefined
                                }
                              >
                                <EditableText
                                  section="navbar"
                                  fieldPath={item.fieldPath}
                                >
                                  {t(item.labelKey)}
                                </EditableText>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Desktop right side: language switcher + CTA */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className={`flex items-center gap-1 font-['Lato'] text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded px-1 ${useWhiteText ? 'text-white/70 hover:text-white' : 'text-ink-muted hover:text-ink'}`}
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
                  className="absolute right-0 top-full mt-2 w-[72px] bg-white border border-line-soft rounded-lg shadow-lg py-1 z-10"
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
                          "w-full text-left px-3 py-1.5 font-['Lato'] text-[13px] transition-colors duration-150 hover:bg-surface",
                          lang.code === i18n.language
                            ? 'text-brand font-medium'
                            : 'text-ink-soft',
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
                  className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-full"
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  aria-label="Menu użytkownika"
                >
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-['Lato'] text-[13px] font-bold ${useWhiteText ? 'bg-white/20 text-white' : 'bg-brand/15 text-brand'}`}
                  >
                    {userInitial}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''} ${useWhiteText ? 'text-white/70' : 'text-ink-muted'}`}
                    aria-hidden="true"
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-[200px] bg-white border border-line-soft rounded-lg shadow-lg py-2 z-10"
                    role="menu"
                  >
                    <div className="px-3 py-2 border-b border-line-soft">
                      <p className="font-['Lato'] text-[13px] font-medium text-ink truncate">
                        {userName}
                      </p>
                      <p className="font-['Lato'] text-[11px] text-ink-muted truncate">
                        {user?.email}
                      </p>
                    </div>
                    {isCoach && (
                      <Link
                        to="/coach"
                        className="w-full flex items-center gap-2 px-3 py-2 font-['Lato'] text-[13px] text-brand hover:bg-surface hover:text-brand-dark transition-colors"
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
                        className="w-full flex items-center gap-2 px-3 py-2 font-['Lato'] text-[13px] text-brand hover:bg-surface hover:text-brand-dark transition-colors"
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
                      className="w-full flex items-center gap-2 px-3 py-2 font-['Lato'] text-[13px] text-ink-soft hover:bg-surface hover:text-ink transition-colors"
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
                className="font-['Lato'] text-[13px] font-medium text-white bg-action hover:bg-action-hover active:bg-action-hover transition-colors duration-200 rounded-full px-6 py-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
            className={`md:hidden flex items-center justify-center w-10 h-10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded ${useWhiteText ? 'text-white hover:text-white/80' : 'text-ink hover:text-brand'}`}
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
          'fixed top-[72px] left-0 right-0 z-40 bg-white border-b border-line-soft shadow-lg md:hidden',
          'transition-all duration-300 ease-in-out overflow-hidden',
          drawerOpen
            ? 'max-h-[600px] opacity-100'
            : 'max-h-0 opacity-0 pointer-events-none',
        ].join(' ')}
      >
        <ul className="flex flex-col px-4 pt-4 pb-6 gap-1" role="list">
          {NAV_ENTRIES.map((entry) => {
            if (entry.type === 'link') {
              return (
                <li key={entry.href}>
                  <Link
                    to={entry.href}
                    className={[
                      "block py-3 px-2 font-['Lato'] text-[15px] border-b border-line-soft transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded",
                      isActive(entry.href)
                        ? 'text-brand font-medium'
                        : 'text-ink hover:text-brand',
                    ].join(' ')}
                    aria-current={isActive(entry.href) ? 'page' : undefined}
                  >
                    <EditableText section="navbar" fieldPath={entry.fieldPath}>
                      {t(entry.labelKey)}
                    </EditableText>
                  </Link>
                </li>
              );
            }

            // NavGroup — accordion
            const expanded = mobileOpenGroup === entry.id;
            const active = isGroupActive(entry);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => toggleMobileGroup(entry.id)}
                  className={[
                    "w-full flex items-center justify-between py-3 px-2 font-['Lato'] text-[15px] border-b border-line-soft transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded",
                    active ? 'text-brand font-medium' : 'text-ink',
                  ].join(' ')}
                  aria-expanded={expanded}
                >
                  <EditableText section="navbar" fieldPath={entry.fieldPath}>
                    {t(entry.labelKey)}
                  </EditableText>
                  <ChevronDown
                    size={15}
                    className={`transition-transform duration-200 text-ink-muted ${expanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                {expanded && (
                  <ul className="flex flex-col border-b border-line-soft">
                    {entry.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          className={[
                            "block py-2.5 pl-6 pr-2 font-['Lato'] text-[14px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded",
                            isActive(item.href)
                              ? 'text-brand font-medium'
                              : 'text-ink-soft hover:text-brand',
                          ].join(' ')}
                          aria-current={
                            isActive(item.href) ? 'page' : undefined
                          }
                        >
                          <EditableText
                            section="navbar"
                            fieldPath={item.fieldPath}
                          >
                            {t(item.labelKey)}
                          </EditableText>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}

          {/* Language row */}
          <li className="flex items-center gap-2 pt-4 pb-2 px-2">
            <Globe size={14} className="text-ink-muted" aria-hidden="true" />
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLangChange(lang.code)}
                className={[
                  "font-['Lato'] text-[13px] px-2 py-1 rounded transition-colors duration-150",
                  lang.code === i18n.language
                    ? 'text-brand font-semibold'
                    : 'text-ink-muted hover:text-ink',
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
                    <span className="w-8 h-8 rounded-full bg-brand/15 text-brand flex items-center justify-center font-['Lato'] text-[13px] font-bold">
                      {userInitial}
                    </span>
                    <span className="font-['Lato'] text-[14px] text-ink truncate max-w-[180px]">
                      {userName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-1 font-['Lato'] text-[13px] text-ink-muted hover:text-ink transition-colors"
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
                    className="flex items-center gap-2 font-['Lato'] text-[13px] font-semibold text-brand hover:text-brand-dark transition-colors px-1 py-1"
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
                    className="flex items-center gap-2 font-['Lato'] text-[13px] font-semibold text-brand hover:text-brand-dark transition-colors px-1 py-1"
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
                className="flex items-center justify-center w-full font-['Lato'] text-[14px] font-medium text-white bg-action hover:bg-action-hover transition-colors duration-200 rounded-full px-6 py-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
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
