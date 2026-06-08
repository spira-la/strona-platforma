import { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';

interface Props {
  totalLabel: string;
  returnUrl: string;
  onError: (msg: string) => void;
}

export function StripePaymentForm({ totalLabel, returnUrl, onError }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    // confirmPayment only reaches here on error (otherwise redirects)
    if (error) {
      onError(error.message ?? 'Blad platnosci');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement
        options={{
          layout: 'tabs',
          paymentMethodOrder: ['blik', 'card', 'p24'],
        }}
      />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-2 w-full py-3 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #B8944A 0%, #D4B97A 100%)',
          fontFamily: "'Lato', sans-serif",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Przetwarzanie…
          </>
        ) : (
          <>
            <CreditCard size={16} /> Zaplac {totalLabel}
          </>
        )}
      </button>
    </form>
  );
}
