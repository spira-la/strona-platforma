import { createPortal } from 'react-dom';
import {
  X,
  Calendar,
  Clock,
  User,
  Mail,
  Video,
  AlertTriangle,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import type { CoachSession } from '@/clients/coach.client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionDetailModalProps {
  session: CoachSession;
  onClose: () => void;
  onReschedule: (session: CoachSession) => void;
  onCancel: (session: CoachSession) => void;
  isCancelling?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  confirmed: { bg: '#F0FDF4', text: '#15803D', label: 'Potwierdzona' },
  completed: { bg: '#F5F5F5', text: '#525252', label: 'Zakończona' },
  cancelled: { bg: '#FEF2F2', text: '#DC2626', label: 'Anulowana' },
  no_show: { bg: '#FFF7ED', text: '#EA580C', label: 'Nieobecność' },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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

function isNow(startAt: string, endAt: string): boolean {
  const now = Date.now();
  return new Date(startAt).getTime() <= now && now <= new Date(endAt).getTime();
}

function isPast(endAt: string): boolean {
  return new Date(endAt).getTime() < Date.now();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionDetailModal({
  session,
  onClose,
  onReschedule,
  onCancel,
  isCancelling = false,
}: SessionDetailModalProps) {
  const now = isNow(session.startAt, session.endAt);
  const past = isPast(session.endAt);
  const canAct = session.status === 'confirmed' && !past;
  const statusStyle = STATUS_STYLES[session.status] ?? {
    bg: '#F5F5F5',
    text: '#525252',
    label: session.status,
  };

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
          maxWidth: 480,
          margin: '0 16px',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            background: now
              ? 'linear-gradient(135deg, #059669 0%, #34D399 100%)'
              : past || session.status === 'cancelled'
                ? '#F5F5F5'
                : 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {now && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest text-white/90"
                    style={{ fontFamily: "'Lato', sans-serif" }}
                  >
                    Trwa teraz
                  </span>
                </div>
              )}
              <h3
                className={`font-bold text-xl leading-tight ${past || session.status === 'cancelled' ? 'text-[#525252]' : 'text-white'}`}
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {session.clientName}
              </h3>
              <p
                className={`text-sm mt-0.5 ${past || session.status === 'cancelled' ? 'text-[#737373]' : 'text-white/75'}`}
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {session.serviceName || 'Sesja indywidualna'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border"
                style={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                  borderColor: `${statusStyle.text}33`,
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                {statusStyle.label}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                style={{
                  color:
                    past || session.status === 'cancelled' ? '#737373' : '#fff',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Date + Time */}
          <div className="flex flex-col gap-2.5">
            <Row
              icon={<Calendar size={15} className="text-[#B8944A]" />}
              label="Data"
            >
              <span
                className="text-[13px] text-[#2D2D2D] font-medium"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {fmtDate(session.startAt)}
              </span>
            </Row>
            <Row
              icon={<Clock size={15} className="text-[#B8944A]" />}
              label="Godzina"
            >
              <span
                className="text-[13px] text-[#2D2D2D] font-medium"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {fmtTime(session.startAt)} – {fmtTime(session.endAt)}
                <span className="ml-2 text-[12px] text-[#8A8A8A] font-normal">
                  ({durationMins(session.startAt, session.endAt)} min)
                </span>
              </span>
            </Row>
          </div>

          <div className="border-t border-[#F0EDE8]" />

          {/* Client */}
          <div className="flex flex-col gap-2.5">
            <Row
              icon={<User size={15} className="text-[#B8944A]" />}
              label="Klient"
            >
              <span
                className="text-[13px] text-[#2D2D2D] font-medium"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {session.clientName}
              </span>
            </Row>
            {session.clientEmail && (
              <Row
                icon={<Mail size={15} className="text-[#B8944A]" />}
                label="Email"
              >
                <a
                  href={`mailto:${session.clientEmail}`}
                  className="text-[13px] text-[#B8944A] hover:underline"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {session.clientEmail}
                </a>
              </Row>
            )}
          </div>

          {/* Meeting link */}
          {session.meetingUrl && (
            <>
              <div className="border-t border-[#F0EDE8]" />
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background:
                    'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                <Video size={15} />
                Dołącz do spotkania
              </a>
            </>
          )}

          {/* Reschedule history */}
          {session.rescheduledAt && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <RotateCcw size={13} className="text-amber-600 flex-shrink-0" />
              <span
                className="text-[11px] text-amber-700"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Przeplanowano{' '}
                {new Date(session.rescheduledAt).toLocaleDateString('pl-PL')}
              </span>
            </div>
          )}

          {/* Cancellation reason */}
          {session.cancellationReason && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
              <AlertTriangle
                size={13}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <span
                className="text-[11px] text-red-600"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {session.cancellationReason}
              </span>
            </div>
          )}

          {/* Actions */}
          {canAct && (
            <>
              <div className="border-t border-[#F0EDE8]" />
              <div className="flex gap-2">
                <button
                  onClick={() => onReschedule(session)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold border border-[#B8944A] text-[#B8944A] hover:bg-[#FDF8F0] transition-colors"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <RefreshCw size={13} />
                  Przeplanuj
                </button>
                <button
                  onClick={() => onCancel(session)}
                  disabled={isCancelling}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <X size={13} />
                  {isCancelling ? 'Anulowanie…' : 'Anuluj sesję'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span
          className="text-[9px] font-bold uppercase tracking-wider text-[#AAAAAA]"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}
