import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Lock, X, CalendarPlus } from 'lucide-react';
import type {
  CoachSession,
  CoachBlock,
  CoachAvailabilitySlot,
  CreateBlockData,
} from '@/clients/coach.client';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_START = 7;
const HOUR_END = 22;
const TOTAL_HOURS = HOUR_END - HOUR_START;
const HOUR_PX = 60;
const GRID_HEIGHT = TOTAL_HOURS * HOUR_PX;

const HOUR_LABELS = Array.from(
  { length: TOTAL_HOURS },
  (_, i) => String(HOUR_START + i).padStart(2, '0') + ':00',
);

const DAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

const MONTH_NAMES = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
  return date;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(d: Date) {
  return isSameDay(d, new Date());
}

/** ISO → px from top of grid */
function isoTopPx(iso: string): number {
  const d = new Date(iso);
  return Math.max(
    0,
    (d.getHours() - HOUR_START + d.getMinutes() / 60) * HOUR_PX,
  );
}

function isoHeightPx(startIso: string, endIso: string): number {
  const mins =
    (new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000;
  return Math.max(20, (mins / 60) * HOUR_PX);
}

/** "HH:MM:SS" string → px from top of grid */
function timeStrTopPx(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return Math.max(0, (h - HOUR_START + (m ?? 0) / 60) * HOUR_PX);
}

function timeStrHeightPx(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + (em ?? 0) - (sh * 60 + (sm ?? 0));
  return Math.max(0, (mins / 60) * HOUR_PX);
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// dayOfWeek: 1=Mon … 7=Sun (ISO). weekDays[0]=Mon → dayOfWeek 1
function dayOfWeekFor(day: Date): number {
  const jsDay = day.getDay(); // 0=Sun
  return jsDay === 0 ? 7 : jsDay;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CoachWeekCalendarProps {
  sessions: CoachSession[];
  blocks: CoachBlock[];
  availability: CoachAvailabilitySlot[];
  onCreateBlock: (data: CreateBlockData) => void;
  onDeleteBlock: (id: string) => void;
  onSessionClick: (session: CoachSession) => void;
  onScheduleManual: (date: string, startTime: string) => void;
  isCreating?: boolean;
}

interface BlockDialog {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

interface SlotActionDialog {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LegendDot({
  bg,
  border,
  label,
}: {
  bg: string;
  border: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2.5 h-2.5 rounded-sm border flex-shrink-0"
        style={{ backgroundColor: bg, borderColor: border }}
      />
      <span
        className="text-[9px] text-[#8A8A8A]"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {label}
      </span>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A]"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CoachWeekCalendar({
  sessions,
  blocks,
  availability,
  onCreateBlock,
  onDeleteBlock,
  onSessionClick,
  onScheduleManual,
  isCreating = false,
}: CoachWeekCalendarProps) {
  const today = new Date();
  const [weekMonday, setWeekMonday] = useState(() => getMonday(today));
  const [dialog, setDialog] = useState<BlockDialog | null>(null);
  const [slotAction, setSlotAction] = useState<SlotActionDialog | null>(null);

  const weekDays = getWeekDays(weekMonday);

  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${weekStart.getDate()}–${weekEnd.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}`
      : `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTH_NAMES[weekEnd.getMonth()]} ${weekStart.getFullYear()}`;

  // Availability slots for a given day (by ISO dayOfWeek 1-7)
  function availForDay(day: Date): CoachAvailabilitySlot[] {
    const dow = dayOfWeekFor(day);
    return availability.filter((a) => a.dayOfWeek === dow);
  }

  function sessionsForDay(day: Date) {
    return sessions.filter((s) => isSameDay(new Date(s.startAt), day));
  }

  function blocksForDay(day: Date) {
    return blocks.filter((b) => isSameDay(new Date(b.startAt), day));
  }

  function handleCellClick(day: Date, e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawH = HOUR_START + y / HOUR_PX;
    const startH = Math.min(Math.floor(rawH), HOUR_END - 1);
    const rawMin = (rawH % 1) * 60;
    const startM =
      Math.round(rawMin / 30) * 30 >= 60 ? 0 : Math.round(rawMin / 30) * 30;
    setSlotAction({
      date: toDateStr(day),
      startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
    });
  }

  function openBlockDialog(date: string, startTime: string) {
    const [sh, sm] = startTime.split(':').map(Number);
    const endH = Math.min((sh ?? 0) + 1, HOUR_END);
    setSlotAction(null);
    setDialog({
      date,
      startTime,
      endTime: `${String(endH).padStart(2, '0')}:${String(sm ?? 0).padStart(2, '0')}`,
      reason: '',
    });
  }

  function submitBlock() {
    if (!dialog) return;
    onCreateBlock({
      startAt: `${dialog.date}T${dialog.startTime}:00`,
      endAt: `${dialog.date}T${dialog.endTime}:00`,
      reason: dialog.reason || undefined,
    });
    setDialog(null);
  }

  // Now indicator
  const nowDayIndex = weekDays.findIndex((d) => isToday(d));
  const nowTopPx = isoTopPx(today.toISOString());
  const nowVisible =
    nowDayIndex !== -1 &&
    today.getHours() >= HOUR_START &&
    today.getHours() < HOUR_END;

  return (
    <div className="bg-white rounded-xl border border-[#E8E4DF] overflow-hidden shadow-sm">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E4DF]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekMonday((d) => addDays(d, -7))}
            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#6B6B6B] hover:text-[#B8944A] transition-colors"
            aria-label="Poprzedni tydzień"
          >
            <ChevronLeft size={16} />
          </button>
          <span
            className="font-bold text-[#2D2D2D] text-sm min-w-[200px] text-center"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekMonday((d) => addDays(d, 7))}
            className="p-1.5 rounded-lg hover:bg-[#FAF8F5] text-[#6B6B6B] hover:text-[#B8944A] transition-colors"
            aria-label="Następny tydzień"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekMonday(getMonday(today))}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-lg border border-[#E8E4DF] text-[#6B6B6B] hover:border-[#B8944A] hover:text-[#B8944A] transition-colors"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Dziś
          </button>
          <button
            onClick={() =>
              setDialog({
                date: toDateStr(today),
                startTime: '09:00',
                endTime: '10:00',
                reason: '',
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg text-white hover:opacity-90 transition-opacity"
            style={{
              fontFamily: "'Lato', sans-serif",
              background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
            }}
          >
            <Lock size={12} /> Zablokuj czas
          </button>
        </div>
      </div>

      {/* ─── Day headers ─── */}
      <div className="flex border-b border-[#E8E4DF]">
        <div className="w-12 flex-shrink-0" />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`flex-1 text-center py-2 border-l border-[#E8E4DF] ${isToday(day) ? 'bg-[#FDF9F0]' : ''}`}
          >
            <span
              className="block text-[9px] font-bold uppercase tracking-wider text-[#8A8A8A]"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {DAY_LABELS[i]}
            </span>
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full mt-0.5 text-xs font-semibold ${
                isToday(day) ? 'bg-[#B8944A] text-white' : 'text-[#2D2D2D]'
              }`}
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {day.getDate()}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Grid ─── */}
      <div className="flex overflow-y-auto" style={{ maxHeight: 560 }}>
        {/* Hour labels */}
        <div
          className="w-12 flex-shrink-0 relative select-none"
          style={{ height: GRID_HEIGHT }}
        >
          {HOUR_LABELS.map((label, i) => (
            <div
              key={label}
              className="absolute right-1.5 text-[9px] text-[#C0BCBA] leading-none"
              style={{ top: i * HOUR_PX - 5, fontFamily: "'Lato', sans-serif" }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => {
          const dayAvail = availForDay(day);
          const daySessions = sessionsForDay(day);
          const dayBlocks = blocksForDay(day);
          const hasAvail = dayAvail.length > 0;

          return (
            <div
              key={dayIndex}
              role="button"
              tabIndex={0}
              aria-label={`${day.toLocaleDateString('pl-PL')} — kliknij aby zablokować`}
              className={`flex-1 relative border-l border-[#E8E4DF] cursor-crosshair ${
                isToday(day) ? 'bg-[#FDFCF8]' : ''
              }`}
              style={{ height: GRID_HEIGHT }}
              onClick={(e) => handleCellClick(day, e)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')
                  setDialog({
                    date: toDateStr(day),
                    startTime: '09:00',
                    endTime: '10:00',
                    reason: '',
                  });
              }}
            >
              {/* Hour grid lines */}
              {HOUR_LABELS.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-[#F0EDE8]"
                  style={{ top: i * HOUR_PX }}
                />
              ))}
              {/* Half-hour dashed lines */}
              {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                <div
                  key={`h${i}`}
                  className="absolute left-0 right-0 border-t border-dashed border-[#F5F3EF]"
                  style={{ top: i * HOUR_PX + HOUR_PX / 2 }}
                />
              ))}

              {/* ── Availability bands (free time) ── */}
              {hasAvail
                ? dayAvail.map((slot) => {
                    const top = timeStrTopPx(slot.startTime);
                    const height = timeStrHeightPx(
                      slot.startTime,
                      slot.endTime,
                    );
                    if (height <= 0) return null;
                    return (
                      <div
                        key={slot.id}
                        className="absolute left-0 right-0 z-0"
                        style={{
                          top,
                          height,
                          background:
                            'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(184,148,74,0.04) 4px, rgba(184,148,74,0.04) 8px)',
                          borderLeft: '2px solid rgba(184,148,74,0.25)',
                        }}
                      />
                    );
                  })
                : null}

              {/* Outside availability — greyed out */}
              {hasAvail &&
                (() => {
                  // Sort slots by start
                  const sorted = dayAvail.toSorted((a, b) =>
                    a.startTime.localeCompare(b.startTime),
                  );
                  const firstTop = timeStrTopPx(sorted[0].startTime);
                  const lastBottom =
                    timeStrTopPx(sorted.at(-1).endTime) +
                    timeStrHeightPx(
                      sorted.at(-1).startTime,
                      sorted.at(-1).endTime,
                    );
                  return (
                    <>
                      {/* Before first slot */}
                      {firstTop > 0 && (
                        <div
                          className="absolute left-0 right-0 z-0 bg-[#F8F7F5]"
                          style={{ top: 0, height: firstTop }}
                        />
                      )}
                      {/* After last slot */}
                      {lastBottom < GRID_HEIGHT && (
                        <div
                          className="absolute left-0 right-0 z-0 bg-[#F8F7F5]"
                          style={{
                            top: lastBottom,
                            height: GRID_HEIGHT - lastBottom,
                          }}
                        />
                      )}
                    </>
                  );
                })()}

              {/* No availability today */}
              {!hasAvail && (
                <div className="absolute inset-0 z-0 bg-[#F8F7F5]" />
              )}

              {/* ── Now indicator ── */}
              {nowVisible && nowDayIndex === dayIndex && (
                <div
                  className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                  style={{ top: nowTopPx }}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                  <div className="flex-1 h-[1.5px] bg-red-500" />
                </div>
              )}

              {/* ── Blocks ── */}
              {dayBlocks.map((block) => {
                const top = isoTopPx(block.startAt);
                const height = isoHeightPx(block.startAt, block.endAt);
                return (
                  <div
                    key={block.id}
                    className="absolute left-0.5 right-0.5 z-20 group"
                    style={{ top, height }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="h-full px-1.5 py-0.5 rounded border border-red-200 bg-red-50 overflow-hidden">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[10px] font-semibold text-red-700 truncate"
                          style={{ fontFamily: "'Lato', sans-serif" }}
                        >
                          {block.reason || 'Zablokowane'}
                        </span>
                        <button
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-all"
                          onClick={() => onDeleteBlock(block.id)}
                          aria-label="Odblokuj"
                        >
                          <X size={10} className="text-red-500" />
                        </button>
                      </div>
                      {height > 32 && (
                        <span
                          className="text-[9px] text-red-400"
                          style={{ fontFamily: "'Lato', sans-serif" }}
                        >
                          {fmtTime(block.startAt)}–{fmtTime(block.endAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* ── Sessions ── */}
              {daySessions.map((session) => {
                const top = isoTopPx(session.startAt);
                const height = isoHeightPx(session.startAt, session.endAt);
                const confirmed = session.status === 'confirmed';
                const cancelled = session.status === 'cancelled';
                const nowSession =
                  Date.now() >= new Date(session.startAt).getTime() &&
                  Date.now() <= new Date(session.endAt).getTime();
                const past = new Date(session.endAt).getTime() < Date.now();
                const bg = nowSession
                  ? '#F0FDF4'
                  : confirmed
                    ? '#F7FEF9'
                    : cancelled
                      ? '#F5F5F5'
                      : '#EFF6FF';
                const border = nowSession
                  ? '#22C55E'
                  : confirmed
                    ? '#86EFAC'
                    : cancelled
                      ? '#D4D4D4'
                      : '#93C5FD';
                const color = nowSession
                  ? '#15803D'
                  : confirmed
                    ? '#16A34A'
                    : cancelled
                      ? '#737373'
                      : '#1D4ED8';
                return (
                  <div
                    key={session.id}
                    className="absolute left-0.5 right-0.5 z-20 rounded overflow-hidden cursor-pointer group/session"
                    style={{
                      top,
                      height,
                      opacity: past && !nowSession ? 0.55 : 1,
                      filter: past && !nowSession ? 'grayscale(0.4)' : 'none',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSessionClick(session);
                    }}
                    title={`${session.clientName} · ${session.serviceName}`}
                  >
                    <div
                      className="h-full px-1.5 py-1 rounded border overflow-hidden transition-shadow group-hover/session:shadow-md"
                      style={{ backgroundColor: bg, borderColor: border }}
                    >
                      {nowSession && height > 16 && (
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                          <span
                            className="text-[8px] font-bold uppercase text-green-600"
                            style={{ fontFamily: "'Lato', sans-serif" }}
                          >
                            Teraz
                          </span>
                        </div>
                      )}
                      <div
                        className="text-[10px] font-semibold truncate leading-tight"
                        style={{ color, fontFamily: "'Lato', sans-serif" }}
                      >
                        {session.clientName}
                      </div>
                      {height > 28 && (
                        <div
                          className="text-[9px] opacity-80 leading-tight"
                          style={{ color, fontFamily: "'Lato', sans-serif" }}
                        >
                          {fmtTime(session.startAt)}–{fmtTime(session.endAt)}
                        </div>
                      )}
                      {height > 46 && (
                        <div
                          className="text-[9px] opacity-60 truncate leading-tight"
                          style={{ color, fontFamily: "'Lato', sans-serif" }}
                        >
                          {session.serviceName}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ─── Legend ─── */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 border-t border-[#E8E4DF] bg-[#FAFAF8]">
        <LegendDot bg="#F0FDF4" border="#86EFAC" label="Potwierdzona" />
        <LegendDot bg="#F5F5F5" border="#D4D4D4" label="Anulowana" />
        <LegendDot bg="#FEF2F2" border="#FCA5A5" label="Zablokowana" />
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{
              background:
                'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(184,148,74,0.15) 2px, rgba(184,148,74,0.15) 4px)',
              border: '1px solid rgba(184,148,74,0.3)',
            }}
          />
          <span
            className="text-[9px] text-[#8A8A8A]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Dostępna
          </span>
        </div>
        <span
          className="ml-auto text-[9px] text-[#AAAAAA] hidden sm:block"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          Kliknij w dzień aby zablokować czas
        </span>
      </div>

      {/* ─── Slot action chooser: Block or Schedule ─── */}
      {slotAction &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => setSlotAction(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 340,
                margin: '0 16px',
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '18px 20px 14px',
                  borderBottom: '1px solid #F0EDE8',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className="font-bold text-base text-[#2D2D2D]"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {slotAction.date} · {slotAction.startTime}
                    </h4>
                    <p
                      className="text-[11px] text-[#8A8A8A] mt-0.5"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Co chcesz zrobić z tym slotami?
                    </p>
                  </div>
                  <button
                    onClick={() => setSlotAction(null)}
                    className="p-1.5 rounded-lg hover:bg-[#F5F2ED] text-[#6B6B6B] transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  padding: '12px 20px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <button
                  onClick={() =>
                    openBlockDialog(slotAction.date, slotAction.startTime)
                  }
                  className="flex items-start gap-3 p-3 rounded-xl border border-[#E8E4DF] hover:border-red-200 hover:bg-red-50 text-left transition-colors group"
                >
                  <Lock
                    size={16}
                    className="text-red-400 mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <span
                      className="block text-[13px] font-semibold text-[#2D2D2D] group-hover:text-red-700"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Zablokuj czas
                    </span>
                    <span
                      className="block text-[11px] text-[#8A8A8A] mt-0.5"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Klienci nie będą mogli rezerwować
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onScheduleManual(slotAction.date, slotAction.startTime);
                    setSlotAction(null);
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[#E8E4DF] hover:border-[#B8944A] hover:bg-[#FDF8F0] text-left transition-colors group"
                >
                  <CalendarPlus
                    size={16}
                    className="text-[#B8944A] mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <span
                      className="block text-[13px] font-semibold text-[#2D2D2D] group-hover:text-[#B8944A]"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Zaplanuj sesję
                    </span>
                    <span
                      className="block text-[11px] text-[#8A8A8A] mt-0.5"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Ręcznie utwórz sesję dla klienta
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ─── Block dialog — rendered via portal to escape overflow ─── */}
      {dialog &&
        createPortal(
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
            onClick={() => setDialog(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 400,
                margin: '0 16px',
                background: '#fff',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Dialog header */}
              <div
                className="px-6 py-4"
                style={{
                  background:
                    'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <h3
                    className="font-bold text-lg text-white"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Zablokuj czas
                  </h3>
                  <button
                    onClick={() => setDialog(null)}
                    className="p-1 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p
                  className="text-white/75 text-xs mt-0.5"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Klienci nie będą mogli zarezerwować tego czasu
                </p>
              </div>

              {/* Dialog body */}
              <div className="px-6 py-5 flex flex-col gap-4">
                <Field label="Data">
                  <input
                    type="date"
                    value={dialog.date}
                    onChange={(e) =>
                      setDialog((d) => (d ? { ...d, date: e.target.value } : d))
                    }
                    className="w-full border border-[#E8E4DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Od">
                    <input
                      type="time"
                      value={dialog.startTime}
                      onChange={(e) =>
                        setDialog((d) =>
                          d ? { ...d, startTime: e.target.value } : d,
                        )
                      }
                      className="w-full border border-[#E8E4DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    />
                  </Field>
                  <Field label="Do">
                    <input
                      type="time"
                      value={dialog.endTime}
                      onChange={(e) =>
                        setDialog((d) =>
                          d ? { ...d, endTime: e.target.value } : d,
                        )
                      }
                      className="w-full border border-[#E8E4DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    />
                  </Field>
                </div>

                {dialog.startTime &&
                  dialog.endTime &&
                  dialog.startTime >= dialog.endTime && (
                    <p
                      className="text-xs text-red-500"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Godzina końcowa musi być późniejsza niż początkowa
                    </p>
                  )}

                <Field label="Powód (opcjonalnie)">
                  <input
                    type="text"
                    value={dialog.reason}
                    placeholder="np. Urlop, Spotkanie prywatne…"
                    onChange={(e) =>
                      setDialog((d) =>
                        d ? { ...d, reason: e.target.value } : d,
                      )
                    }
                    className="w-full border border-[#E8E4DF] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </Field>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setDialog(null)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold border border-[#E8E4DF] text-[#6B6B6B] hover:border-[#B8944A] hover:text-[#B8944A] transition-colors"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={submitBlock}
                    disabled={
                      isCreating ||
                      !dialog.date ||
                      !dialog.startTime ||
                      !dialog.endTime ||
                      dialog.startTime >= dialog.endTime
                    }
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                    style={{
                      fontFamily: "'Lato', sans-serif",
                      background:
                        'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                    }}
                  >
                    {isCreating ? 'Zapisywanie…' : 'Zablokuj'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
