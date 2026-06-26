import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, List, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminFilterTabs } from '@/components/admin/AdminFilterTabs';
import { AdminTable } from '@/components/admin/AdminTable';
import type { AdminTableColumn } from '@/components/admin/AdminTable';
import { coachClient, type CoachSession } from '@/clients/coach.client';
import { CoachWeekCalendar } from '@/components/coach/CoachWeekCalendar';
import { SessionDetailModal } from '@/components/coach/SessionDetailModal';
import { RescheduleModal } from '@/components/coach/RescheduleModal';
import { ManualSessionModal } from '@/components/coach/ManualSessionModal';

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
  const [view, setView] = useState<'calendar' | 'table'>('calendar');
  const queryClient = useQueryClient();

  // ─── Modal state ──────────────────────────────────────────────────────────
  const [detailSession, setDetailSession] = useState<CoachSession | null>(null);
  const [rescheduleSession, setRescheduleSession] =
    useState<CoachSession | null>(null);
  const [manualPrefill, setManualPrefill] = useState<{
    date: string;
    startTime: string;
  } | null>(null);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['coach-sessions'],
    queryFn: () => coachClient.getSessions(),
  });

  const { data: blocksData } = useQuery({
    queryKey: ['coach-blocks'],
    queryFn: () => coachClient.getBlocks(),
  });

  const { data: availabilityData } = useQuery({
    queryKey: ['coach-availability'],
    queryFn: () => coachClient.getAvailability(),
  });

  const { data: profileData } = useQuery({
    queryKey: ['coach-profile'],
    queryFn: () => coachClient.getProfile(),
  });

  const { data: servicesData } = useQuery({
    queryKey: ['coach-services'],
    queryFn: () => coachClient.getServices(),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['coach-clients'],
    queryFn: () => coachClient.getClients(),
  });

  const createBlockMutation = useMutation({
    mutationFn: coachClient.createBlock,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['coach-blocks'] }),
  });

  const deleteBlockMutation = useMutation({
    mutationFn: coachClient.deleteBlock,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['coach-blocks'] }),
  });

  const cancelSessionMutation = useMutation({
    mutationFn: (id: string) => coachClient.cancelSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-sessions'] });
      setDetailSession(null);
    },
  });

  const rescheduleSessionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof coachClient.rescheduleSession>[1];
    }) => coachClient.rescheduleSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-sessions'] });
      setRescheduleSession(null);
      setDetailSession(null);
    },
  });

  const createManualSessionMutation = useMutation({
    mutationFn: coachClient.createManualSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-sessions'] });
      setManualPrefill(null);
    },
  });

  const sessions = data ?? [];
  const blocks = blocksData ?? [];
  const availability = availabilityData ?? [];
  const services = servicesData ?? [];
  const pastClients = clientsData ?? [];
  const coachId = (profileData as { id?: string } | undefined)?.id ?? '';

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

      {/* View toggle */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-[#F5F2ED] rounded-lg w-fit">
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            view === 'calendar'
              ? 'bg-white text-[#B8944A] shadow-sm'
              : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
          }`}
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          <Calendar size={13} /> Kalendarz
        </button>
        <button
          onClick={() => setView('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            view === 'table'
              ? 'bg-white text-[#B8944A] shadow-sm'
              : 'text-[#6B6B6B] hover:text-[#2D2D2D]'
          }`}
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          <List size={13} /> Lista
        </button>
      </div>

      {/* Calendar view */}
      {view === 'calendar' && (
        <CoachWeekCalendar
          sessions={sessions}
          blocks={blocks}
          availability={availability}
          onCreateBlock={(data) => createBlockMutation.mutate(data)}
          onDeleteBlock={(id) => deleteBlockMutation.mutate(id)}
          onSessionClick={setDetailSession}
          onScheduleManual={(date, startTime) =>
            setManualPrefill({ date, startTime })
          }
          isCreating={createBlockMutation.isPending}
        />
      )}

      {/* ─── Session Detail Modal ─── */}
      {detailSession && (
        <SessionDetailModal
          session={detailSession}
          onClose={() => setDetailSession(null)}
          onReschedule={(s) => {
            setDetailSession(null);
            setRescheduleSession(s);
          }}
          onCancel={(s) => cancelSessionMutation.mutate(s.id)}
          isCancelling={cancelSessionMutation.isPending}
        />
      )}

      {/* ─── Reschedule Modal ─── */}
      {rescheduleSession && coachId && (
        <RescheduleModal
          session={rescheduleSession}
          coachId={coachId}
          onSubmit={(id, data) =>
            rescheduleSessionMutation.mutate({ id, data })
          }
          onClose={() => setRescheduleSession(null)}
          isSubmitting={rescheduleSessionMutation.isPending}
        />
      )}

      {/* ─── Manual Session Modal ─── */}
      {manualPrefill && (
        <ManualSessionModal
          prefillDate={manualPrefill.date}
          prefillStart={manualPrefill.startTime}
          services={services}
          pastClients={pastClients}
          onSubmit={(data) => createManualSessionMutation.mutate(data)}
          onClose={() => setManualPrefill(null)}
          isSubmitting={createManualSessionMutation.isPending}
        />
      )}

      {/* Table view */}
      {view === 'table' && (
        <>
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
        </>
      )}
    </div>
  );
}
