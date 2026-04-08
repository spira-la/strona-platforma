import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BookingCalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  /** Dates that are unavailable — defaults to Sundays + Saturdays */
  unavailableDates?: Date[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAY_LABELS = ['Pn', 'Wt', 'Sr', 'Cz', 'Pt', 'So', 'Nd'];

const MONTH_NAMES = [
  'Styczen',
  'Luty',
  'Marzec',
  'Kwiecien',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpien',
  'Wrzesien',
  'Pazdziernik',
  'Listopad',
  'Grudzien',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns the index (0=Mon … 6=Sun) of the first day of the given month,
 * adjusting the JS Sunday-first convention to Monday-first.
 */
function getFirstWeekdayIndex(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingCalendar({
  selectedDate,
  onSelectDate,
  unavailableDates = [],
}: BookingCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekdayIndex(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function isUnavailable(date: Date): boolean {
    if (isWeekend(date)) return true;
    if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return true;
    return unavailableDates.some((d) => isSameDay(d, date));
  }

  // Build calendar grid cells (nulls = leading empty cells)
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete the last row
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return (
    <div className="w-full rounded-lg overflow-hidden border border-[#E8E4DF] bg-white shadow-sm">
      {/* Header */}
      <div
        className="px-6 py-5"
        style={{
          background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 50%, #8A6F2E 100%)',
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          Zarezerwuj swoja sesje
        </p>
        <p
          className="text-lg font-bold text-white"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Wybierz date
        </p>
      </div>

      <div className="px-4 py-5">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center w-8 h-8 rounded-full text-[#6B6B6B] hover:bg-[#FAF8F5] hover:text-[#B8944A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A]"
            aria-label="Poprzedni miesiac"
          >
            <ChevronLeft size={18} />
          </button>

          <span
            className="text-sm font-bold uppercase tracking-wide text-[#2D2D2D]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            aria-live="polite"
          >
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>

          <button
            onClick={nextMonth}
            className="flex items-center justify-center w-8 h-8 rounded-full text-[#6B6B6B] hover:bg-[#FAF8F5] hover:text-[#B8944A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A]"
            aria-label="Nastepny miesiac"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[10px] font-bold uppercase tracking-wider text-[#8A8A8A] py-1"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div key={`${viewYear}-${viewMonth}`} className="grid grid-cols-7 gap-y-1" role="grid" aria-label="Kalendarz">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} aria-hidden="true" />;
            }

            const date = new Date(viewYear, viewMonth, day);
            const todayFlag = isSameDay(date, today);
            const selectedFlag = selectedDate ? isSameDay(date, selectedDate) : false;
            const unavailableFlag = isUnavailable(date);

            let cellClasses =
              'relative flex items-center justify-center w-8 h-8 mx-auto rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] ';

            if (selectedFlag) {
              cellClasses += 'bg-[#B8944A] text-white font-bold';
            } else if (unavailableFlag) {
              cellClasses += 'text-[#C0BDB9] cursor-not-allowed';
            } else if (todayFlag) {
              cellClasses +=
                'ring-2 ring-[#B8944A] text-[#B8944A] font-semibold hover:bg-[#B8944A] hover:text-white cursor-pointer';
            } else {
              cellClasses += 'text-[#2D2D2D] hover:bg-[#FAF8F5] hover:text-[#B8944A] cursor-pointer';
            }

            return (
              <div
                key={`day-${day}`}
                role="gridcell"
                style={{
                  animation: `slotAppear 500ms cubic-bezier(0.19, 1, 0.22, 1) ${(Math.floor(idx / 7) * 30) + ((idx % 7) * 15)}ms both`,
                }}
              >
                <button
                  type="button"
                  className={cellClasses}
                  disabled={unavailableFlag}
                  onClick={() => !unavailableFlag && onSelectDate(date)}
                  aria-label={`${day} ${MONTH_NAMES[viewMonth]} ${viewYear}${todayFlag ? ' - dzis' : ''}${unavailableFlag ? ' - niedostepny' : ''}`}
                  aria-pressed={selectedFlag}
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {day}
                </button>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 mt-4 pt-4 border-t border-[#F0EDE8]">
          <LegendItem color="bg-[#4CAF50]" label="Dostepny" />
          <LegendItem color="bg-[#C0BDB9]" label="Niedostepny" />
          <LegendItem color="bg-[#B8944A]" label="Dzis" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} aria-hidden="true" />
      <span
        className="text-[11px] text-[#8A8A8A]"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {label}
      </span>
    </div>
  );
}

export default BookingCalendar;
