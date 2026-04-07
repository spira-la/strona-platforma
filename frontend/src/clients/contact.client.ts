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

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const contactClient = {
  getAll(): Promise<ContactMessage[]> {
    return api.get<ListResponse>('/contact').then((r) => r.data);
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
