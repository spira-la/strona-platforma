import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCircle,
  CheckCircle2,
  Archive,
  Pencil,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminFilterTabs,
  AdminSearchBar,
  AdminStatusBadge,
  AdminFormDialog,
  AdminFormField,
  AdminTable,
  ADMIN_INPUT_CLASS,
} from '@/components/admin';
import type { AdminTableColumn } from '@/components/admin';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/stores/toast.store';
import {
  coachesClient,
  type Coach,
  type CreateCoachData,
  type UpdateCoachData,
} from '@/clients/coaches.client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tagsDisplay(tags: string[] | null, max = 3): string {
  if (!tags || tags.length === 0) return '—';
  const shown = tags.slice(0, max);
  const rest = tags.length - max;
  return rest > 0 ? `${shown.join(', ')} +${rest}` : shown.join(', ');
}

// ---------------------------------------------------------------------------
// Create form state
// ---------------------------------------------------------------------------

interface CreateFormState {
  userId: string;
  bio: string;
  timezone: string;
}

function buildCreateForm(): CreateFormState {
  return { userId: '', bio: '', timezone: 'Europe/Warsaw' };
}

// ---------------------------------------------------------------------------
// Edit form state
// ---------------------------------------------------------------------------

interface EditFormState {
  bio: string;
  expertise: string; // comma-separated
  languages: string; // comma-separated
  location: string;
  timezone: string;
  acceptingClients: boolean;
}

function buildEditForm(coach: Coach): EditFormState {
  return {
    bio: coach.bio ?? '',
    expertise: (coach.expertise ?? []).join(', '),
    languages: (coach.languages ?? []).join(', '),
    location: coach.location ?? '',
    timezone: coach.timezone,
    acceptingClients: coach.acceptingClients,
  };
}

function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// CoachCreateDialog
// ---------------------------------------------------------------------------

interface CoachCreateDialogProps {
  onClose: () => void;
  onSave: (data: CreateCoachData) => void;
  isSaving: boolean;
}

function CoachCreateDialog({ onClose, onSave, isSaving }: CoachCreateDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateFormState>(buildCreateForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateFormState, string>>>({});

  const setField = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof CreateFormState, string>> = {};
    if (!form.userId.trim()) {
      next.userId = t('admin.coaches.validation.userIdRequired');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      userId: form.userId.trim(),
      bio: form.bio.trim() || undefined,
      timezone: form.timezone.trim() || undefined,
    });
  };

  return (
    <AdminFormDialog
      open
      title={t('admin.coaches.newCoach')}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={t('admin.coaches.form.create')}
    >
      <AdminFormField
        label={t('admin.coaches.form.userId')}
        htmlFor="coach-userId"
        error={errors.userId}
      >
        <input
          id="coach-userId"
          type="text"
          value={form.userId}
          onChange={(e) => setField('userId', e.target.value)}
          placeholder={t('admin.coaches.form.userIdPlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoFocus
          autoComplete="off"
        />
      </AdminFormField>

      <AdminFormField label={t('admin.coaches.form.bio')} htmlFor="coach-bio">
        <textarea
          id="coach-bio"
          rows={3}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
          placeholder={t('admin.coaches.form.bioPlaceholder')}
          className={`${ADMIN_INPUT_CLASS} resize-none`}
        />
      </AdminFormField>

      <AdminFormField label={t('admin.coaches.form.timezone')} htmlFor="coach-timezone">
        <input
          id="coach-timezone"
          type="text"
          value={form.timezone}
          onChange={(e) => setField('timezone', e.target.value)}
          placeholder={t('admin.coaches.form.timezonePlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>
    </AdminFormDialog>
  );
}

// ---------------------------------------------------------------------------
// CoachEditDialog
// ---------------------------------------------------------------------------

interface CoachEditDialogProps {
  coach: Coach;
  onClose: () => void;
  onSave: (id: string, data: UpdateCoachData) => void;
  isSaving: boolean;
}

function CoachEditDialog({ coach, onClose, onSave, isSaving }: CoachEditDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EditFormState>(() => buildEditForm(coach));

  const setField = <K extends keyof EditFormState>(key: K, value: EditFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(coach.id, {
      bio: form.bio.trim() || null,
      expertise: parseCommaSeparated(form.expertise),
      languages: parseCommaSeparated(form.languages),
      location: form.location.trim() || null,
      timezone: form.timezone.trim() || 'Europe/Warsaw',
      acceptingClients: form.acceptingClients,
    });
  };

  return (
    <AdminFormDialog
      open
      title={t('admin.coaches.editCoach')}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={t('admin.coaches.form.save')}
    >
      <AdminFormField label={t('admin.coaches.form.bio')} htmlFor="edit-coach-bio">
        <textarea
          id="edit-coach-bio"
          rows={3}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
          placeholder={t('admin.coaches.form.bioPlaceholder')}
          className={`${ADMIN_INPUT_CLASS} resize-none`}
          autoFocus
        />
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.expertise')}
        htmlFor="edit-coach-expertise"
      >
        <input
          id="edit-coach-expertise"
          type="text"
          value={form.expertise}
          onChange={(e) => setField('expertise', e.target.value)}
          placeholder={t('admin.coaches.form.expertisePlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.languages')}
        htmlFor="edit-coach-languages"
      >
        <input
          id="edit-coach-languages"
          type="text"
          value={form.languages}
          onChange={(e) => setField('languages', e.target.value)}
          placeholder={t('admin.coaches.form.languagesPlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.location')}
        htmlFor="edit-coach-location"
      >
        <input
          id="edit-coach-location"
          type="text"
          value={form.location}
          onChange={(e) => setField('location', e.target.value)}
          placeholder={t('admin.coaches.form.locationPlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.timezone')}
        htmlFor="edit-coach-timezone"
      >
        <input
          id="edit-coach-timezone"
          type="text"
          value={form.timezone}
          onChange={(e) => setField('timezone', e.target.value)}
          placeholder={t('admin.coaches.form.timezonePlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      {/* Accepting clients toggle */}
      <div className="flex items-center justify-between py-2 px-3 bg-[#F9F6F0] rounded-lg">
        <span className="font-['Inter'] text-[14px] text-[#444444]">
          {t('admin.coaches.form.acceptingClients')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={form.acceptingClients}
          onClick={() => setField('acceptingClients', !form.acceptingClients)}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]',
            form.acceptingClients ? 'bg-[#B8963E]' : 'bg-[#DDDDDD]',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              form.acceptingClients ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>
    </AdminFormDialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type StatusFilter = 'active' | 'archived';
type DialogMode = 'create' | 'edit' | null;

export default function AdminCoaches() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [confirmCoach, setConfirmCoach] = useState<Coach | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => coachesClient.getAll(),
  });

  const coaches = data ?? [];
  const activeCoaches = coaches.filter((c) => c.isActive);
  const archivedCoaches = coaches.filter((c) => !c.isActive);

  const filtered = coaches.filter((c) => {
    if (statusFilter === 'active' && !c.isActive) return false;
    if (statusFilter === 'archived' && c.isActive) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!c.fullName.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (d: CreateCoachData) => coachesClient.create(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setDialogMode(null);
      toast.success(t('admin.common.created'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: UpdateCoachData }) =>
      coachesClient.update(id, d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setDialogMode(null);
      setEditingCoach(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => coachesClient.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => coachesClient.restore(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coaches'] });
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const isConfirmLoading = archiveMutation.isPending || restoreMutation.isPending;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingCoach(null);
    setDialogMode('create');
  };

  const handleOpenEdit = (coach: Coach) => {
    setEditingCoach(coach);
    setDialogMode('edit');
  };

  const handleCloseDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setDialogMode(null);
    setEditingCoach(null);
  };

  const handleCreate = (data: CreateCoachData) => {
    createMutation.mutate(data);
  };

  const handleUpdate = (id: string, data: UpdateCoachData) => {
    updateMutation.mutate({ id, data });
  };

  const handleToggleRequest = (coach: Coach) => {
    setConfirmCoach(coach);
  };

  const handleToggleConfirm = () => {
    if (!confirmCoach) return;
    setTogglingId(confirmCoach.id);
    if (confirmCoach.isActive) {
      archiveMutation.mutate(confirmCoach.id);
    } else {
      restoreMutation.mutate(confirmCoach.id);
    }
    setConfirmCoach(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns: AdminTableColumn<Coach>[] = [
    {
      key: 'name',
      header: t('admin.coaches.table.name'),
      render: (c) => (
        <div>
          <div className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D]">
            {c.fullName}
          </div>
          <div className="font-['Inter'] text-[12px] text-[#8A8A8A]">{c.email}</div>
        </div>
      ),
    },
    {
      key: 'expertise',
      header: t('admin.coaches.table.expertise'),
      render: (c) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {tagsDisplay(c.expertise)}
        </span>
      ),
    },
    {
      key: 'timezone',
      header: t('admin.coaches.table.timezone'),
      render: (c) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B] font-mono">
          {c.timezone}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.coaches.table.status'),
      render: (c) => (
        <AdminStatusBadge
          variant={c.isActive ? 'success' : 'neutral'}
          label={
            c.isActive
              ? t('admin.coaches.status.active')
              : t('admin.coaches.status.archived')
          }
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.coaches.table.actions'),
      render: (c) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(c)}
            title={t('admin.coaches.actions.edit')}
            aria-label={t('admin.coaches.actions.editCoach')}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleRequest(c)}
            disabled={togglingId === c.id}
            title={
              c.isActive
                ? t('admin.coaches.actions.archive')
                : t('admin.coaches.actions.restore')
            }
            aria-label={
              c.isActive
                ? t('admin.coaches.actions.archiveCoach')
                : t('admin.coaches.actions.restoreCoach')
            }
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            {c.isActive ? (
              <ToggleRight size={17} className="text-[#B8963E]" />
            ) : (
              <ToggleLeft size={17} />
            )}
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <AdminPageHeader
        title={t('admin.coaches.title')}
        description={t('admin.coaches.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          icon={UserCircle}
          label={t('admin.coaches.stats.total')}
          value={isLoading ? '—' : coaches.length}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('admin.coaches.stats.active')}
          value={isLoading ? '—' : activeCoaches.length}
        />
        <AdminStatCard
          icon={Archive}
          label={t('admin.coaches.stats.archived')}
          value={isLoading ? '—' : archivedCoaches.length}
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-4">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'active',
              label: t('admin.coaches.filter.active'),
              count: activeCoaches.length,
            },
            {
              value: 'archived',
              label: t('admin.coaches.filter.archived'),
              count: archivedCoaches.length,
            },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
          isLoading={isLoading}
        />
      </div>

      {/* Action bar */}
      <div className="mb-5">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('admin.coaches.searchPlaceholder')}
          ariaLabel={t('admin.coaches.searchLabel')}
          actionLabel={t('admin.coaches.newCoach')}
          onAction={handleOpenCreate}
        />
      </div>

      {/* Table */}
      <AdminTable<Coach>
        columns={columns}
        data={filtered}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('admin.coaches.errors.loadFailed')}
        emptyIcon={UserCircle}
        emptyMessage={
          search
            ? t('admin.coaches.empty.noResults')
            : t('admin.coaches.empty.noCoaches')
        }
        ariaLabel={t('admin.coaches.table.label')}
      />

      {/* Create dialog */}
      {dialogMode === 'create' && (
        <CoachCreateDialog
          onClose={handleCloseDialog}
          onSave={handleCreate}
          isSaving={isSaving}
        />
      )}

      {/* Edit dialog */}
      {dialogMode === 'edit' && editingCoach && (
        <CoachEditDialog
          coach={editingCoach}
          onClose={handleCloseDialog}
          onSave={handleUpdate}
          isSaving={isSaving}
        />
      )}

      {/* Archive / Restore confirmation */}
      <ConfirmDialog
        open={!!confirmCoach}
        title={
          confirmCoach?.isActive
            ? t('admin.coaches.actions.archiveCoach')
            : t('admin.coaches.actions.restoreCoach')
        }
        message={`${
          confirmCoach?.isActive
            ? t('admin.coaches.confirm.archive')
            : t('admin.coaches.confirm.restore')
        } "${confirmCoach?.fullName ?? ''}"?`}
        confirmLabel={
          confirmCoach?.isActive
            ? t('admin.coaches.actions.archive')
            : t('admin.coaches.actions.restore')
        }
        variant={confirmCoach?.isActive ? 'warning' : 'default'}
        isLoading={isConfirmLoading}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmCoach(null)}
      />
    </div>
  );
}
