import { api } from '@/clients/api';

export interface Booking {
  id: string;
  orderId: string | null;
  coachId: string;
  userId: string;
  serviceId: string | null;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show' | null;
  meetingLink: string | null;
  livekitRoomName: string | null;
  notes: string | null;
  rescheduledAt: string | null;
  rescheduledFrom: string | null;
  rescheduleReason: string | null;
  rescheduleCount: number | null;
  cancellationReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CanRescheduleResponse {
  canReschedule: boolean;
  reason?: string;
  minCancellationNoticeMinutes?: number;
  minutesUntilSession?: number;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const bookingsClient = {
  getByUser(userId: string): Promise<Booking[]> {
    return api
      .get<Envelope<Booking[]>>(`/bookings/by-user/${userId}`)
      .then((r) => r.data);
  },

  getByCoach(coachId: string): Promise<Booking[]> {
    return api
      .get<Envelope<Booking[]>>(`/bookings/by-coach/${coachId}`)
      .then((r) => r.data);
  },

  getByOrder(orderId: string): Promise<Booking[]> {
    return api
      .get<Envelope<Booking[]>>(`/bookings/by-order/${orderId}`)
      .then((r) => r.data);
  },

  getById(id: string): Promise<Booking> {
    return api.get<Envelope<Booking>>(`/bookings/${id}`).then((r) => r.data);
  },

  canReschedule(id: string): Promise<CanRescheduleResponse> {
    return api
      .get<Envelope<CanRescheduleResponse>>(`/bookings/${id}/can-reschedule`)
      .then((r) => r.data);
  },

  reschedule(
    id: string,
    payload: {
      newStartTime: string;
      newEndTime: string;
      reason?: string;
      userId?: string;
    },
  ): Promise<Booking> {
    return api
      .patch<Envelope<Booking>>(`/bookings/${id}/reschedule`, payload)
      .then((r) => r.data);
  },

  cancel(id: string, reason?: string): Promise<Booking> {
    const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return api
      .patch<Envelope<Booking>>(`/bookings/${id}/cancel${qs}`)
      .then((r) => r.data);
  },
};
