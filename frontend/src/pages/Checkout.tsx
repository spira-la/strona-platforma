import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, CreditCard, Loader2, ChevronLeft } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { useCartStore, selectSubtotalCents } from '@/stores/cart.store';
import { useAuth } from '@/contexts/AuthContext';
import { ordersClient } from '@/clients/orders.client';
import { stripeClient } from '@/clients/stripe.client';
import { api } from '@/clients/api';

interface CouponValidationResult {
  valid: boolean;
  discountAmountCents?: number;
  error?: string;
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

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pl-PL', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cart = useCartStore();
  const subtotal = selectSubtotalCents(cart);
  const currency = cart.service?.currency ?? 'PLN';

  const { data: stripeConfig } = useQuery({
    queryKey: ['stripe-config'],
    queryFn: () => stripeClient.getConfig(),
    staleTime: 60 * 1000,
  });

  const [couponInput, setCouponInput] = useState(cart.couponCode ?? '');
  const [couponResult, setCouponResult] =
    useState<CouponValidationResult | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from auth if available
  useEffect(() => {
    if (user?.email && !cart.customerEmail) {
      cart.setCustomer({ email: user.email });
    }
    const fullName =
      (user?.user_metadata?.full_name as string | undefined) ?? '';
    if (fullName && !cart.customerName) {
      cart.setCustomer({ name: fullName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!cart.service || cart.slots.length === 0) {
    return <Navigate to="/rezerwacja" replace />;
  }

  const required = cart.service.sessionCount ?? 1;
  if (cart.slots.length !== required) {
    return <Navigate to="/rezerwacja" replace />;
  }

  const discount = couponResult?.valid
    ? (couponResult.discountAmountCents ?? 0)
    : 0;
  const total = Math.max(0, subtotal - discount);

  async function validateCoupon() {
    if (!couponInput.trim()) {
      setCouponResult(null);
      cart.setCoupon(null);
      return;
    }
    setCouponChecking(true);
    try {
      const res = await api.post<CouponValidationResult>('/coupons/validate', {
        code: couponInput.trim().toUpperCase(),
        totalAmountCents: subtotal,
      });
      setCouponResult(res);
      cart.setCoupon(res.valid ? couponInput.trim().toUpperCase() : null);
    } catch (error_) {
      setCouponResult({ valid: false, error: (error_ as Error).message });
      cart.setCoupon(null);
    } finally {
      setCouponChecking(false);
    }
  }

  async function handlePay() {
    setError(null);
    if (!cart.service) return;
    if (!cart.customerEmail.trim() || !cart.customerName.trim()) {
      setError('Wypelnij imie i e-mail');
      return;
    }

    setSubmitting(true);
    try {
      const order = await ordersClient.create({
        serviceId: cart.service.id,
        coachId: cart.service.coachId,
        userId: user?.id ?? null,
        customerEmail: cart.customerEmail.trim(),
        customerName: cart.customerName.trim(),
        customerPhone: cart.customerPhone.trim() || null,
        slots: cart.slots,
        couponCode: cart.couponCode,
        invoiceData: cart.invoiceRequired ? cart.invoiceData : null,
        notes: cart.notes.trim() || null,
      });

      if (order.paymentIntent.mocked || stripeConfig?.mockMode) {
        // Mock flow: instantly confirm via the backend mock endpoint.
        // In real mode you'd call Stripe.js here with clientSecret instead.
        await stripeClient.mockConfirm(order.paymentIntent.id);
      } else {
        // Real Stripe flow would be wired here with @stripe/stripe-js.
        setError(
          'Real Stripe checkout is not wired yet. Set STRIPE_MOCK_MODE=true to test.',
        );
        setSubmitting(false);
        return;
      }

      cart.clear();
      navigate(`/zamowienie/${order.orderId}`);
    } catch (error_) {
      setError((error_ as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-[#2D2D2D] pb-24">
      <SEO title="Platnosc" canonical="/checkout" noindex />

      <section className="px-6 pt-10 pb-6">
        <div className="max-w-[1024px] mx-auto">
          <button
            type="button"
            onClick={() => navigate('/rezerwacja')}
            className="inline-flex items-center gap-1 text-sm text-[#6B6B6B] hover:text-[#B8944A] mb-4"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <ChevronLeft size={14} /> Zmien terminy
          </button>
          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            PODSUMOWANIE
          </h1>
        </div>
      </section>

      <section className="px-6">
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* ----- Left column: customer + coupon + invoice ----- */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardTitle>Dane klienta</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Imie i nazwisko *"
                  value={cart.customerName}
                  onChange={(v) => cart.setCustomer({ name: v })}
                />
                <Field
                  type="email"
                  label="E-mail *"
                  value={cart.customerEmail}
                  onChange={(v) => cart.setCustomer({ email: v })}
                />
                <Field
                  label="Telefon (opcjonalnie)"
                  value={cart.customerPhone}
                  onChange={(v) => cart.setCustomer({ phone: v })}
                />
              </div>
              <label
                className="block mt-4 text-xs font-semibold uppercase tracking-wider text-[#8A8A8A]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Notatka dla prowadzacego (opcjonalnie)
              </label>
              <textarea
                className="w-full mt-1 rounded-lg border border-[#E8E4DF] p-3 text-sm focus:border-[#B8944A] focus:outline-none"
                rows={3}
                value={cart.notes}
                onChange={(e) => cart.setNotes(e.target.value)}
                style={{ fontFamily: "'Lato', sans-serif" }}
              />
            </Card>

            <Card>
              <CardTitle>Kod rabatowy</CardTitle>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="SPIRALA10"
                  className="flex-1 rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm uppercase tracking-widest focus:border-[#B8944A] focus:outline-none"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                />
                <button
                  type="button"
                  onClick={validateCoupon}
                  disabled={couponChecking || !couponInput.trim()}
                  className="rounded-lg border border-[#B8944A] px-4 text-sm font-semibold text-[#B8944A] hover:bg-[rgba(184,148,74,0.08)] disabled:opacity-50"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {couponChecking ? '…' : 'Zastosuj'}
                </button>
              </div>
              {couponResult && (
                <p
                  className={
                    'text-xs mt-2 ' +
                    (couponResult.valid ? 'text-[#4CAF50]' : 'text-[#C62828]')
                  }
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {couponResult.valid
                    ? `Rabat: -${formatPrice(couponResult.discountAmountCents ?? 0, currency)}`
                    : (couponResult.error ?? 'Kod nie jest prawidlowy')}
                </p>
              )}
            </Card>

            <Card>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={cart.invoiceRequired}
                  onChange={(e) => cart.setInvoiceRequired(e.target.checked)}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Chce otrzymac fakture VAT
                </span>
              </label>
              {cart.invoiceRequired && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <Field
                    label="Nazwa firmy"
                    value={cart.invoiceData?.companyName ?? ''}
                    onChange={(v) =>
                      cart.setInvoiceData({
                        ...cart.invoiceData,
                        companyName: v,
                      })
                    }
                  />
                  <Field
                    label="NIP"
                    value={cart.invoiceData?.taxId ?? ''}
                    onChange={(v) =>
                      cart.setInvoiceData({
                        ...cart.invoiceData,
                        taxId: v,
                      })
                    }
                  />
                  <Field
                    label="Adres"
                    value={cart.invoiceData?.address ?? ''}
                    onChange={(v) =>
                      cart.setInvoiceData({
                        ...cart.invoiceData,
                        address: v,
                      })
                    }
                  />
                  <Field
                    label="Miasto"
                    value={cart.invoiceData?.city ?? ''}
                    onChange={(v) =>
                      cart.setInvoiceData({
                        ...cart.invoiceData,
                        city: v,
                      })
                    }
                  />
                  <Field
                    label="Kod pocztowy"
                    value={cart.invoiceData?.postalCode ?? ''}
                    onChange={(v) =>
                      cart.setInvoiceData({
                        ...cart.invoiceData,
                        postalCode: v,
                      })
                    }
                  />
                </div>
              )}
            </Card>
          </div>

          {/* ----- Right column: order summary + pay button ----- */}
          <aside className="lg:sticky lg:top-24 self-start">
            <Card>
              <CardTitle>Twoje zamowienie</CardTitle>
              <p
                className="text-base font-bold"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {cart.service.name}
              </p>
              <p
                className="text-xs text-[#8A8A8A] mt-1 mb-4"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {cart.service.sessionCount > 1
                  ? `${cart.service.sessionCount} sesji`
                  : '1 sesja'}{' '}
                × {cart.service.durationMinutes} min
              </p>

              <ul
                className="flex flex-col gap-1 mb-4 text-xs text-[#2D2D2D]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {cart.slots.map((s) => (
                  <li key={s.startTime} className="flex items-center gap-1.5">
                    <Check size={12} className="text-[#4CAF50]" />{' '}
                    {formatDateTime(s.startTime)}
                  </li>
                ))}
              </ul>

              <div
                className="border-t border-[#F0EDE8] pt-3 text-sm"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                <Row label="Suma">{formatPrice(subtotal, currency)}</Row>
                {discount > 0 && (
                  <Row label="Rabat">
                    <span className="text-[#4CAF50]">
                      -{formatPrice(discount, currency)}
                    </span>
                  </Row>
                )}
                <Row bold label="Do zaplaty">
                  <span className="text-lg text-[#B8944A]">
                    {formatPrice(total, currency)}
                  </span>
                </Row>
              </div>

              {stripeConfig?.mockMode && (
                <p
                  className="text-[11px] text-[#8A8A8A] mt-3 px-3 py-2 rounded bg-[#FFF8E1] border border-[#E8C469]"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Tryb testowy — kliknij „Zaplac”, aby potwierdzic platnosc bez
                  prawdziwej transakcji.
                </p>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={submitting}
                className="mt-5 w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background:
                    'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
                  fontFamily: "'Lato', sans-serif",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />{' '}
                    Przetwarzanie…
                  </>
                ) : (
                  <>
                    <CreditCard size={16} /> Zaplac{' '}
                    {formatPrice(total, currency)}
                  </>
                )}
              </button>

              {error && (
                <p
                  className="text-xs text-[#C62828] mt-3"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  {error}
                </p>
              )}
            </Card>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 border border-[#E8E4DF] bg-white">
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg font-bold mb-4"
      style={{ fontFamily: "'Cormorant Garamond', serif" }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span
        className="block text-xs font-semibold uppercase tracking-wider text-[#8A8A8A] mb-1"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-[#E8E4DF] px-3 py-2 text-sm focus:border-[#B8944A] focus:outline-none"
        style={{ fontFamily: "'Lato', sans-serif" }}
      />
    </label>
  );
}

function Row({
  label,
  bold,
  children,
}: {
  label: string;
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        'flex justify-between py-1 ' +
        (bold ? 'font-bold pt-3 border-t border-[#F0EDE8] mt-2' : '')
      }
    >
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}
