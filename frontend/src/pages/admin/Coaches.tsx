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
// Constants
// ---------------------------------------------------------------------------

const TIMEZONES = [
  { value: 'Europe/Warsaw', label: 'Europe/Warsaw (CET)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (CET)' },
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'America/Mexico_City', label: 'America/Mexico_City (CST)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo (BRT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tagsDisplay(tags: string[] | null | undefined, max = 3): string {
  if (!tags || tags.length === 0) return '—';
  const shown = tags.slice(0, max);
  const rest = tags.length - max;
  return rest > 0 ? `${shown.join(', ')} +${rest}` : shown.join(', ');
}

function parseCommaSeparated(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Create wizard — form state
// ---------------------------------------------------------------------------

interface CreateStep1 {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string;
  certifications: string;
  yearsExperience: string;
}

interface CreateStep2 {
  location: string;
  timezone: string;
  languages: string;
  acceptingClients: boolean;
}

function buildStep1(): CreateStep1 {
  return {
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    expertise: '',
    certifications: '',
    yearsExperience: '',
  };
}

function buildStep2(): CreateStep2 {
  return {
    location: '',
    timezone: 'Europe/Warsaw',
    languages: '',
    acceptingClients: true,
  };
}

// ---------------------------------------------------------------------------
// CoachCreateDialog — 2-step wizard
// ---------------------------------------------------------------------------

interface CoachCreateDialogProps {
  onClose: () => void;
  onSave: (data: CreateCoachData) => void;
  isSaving: boolean;
}

function CoachCreateDialog({
  onClose,
  onSave,
  isSaving,
}: CoachCreateDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<1 | 2>(1);
  const [step1, setStep1] = useState<CreateStep1>(buildStep1);
  const [step2, setStep2] = useState<CreateStep2>(buildStep2);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const setS1 = <K extends keyof CreateStep1>(
    key: K,
    value: CreateStep1[K],
  ) => {
    setStep1((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setS2 = <K extends keyof CreateStep2>(
    key: K,
    value: CreateStep2[K],
  ) => {
    setStep2((prev) => ({ ...prev, [key]: value }));
  };

  const validateStep1 = (): boolean => {
    const next: Partial<Record<string, string>> = {};
    if (!step1.fullName.trim()) {
      next.fullName = t('admin.coaches.validation.nameRequired');
    }
    if (!step1.email.trim()) {
      next.email = t('admin.coaches.validation.emailRequired');
      // eslint-disable-next-line sonarjs/slow-regex -- simple email format check on user input with bounded length
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1.email.trim())) {
      next.email = t('admin.coaches.validation.emailInvalid');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateCoachData = {
      fullName: step1.fullName.trim(),
      email: step1.email.trim(),
      phone: step1.phone.trim() || undefined,
      bio: step1.bio.trim() || undefined,
      expertise: step1.expertise
        ? parseCommaSeparated(step1.expertise)
        : undefined,
      certifications: step1.certifications
        ? parseCommaSeparated(step1.certifications)
        : undefined,
      yearsExperience: step1.yearsExperience
        ? Number.parseInt(step1.yearsExperience, 10)
        : undefined,
      location: step2.location.trim() || undefined,
      timezone: step2.timezone || 'Europe/Warsaw',
      languages: step2.languages
        ? parseCommaSeparated(step2.languages)
        : undefined,
      acceptingClients: step2.acceptingClients,
    };
    onSave(payload);
  };

  const stepLabel = t('admin.coaches.wizard.step', { current: step, total: 2 });
  const title = `${t('admin.coaches.newCoach')} — ${stepLabel}`;

  return (
    <AdminFormDialog
      open
      title={title}
      onClose={onClose}
      onSubmit={step === 1 ? handleNext : handleSubmit}
      isLoading={isSaving}
      submitLabel={
        step === 1
          ? t('admin.coaches.wizard.next')
          : t('admin.coaches.form.create')
      }
      cancelLabel={step === 2 ? t('admin.coaches.wizard.back') : undefined}
      onCancel={step === 2 ? handleBack : undefined}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-1" aria-label={stepLabel}>
        {([1, 2] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={[
                'w-6 h-6 rounded-full flex items-center justify-center font-["Inter"] text-[12px] font-semibold transition-colors',
                s === step
                  ? 'bg-[#B8963E] text-white'
                  : s < step
                    ? 'bg-[#8A6F2E] text-white'
                    : 'bg-[#E8E4DF] text-[#8A8A8A]',
              ].join(' ')}
            >
              {s}
            </div>
            {s < 2 && (
              <div
                className={[
                  'h-px w-8 transition-colors',
                  step > s ? 'bg-[#B8963E]' : 'bg-[#E8E4DF]',
                ].join(' ')}
              />
            )}
          </div>
        ))}
        <span className="ml-1 font-['Inter'] text-[12px] text-[#8A8A8A]">
          {stepLabel}
        </span>
      </div>

      {step === 1 && (
        <>
          <AdminFormField
            label={`${t('admin.coaches.form.fullName')} *`}
            htmlFor="coach-fullName"
            error={errors.fullName}
          >
            <input
              id="coach-fullName"
              type="text"
              value={step1.fullName}
              onChange={(e) => setS1('fullName', e.target.value)}
              placeholder={t('admin.coaches.form.fullNamePlaceholder')}
              className={ADMIN_INPUT_CLASS}
              autoFocus
              autoComplete="name"
            />
          </AdminFormField>

          <AdminFormField
            label={`${t('admin.coaches.form.email')} *`}
            htmlFor="coach-email"
            error={errors.email}
          >
            <input
              id="coach-email"
              type="email"
              value={step1.email}
              onChange={(e) => setS1('email', e.target.value)}
              placeholder={t('admin.coaches.form.emailPlaceholder')}
              className={ADMIN_INPUT_CLASS}
              autoComplete="email"
            />
          </AdminFormField>

          <AdminFormField
            label={t('admin.coaches.form.phone')}
            htmlFor="coach-phone"
          >
            <input
              id="coach-phone"
              type="text"
              value={step1.phone}
              onChange={(e) => setS1('phone', e.target.value)}
              placeholder={t('admin.coaches.form.phonePlaceholder')}
              className={ADMIN_INPUT_CLASS}
              autoComplete="tel"
            />
          </AdminFormField>

          <AdminFormField
            label={t('admin.coaches.form.bio')}
            htmlFor="coach-bio"
          >
            <textarea
              id="coach-bio"
              rows={3}
              value={step1.bio}
              onChange={(e) => setS1('bio', e.target.value)}
              placeholder={t('admin.coaches.form.bioPlaceholder')}
              className={`${ADMIN_INPUT_CLASS} resize-none`}
            />
          </AdminFormField>

          <AdminFormField
            label={t('admin.coaches.form.expertise')}
            htmlFor="coach-expertise"
          >
            <input
              id="coach-expertise"
              type="text"
              value={step1.expertise}
              onChange={(e) => setS1('expertise', e.target.value)}
              placeholder={t('admin.coaches.form.expertisePlaceholder')}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminFormField>

          <AdminFormField
            label={t('admin.coaches.form.certifications')}
            htmlFor="coach-certifications"
          >
            <input
              id="coach-certifications"
              type="text"
              value={step1.certifications}
              onChange={(e) => setS1('certifications', e.target.value)}
              placeholder={t('admin.coaches.form.certificationsPlaceholder')}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminFormField>

          <AdminFormField
            label={t('admin.coaches.form.yearsExperience')}
            htmlFor="coach-yearsExperience"
          >
            <input
              id="coach-yearsExperience"
              type="number"
              min={0}
              max={99}
              value={step1.yearsExperience}
              onChange={(e) => setS1('yearsExperience', e.target.value)}
              className={ADMIN_INPUT_CLASS}
            />
          </AdminFormField>
        </>
      )}

      {step === 2 && (
        <>
          <AdminFormField
            label={t('admin.coaches.form.location')}
            htmlFor="coach-location"
          >
            <input
              id="coach-location"
              type="text"
              value={step2.location}
              onChange={(e) => setS2('location', e.target.value)}
              placeholder={t('admin.coaches.form.locationPlaceholder')}
              className={ADMIN_INPUT_CLASS}
              autoFocus
            />
          </AdminFormField>

          <AdminFormField
            label={t('admin.coaches.form.timezone')}
            htmlFor="coach-timezone"
          >
            <select
              id="coach-timezone"
              value={step2.timezone}
              onChange={(e) => setS2('timezone', e.target.value)}
              className={ADMIN_INPUT_CLASS}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </AdminFormField>

          <AdminFormField
            label={t('admin.coaches.form.languages')}
            htmlFor="coach-languages"
          >
            <input
              id="coach-languages"
              type="text"
              value={step2.languages}
              onChange={(e) => setS2('languages', e.target.value)}
              placeholder={t('admin.coaches.form.languagesPlaceholder')}
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
              aria-checked={step2.acceptingClients}
              onClick={() => setS2('acceptingClients', !step2.acceptingClients)}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B8963E]',
                step2.acceptingClients ? 'bg-[#B8963E]' : 'bg-[#DDDDDD]',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  step2.acceptingClients ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
          </div>
        </>
      )}
    </AdminFormDialog>
  );
}

// ---------------------------------------------------------------------------
// Edit form state
// ---------------------------------------------------------------------------

interface EditFormState {
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  expertise: string;
  certifications: string;
  languages: string;
  location: string;
  timezone: string;
  yearsExperience: string;
  acceptingClients: boolean;
}

function buildEditForm(coach: Coach): EditFormState {
  return {
    fullName: coach.fullName,
    email: coach.email,
    phone: coach.phone ?? '',
    bio: coach.bio ?? '',
    expertise: (coach.expertise ?? []).join(', '),
    certifications: (coach.certifications ?? []).join(', '),
    languages: (coach.languages ?? []).join(', '),
    location: coach.location ?? '',
    timezone: coach.timezone,
    yearsExperience:
      coach.yearsExperience == null ? '' : String(coach.yearsExperience),
    acceptingClients: coach.acceptingClients,
  };
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

function CoachEditDialog({
  coach,
  onClose,
  onSave,
  isSaving,
}: CoachEditDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<EditFormState>(() => buildEditForm(coach));

  const setField = <K extends keyof EditFormState>(
    key: K,
    value: EditFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(coach.id, {
      fullName: form.fullName.trim() || coach.fullName,
      email: form.email.trim() || coach.email,
      phone: form.phone.trim() || null,
      bio: form.bio.trim() || null,
      expertise: parseCommaSeparated(form.expertise),
      certifications: parseCommaSeparated(form.certifications),
      languages: parseCommaSeparated(form.languages),
      location: form.location.trim() || null,
      timezone: form.timezone.trim() || 'Europe/Warsaw',
      yearsExperience: form.yearsExperience
        ? Number.parseInt(form.yearsExperience, 10)
        : null,
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
      <AdminFormField
        label={t('admin.coaches.form.fullName')}
        htmlFor="edit-coach-fullName"
      >
        <input
          id="edit-coach-fullName"
          type="text"
          value={form.fullName}
          onChange={(e) => setField('fullName', e.target.value)}
          placeholder={t('admin.coaches.form.fullNamePlaceholder')}
          className={ADMIN_INPUT_CLASS}
          autoFocus
        />
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.email')}
        htmlFor="edit-coach-email"
      >
        <input
          id="edit-coach-email"
          type="email"
          value={form.email}
          onChange={(e) => setField('email', e.target.value)}
          placeholder={t('admin.coaches.form.emailPlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.phone')}
        htmlFor="edit-coach-phone"
      >
        <input
          id="edit-coach-phone"
          type="text"
          value={form.phone}
          onChange={(e) => setField('phone', e.target.value)}
          placeholder={t('admin.coaches.form.phonePlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.bio')}
        htmlFor="edit-coach-bio"
      >
        <textarea
          id="edit-coach-bio"
          rows={3}
          value={form.bio}
          onChange={(e) => setField('bio', e.target.value)}
          placeholder={t('admin.coaches.form.bioPlaceholder')}
          className={`${ADMIN_INPUT_CLASS} resize-none`}
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
        label={t('admin.coaches.form.certifications')}
        htmlFor="edit-coach-certifications"
      >
        <input
          id="edit-coach-certifications"
          type="text"
          value={form.certifications}
          onChange={(e) => setField('certifications', e.target.value)}
          placeholder={t('admin.coaches.form.certificationsPlaceholder')}
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
        <select
          id="edit-coach-timezone"
          value={form.timezone}
          onChange={(e) => setField('timezone', e.target.value)}
          className={ADMIN_INPUT_CLASS}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </AdminFormField>

      <AdminFormField
        label={t('admin.coaches.form.yearsExperience')}
        htmlFor="edit-coach-yearsExperience"
      >
        <input
          id="edit-coach-yearsExperience"
          type="number"
          min={0}
          max={99}
          value={form.yearsExperience}
          onChange={(e) => setField('yearsExperience', e.target.value)}
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
      if (
        !c.fullName.toLowerCase().includes(q) &&
        !c.email.toLowerCase().includes(q)
      ) {
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

  const isConfirmLoading =
    archiveMutation.isPending || restoreMutation.isPending;

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
          <div className="font-['Inter'] text-[12px] text-[#8A8A8A]">
            {c.email}
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: t('admin.coaches.table.phone'),
      render: (c) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {c.phone ?? '—'}
        </span>
      ),
    },
    {
      key: 'location',
      header: t('admin.coaches.table.location'),
      render: (c) => (
        <span className="font-['Inter'] text-[13px] text-[#6B6B6B]">
          {c.location ?? '—'}
        </span>
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
