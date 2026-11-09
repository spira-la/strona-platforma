import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft } from 'lucide-react';
import { SEO } from '@/components/shared/SEO';
import { MultiSessionPicker } from '@/components/booking/MultiSessionPicker';
import { servicesClient, type Service } from '@/clients/services.client';
import { useCartStore } from '@/stores/cart.store';

function formatPrice(priceCents: number, currency: string): string {
  const amount = priceCents / 100;
  try {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

/**
 * /rezerwacja[?service=<id>]
 *
 * Step 1 — user picks a service (single session or package).
 * Step 2 — user picks the N time slots the service requires.
 * Once all slots are chosen, cart is populated and user is sent to checkout.
 */
export default function BookingFlow() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const preselectedId = params.get('service');
  const setService = useCartStore((s) => s.setService);
  const cartService = useCartStore((s) => s.service);
  const cartSlots = useCartStore((s) => s.slots);
  const setSlots = useCartStore((s) => s.setSlots);

  const { data: services, isLoading } = useQuery({
    queryKey: ['services', 'active'],
    queryFn: () => servicesClient.getAll(),
  });

  const activeServices = (services ?? []).filter((s) => s.isActive);

  const [selectedId, setSelectedId] = useState<string | null>(
    preselectedId ?? cartService?.id ?? null,
  );

  useEffect(() => {
    if (preselectedId && preselectedId !== selectedId) {
      setSelectedId(preselectedId);
    }
  }, [preselectedId, selectedId]);

  const selectedService =
    activeServices.find((s) => s.id === selectedId) ?? null;

  function handlePick(service: Service) {
    setSelectedId(service.id);
    setParams({ service: service.id });
    // If user swaps services, reset cart slots
    if (cartService?.id !== service.id) {
      setService({
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        sessionCount: service.sessionCount ?? 1,
        priceCents: service.priceCents,
        currency: service.currency ?? 'PLN',
        coachId: service.coachId ?? '',
      });
    }
  }

  function handleConfirm() {
    if (!selectedService) return;
    // Commit the chosen slots into the cart
    setService({
      id: selectedService.id,
      name: selectedService.name,
      durationMinutes: selectedService.durationMinutes,
      sessionCount: selectedService.sessionCount ?? 1,
      priceCents: selectedService.priceCents,
      currency: selectedService.currency ?? 'PLN',
      coachId: selectedService.coachId ?? '',
    });
    setSlots(cartSlots);
    navigate('/checkout');
  }

  return (
    <main className="min-h-screen bg-surface text-ink pb-24">
      <SEO
        title="Rezerwacja"
        description="Wybierz usluge i zarezerwuj termin sesji."
        canonical="/rezerwacja"
      />

      <section className="px-6 pt-10 pb-6">
        <div className="max-w-[1024px] mx-auto flex flex-col gap-6">
          <button
            type="button"
            onClick={() => navigate('/uslugi')}
            className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand w-fit"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <ChevronLeft size={14} /> Wroc do uslug
          </button>

          <h1
            className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-ink"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            REZERWACJA
          </h1>

          <Stepper step={selectedService ? 2 : 1} />
        </div>
      </section>

      <section className="px-6">
        <div className="max-w-[1024px] mx-auto">
          {isLoading && (
            <p
              className="text-sm text-ink-muted"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Ladowanie uslug…
            </p>
          )}

          {!isLoading && !selectedService && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeServices.map((service) => (
                <ServicePickCard
                  key={service.id}
                  service={service}
                  onPick={() => handlePick(service)}
                />
              ))}
              {activeServices.length === 0 && (
                <p
                  className="text-sm text-ink-muted"
                  style={{ fontFamily: "'Lato', sans-serif" }}
                >
                  Brak aktywnych uslug.
                </p>
              )}
            </div>
          )}

          {selectedService && (
            <div className="flex flex-col gap-6">
              <SelectedServiceSummary
                service={selectedService}
                onChange={() => {
                  setSelectedId(null);
                  setParams({});
                  setSlots([]);
                }}
              />

              {!selectedService.coachId && (
                <div className="rounded-lg border border-[#E8C469] bg-[#FFF8E1] p-4 text-sm text-[#6B5A1F]">
                  Ta usluga nie ma przypisanego coacha — skontaktuj sie z
                  administracja, zanim wykonasz rezerwacje.
                </div>
              )}

              {selectedService.coachId && (
                <MultiSessionPicker
                  coachId={selectedService.coachId}
                  sessionCount={selectedService.sessionCount ?? 1}
                  durationMinutes={selectedService.durationMinutes}
                  selected={cartSlots}
                  onChange={(slots) => setSlots(slots)}
                  onConfirm={handleConfirm}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  return (
    <ol
      className="flex items-center gap-3 text-xs uppercase tracking-wider"
      style={{ fontFamily: "'Lato', sans-serif" }}
    >
      <StepItem active={step >= 1} done={step > 1} label="Usluga" num={1} />
      <span className="w-6 h-px bg-line" />
      <StepItem active={step >= 2} done={false} label="Terminy" num={2} />
      <span className="w-6 h-px bg-line" />
      <StepItem active={false} done={false} label="Platnosc" num={3} />
    </ol>
  );
}

function StepItem({
  active,
  done,
  label,
  num,
}: {
  active: boolean;
  done: boolean;
  label: string;
  num: number;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={
          'flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ' +
          (done
            ? 'bg-[#4CAF50] text-white'
            : active
              ? 'bg-action text-white'
              : 'bg-line text-ink-muted')
        }
      >
        {done ? <Check size={12} /> : num}
      </span>
      <span
        className={active ? 'text-ink font-semibold' : 'text-ink-muted'}
      >
        {label}
      </span>
    </li>
  );
}

function ServicePickCard({
  service,
  onPick,
}: {
  service: Service;
  onPick: () => void;
}) {
  const count = service.sessionCount ?? 1;
  return (
    <button
      type="button"
      onClick={onPick}
      className="text-left rounded-2xl p-6 border border-line bg-white hover:border-brand hover:shadow-[0_4px_24px_color-mix(in_srgb,var(--color-brand)_12%,transparent)] transition-all"
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest text-brand mb-2"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        {count > 1 ? `Pakiet ${count} sesji` : 'Sesja indywidualna'}
      </p>
      <h3
        className="text-2xl font-black uppercase tracking-tight text-ink mb-3"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {service.name}
      </h3>
      {service.description && (
        <p
          className="text-sm leading-relaxed text-ink-soft mb-4"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {service.description}
        </p>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-line-soft">
        <div
          className="text-[13px] text-ink-muted"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {service.durationMinutes} min / sesja
        </div>
        <div
          className="text-lg font-bold text-brand"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {formatPrice(service.priceCents, service.currency)}
        </div>
      </div>
    </button>
  );
}

function SelectedServiceSummary({
  service,
  onChange,
}: {
  service: Service;
  onChange: () => void;
}) {
  const count = service.sessionCount ?? 1;
  return (
    <div className="rounded-2xl p-5 border border-brand bg-white shadow-[0_2px_12px_color-mix(in_srgb,var(--color-brand)_8%,transparent)] flex items-center justify-between gap-4">
      <div>
        <p
          className="text-[11px] font-semibold uppercase tracking-widest text-brand mb-1"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          Wybrana usluga
        </p>
        <h3
          className="text-lg font-black uppercase tracking-tight text-ink"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {service.name}
        </h3>
        <p
          className="text-xs text-ink-soft mt-1"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          {count > 1 ? `${count} sesji × ` : ''}
          {service.durationMinutes} min &middot;{' '}
          <span className="font-semibold text-brand">
            {formatPrice(service.priceCents, service.currency)}
          </span>
        </p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="text-xs font-semibold uppercase tracking-wider text-ink-soft hover:text-brand"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        Zmien
      </button>
    </div>
  );
}
