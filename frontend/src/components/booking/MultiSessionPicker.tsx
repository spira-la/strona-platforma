import { useMemo, useState } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { BookingCalendar } from './BookingCalendar';
import { useAvailabilitySlots } from '@/hooks/useAvailabilitySlots';
import type { AvailableSlot } from '@/clients/availability.client';

export interface SelectedSlot {
  startTime: string; // ISO
  endTime: string; // ISO
}

export interface MultiSessionPickerProps {
  coachId: string;
  sessionCount: number;
  durationMinutes: number;
  selected: SelectedSlot[];
  onChange: (slots: SelectedSlot[]) => void;
  onConfirm: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function MultiSessionPicker({
  coachId,
  sessionCount,
  durationMinutes,
  selected,
  onChange,
  onConfirm,
}: MultiSessionPickerProps) {
  const [viewDate, setViewDate] = useState<Date | null>(null);

  const ymd = viewDate ? toYmd(viewDate) : null;

  const { data: slots, isLoading } = useAvailabilitySlots({
    coachId,
    date: ymd,
    durationMinutes,
    enabled: !!ymd,
  });

  const selectedStartTimes = useMemo(
    () => new Set(selected.map((s) => s.startTime)),
    [selected],
  );

  function toggleSlot(slot: AvailableSlot) {
    if (!slot.available) return;
    if (selectedStartTimes.has(slot.startTime)) {
      onChange(selected.filter((s) => s.startTime !== slot.startTime));
      return;
    }
    if (selected.length >= sessionCount) return;
    onChange([
      ...selected,
      { startTime: slot.startTime, endTime: slot.endTime },
    ]);
  }

  const morning = (slots ?? []).filter((s) => {
    const h = new Date(s.startTime).getHours();
    return h < 12;
  });
  const afternoon = (slots ?? []).filter((s) => {
    const h = new Date(s.startTime).getHours();
    return h >= 12;
  });

  const allChosen = selected.length === sessionCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BookingCalendar
        selectedDate={viewDate}
        onSelectDate={(d) => setViewDate(d)}
      />

      <div className="rounded-lg overflow-hidden border border-[#E8E4DF] bg-white shadow-sm">
        <div
          className="px-6 py-5"
          style={{
            background:
              'linear-gradient(135deg, #B8944A 0%, #D4B97A 50%, #8A6F2E 100%)',
          }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {sessionCount > 1
              ? `Wybierz ${sessionCount} terminow`
              : 'Wybierz termin'}
          </p>
          <p
            className="text-lg font-bold text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {viewDate
              ? viewDate.toLocaleDateString('pl-PL', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : 'Najpierw wybierz date'}
          </p>
        </div>

        <div className="px-5 py-5 min-h-[280px]">
          {!viewDate && (
            <div className="flex items-center justify-center py-16 text-center">
              <p
                className="text-sm text-[#8A8A8A] max-w-[220px]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Wybierz date z kalendarza, aby zobaczyc dostepne godziny
              </p>
            </div>
          )}

          {viewDate && isLoading && (
            <div className="py-16 text-center">
              <p
                className="text-sm text-[#8A8A8A]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Ladowanie dostepnych godzin…
              </p>
            </div>
          )}

          {viewDate && !isLoading && (slots?.length ?? 0) === 0 && (
            <div className="py-16 text-center">
              <p
                className="text-sm text-[#8A8A8A]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Brak dostepnych godzin w tym dniu
              </p>
            </div>
          )}

          {viewDate && !isLoading && (slots?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-6">
              {morning.length > 0 && (
                <SlotGroup
                  label="Rano"
                  slots={morning}
                  selectedStartTimes={selectedStartTimes}
                  disableUnselected={selected.length >= sessionCount}
                  onToggle={toggleSlot}
                />
              )}
              {afternoon.length > 0 && (
                <SlotGroup
                  label="Po poludniu"
                  slots={afternoon}
                  selectedStartTimes={selectedStartTimes}
                  disableUnselected={selected.length >= sessionCount}
                  onToggle={toggleSlot}
                />
              )}
            </div>
          )}
        </div>

        {sessionCount > 1 && (
          <div className="px-5 py-4 border-t border-[#F0EDE8] bg-[#FAF8F5]">
            <p
              className="text-xs font-semibold uppercase tracking-wider text-[#6B6B6B] mb-2"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Wybrane terminy ({selected.length}/{sessionCount})
            </p>
            {selected.length === 0 ? (
              <p
                className="text-xs text-[#8A8A8A]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Brak wybranych terminow
              </p>
            ) : (
              <ul className="flex flex-col gap-1">
                {selected.map((s) => (
                  <li
                    key={s.startTime}
                    className="flex items-center justify-between text-xs text-[#2D2D2D] bg-white px-3 py-2 rounded border border-[#E8E4DF]"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    <span>
                      {formatDateLong(s.startTime)} &middot;{' '}
                      {formatTime(s.startTime)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onChange(
                          selected.filter((x) => x.startTime !== s.startTime),
                        )
                      }
                      className="p-1 rounded-full text-[#8A8A8A] hover:bg-[#F0EDE8]"
                      aria-label="Usun termin"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="px-5 py-5 border-t border-[#F0EDE8]">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!allChosen}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A]"
            style={{
              background: allChosen
                ? 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)'
                : '#C0BDB9',
              fontFamily: "'Lato', sans-serif",
            }}
          >
            {allChosen
              ? 'Przejdz do platnosci'
              : `Wybierz ${sessionCount - selected.length} wiecej`}
          </button>
          {allChosen && (
            <p
              className="flex items-center justify-center gap-1 text-xs text-[#4CAF50] mt-3"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <Check size={14} /> Wszystkie terminy wybrane
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SlotGroup({
  label,
  slots,
  selectedStartTimes,
  disableUnselected,
  onToggle,
}: {
  label: string;
  slots: AvailableSlot[];
  selectedStartTimes: Set<string>;
  disableUnselected: boolean;
  onToggle: (slot: AvailableSlot) => void;
}) {
  return (
    <div>
      <p
        className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#8A8A8A] mb-3"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        <Clock size={12} /> {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const isSelected = selectedStartTimes.has(slot.startTime);
          const disabled =
            !slot.available || (disableUnselected && !isSelected);
          let classes =
            'px-4 py-2 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] ';
          if (!slot.available || (disabled && !isSelected)) {
            classes +=
              'border-[#E8E4DF] text-[#C0BDB9] cursor-not-allowed bg-[#FAF8F5]';
          } else if (isSelected) {
            classes +=
              'border-[#B8944A] bg-[#B8944A] text-white cursor-pointer';
          } else {
            classes +=
              'border-[#E8E4DF] text-[#2D2D2D] bg-white hover:border-[#B8944A] hover:text-[#B8944A] cursor-pointer';
          }
          return (
            <button
              key={slot.startTime}
              type="button"
              className={classes}
              disabled={disabled}
              onClick={() => onToggle(slot)}
              aria-pressed={isSelected}
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {formatTime(slot.startTime)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MultiSessionPicker;
