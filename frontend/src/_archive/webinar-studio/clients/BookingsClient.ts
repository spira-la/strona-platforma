/**
 * BWM-compat re-export for the meeting kit.
 *
 * The migrated meeting/ components import `bookingsClient` and the `Booking`
 * type from `@/clients/BookingsClient`. Spirala's actual implementation
 * lives in `bookings.client.ts`; this file is a thin adapter that lets the
 * ported code resolve without rewriting every import.
 *
 * Field shape note: BWM's Booking had `scheduledAt`, `duration`, `userId`,
 * `coachId`, `communicationMethod`. Spirala stores the same data as
 * `startTime/endTime` on a different shape. We expose a `Booking` type that
 * matches BWM and a wrapper `bookingsClient` that maps the new entity
 * fields into the BWM shape on the fly.
 */

import {
  bookingsClient as nativeBookingsClient,
  type Booking as NativeBooking,
} from './bookings.client';

export interface Booking {
  id: string;
  userId: string;
  coachId: string;
  scheduledAt: string;
  duration: number;
  status: NativeBooking['status'];
  communicationMethod: 'livekit';
  meetingLink: string | null;
  livekitRoomName: string | null;
  notes: string | null;
  rescheduledFrom?: string | null;
  rescheduledAt?: string | null;
  /** Filled by JOIN to coaching_services when the booking endpoint returns it */
  serviceName?: string | null;
  /** Filled by JOIN to profiles via coach.userId when available */
  coachName?: string | null;
}

function toBwmShape(b: NativeBooking): Booking {
  const start = new Date(b.startTime).getTime();
  const end = new Date(b.endTime).getTime();
  const durationMin = Math.max(1, Math.round((end - start) / 60_000));
  return {
    id: b.id,
    userId: b.userId,
    coachId: b.coachId,
    scheduledAt: b.startTime,
    duration: durationMin,
    status: b.status,
    communicationMethod: 'livekit',
    meetingLink: b.meetingLink,
    livekitRoomName: b.livekitRoomName,
    notes: b.notes,
    rescheduledFrom: b.rescheduledFrom,
    rescheduledAt: b.rescheduledAt,
  };
}

export const bookingsClient = {
  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const b = await nativeBookingsClient.getById(id);
      return toBwmShape(b);
    } catch {
      return null;
    }
  },
};
