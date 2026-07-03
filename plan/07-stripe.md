# Stripe - Nueva Cuenta

## Setup

1. **Nueva cuenta Stripe** para Spirala
2. Dashboard separado de BeWonderMe
3. Webhooks apuntando al nuevo backend

## Productos a crear

| Producto | Tipo | Precio |
|----------|------|--------|
| Sesja 1 na 1 | one_time | Definir (del diseño: "50 zł - sesja") |
| Pakiet 8 Sesji | one_time | Definir (del diseño: "350 zł - pakiet") |

## Configuración

- **Moneda principal**: PLN
- **Tax**: Stripe Tax habilitado para Poland (EU)
- **Métodos de pago**: Card + BLIK (mercado polaco)
- **Stripe Connect**: Configurado pero inactivo (feature flag off)
- **Webhooks**: `payment_intent.succeeded`, `charge.refunded`

## Variables de entorno (nueva cuenta)

```
STRIPE_SECRET_KEY=sk_live_...        # Nueva cuenta
STRIPE_PUBLIC_KEY=pk_live_...        # Nueva cuenta
STRIPE_WEBHOOK_SECRET=whsec_...      # Nuevo webhook
```

## Lo que se mantiene del código existente

- PaymentIntentClient (frontend)
- StripePaymentService (backend)
- Webhook handler
- Tax calculation logic
- Invoice generation post-payment

Solo cambian las keys y los product/price IDs.

## Lo que se desactiva (feature flags)

- Stripe Connect (payouts a coaches) → flag `stripeConnect`
- Multi-currency → flag `multiCurrency`
- Gift card payments → flag `giftPurchases`
