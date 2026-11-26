import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eraser, History } from 'lucide-react';
import { cmsClient } from '@/clients/cms.client';
import { useCMS } from '@/contexts/CMSContext';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/stores/toast.store';
import type { CMSSectionKey } from '@/types/cms.types';

// Record<CMSSectionKey, true> makes TypeScript fail when a new section key is
// added to the union but not listed here.
const SECTION_MAP: Record<CMSSectionKey, true> = {
  navbar: true,
  hero: true,
  home: true,
  about: true,
  howIWork: true,
  services: true,
  blog: true,
  blogPost: true,
  contact: true,
  footer: true,
  confirmation: true,
  booking: true,
  newsletter: true,
  cta: true,
  testimonials: true,
  auth: true,
  notFound: true,
  webDesign: true,
  privacy: true,
  terms: true,
  youtube: true,
  mamyNastolatkow: true,
  motherWifeLover: true,
  kochanka: true,
  events: true,
  homeNow: true,
  aboutNow: true,
  quiz: true,
  roles: true,
};
const ALL_SECTIONS = Object.keys(SECTION_MAP) as CMSSectionKey[];

const CONFIRM_WORD = 'CLEAN';
const BACKUPS_KEY = ['cms-backups'];

/**
 * Admin "Clean CMS" card: resets CMS text overrides of selected sections to
 * the static defaults in code, plus a list of backups with restore.
 */
export function CleanCmsPanel() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { refresh } = useCMS();

  const [selected, setSelected] = useState<Set<CMSSectionKey>>(new Set());
  const [keepMedia, setKeepMedia] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [restoreId, setRestoreId] = useState<string | null>(null);

  const { data: backups = [] } = useQuery({
    queryKey: BACKUPS_KEY,
    queryFn: () => cmsClient.listBackups(),
  });

  // Drop the local CMS cache and refetch so the change shows immediately.
  const refreshClientContent = async () => {
    try {
      localStorage.removeItem('spirala_cms_content');
    } catch {
      // ignore storage errors
    }
    await refresh();
    void queryClient.invalidateQueries({ queryKey: BACKUPS_KEY });
  };

  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : t('admin.common.error'));

  const resetMutation = useMutation({
    mutationFn: () => cmsClient.resetSections([...selected], keepMedia),
    onSuccess: async (res) => {
      setConfirmOpen(false);
      setTyped('');
      setSelected(new Set());
      toast.success(
        t('admin.languages.clean.success', {
          removed: res.removed,
          kept: res.kept,
          backupId: res.backupId.slice(0, 8),
        }),
      );
      await refreshClientContent();
    },
    onError,
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => cmsClient.restoreBackup(id),
    onSuccess: async () => {
      setRestoreId(null);
      toast.success(t('admin.languages.clean.restoreSuccess'));
      await refreshClientContent();
    },
    onError,
  });

  const allSelected = selected.size === ALL_SECTIONS.length;
  const toggle = (key: CMSSectionKey) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const restoreTarget = backups.find((b) => b.id === restoreId);
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language);

  return (
    <div className="mb-6 rounded-xl border border-[#EDE8DC] bg-surface overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <Eraser size={18} className="text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="font-['Inter'] text-[13px] font-semibold text-ink">
              {t('admin.languages.clean.title')}
            </p>
            <p className="font-['Inter'] text-[12px] text-ink-soft leading-snug mt-0.5">
              {t('admin.languages.clean.description')}
            </p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-['Inter'] text-[12px] font-medium text-ink">
              {t('admin.languages.clean.sections')}
            </p>
            <button
              type="button"
              onClick={() =>
                setSelected(allSelected ? new Set() : new Set(ALL_SECTIONS))
              }
              className="font-['Inter'] text-[12px] text-brand hover:underline"
            >
              {allSelected
                ? t('admin.languages.clean.selectNone')
                : t('admin.languages.clean.selectAll')}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-1.5">
            {ALL_SECTIONS.map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 font-['Inter'] text-[12px] text-ink cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={() => toggle(key)}
                  className="accent-[var(--color-brand)]"
                />
                {key}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 py-2 px-3 bg-white rounded-lg">
          <div>
            <p className="font-['Inter'] text-[13px] text-ink">
              {t('admin.languages.clean.keepMedia')}
            </p>
            <p className="font-['Inter'] text-[11px] text-ink-muted">
              {t('admin.languages.clean.keepMediaHint')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={keepMedia}
            onClick={() => setKeepMedia((v) => !v)}
            className={[
              'relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
              keepMedia ? 'bg-brand' : 'bg-[#DDDDDD]',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                keepMedia ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={selected.size === 0 || resetMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-['Inter'] text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <Eraser size={14} />
          {resetMutation.isPending
            ? t('admin.languages.clean.running')
            : t('admin.languages.clean.button', { count: selected.size })}
        </button>

        <div className="border-t border-[#EDE8DC] pt-3">
          <p className="flex items-center gap-2 font-['Inter'] text-[12px] font-medium text-ink mb-2">
            <History size={14} />
            {t('admin.languages.clean.backupsTitle')}
          </p>
          {backups.length === 0 ? (
            <p className="font-['Inter'] text-[12px] text-ink-muted">
              {t('admin.languages.clean.backupsEmpty')}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {backups.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 font-['Inter'] text-[12px] text-ink"
                >
                  <span className="min-w-0 truncate">
                    {formatDate(b.createdAt)} — {b.reason}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRestoreId(b.id)}
                    disabled={restoreMutation.isPending}
                    className="flex-shrink-0 px-3 py-1 rounded-lg border border-[#EDE8DC] bg-white hover:bg-surface text-[12px] disabled:opacity-50"
                  >
                    {t('admin.languages.clean.restore')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={t('admin.languages.clean.confirmTitle')}
        message={t('admin.languages.clean.confirmMessage', {
          count: selected.size,
        })}
        confirmLabel={
          resetMutation.isPending
            ? t('admin.languages.clean.running')
            : t('admin.languages.clean.button', { count: selected.size })
        }
        variant="danger"
        isLoading={resetMutation.isPending}
        confirmDisabled={typed !== CONFIRM_WORD}
        onConfirm={() => resetMutation.mutate()}
        onCancel={() => {
          setConfirmOpen(false);
          setTyped('');
        }}
      >
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={t('admin.languages.clean.confirmPlaceholder')}
          aria-label={t('admin.languages.clean.confirmPlaceholder')}
          autoFocus
          className="w-full rounded-lg border border-line px-3 py-2 font-['Inter',sans-serif] text-[14px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={restoreId !== null}
        title={t('admin.languages.clean.restoreTitle')}
        message={t('admin.languages.clean.restoreMessage', {
          date: restoreTarget ? formatDate(restoreTarget.createdAt) : '',
        })}
        confirmLabel={t('admin.languages.clean.restore')}
        variant="warning"
        isLoading={restoreMutation.isPending}
        onConfirm={() => restoreId && restoreMutation.mutate(restoreId)}
        onCancel={() => setRestoreId(null)}
      />
    </div>
  );
}
