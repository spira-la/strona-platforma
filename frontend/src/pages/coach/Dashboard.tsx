import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  TrendingUp,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { coachClient } from '@/clients/coach.client';

function formatEarnings(amount: number): string {
  return `${amount.toLocaleString('pl-PL')} zł`;
}

export default function CoachDashboard() {
  const { t } = useTranslation();

  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['coach', 'dashboard'],
    queryFn: coachClient.getDashboard,
  });

  return (
    <div>
      <AdminPageHeader
        title={t('coach.dashboard.title')}
        description={t('coach.dashboard.greeting')}
      />

      {/* ── Stat cards ───────────────────────────────────────────────────────── */}
      {isError && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <p className="font-['Inter'] text-[14px] text-red-600">
            {t('common.error')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <AdminStatCard
          icon={Calendar}
          label={t('coach.dashboard.stats.upcomingSessions')}
          value={isLoading ? '—' : (stats?.upcomingSessions ?? 0)}
        />
        <AdminStatCard
          icon={Users}
          label={t('coach.dashboard.stats.totalClients')}
          value={isLoading ? '—' : (stats?.totalClients ?? 0)}
        />
        <AdminStatCard
          icon={TrendingUp}
          label={t('coach.dashboard.stats.thisMonthEarnings')}
          value={
            isLoading ? '—' : formatEarnings(stats?.thisMonthEarnings ?? 0)
          }
        />
        <AdminStatCard
          icon={CalendarCheck}
          label={t('coach.dashboard.stats.totalSessions')}
          value={isLoading ? '—' : (stats?.totalSessions ?? 0)}
        />
      </div>

      {/* ── Quick link to sessions ────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E8E4DF] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-['Cormorant_Garamond',serif] font-bold text-xl text-[#2D2D2D]">
              {t('coach.nav.sessions')}
            </h2>
            <p className="mt-1 font-['Inter'] text-[13px] text-[#6B6B6B]">
              {t('coach.sessions.description')}
            </p>
          </div>
          <Link
            to="/coach/sessions"
            className={[
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-[#0D9488]/10 text-[#0D9488] hover:bg-[#0D9488]/20',
              'transition-colors duration-150 flex-shrink-0',
            ].join(' ')}
          >
            <span>{t('coach.dashboard.viewAllSessions')}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
