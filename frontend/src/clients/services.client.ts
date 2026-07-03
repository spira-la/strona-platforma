import { api } from '@/clients/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Service {
  id: string;
  coachId: string | null;
  name: string;
  description: string | null;
  durationMinutes: number;
  sessionCount: number;
  priceCents: number;
  currency: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceData {
  name: string;
  description?: string | null;
  durationMinutes: number;
  sessionCount?: number;
  priceCents: number;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateServiceData = Partial<CreateServiceData>;

interface ListResponse {
  success: boolean;
  data: Service[];
}

interface ItemResponse {
  success: boolean;
  data: Service;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const servicesClient = {
  getAll(): Promise<Service[]> {
    return api.get<ListResponse>('/services').then((r) => r.data);
  },

  create(data: CreateServiceData): Promise<Service> {
    return api.post<ItemResponse>('/services', data).then((r) => r.data);
  },

  update(id: string, data: UpdateServiceData): Promise<Service> {
    return api.put<ItemResponse>(`/services/${id}`, data).then((r) => r.data);
  },

  archive(id: string): Promise<Service> {
    return api
      .patch<ItemResponse>(`/services/${id}/archive`)
      .then((r) => r.data);
  },

  restore(id: string): Promise<Service> {
    return api
      .patch<ItemResponse>(`/services/${id}/restore`)
      .then((r) => r.data);
  },
};
