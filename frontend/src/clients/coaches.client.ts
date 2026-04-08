import { api } from '@/clients/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Coach {
  id: string;
  userId: string | null;
  fullName: string;
  email: string;
  bio: string | null;
  expertise: string[] | null;
  languages: string[] | null;
  location: string | null;
  timezone: string;
  acceptingClients: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCoachData {
  userId: string;
  bio?: string;
  timezone?: string;
}

export type UpdateCoachData = Partial<
  Omit<Coach, 'id' | 'userId' | 'fullName' | 'email' | 'createdAt'>
>;

interface ListResponse {
  success: boolean;
  data: Coach[];
}

interface ItemResponse {
  success: boolean;
  data: Coach;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const coachesClient = {
  getAll(): Promise<Coach[]> {
    return api.get<ListResponse>('/coaches').then((r) => r.data);
  },

  create(data: CreateCoachData): Promise<Coach> {
    return api.post<ItemResponse>('/coaches', data).then((r) => r.data);
  },

  update(id: string, data: UpdateCoachData): Promise<Coach> {
    return api.put<ItemResponse>(`/coaches/${id}`, data).then((r) => r.data);
  },

  archive(id: string): Promise<Coach> {
    return api.patch<ItemResponse>(`/coaches/${id}/archive`).then((r) => r.data);
  },

  restore(id: string): Promise<Coach> {
    return api.patch<ItemResponse>(`/coaches/${id}/restore`).then((r) => r.data);
  },
};
