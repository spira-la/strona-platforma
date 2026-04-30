import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Cart holds a single coaching purchase at a time:
 *  - a chosen service (session or package)
 *  - the exact time slots the user selected for that service (1 for a single
 *    session, N for a package of N sessions)
 *  - optional coupon and invoice data gathered at checkout
 *
 * Spirala's sales funnel is linear (one service per purchase) so there is no
 * need for a multi-line cart. If ever needed, lines can be added later.
 */

export interface CartSlot {
  startTime: string; // ISO
  endTime: string; // ISO
  holdId?: string; // set once backend returns a hold
}

export interface CartService {
  id: string;
  name: string;
  durationMinutes: number;
  sessionCount: number;
  priceCents: number;
  currency: string;
  coachId: string;
}

export interface InvoiceData {
  companyName?: string;
  taxId?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface CartState {
  service: CartService | null;
  slots: CartSlot[];
  couponCode: string | null;
  invoiceRequired: boolean;
  invoiceData: InvoiceData | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  notes: string;

  setService: (service: CartService | null) => void;
  setSlots: (slots: CartSlot[]) => void;
  addSlot: (slot: CartSlot) => void;
  removeSlot: (startTime: string) => void;
  attachHold: (startTime: string, holdId: string) => void;
  setCoupon: (code: string | null) => void;
  setInvoiceRequired: (required: boolean) => void;
  setInvoiceData: (data: InvoiceData | null) => void;
  setCustomer: (partial: {
    email?: string;
    name?: string;
    phone?: string;
  }) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
}

const emptyState: Pick<
  CartState,
  | 'service'
  | 'slots'
  | 'couponCode'
  | 'invoiceRequired'
  | 'invoiceData'
  | 'customerEmail'
  | 'customerName'
  | 'customerPhone'
  | 'notes'
> = {
  service: null,
  slots: [],
  couponCode: null,
  invoiceRequired: false,
  invoiceData: null,
  customerEmail: '',
  customerName: '',
  customerPhone: '',
  notes: '',
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      ...emptyState,

      setService: (service) =>
        set(() => ({
          service,
          // switching services invalidates previous slot selections
          slots: [],
        })),

      setSlots: (slots) => set(() => ({ slots })),

      addSlot: (slot) =>
        set((state) => {
          if (state.slots.some((s) => s.startTime === slot.startTime)) {
            return state;
          }
          const required = state.service?.sessionCount ?? 1;
          if (state.slots.length >= required) {
            return state;
          }
          return { slots: [...state.slots, slot] };
        }),

      removeSlot: (startTime) =>
        set((state) => ({
          slots: state.slots.filter((s) => s.startTime !== startTime),
        })),

      attachHold: (startTime, holdId) =>
        set((state) => ({
          slots: state.slots.map((s) =>
            s.startTime === startTime ? { ...s, holdId } : s,
          ),
        })),

      setCoupon: (code) => set(() => ({ couponCode: code })),
      setInvoiceRequired: (required) =>
        set(() => ({ invoiceRequired: required })),
      setInvoiceData: (data) => set(() => ({ invoiceData: data })),
      setCustomer: (partial) =>
        set((state) => ({
          customerEmail: partial.email ?? state.customerEmail,
          customerName: partial.name ?? state.customerName,
          customerPhone: partial.phone ?? state.customerPhone,
        })),
      setNotes: (notes) => set(() => ({ notes })),

      clear: () => set(() => ({ ...emptyState })),
    }),
    {
      name: 'spirala-cart',
      version: 1,
    },
  ),
);

// Convenience selectors
export const selectIsCartReady = (s: CartState): boolean =>
  !!s.service && s.slots.length === (s.service?.sessionCount ?? 1);

export const selectSubtotalCents = (s: CartState): number =>
  s.service?.priceCents ?? 0;
