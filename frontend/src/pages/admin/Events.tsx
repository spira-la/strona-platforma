import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarHeart,
  CalendarClock,
  FilePen,
  Users,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ImagePlus,
  X,
  Loader2,
  Mail,
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
  eventsClient,
  type AdminEvent,
  type EventPayload,
  type EventRegistration,
} from '@/clients/events.client';

// ---------------------------------------------------------------------------
// Admin — Wydarzenia (2026-11). The coach adds her own events here; visitors
// sign up on /wydarzenia with an e-mail form (no payment).
// ---------------------------------------------------------------------------

const QUERY_KEY = ['admin-events'] as const;

/** ISO → value for <input type="datetime-local"> in the browser's zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function isPast(e: AdminEvent): boolean {
  return new Date(e.endsAt ?? e.startsAt).getTime() < Date.now();
}

function formatDateTime(iso: string, lang: string): string {
  return new Intl.DateTimeFormat(lang, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-surface px-3 py-2">
      <div>
        <span className="font-['Inter'] text-[14px] text-ink">{label}</span>
        {hint && (
          <p className="font-['Inter'] text-[12px] text-ink-muted">{hint}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          checked ? 'bg-action' : 'bg-[#DDDDDD]',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  isOnline: boolean;
  priceLabel: string;
  capacity: string;
  imageUrl: string;
  isPublished: boolean;
  registrationOpen: boolean;
}

function buildInitialForm(e?: AdminEvent | null): FormState {
  return {
    title: e?.title ?? '',
    description: e?.description ?? '',
    startsAt: toLocalInput(e?.startsAt ?? null),
    endsAt: toLocalInput(e?.endsAt ?? null),
    location: e?.location ?? '',
    isOnline: e?.isOnline ?? false,
    priceLabel: e?.priceLabel ?? '',
    capacity: e?.capacity ? String(e.capacity) : '',
    imageUrl: e?.imageUrl ?? '',
    isPublished: e?.isPublished ?? true,
    registrationOpen: e?.registrationOpen ?? true,
  };
}

function formToPayload(f: FormState): EventPayload {
  const capacity = Number.parseInt(f.capacity, 10);
  return {
    title: f.title.trim(),
    description: f.description.trim() || null,
    startsAt: fromLocalInput(f.startsAt) ?? '',
    endsAt: fromLocalInput(f.endsAt),
    location: f.location.trim() || null,
    isOnline: f.isOnline,
    priceLabel: f.priceLabel.trim() || null,
    capacity: Number.isFinite(capacity) && capacity > 0 ? capacity : null,
    imageUrl: f.imageUrl || null,
    isPublished: f.isPublished,
    registrationOpen: f.registrationOpen,
  };
}

interface EventFormDialogProps {
  editing: AdminEvent | null;
  onClose: () => void;
  onSave: (data: EventPayload, id?: string) => void;
  isSaving: boolean;
}

function EventFormDialog({
  editing,
  onClose,
  onSave,
  isSaving,
}: EventFormDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(() => buildInitialForm(editing));
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.title.trim().length < 2)
      next.title = t('admin.events.validation.titleRequired');
    if (!form.startsAt)
      next.startsAt = t('admin.events.validation.startRequired');
    if (
      form.startsAt &&
      form.endsAt &&
      new Date(form.endsAt) < new Date(form.startsAt)
    )
      next.endsAt = t('admin.events.validation.endBeforeStart');
    const cap = Number.parseInt(form.capacity, 10);
    if (form.capacity && (Number.isNaN(cap) || cap <= 0))
      next.capacity = t('admin.events.validation.capacityPositive');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading || !validate()) return;
    onSave(formToPayload(form), editing?.id);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await eventsClient.uploadImage(file);
      setField('imageUrl', url);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('admin.common.error'),
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <AdminFormDialog
      open
      title={editing ? t('admin.events.editEvent') : t('admin.events.newEvent')}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={
        editing ? t('admin.events.form.save') : t('admin.events.form.create')
      }
    >
      <AdminFormField
        label={t('admin.events.form.title')}
        htmlFor="event-title"
        error={errors.title}
      >
        <input
          id="event-title"
          type="text"
          value={form.title}
          onChange={(e) => setField('title', e.target.value)}
          placeholder={t('admin.events.form.titlePlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoFocus
          autoComplete="off"
        />
      </AdminFormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdminFormField
          label={t('admin.events.form.startsAt')}
          htmlFor="event-start"
          error={errors.startsAt}
        >
          <input
            id="event-start"
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setField('startsAt', e.target.value)}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>
        <AdminFormField
          label={t('admin.events.form.endsAt')}
          htmlFor="event-end"
          error={errors.endsAt}
        >
          <input
            id="event-end"
            type="datetime-local"
            value={form.endsAt}
            onChange={(e) => setField('endsAt', e.target.value)}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>
      </div>

      <Toggle
        label={t('admin.events.form.isOnline')}
        checked={form.isOnline}
        onChange={(v) => setField('isOnline', v)}
      />

      <AdminFormField
        label={
          form.isOnline
            ? t('admin.events.form.locationOnline')
            : t('admin.events.form.location')
        }
        htmlFor="event-location"
      >
        <input
          id="event-location"
          type="text"
          value={form.location}
          onChange={(e) => setField('location', e.target.value)}
          placeholder={
            form.isOnline
              ? t('admin.events.form.locationOnlinePlaceholder')
              : t('admin.events.form.locationPlaceholder')
          }
          className={ADMIN_INPUT_CLASS}
          autoComplete="off"
        />
      </AdminFormField>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <AdminFormField
          label={t('admin.events.form.price')}
          htmlFor="event-price"
        >
          <input
            id="event-price"
            type="text"
            value={form.priceLabel}
            onChange={(e) => setField('priceLabel', e.target.value)}
            placeholder={t('admin.events.form.pricePlaceholder')}
            className={ADMIN_INPUT_CLASS}
            autoComplete="off"
          />
        </AdminFormField>
        <AdminFormField
          label={t('admin.events.form.capacity')}
          htmlFor="event-capacity"
          error={errors.capacity}
        >
          <input
            id="event-capacity"
            type="number"
            min={1}
            step={1}
            value={form.capacity}
            onChange={(e) => setField('capacity', e.target.value)}
            placeholder={t('admin.events.form.capacityPlaceholder')}
            className={ADMIN_INPUT_CLASS}
          />
        </AdminFormField>
      </div>

      <AdminFormField
        label={t('admin.events.form.description')}
        htmlFor="event-description"
      >
        <textarea
          id="event-description"
          rows={5}
          value={form.description}
          onChange={(e) => setField('description', e.target.value)}
          placeholder={t('admin.events.form.descriptionPlaceholder')}
          className={`${ADMIN_INPUT_CLASS} resize-y`}
        />
      </AdminFormField>

      {/* Image */}
      <AdminFormField
        label={t('admin.events.form.image')}
        htmlFor="event-image"
      >
        {form.imageUrl ? (
          <div className="relative overflow-hidden rounded-lg border border-line">
            <img
              src={form.imageUrl}
              alt=""
              className="h-40 w-full object-cover"
            />
            <button
              type="button"
              onClick={() => setField('imageUrl', '')}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-ink shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={t('admin.events.form.removeImage')}
              title={t('admin.events.form.removeImage')}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-4 py-6 font-['Inter'] text-[14px] text-ink-soft transition-colors hover:border-brand hover:text-ink disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <ImagePlus size={18} />
            )}
            {uploading
              ? t('admin.events.form.uploading')
              : t('admin.events.form.addImage')}
          </button>
        )}
        <input
          ref={fileRef}
          id="event-image"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <p className="mt-1 font-['Inter'] text-[12px] text-ink-muted">
          {t('admin.events.form.imageHint')}
        </p>
      </AdminFormField>

      <Toggle
        label={t('admin.events.form.isPublished')}
        hint={t('admin.events.form.isPublishedHint')}
        checked={form.isPublished}
        onChange={(v) => setField('isPublished', v)}
      />
      <Toggle
        label={t('admin.events.form.registrationOpen')}
        hint={t('admin.events.form.registrationOpenHint')}
        checked={form.registrationOpen}
        onChange={(v) => setField('registrationOpen', v)}
      />
    </AdminFormDialog>
  );
}

// ---------------------------------------------------------------------------
// Registrations dialog — list, copy e-mails, remove a sign-up
// ---------------------------------------------------------------------------

function RegistrationsDialog({
  event,
  onClose,
}: {
  event: AdminEvent;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [confirmReg, setConfirmReg] = useState<EventRegistration | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-event-registrations', event.id],
    queryFn: () => eventsClient.getRegistrations(event.id),
  });
  const regs = data ?? [];

  const removeMutation = useMutation({
    mutationFn: (id: string) => eventsClient.removeRegistration(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['admin-event-registrations', event.id],
      });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setConfirmReg(null);
      toast.success(t('admin.common.deleted'));
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : t('admin.common.error')),
  });

  // Submit = copy all e-mail addresses (paste them into BCC to write to everyone)
  const handleCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regs.length === 0) {
      onClose();
      return;
    }
    try {
      await navigator.clipboard.writeText(regs.map((r) => r.email).join(', '));
      toast.success(t('admin.events.registrations.copied'));
    } catch {
      toast.error(t('admin.common.error'));
    }
  };

  return (
    <>
      <AdminFormDialog
        open
        title={`${t('admin.events.registrations.title')}: ${event.title}`}
        onClose={onClose}
        onSubmit={(e) => void handleCopy(e)}
        submitLabel={
          regs.length > 0
            ? t('admin.events.registrations.copyEmails')
            : t('admin.events.registrations.close')
        }
        cancelLabel={t('admin.events.registrations.close')}
      >
        <p className="font-['Inter'] text-[13px] text-ink-soft">
          {t('admin.events.registrations.count', {
            count: regs.length,
            capacity: event.capacity ?? '∞',
          })}
        </p>
        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 size={20} className="animate-spin text-ink-muted" />
          </div>
        )}
        {isError && (
          <p className="font-['Inter'] text-[14px] text-red-600">
            {t('admin.events.errors.loadFailed')}
          </p>
        )}
        {!isLoading && !isError && regs.length === 0 && (
          <p className="py-4 text-center font-['Inter'] text-[14px] text-ink-muted">
            {t('admin.events.registrations.empty')}
          </p>
        )}
        <ul className="divide-y divide-line">
          {regs.map((r) => (
            <li key={r.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-['Inter'] text-[14px] font-medium text-ink">
                  {r.fullName}
                </p>
                <a
                  href={`mailto:${r.email}`}
                  className="inline-flex items-center gap-1 break-all font-['Inter'] text-[13px] text-brand-dark hover:underline"
                >
                  <Mail size={13} aria-hidden="true" />
                  {r.email}
                </a>
                {r.phone && (
                  <p className="font-['Inter'] text-[13px] text-ink-soft">
                    {r.phone}
                  </p>
                )}
                {r.message && (
                  <p className="mt-1 whitespace-pre-line font-['Inter'] text-[13px] italic text-ink-soft">
                    {r.message}
                  </p>
                )}
                <p className="mt-1 font-['Inter'] text-[11px] text-ink-muted">
                  {formatDateTime(r.createdAt, i18n.language)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmReg(r)}
                className="rounded p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label={t('admin.events.registrations.remove')}
                title={t('admin.events.registrations.remove')}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      </AdminFormDialog>

      <ConfirmDialog
        open={!!confirmReg}
        title={t('admin.events.registrations.remove')}
        message={`${t('admin.events.registrations.confirmRemove')} "${confirmReg?.fullName ?? ''}"?`}
        confirmLabel={t('admin.events.actions.delete')}
        variant="warning"
        isLoading={removeMutation.isPending}
        onConfirm={() => confirmReg && removeMutation.mutate(confirmReg.id)}
        onCancel={() => setConfirmReg(null)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Filter = 'upcoming' | 'drafts' | 'past';

export default function AdminEvents() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [regsFor, setRegsFor] = useState<AdminEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminEvent | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => eventsClient.getAllAdmin(),
  });
  const events = data ?? [];

  const upcoming = events
    .filter((e) => e.isPublished && !isPast(e))
    .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt));
  const drafts = events.filter((e) => !e.isPublished && !isPast(e));
  const past = events.filter((e) => isPast(e));
  const totalRegs = upcoming.reduce((n, e) => n + e.registrationsCount, 0);

  const byFilter = { upcoming, drafts, past }[filter];
  const filtered = search.trim()
    ? byFilter.filter((e) =>
        e.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : byFilter;

  const invalidate = () =>
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const onError = (err: unknown) =>
    toast.error(err instanceof Error ? err.message : t('admin.common.error'));

  const createMutation = useMutation({
    mutationFn: (d: EventPayload) => eventsClient.create(d),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      toast.success(t('admin.common.created'));
    },
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, d }: { id: string; d: Partial<EventPayload> }) =>
      eventsClient.update(id, d),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setEditing(null);
      toast.success(t('admin.common.updated'));
    },
    onError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsClient.remove(id),
    onSuccess: () => {
      invalidate();
      setConfirmDelete(null);
      toast.success(t('admin.common.deleted'));
    },
    onError,
  });

  const handleSave = (d: EventPayload, id?: string) => {
    if (id) updateMutation.mutate({ id, d });
    else createMutation.mutate(d);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const iconBtn =
    'p-1.5 rounded text-ink-muted hover:text-brand hover:bg-surface transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand';

  const columns: AdminTableColumn<AdminEvent>[] = [
    {
      key: 'date',
      header: t('admin.events.table.date'),
      render: (e) => (
        <span className="whitespace-nowrap font-['Inter'] text-[13px] text-ink">
          {formatDateTime(e.startsAt, i18n.language)}
        </span>
      ),
    },
    {
      key: 'title',
      header: t('admin.events.table.title'),
      render: (e) => (
        <span className="font-['Inter'] text-[14px] font-medium text-ink">
          {e.title}
        </span>
      ),
    },
    {
      key: 'place',
      header: t('admin.events.table.place'),
      render: (e) => (
        <span className="font-['Inter'] text-[13px] text-ink-soft">
          {e.isOnline ? t('admin.events.online') : (e.location ?? '—')}
        </span>
      ),
    },
    {
      key: 'registrations',
      header: t('admin.events.table.registrations'),
      render: (e) => (
        <button
          type="button"
          onClick={() => setRegsFor(e)}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-['Inter'] text-[13px] text-ink hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          title={t('admin.events.actions.registrations')}
        >
          <Users size={14} className="text-ink-muted" />
          {e.registrationsCount}
          {e.capacity ? ` / ${e.capacity}` : ''}
        </button>
      ),
    },
    {
      key: 'status',
      header: t('admin.events.table.status'),
      render: (e) => (
        <div className="flex flex-wrap gap-1">
          <AdminStatusBadge
            variant={e.isPublished ? 'success' : 'neutral'}
            label={
              e.isPublished
                ? t('admin.events.status.published')
                : t('admin.events.status.draft')
            }
          />
          {!e.registrationOpen && (
            <AdminStatusBadge
              variant="warning"
              label={t('admin.events.status.closed')}
            />
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('admin.events.table.actions'),
      render: (e) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setEditing(e);
              setShowForm(true);
            }}
            className={iconBtn}
            title={t('admin.events.actions.edit')}
            aria-label={t('admin.events.actions.edit')}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            onClick={() => setRegsFor(e)}
            className={iconBtn}
            title={t('admin.events.actions.registrations')}
            aria-label={t('admin.events.actions.registrations')}
          >
            <Users size={15} />
          </button>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={() =>
              updateMutation.mutate({
                id: e.id,
                d: { isPublished: !e.isPublished },
              })
            }
            className={iconBtn}
            title={
              e.isPublished
                ? t('admin.events.actions.unpublish')
                : t('admin.events.actions.publish')
            }
            aria-label={
              e.isPublished
                ? t('admin.events.actions.unpublish')
                : t('admin.events.actions.publish')
            }
          >
            {e.isPublished ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(e)}
            className={`${iconBtn} hover:!text-red-600`}
            title={t('admin.events.actions.delete')}
            aria-label={t('admin.events.actions.delete')}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={t('admin.events.title')}
        description={t('admin.events.description')}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
        <AdminStatCard
          icon={CalendarClock}
          label={t('admin.events.stats.upcoming')}
          value={isLoading ? '—' : upcoming.length}
        />
        <AdminStatCard
          icon={Users}
          label={t('admin.events.stats.registrations')}
          value={isLoading ? '—' : totalRegs}
        />
        <AdminStatCard
          icon={FilePen}
          label={t('admin.events.stats.drafts')}
          value={isLoading ? '—' : drafts.length}
        />
      </div>

      <div className="mb-4">
        <AdminFilterTabs<Filter>
          tabs={[
            {
              value: 'upcoming',
              label: t('admin.events.filter.upcoming'),
              count: upcoming.length,
            },
            {
              value: 'drafts',
              label: t('admin.events.filter.drafts'),
              count: drafts.length,
            },
            {
              value: 'past',
              label: t('admin.events.filter.past'),
              count: past.length,
            },
          ]}
          active={filter}
          onChange={setFilter}
          isLoading={isLoading}
        />
      </div>

      <div className="mb-5">
        <AdminSearchBar
          value={search}
          onChange={setSearch}
          placeholder={t('admin.events.searchPlaceholder')}
          ariaLabel={t('admin.events.searchLabel')}
          actionLabel={t('admin.events.newEvent')}
          onAction={() => {
            setEditing(null);
            setShowForm(true);
          }}
        />
      </div>

      <AdminTable<AdminEvent>
        columns={columns}
        data={filtered}
        keyExtractor={(e) => e.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={t('admin.events.errors.loadFailed')}
        emptyIcon={CalendarHeart}
        emptyMessage={
          search
            ? t('admin.events.empty.noResults')
            : t('admin.events.empty.noEvents')
        }
        ariaLabel={t('admin.events.table.label')}
      />

      {showForm && (
        <EventFormDialog
          editing={editing}
          onClose={() => {
            if (isSaving) return;
            setShowForm(false);
            setEditing(null);
          }}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {regsFor && (
        <RegistrationsDialog event={regsFor} onClose={() => setRegsFor(null)} />
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={t('admin.events.actions.delete')}
        message={`${t('admin.events.confirm.delete')} "${confirmDelete?.title ?? ''}"?${
          confirmDelete?.registrationsCount
            ? ` ${t('admin.events.confirm.deleteWithRegistrations', {
                count: confirmDelete.registrationsCount,
              })}`
            : ''
        }`}
        confirmLabel={t('admin.events.actions.delete')}
        variant="warning"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          confirmDelete && deleteMutation.mutate(confirmDelete.id)
        }
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
