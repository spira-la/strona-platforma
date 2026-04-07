import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  CheckCircle2,
  Archive,
  TrendingUp,
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
  servicesClient,
  type Service,
  type CreateServiceData,
} from '@/clients/services.client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} zł`;
}

function deriveAvgPrice(services: Service[]): string {
  if (services.length === 0) return '— zł';
  const avg = services.reduce((sum, s) => sum + s.priceCents, 0) / services.length;
  return formatPrice(avg);
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  name: string;
  description: string;
  durationMinutes: string;
  sessionCount: string;
  price: string; // złoty (display), converted to cents on submit
  sortOrder: string;
  isActive: boolean;
}

function buildInitialForm(service?: Service): FormState {
  if (service) {
    return {
      name: service.name,
      description: service.description ?? '',
      durationMinutes: String(service.durationMinutes),
      sessionCount: String(service.sessionCount),
      price: (service.priceCents / 100).toFixed(2),
      sortOrder: String(service.sortOrder),
      isActive: service.isActive,
    };
  }
  return {
    name: '',
    description: '',
    durationMinutes: '',
    sessionCount: '1',
    price: '',
    sortOrder: '0',
    isActive: true,
  };
}

function formToApiData(form: FormState): CreateServiceData {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    durationMinutes: Number(form.durationMinutes),
    sessionCount: Number(form.sessionCount) || 1,
    priceCents: Math.round(Number(form.price) * 100),
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };
}

// ---------------------------------------------------------------------------
// ServiceFormDialog
// ---------------------------------------------------------------------------

interface ServiceFormDialogProps {
  editingService: Service | null;
  onClose: () => void;
  onSave: (data: CreateServiceData, id?: string) => void;
  isSaving: boolean;
}

function ServiceFormDialog({
  editingService,
  onClose,
  onSave,
  isSaving,
}: ServiceFormDialogProps) {
  const { t } = useTranslation();

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(editingService ?? undefined),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      next.name = t('admin.services.validation.nameRequired');
    }
    const duration = Number(form.durationMinutes);
    if (!form.durationMinutes || isNaN(duration) || duration < 1) {
      next.durationMinutes = t('admin.services.validation.durationRequired');
    }
    const price = Number(form.price);
    if (!form.price || isNaN(price) || price <= 0) {
      next.price = t('admin.services.validation.priceRequired');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formToApiData(form), editingService?.id);
  };

  const title = editingService
    ? t('admin.services.editService')
    : t('admin.services.newService');

  const submitLabel = editingService
    ? t('admin.services.form.save')
    : t('admin.services.form.create');

  return (
    <AdminFormDialog
      open
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={submitLabel}
    >
      {/* Name */}
      <AdminFormField
        label={t('admin.services.form.name')}
        htmlFor="service-name"
        error={errors.name}
      >
        <input
          id="service-name"
          type="text"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder={t('admin.services.form.namePlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoFocus
          autoComplete="off"
        />
      </AdminFormField>

      {/* Description */}
      <AdminFormField
        label={t('admin.services.form.description')}
        htmlFor="service-desc"
        error={errors.description}
      >
        <textarea
          id="service-desc"
          rows={3}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder={t('admin.services.form.descriptionPlaceholder')}
          className={`${ADMIN_INPUT_CLASS} resize-none`}
        />
      </AdminFormField>

      {/* Duration + Sessions (side by side) */}
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField
          label={t('admin.services.form.duration')}
          htmlFor="service-duration"
          error={errors.durationMinutes}
        >
          <div className="relative">
            <input
              id="service-duration"
              type="number"
              min={1}
              step={1}
              value={form.durationMinutes}
              onChange={(e) => setField('durationMinutes', e.target.value)}
              placeholder={t('admin.services.form.durationPlaceholder')}
              className={`${ADMIN_INPUT_CLASS} pr-10`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['Inter'] text-[13px] text-[#8A8A8A] pointer-events-none select-none">
              {t('admin.services.durationUnit')}
            </span>
          </div>
        </AdminFormField>

        <AdminFormField
          label={t('admin.services.form.sessionCount')}
          htmlFor="service-sessions"
          error={errors.sessionCount}
        >
          <input
            id="service-sessions"
            type="number"
            min={1}
            step={1}
            value={form.sessionCount}
            onChange={(e) => setField('sessionCount', e.target.value)}
            placeholder={t('admin.services.form.sessionCountPlaceholder')}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>
      </div>

      {/* Price */}
      <AdminFormField
        label={t('admin.services.form.price')}
        htmlFor="service-price"
        error={errors.price}
      >
        <div className="relative">
          <input
            id="service-price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setField('price', e.target.value)}
            placeholder={t('admin.services.form.pricePlaceholder')}
            className={`${ADMIN_INPUT_CLASS} pr-10`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-['Inter'] text-[13px] text-[#8A8A8A] pointer-events-none select-none">
            zł
          </span>
        </div>
      </AdminFormField>

      {/* Sort order */}
      <AdminFormField
        label={t('admin.services.form.sortOrder')}
        htmlFor="service-sort"
        error={errors.sortOrder}
      >
        <input
          id="service-sort"
          type="number"
          min={0}
          step={1}
          value={form.sortOrder}
          onChange={(e) => setField('sortOrder', e.target.value)}
          placeholder={t('admin.services.form.sortOrderPlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      {/* Active toggle */}
      <div className="flex items-center justify-between py-2 px-3 bg-[#F9F6F0] rounded-lg">
        <span className="font-['Inter'] text-[14px] text-[#444444]">
          {t('admin.services.form.activeToggle')}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={form.isActive}
          onClick={() => setField('isActive', !form.isActive)}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]',
            form.isActive ? 'bg-[#B8963E]' : 'bg-[#DDDDDD]',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
              form.isActive ? 'translate-x-6' : 'translate-x-1',
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

type StatusFilter = 'active' | 'inactive';

export default function AdminServices() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [confirmService, setConfirmService] = useState<Service | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesClient.getAll(),
  });

  const services = data ?? [];

  // Derived stats
  const activeServices = services.filter((s) => s.isActive);
  const archivedServices = services.filter((s) => !s.isActive);
  const avgPrice = deriveAvgPrice(services);

  // Filtered list
  const filtered = services.filter((s) => {
    if (statusFilter === 'active' && !s.isActive) return false;
    if (statusFilter === 'inactive' && s.isActive) return false;
    if (
      search.trim() &&
      !s.name.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (d: CreateServiceData) => servicesClient.create(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowDialog(false);
      toast.success(t('admin.common.created'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Partial<CreateServiceData> }) =>
      servicesClient.update(id, d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      setShowDialog(false);
      setEditingService(null);
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => servicesClient.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => servicesClient.restore(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
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

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingService(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (service: Service) => {
    setEditingService(service);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setShowDialog(false);
    setEditingService(null);
  };

  const handleSave = (formData: CreateServiceData, id?: string) => {
    if (id) {
      updateMutation.mutate({ id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleRequest = (service: Service) => {
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

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns: AdminTableColumn<Service>[] = [
    {
      key: 'name',
      header: t('admin.services.table.name'),
      render: (s) => (
        <span className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D]">
          {s.name}
        </span>
      ),
    },
    {
      key: 'duration',
      header: t('admin.services.table.duration'),
      render: (s) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {s.durationMinutes} {t('admin.services.durationUnit')}
        </span>
      ),
    },
    {
      key: 'sessions',
      header: t('admin.services.table.sessions'),
      render: (s) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {s.sessionCount}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('admin.services.table.price'),
      render: (s) => (
        <span className="font-['Inter'] text-[14px] font-semibold text-[#2D2D2D]">
          {formatPrice(s.priceCents)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.services.table.status'),
      render: (s) => (
        <AdminStatusBadge
          variant={s.isActive ? 'success' : 'neutral'}
          label={
            s.isActive
              ? t('admin.services.status.active')
              : t('admin.services.status.inactive')
          }
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.services.table.actions'),
      render: (s) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(s)}
            title={t('admin.services.actions.edit')}
            aria-label={t('admin.services.actions.editService')}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleRequest(s)}
            disabled={togglingId === s.id}
            title={
              s.isActive
                ? t('admin.services.actions.archive')
                : t('admin.services.actions.restore')
            }
            aria-label={
              s.isActive
                ? t('admin.services.actions.archiveService')
                : t('admin.services.actions.restoreService')
            }
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            {s.isActive ? (
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
        title={t('admin.services.title')}
        description={t('admin.services.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <AdminStatCard
          icon={Layers}
          label={t('admin.services.stats.total')}
          value={isLoading ? '—' : services.length}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('admin.services.stats.active')}
          value={isLoading ? '—' : activeServices.length}
        />
        <AdminStatCard
          icon={Archive}
          label={t('admin.services.stats.archived')}
          value={isLoading ? '—' : archivedServices.length}
        />
        <AdminStatCard
          icon={TrendingUp}
          label={t('admin.services.stats.avgPrice')}
          value={isLoading ? '—' : avgPrice}
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-4">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'active',
              label: t('admin.services.filter.active'),
              count: activeServices.length,
            },
            {
              value: 'inactive',
              label: t('admin.services.filter.inactive'),
              count: archivedServices.length,
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
          placeholder={t('admin.services.searchPlaceholder')}
          ariaLabel={t('admin.services.searchLabel')}
          actionLabel={t('admin.services.newService')}
          onAction={handleOpenCreate}
        />
      </div>

      {/* Table */}
      <AdminTable<Service>
        columns={columns}
        data={filtered}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('admin.services.errors.loadFailed')}
        emptyIcon={Layers}
        emptyMessage={
          search
            ? t('admin.services.empty.noResults')
            : t('admin.services.empty.noServices')
        }
        ariaLabel={t('admin.services.table.label')}
      />

      {/* Create / Edit dialog */}
      {showDialog && (
        <ServiceFormDialog
          editingService={editingService}
          onClose={handleCloseDialog}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Archive / Restore confirmation */}
      <ConfirmDialog
        open={!!confirmService}
        title={
          confirmService?.isActive
            ? t('admin.services.actions.archiveService')
            : t('admin.services.actions.restoreService')
        }
        message={`${
          confirmService?.isActive
            ? t('admin.services.confirm.archive')
            : t('admin.services.confirm.restore')
        } "${confirmService?.name ?? ''}"?`}
        confirmLabel={
          confirmService?.isActive
            ? t('admin.services.actions.archive')
            : t('admin.services.actions.restore')
        }
        variant={confirmService?.isActive ? 'warning' : 'default'}
        isLoading={isConfirmLoading}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmService(null)}
      />
    </div>
  );
}
