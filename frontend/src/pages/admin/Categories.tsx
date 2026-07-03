import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderOpen,
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
  categoriesClient,
  type Category,
  type CreateCategoryData,
} from '@/clients/categories.client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replaceAll(/[^\w\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-');
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  name: string;
  slug: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
}

function buildInitialForm(category?: Category): FormState {
  if (category) {
    return {
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive ?? true,
    };
  }
  return {
    name: '',
    slug: '',
    description: '',
    sortOrder: '0',
    isActive: true,
  };
}

function formToApiData(form: FormState): CreateCategoryData {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || null,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };
}

// ---------------------------------------------------------------------------
// CategoryFormDialog
// ---------------------------------------------------------------------------

interface CategoryFormDialogProps {
  editingCategory: Category | null;
  onClose: () => void;
  onSave: (data: CreateCategoryData, id?: string) => void;
  isSaving: boolean;
}

function CategoryFormDialog({
  editingCategory,
  onClose,
  onSave,
  isSaving,
}: CategoryFormDialogProps) {
  const { t } = useTranslation();

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(editingCategory ?? undefined),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [slugManuallyEdited, setSlugManuallyEdited] =
    useState(!!editingCategory);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleNameChange = (value: string) => {
    setField('name', value);
    if (!slugManuallyEdited) {
      setForm((prev) => ({ ...prev, name: value, slug: generateSlug(value) }));
      setErrors((prev) => ({ ...prev, name: undefined, slug: undefined }));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setField('slug', value);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      next.name = t('admin.categories.validation.nameRequired');
    }
    if (!form.slug.trim()) {
      next.slug = t('admin.categories.validation.slugRequired');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formToApiData(form), editingCategory?.id);
  };

  const title = editingCategory
    ? t('admin.categories.editCategory')
    : t('admin.categories.newCategory');

  const submitLabel = editingCategory
    ? t('admin.categories.form.save')
    : t('admin.categories.form.create');

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
        label={t('admin.categories.form.name')}
        htmlFor="category-name"
        error={errors.name}
      >
        <input
          id="category-name"
          type="text"
          value={form.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder={t('admin.categories.form.namePlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoFocus
          autoComplete="off"
        />
      </AdminFormField>

      {/* Slug */}
      <AdminFormField
        label={t('admin.categories.form.slug')}
        htmlFor="category-slug"
        error={errors.slug}
      >
        <input
          id="category-slug"
          type="text"
          value={form.slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder={t('admin.categories.form.slugPlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoComplete="off"
        />
      </AdminFormField>

      {/* Description */}
      <AdminFormField
        label={t('admin.categories.form.description')}
        htmlFor="category-desc"
        error={errors.description}
      >
        <textarea
          id="category-desc"
          rows={3}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder={t('admin.categories.form.descriptionPlaceholder')}
          className={`${ADMIN_INPUT_CLASS} resize-none`}
        />
      </AdminFormField>

      {/* Sort order */}
      <AdminFormField
        label={t('admin.categories.form.sortOrder')}
        htmlFor="category-sort"
        error={errors.sortOrder}
      >
        <input
          id="category-sort"
          type="number"
          min={0}
          step={1}
          value={form.sortOrder}
          onChange={(e) => setField('sortOrder', e.target.value)}
          placeholder={t('admin.categories.form.sortOrderPlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      {/* Active toggle */}
      <div className="flex items-center justify-between py-2 px-3 bg-[#F9F6F0] rounded-lg">
        <span className="font-['Inter'] text-[14px] text-[#444444]">
          {t('admin.categories.form.activeToggle')}
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

type StatusFilter = 'active' | 'archived';

export default function AdminCategories() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmCategory, setConfirmCategory] = useState<Category | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesClient.getAll(),
  });

  const categories = data ?? [];

  const activeCategories = categories.filter((c) => c.isActive !== false);
  const archivedCategories = categories.filter((c) => c.isActive === false);

  const filtered = categories.filter((c) => {
    const isActive = c.isActive !== false;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'archived' && isActive) return false;
    if (
      search.trim() &&
      !c.name.toLowerCase().includes(search.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (d: CreateCategoryData) => categoriesClient.create(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowDialog(false);
      toast.success(t('admin.common.created'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: CreateCategoryData }) =>
      categoriesClient.update(id, d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowDialog(false);
      setEditingCategory(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => categoriesClient.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => categoriesClient.restore(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
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
    setEditingCategory(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setShowDialog(false);
    setEditingCategory(null);
  };

  const handleSave = (formData: CreateCategoryData, id?: string) => {
    if (id) {
      updateMutation.mutate({ id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleRequest = (category: Category) => {
    setConfirmCategory(category);
  };

  const handleToggleConfirm = () => {
    if (!confirmCategory) return;
    setTogglingId(confirmCategory.id);
    if (confirmCategory.isActive === false) {
      restoreMutation.mutate(confirmCategory.id);
    } else {
      archiveMutation.mutate(confirmCategory.id);
    }
    setConfirmCategory(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns: AdminTableColumn<Category>[] = [
    {
      key: 'name',
      header: t('admin.categories.table.name'),
      render: (c) => (
        <span className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D]">
          {c.name}
        </span>
      ),
    },
    {
      key: 'slug',
      header: t('admin.categories.table.slug'),
      render: (c) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B] font-mono">
          {c.slug}
        </span>
      ),
    },
    {
      key: 'description',
      header: t('admin.categories.table.description'),
      render: (c) => (
        <span
          className="font-['Inter'] text-[13px] text-[#6B6B6B]"
          title={c.description ?? ''}
        >
          {c.description
            ? c.description.length > 60
              ? `${c.description.slice(0, 60)}…`
              : c.description
            : '—'}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: t('admin.categories.table.sortOrder'),
      render: (c) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {c.sortOrder ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.categories.table.status'),
      render: (c) => (
        <AdminStatusBadge
          variant={c.isActive === false ? 'neutral' : 'success'}
          label={
            c.isActive === false
              ? t('admin.categories.status.archived')
              : t('admin.categories.status.active')
          }
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.categories.table.actions'),
      render: (c) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(c)}
            title={t('admin.categories.actions.edit')}
            aria-label={t('admin.categories.actions.editCategory')}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleRequest(c)}
            disabled={togglingId === c.id}
            title={
              c.isActive === false
                ? t('admin.categories.actions.restore')
                : t('admin.categories.actions.archive')
            }
            aria-label={
              c.isActive === false
                ? t('admin.categories.actions.restoreCategory')
                : t('admin.categories.actions.archiveCategory')
            }
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            {c.isActive === false ? (
              <ToggleLeft size={17} />
            ) : (
              <ToggleRight size={17} className="text-[#B8963E]" />
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
        title={t('admin.categories.title')}
        description={t('admin.categories.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          icon={FolderOpen}
          label={t('admin.categories.stats.total')}
          value={isLoading ? '—' : categories.length}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('admin.categories.stats.active')}
          value={isLoading ? '—' : activeCategories.length}
        />
        <AdminStatCard
          icon={Archive}
          label={t('admin.categories.stats.archived')}
          value={isLoading ? '—' : archivedCategories.length}
        />
      </div>

      {/* Status filter tabs */}
      <div className="mb-4">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'active',
              label: t('admin.categories.filter.active'),
              count: activeCategories.length,
            },
            {
              value: 'archived',
              label: t('admin.categories.filter.archived'),
              count: archivedCategories.length,
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
          placeholder={t('admin.categories.searchPlaceholder')}
          ariaLabel={t('admin.categories.searchLabel')}
          actionLabel={t('admin.categories.newCategory')}
          onAction={handleOpenCreate}
        />
      </div>

      {/* Table */}
      <AdminTable<Category>
        columns={columns}
        data={filtered}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('admin.categories.errors.loadFailed')}
        emptyIcon={FolderOpen}
        emptyMessage={
          search
            ? t('admin.categories.empty.noResults')
            : t('admin.categories.empty.noCategories')
        }
        ariaLabel={t('admin.categories.table.label')}
      />

      {/* Create / Edit dialog */}
      {showDialog && (
        <CategoryFormDialog
          editingCategory={editingCategory}
          onClose={handleCloseDialog}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Archive / Restore confirmation */}
      <ConfirmDialog
        open={!!confirmCategory}
        title={
          confirmCategory?.isActive === false
            ? t('admin.categories.actions.restoreCategory')
            : t('admin.categories.actions.archiveCategory')
        }
        message={`${
          confirmCategory?.isActive === false
            ? t('admin.categories.confirm.restore')
            : t('admin.categories.confirm.archive')
        } "${confirmCategory?.name ?? ''}"?`}
        confirmLabel={
          confirmCategory?.isActive === false
            ? t('admin.categories.actions.restore')
            : t('admin.categories.actions.archive')
        }
        variant={confirmCategory?.isActive === false ? 'default' : 'warning'}
        isLoading={isConfirmLoading}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmCategory(null)}
      />
    </div>
  );
}
