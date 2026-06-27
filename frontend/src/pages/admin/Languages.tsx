import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Globe,
  CheckCircle2,
  Archive,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Languages as LanguagesIcon,
  Sparkles,
} from 'lucide-react';
import { cmsClient } from '@/clients/cms.client';
import { useCMS } from '@/contexts/CMSContext';
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
  languagesClient,
  type Language,
  type CreateLanguageData,
} from '@/clients/languages.client';

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  sortOrder: string;
  isActive: boolean;
}

function buildInitialForm(language?: Language): FormState {
  if (language) {
    return {
      code: language.code,
      name: language.name,
      nativeName: language.nativeName ?? '',
      flag: language.flag ?? '',
      sortOrder: String(language.sortOrder ?? 0),
      isActive: language.isActive ?? true,
    };
  }
  return {
    code: '',
    name: '',
    nativeName: '',
    flag: '',
    sortOrder: '0',
    isActive: true,
  };
}

function formToApiData(form: FormState): CreateLanguageData {
  return {
    code: form.code.trim().toLowerCase(),
    name: form.name.trim(),
    nativeName: form.nativeName.trim() || null,
    flag: form.flag.trim() || null,
    sortOrder: Number(form.sortOrder) || 0,
    isActive: form.isActive,
  };
}

// ---------------------------------------------------------------------------
// LanguageFormDialog
// ---------------------------------------------------------------------------

interface LanguageFormDialogProps {
  editingLanguage: Language | null;
  onClose: () => void;
  onSave: (data: CreateLanguageData, id?: string) => void;
  isSaving: boolean;
}

function LanguageFormDialog({
  editingLanguage,
  onClose,
  onSave,
  isSaving,
}: LanguageFormDialogProps) {
  const { t } = useTranslation();

  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(editingLanguage ?? undefined),
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};

    if (!form.code.trim()) {
      next.code = t('admin.languages.validation.codeRequired');
    }
    if (!form.name.trim()) {
      next.name = t('admin.languages.validation.nameRequired');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formToApiData(form), editingLanguage?.id);
  };

  const title = editingLanguage
    ? t('admin.languages.editLanguage')
    : t('admin.languages.newLanguage');

  const submitLabel = editingLanguage
    ? t('admin.languages.form.save')
    : t('admin.languages.form.create');

  return (
    <AdminFormDialog
      open
      title={title}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={submitLabel}
    >
      {/* Code + Flag (side by side) */}
      <div className="grid grid-cols-2 gap-4">
        <AdminFormField
          label={t('admin.languages.form.code')}
          htmlFor="language-code"
          error={errors.code}
        >
          <input
            id="language-code"
            type="text"
            value={form.code}
            onChange={(e) => setField('code', e.target.value)}
            placeholder={t('admin.languages.form.codePlaceholder')}
            className={ADMIN_INPUT_CLASS}
            autoFocus
            autoComplete="off"
            maxLength={10}
          />
        </AdminFormField>

        <AdminFormField
          label={t('admin.languages.form.flag')}
          htmlFor="language-flag"
          error={errors.flag}
        >
          <input
            id="language-flag"
            type="text"
            value={form.flag}
            onChange={(e) => setField('flag', e.target.value)}
            placeholder={t('admin.languages.form.flagPlaceholder')}
            className={ADMIN_INPUT_CLASS}
            autoComplete="off"
          />
        </AdminFormField>
      </div>

      {/* Name */}
      <AdminFormField
        label={t('admin.languages.form.name')}
        htmlFor="language-name"
        error={errors.name}
      >
        <input
          id="language-name"
          type="text"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder={t('admin.languages.form.namePlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoComplete="off"
        />
      </AdminFormField>

      {/* Native Name */}
      <AdminFormField
        label={t('admin.languages.form.nativeName')}
        htmlFor="language-native"
        error={errors.nativeName}
      >
        <input
          id="language-native"
          type="text"
          value={form.nativeName}
          onChange={(e) => setField('nativeName', e.target.value)}
          placeholder={t('admin.languages.form.nativeNamePlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoComplete="off"
        />
      </AdminFormField>

      {/* Sort order */}
      <AdminFormField
        label={t('admin.languages.form.sortOrder')}
        htmlFor="language-sort"
        error={errors.sortOrder}
      >
        <input
          id="language-sort"
          type="number"
          min={0}
          step={1}
          value={form.sortOrder}
          onChange={(e) => setField('sortOrder', e.target.value)}
          placeholder={t('admin.languages.form.sortOrderPlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      {/* Active toggle */}
      <div className="flex items-center justify-between py-2 px-3 bg-[#F9F6F0] rounded-lg">
        <span className="font-['Inter'] text-[14px] text-[#444444]">
          {t('admin.languages.form.activeToggle')}
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

export default function AdminLanguages() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { getUnsetDefaults } = useCMS();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [showDialog, setShowDialog] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [confirmLanguage, setConfirmLanguage] = useState<Language | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ─── CMS retranslate + progress polling ─────────────────────────────────────

  const [isPolling, setIsPolling] = useState(false);
  const unsetDefaults = getUnsetDefaults();

  const { data: translationStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['cms-translation-status'],
    queryFn: () => cmsClient.getTranslationStatus(),
    refetchInterval: isPolling ? 1500 : false,
    enabled: isPolling,
  });

  const isTranslating =
    isPolling &&
    (translationStatus?.isProcessing === true ||
      ((translationStatus?.total ?? 0) > 0 &&
        (translationStatus?.completed ?? 0) < (translationStatus?.total ?? 0)));

  const translationProgress =
    (translationStatus?.total ?? 0) > 0
      ? Math.round(
          ((translationStatus?.completed ?? 0) /
            (translationStatus?.total ?? 1)) *
            100,
        )
      : 0;

  // Stop polling once the queue is done
  if (
    isPolling &&
    translationStatus &&
    !translationStatus.isProcessing &&
    translationStatus.queueSize === 0 &&
    translationStatus.total > 0 &&
    translationStatus.completed >= translationStatus.total
  ) {
    setIsPolling(false);
    toast.success(t('admin.languages.retranslate.success'));
  }

  const retranslateMutation = useMutation({
    mutationFn: () => cmsClient.retranslateAll(),
    onSuccess: (data) => {
      if (data.enqueued === 0) {
        toast.success(t('admin.languages.retranslate.nothingToTranslate'));
      } else {
        setIsPolling(true);
        void refetchStatus();
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const seedAndTranslateMutation = useMutation({
    mutationFn: async () => {
      const defaults = getUnsetDefaults();
      const seedResult =
        defaults.length > 0
          ? await cmsClient.bulkSeed(defaults)
          : { seeded: 0 };
      const retranslateResult = await cmsClient.retranslateAll();
      return {
        seeded: seedResult.seeded,
        enqueued: retranslateResult.enqueued,
      };
    },
    onSuccess: ({ seeded, enqueued }) => {
      if (enqueued === 0 && seeded === 0) {
        toast.success(t('admin.languages.seed.nothingNew'));
      } else {
        toast.success(t('admin.languages.seed.success', { seeded }));
        setIsPolling(true);
        void refetchStatus();
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  // ─── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading, isError } = useQuery({
    queryKey: ['languages'],
    queryFn: () => languagesClient.getAll(),
  });

  const languages = data ?? [];

  const activeLanguages = languages.filter((l) => l.isActive !== false);
  const archivedLanguages = languages.filter((l) => l.isActive === false);

  const filtered = languages.filter((l) => {
    const isActive = l.isActive !== false;
    if (statusFilter === 'active' && !isActive) return false;
    if (statusFilter === 'archived' && isActive) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (
        !l.name.toLowerCase().includes(q) &&
        !l.code.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (d: CreateLanguageData) => languagesClient.create(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['languages'] });
      setShowDialog(false);
      toast.success(t('admin.common.created'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: CreateLanguageData }) =>
      languagesClient.update(id, d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['languages'] });
      setShowDialog(false);
      setEditingLanguage(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => languagesClient.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['languages'] });
      setTogglingId(null);
      toast.success(t('admin.common.updated'));
    },
    onError: (err) => {
      setTogglingId(null);
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => languagesClient.restore(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['languages'] });
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
    setEditingLanguage(null);
    setShowDialog(true);
  };

  const handleOpenEdit = (language: Language) => {
    setEditingLanguage(language);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setShowDialog(false);
    setEditingLanguage(null);
  };

  const handleSave = (formData: CreateLanguageData, id?: string) => {
    if (id) {
      updateMutation.mutate({ id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleRequest = (language: Language) => {
    setConfirmLanguage(language);
  };

  const handleToggleConfirm = () => {
    if (!confirmLanguage) return;
    setTogglingId(confirmLanguage.id);
    if (confirmLanguage.isActive === false) {
      restoreMutation.mutate(confirmLanguage.id);
    } else {
      archiveMutation.mutate(confirmLanguage.id);
    }
    setConfirmLanguage(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─── Table columns ───────────────────────────────────────────────────────────

  const columns: AdminTableColumn<Language>[] = [
    {
      key: 'name',
      header: t('admin.languages.table.name'),
      render: (l) => (
        <span className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D] flex items-center gap-2">
          {l.flag && <span aria-hidden="true">{l.flag}</span>}
          {l.name}
        </span>
      ),
    },
    {
      key: 'code',
      header: t('admin.languages.table.code'),
      render: (l) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B] font-mono uppercase">
          {l.code}
        </span>
      ),
    },
    {
      key: 'nativeName',
      header: t('admin.languages.table.nativeName'),
      render: (l) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {l.nativeName ?? '—'}
        </span>
      ),
    },
    {
      key: 'sortOrder',
      header: t('admin.languages.table.sortOrder'),
      render: (l) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {l.sortOrder ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('admin.languages.table.status'),
      render: (l) => (
        <AdminStatusBadge
          variant={l.isActive === false ? 'neutral' : 'success'}
          label={
            l.isActive === false
              ? t('admin.languages.status.archived')
              : t('admin.languages.status.active')
          }
        />
      ),
    },
    {
      key: 'actions',
      header: t('admin.languages.table.actions'),
      render: (l) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleOpenEdit(l)}
            title={t('admin.languages.actions.edit')}
            aria-label={t('admin.languages.actions.editLanguage')}
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            <Pencil size={15} />
          </button>

          <button
            type="button"
            onClick={() => handleToggleRequest(l)}
            disabled={togglingId === l.id}
            title={
              l.isActive === false
                ? t('admin.languages.actions.restore')
                : t('admin.languages.actions.archive')
            }
            aria-label={
              l.isActive === false
                ? t('admin.languages.actions.restoreLanguage')
                : t('admin.languages.actions.archiveLanguage')
            }
            className="p-1.5 rounded text-[#8A8A8A] hover:text-[#B8963E] hover:bg-[#F9F6F0] transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            {l.isActive === false ? (
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
        title={t('admin.languages.title')}
        description={t('admin.languages.description')}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        <AdminStatCard
          icon={Globe}
          label={t('admin.languages.stats.total')}
          value={isLoading ? '—' : languages.length}
        />
        <AdminStatCard
          icon={CheckCircle2}
          label={t('admin.languages.stats.active')}
          value={isLoading ? '—' : activeLanguages.length}
        />
        <AdminStatCard
          icon={Archive}
          label={t('admin.languages.stats.archived')}
          value={isLoading ? '—' : archivedLanguages.length}
        />
      </div>

      {/* CMS re-translation panel */}
      <div className="mb-6 rounded-xl border border-[#EDE8DC] bg-[#F9F6F0] overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#B8963E]/10 flex items-center justify-center">
              <LanguagesIcon size={18} className="text-[#B8963E]" />
            </div>
            <div className="min-w-0">
              <p className="font-['Inter'] text-[13px] font-semibold text-[#2D2D2D]">
                {t('admin.languages.retranslate.title')}
              </p>
              <p className="font-['Inter'] text-[12px] text-[#6B6B6B] leading-snug mt-0.5">
                {isTranslating && translationStatus
                  ? `${translationStatus.completed} / ${translationStatus.total} ${t('admin.languages.retranslate.fieldsTranslated')}`
                  : t('admin.languages.retranslate.description')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => retranslateMutation.mutate()}
            disabled={retranslateMutation.isPending || isTranslating}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8963E] text-white font-['Inter'] text-[13px] font-medium hover:bg-[#8A6F2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            {retranslateMutation.isPending || isTranslating ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {t('admin.languages.retranslate.running')}
              </>
            ) : (
              <>
                <LanguagesIcon size={14} />
                {t('admin.languages.retranslate.button')}
              </>
            )}
          </button>
        </div>

        {/* Progress bar — only visible while translating */}
        {isTranslating && (translationStatus?.total ?? 0) > 0 && (
          <div className="px-4 pb-4">
            <div className="w-full h-1.5 bg-[#EDE8DC] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B8963E] rounded-full transition-all duration-500"
                style={{ width: `${translationProgress}%` }}
              />
            </div>
            <p className="mt-1.5 font-['Inter'] text-[11px] text-[#8A8A8A] text-right">
              {translationProgress}%
            </p>
          </div>
        )}
      </div>

      {/* Seed static defaults panel */}
      <div className="mb-6 rounded-xl border border-[#EDE8DC] bg-[#F9F6F0] overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#B8963E]/10 flex items-center justify-center">
              <Sparkles size={18} className="text-[#B8963E]" />
            </div>
            <div className="min-w-0">
              <p className="font-['Inter'] text-[13px] font-semibold text-[#2D2D2D]">
                {t('admin.languages.seed.title')}
              </p>
              <p className="font-['Inter'] text-[12px] text-[#6B6B6B] leading-snug mt-0.5">
                {unsetDefaults.length > 0
                  ? t('admin.languages.seed.description', {
                      count: unsetDefaults.length,
                    })
                  : t('admin.languages.seed.descriptionNone')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => seedAndTranslateMutation.mutate()}
            disabled={
              seedAndTranslateMutation.isPending ||
              isTranslating ||
              unsetDefaults.length === 0
            }
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#B8963E] text-white font-['Inter'] text-[13px] font-medium hover:bg-[#8A6F2E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]"
          >
            {seedAndTranslateMutation.isPending || isTranslating ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {t('admin.languages.seed.running')}
              </>
            ) : (
              <>
                <Sparkles size={14} />
                {t('admin.languages.seed.button', {
                  count: unsetDefaults.length,
                })}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4">
        <AdminFilterTabs<StatusFilter>
          tabs={[
            {
              value: 'active',
              label: t('admin.languages.filter.active'),
              count: activeLanguages.length,
            },
            {
              value: 'archived',
              label: t('admin.languages.filter.archived'),
              count: archivedLanguages.length,
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
          placeholder={t('admin.languages.searchPlaceholder')}
          ariaLabel={t('admin.languages.searchLabel')}
          actionLabel={t('admin.languages.newLanguage')}
          onAction={handleOpenCreate}
        />
      </div>

      {/* Table */}
      <AdminTable<Language>
        columns={columns}
        data={filtered}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('admin.languages.errors.loadFailed')}
        emptyIcon={Globe}
        emptyMessage={
          search
            ? t('admin.languages.empty.noResults')
            : t('admin.languages.empty.noLanguages')
        }
        ariaLabel={t('admin.languages.table.label')}
      />

      {/* Create / Edit dialog */}
      {showDialog && (
        <LanguageFormDialog
          editingLanguage={editingLanguage}
          onClose={handleCloseDialog}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* Archive / Restore confirmation */}
      <ConfirmDialog
        open={!!confirmLanguage}
        title={
          confirmLanguage?.isActive === false
            ? t('admin.languages.actions.restoreLanguage')
            : t('admin.languages.actions.archiveLanguage')
        }
        message={`${
          confirmLanguage?.isActive === false
            ? t('admin.languages.confirm.restore')
            : t('admin.languages.confirm.archive')
        } "${confirmLanguage?.name ?? ''}"?`}
        confirmLabel={
          confirmLanguage?.isActive === false
            ? t('admin.languages.actions.restore')
            : t('admin.languages.actions.archive')
        }
        variant={confirmLanguage?.isActive === false ? 'default' : 'warning'}
        isLoading={isConfirmLoading}
        onConfirm={handleToggleConfirm}
        onCancel={() => setConfirmLanguage(null)}
      />
    </div>
  );
}
