import { api } from '@/clients/api';

export interface AvailableSlot {
  startTime: string; // ISO
  endTime: string; // ISO
  available: boolean;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const availabilityClient = {
  getSlots(params: {
    coachId: string;
    date: string; // YYYY-MM-DD
    durationMinutes?: number;
  }): Promise<AvailableSlot[]> {
    const qs = new URLSearchParams({
      coachId: params.coachId,
      date: params.date,
      durationMinutes: String(params.durationMinutes ?? 60),
    });
    return api
      .get<Envelope<AvailableSlot[]>>(`/availability/slots?${qs.toString()}`)
      .then((r) => r.data);
  },
};
