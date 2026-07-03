import { api } from '@/clients/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string | null;
  flag: string | null;
  sortOrder: number | null;
  isActive: boolean | null;
  createdAt: string | null;
}

export interface CreateLanguageData {
  code: string;
  name: string;
  nativeName?: string | null;
  flag?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateLanguageData = Partial<CreateLanguageData>;

interface ListResponse {
  success: boolean;
  data: Language[];
}

interface ItemResponse {
  success: boolean;
  data: Language;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export const languagesClient = {
  getAll(): Promise<Language[]> {
    return api.get<ListResponse>('/languages').then((r) => r.data);
  },

  create(data: CreateLanguageData): Promise<Language> {
    return api.post<ItemResponse>('/languages', data).then((r) => r.data);
  },

  update(id: string, data: UpdateLanguageData): Promise<Language> {
    return api.put<ItemResponse>(`/languages/${id}`, data).then((r) => r.data);
  },

  archive(id: string): Promise<Language> {
    return api
      .patch<ItemResponse>(`/languages/${id}/archive`)
      .then((r) => r.data);
  },

  restore(id: string): Promise<Language> {
    return api
      .patch<ItemResponse>(`/languages/${id}/restore`)
      .then((r) => r.data);
  },
};
