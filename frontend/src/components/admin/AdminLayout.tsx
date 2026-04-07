import { useState, useCallback, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Briefcase,
  PenLine,
  Mail,
  Receipt,
  Ticket,
  Search,
  ArrowLeft,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import spiralaIcon from '@/assets/spirala-icon.png';

// ─── Nav configuration ───────────────────────────────────────────────────────

interface NavItem {
  path: string;
  icon: React.ElementType;
  labelKey: string;
  end?: boolean;
}

interface NavSection {
  sectionKey: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    sectionKey: 'admin.nav.sections.main',
    items: [
      { path: '/admin', icon: LayoutDashboard, labelKey: 'admin.nav.dashboard', end: true },
      { path: '/admin/sessions', icon: Calendar, labelKey: 'admin.nav.sessions' },
      { path: '/admin/availability', icon: Clock, labelKey: 'admin.nav.availability' },
      { path: '/admin/services', icon: Briefcase, labelKey: 'admin.nav.services' },
    ],
  },
  {
    sectionKey: 'admin.nav.sections.content',
    items: [
      { path: '/admin/blog', icon: PenLine, labelKey: 'admin.nav.blog' },
      { path: '/admin/newsletter', icon: Mail, labelKey: 'admin.nav.newsletter' },
    ],
  },
  {
    sectionKey: 'admin.nav.sections.business',
    items: [
      { path: '/admin/invoices', icon: Receipt, labelKey: 'admin.nav.invoices' },
      { path: '/admin/coupons', icon: Ticket, labelKey: 'admin.nav.coupons' },
    ],
  },
  {
    sectionKey: 'admin.nav.sections.system',
    items: [
      { path: '/admin/seo', icon: Search, labelKey: 'admin.nav.seo' },
    ],
  },
];

const STORAGE_KEY = 'spirala_sidebar_collapsed';

// ─── NavItemLink ──────────────────────────────────────────────────────────────

interface NavItemLinkProps {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavItemLink({ item, collapsed, onNavigate }: NavItemLinkProps) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const label = t(item.labelKey);

  return (
    <NavLink
      to={item.path}
      end={item.end}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={({ isActive }) => [
        'flex items-center gap-3 rounded-lg text-sm font-medium transition-colors duration-150',
        collapsed ? 'px-[18px] py-2.5 justify-center' : 'px-3 py-2.5',
        isActive
          ? 'bg-[#B8963E]/10 text-[#B8963E] font-semibold border-l-2 border-[#B8963E]'
          : 'text-[#6B6B6B] hover:bg-[#F9F6F0] hover:text-[#2D2D2D]',
      ].join(' ')}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

// ─── SidebarNav ───────────────────────────────────────────────────────────────

interface SidebarNavProps {
  collapsed: boolean;
  onNavigate?: () => void;
}

function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const { t } = useTranslation();

  return (
    <nav
      className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
      aria-label={t('admin.nav.ariaLabel')}
    >
      {NAV_SECTIONS.map((section) => (
        <div key={section.sectionKey}>
          {!collapsed && (
            <p className="px-3 mb-1 text-[10px] uppercase tracking-wider text-[#AAAAAA] font-semibold select-none">
              {t(section.sectionKey)}
            </p>
          )}
          {collapsed && <div className="px-3 mb-1 h-[16px]" aria-hidden="true" />}
          <ul className="space-y-0.5" role="list">
            {section.items.map((item) => (
              <li key={item.path}>
                <NavItemLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// ─── SidebarFooter ────────────────────────────────────────────────────────────

interface SidebarFooterProps {
  collapsed: boolean;
  onBack: () => void;
  onToggleCollapse: () => void;
}

function SidebarFooter({ collapsed, onBack, onToggleCollapse }: SidebarFooterProps) {
  const { t } = useTranslation();

  const footerBtnClass = (extraClass = '') =>
    [
      'flex items-center gap-3 w-full rounded-lg text-sm font-medium',
      'transition-colors duration-150 text-[#6B6B6B]',
      'hover:bg-[#F9F6F0] hover:text-[#2D2D2D]',
      collapsed ? 'px-[18px] py-2.5 justify-center' : 'px-3 py-2.5',
      extraClass,
    ].join(' ');

  return (
    <div className="px-3 py-3 border-t border-[#E8E4DF] space-y-0.5 flex-shrink-0">
      <button
        type="button"
        onClick={onBack}
        title={collapsed ? t('admin.nav.backToSite') : undefined}
        className={footerBtnClass()}
      >
        <ArrowLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        {!collapsed && <span>{t('admin.nav.backToSite')}</span>}
      </button>

      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? t('admin.nav.expandSidebar') : t('admin.nav.collapseSidebar')}
        className={footerBtnClass()}
      >
        {collapsed ? (
          <ChevronsRight className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
        ) : (
          <>
            <ChevronsLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{t('admin.nav.collapseSidebar')}</span>
          </>
        )}
      </button>
    </div>
  );
}

// ─── SidebarBranding ─────────────────────────────────────────────────────────

interface SidebarBrandingProps {
  collapsed: boolean;
}

function SidebarBranding({ collapsed }: SidebarBrandingProps) {
  const { t } = useTranslation();

  return (
    <div
      className={[
        'flex items-center gap-3 py-4 border-b border-[#E8E4DF] flex-shrink-0',
        collapsed ? 'justify-center px-[18px]' : 'px-4',
      ].join(' ')}
    >
      <img
        src={spiralaIcon}
        alt={t('admin.branding.logoAlt')}
        className="h-8 w-8 flex-shrink-0 object-contain"
      />
      {!collapsed && (
        <div className="min-w-0">
          <span className="block font-['Playfair_Display',serif] font-bold text-base text-[#B8963E] leading-tight truncate">
            Spirala
          </span>
          <span className="block text-[10px] uppercase tracking-widest text-[#AAAAAA] font-medium font-['Inter',sans-serif]">
            {t('admin.branding.panel')}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage unavailable — continue without persistence
      }
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleCloseMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!isMobileOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9F6F0]">

      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={[
          'hidden md:flex flex-col flex-shrink-0 bg-white border-r border-[#E8E4DF]',
          'transition-all duration-200 overflow-hidden',
          isCollapsed ? 'w-[72px]' : 'w-[260px]',
        ].join(' ')}
        aria-label={t('admin.nav.sidebarLabel')}
      >
        <SidebarBranding collapsed={isCollapsed} />
        <SidebarNav collapsed={isCollapsed} />
        <SidebarFooter
          collapsed={isCollapsed}
          onBack={handleBack}
          onToggleCollapse={handleToggleCollapse}
        />
      </aside>

      {/* ── Mobile: Hamburger trigger ────────────────────────────────────────── */}
      <button
        type="button"
        aria-label={t('admin.nav.openMenu')}
        aria-expanded={isMobileOpen}
        aria-controls="admin-mobile-sidebar"
        onClick={() => setIsMobileOpen(true)}
        className={[
          'md:hidden fixed top-4 left-4 z-40',
          'flex items-center justify-center w-9 h-9 rounded-lg',
          'bg-white border border-[#E8E4DF] shadow-sm',
          'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#F9F6F0]',
          'transition-colors duration-150',
        ].join(' ')}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* ── Mobile: Backdrop overlay ─────────────────────────────────────────── */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          aria-hidden="true"
          onClick={handleCloseMobile}
        />
      )}

      {/* ── Mobile Sidebar ───────────────────────────────────────────────────── */}
      <aside
        id="admin-mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label={t('admin.nav.sidebarLabel')}
        className={[
          'md:hidden fixed inset-y-0 left-0 z-50',
          'flex flex-col w-72 bg-white border-r border-[#E8E4DF] shadow-xl',
          'transition-transform duration-200',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#E8E4DF] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={spiralaIcon}
              alt={t('admin.branding.logoAlt')}
              className="h-8 w-8 flex-shrink-0 object-contain"
            />
            <div className="min-w-0">
              <span className="block font-['Playfair_Display',serif] font-bold text-base text-[#B8963E] leading-tight truncate">
                Spirala
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-[#AAAAAA] font-medium font-['Inter',sans-serif]">
                {t('admin.branding.panel')}
              </span>
            </div>
          </div>
          <button
            type="button"
            aria-label={t('admin.nav.closeMenu')}
            onClick={handleCloseMobile}
            className={[
              'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0',
              'text-[#6B6B6B] hover:text-[#2D2D2D] hover:bg-[#F9F6F0]',
              'transition-colors duration-150',
            ].join(' ')}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <SidebarNav collapsed={false} onNavigate={handleCloseMobile} />

        {/* Mobile back link */}
        <div className="px-3 py-3 border-t border-[#E8E4DF] flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              handleCloseMobile();
              navigate('/');
            }}
            className={[
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
              'text-sm font-medium text-[#6B6B6B]',
              'hover:bg-[#F9F6F0] hover:text-[#2D2D2D]',
              'transition-colors duration-150',
            ].join(' ')}
          >
            <ArrowLeft className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{t('admin.nav.backToSite')}</span>
          </button>
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0">
        <div className="min-h-full p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
