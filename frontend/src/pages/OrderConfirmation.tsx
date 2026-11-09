import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, Calendar, Video, Mail } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { ordersClient } from '@/clients/orders.client';
import { bookingsClient } from '@/clients/bookings.client';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pl-PL', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

function formatPrice(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  } catch {
    return `${cents / 100} ${currency}`;
  }
}

/**
 * /zamowienie/:orderId
 *
 * After the webhook/mock confirm runs, the order becomes `paid` and N bookings
 * are created asynchronously. This page polls until the order is paid and
 * bookings appear, then displays the meeting links + a reminder that the
 * .ics attachment has already been emailed to the customer.
 */
export default function OrderConfirmation() {
  const { orderId = '' } = useParams();

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersClient.getById(orderId),
    enabled: !!orderId,
    refetchInterval: (q) => (q.state.data?.status === 'paid' ? false : 1500),
  });

  const paid = orderQuery.data?.status === 'paid';

  const bookingsQuery = useQuery({
    queryKey: ['bookings', 'by-order', orderId],
    queryFn: () => bookingsClient.getByOrder(orderId),
    enabled: paid,
    refetchInterval: (q) =>
      q.state.data && q.state.data.length > 0 ? false : 1500,
  });

  // Trigger a refetch once paid flips
  useEffect(() => {
    if (paid) void bookingsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid]);

  const bookings = bookingsQuery.data ?? [];
  const order = orderQuery.data;

  return (
    <main className="min-h-screen bg-surface text-ink pb-24">
      <SEO
        title="Potwierdzenie zamowienia"
        canonical={`/zamowienie/${orderId}`}
        noindex
      />

      <section className="px-6 pt-16 pb-8">
        <div className="max-w-[720px] mx-auto text-center flex flex-col items-center gap-4">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(76,175,80,0.1)] text-[#4CAF50]"
            aria-hidden
          >
            <Check size={32} />
          </div>
          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Dziekuje!
          </h1>
          <p
            className="text-sm sm:text-base text-ink-soft max-w-[520px]"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {paid
              ? 'Twoja platnosc zostala pomyslnie przetworzona. Ponizej znajdziesz potwierdzenie swoich terminow.'
              : 'Trwa przetwarzanie platnosci…'}
          </p>
        </div>
      </section>

      <section className="px-6">
        <div className="max-w-[720px] mx-auto flex flex-col gap-5">
          {orderQuery.isLoading && (
            <p
              className="text-sm text-ink-muted text-center"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Ladowanie…
            </p>
          )}

          {order && (
            <div className="rounded-2xl p-5 border border-line bg-white">
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-widest text-ink-muted"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Numer zamowienia
                </p>
                <p
                  className="text-[11px] text-ink-muted font-mono"
                  style={{ letterSpacing: '0.05em' }}
                >
                  {order.id.slice(0, 8)}…
                </p>
              </div>
              <div
                className="flex justify-between text-sm py-2 border-t border-line-soft"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                <span>Status</span>
                <span
                  className={
                    order.status === 'paid'
                      ? 'text-[#4CAF50] font-semibold'
                      : 'text-ink-muted'
                  }
                >
                  {order.status === 'paid' ? 'Oplacone' : 'Oczekujace'}
                </span>
              </div>
              <div
                className="flex justify-between text-sm py-2 border-t border-line-soft"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                <span>Kwota</span>
                <span className="font-semibold">
                  {formatPrice(order.amountCents, order.currency ?? 'PLN')}
                </span>
              </div>
              {(order.customerEmail ?? '').length > 0 && (
                <div
                  className="flex justify-between text-sm py-2 border-t border-line-soft"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  <span>E-mail</span>
                  <span>{order.customerEmail}</span>
                </div>
              )}
            </div>
          )}

          {paid && bookings.length === 0 && (
            <div
              className="rounded-2xl p-5 border border-line bg-white text-sm text-ink-soft"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Przygotowujemy Twoje terminy…
            </div>
          )}

          {bookings.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2
                className="text-lg font-bold mt-2"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Twoje terminy
              </h2>
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl p-5 border border-line bg-white flex items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full bg-brand/10 text-brand"
                      aria-hidden
                    >
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p
                        className="text-sm font-semibold text-ink"
                        style={{ fontFamily: "'Lato', sans-serif" }}
                      >
                        {formatDateTime(b.startTime)}
                      </p>
                      <p
                        className="text-xs text-ink-muted mt-0.5"
                        style={{ fontFamily: "'Lato', sans-serif" }}
                      >
                        {Math.round(
                          (new Date(b.endTime).getTime() -
                            new Date(b.startTime).getTime()) /
                            60_000,
                        )}{' '}
                        min
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/session/${b.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold text-white hover:opacity-90"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-light) 100%)',
                      fontFamily: "'Lato', sans-serif",
                    }}
                  >
                    <Video size={14} /> Dolacz
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div
            className="flex items-center gap-2 text-xs text-ink-muted mt-2"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <Mail size={14} />
            Wyslalismy potwierdzenie na Twoj adres e-mail z zalacznikiem .ics
            dodajacym sesje do kalendarza.
          </div>
        </div>
      </section>
    </main>
  );
}
