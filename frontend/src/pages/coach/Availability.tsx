import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Save, Loader2, CalendarOff, Clock } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFormDialog } from '@/components/admin/AdminFormDialog';
import {
  AdminFormField,
  ADMIN_INPUT_CLASS,
} from '@/components/admin/AdminFormField';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/stores/toast.store';
import {
  coachClient,
  type CoachAvailabilitySlot,
  type CreateAvailabilitySlotData,
  type CoachBlock,
  type CreateBlockData,
} from '@/clients/coach.client';

// ─── Teal accent constant ─────────────────────────────────────────────────────

const TEAL = '#0D9488';

// ---------------------------------------------------------------------------
// Day config
// ---------------------------------------------------------------------------

const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 0] as const; // Mon-Sun

// ---------------------------------------------------------------------------
// Types for local editing
// ---------------------------------------------------------------------------

interface LocalSlot {
  /** undefined means a new slot (not yet saved) */
  id?: string;
  startTime: string;
  endTime: string;
}

type DaySlots = Record<number, LocalSlot[]>;

function buildDaySlots(slots: CoachAvailabilitySlot[]): DaySlots {
  const map: DaySlots = {};
  for (const day of DAYS_OF_WEEK) {
    map[day] = slots
      .filter((s) => s.dayOfWeek === day)
      .map((s) => ({ id: s.id, startTime: s.startTime, endTime: s.endTime }));
  }
  return map;
}

// ---------------------------------------------------------------------------
// Block form dialog
// ---------------------------------------------------------------------------

interface BlockFormState {
  startAt: string;
  endAt: string;
  reason: string;
}

interface BlockFormDialogProps {
  onClose: () => void;
  onSave: (data: CreateBlockData) => void;
  isSaving: boolean;
}

function BlockFormDialog({ onClose, onSave, isSaving }: BlockFormDialogProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<BlockFormState>({
    startAt: '',
    endAt: '',
    reason: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof BlockFormState, string>>
  >({});

  const setField = <K extends keyof BlockFormState>(key: K, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof BlockFormState, string>> = {};
    if (!form.startAt)
      next.startAt = t('coach.availability.validation.startRequired');
    if (!form.endAt)
      next.endAt = t('coach.availability.validation.endRequired');
    if (form.startAt && form.endAt && form.startAt >= form.endAt) {
      next.endAt = t('coach.availability.validation.endAfterStart');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      startAt: form.startAt,
      endAt: form.endAt,
      reason: form.reason.trim() || undefined,
    });
  };

  return (
    <AdminFormDialog
      open
      title={t('coach.availability.addBlock')}
      onClose={onClose}
      onSubmit={handleSubmit}
      isLoading={isSaving}
      submitLabel={t('coach.availability.blocks.save')}
    >
      <AdminFormField
        label={t('coach.availability.blocks.startAt')}
        htmlFor="block-start"
        error={errors.startAt}
      >
        <input
          id="block-start"
          type="datetime-local"
          value={form.startAt}
          onChange={(e) => setField('startAt', e.target.value)}
          className={ADMIN_INPUT_CLASS}
          autoFocus
        />
      </AdminFormField>

      <AdminFormField
        label={t('coach.availability.blocks.endAt')}
        htmlFor="block-end"
        error={errors.endAt}
      >
        <input
          id="block-end"
          type="datetime-local"
          value={form.endAt}
          onChange={(e) => setField('endAt', e.target.value)}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>

      <AdminFormField
        label={t('coach.availability.blocks.reason')}
        htmlFor="block-reason"
      >
        <input
          id="block-reason"
          type="text"
          value={form.reason}
          onChange={(e) => setField('reason', e.target.value)}
          placeholder={t('coach.availability.blocks.reasonPlaceholder')}
          className={ADMIN_INPUT_CLASS}
        />
      </AdminFormField>
    </AdminFormDialog>
  );
}

// ---------------------------------------------------------------------------
// DayCard
// ---------------------------------------------------------------------------

interface DayCardProps {
  dayOfWeek: number;
  slots: LocalSlot[];
  onToggle: (dayOfWeek: number, enabled: boolean) => void;
  onAddSlot: (dayOfWeek: number) => void;
  onRemoveSlot: (dayOfWeek: number, index: number) => void;
  onChangeSlot: (
    dayOfWeek: number,
    index: number,
    field: 'startTime' | 'endTime',
    value: string,
  ) => void;
}

function DayCard({
  dayOfWeek,
  slots,
  onToggle,
  onAddSlot,
  onRemoveSlot,
  onChangeSlot,
}: DayCardProps) {
  const { t } = useTranslation();
  const enabled = slots.length > 0;

  const dayName = t(`coach.availability.days.${dayOfWeek}`);

  return (
    <div
      className={[
        'rounded-xl border bg-white p-4 transition-colors',
        enabled ? 'border-[#0D9488]/30' : 'border-[#E8E4DF]',
      ].join(' ')}
    >
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={[
            "font-['Inter'] text-[14px] font-semibold",
            enabled ? 'text-[#0D9488]' : 'text-[#AAAAAA]',
          ].join(' ')}
        >
          {dayName}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? t('coach.availability.disableDay') : t('coach.availability.enableDay')} ${dayName}`}
          onClick={() => onToggle(dayOfWeek, !enabled)}
          className={[
            'relative inline-flex h-5 w-10 items-center rounded-full transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]',
          ].join(' ')}
          style={{ backgroundColor: enabled ? TEAL : '#DDDDDD' }}
        >
          <span
            className={[
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5',
            ].join(' ')}
          />
        </button>
      </div>

      {/* Slots */}
      {enabled && (
        <div className="space-y-2">
          {slots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="time"
                value={slot.startTime}
                onChange={(e) =>
                  onChangeSlot(dayOfWeek, idx, 'startTime', e.target.value)
                }
                aria-label={t('coach.availability.startTime')}
                className={[ADMIN_INPUT_CLASS, 'flex-1 text-[13px]'].join(' ')}
              />
              <span className="font-['Inter'] text-[12px] text-[#AAAAAA]">
                –
              </span>
              <input
                type="time"
                value={slot.endTime}
                onChange={(e) =>
                  onChangeSlot(dayOfWeek, idx, 'endTime', e.target.value)
                }
                aria-label={t('coach.availability.endTime')}
                className={[ADMIN_INPUT_CLASS, 'flex-1 text-[13px]'].join(' ')}
              />
              <button
                type="button"
                onClick={() => onRemoveSlot(dayOfWeek, idx)}
                aria-label={t('coach.availability.removeSlot')}
                className="p-1 rounded text-[#8A8A8A] hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => onAddSlot(dayOfWeek)}
            className="flex items-center gap-1 text-[#0D9488] hover:text-[#0F766E] font-['Inter'] text-[13px] font-medium transition-colors mt-1"
          >
            <Plus size={14} />
            {t('coach.availability.addSlot')}
          </button>
        </div>
      )}

      {!enabled && (
        <p className="font-['Inter'] text-[12px] text-[#CCCCCC]">
          {t('coach.availability.dayDisabled')}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CoachAvailability() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [daySlots, setDaySlots] = useState<DaySlots>({});
  const [dirty, setDirty] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState<CoachBlock | null>(null);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data: availabilitySlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ['coach-availability'],
    queryFn: () => coachClient.getAvailability(),
  });

  const { data: blocks = [], isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['coach-blocks'],
    queryFn: () => coachClient.getBlocks(),
  });

  // Initialise local state when data loads — calling setState here is intentional:
  // we are initialising the schedule editor from server data once it arrives.

  useEffect(() => {
    if (!isLoadingSlots) {
      setDaySlots(buildDaySlots(availabilitySlots));
      setDirty(false);
    }
  }, [availabilitySlots, isLoadingSlots]);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: (slots: CreateAvailabilitySlotData[]) =>
      coachClient.updateAvailability(slots),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach-availability'] });
      setDirty(false);
      toast.success(t('coach.availability.savedSuccess'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const createBlockMutation = useMutation({
    mutationFn: (d: CreateBlockData) => coachClient.createBlock(d),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach-blocks'] });
      setShowBlockForm(false);
      toast.success(t('admin.common.created'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => coachClient.deleteBlock(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['coach-blocks'] });
      setConfirmBlock(null);
      toast.success(t('admin.common.deleted'));
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : t('admin.common.error'));
    },
  });

  // ─── Day slot handlers ───────────────────────────────────────────────────────

  const handleToggleDay = (dayOfWeek: number, enabled: boolean) => {
    setDaySlots((prev) => ({
      ...prev,
      [dayOfWeek]: enabled ? [{ startTime: '09:00', endTime: '17:00' }] : [],
    }));
    setDirty(true);
  };

  const handleAddSlot = (dayOfWeek: number) => {
    setDaySlots((prev) => ({
      ...prev,
      [dayOfWeek]: [
        ...(prev[dayOfWeek] ?? []),
        { startTime: '09:00', endTime: '17:00' },
      ],
    }));
    setDirty(true);
  };

  const handleRemoveSlot = (dayOfWeek: number, index: number) => {
    setDaySlots((prev) => {
      const updated = [...(prev[dayOfWeek] ?? [])];
      updated.splice(index, 1);
      return { ...prev, [dayOfWeek]: updated };
    });
    setDirty(true);
  };

  const handleChangeSlot = (
    dayOfWeek: number,
    index: number,
    field: 'startTime' | 'endTime',
    value: string,
  ) => {
    setDaySlots((prev) => {
      const updated = [...(prev[dayOfWeek] ?? [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [dayOfWeek]: updated };
    });
    setDirty(true);
  };

  // ─── Save all slots ──────────────────────────────────────────────────────────

  const handleSave = () => {
    const slots: CreateAvailabilitySlotData[] = [];
    for (const [dayStr, slotList] of Object.entries(daySlots)) {
      const day = Number(dayStr);
      for (const slot of slotList) {
        if (slot.startTime && slot.endTime) {
          slots.push({
            dayOfWeek: day,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }
    }
    saveMutation.mutate(slots);
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const formatDateTime = (iso: string) => {
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
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <AdminPageHeader
        title={t('coach.availability.title')}
        description={t('coach.availability.description')}
      />

      {/* Weekly schedule */}
      <section
        aria-label={t('coach.availability.weeklySchedule')}
        className="mb-10"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Inter'] text-[16px] font-semibold text-[#2D2D2D] flex items-center gap-2">
            <Clock size={18} style={{ color: TEAL }} aria-hidden="true" />
            {t('coach.availability.weeklySchedule')}
          </h2>
        </div>

        {isLoadingSlots ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-[#AAAAAA]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {DAYS_OF_WEEK.map((day) => (
              <DayCard
                key={day}
                dayOfWeek={day}
                slots={daySlots[day] ?? []}
                onToggle={handleToggleDay}
                onAddSlot={handleAddSlot}
                onRemoveSlot={handleRemoveSlot}
                onChangeSlot={handleChangeSlot}
              />
            ))}
          </div>
        )}

        {/* Save button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saveMutation.isPending}
            className={[
              'inline-flex items-center gap-2 px-6 py-2.5 rounded-lg',
              "font-['Inter'] text-[14px] font-medium text-white",
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#0D9488]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
            style={{ backgroundColor: TEAL }}
            onMouseEnter={(e) => {
              if (!(e.currentTarget as HTMLButtonElement).disabled) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  '#0F766E';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                TEAL;
            }}
          >
            {saveMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {t('coach.availability.saveSchedule')}
          </button>
        </div>
      </section>

      {/* Blocked dates */}
      <section aria-label={t('coach.availability.blockedDates')}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-['Inter'] text-[16px] font-semibold text-[#2D2D2D] flex items-center gap-2">
            <CalendarOff
              size={18}
              className="text-[#6B6B6B]"
              aria-hidden="true"
            />
            {t('coach.availability.blockedDates')}
          </h2>
          <button
            type="button"
            onClick={() => setShowBlockForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-['Inter'] text-[13px] font-medium text-white transition-colors"
            style={{ backgroundColor: TEAL }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                '#0F766E';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                TEAL;
            }}
          >
            <Plus size={15} />
            {t('coach.availability.addBlock')}
          </button>
        </div>

        {isLoadingBlocks ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#AAAAAA]" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="rounded-xl bg-white border border-[#E8E4DF] p-8 text-center">
            <CalendarOff
              size={32}
              className="mx-auto mb-2 text-[#DDDDDD]"
              aria-hidden="true"
            />
            <p className="font-['Inter'] text-[14px] text-[#AAAAAA]">
              {t('coach.availability.blocks.empty')}
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#E8E4DF] overflow-hidden">
            <ul role="list" className="divide-y divide-[#F0F0F0]">
              {blocks.map((block) => (
                <li
                  key={block.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFAFA] transition-colors"
                >
                  <div>
                    <div className="font-['Inter'] text-[14px] font-medium text-[#2D2D2D]">
                      {formatDateTime(block.startAt)} —{' '}
                      {formatDateTime(block.endAt)}
                    </div>
                    {block.reason && (
                      <div className="font-['Inter'] text-[12px] text-[#8A8A8A] mt-0.5">
                        {block.reason}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirmBlock(block)}
                    aria-label={t('coach.availability.blocks.delete')}
                    className="p-1.5 rounded text-[#8A8A8A] hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Block form dialog */}
      {showBlockForm && (
        <BlockFormDialog
          onClose={() => setShowBlockForm(false)}
          onSave={(d) => createBlockMutation.mutate(d)}
          isSaving={createBlockMutation.isPending}
        />
      )}

      {/* Delete block confirmation */}
      <ConfirmDialog
        open={!!confirmBlock}
        title={t('coach.availability.blocks.deleteTitle')}
        message={t('coach.availability.blocks.deleteMessage')}
        confirmLabel={t('coach.availability.blocks.delete')}
        variant="danger"
        isLoading={deleteBlockMutation.isPending}
        onConfirm={() => {
          if (confirmBlock) deleteBlockMutation.mutate(confirmBlock.id);
        }}
        onCancel={() => setConfirmBlock(null)}
      />
    </div>
  );
}
