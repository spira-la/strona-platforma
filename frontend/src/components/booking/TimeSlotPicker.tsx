import { Clock } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface TimeSlotPickerProps {
  selectedDate: Date;
  selectedTime: string | null;
  onSelectTime: (time: string) => void;
  onConfirm: () => void;
  /** Session duration in minutes */
  duration?: number;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const MORNING_SLOTS: TimeSlot[] = [
  { time: '9:00', available: true },
  { time: '9:30', available: true },
  { time: '10:00', available: false },
  { time: '10:30', available: true },
];

const AFTERNOON_SLOTS: TimeSlot[] = [
  { time: '13:00', available: true },
  { time: '13:30', available: false },
  { time: '14:00', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: true },
  { time: '15:30', available: false },
  { time: '16:00', available: true },
  { time: '16:30', available: true },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES_LONG = [
  'Niedziela',
  'Poniedzialek',
  'Wtorek',
  'Sroda',
  'Czwartek',
  'Piatek',
  'Sobota',
];

const MONTH_NAMES_GENITIVE = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'wrzesnia',
  'pazdziernika',
  'listopada',
  'grudnia',
];

function formatDate(date: Date): string {
  const dayName = DAY_NAMES_LONG[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES_GENITIVE[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface SlotGroupProps {
  label: string;
  slots: TimeSlot[];
  selected: string | null;
  onSelect: (time: string) => void;
}

function SlotGroup({ label, slots, selected, onSelect }: SlotGroupProps) {
  return (
    <div>
      <p
        className="text-xs font-bold uppercase tracking-wider text-[#8A8A8A] mb-3"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {slots.map(({ time, available }, index) => {
          const isSelected = selected === time;
          let classes =
            'px-4 py-2 rounded-full text-sm font-medium border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8944A] ';

          if (!available) {
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
              key={time}
              type="button"
              className={classes}
              disabled={!available}
              onClick={() => available && onSelect(time)}
              aria-pressed={isSelected}
              aria-label={`${time}${available ? '' : ' - niedostepna'}`}
              style={{
                fontFamily: "'Lato', sans-serif",
                animation: `slotAppear 600ms cubic-bezier(0.19, 1, 0.22, 1) ${index * 50}ms both`,
              }}
            >
              {time}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TimeSlotPicker({
  selectedDate,
  selectedTime,
  onSelectTime,
  onConfirm,
  duration = 60,
}: TimeSlotPickerProps) {
  const formattedDate = formatDate(selectedDate);

  return (
    <div className="w-full rounded-lg overflow-hidden border border-[#E8E4DF] bg-white shadow-sm">
      {/* Header */}
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
          Zarezerwuj swoja sesje
        </p>
        <p
          className="text-lg font-bold text-white"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Wybierz godzine, ktora Ci najbardziej odpowiada
        </p>
      </div>

      <div className="px-5 py-6">
        {/* Selected date display */}
        <div className="mb-5 p-4 rounded-lg bg-[#FAF8F5] border border-[#F0EDE8]">
          <p
            className="text-sm font-bold text-[#2D2D2D] mb-0.5"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {formattedDate}
          </p>
          <p
            className="text-xs text-[#8A8A8A]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Wybierz godzine ponizej
          </p>
        </div>

        {/* Slot groups */}
        <div className="flex flex-col gap-6">
          <SlotGroup
            label="Rano"
            slots={MORNING_SLOTS}
            selected={selectedTime}
            onSelect={onSelectTime}
          />
          <SlotGroup
            label="Po poludniu"
            slots={AFTERNOON_SLOTS}
            selected={selectedTime}
            onSelect={onSelectTime}
          />
        </div>

        {/* Summary + confirm */}
        {selectedTime && (
          <div
            className="mt-6 pt-5 border-t border-[#F0EDE8]"
            style={{
              animation:
                'summaryAppear 800ms cubic-bezier(0.19, 1, 0.22, 1) both',
            }}
          >
            <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-[rgba(184,148,74,0.06)] border border-[rgba(184,148,74,0.2)]">
              <Clock size={16} className="text-[#B8944A] flex-shrink-0" />
              <div style={{ fontFamily: "'Lato', sans-serif" }}>
                <p className="text-sm font-semibold text-[#2D2D2D]">
                  {formattedDate} o {selectedTime}
                </p>
                <p className="text-xs text-[#8A8A8A]">
                  Czas trwania: {duration} min
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onConfirm}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#B8944A]"
              style={{
                background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                fontFamily: "'Lato', sans-serif",
              }}
            >
              Potwierdzam termin
            </button>

            <p
              className="text-center text-xs text-[#8A8A8A] mt-3"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Otrzymasz potwierdzenie na adres e-mail
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeSlotPicker;
