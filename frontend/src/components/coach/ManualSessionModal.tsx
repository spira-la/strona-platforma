import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Clock, Calendar, Briefcase } from 'lucide-react';
import type {
  CoachService,
  CreateManualSessionData,
} from '@/clients/coach.client';

export interface ManualSessionModalProps {
  prefillDate?: string; // YYYY-MM-DD
  prefillStart?: string; // HH:MM
  services: CoachService[];
  pastClients?: { email: string; name: string }[];
  onSubmit: (data: CreateManualSessionData) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + mins;
  const nh = Math.min(Math.floor(total / 60), 23);
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
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

const INPUT =
  'w-full border border-[#E8E4DF] rounded-lg px-3 py-2.5 text-sm text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#B8944A] focus:border-transparent bg-white';

export function ManualSessionModal({
  prefillDate,
  prefillStart,
  services,
  pastClients = [],
  onSubmit,
  onClose,
  isSubmitting = false,
}: ManualSessionModalProps) {
  const today = toDateStr(new Date());
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(prefillDate ?? today);
  const [startTime, setStartTime] = useState(prefillStart ?? '10:00');
  const [endTime, setEndTime] = useState(
    addMinutes(prefillStart ?? '10:00', 60),
  );
  const [serviceId, setServiceId] = useState('');
  const [notes, setNotes] = useState('');

  const activeServices = services.filter((s) => s.isActive);

  // When start time changes, auto-update end time by the service duration or 60 min
  function handleStartChange(val: string) {
    setStartTime(val);
    const selectedService = activeServices.find((s) => s.id === serviceId);
    const dur = selectedService?.durationMinutes ?? 60;
    setEndTime(addMinutes(val, dur));
  }

  // When service changes, auto-update end time
  function handleServiceChange(id: string) {
    setServiceId(id);
    const svc = activeServices.find((s) => s.id === id);
    if (svc) setEndTime(addMinutes(startTime, svc.durationMinutes));
  }

  const isValid =
    clientEmail.trim().length > 0 &&
    clientEmail.includes('@') &&
    date &&
    startTime &&
    endTime &&
    startTime < endTime;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit({
      clientEmail: clientEmail.trim(),
      clientName: clientName.trim() || undefined,
      serviceId: serviceId || undefined,
      startAt: `${date}T${startTime}:00`,
      endAt: `${date}T${endTime}:00`,
      notes: notes.trim() || undefined,
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
          maxWidth: 460,
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
                Zaplanuj sesję
              </h3>
              <p
                className="text-white/70 text-xs mt-0.5"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Sesja ręczna · bez płatności przez platformę
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
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Client info */}
          <div className="flex flex-col gap-3">
            <p
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B8944A]"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <User size={11} /> Klient
            </p>

            {/* Past clients quick-select */}
            {pastClients.length > 0 && (
              <div>
                <p
                  className="text-[9px] font-bold uppercase tracking-wider text-[#AAAAAA] mb-1.5"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Poprzedni klienci
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {pastClients.map((c) => {
                    const isSelected = clientEmail === c.email;
                    return (
                      <button
                        key={c.email}
                        type="button"
                        onClick={() => {
                          setClientEmail(c.email);
                          setClientName(c.name);
                        }}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          isSelected
                            ? 'border-[#B8944A] bg-[#B8944A] text-white'
                            : 'border-[#E8E4DF] text-[#2D2D2D] hover:border-[#B8944A] hover:text-[#B8944A]'
                        }`}
                        style={{ fontFamily: "'Lato', sans-serif" }}
                      >
                        {c.name || c.email.split('@')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <Field label="Email *">
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]"
                />
                <input
                  type="email"
                  placeholder="klient@example.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className={`${INPUT} pl-9`}
                  style={{ fontFamily: "'Lato', sans-serif" }}
                />
              </div>
            </Field>
            <Field label="Imię i nazwisko">
              <input
                type="text"
                placeholder="Jan Kowalski"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={INPUT}
                style={{ fontFamily: "'Lato', sans-serif" }}
              />
            </Field>
          </div>

          <div className="border-t border-[#F0EDE8]" />

          {/* Date + Time */}
          <div className="flex flex-col gap-3">
            <p
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B8944A]"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <Calendar size={11} /> Termin
            </p>
            <Field label="Data">
              <input
                type="date"
                value={date}
                min={today}
                onChange={(e) => setDate(e.target.value)}
                className={INPUT}
                style={{ fontFamily: "'Lato', sans-serif" }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Godzina od">
                <div className="relative">
                  <Clock
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartChange(e.target.value)}
                    className={`${INPUT} pl-9`}
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </div>
              </Field>
              <Field label="Godzina do">
                <div className="relative">
                  <Clock
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAAAAA]"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`${INPUT} pl-9`}
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  />
                </div>
              </Field>
            </div>
            {startTime && endTime && startTime >= endTime && (
              <p
                className="text-xs text-red-500"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Godzina zakończenia musi być późniejsza
              </p>
            )}
          </div>

          {/* Service */}
          {activeServices.length > 0 && (
            <>
              <div className="border-t border-[#F0EDE8]" />
              <div className="flex flex-col gap-3">
                <p
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#B8944A]"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <Briefcase size={11} /> Usługa
                </p>
                <Field label="Wybierz usługę (opcjonalnie)">
                  <select
                    value={serviceId}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className={INPUT}
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    <option value="">— brak —</option>
                    {activeServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.durationMinutes} min
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="border-t border-[#F0EDE8]" />
          <Field label="Notatki (opcjonalnie)">
            <textarea
              rows={2}
              placeholder="Temat sesji, uwagi…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${INPUT} resize-none`}
              style={{ fontFamily: "'Lato', sans-serif" }}
            />
          </Field>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-[#E8E4DF] text-[#6B6B6B] hover:border-[#B8944A] hover:text-[#B8944A] transition-colors"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Anuluj
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              style={{
                fontFamily: "'Lato', sans-serif",
                background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
              }}
            >
              {isSubmitting ? 'Zapisywanie…' : 'Zaplanuj sesję'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
