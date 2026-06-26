import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw, Clock } from 'lucide-react';
import { useAvailabilitySlots } from '@/hooks/useAvailabilitySlots';
import type {
  CoachSession,
  RescheduleSessionData,
} from '@/clients/coach.client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RescheduleModalProps {
  session: CoachSession;
  coachId: string;
  onSubmit: (id: string, data: RescheduleSessionData) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function durationMins(startAt: string, endAt: string): number {
  return Math.round(
    (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60_000,
  );
}

const MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];
const DAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

// ─── Mini Calendar ────────────────────────────────────────────────────────────

function MiniCalendar({
  selected,
  onChange,
}: {
  selected: Date | null;
  onChange: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  // Generate days for the calendar grid
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  const startOffset = startDow === 0 ? 6 : startDow - 1; // Mon-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function prevMonth() {
    setViewMonth(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewMonth(new Date(year, month + 1, 1));
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          className="p-1 rounded hover:bg-[#F5F2ED] text-[#6B6B6B] transition-colors"
        >
          ‹
        </button>
        <span
          className="text-[12px] font-semibold text-[#2D2D2D]"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 rounded hover:bg-[#F5F2ED] text-[#6B6B6B] transition-colors"
        >
          ›
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-bold uppercase tracking-wide text-[#AAAAAA] py-1"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const isPast = day < today;
          const isSel = selected ? toYmd(day) === toYmd(selected) : false;
          const isToday = toYmd(day) === toYmd(today);

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onChange(day)}
              className={`
                aspect-square flex items-center justify-center text-[11px] rounded-lg transition-colors
                ${isPast ? 'text-[#D4D0CC] cursor-not-allowed' : ''}
                ${isSel ? 'bg-[#B8944A] text-white font-semibold' : ''}
                ${isToday && !isSel ? 'border border-[#B8944A] text-[#B8944A] font-semibold' : ''}
                ${!isPast && !isSel ? 'text-[#2D2D2D] hover:bg-[#F5F2ED]' : ''}
              `}
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RescheduleModal({
  session,
  coachId,
  onSubmit,
  onClose,
  isSubmitting = false,
}: RescheduleModalProps) {
  const dur = durationMins(session.startAt, session.endAt);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [reason, setReason] = useState('');

  const ymd = selectedDate ? toYmd(selectedDate) : null;

  const { data: slots, isLoading } = useAvailabilitySlots({
    coachId,
    date: ymd,
    durationMinutes: dur,
    enabled: !!ymd,
  });

  const morning = (slots ?? []).filter(
    (s) => new Date(s.startTime).getHours() < 12,
  );
  const afternoon = (slots ?? []).filter(
    (s) => new Date(s.startTime).getHours() >= 12,
  );

  function handleSubmit() {
    if (!selectedSlot) return;
    onSubmit(session.id, {
      newStartAt: selectedSlot.start,
      newEndAt: selectedSlot.end,
      reason: reason.trim() || undefined,
    });
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          margin: '0 16px',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="font-bold text-xl text-white"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Przeplanuj sesję
              </h3>
              <p
                className="text-white/70 text-xs mt-0.5"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {session.clientName} · {fmtTime(session.startAt)} ({dur} min)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {/* Calendar */}
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-3"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Wybierz nową datę
            </p>
            <MiniCalendar selected={selectedDate} onChange={setSelectedDate} />
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-2"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Dostępne godziny
              </p>

              {isLoading && (
                <p
                  className="text-xs text-[#8A8A8A] py-3"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Ładowanie…
                </p>
              )}

              {!isLoading && (slots?.length ?? 0) === 0 && (
                <p
                  className="text-xs text-[#8A8A8A] py-3"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Brak dostępnych godzin w tym dniu
                </p>
              )}

              {[
                { label: 'Rano', list: morning },
                { label: 'Popołudnie', list: afternoon },
              ]
                .filter((g) => g.list.length > 0)
                .map((group) => (
                  <div key={group.label} className="mb-3">
                    <p
                      className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#AAAAAA] mb-2"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      <Clock size={10} /> {group.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.list.map((slot) => {
                        const isSel = selectedSlot?.start === slot.startTime;
                        return (
                          <button
                            key={slot.startTime}
                            disabled={!slot.available}
                            onClick={() =>
                              setSelectedSlot({
                                start: slot.startTime,
                                end: slot.endTime,
                              })
                            }
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
                              slot.available
                                ? isSel
                                  ? 'border-[#B8944A] bg-[#B8944A] text-white'
                                  : 'border-[#E8E4DF] text-[#2D2D2D] bg-white hover:border-[#B8944A] hover:text-[#B8944A]'
                                : 'border-[#E8E4DF] text-[#C0BDB9] cursor-not-allowed bg-[#FAF8F5]'
                            }`}
                            style={{ fontFamily: "'Lato', sans-serif" }}
                          >
                            {fmtTime(slot.startTime)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Reason */}
          {selectedSlot && (
            <div>
              <label
                className="block text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] mb-1.5"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Powód zmiany (opcjonalnie)
              </label>
              <input
                type="text"
                placeholder="np. Prośba klienta…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-[#E8E4DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent"
                style={{ fontFamily: "'Lato', sans-serif" }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#E8E4DF] text-[#6B6B6B] hover:border-[#B8944A] hover:text-[#B8944A] transition-colors"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedSlot || isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{
                fontFamily: "'Lato', sans-serif",
                background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
              }}
            >
              <RefreshCw size={13} />
              {isSubmitting ? 'Zapisywanie…' : 'Potwierdź zmianę'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
