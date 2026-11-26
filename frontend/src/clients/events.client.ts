import { api } from '@/clients/api';
import { supabase } from '@/config/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Event as shown on /wydarzenia (published, upcoming). */
export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  priceLabel: string | null;
  imageUrl: string | null;
  capacity: number | null;
  /** null when there is no capacity limit. */
  spotsLeft: number | null;
  registrationOpen: boolean;
}

/** Event as managed in the admin panel. */
export interface AdminEvent {
  id: string;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  priceLabel: string | null;
  capacity: number | null;
  imageUrl: string | null;
  isPublished: boolean;
  registrationOpen: boolean;
  registrationsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventPayload {
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  isOnline: boolean;
  priceLabel: string | null;
  capacity: number | null;
  imageUrl: string | null;
  isPublished: boolean;
  registrationOpen: boolean;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string | null;
  createdAt: string;
}

export interface RegistrationPayload {
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
}

/** Stable error codes the backend returns for a failed sign-up. */
export type RegistrationErrorCode =
  | 'EVENT_NOT_FOUND'
  | 'REGISTRATION_CLOSED'
  | 'EVENT_FULL'
  | 'ALREADY_REGISTERED';

interface Envelope<T> {
  success: boolean;
  data: T;
}

// ---------------------------------------------------------------------------
// Upload helper (multipart — api.ts only sends JSON)
// ---------------------------------------------------------------------------

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

async function uploadImage(file: File): Promise<string> {
  const headers: Record<string, string> = {};
  if (supabase) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/admin/events/upload-image`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  const body = (await res.json()) as { url: string };
  return body.url;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const eventsClient = {
  // Public
  getUpcoming(): Promise<PublicEvent[]> {
    return api.get<Envelope<PublicEvent[]>>('/events').then((r) => r.data);
  },

  register(eventId: string, payload: RegistrationPayload): Promise<void> {
    return api
      .post<
        Envelope<{ id: string }>
      >(`/events/${eventId}/registrations`, payload)
      .then(() => undefined);
  },

  // Admin
  getAllAdmin(): Promise<AdminEvent[]> {
    return api.get<Envelope<AdminEvent[]>>('/admin/events').then((r) => r.data);
  },

  create(payload: EventPayload): Promise<AdminEvent> {
    return api
      .post<Envelope<AdminEvent>>('/admin/events', payload)
      .then((r) => r.data);
  },

  update(id: string, payload: Partial<EventPayload>): Promise<AdminEvent> {
    return api
      .patch<Envelope<AdminEvent>>(`/admin/events/${id}`, payload)
      .then((r) => r.data);
  },

  remove(id: string): Promise<void> {
    return api
      .delete<Envelope<null>>(`/admin/events/${id}`)
      .then(() => undefined);
  },

  getRegistrations(eventId: string): Promise<EventRegistration[]> {
    return api
      .get<
        Envelope<EventRegistration[]>
      >(`/admin/events/${eventId}/registrations`)
      .then((r) => r.data);
  },

  removeRegistration(id: string): Promise<void> {
    return api
      .delete<Envelope<null>>(`/admin/events/registrations/${id}`)
      .then(() => undefined);
  },

  uploadImage,
};
