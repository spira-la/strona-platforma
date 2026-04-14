import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminFilterTabs } from '@/components/admin/AdminFilterTabs';
import { AdminTable } from '@/components/admin/AdminTable';
import type { AdminTableColumn } from '@/components/admin/AdminTable';
import { coachClient, type CoachSession } from '@/clients/coach.client';

// ─── Teal accent constant ─────────────────────────────────────────────────────

const TEAL = '#0D9488';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

type SessionStatus =
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | string;

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  confirmed: { bg: '#F0FDFA', text: TEAL, border: '#0D9488' },
  completed: { bg: '#F0FDF4', text: '#16A34A', border: '#16A34A' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', border: '#DC2626' },
  'no-show': { bg: '#FFF7ED', text: '#EA580C', border: '#EA580C' },
};

interface SessionStatusBadgeProps {
  status: SessionStatus;
}

function SessionStatusBadge({ status }: SessionStatusBadgeProps) {
  const { t } = useTranslation();
  const styles = STATUS_STYLES[status] ?? {
    bg: '#F5F5F5',
    text: '#6B6B6B',
    border: '#E8E4DF',
  };

  const label = t(`coach.sessions.statusLabel.${status}`, {
    defaultValue: status,
  });

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium font-['Inter'] border"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        borderColor: `${styles.border}33`,
      }}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function calcDurationMinutes(startAt: string, endAt: string): number {
  try {
    return Math.round(
      (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000,
    );
  } catch {
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Filter tabs type
// ---------------------------------------------------------------------------

type StatusFilter = 'all' | 'confirmed' | 'completed' | 'cancelled';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CoachSessions() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // ─── Query ────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: () => coachClient.getSessions(),
  });

  const sessions = data ?? [];

  // Derived stats
  const confirmed = sessions.filter((s) => s.status === 'confirmed');
  const completed = sessions.filter((s) => s.status === 'completed');
  const cancelled = sessions.filter((s) => s.status === 'cancelled');

  // Filtered list
  const filtered =
    statusFilter === 'all'
      ? sessions
      : sessions.filter((s) => s.status === statusFilter);

  // ─── Table columns ─────────────────────────────────────────────────────────

  const columns: AdminTableColumn<CoachSession>[] = [
    {
      key: 'client',
      header: t('coach.sessions.table.client'),
      render: (s) => (
        <div>
          <div className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D]">
            {s.clientName}
          </div>
          <div className="font-['Inter'] text-[12px] text-[#8A8A8A]">
            {s.clientEmail}
          </div>
        </div>
      ),
    },
    {
      key: 'service',
      header: t('coach.sessions.table.service'),
      render: (s) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {s.serviceName}
        </span>
      ),
    },
    {
      key: 'dateTime',
      header: t('coach.sessions.table.dateTime'),
      render: (s) => (
        <span className="font-['Inter'] text-[13px] text-[#2D2D2D] whitespace-nowrap">
          {formatDateTime(s.startAt)}
        </span>
      ),
    },
    {
      key: 'duration',
      header: t('coach.sessions.table.duration'),
      render: (s) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B] whitespace-nowrap">
          {calcDurationMinutes(s.startAt, s.endAt)}{' '}
          {t('coach.sessions.durationUnit')}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('coach.sessions.table.status'),
      render: (s) => <SessionStatusBadge status={s.status} />,
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <AdminPageHeader
        title={t('coach.sessions.title')}
        description={t('coach.sessions.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={Calendar}
          label={t('coach.sessions.stats.total')}
          value={isLoading ? '—' : sessions.length}
        />
        <AdminStatCard
          icon={Clock}
          label={t('coach.sessions.stats.confirmed')}
          value={isLoading ? '—' : confirmed.length}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('coach.sessions.stats.completed')}
          value={isLoading ? '—' : completed.length}
        />
        <AdminStatCard
          icon={XCircle}
          label={t('coach.sessions.stats.cancelled')}
          value={isLoading ? '—' : cancelled.length}
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-4">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'all',
              label: t('coach.sessions.filter.all'),
              count: sessions.length,
            },
            {
              value: 'confirmed',
              label: t('coach.sessions.filter.confirmed'),
              count: confirmed.length,
            },
            {
              value: 'completed',
              label: t('coach.sessions.filter.completed'),
              count: completed.length,
            },
            {
              value: 'cancelled',
              label: t('coach.sessions.filter.cancelled'),
              count: cancelled.length,
            },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
          isLoading={isLoading}
        />
      </div>

      {/* Table */}
      <AdminTable<CoachSession>
        columns={columns}
        data={filtered}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('coach.sessions.errors.loadFailed')}
        emptyIcon={Calendar}
        emptyMessage={t('coach.sessions.empty.noSessions')}
        ariaLabel={t('coach.sessions.table.label')}
      />
    </div>
  );
}
