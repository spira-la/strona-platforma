import { api } from '@/clients/api';

export interface SlotHold {
  id: string;
  coachId: string;
  userId: string | null;
  startTime: string;
  endTime: string;
  expiresAt: string;
  orderId: string | null;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const slotHoldsClient = {
  create(payload: {
    coachId: string;
    userId?: string | null;
    startTime: string;
    endTime: string;
  }): Promise<SlotHold> {
    return api
      .post<Envelope<SlotHold>>('/slot-holds', payload)
      .then((r) => r.data);
  },

  release(id: string): Promise<void> {
    return api.delete<void>(`/slot-holds/${id}`);
  },
};
