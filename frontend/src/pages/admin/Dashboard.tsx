import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Users,
  TrendingUp,
  Mail,
  CalendarX,
  Send,
  PenLine,
  Ticket,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCard {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
}

interface Session {
  client: string;
  service: string;
  datetime: string;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  to: string;
}

// ---------------------------------------------------------------------------
// Static mock data (replaced by API calls in a later iteration)
// ---------------------------------------------------------------------------

const STAT_CARDS: StatCard[] = [
  {
    icon: CalendarCheck,
    label: 'Nadchodzące sesje',
    value: '3',
    subtitle: 'w tym tygodniu',
  },
  {
    icon: Users,
    label: 'Klienci',
    value: '24',
    subtitle: 'łącznie',
  },
  {
    icon: TrendingUp,
    label: 'Przychód',
    value: '3 250 zł',
    subtitle: 'ten miesiąc',
  },
  {
    icon: Mail,
    label: 'Newsletter',
    value: '156',
    subtitle: 'subskrybentów',
  },
];

const UPCOMING_SESSIONS: Session[] = [
  {
    client: 'Marta K.',
    service: 'Sesja indywidualna',
    datetime: 'Pon, 7 kwi · 10:00',
  },
  {
    client: 'Karolina W.',
    service: 'Coaching transformacyjny',
    datetime: 'Wt, 8 kwi · 14:00',
  },
  {
    client: 'Joanna P.',
    service: 'Pakiet sesji (3/5)',
    datetime: 'Śr, 9 kwi · 11:00',
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { icon: CalendarX, label: 'Zablokuj termin', to: '/admin/availability' },
  { icon: Send, label: 'Napisz newsletter', to: '/admin/newsletter' },
  { icon: PenLine, label: 'Nowy artykuł', to: '/admin/blog' },
  { icon: Ticket, label: 'Dodaj kupon', to: '/admin/coupons' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCardItem({ icon: Icon, label, value, subtitle }: StatCard) {
  return (
    <div className="bg-white border border-[#E8E4DF] rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#B8963E]/10 shrink-0">
          <Icon className="w-5 h-5 text-[#B8963E]" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="font-['Inter'] text-[13px] text-[#6B6B6B] leading-tight truncate">
            {label}
          </p>
          <p className="font-['Playfair_Display'] font-bold text-[28px] text-[#2D2D2D] leading-tight">
            {value}
          </p>
          <p className="font-['Inter'] text-[12px] text-[#AAAAAA] leading-tight">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function SessionItem({ client, service, datetime }: Session) {
  return (
    <li className="flex items-center gap-3 py-3 border-b border-[#E8E4DF] last:border-b-0">
      <span
        className="w-2 h-2 rounded-full bg-[#B8963E] shrink-0"
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D] leading-tight truncate">
          {client}
        </p>
        <p className="font-['Inter'] text-[12px] text-[#8A8A8A] leading-tight truncate">
          {service}
        </p>
      </div>
      <time className="font-['Inter'] text-[12px] text-[#AAAAAA] shrink-0 text-right">
        {datetime}
      </time>
    </li>
  );
}

function QuickActionButton({ icon: Icon, label, to }: QuickAction) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 w-full border border-[#E8E4DF] rounded-lg py-3 px-4 font-['Inter'] text-[14px] font-medium text-[#444444] hover:bg-[#F9F6F0] hover:text-[#B8963E] transition-colors duration-150"
    >
      <Icon className="w-4 h-4 shrink-0 text-[#B8963E]" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Dashboard() {
  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Witaj, Aneta! Oto przegląd Twojej praktyki."
      />

      {/* Stats grid — 1 col mobile, 2 cols md, 4 cols xl */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <StatCardItem key={card.label} {...card} />
        ))}
      </div>

      {/* Two-column section — stacked on mobile, side-by-side from md */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming sessions */}
        <div className="bg-white border border-[#E8E4DF] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Playfair_Display'] font-bold text-[18px] text-[#1A1A1A]">
              Najbliższe sesje
            </h2>
            <Link
              to="/admin/sessions"
              className="font-['Inter'] text-[13px] text-[#B8963E] hover:text-[#8A6F2E] transition-colors duration-150"
            >
              Zobacz wszystkie
            </Link>
          </div>

          <ul aria-label="Lista nadchodzących sesji">
            {UPCOMING_SESSIONS.map((session) => (
              <SessionItem key={session.client} {...session} />
            ))}
          </ul>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-[#E8E4DF] rounded-xl p-6">
          <h2 className="font-['Playfair_Display'] font-bold text-[18px] text-[#1A1A1A] mb-4">
            Szybkie akcje
          </h2>

          <div className="flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => (
              <QuickActionButton key={action.to} {...action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
