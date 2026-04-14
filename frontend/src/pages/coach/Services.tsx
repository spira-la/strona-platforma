import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CheckCircle2,
  Archive,
  Pencil,
  Plus,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { AdminFilterTabs } from '@/components/admin/AdminFilterTabs';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import {
  AdminFormField,
  ADMIN_INPUT_CLASS,
} from '@/components/admin/AdminFormField';
import { AdminTable } from '@/components/admin/AdminTable';
import type { AdminTableColumn } from '@/components/admin/AdminTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/stores/toast.store';
import {
  coachClient,
  type CoachService,
  type CreateCoachServiceData,
  type UpdateCoachServiceData,
} from '@/clients/coach.client';
import { servicesClient, type Service } from '@/clients/services.client';

// ─── Teal accent constants ────────────────────────────────────────────────────

const TEAL = '#0D9488';
const TEAL_LIGHT = '#F0FDFA';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} zł`;
}

// ---------------------------------------------------------------------------
// Service form state (for edit)
// ---------------------------------------------------------------------------

interface EditFormState {
  durationMinutes: string;
  priceCents: string; // display in zł
}

function buildEditForm(service: CoachService): EditFormState {
  return {
    durationMinutes: String(service.durationMinutes),
    priceCents: (service.priceCents / 100).toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// CoachServiceEditDialog
// ---------------------------------------------------------------------------

interface CoachServiceEditDialogProps {
  service: CoachService;
  onClose: () => void;
  onSave: (id: string, data: UpdateCoachServiceData) => void;
  isSaving: boolean;
}

function CoachServiceEditDialog({
  service,
  onClose,
  onSave,
  isSaving,
}: CoachServiceEditDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EditFormState>(() => buildEditForm(service));
  const [errors, setErrors] = useState<
    Partial<Record<keyof EditFormState, string>>
  >({});

  const setField = <K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof EditFormState, string>> = {};
    const duration = Number(form.durationMinutes);
    if (!form.durationMinutes || Number.isNaN(duration) || duration < 1) {
      next.durationMinutes = t('coach.services.validation.durationRequired');
    }
    const price = Number(form.priceCents);
    if (!form.priceCents || Number.isNaN(price) || price <= 0) {
      next.priceCents = t('coach.services.validation.priceRequired');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(service.id, {
      durationMinutes: Number(form.durationMinutes),
      priceCents: Math.round(Number(form.priceCents) * 100),
    });
  };

  return (
    <AdminFormDialog
      open
      title={t('coach.services.editService')}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={t('coach.services.form.save')}
    >
      <div className="mb-3 px-3 py-2 bg-[#F0FDFA] rounded-lg border border-[#0D9488]/20">
        <span className="font-['Inter'] text-[14px] font-semibold text-[#0D9488]">
          {service.name}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AdminFormField
          label={t('coach.services.form.duration')}
          htmlFor="coach-service-duration"
          error={errors.durationMinutes}
        >
          <div className="relative">
            <input
              id="coach-service-duration"
              type="number"
              min={1}
              step={1}
              value={form.durationMinutes}
              onChange={(e) => setField('durationMinutes', e.target.value)}
              className={`${ADMIN_INPUT_CLASS} pr-10`}
              autoFocus
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['Inter'] text-[13px] text-[#8A8A8A] pointer-events-none select-none">
              {t('coach.services.durationUnit')}
            </span>
          </div>
        </AdminFormField>

        <AdminFormField
          label={t('coach.services.form.price')}
          htmlFor="coach-service-price"
          error={errors.priceCents}
        >
          <div className="relative">
            <input
              id="coach-service-price"
              type="number"
              min={0}
              step="0.01"
              value={form.priceCents}
              onChange={(e) => setField('priceCents', e.target.value)}
              className={`${ADMIN_INPUT_CLASS} pr-8`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['Inter'] text-[13px] text-[#8A8A8A] pointer-events-none select-none">
              zł
            </span>
          </div>
        </AdminFormField>
      </div>
    </AdminFormDialog>
  );
}

// ---------------------------------------------------------------------------
// AddServiceDialog — pick from catalog
// ---------------------------------------------------------------------------

interface AddServiceDialogProps {
  catalog: Service[];
  existingNames: Set<string>;
  onClose: () => void;
  onAdd: (
    service: Service,
    durationMinutes: number,
    priceCents: number,
  ) => void;
  isSaving: boolean;
}

function AddServiceDialog({
  catalog,
  existingNames,
  onClose,
  onAdd,
  isSaving,
}: AddServiceDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Service | null>(null);
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [errors, setErrors] = useState<{ duration?: string; price?: string }>(
    {},
  );

  const available = catalog.filter(
    (s) => s.isActive && !existingNames.has(s.name),
  );

  const handleSelect = (s: Service) => {
    setSelected(s);
    setDuration(String(s.durationMinutes));
    setPrice((s.priceCents / 100).toFixed(2));
    setErrors({});
  };

  const validate = (): boolean => {
    const next: { duration?: string; price?: string } = {};
    const d = Number(duration);
    if (!duration || Number.isNaN(d) || d < 1) {
      next.duration = t('coach.services.validation.durationRequired');
    }
    const p = Number(price);
    if (!price || Number.isNaN(p) || p <= 0) {
      next.price = t('coach.services.validation.priceRequired');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !validate()) return;
    onAdd(selected, Number(duration), Math.round(Number(price) * 100));
  };

  return (
    <AdminFormDialog
      open
      title={t('coach.services.addService')}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={t('coach.services.form.add')}
    >
      {/* Catalog list */}
      <div className="mb-4">
        <p className="font-['Inter'] text-[13px] text-[#6B6B6B] mb-2">
          {t('coach.services.selectFromCatalog')}
        </p>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {available.length === 0 && (
            <p className="font-['Inter'] text-[13px] text-[#AAAAAA] py-2 text-center">
              {t('coach.services.empty.allAdded')}
            </p>
          )}
          {available.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelect(s)}
              className={[
                'flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors',
                selected?.id === s.id
                  ? `border-[${TEAL}] bg-[${TEAL_LIGHT}]`
                  : 'border-[#E8E4DF] hover:border-[#0D9488]/40 hover:bg-[#F0FDFA]',
              ].join(' ')}
              style={{
                borderColor: selected?.id === s.id ? TEAL : undefined,
                backgroundColor: selected?.id === s.id ? TEAL_LIGHT : undefined,
              }}
            >
              <span className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D]">
                {s.name}
              </span>
              <span className="font-['Inter'] text-[12px] text-[#6B6B6B]">
                {s.durationMinutes} {t('coach.services.durationUnit')} ·{' '}
                {formatPrice(s.priceCents)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Duration + Price inputs (only when service is selected) */}
      {selected && (
        <div className="grid grid-cols-2 gap-4">
          <AdminFormField
            label={t('coach.services.form.duration')}
            htmlFor="add-service-duration"
            error={errors.duration}
          >
            <div className="relative">
              <input
                id="add-service-duration"
                type="number"
                min={1}
                step={1}
                value={duration}
                onChange={(e) => {
                  setDuration(e.target.value);
                  setErrors((prev) => ({ ...prev, duration: undefined }));
                }}
                className={`${ADMIN_INPUT_CLASS} pr-10`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['Inter'] text-[13px] text-[#8A8A8A] pointer-events-none select-none">
                {t('coach.services.durationUnit')}
              </span>
            </div>
          </AdminFormField>

          <AdminFormField
            label={t('coach.services.form.price')}
            htmlFor="add-service-price"
            error={errors.price}
          >
            <div className="relative">
              <input
                id="add-service-price"
                type="number"
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setErrors((prev) => ({ ...prev, price: undefined }));
                }}
                className={`${ADMIN_INPUT_CLASS} pr-8`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['Inter'] text-[13px] text-[#8A8A8A] pointer-events-none select-none">
                zł
              </span>
            </div>
          </AdminFormField>
        </div>
      )}
    </AdminFormDialog>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type StatusFilter = 'active' | 'archived';

export default function CoachServices() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [showAdd, setShowAdd] = useState(false);
  const [editingService, setEditingService] = useState<CoachService | null>(
    null,
  );
  const [confirmService, setConfirmService] = useState<CoachService | null>(
    null,
  );
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const {
    data: coachServices = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['coach-services'],
    queryFn: () => coachClient.getServices(),
  });

  const { data: catalogServices = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesClient.getAll(),
  });

  const activeServices = coachServices.filter((s) => s.isActive);
  const archivedServices = coachServices.filter((s) => !s.isActive);

  const filtered = coachServices.filter((s) => {
    if (statusFilter === 'active' && !s.isActive) return false;
    if (statusFilter === 'archived' && s.isActive) return false;
    return true;
  });

  const existingNames = new Set(coachServices.map((s) => s.name));

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (d: CreateCoachServiceData) => coachClient.createService(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach-services'] });
      setShowAdd(false);
      toast.success(t('admin.common.created'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data: d,
    }: {
      id: string;
      data: UpdateCoachServiceData;
    }) => coachClient.updateService(id, d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach-services'] });
      setEditingService(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => coachClient.archiveService(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach-services'] });
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => coachClient.restoreService(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach-services'] });
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const isConfirmLoading =
    archiveMutation.isPending || restoreMutation.isPending;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAdd = (
    service: Service,
    durationMinutes: number,
    priceCents: number,
  ) => {
    createMutation.mutate({
      name: service.name,
      description: service.description ?? undefined,
      durationMinutes,
      priceCents,
      sessionCount: service.sessionCount,
      sortOrder: service.sortOrder,
    });
  };

  const handleUpdate = (id: string, data: UpdateCoachServiceData) => {
    updateMutation.mutate({ id, data });
  };

  const handleToggleRequest = (service: CoachService) => {
    setConfirmService(service);
  };

  const handleToggleConfirm = () => {
    if (!confirmService) return;
    setTogglingId(confirmService.id);
    if (confirmService.isActive) {
      archiveMutation.mutate(confirmService.id);
    } else {
      restoreMutation.mutate(confirmService.id);
    }
    setConfirmService(null);
  };

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns: AdminTableColumn<CoachService>[] = [
    {
      key: 'name',
      header: t('coach.services.table.name'),
      render: (s) => (
        <span className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D]">
          {s.name}
        </span>
      ),
    },
    {
      key: 'duration',
      header: t('coach.services.table.duration'),
      render: (s) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {s.durationMinutes} {t('coach.services.durationUnit')}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('coach.services.table.price'),
      render: (s) => (
        <span className="font-['Inter'] text-[14px] font-semibold text-[#2D2D2D]">
          {formatPrice(s.priceCents)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('coach.services.table.status'),
      render: (s) => (
        <span
          className={[
            'inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium font-["Inter"]',
            s.isActive
              ? 'text-[#0D9488] bg-[#F0FDFA] border border-[#0D9488]/20'
              : 'text-[#6B6B6B] bg-[#F5F5F5] border border-[#E8E4DF]',
          ].join(' ')}
        >
          {s.isActive
            ? t('coach.services.status.active')
            : t('coach.services.status.archived')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('coach.services.table.actions'),
      render: (s) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditingService(s)}
            title={t('coach.services.actions.edit')}
            aria-label={t('coach.services.actions.editService')}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#0D9488] hover:bg-[#F0FDFA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleRequest(s)}
            disabled={togglingId === s.id}
            title={
              s.isActive
                ? t('coach.services.actions.archive')
                : t('coach.services.actions.restore')
            }
            aria-label={
              s.isActive
                ? t('coach.services.actions.archiveService')
                : t('coach.services.actions.restoreService')
            }
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#0D9488] hover:bg-[#F0FDFA] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
          >
            {s.isActive ? (
              <ToggleRight size={17} style={{ color: TEAL }} />
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
        title={t('coach.services.title')}
        description={t('coach.services.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          icon={Briefcase}
          label={t('coach.services.stats.total')}
          value={isLoading ? '—' : coachServices.length}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('coach.services.stats.active')}
          value={isLoading ? '—' : activeServices.length}
        />
        <AdminStatCard
          icon={Archive}
          label={t('coach.services.stats.archived')}
          value={isLoading ? '—' : archivedServices.length}
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-4">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'active',
              label: t('coach.services.filter.active'),
              count: activeServices.length,
            },
            {
              value: 'archived',
              label: t('coach.services.filter.archived'),
              count: archivedServices.length,
            },
          ]}
          active={statusFilter}
          onChange={setStatusFilter}
          isLoading={isLoading}
        />
      </div>

      {/* Action bar */}
      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className={[
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
            "font-['Inter'] text-[14px] font-medium text-white",
            'transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          ].join(' ')}
          style={{ backgroundColor: TEAL }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              '#0F766E';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL;
          }}
        >
          <Plus size={16} />
          {t('coach.services.addService')}
        </button>
      </div>

      {/* Table */}
      <AdminTable<CoachService>
        columns={columns}
        data={filtered}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('coach.services.errors.loadFailed')}
        emptyIcon={Briefcase}
        emptyMessage={t('coach.services.empty.noServices')}
        ariaLabel={t('coach.services.table.label')}
      />

      {/* Add service dialog */}
      {showAdd && (
        <AddServiceDialog
          catalog={catalogServices}
          existingNames={existingNames}
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          isSaving={isSaving}
        />
      )}

      {/* Edit service dialog */}
      {editingService && (
        <CoachServiceEditDialog
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleUpdate}
          isSaving={updateMutation.isPending}
        />
      )}

      {/* Archive / Restore confirmation */}
      <ConfirmDialog
        open={!!confirmService}
        title={
          confirmService?.isActive
            ? t('coach.services.actions.archiveService')
            : t('coach.services.actions.restoreService')
        }
        message={`${
          confirmService?.isActive
            ? t('coach.services.confirm.archive')
            : t('coach.services.confirm.restore')
        } "${confirmService?.name ?? ''}"?`}
        confirmLabel={
          confirmService?.isActive
            ? t('coach.services.actions.archive')
            : t('coach.services.actions.restore')
        }
        variant={confirmService?.isActive ? 'warning' : 'default'}
        isLoading={isConfirmLoading}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmService(null)}
      />
    </div>
  );
}
