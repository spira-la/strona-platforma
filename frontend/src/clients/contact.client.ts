import { api } from '@/clients/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  isRead: boolean | null;
  createdAt: string | null;
}

interface ListResponse {
  success: boolean;
  data: ContactMessage[];
}

export interface ContactSubmitPayload {
  fullName: string;
  email: string;
  phone?: string;
  subject: 'coaching' | 'terapia' | 'strona' | 'wspolpraca' | 'inne';
  message: string;
}

export interface ContactSubmitResponse {
  success: true;
  data: { id: string };
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const contactClient = {
  getAll(): Promise<ContactMessage[]> {
    return api.get<ListResponse>('/contact').then((r) => r.data);
  },

  submit(payload: ContactSubmitPayload): Promise<ContactSubmitResponse> {
    return api.post<ContactSubmitResponse>('/contact-messages', payload);
  },

  markAsRead(id: string): Promise<void> {
    return api.patch<void>(`/contact/${id}/read`);
  },

  markAsUnread(id: string): Promise<void> {
    return api.patch<void>(`/contact/${id}/unread`);
  },

  remove(id: string): Promise<void> {
    return api.delete<void>(`/contact/${id}`);
  },
};
