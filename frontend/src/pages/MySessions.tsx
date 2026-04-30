import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Video,
  RotateCcw,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { bookingsClient, type Booking } from '@/clients/bookings.client';
import { MultiSessionPicker } from '@/components/booking/MultiSessionPicker';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pl-PL', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

/**
 * /moje-sesje
 *
 * Authenticated user's upcoming and past bookings, with reschedule + cancel
 * flows that honour the coach's `minCancellationNotice` policy.
 */
export default function MySessions() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <p className="text-sm text-[#8A8A8A]">Ladowanie…</p>
      </main>
    );
  }
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  return <AuthenticatedMySessions userId={user.id} />;
}

function AuthenticatedMySessions({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['bookings', 'by-user', userId],
    queryFn: () => bookingsClient.getByUser(userId),
  });

  const bookings = data ?? [];
  const [now] = useState(() => Date.now());
  const upcoming = bookings
    .filter((b) => new Date(b.startTime).getTime() > now)
    .toSorted(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  const past = bookings
    .filter((b) => new Date(b.startTime).getTime() <= now)
    .toSorted(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

  const [rescheduling, setRescheduling] = useState<Booking | null>(null);

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#2D2D2D] pb-24">
      <SEO title="Moje sesje" canonical="/moje-sesje" noindex />

      <section className="px-6 pt-10 pb-6">
        <div className="max-w-[900px] mx-auto flex flex-col gap-3">
          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            MOJE SESJE
          </h1>
          <p
            className="text-sm text-[#6B6B6B]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Twoje nadchodzace i zakonczone sesje.
          </p>
        </div>
      </section>

      <section className="px-6">
        <div className="max-w-[900px] mx-auto flex flex-col gap-6">
          {isLoading && (
            <p
              className="text-sm text-[#8A8A8A]"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Ladowanie…
            </p>
          )}

          {!isLoading && bookings.length === 0 && <EmptyState />}

          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Nadchodzace
              </h2>
              {upcoming.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onReschedule={() => setRescheduling(b)}
                  onMutated={() =>
                    queryClient.invalidateQueries({
                      queryKey: ['bookings', 'by-user', userId],
                    })
                  }
                />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2
                className="text-lg font-bold mt-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Historia
              </h2>
              {past.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  onReschedule={() => {}}
                  onMutated={() => {}}
                  readOnly
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {rescheduling && (
        <RescheduleDialog
          booking={rescheduling}
          userId={userId}
          onClose={() => setRescheduling(null)}
          onDone={() => {
            setRescheduling(null);
            queryClient.invalidateQueries({
              queryKey: ['bookings', 'by-user', userId],
            });
          }}
        />
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl p-10 text-center border border-[#E8E4DF] bg-white">
      <div
        className="flex items-center justify-center w-12 h-12 mx-auto rounded-full bg-[rgba(184,148,74,0.1)] text-[#B8944A] mb-3"
        aria-hidden
      >
        <Calendar size={20} />
      </div>
      <p
        className="text-sm text-[#6B6B6B] mb-4"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        Nie masz jeszcze zadnych sesji.
      </p>
      <Link
        to="/rezerwacja"
        className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white hover:opacity-90"
        style={{
          background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
          fontFamily: "'Lato', sans-serif",
        }}
      >
        Zarezerwuj sesje
      </Link>
    </div>
  );
}

function BookingRow({
  booking,
  onReschedule,
  onMutated,
  readOnly = false,
}: {
  booking: Booking;
  onReschedule: () => void;
  onMutated: () => void;
  readOnly?: boolean;
}) {
  const [nowMs] = useState(() => Date.now());
  const canJoin =
    booking.status === 'confirmed' &&
    nowMs >= new Date(booking.startTime).getTime() - 10 * 60 * 1000 &&
    nowMs <= new Date(booking.endTime).getTime() + 120 * 60 * 1000;

  const cancelMutation = useMutation({
    mutationFn: () => bookingsClient.cancel(booking.id),
    onSuccess: onMutated,
  });

  const canReschedule = useQuery({
    queryKey: ['booking', booking.id, 'can-reschedule'],
    queryFn: () => bookingsClient.canReschedule(booking.id),
    enabled: !readOnly && booking.status === 'confirmed',
  });

  const statusBadge =
    booking.status === 'confirmed' ? (
      <span className="text-[11px] font-semibold text-[#4CAF50] uppercase tracking-wider">
        Potwierdzona
      </span>
    ) : booking.status === 'cancelled' ? (
      <span className="text-[11px] font-semibold text-[#C62828] uppercase tracking-wider">
        Anulowana
      </span>
    ) : booking.status === 'completed' ? (
      <span className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wider">
        Zakonczona
      </span>
    ) : null;

  return (
    <article className="rounded-2xl p-5 border border-[#E8E4DF] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(184,148,74,0.1)] text-[#B8944A] flex-shrink-0"
          aria-hidden
        >
          <Calendar size={18} />
        </div>
        <div>
          {statusBadge}
          <p
            className="text-sm font-semibold mt-1"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {formatDateTime(booking.startTime)}
          </p>
          {booking.rescheduledFrom && (
            <p
              className="text-xs text-[#8A8A8A] mt-0.5"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Przeniesiono z: {formatDateTime(booking.rescheduledFrom)}
            </p>
          )}
        </div>
      </div>

      {!readOnly && booking.status === 'confirmed' && (
        <div className="flex items-center gap-2 flex-wrap">
          {canJoin && (
            <Link
              to={`/session/${booking.id}`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                fontFamily: "'Lato', sans-serif",
              }}
            >
              <Video size={14} /> Dolacz
            </Link>
          )}
          <button
            type="button"
            onClick={onReschedule}
            disabled={!canReschedule.data?.canReschedule}
            title={canReschedule.data?.reason}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-[#E8E4DF] text-[#6B6B6B] hover:border-[#B8944A] hover:text-[#B8944A] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <RotateCcw size={12} /> Przenies
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Anulowac te sesje?')) cancelMutation.mutate();
            }}
            disabled={cancelMutation.isPending}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-[#E8E4DF] text-[#6B6B6B] hover:border-[#C62828] hover:text-[#C62828] disabled:opacity-40"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <X size={12} /> Anuluj
          </button>
        </div>
      )}

      {!readOnly &&
        booking.status === 'confirmed' &&
        canReschedule.data &&
        !canReschedule.data.canReschedule && (
          <p
            className="text-[11px] text-[#8A8A8A] flex items-center gap-1"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <AlertCircle size={12} />
            {canReschedule.data.reason}
          </p>
        )}
    </article>
  );
}

function RescheduleDialog({
  booking,
  userId,
  onClose,
  onDone,
}: {
  booking: Booking;
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const durationMinutes = Math.round(
    (new Date(booking.endTime).getTime() -
      new Date(booking.startTime).getTime()) /
      60_000,
  );
  const [selected, setSelected] = useState<
    { startTime: string; endTime: string }[]
  >([]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      bookingsClient.reschedule(booking.id, {
        newStartTime: selected[0].startTime,
        newEndTime: selected[0].endTime,
        reason: reason.trim() || undefined,
        userId,
      }),
    onSuccess: onDone,
    onError: (err) => setError((err as Error).message),
  });

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#FAF8F5] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Przenies sesje
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5"
            aria-label="Zamknij"
          >
            <X size={18} />
          </button>
        </div>

        <p
          className="text-xs text-[#6B6B6B] mb-4"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          Obecny termin: {formatDateTime(booking.startTime)}
        </p>

        <MultiSessionPicker
          coachId={booking.coachId}
          sessionCount={1}
          durationMinutes={durationMinutes}
          selected={selected}
          onChange={setSelected}
          onConfirm={() => {
            /* user confirms below */
          }}
        />

        <div className="mt-4">
          <label
            className="block text-xs font-semibold uppercase tracking-wider text-[#8A8A8A] mb-1"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Powod zmiany (opcjonalnie)
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-[#E8E4DF] p-3 text-sm focus:border-[#B8944A] focus:outline-none"
            style={{ fontFamily: "'Lato', sans-serif" }}
          />
        </div>

        {error && (
          <p
            className="text-xs text-[#C62828] mt-2"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#E8E4DF] text-[#6B6B6B] hover:bg-[#F0EDE8]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={selected.length === 0 || mutation.isPending}
            className="inline-flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
              fontFamily: "'Lato', sans-serif",
            }}
          >
            <Check size={14} /> Potwierdz
          </button>
        </div>
      </div>
    </div>
  );
}
